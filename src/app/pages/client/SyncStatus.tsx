import { MatrixClient, SyncState } from 'matrix-js-sdk';
import React, { useCallback, useState } from 'react';
import { Box, color, Text, toRem, Tooltip, TooltipProvider } from 'folds';
import { useSyncState } from '../../hooks/useSyncState';
import { SidebarItem, SidebarItemTooltip } from '../../components/sidebar';

type StateData = {
  current: SyncState | null;
  previous: SyncState | null | undefined;
};

type SyncStatusProps = {
  mx: MatrixClient;
};

type SyncStatusValue = {
  color: string;
  label: string;
};

const getSyncStatusValue = (current: SyncState | null): SyncStatusValue => {
  if (current === SyncState.Error) {
    return { color: color.Critical.Main, label: 'Disconnected' };
  }

  if (current === SyncState.Prepared || current === SyncState.Syncing) {
    return { color: color.Success.Main, label: 'Connected' };
  }

  return {
    color: color.Warning.Main,
    label: current === SyncState.Reconnecting ? 'Reconnecting' : 'Connecting',
  };
};

export const useSyncStatus = (mx: MatrixClient): SyncStatusValue => {
  const [stateData, setStateData] = useState<StateData>(() => ({
    current: mx.getSyncState(),
    previous: undefined,
  }));

  useSyncState(
    mx,
    useCallback((current, previous) => {
      setStateData((s) => {
        if (s.current === current && s.previous === previous) {
          return s;
        }
        return { current, previous };
      });
    }, [])
  );

  return getSyncStatusValue(stateData.current);
};

function SyncStatusBar({ color: barColor, label }: { color: string; label: string }) {
  return (
    <SidebarItem>
      <SidebarItemTooltip tooltip={label}>
        {(triggerRef) => (
          <Box
            as="span"
            ref={triggerRef}
            style={{
              width: toRem(24),
              height: toRem(4),
              borderRadius: toRem(4),
              backgroundColor: barColor,
              opacity: 0.85,
              boxShadow: `0 0 0 ${toRem(2)} ${color.Background.Container}`,
            }}
            role="status"
            aria-label={label}
            title={label}
          />
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}

export function SyncStatus({ mx }: SyncStatusProps) {
  const status = useSyncStatus(mx);
  return <SyncStatusBar color={status.color} label={status.label} />;
}

export function SyncStatusDot({ mx }: SyncStatusProps) {
  const status = useSyncStatus(mx);

  return (
    <TooltipProvider
      position="Bottom"
      offset={4}
      tooltip={
        <Tooltip>
          <Text>{status.label}</Text>
        </Tooltip>
      }
    >
      {(triggerRef) => (
        <Box
          as="span"
          ref={triggerRef}
          style={{
            width: toRem(7),
            height: toRem(7),
            flexShrink: 0,
            borderRadius: '50%',
            backgroundColor: status.color,
            boxShadow: `0 0 0 ${toRem(2)} ${color.Background.Container}`,
          }}
          role="status"
          aria-label={`Connection: ${status.label}`}
          title={status.label}
        />
      )}
    </TooltipProvider>
  );
}
