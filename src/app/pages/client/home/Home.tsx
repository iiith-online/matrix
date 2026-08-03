import React, { MouseEventHandler, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  config,
  toRem,
} from 'folds';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
} from '../../../components/nav';
import { getExplorePath, getHomeRoomPath } from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { useHomeRooms } from './useHomeRooms';
import { useRecentRooms } from '../recent/useRecentRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { mDirectAtom } from '../../../state/mDirectList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { searchModalAtom } from '../../../state/searchModal';
import { UIOptionsButton } from '../sidebar/UIOptionsTab';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';

type HomeMenuProps = {
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(({ requestClose }, ref) => {
  const orphanRooms = useHomeRooms();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const mx = useMatrixClient();

  const handleMarkAsRead = () => {
    if (!unread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

type HomeFilter = 'all' | 'direct' | 'spaces';

function HomeFilterBar({
  filter,
  onChange,
}: {
  filter: HomeFilter;
  onChange: (filter: HomeFilter) => void;
}) {
  const filters: Array<{ id: HomeFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'spaces', label: 'Spaces' },
  ];

  return (
    <Box
      data-ui-option-home-filters
      alignItems="Center"
      gap="100"
      style={{ padding: `${config.space.S100} ${config.space.S200} 0` }}
    >
      {filters.map((item) => (
        <Chip
          key={item.id}
          data-testid={`home-filter-${item.id}`}
          variant={item.id === filter ? 'Primary' : 'Secondary'}
          outlined={item.id === filter}
          radii="Pill"
          onClick={() => onChange(item.id)}
          aria-pressed={item.id === filter}
        >
          <Text size="B300">{item.label}</Text>
        </Chip>
      ))}
    </Box>
  );
}

function HomeHeader() {
  const [uiOption] = useSetting(settingsAtom, 'uiOption');
  const screenSize = useScreenSizeContext();
  const setSearchOpen = useSetAtom(searchModalAtom);
  const isWhatsapp = uiOption === 'whatsapp';
  const isIos = uiOption === 'matrix-ios';
  const showUiOptions = screenSize === ScreenSize.Mobile && uiOption !== 'matrix';
  let title = 'Home';
  if (isWhatsapp) title = 'Chats';
  if (isIos) title = 'Messages';
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader data-ui-option-home-header>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              {title}
            </Text>
          </Box>
          {(isWhatsapp || isIos) && (
            <IconButton
              aria-label="Search"
              variant="Background"
              onClick={() => setSearchOpen(true)}
            >
              <Icon src={Icons.Search} size="200" />
            </IconButton>
          )}
          {showUiOptions && <UIOptionsButton />}
          <Box>
            <IconButton
              aria-label="Home options"
              aria-pressed={!!menuAnchor}
              variant="Background"
              onClick={handleOpenMenu}
            >
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <HomeMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <Button
            onClick={() => navigate(getExplorePath())}
            variant="Secondary"
            fill="Soft"
            size="300"
          >
            <Text size="B300" truncate>
              Explore Community Rooms
            </Text>
          </Button>
        }
      />
    </NavEmptyCenter>
  );
}

const DEFAULT_CATEGORY_ID = makeNavCategoryId('home', 'room');
const RECENT_CATEGORY_ID = makeNavCategoryId('home', 'recent');

const getRoomSpaceName = (
  mx: ReturnType<typeof useMatrixClient>,
  roomToParents: Map<string, Set<string>>,
  roomId: string
) => {
  const parentIds = roomToParents.get(roomId);
  if (!parentIds) return undefined;

  const names = Array.from(parentIds)
    .map((parentId) => mx.getRoom(parentId)?.name)
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(' · ') : undefined;
};

export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const recentRooms = useRecentRooms();
  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const [uiOption] = useSetting(settingsAtom, 'uiOption');
  const [homeFilter, setHomeFilter] = useState<HomeFilter>('all');

  const selectedRoomId = useSelectedRoom();
  const isWhatsapp = uiOption === 'whatsapp';
  const isMatrixAndroid = uiOption === 'matrix-android';
  const isMatrixIos = uiOption === 'matrix-ios';
  const noRoomToDisplay = rooms.length === 0 && recentRooms.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());
  const categoryDefaultsApplied = useRef(false);

  useEffect(() => {
    if (categoryDefaultsApplied.current) return;
    categoryDefaultsApplied.current = true;
    if (!closedCategories.has(DEFAULT_CATEGORY_ID)) {
      setClosedCategories({ type: 'PUT', categoryId: DEFAULT_CATEGORY_ID });
    }
  }, [closedCategories, setClosedCategories]);

  const recentCategoryClosed = closedCategories.has(RECENT_CATEGORY_ID);
  const roomsCategoryClosed =
    !categoryDefaultsApplied.current || closedCategories.has(DEFAULT_CATEGORY_ID);

  const sortedRecentRooms = useMemo(
    () => (recentCategoryClosed ? [] : Array.from(recentRooms).sort(factoryRoomIdByActivity(mx))),
    [mx, recentCategoryClosed, recentRooms]
  );

  const sortedRooms = useMemo(() => {
    if (roomsCategoryClosed) return [];
    return Array.from(rooms).sort(factoryRoomIdByAtoZ(mx));
  }, [mx, rooms, roomsCategoryClosed]);

  const conversationRooms = useMemo(
    () => Array.from(new Set([...rooms, ...recentRooms])).sort(factoryRoomIdByActivity(mx)),
    [mx, recentRooms, rooms]
  );
  const filteredConversationRooms = useMemo(() => {
    if (!isMatrixAndroid || homeFilter === 'all') return conversationRooms;
    return conversationRooms.filter((roomId) =>
      homeFilter === 'direct' ? mDirects.has(roomId) : roomToParents.has(roomId)
    );
  }, [conversationRooms, homeFilter, isMatrixAndroid, mDirects, roomToParents]);

  const filteredRooms = useMemo(() => {
    if (!isMatrixAndroid || homeFilter === 'all') return sortedRooms;
    return sortedRooms.filter((roomId) =>
      homeFilter === 'direct' ? mDirects.has(roomId) : roomToParents.has(roomId)
    );
  }, [homeFilter, isMatrixAndroid, mDirects, roomToParents, sortedRooms]);
  const filteredRecentRooms = useMemo(() => {
    if (!isMatrixAndroid || homeFilter === 'all') return sortedRecentRooms;
    return sortedRecentRooms.filter((roomId) =>
      homeFilter === 'direct' ? mDirects.has(roomId) : roomToParents.has(roomId)
    );
  }, [homeFilter, isMatrixAndroid, mDirects, roomToParents, sortedRecentRooms]);
  const recentRoomsForView = filteredRecentRooms;

  const recentVirtualizer = useVirtualizer({
    count: recentRoomsForView.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualizer = useVirtualizer({
    count: filteredRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  const conversationVirtualizer = useVirtualizer({
    count: filteredConversationRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (isWhatsapp ? 64 : 52),
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  const renderRecentRoom = (vItem: VirtualItem, whatsappStyle = false) => {
    const roomId = recentRoomsForView[vItem.index];
    const room = mx.getRoom(roomId);
    if (!room) return null;

    const direct = mDirects.has(roomId);
    return (
      <VirtualTile virtualItem={vItem} key={roomId} ref={recentVirtualizer.measureElement}>
        <RoomNavItem
          room={room}
          selected={selectedRoomId === roomId}
          showAvatar={whatsappStyle || direct || isMatrixIos}
          direct={direct}
          spaceName={whatsappStyle ? undefined : getRoomSpaceName(mx, roomToParents, roomId)}
          style={{ minHeight: toRem(whatsappStyle ? 64 : 44) }}
          linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
          notificationMode={getRoomNotificationMode(notificationPreferences, room.roomId)}
        />
      </VirtualTile>
    );
  };

  const renderConversationRoom = (vItem: VirtualItem) => {
    const roomId = filteredConversationRooms[vItem.index];
    const room = mx.getRoom(roomId);
    if (!room) return null;

    const direct = mDirects.has(roomId);
    return (
      <VirtualTile virtualItem={vItem} key={roomId} ref={conversationVirtualizer.measureElement}>
        <RoomNavItem
          room={room}
          selected={selectedRoomId === roomId}
          showAvatar={isWhatsapp || isMatrixIos || direct}
          direct={direct}
          spaceName={isWhatsapp ? undefined : getRoomSpaceName(mx, roomToParents, roomId)}
          style={{ minHeight: toRem(isWhatsapp ? 64 : 52) }}
          linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
          notificationMode={getRoomNotificationMode(notificationPreferences, room.roomId)}
        />
      </VirtualTile>
    );
  };

  return (
    <PageNav>
      <HomeHeader />
      {isMatrixAndroid && !noRoomToDisplay && (
        <HomeFilterBar filter={homeFilter} onChange={setHomeFilter} />
      )}
      {noRoomToDisplay && <HomeEmpty />}
      {!noRoomToDisplay && (isWhatsapp || isMatrixAndroid) && (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column">
            <NavCategory data-ui-option-conversation-list>
              <div
                style={{
                  position: 'relative',
                  height: conversationVirtualizer.getTotalSize(),
                }}
              >
                {conversationVirtualizer
                  .getVirtualItems()
                  .map((vItem) => renderConversationRoom(vItem))}
              </div>
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
      {!noRoomToDisplay && !isWhatsapp && !isMatrixAndroid && (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            <NavCategory>
              <NavCategoryHeader>
                <RoomNavCategoryButton
                  closed={closedCategories.has(DEFAULT_CATEGORY_ID)}
                  data-category-id={DEFAULT_CATEGORY_ID}
                  onClick={handleCategoryClick}
                >
                  Rooms
                </RoomNavCategoryButton>
              </NavCategoryHeader>
              <div
                style={{
                  position: 'relative',
                  height: virtualizer.getTotalSize(),
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const roomId = filteredRooms[vItem.index];
                  const room = mx.getRoom(roomId);
                  if (!room) return null;
                  const selected = selectedRoomId === roomId;

                  return (
                    <VirtualTile
                      virtualItem={vItem}
                      key={vItem.index}
                      ref={virtualizer.measureElement}
                    >
                      <RoomNavItem
                        room={room}
                        selected={selected}
                        showAvatar={isMatrixIos}
                        linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                        notificationMode={getRoomNotificationMode(
                          notificationPreferences,
                          room.roomId
                        )}
                      />
                    </VirtualTile>
                  );
                })}
              </div>
            </NavCategory>
            <NavCategory>
              <NavCategoryHeader style={{ marginBottom: config.space.S100 }}>
                <RoomNavCategoryButton
                  closed={recentCategoryClosed}
                  data-category-id={RECENT_CATEGORY_ID}
                  onClick={handleCategoryClick}
                >
                  All conversations
                </RoomNavCategoryButton>
              </NavCategoryHeader>
              <div
                style={{
                  position: 'relative',
                  height: recentVirtualizer.getTotalSize(),
                }}
              >
                {recentVirtualizer.getVirtualItems().map((vItem) => renderRecentRoom(vItem))}
              </div>
            </NavCategory>
          </Box>
        </PageNavContent>
      )}
    </PageNav>
  );
}
