import { useAtomValue } from 'jotai';
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatrixClient, MatrixEvent, Room, RoomEvent, RoomEventHandlerMap } from 'matrix-js-sdk';
import { CryptoBackend } from 'matrix-js-sdk/lib/common-crypto/CryptoBackend';
import { unreadEqual, unreadInfoToUnread } from '../../state/room/roomToUnread';
import IIITIcon from '../../../iiit.png';
import NotificationSound from '../../../../public/sound/notification.ogg';
import InviteSound from '../../../../public/sound/invite.ogg';
import { notificationPermission, setFavicon } from '../../utils/dom';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import { usePreviousValue } from '../../hooks/usePreviousValue';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import {
  getInboxInvitesPath,
  getOriginBaseUrl,
  getRecentRoomPath,
} from '../pathUtils';
import {
  getMemberDisplayName,
  getNotificationType,
  getUnreadInfo,
  isNotificationEvent,
} from '../../utils/room';
import { NotificationType, UnreadInfo } from '../../../types/matrix/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { useSelectedRoom } from '../../hooks/router/useSelectedRoom';
import { useInboxNotificationsSelected } from '../../hooks/router/useInbox';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useClientConfig } from '../../hooks/useClientConfig';
import { getPushRegistration, reconcilePushNotifications } from '../../utils/pushNotifications';
import { useAndroidBackNavigation } from '../../hooks/useAndroidBackNavigation';

function SystemEmojiFeature() {
  const [twitterEmoji] = useSetting(settingsAtom, 'twitterEmoji');

  if (twitterEmoji) {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji');
  } else {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji_DISABLED');
  }

  return null;
}

function PageZoomFeature() {
  const [pageZoom] = useSetting(settingsAtom, 'pageZoom');

  if (pageZoom === 100) {
    document.documentElement.style.removeProperty('font-size');
  } else {
    document.documentElement.style.setProperty('font-size', `calc(1em * ${pageZoom / 100})`);
  }

  return null;
}

function FaviconUpdater() {
  useEffect(() => {
    setFavicon(IIITIcon);
  }, []);

  return null;
}

const getNotificationPreview = (mEvent: MatrixEvent): string => {
  const content = mEvent.getClearContent() ?? mEvent.getContent();
  const body = typeof content.body === 'string' ? content.body.replace(/\s+/g, ' ').trim() : '';
  if (body) return body.slice(0, 160);
  if (mEvent.getType() === 'm.room.encrypted') return 'Encrypted message';

  return (
    {
      'm.image': 'Sent an image',
      'm.video': 'Sent a video',
      'm.audio': 'Sent an audio message',
      'm.file': 'Sent a file',
    }[content.msgtype as string] ?? 'New message'
  );
};

const getNotificationEvent = async (
  mx: MatrixClient,
  roomId: string,
  eventId: string
): Promise<
  | { event: MatrixEvent; roomName: string; room: Room }
  | undefined
> => {
  const room = mx.getRoom(roomId);
  if (!room) return undefined;

  let event = room.findEventById(eventId);
  if (!event) {
    const rawEvent = await mx.fetchRoomEvent(roomId, eventId);
    event = new MatrixEvent(rawEvent);
  }

  if (event.isEncrypted() && mx.getCrypto()) {
    await event.attemptDecryption(mx.getCrypto() as CryptoBackend);
  }

  return { event, roomName: room.name ?? 'Matrix-IIIT', room };
};

function InviteNotifications() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const invites = useAtomValue(allInvitesAtom);
  const perviousInviteLen = usePreviousValue(invites.length, 0);
  const mx = useMatrixClient();

  const navigate = useNavigate();
  const [showNotifications] = useSetting(settingsAtom, 'showNotifications');
  const [notifyWhenActive] = useSetting(settingsAtom, 'notifyWhenActive');
  const [notificationSound] = useSetting(settingsAtom, 'isNotificationSounds');

  const notify = useCallback(
    (count: number) => {
      const noti = new window.Notification('Invitation', {
        icon: IIITIcon,
        badge: IIITIcon,
        body: `You have ${count} new invitation request.`,
        silent: true,
      });

      noti.onclick = () => {
        if (!window.closed) navigate(getInboxInvitesPath());
        noti.close();
      };
    },
    [navigate]
  );

  const playSound = useCallback(() => {
    const audioElement = audioRef.current;
    audioElement?.play();
  }, []);

  useEffect(() => {
    if (invites.length > perviousInviteLen && mx.getSyncState() === 'SYNCING') {
      const shouldNotifyLocally =
        !getPushRegistration() ||
        (notifyWhenActive && document.visibilityState === 'visible');
      if (shouldNotifyLocally && showNotifications && notificationPermission('granted')) {
        notify(invites.length - perviousInviteLen);
      }

      if (notificationSound) {
        playSound();
      }
    }
  }, [
    mx,
    invites,
    perviousInviteLen,
    notifyWhenActive,
    showNotifications,
    notificationSound,
    notify,
    playSound,
  ]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio ref={audioRef} style={{ display: 'none' }}>
      <source src={InviteSound} type="audio/ogg" />
    </audio>
  );
}

