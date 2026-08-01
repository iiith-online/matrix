import { createHash, randomBytes } from 'node:crypto';
import webpush from 'web-push';

const SUBSCRIPTION_TTL = 180 * 24 * 60 * 60;
const DEDUPE_TTL = 24 * 60 * 60;
const RATE_LIMIT_TTL = 60;
const APP_ID = process.env.PUSH_APP_ID || 'org.iiit.matrix.web';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const subscriptionKey = (pushKey) => `push:subscription:${pushKey}`;
const managementKey = (token) => `push:management:${sha256(token)}`;

const redis = async (command) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new HttpError(503, 'Push storage is not configured.');

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new HttpError(502, 'Push storage failed.');

  const result = await response.json();
  if (result.error) throw new HttpError(502, 'Push storage failed.');
  return result.result;
};

const parseBody = (req, maxBytes = 16_384) => {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  if (Buffer.byteLength(JSON.stringify(body)) > maxBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }
  return body;
};

const requestOrigin = (req) => {
  if (process.env.PUSH_PUBLIC_ORIGIN) return process.env.PUSH_PUBLIC_ORIGIN.replace(/\/$/, '');
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) throw new HttpError(400, 'Missing host.');
  return `${protocol}://${host}`;
};

const rateLimit = async (req, bucket, limit) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const identity = forwarded || req.socket?.remoteAddress || 'unknown';
  const key = `push:rate:${bucket}:${sha256(identity)}`;
  const count = Number(await redis(['INCR', key]));
  if (count === 1) await redis(['EXPIRE', key, RATE_LIMIT_TTL]);
  if (count > limit) throw new HttpError(429, 'Too many requests. Try again later.');
};

export const requireSameOrigin = (req) => {
  const origin = req.headers.origin;
  const allowed = new Set(
    (process.env.PUSH_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  allowed.add(requestOrigin(req));
  if (!origin || !allowed.has(origin)) throw new HttpError(403, 'Origin is not allowed.');
  return origin;
};

const bearerToken = (req) => {
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(req.headers.authorization || '');
  if (!match) throw new HttpError(401, 'Missing management token.');
  return match[1];
};

const validateSubscription = (value) => {
  const endpoint = value?.endpoint;
  const p256dh = value?.keys?.p256dh;
  const auth = value?.keys?.auth;
  let endpointUrl;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new HttpError(400, 'Invalid push subscription.');
  }
  if (
    endpointUrl.protocol !== 'https:' ||
    endpoint.length > 2048 ||
    typeof p256dh !== 'string' ||
    p256dh.length > 256 ||
    typeof auth !== 'string' ||
    auth.length > 128
  ) {
    throw new HttpError(400, 'Invalid push subscription.');
  }
  return { endpoint, expirationTime: value.expirationTime ?? null, keys: { p256dh, auth } };
};

const validateClickBase = (value, origin) => {
  if (typeof value !== 'string' || value.length > 1024) {
    throw new HttpError(400, 'Invalid click base.');
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, 'Invalid click base.');
  }
  if (url.origin !== origin || url.username || url.password) {
    throw new HttpError(400, 'Invalid click base.');
  }
  return value.replace(/\/$/, '');
};

const loadManagedRecord = async (req) => {
  const token = bearerToken(req);
  const pushKey = await redis(['GET', managementKey(token)]);
  if (!pushKey) throw new HttpError(401, 'Invalid management token.');
  const value = await redis(['GET', subscriptionKey(pushKey)]);
  if (!value) throw new HttpError(404, 'Push subscription not found.');
  return { token, pushKey, record: JSON.parse(value) };
};

const saveRecord = async (pushKey, token, record) => {
  await Promise.all([
    redis(['SET', subscriptionKey(pushKey), JSON.stringify(record), 'EX', SUBSCRIPTION_TTL]),
    redis(['SET', managementKey(token), pushKey, 'EX', SUBSCRIPTION_TTL]),
  ]);
};

const refreshRecord = async (pushKey, record) => {
  const value = JSON.stringify({ ...record, updatedAt: Date.now() });
  await Promise.all([
    redis(['SET', subscriptionKey(pushKey), value, 'EX', SUBSCRIPTION_TTL]),
    redis(['SET', `push:management:${record.managementHash}`, pushKey, 'EX', SUBSCRIPTION_TTL]),
  ]);
};

export const isEnabled = async () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return process.env.PUSH_ENABLED === 'true';
  }
  const live = await redis(['GET', 'push:enabled']);
  return live === null ? process.env.PUSH_ENABLED === 'true' : live === '1' || live === 'true';
};

export const getPublicConfig = async (req) => ({
  enabled: await isEnabled(),
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  appId: APP_ID,
  notifyUrl: `${requestOrigin(req)}/_matrix/push/v1/notify`,
});

