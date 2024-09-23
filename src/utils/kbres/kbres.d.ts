// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
  ___set_stack_limits(_0: number, _1: number): void;
}

export interface IntVec {
  push_back(_0: number): void;
  resize(_0: number, _1: number): void;
  size(): number;
  get(_0: number): number | undefined;
  set(_0: number, _1: number): boolean;
  delete(): void;
}

export interface StrVec {
  size(): number;
  get(_0: number): ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string | undefined;
  push_back(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): void;
  resize(_0: number, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): void;
  set(_0: number, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): boolean;
  delete(): void;
}

interface EmbindModule {
  IntVec: {new(): IntVec};
  StrVec: {new(): StrVec};
  hello(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): number;
  convert_image(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: IntVec, _4: IntVec, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): number;
  convert_image_ext(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: IntVec, _4: IntVec, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _7: number): number;
  convert_image_folder(_0: StrVec, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: number, _4: number, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): number;
  convert_image_folder_ext(_0: StrVec, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: number, _4: number, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _7: number): number;
  convert_video(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: IntVec, _4: IntVec, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _7: number): number;
  convert_video_ext(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: number, _3: IntVec, _4: IntVec, _5: IntVec, _6: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _7: number, _8: number): number;
  pixelit(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _1: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string, _2: IntVec, _3: number): number;
}
export type MainModule = WasmModule & EmbindModule;
