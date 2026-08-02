import { createTheme } from '@vanilla-extract/css';
import { color } from 'folds';

export const silverTheme = createTheme(color, {
  Background: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Surface: {
    Container: '#EAEAEA',
    ContainerHover: '#DEDEDE',
    ContainerActive: '#D3D3D3',
    ContainerLine: '#C7C7C7',
    OnContainer: '#000000',
  },

  SurfaceVariant: {
    Container: '#DEDEDE',
    ContainerHover: '#D3D3D3',
    ContainerActive: '#C7C7C7',
    ContainerLine: '#BBBBBB',
    OnContainer: '#000000',
  },

  Primary: {
    Main: '#1245A8',
    MainHover: '#103E97',
    MainActive: '#0F3B8F',
    MainLine: '#0E3786',
    OnMain: '#FFFFFF',
    Container: '#C4D0E9',
    ContainerHover: '#B8C7E5',
    ContainerActive: '#ACBEE1',
    ContainerLine: '#A0B5DC',
    OnContainer: '#0D3076',
  },

  Secondary: {
    Main: '#000000',
    MainHover: '#171717',
    MainActive: '#232323',
    MainLine: '#2F2F2F',
    OnMain: '#EAEAEA',
    Container: '#C7C7C7',
    ContainerHover: '#BBBBBB',
    ContainerActive: '#AFAFAF',
    ContainerLine: '#A4A4A4',
    OnContainer: '#0C0C0C',
  },

  Success: {
    Main: '#017343',
    MainHover: '#01683C',
    MainActive: '#016239',
    MainLine: '#015C36',
    OnMain: '#FFFFFF',
    Container: '#BFDCD0',
    ContainerHover: '#B3D5C7',
    ContainerActive: '#A6CEBD',
    ContainerLine: '#99C7B4',
    OnContainer: '#01512F',
  },

  Warning: {
    Main: '#864300',
    MainHover: '#793C00',
    MainActive: '#723900',
    MainLine: '#6B3600',
    OnMain: '#FFFFFF',
    Container: '#E1D0BF',
    ContainerHover: '#DBC7B2',
    ContainerActive: '#D5BDA6',
    ContainerLine: '#CFB499',
    OnContainer: '#5E2F00',
  },

  Critical: {
    Main: '#9D0F0F',
    MainHover: '#8D0E0E',
    MainActive: '#850D0D',
    MainLine: '#7E0C0C',
    OnMain: '#FFFFFF',
    Container: '#E7C3C3',
    ContainerHover: '#E2B7B7',
    ContainerActive: '#DDABAB',
    ContainerLine: '#D89F9F',
    OnContainer: '#6E0B0B',
  },

  Other: {
    FocusRing: 'rgba(0 0 0 / 50%)',
    Shadow: 'rgba(0 0 0 / 20%)',
    Overlay: 'rgba(0 0 0 / 50%)',
  },
});

