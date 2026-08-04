import React from 'react';
import { Icon, Icons } from 'folds';
import { useMatch, useNavigate } from 'react-router-dom';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { getThreadsPath } from '../../pathUtils';

export function ThreadsTab() {
  const navigate = useNavigate();
  const threadsSelected = !!useMatch({
    path: getThreadsPath(),
    caseSensitive: true,
    end: false,
  });

  return (
    <SidebarItem active={threadsSelected}>
      <SidebarItemTooltip tooltip="Threads">
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            aria-label="Threads"
            outlined
            onClick={() => navigate(getThreadsPath())}
          >
            <Icon src={Icons.Thread} filled={threadsSelected} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
