import React, { useRef } from 'react';
import { Scroll } from 'folds';
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
  let middleTab: React.ReactNode = <ExploreTab />;
  if (uiOption === 'matrix-ios') middleTab = <SearchTab />;
  if (uiOption === 'whatsapp') middleTab = <DirectTab />;

  return (
    <Sidebar data-ui-option-mobile-sidebar>
      <SidebarStack data-ui-option-mobile-nav>
        <HomeTab />
        {uiOption === 'matrix-android' ? <DirectTab /> : <RecentTab />}
        {middleTab}
        <InboxTab />
        <UIOptionsTab />
        <SettingsTab />
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