const darkThemeData = {
  Background: {
    Container: '#1A1A1A',
    ContainerHover: '#262626',
    ContainerActive: '#333333',
    ContainerLine: '#404040',
    OnContainer: '#F2F2F2',
  },

  Surface: {
    Container: '#262626',
    ContainerHover: '#333333',
    ContainerActive: '#404040',
    ContainerLine: '#4D4D4D',
    OnContainer: '#F2F2F2',
  },

  SurfaceVariant: {
    Container: '#333333',
    ContainerHover: '#404040',
    ContainerActive: '#4D4D4D',
    ContainerLine: '#595959',
    OnContainer: '#F2F2F2',
  },

  Primary: {
    Main: '#BDB6EC',
    MainHover: '#B2AAE9',
    MainActive: '#ADA3E8',
    MainLine: '#A79DE6',
    OnMain: '#2C2843',
    Container: '#413C65',
    ContainerHover: '#494370',
    ContainerActive: '#50497B',
    ContainerLine: '#575086',
    OnContainer: '#E3E1F7',
  },

  Secondary: {
    Main: '#FFFFFF',
    MainHover: '#E5E5E5',
    MainActive: '#D9D9D9',
    MainLine: '#CCCCCC',
    OnMain: '#1A1A1A',
    Container: '#404040',
    ContainerHover: '#4D4D4D',
    ContainerActive: '#595959',
    ContainerLine: '#666666',
    OnContainer: '#F2F2F2',
  },

  Success: {
    Main: '#85E0BA',
    MainHover: '#70DBAF',
    MainActive: '#66D9A9',
    MainLine: '#5CD6A3',
    OnMain: '#0F3D2A',
    Container: '#175C3F',
    ContainerHover: '#1A6646',
    ContainerActive: '#1C704D',
    ContainerLine: '#1F7A54',
    OnContainer: '#CCF2E2',
  },

  Warning: {
    Main: '#E3BA91',
    MainHover: '#DFAF7E',
    MainActive: '#DDA975',
    MainLine: '#DAA36C',
    OnMain: '#3F2A15',
    Container: '#5E3F20',
    ContainerHover: '#694624',
    ContainerActive: '#734D27',
    ContainerLine: '#7D542B',
    OnContainer: '#F3E2D1',
  },

  Critical: {
    Main: '#E69D9D',
    MainHover: '#E28D8D',
    MainActive: '#E08585',
    MainLine: '#DE7D7D',
    OnMain: '#401C1C',
    Container: '#602929',
    ContainerHover: '#6B2E2E',
    ContainerActive: '#763333',
    ContainerLine: '#803737',
    OnContainer: '#F5D6D6',
  },

  Other: {
    FocusRing: 'rgba(255, 255, 255, 0.5)',
    Shadow: 'rgba(0, 0, 0, 1)',
    Overlay: 'rgba(0, 0, 0, 0.8)',
  },
};

export const darkTheme = createTheme(color, darkThemeData);

export const butterTheme = createTheme(color, {
  ...darkThemeData,
  Background: {
    Container: '#1A1916',
    ContainerHover: '#262621',
    ContainerActive: '#33322C',
    ContainerLine: '#403F38',
    OnContainer: '#FFFBDE',
  },

  Surface: {
    Container: '#262621',
    ContainerHover: '#33322C',
    ContainerActive: '#403F38',
    ContainerLine: '#4D4B43',
    OnContainer: '#FFFBDE',
  },

  SurfaceVariant: {
    Container: '#33322C',
    ContainerHover: '#403F38',
    ContainerActive: '#4D4B43',
    ContainerLine: '#59584E',
    OnContainer: '#FFFBDE',
  },

  Secondary: {
    Main: '#FFFBDE',
    MainHover: '#E5E2C8',
    MainActive: '#D9D5BD',
    MainLine: '#CCC9B2',
    OnMain: '#1A1916',
    Container: '#403F38',
    ContainerHover: '#4D4B43',
    ContainerActive: '#59584E',
    ContainerLine: '#666459',
    OnContainer: '#F2EED3',
  },
});

export const whatsappLightTheme = createTheme(color, {
  Background: {
    Container: '#F0F2F5',
    ContainerHover: '#E4E6E8',
    ContainerActive: '#D7DADF',
    ContainerLine: '#CBD0D4',
    OnContainer: '#111B21',
  },

  Surface: {
    Container: '#FFFFFF',
    ContainerHover: '#F5F6F6',
    ContainerActive: '#E9EDEF',
    ContainerLine: '#D1D7DB',
    OnContainer: '#111B21',
  },

  SurfaceVariant: {
    Container: '#E9EDEF',
    ContainerHover: '#DDE2E6',
    ContainerActive: '#D0D6DA',
    ContainerLine: '#C3CAD0',
    OnContainer: '#111B21',
  },

  Primary: {
    Main: '#008069',
    MainHover: '#006F5B',
    MainActive: '#005C4B',
    MainLine: '#005748',
    OnMain: '#FFFFFF',
    Container: '#D9FDD3',
    ContainerHover: '#C9F7C0',
    ContainerActive: '#B8F0AE',
    ContainerLine: '#A8E8A0',
    OnContainer: '#0B4F27',
  },

  Secondary: {
    Main: '#54656F',
    MainHover: '#465861',
    MainActive: '#394B54',
    MainLine: '#31434B',
    OnMain: '#FFFFFF',
    Container: '#E9EDEF',
    ContainerHover: '#DDE2E6',
    ContainerActive: '#D0D6DA',
    ContainerLine: '#C3CAD0',
    OnContainer: '#26343B',
  },

  Success: {
    Main: '#008069',
    MainHover: '#006F5B',
    MainActive: '#005C4B',
    MainLine: '#005748',
    OnMain: '#FFFFFF',
    Container: '#D9FDD3',
    ContainerHover: '#C9F7C0',
    ContainerActive: '#B8F0AE',
    ContainerLine: '#A8E8A0',
    OnContainer: '#0B4F27',
  },

  Warning: {
    Main: '#A35A00',
    MainHover: '#8F4D00',
    MainActive: '#7A4100',
    MainLine: '#6D3900',
    OnMain: '#FFFFFF',
    Container: '#FFF1C7',
    ContainerHover: '#FFE8A3',
    ContainerActive: '#FFDF80',
    ContainerLine: '#F5D56E',
    OnContainer: '#5C3B00',
  },

  Critical: {
    Main: '#B3261E',
    MainHover: '#9E211A',
    MainActive: '#8A1C16',
    MainLine: '#7A1914',
    OnMain: '#FFFFFF',
    Container: '#F9DEDC',
    ContainerHover: '#F5CECA',
    ContainerActive: '#F0BDB8',
    ContainerLine: '#E7AAA4',
    OnContainer: '#601410',
  },

  Other: {
    FocusRing: 'rgba(0 128 105 / 50%)',
    Shadow: 'rgba(17 27 33 / 20%)',
    Overlay: 'rgba(17 27 33 / 50%)',
  },
});

