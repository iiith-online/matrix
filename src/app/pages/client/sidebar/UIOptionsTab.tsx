import React, { MouseEventHandler, forwardRef, useState } from 'react';
import { Box, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config, toRem } from 'folds';
import FocusTrap from 'focus-trap-react';
import {
  DarkTheme,
  LightTheme,
  ThemeKind,
  useActiveTheme,
  WhatsAppDarkTheme,
  WhatsAppTheme,
} from '../../../hooks/useTheme';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom, UI_OPTIONS, UiOption } from '../../../state/settings';
import { stopPropagation } from '../../../utils/keyboard';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';

type UIOptionsMenuProps = {
  selected: UiOption;
  onSelect: (option: UiOption) => void;
};

const UIOptionsMenu = forwardRef<HTMLDivElement, UIOptionsMenuProps>(
  ({ selected, onSelect }, ref) => (
    <Menu ref={ref} style={{ maxWidth: toRem(220), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        {UI_OPTIONS.map((option) => (
          <MenuItem
            key={option.id}
            data-testid={`ui-option-${option.id}`}
            variant={option.id === selected ? 'Primary' : 'Surface'}
            size="300"
            radii="300"
            aria-pressed={option.id === selected}
            after={option.id === selected ? <Icon size="100" src={Icons.Check} /> : undefined}
            onClick={() => onSelect(option.id)}
          >
            <Text as="span" size="T300" truncate>
              {option.label}
            </Text>
          </MenuItem>
        ))}
      </Box>
    </Menu>
  )
);

const getThemeIdForOption = (option: UiOption, themeKind: ThemeKind) => {
  if (option === 'whatsapp') {
    return themeKind === ThemeKind.Dark ? WhatsAppDarkTheme.id : WhatsAppTheme.id;
  }
  if (option === 'matrix-ios') return LightTheme.id;
  if (option === 'matrix-android') return DarkTheme.id;
  return themeKind === ThemeKind.Dark ? DarkTheme.id : LightTheme.id;
};

export function UIOptionsTab() {
  const activeTheme = useActiveTheme();
  const screenSize = useScreenSizeContext();
  const [uiOption, setUiOption] = useSetting(settingsAtom, 'uiOption');
  const [, setThemeId] = useSetting(settingsAtom, 'themeId');
  const [, setUseSystemTheme] = useSetting(settingsAtom, 'useSystemTheme');
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return evt.currentTarget.getBoundingClientRect();
    });
  };

  const handleSelect = (option: UiOption) => {
    setUiOption(option);
    setThemeId(getThemeIdForOption(option, activeTheme.kind));
    setUseSystemTheme(false);
    setMenuAnchor(undefined);
  };

  return (
    <SidebarItem active={!!menuAnchor}>
      <SidebarItemTooltip tooltip="UI options">
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            aria-label="UI options"
            aria-expanded={!!menuAnchor}
            data-testid="ui-options-trigger"
            outlined
            onClick={handleOpenMenu}
          >
            <Icon src={Icons.Bulb} size="200" />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {menuAnchor && (
        <PopOut
          anchor={menuAnchor}
          position={screenSize === ScreenSize.Mobile ? 'Top' : 'Right'}
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
              <UIOptionsMenu selected={uiOption} onSelect={handleSelect} />
            </FocusTrap>
          }
        />
      )}
    </SidebarItem>
  );
}
