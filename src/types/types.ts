import type {
  DefinitionVersion,
  KeyboardDefinitionIndex,
  KeyboardDictionary,
  LightingValue,
  VIAMenu,
} from '@the-via/reader';
import {TestKeyboardSoundsMode} from 'src/components/void/test-keyboard-sounds';

export enum TestKeyState {
  Initial,
  KeyDown,
  KeyUp,
}

export type HIDColor = {
  hue: number;
  sat: number;
};

export type LightingData = Partial<{[key in LightingValue]: number[]}> & {
  customColors?: HIDColor[];
};

export type DeviceInfo = {
  vendorId: number;
  productId: number;
  productName: string;
  protocol?: number;
};

export type Device = DeviceInfo & {
  path: string;
  productName: string;
  interface: number;
};

export type Keymap = number[];
export type Layer = {
  keymap: Keymap;
  isLoaded: boolean;
};

export type DeviceLayerMap = {[devicePath: string]: Layer[]};

export type WebVIADevice = Device & {
  _device: HIDDevice;
};

// Refers to a device that may or may not have an associated definition but does have a valid protocol version
export type AuthorizedDevice = DeviceInfo & {
  path: string;
  vendorProductId: number;
  protocol: number;
  requiredDefinitionVersion: DefinitionVersion;
  hasResolvedDefinition: false;
  firmware: number;
};

export type ConnectedDevice = DeviceInfo & {
  path: string;
  vendorProductId: number;
  protocol: number;
  requiredDefinitionVersion: DefinitionVersion;
  hasResolvedDefinition: true;
  firmware: number;
};

export type AuthorizedDevices = Record<string, AuthorizedDevice>;
export type ConnectedDevices = Record<string, ConnectedDevice>;

export type MacroEditorSettings = {
  recordDelaysEnabled: boolean;
  smartOptimizeEnabled: boolean;
  tapEnterAtEOMEnabled: boolean;
};

export type TestKeyboardSoundsSettings = {
  isEnabled: boolean;
  volume: number;
  waveform: OscillatorType;
  mode: TestKeyboardSoundsMode;
  transpose: number;
};

export type Settings = {
  showDesignTab: boolean;
  disableFastRemap: boolean;
  renderMode: '3D' | '2D';
  themeMode: 'light' | 'dark';
  themeName: string;
  macroEditor: MacroEditorSettings;
  testKeyboardSoundsSettings: TestKeyboardSoundsSettings;
  designDefinitionVersion: DefinitionVersion;
};

export type CommonMenusMap = {
  [menu: string]: VIAMenu[];
};

export type StoreData = {
  definitionIndex: DefinitionIndex;
  definitions: KeyboardDictionary;
  settings: Settings;
};

export type VendorProductIdMap = Record<number, {v2: boolean; v3: boolean}>;

export type DefinitionIndex = Pick<
  KeyboardDefinitionIndex,
  'generatedAt' | 'version' | 'theme'
> & {
  supportedVendorProductIdMap: VendorProductIdMap;
  hash: string;
};

export type EncoderBehavior = [number, number, number];

export enum DKSPoint {
  Hold = 0,
  Down = 1,
  Up = 2,
  Single = 3,
}

export type DKSKey = number;

export type DKSAction = {
  key: DKSKey;
  points: [DKSPoint, DKSPoint, DKSPoint, DKSPoint];
};

export type DKSActions = [DKSAction, DKSAction, DKSAction, DKSAction];

export type DKSPointLength = [number, number, number, number];

export type DKSData = {
  actuation: number;
  actions: DKSActions;
} | null;

export type DksMap = {[devicePath: string]: DKSData[][]};

export type ActuationMenu = 'AP' | 'RT' | 'DKS' | 'SELF CHECK';

export type ActuationData = {
  actuationPoint?: number;
  rtSensitivity?: number;
  rt2ndSensitivity?: number;
};

export type ScreenTool = 'image' | 'video' | 'slider';

export type ScreenFileType = {
  label: string;
  type: 'video' | 'image';
  format: 'ASTS' | 'ABKG' | 'ANIM' | 'ANIT';
  orientations: number;
  owidth: number;
  oheight: number;
  animFramesLimit: number;
};

export type ScreenConfig = {
  menus: ScreenTool[];
  fileTypes: ScreenFileType[];
  swapBit: boolean;
};

export type MatrixLightingConfig = {
  cols: number;
  rows: number;
  cdc: boolean;
  importEnable: boolean;
  maxFrame: number;
};

export type TabkbConfig = {
  vendorId: string;
  productId: string;
  cdc: boolean;
  firmware: string;
  firmwareFile: string;
  screen: ScreenConfig;
  actuation: boolean;
  matrixLighting: MatrixLightingConfig;
};

export interface TabFileAPI {
  setTabFile: (
    data: number[],
    onProgress?: (sended: number) => void,
    cancel?: () => boolean,
  ) => void;
}

export interface MatrixLightingAPI {
  setMatrixLighting: (
    frames: number,
    fps: number,
    rows: number,
    cols: number,
    data: number[],
  ) => Promise<void>;
}
