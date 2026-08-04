import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAtomValue } from 'jotai';
import { Box, Icon, Icons, Input, Scroll, Text, config } from 'folds';
import { EventType, MatrixEvent, Room, RoomEvent, RoomEventHandlerMap } from 'matrix-js-sdk';
import { NavEmptyCenter, NavEmptyLayout, NavItem } from '../../../components/nav';
import { Page, PageHeader } from '../../../components/page';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { getMxIdLocalPart } from '../../../utils/matrix';
import { getMemberDisplayName } from '../../../utils/room';

dayjs.extend(relativeTime);

type ThreadItem = {
  room: Room;
  rootEvent: MatrixEvent;
  replyCount: number;
};

const useThreads = () => {
  const mx = useMatrixClient();
  const roomIds = useAtomValue(allRoomsAtom);
  const [, forceRefresh] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const refresh = () => forceRefresh((current) => current + 1);
    const handleTimelineEvent: RoomEventHandlerMap[RoomEvent.Timeline] = (
      _event,
      room,
      _toStartOfTimeline,
      removed,
      data
    ) => {
      if (!room || removed || !data.liveEvent) return;
      refresh();
    };

    mx.on(RoomEvent.Timeline, handleTimelineEvent);

    const loadThreads = async () => {
      if (mx.supportsThreads()) {
        await Promise.allSettled(
          roomIds.map(async (roomId) => {
            const room = mx.getRoom(roomId);
            if (room && !room.isSpaceRoom()) await room.fetchRoomThreads();
          })
        );
      }

      if (active) {
        setLoading(false);
        refresh();
      }
    };

    loadThreads();

    return () => {
      active = false;
      mx.removeListener(RoomEvent.Timeline, handleTimelineEvent);
    };
  }, [mx, roomIds]);

  const threads: ThreadItem[] = roomIds
    .flatMap((roomId) => {
      const room = mx.getRoom(roomId);
      if (!room || room.isSpaceRoom()) return [];

      return room.getThreads().flatMap((thread) => {
        const { rootEvent } = thread;
        const rootEventType = rootEvent?.getType();
        if (
          !rootEvent ||
          rootEvent.isRedacted() ||
          (rootEventType !== EventType.RoomMessage &&
            rootEventType !== EventType.RoomMessageEncrypted)
        ) {
          return [];
        }

        return [{ room, rootEvent, replyCount: thread.length }];
      });
    })
    .sort((a, b) => b.rootEvent.getTs() - a.rootEvent.getTs());

  return { loading, threads };
};

const getEventBody = (event: MatrixEvent): string => {
  const { body } = event.getContent<{ body?: unknown }>();
  return typeof body === 'string' ? body.trim() : '';
};

function ThreadCard({ item, onOpen }: { item: ThreadItem; onOpen: () => void }) {
  const senderId = item.rootEvent.getSender() ?? '';
  const author = getMemberDisplayName(item.room, senderId) ?? getMxIdLocalPart(senderId);
  const body = getEventBody(item.rootEvent);
  const [headline = 'Encrypted thread', ...rest] = body.split('\n');
  const excerpt = rest.join('\n').trim();

  return (
    <NavItem
      as="button"
      type="button"
      variant="SurfaceVariant"
      radii="400"
      onClick={onOpen}
      aria-label={`Open thread: ${headline}`}
      style={{
        width: '100%',
        padding: config.space.S300,
        textAlign: 'left',
        border: 0,
        font: 'inherit',
      }}
    >
      <Box direction="Column" grow="Yes" gap="200">
        <Box alignItems="Center" gap="100">
          <Icon size="100" src={Icons.Thread} />
          <Text size="T200" priority="300" truncate>
            {item.room.name} · {author} · {dayjs(item.rootEvent.getTs()).fromNow()}
          </Text>
        </Box>
        <Text size="H5" style={{ fontWeight: config.fontWeight.W600 }}>
          {headline}
        </Text>
        {excerpt && (
          <Text size="T300" priority="300" style={{ whiteSpace: 'pre-wrap' }}>
            {excerpt}
          </Text>
        )}
        <Box alignItems="Center" gap="100">
          <Icon size="100" src={Icons.ThreadReply} />
          <Text size="T200" priority="300">
            {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
          <Text size="T200" priority="300" style={{ marginLeft: 'auto' }}>
            Open thread
          </Text>
          <Icon size="100" src={Icons.ChevronRight} />
        </Box>
      </Box>
    </NavItem>
  );
}

export function Threads() {
  const { loading, threads } = useThreads();
  const { navigateRoom } = useRoomNavigate();
  const [query, setQuery] = useState('');

  const visibleThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return threads;

    return threads.filter(({ room, rootEvent }) =>
      `${room.name} ${getEventBody(rootEvent)}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query, threads]);

  let threadContent: React.ReactNode;
  if (loading) {
    threadContent = (
      <Box alignItems="Center" justifyContent="Center" style={{ minHeight: '40vh' }}>
        <Text size="L400" priority="300">
          Loading threads…
        </Text>
      </Box>
    );
  } else if (visibleThreads.length === 0) {
    threadContent = (
      <NavEmptyCenter>
        <NavEmptyLayout
          icon={<Icon size="600" src={Icons.Thread} />}
          title={
            <Text size="H5" align="Center">
              {query ? 'No matching threads' : 'No threads yet'}
            </Text>
          }
          content={
            <Text size="T300" align="Center">
              {query
                ? 'Try a different search.'
                : 'Threads created in your joined rooms will appear here.'}
            </Text>
          }
        />
      </NavEmptyCenter>
    );
  } else {
    threadContent = (
      <Box direction="Column" gap="200">
        {visibleThreads.map((item) => {
          const eventId = item.rootEvent.getId();
          if (!eventId) return null;

          return (
            <ThreadCard
              key={`${item.room.roomId}:${eventId}`}
              item={item}
              onOpen={() => navigateRoom(item.room.roomId, eventId)}
            />
          );
        })}
      </Box>
    );
  }

  return (
    <Page>
      <PageHeader balance>
        <Box alignItems="Center" gap="200">
          <Icon size="400" src={Icons.Thread} />
          <Text size="H3">Threads</Text>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <Box
            direction="Column"
            gap="300"
            style={{
              width: '100%',
              maxWidth: '720px',
              margin: '0 auto',
              padding: `${config.space.S300} ${config.space.S400} ${config.space.S700}`,
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              aria-label="Search threads"
              placeholder="Search threads"
              variant="Background"
              size="500"
              before={<Icon size="200" src={Icons.Search} />}
            />
            {threadContent}
          </Box>
        </Scroll>
      </Box>
    </Page>
  );
}
