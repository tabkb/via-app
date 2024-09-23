import {DKSAction, DKSActions, DKSData} from 'src/types/types';
import {KeyboardAPI, shiftFrom16Bit, shiftTo16Bit} from './keyboard-api';

const MIN_KB_ACTUATION = 0;
const MAX_KB_ACTUATION = 200;

const MIN_ACTUATION = 0;
const MAX_ACTUATION = 4;

const ACTUATION_MULTIPLE =
  (MAX_KB_ACTUATION - MIN_KB_ACTUATION) / (MAX_ACTUATION - MIN_ACTUATION);

enum ActuationCommand {
  SELF_CHECK_GET_RESULT = 0x01,
  SELF_CHECK = 0x02,

  AP_GET_ENABLED = 0x03,
  AP_SET_ENABLED = 0x04,
  AP_GLOBAL_GET_VALUE = 0x05,
  AP_GLOBAL_SET_VALUE = 0x06,
  AP_GET_BUFFER_SIZE = 0x07,
  AP_GET_BUFFER = 0x08,
  AP_SET_VALUE = 0x09,

  RT_GET_ENABLED = 0x0a,
  RT_SET_ENABLED = 0x0b,
  RT_GET_CONTINUOUS_ENABLED = 0x0c,
  RT_SET_CONTINUOUS_ENABLED = 0x0d,
  RT_GET_BUFFER_SIZE = 0x0e,
  RT_GET_BUFFER = 0x0f,
  RT_SET_VALUE = 0x10,

  DKS_GET_ACTUATION = 0x20,
  DKS_GET_COUNT = 0x21,
  DKS_GET_VALUE = 0x22,
  DKS_SET_VALUE = 0x23,
  DKS_DELETE = 0x24,
}

const actuationFromKeyboard = (value: number) => {
  if (value === undefined) {
    return 0;
  }
  return value / ACTUATION_MULTIPLE;
};

const actuationToKeyboard = (value: number) => {
  if (value === undefined) {
    return 0;
  }
  return ~~(value * ACTUATION_MULTIPLE);
};

export class ActuationApi {
  constructor(private keyboardApi: KeyboardAPI) {}

  async getSelfCheckResult() {
    const [, , result] = await this.keyboardApi.actuationCommand(
      ActuationCommand.SELF_CHECK_GET_RESULT,
    );
    return !!result;
  }

  async selfCheck() {
    await this.keyboardApi.actuationCommand(ActuationCommand.SELF_CHECK);
  }

  async getAPEnabled() {
    const [, , enabled] = await this.keyboardApi.actuationCommand(
      ActuationCommand.AP_GET_ENABLED,
    );
    return !!enabled;
  }

  async setAPEnabled(enabled: boolean) {
    await this.keyboardApi.actuationCommand(ActuationCommand.AP_SET_ENABLED, [
      Number(enabled),
    ]);
  }

  async getAPGlobalValue() {
    const [, , value] = await this.keyboardApi.actuationCommand(
      ActuationCommand.AP_GLOBAL_GET_VALUE,
    );
    return actuationFromKeyboard(value);
  }

  async setAPGlobalValue(value: number) {
    await this.keyboardApi.actuationCommand(
      ActuationCommand.AP_GLOBAL_SET_VALUE,
      [actuationToKeyboard(value)],
    );
  }

  async getAPBufferSize() {
    const [, , hi, lo] = await this.keyboardApi.actuationCommand(
      ActuationCommand.AP_GET_BUFFER_SIZE,
    );
    return shiftTo16Bit([hi, lo]);
  }

  async getAPBytes() {
    const bufferSize = await this.getAPBufferSize();
    const size = 27;
    const bytesP = [];
    for (let offset = 0; offset < bufferSize; offset += size) {
      bytesP.push(
        this.keyboardApi.actuationCommand(ActuationCommand.AP_GET_BUFFER, [
          ...shiftFrom16Bit(offset),
          Math.min(bufferSize - offset, size),
        ]),
      );
    }
    const allBytes = await Promise.all(bytesP);
    return allBytes.flatMap((bytes) => bytes.slice(5));
  }

  async getAPData(keysLength: number) {
    const bytes = await this.getAPBytes();
    const data = [];
    for (let i = 0; i < keysLength; i++) {
      data[i] = bytes[i] ? actuationFromKeyboard(bytes[i]) : 0;
    }
    return data;
  }

  async setAPValue(row: number, col: number, value: number) {
    await this.keyboardApi.actuationCommand(ActuationCommand.AP_SET_VALUE, [
      row,
      col,
      actuationToKeyboard(value),
    ]);
  }

  async getRTEnabled() {
    const [, , enabled] = await this.keyboardApi.actuationCommand(
      ActuationCommand.RT_GET_ENABLED,
    );
    return !!enabled;
  }

  async setRTEnabled(enabled: boolean) {
    await this.keyboardApi.actuationCommand(ActuationCommand.RT_SET_ENABLED, [
      Number(enabled),
    ]);
  }