export const whatsappDarkTheme = createTheme(color, {
  Background: {
    Container: '#111B21',
    ContainerHover: '#182229',
    ContainerActive: '#202C33',
    ContainerLine: '#2A3942',
    OnContainer: '#E9EDEF',
  },

  Surface: {
    Container: '#202C33',
    ContainerHover: '#2A3942',
    ContainerActive: '#334550',
    ContainerLine: '#3B4A54',
    OnContainer: '#E9EDEF',
  },

  SurfaceVariant: {
    Container: '#182229',
    ContainerHover: '#202C33',
    ContainerActive: '#2A3942',
    ContainerLine: '#334550',
    OnContainer: '#E9EDEF',
  },

  Primary: {
    Main: '#00A884',
    MainHover: '#06BF97',
    MainActive: '#0AD3A5',
    MainLine: '#0BBF96',
    OnMain: '#062C24',
    Container: '#005C4B',
    ContainerHover: '#006D59',
    ContainerActive: '#007A64',
    ContainerLine: '#00866F',
    OnContainer: '#D9FDD3',
  },

  Secondary: {
    Main: '#AEBAC1',
    MainHover: '#C5D0D5',
    MainActive: '#D4DEE2',
    MainLine: '#DDE5E8',
    OnMain: '#182229',
    Container: '#2A3942',
    ContainerHover: '#334550',
    ContainerActive: '#3B4A54',
    ContainerLine: '#465963',
    OnContainer: '#E9EDEF',
  },

  Success: {
    Main: '#00A884',
    MainHover: '#06BF97',
    MainActive: '#0AD3A5',
    MainLine: '#0BBF96',
    OnMain: '#062C24',
    Container: '#005C4B',
    ContainerHover: '#006D59',
    ContainerActive: '#007A64',
    ContainerLine: '#00866F',
    OnContainer: '#D9FDD3',
  },

  Warning: {
    Main: '#F0B04D',
    MainHover: '#F4BB65',
    MainActive: '#F7C67C',
    MainLine: '#F7CE8D',
    OnMain: '#33230B',
    Container: '#5C421C',
    ContainerHover: '#6B4D20',
    ContainerActive: '#795724',
    ContainerLine: '#876328',
    OnContainer: '#FFE8B3',
  },

  Critical: {
    Main: '#F28B82',
    MainHover: '#F5A09A',
    MainActive: '#F7B2AD',
    MainLine: '#F8BEB9',
    OnMain: '#3A0E0B',
    Container: '#6B2A26',
    ContainerHover: '#7B302B',
    ContainerActive: '#8B3731',
    ContainerLine: '#9A3D36',
    OnContainer: '#F9DEDC',
  },

  Other: {
    FocusRing: 'rgba(0 168 132 / 60%)',
    Shadow: 'rgba(0 0 0 / 70%)',
    Overlay: 'rgba(0 0 0 / 80%)',
  },
});