export const upsertSubscription = async (req) => {
  const origin = requireSameOrigin(req);
  if (!(await isEnabled())) throw new HttpError(503, 'Push notifications are disabled.');
  await rateLimit(req, 'subscription', 20);
  const body = parseBody(req);
  const subscription = validateSubscription(body.subscription);
  const clickBase = validateClickBase(body.clickBase, origin);
  const previewMode = body.previewMode === 'maximum' ? 'maximum' : 'private';

  const authorization = req.headers.authorization;
  if (authorization) {
    const managed = await loadManagedRecord(req);
    const record = {
      ...managed.record,
      subscription,
      clickBase,
      previewMode,
      updatedAt: Date.now(),
    };
    await saveRecord(managed.pushKey, managed.token, record);
    return { pushKey: managed.pushKey, managementToken: managed.token };
  }

  const pushKey = randomBytes(32).toString('base64url');
  const managementToken = randomBytes(32).toString('base64url');
  await saveRecord(pushKey, managementToken, {
    subscription,
    clickBase,
    previewMode,
    managementHash: sha256(managementToken),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { pushKey, managementToken };
};

export const deleteSubscription = async (req) => {
  requireSameOrigin(req);
  const { pushKey, record } = await loadManagedRecord(req);
  await redis(['DEL', subscriptionKey(pushKey), `push:management:${record.managementHash}`]);
};

export const sanitizeText = (value, maxLength = 160) =>
  String(value || '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const contentSummary = (notification) => {
  const body = sanitizeText(notification.content?.body);
  if (body) return body;
  if (notification.type === 'm.room.encrypted') return 'Encrypted message';
  if (notification.type === 'm.room.member' && notification.user_is_target) {
    return 'New room invitation';
  }
  const msgtype = notification.content?.msgtype;
  if (['m.text', 'm.notice', 'm.emote'].includes(msgtype)) {
    return body || 'New message';
  }
  return (
    {
      'm.image': 'Sent an image',
      'm.video': 'Sent a video',
      'm.audio': 'Sent an audio message',
      'm.file': 'Sent a file',
    }[msgtype] || 'New message'
  );
};

export const buildClickUrl = (clickBase, roomId, eventId) => {
  if (!roomId || !eventId) return `${clickBase}/inbox/notifications/`;
  return `${clickBase}/recent/${encodeURIComponent(roomId)}/${encodeURIComponent(eventId)}/`;
};

export const renderNotification = (notification, record) => {
  const maximum = record.previewMode === 'maximum';
  const roomName = sanitizeText(notification.room_name, 80);
  const sender = sanitizeText(notification.sender_display_name, 80);
  const summary = contentSummary(notification);
  const body = maximum
    ? sender
      ? `${sender}: ${summary}`
      : summary
    : 'New Matrix-IIIT notification';
  const unread = Number.isInteger(notification.counts?.unread)
    ? Math.min(9999, Math.max(0, notification.counts.unread))
    : undefined;

  return {
    title: maximum && roomName ? roomName : 'Matrix-IIIT',
    body,
    clickUrl: buildClickUrl(record.clickBase, notification.room_id, notification.event_id),
    tag: notification.room_id ? `room-${sha256(notification.room_id).slice(0, 24)}` : 'matrix',
    unread,
    priority: notification.prio === 'low' ? 'low' : 'high',
    show: Boolean(notification.event_id),
  };
};

let vapidConfigured = false;
const send = async (record, payload) => {
  if (!vapidConfigured) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
      throw new HttpError(503, 'Web Push is not configured.');
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  await webpush.sendNotification(record.subscription, JSON.stringify(payload), {
    TTL: 300,
    urgency: payload.priority === 'low' ? 'low' : 'high',
  });
};

export const sendTest = async (req) => {
  requireSameOrigin(req);
  if (!(await isEnabled())) throw new HttpError(503, 'Push notifications are disabled.');
  await rateLimit(req, 'test', 10);
  const { record } = await loadManagedRecord(req);
  await send(record, {
    title: 'Matrix-IIIT',
    body: 'Push notifications are working.',
    clickUrl: `${record.clickBase}/recent/`,
    tag: 'matrix-test',
    priority: 'high',
    show: true,
  });
};

const removeExpiredRecord = async (pushKey, record) => {
  await redis(['DEL', subscriptionKey(pushKey), `push:management:${record.managementHash}`]);
};

export const handleMatrixNotify = async (req) => {
  if (!(await isEnabled())) return { rejected: [] };
  await rateLimit(req, 'notify', 120);
  const { notification } = parseBody(req, 65_536);
  if (!notification || !Array.isArray(notification.devices) || notification.devices.length > 50) {
    throw new HttpError(400, 'Invalid Matrix notification.');
  }
  for (const field of ['event_id', 'room_id', 'room_name', 'sender_display_name', 'type']) {
    if (notification[field] !== undefined && typeof notification[field] !== 'string') {
      throw new HttpError(400, 'Invalid Matrix notification.');
    }
    if (notification[field]?.length > 1024) {
      throw new HttpError(400, 'Invalid Matrix notification.');
    }
  }

  const rejected = [];
  let transientFailure = false;
  for (const device of notification.devices) {
    const pushKey = device?.pushkey;
    if (typeof pushKey !== 'string' || pushKey.length > 512) continue;
    const stored = await redis(['GET', subscriptionKey(pushKey)]);
    if (!stored) {
      rejected.push(pushKey);
      continue;
    }

    const record = JSON.parse(stored);
    const dedupeKey = notification.event_id
      ? `push:dedupe:${pushKey}:${notification.event_id}`
      : undefined;
    if (dedupeKey) {
      const claimed = await redis(['SET', dedupeKey, 'pending', 'NX', 'EX', 30]);
      if (claimed !== 'OK') continue;
    }

    let delivered = false;
    try {
      await send(record, renderNotification(notification, record));
      delivered = true;
      if (dedupeKey) await redis(['SET', dedupeKey, 'delivered', 'EX', DEDUPE_TTL]);
      await refreshRecord(pushKey, record).catch(() => undefined);
    } catch (error) {
      if (dedupeKey && !delivered) await redis(['DEL', dedupeKey]);
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await removeExpiredRecord(pushKey, record);
        rejected.push(pushKey);
      } else {
        transientFailure = true;
      }
    }
  }

  if (transientFailure) throw new HttpError(502, 'Temporary push delivery failure.');
  return { rejected };
};

export const handleError = (res, error) => {
  if (error instanceof SyntaxError) return json(res, 400, { error: 'Invalid JSON.' });
  return json(res, error instanceof HttpError ? error.status : 500, {
    error: error instanceof HttpError ? error.message : 'Push request failed.',
  });
};
