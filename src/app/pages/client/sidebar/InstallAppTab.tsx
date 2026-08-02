import React, { useState } from 'react';
import { Box, Button, config, Header, Icon, IconButton, Icons, Text } from 'folds';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { usePwaInstall } from '../../../hooks/usePwaInstall';
import { Modal500 } from '../../../components/Modal500';

export function InstallAppTab() {
  const { canInstall, install, isInstalled } = usePwaInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await install();
      return;
    }
    setShowInstructions(true);
  };

  return (
    <SidebarItem>
      <SidebarItemTooltip tooltip="Install IIIT matrix">
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            aria-label="Install IIIT matrix app"
            onClick={handleInstall}
          >
            <Icon src={Icons.Download} size="200" />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {showInstructions && (
        <Modal500 requestClose={() => setShowInstructions(false)}>
          <Header variant="Surface" size="500">
            <Box grow="Yes">
              <Text size="H4">Install IIIT matrix</Text>
            </Box>
            <IconButton
              size="300"
              onClick={() => setShowInstructions(false)}
              radii="300"
              aria-label="Close install instructions"
            >
              <Icon src={Icons.Cross} />
            </IconButton>
          </Header>
          <Box direction="Column" gap="400" style={{ padding: config.space.S400 }}>
            <Text priority="400">
              Open your browser menu and choose “Install IIIT matrix” or “Add to Home screen”.
            </Text>
            <Button variant="Secondary" fill="Soft" onClick={() => setShowInstructions(false)}>
              <Text size="B400">Done</Text>
            </Button>
          </Box>
        </Modal500>
      )}
    </SidebarItem>
  );
}
