import {ThreeEvent} from '@react-three/fiber';
import {VIADefinitionV2, VIADefinitionV3, VIAKey} from '@the-via/reader';
import {ActuationData, DKSData, TestKeyState} from 'src/types/types';
import {BufferGeometry} from 'three';

export enum DisplayMode {
  Test = 1,
  Configure = 2,
  Design = 3,
  ConfigureColors = 4,
  ConfigureDKS = 5,
  ConfigureAP = 6,
  ConfigureRT = 7,
}

export enum KeycapState {
  Pressed = 1,
  Unpressed = 2,
}

export type KeyColorPair = {
  c: string;
  t: string;
};

export type NDimension = '2D' | '3D';

export type KeyboardCanvasContentProps<T> = {
  selectable: boolean;
  multiSelect?: boolean;
  matrixKeycodes: number[];
  keys: (VIAKey & {ei?: number})[];
  definition: VIADefinitionV2 | VIADefinitionV3;
  pressedKeys?: TestKeyState[];
  mode: DisplayMode;
  showMatrix?: boolean;
  selectedKey?: number;
  keyColors?: number[][];
  onKeycapPointerDown?: (e: T, idx: number) => void;
  onKeycapPointerOver?: (e: T, idx: number) => void;
  width: number;
  height: number;
};

export type KeyboardCanvasProps<T> = Omit<
  KeyboardCanvasContentProps<T>,
  'width' | 'height'
> & {
  shouldHide?: boolean;
  containerDimensions: DOMRect;
};

export type KeyGroupProps<T> = {
  selectable?: boolean;
  multiSelect?: boolean;
  keys: VIAKey[];
  matrixKeycodes: number[];
  definition: VIADefinitionV2 | VIADefinitionV3;
  mode: DisplayMode;
  pressedKeys?: TestKeyState[];
  keyColors?: number[][];
  selectedKey?: number;
  onKeycapPointerDown?: (e: T, idx: number) => void;
  onKeycapPointerOver?: (e: T, idx: number) => void;
};

export type KeyCoords<T> = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: KeyColorPair;
  idx: number;
  meshKey: string;
  onClick: (e: T, idx: number) => void;
  onPointerDown?: (e: T, idx: number) => void;
  onPointerOver?: (e: T, idx: number) => void;
};

export type KeysKeys<T> = {
  indices: string[];
  coords: KeyCoords<T>[];
};

export type KeycapSharedProps<T> = {
  label: any;
  selected: boolean;
  multiSelected: boolean;
  disabled: boolean;
  keyState: number;
  shouldRotate: boolean;
  textureOffsetX: number;
  textureWidth: number;
  textureHeight: number;
  mode: DisplayMode;
  key: string;
  skipFontCheck: boolean;
  dksData: DKSData;
  actuation: ActuationData | undefined;
  multiSelect: boolean;
} & Omit<KeyCoords<T>, 'meshKey'>;

export type TwoStringKeycapProps = {
  clipPath: null | string;
} & KeycapSharedProps<React.MouseEvent<Element, MouseEvent>>;

export type ThreeFiberKeycapProps = {
  keycapGeometry: BufferGeometry;
} & KeycapSharedProps<ThreeEvent<MouseEvent>>;