  async getRTContinuousEnabled() {
    const [, , enabled] = await this.keyboardApi.actuationCommand(
      ActuationCommand.RT_GET_CONTINUOUS_ENABLED,
    );
    return !!enabled;
  }

  async setRTContinuousEnabled(enabled: boolean) {
    await this.keyboardApi.actuationCommand(
      ActuationCommand.RT_SET_CONTINUOUS_ENABLED,
      [Number(enabled)],
    );
  }

  async getRTBufferSize() {
    const [, , hi, lo] = await this.keyboardApi.actuationCommand(
      ActuationCommand.RT_GET_BUFFER_SIZE,
    );
    return shiftTo16Bit([hi, lo]);
  }

  async getRTBytes() {
    const bufferSize = await this.getRTBufferSize();
    const size = 26;
    const bytesP = [];
    for (let offset = 0; offset < bufferSize; offset += size) {
      bytesP.push(
        this.keyboardApi.actuationCommand(ActuationCommand.RT_GET_BUFFER, [
          ...shiftFrom16Bit(offset),
          Math.min(bufferSize - offset, size),
        ]),
      );
    }
    const allBytes = await Promise.all(bytesP);
    return allBytes.flatMap((bytes) => bytes.slice(5, 31));
  }

  async getRTData(keysLength: number) {
    const bytes = await this.getRTBytes();
    const data = [];
    for (let i = 0; i < keysLength; i++) {
      const rtSens = bytes[i * 2] ? actuationFromKeyboard(bytes[i * 2]) : 0;
      const rt2ndSens = bytes[i * 2 + 1]
        ? actuationFromKeyboard(bytes[i * 2 + 1])
        : 0;
      data[i] = [rtSens, rt2ndSens];
    }
    return data;
  }

  async setRTValue(
    row: number,
    col: number,
    rtSensitivity: number,
    rt2ndSensitivity: number,
  ) {
    await this.keyboardApi.actuationCommand(ActuationCommand.RT_SET_VALUE, [
      row,
      col,
      actuationToKeyboard(rtSensitivity), // press
      actuationToKeyboard(rt2ndSensitivity), // release
    ]);
  }

  async getDKSActuation() {
    const [, , act1, act2] = await this.keyboardApi.actuationCommand(
      ActuationCommand.DKS_GET_ACTUATION,
    );
    return [actuationFromKeyboard(act1), actuationFromKeyboard(act2)];
  }

  async getDKSCount() {
    const [, , hi, lo] = await this.keyboardApi.actuationCommand(
      ActuationCommand.DKS_GET_COUNT,
    );
    return shiftTo16Bit([hi, lo]);
  }

  async getDKSValues(): Promise<
    {layer: number; row: number; col: number; dks: DKSData}[]
  > {
    const count = await this.getDKSCount();
    if (count === 0) {
      return [];
    }

    const cmdsP = [];

    for (let i = 0; i < count; i++) {
      cmdsP.push(
        this.keyboardApi.actuationCommand(
          ActuationCommand.DKS_GET_VALUE,
          shiftFrom16Bit(i),
        ),
      );
    }

    const allBytes = await Promise.all(cmdsP);

    return allBytes.map((bytes) => {
      const [, , , , layer, row, col, actuation, ...data] = bytes;
      const actions: DKSAction[] = [];
      for (let i = 0; i < 4; i++) {
        const [hi, lo, p] = data.slice(i * 3, i * 3 + 3);
        actions.push({
          key: shiftTo16Bit([hi, lo]),
          points: [(p >> 6) & 3, (p >> 4) & 3, (p >> 2) & 3, p & 3],
        });
      }
      const dks = {
        actuation: actuationFromKeyboard(actuation),
        actions: actions as DKSActions,
      } as DKSData;
      console.log(
        JSON.stringify({
          layer,
          row,
          col,
          dks,
        }),
      );
      return {
        layer,
        row,
        col,
        dks,
      };
    });
  }

  async setDksValue(layer: number, row: number, col: number, value: DKSData) {
    if (value === null) {
      await this.keyboardApi.actuationCommand(ActuationCommand.DKS_DELETE, [
        layer,
        row,
        col,
      ]);
      return;
    }
    const keyActionBytes = value.actions.flatMap((a) => [
      ...shiftFrom16Bit(a.key),
      a.points
        .map((p, idx) => p << ((3 - idx) * 2))
        .reduce((p, b) => (b |= p), 0),
    ]);
    console.log(
      JSON.stringify({
        layer,
        row,
        col,
        actuation: value.actuation,
        keyActionBytes,
      }),
    );
    const bytes = [
      layer,
      row,
      col,
      actuationToKeyboard(value.actuation),
      ...keyActionBytes,
    ];
    console.log(bytes);
    await this.keyboardApi.actuationCommand(
      ActuationCommand.DKS_SET_VALUE,
      bytes,
    );
  }
}

export const getActuationApi = (keyboardApi: KeyboardAPI) => {
  return new ActuationApi(keyboardApi);
};
