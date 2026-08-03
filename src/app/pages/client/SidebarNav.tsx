import React, { useRef } from 'react';
import { Box, Scroll, Text } from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';

import {
  Sidebar,
  SidebarContent,
  SidebarStackSeparator,
  SidebarStack,
} from '../../components/sidebar';
import {
  DirectTab,
  HomeTab,
  RecentTab,
  SpaceTabs,
  InboxTab,
  ExploreTab,
  SettingsTab,
  UnverifiedTab,
  SearchTab,
  UIOptionsTab,
} from './sidebar';
import { SyncStatus } from './SyncStatus';

function MobileUiOptionNav() {
  const [uiOption] = useSetting(settingsAtom, 'uiOption');
  const middleTab = uiOption === 'matrix-ios' ? <SearchTab /> : <ExploreTab />;
  const secondTab = uiOption === 'matrix-android' ? <DirectTab /> : <RecentTab />;

  let labels = ['Home', 'Recent', 'Explore', 'Inbox', 'You'];
  if (uiOption === 'whatsapp') labels = ['Chats', 'Recent', 'Direct', 'Inbox', 'You'];
  if (uiOption === 'matrix-ios') labels = ['Home', 'Recent', 'Search', 'Inbox', 'You'];
  if (uiOption === 'matrix-android') labels[1] = 'Direct';

  const tabs = [<HomeTab />, secondTab, middleTab, <InboxTab />, <SettingsTab />];

  return (
    <Sidebar data-ui-option-mobile-sidebar>
      <SidebarStack data-ui-option-mobile-nav>
        {tabs.map((tab, index) => (
          <Box
            key={labels[index]}
            data-ui-option-mobile-tab
            direction="Column"
            alignItems="Center"
            justifyContent="Center"
            gap="100"
            grow="Yes"
            shrink="Yes"
          >
            {tab}
            <Text size="T200" priority="400" truncate>
              {labels[index]}
            </Text>
          </Box>
        ))}
      </SidebarStack>
    </Sidebar>
  );
}

export function SidebarNav() {
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const [uiOption] = useSetting(settingsAtom, 'uiOption');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (screenSize === ScreenSize.Mobile && uiOption !== 'matrix') {
    return <MobileUiOptionNav />;
  }

  return (
    <Sidebar>
      <SidebarContent
        scrollable={
          <Scroll ref={scrollRef} variant="Background" size="0">
            <SidebarStack>
              <HomeTab />
              <DirectTab />
            </SidebarStack>
            <SpaceTabs scrollRef={scrollRef} />
            <SidebarStackSeparator />
            <SidebarStack>
              <ExploreTab />
            </SidebarStack>
          </Scroll>
        }
        sticky={
          <>
            <SidebarStackSeparator />
            <SidebarStack>
              <SearchTab />
              <UnverifiedTab />
              <InboxTab />
              <SyncStatus mx={mx} />
              <UIOptionsTab />
              <SettingsTab />
            </SidebarStack>
          </>
        }
      />
    </Sidebar>
  );
}