function MessageNotifications() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const notifRef = useRef<Notification>();
  const unreadCacheRef = useRef<Map<string, UnreadInfo>>(new Map());
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [showNotifications] = useSetting(settingsAtom, 'showNotifications');
  const [notifyWhenActive] = useSetting(settingsAtom, 'notifyWhenActive');
  const [notificationSound] = useSetting(settingsAtom, 'isNotificationSounds');

  const navigate = useNavigate();
  const notificationSelected = useInboxNotificationsSelected();
  const selectedRoomId = useSelectedRoom();

  const notify = useCallback(
    ({
      roomName,
      roomAvatar,
      username,
      roomId,
      eventId,
      preview,
    }: {
      roomName: string;
      roomAvatar?: string;
      username: string;
      roomId: string;
      eventId: string;
      preview: string;
    }) => {
      const noti = new window.Notification(roomName, {
        icon: roomAvatar,
        badge: roomAvatar,
        body: `${username}: ${preview}`,
        silent: true,
      });

      noti.onclick = () => {
        if (!window.closed) navigate(getRecentRoomPath(roomId, eventId));
        noti.close();
        notifRef.current = undefined;
      };

      notifRef.current?.close();
      notifRef.current = noti;
    },
    [navigate]
  );

  const playSound = useCallback(() => {
    const audioElement = audioRef.current;
    audioElement?.play();
  }, []);

  useEffect(() => {
    const handleTimelineEvent: RoomEventHandlerMap[RoomEvent.Timeline] = async (
      mEvent,
      room,
      toStartOfTimeline,
      removed,
      data
    ) => {
      if (mx.getSyncState() !== 'SYNCING') return;
      if (
        !notifyWhenActive &&
        document.hasFocus() &&
        (selectedRoomId === room?.roomId || notificationSelected)
      ) {
        return;
      }
      if (
        !room ||
        !data.liveEvent ||
        room.isSpaceRoom() ||
        !isNotificationEvent(mEvent) ||
        getNotificationType(mx, room.roomId) === NotificationType.Mute
      ) {
        return;
      }

      if (mEvent.isEncrypted() && mx.getCrypto()) {
        await mEvent.attemptDecryption(mx.getCrypto() as CryptoBackend).catch(() => undefined);
      }

      const sender = mEvent.getSender();
      const eventId = mEvent.getId();
      if (!sender || !eventId || mEvent.getSender() === mx.getUserId()) return;
      const unreadInfo = getUnreadInfo(room);
      const cachedUnreadInfo = unreadCacheRef.current.get(room.roomId);
      unreadCacheRef.current.set(room.roomId, unreadInfo);

      if (unreadInfo.total === 0) return;
      if (
        cachedUnreadInfo &&
        unreadEqual(unreadInfoToUnread(cachedUnreadInfo), unreadInfoToUnread(unreadInfo))
      ) {
        return;
      }

      const shouldNotifyLocally =
        !getPushRegistration() ||
        (notifyWhenActive && document.visibilityState === 'visible');
      if (shouldNotifyLocally && showNotifications && notificationPermission('granted')) {
        const avatarMxc =
          room.getAvatarFallbackMember()?.getMxcAvatarUrl() ?? room.getMxcAvatarUrl();
        notify({
          roomName: room.name ?? 'Unknown',
          roomAvatar: avatarMxc
            ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 96, 96, 'crop') ?? undefined
            : undefined,
          username: getMemberDisplayName(room, sender) ?? getMxIdLocalPart(sender) ?? sender,
          roomId: room.roomId,
          eventId,
          preview: getNotificationPreview(mEvent),
        });
      }

      if (notificationSound) {
        playSound();
      }
    };
    mx.on(RoomEvent.Timeline, handleTimelineEvent);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleTimelineEvent);
    };
  }, [
    mx,
    notificationSound,
    notificationSelected,
    notifyWhenActive,
    showNotifications,
    playSound,
    notify,
    selectedRoomId,
    useAuthentication,
  ]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio ref={audioRef} style={{ display: 'none' }}>
      <source src={NotificationSound} type="audio/ogg" />
    </audio>
  );
}

function PushNotificationReconciler() {
  const mx = useMatrixClient();
  const { hashRouter } = useClientConfig();

  useEffect(() => {
    const reconcile = () => {
      if (document.visibilityState === 'visible') {
        reconcilePushNotifications(mx, getOriginBaseUrl(hashRouter)).catch(() => undefined);
      }
    };
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'pushSubscriptionChanged') {
        reconcilePushNotifications(mx, getOriginBaseUrl(hashRouter), true).catch(() => undefined);
        return;
      }

      const port = event.ports[0];
      if (event.data?.type !== 'requestNotificationPreview' || !port) return;

      const sendPreview = async () => {
        try {
          const result = await getNotificationEvent(mx, event.data.roomId, event.data.eventId);
          if (!result) {
            port.postMessage({});
            return;
          }

          const preview = getNotificationPreview(result.event);
          if (preview === 'Encrypted message') {
            port.postMessage({});
            return;
          }

          const sender = result.event.getSender();
          const username = sender
            ? getMemberDisplayName(result.room, sender) ?? getMxIdLocalPart(sender) ?? sender
            : undefined;
          port.postMessage({
            title: result.roomName,
            body: username ? `${username}: ${preview}` : preview,
          });
        } catch {
          port.postMessage({});
        }
      };

      sendPreview().catch(() => port.postMessage({}));
    };
    reconcile();
    window.addEventListener('focus', reconcile);
    document.addEventListener('visibilitychange', reconcile);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      window.removeEventListener('focus', reconcile);
      document.removeEventListener('visibilitychange', reconcile);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [mx, hashRouter]);

  return null;
}

type ClientNonUIFeaturesProps = {
  children: ReactNode;
};

export function ClientNonUIFeatures({ children }: ClientNonUIFeaturesProps) {
  useAndroidBackNavigation();

  return (
    <>
      <SystemEmojiFeature />
      <PageZoomFeature />
      <FaviconUpdater />
      <PushNotificationReconciler />
      <InviteNotifications />
      <MessageNotifications />
      {children}
    </>
  );
}
