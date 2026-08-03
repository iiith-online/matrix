import { atom } from 'jotai';

const STORAGE_KEY = 'settings';
export type DateFormat =
  | 'D MMM YYYY'
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY/MM/DD'
  | 'YYYY-MM-DD'
  | '';
export type MessageSpacing = '0' | '100' | '200' | '300' | '400' | '500';
export type UiOption = 'matrix' | 'whatsapp' | 'matrix-android' | 'matrix-ios';

export const UI_OPTIONS: ReadonlyArray<{ id: UiOption; label: string }> = [
  { id: 'matrix', label: 'Matrix (Web)' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'matrix-android', label: 'Matrix Android' },
  { id: 'matrix-ios', label: 'Matrix iOS' },
];

export enum MessageLayout {
  Modern = 0,
  Compact = 1,
  Bubble = 2,
}

export interface Settings {
  uiOption: UiOption;
  themeId?: string;
  useSystemTheme: boolean;
  lightThemeId?: string;
  darkThemeId?: string;
  monochromeMode?: boolean;
  isMarkdown: boolean;
  editorToolbar: boolean;
  twitterEmoji: boolean;
  pageZoom: number;
  hideActivity: boolean;

  isPeopleDrawer: boolean;
  memberSortFilterIndex: number;
  enterForNewline: boolean;
  messageLayout: MessageLayout;
  messageSpacing: MessageSpacing;
  hideMembershipEvents: boolean;
  hideNickAvatarEvents: boolean;
  showDecryptionErrors: boolean;
  showCallEvents: boolean;
  showRoomChanges: boolean;
  mediaAutoLoad: boolean;
  urlPreview: boolean;
  encUrlPreview: boolean;
  showHiddenEvents: boolean;
  legacyUsernameColor: boolean;

  showNotifications: boolean;
  notifyWhenActive: boolean;
  isNotificationSounds: boolean;

  hour24Clock: boolean;
  dateFormatString: string;

  developerTools: boolean;
}

const defaultSettings: Settings = {
  uiOption: 'matrix',
  themeId: undefined,
  useSystemTheme: true,
  lightThemeId: undefined,
  darkThemeId: undefined,
  monochromeMode: false,
  isMarkdown: true,
  editorToolbar: false,
  twitterEmoji: true,
  pageZoom: 100,
  hideActivity: false,

  isPeopleDrawer: true,
  memberSortFilterIndex: 0,
  enterForNewline: false,
  messageLayout: MessageLayout.Bubble,
  messageSpacing: '300',
  hideMembershipEvents: true,
  hideNickAvatarEvents: true,
  showDecryptionErrors: false,
  showCallEvents: false,
  showRoomChanges: false,
  mediaAutoLoad: false,
  urlPreview: true,
  encUrlPreview: false,
  showHiddenEvents: false,
  legacyUsernameColor: false,

  showNotifications: true,
  notifyWhenActive: false,
  isNotificationSounds: true,

  hour24Clock: false,
  dateFormatString: 'D MMM YYYY',

  developerTools: false,
};

export const getSettings = () => {
  const settings = localStorage.getItem(STORAGE_KEY);
  if (settings === null) return defaultSettings;
  return {
    ...defaultSettings,
    ...(JSON.parse(settings) as Settings),
  };
};

export const setSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const baseSettings = atom<Settings>(getSettings());
export const settingsAtom = atom<Settings, [Settings], undefined>(
  (get) => get(baseSettings),
  (get, set, update) => {
    set(baseSettings, update);
    setSettings(update);
  }
);
