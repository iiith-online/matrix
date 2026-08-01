/// <reference lib="WebWorker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
  title: string;
  body: string;
  clickUrl: string;
  tag: string;
  unread?: number;
  priority: 'high' | 'low';
  show: boolean;
};

type BadgeNavigator = WorkerNavigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

type SessionInfo = {
  accessToken: string;
  baseUrl: string;
};

const SHELL_CACHE = 'matrix-shell-v1';

/**
 * Store session per client (tab)
 */
const sessions = new Map<string, SessionInfo>();

const clientToResolve = new Map<string, (value: SessionInfo | undefined) => void>();
const clientToSessionPromise = new Map<string, Promise<SessionInfo | undefined>>();

async function cleanupDeadClients() {
  const activeClients = await self.clients.matchAll();
  const activeIds = new Set(activeClients.map((c) => c.id));

  Array.from(sessions.keys()).forEach((id) => {
    if (!activeIds.has(id)) {
      sessions.delete(id);
      clientToResolve.delete(id);
      clientToSessionPromise.delete(id);
    }
  });
}

function setSession(clientId: string, accessToken: unknown, baseUrl: unknown) {
  if (typeof accessToken === 'string' && typeof baseUrl === 'string') {
    sessions.set(clientId, { accessToken, baseUrl });
  } else {
    // Logout or invalid session
    sessions.delete(clientId);
  }

  const resolveSession = clientToResolve.get(clientId);
  if (resolveSession) {
    resolveSession(sessions.get(clientId));
    clientToResolve.delete(clientId);
    clientToSessionPromise.delete(clientId);
  }
}

function requestSession(client: Client): Promise<SessionInfo | undefined> {
  const promise =
    clientToSessionPromise.get(client.id) ??
    new Promise((resolve) => {
      clientToResolve.set(client.id, resolve);
      client.postMessage({ type: 'requestSession' });
    });

  if (!clientToSessionPromise.has(client.id)) {
    clientToSessionPromise.set(client.id, promise);
  }

  return promise;
}

async function requestSessionWithTimeout(
  clientId: string,
  timeoutMs = 3000
): Promise<SessionInfo | undefined> {
  const client = await self.clients.get(clientId);
  if (!client) return undefined;

  const sessionPromise = requestSession(client);

  const timeout = new Promise<undefined>((resolve) => {
    setTimeout(() => resolve(undefined), timeoutMs);
  });

  return Promise.race([sessionPromise, timeout]);
}

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(self.registration.scope, { cache: 'reload' })))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await cleanupDeadClients();
    })()
  );
});

async function updateBadge(unread?: number) {
  if (unread === undefined) return;
  const badgeNavigator = self.navigator as BadgeNavigator;
  if (unread === 0) {
    await badgeNavigator.clearAppBadge?.();
  } else {
    await badgeNavigator.setAppBadge?.(unread);
  }
}

function safeClickUrl(value: string): string {
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin ? url.href : self.registration.scope;
  } catch {
    return self.registration.scope;
  }
}

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(
    (async () => {
      let payload: PushPayload;
      try {
        payload = event.data?.json() as PushPayload;
      } catch {
        return;
      }

      await updateBadge(payload.unread);
      const clients = (await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })) as WindowClient[];
      if (!payload.show || clients.some((client) => client.visibilityState === 'visible')) return;

      const icon = new URL('pwa/icon-192.png', self.registration.scope).href;
      await self.registration.showNotification(payload.title || 'Matrix-IIIT', {
        body: payload.body,
        icon,
        badge: icon,
        tag: payload.tag,
        data: { clickUrl: safeClickUrl(payload.clickUrl) },
      });
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event: ExtendableEvent) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'pushSubscriptionChanged' }));
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clickUrl = safeClickUrl(event.notification.data?.clickUrl);
      const clients = (await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })) as WindowClient[];
      const client = clients.find((candidate) => candidate.visibilityState === 'visible') ?? clients[0];
      if (client) {
        try {
          await client.navigate(clickUrl);
          await client.focus();
          return;
        } catch {
          // Fall through to opening a fresh app window when the existing client is stale.
        }
      }
      await self.clients.openWindow(clickUrl);
    })()
  );
});

/**
 * Receive session updates from clients
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const client = event.source as Client | null;
  if (!client) return;

  const { type, accessToken, baseUrl } = event.data || {};

  if (type === 'setSession') {
    setSession(client.id, accessToken, baseUrl);
    cleanupDeadClients();
  }
});

const MEDIA_PATHS = ['/_matrix/client/v1/media/', '/_matrix/media/'];

function isShellRequest(request: Request): boolean {
  // Media must never enter the app-shell cache, including direct navigations.
  if (mediaPath(request.url)) return false;
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  return (
    url.origin === scope.origin &&
    url.pathname.startsWith(scope.pathname) &&
    (url.pathname.includes('/assets/') || /\.(?:css|js|woff2?|png|svg|ico)$/.test(url.pathname))
  );
}

function mediaPath(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return MEDIA_PATHS.some((p) => pathname.startsWith(p));
  } catch {
    return false;
  }
}

function validMediaRequest(url: string, baseUrl: string): boolean {
  return MEDIA_PATHS.some((p) => {
    const validUrl = new URL(p, baseUrl);
    return url.startsWith(validUrl.href);
  });
}

function fetchConfig(token: string): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  };
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const { url, method } = event.request;

  if (method !== 'GET') return;

  if (isShellRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, responseCopy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match(event.request)) ?? (await cache.match(self.registration.scope)) ?? Response.error();
        })
    );
    return;
  }

  if (!mediaPath(url)) return;

  const { clientId } = event;
  if (!clientId) return;

  const session = sessions.get(clientId);
  if (session) {
    if (validMediaRequest(url, session.baseUrl)) {
      event.respondWith(fetch(url, fetchConfig(session.accessToken)));
    }
    return;
  }

  event.respondWith(
    requestSessionWithTimeout(clientId).then((s) => {
      if (s && validMediaRequest(url, s.baseUrl)) {
        return fetch(url, fetchConfig(s.accessToken));
      }
      return fetch(event.request, { cache: 'no-store' });
    })
  );
});
