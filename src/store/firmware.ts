import {PayloadAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {getSelectedConnectedDevice, selectDevice} from './devicesSlice';
import {AppThunk, RootState} from '.';
import {TabKeyboardAPI} from 'src/utils/tab-cdc-api';
import {throttle} from 'lodash';
import {getSelectedTabkbConfig} from './tabkbConfigSlice';

type firmwareState = {
  bytesSended: number;
  bufferSize: number;
  started: number;
  lastUpdate: number;
  sendSpeed: number;
  state: 'waiting' | 'saving' | 'completed' | 'failed' | 'canceled';
};

const initialState: firmwareState = {
  bytesSended: 0,
  bufferSize: 0,
  started: 0,
  lastUpdate: 0,
  sendSpeed: 0,
  state: 'waiting',
};

const firmwareSlice = createSlice({
  name: 'firmware',
  initialState,
  reducers: {
    updateState(state, action: PayloadAction<firmwareState['state']>) {
      state.bytesSended = 0;
      state.state = action.payload;
    },
    updateBytesSended: (state, action: PayloadAction<number>) => {
      const sended = action.payload - state.bytesSended;
      state.bytesSended = action.payload;
      const t = Date.now();
      state.sendSpeed = ~~(sended / ((t - state.lastUpdate) / 1000));
      state.lastUpdate = t;
    },
    updateStarted: (state, action: PayloadAction<{size: number}>) => {
      const {size} = action.payload;
      const t = Date.now();
      state.started = t;
      state.lastUpdate = t;
      state.sendSpeed = 0;
      state.state = 'saving';
      state.bytesSended = 0;
      state.bufferSize = size;
    },
  },
  extraReducers(builder) {
    builder.addCase(selectDevice, (state) => {
      state.state = 'waiting';
      state.bytesSended = 0;
    });
  },
});

export const {updateState, updateBytesSended, updateStarted} =
  firmwareSlice.actions;

export default firmwareSlice.reducer;

export const saveTabFirmware =
  (data: Uint8Array): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    if (getSavingState(state) === 'saving') {
      return;
    }

    const selectedDevice = getSelectedConnectedDevice(state);

    if (!selectedDevice) {
      return;
    }

    const tabApi = new TabKeyboardAPI(selectedDevice);
    if (!tabApi) {
      return;
    }

    const onProgress = throttle((sended) => {
      dispatch(updateBytesSended(sended));
    }, 1000);

    const buffer = Array.from(data);

    try {
      dispatch(updateStarted({size: data.length}));

      const ok = await tabApi.setTabFirmwareInfo(
        data.length,
        buffer.slice(0, 32),
      );
      if (!ok) {
        dispatch(updateState('failed'));
        return;
      }

      await tabApi.setTabFirmwareBuffer(
        buffer,
        (sended) => {
          onProgress(sended);
        },
        () => {
          return getSavingState(getState()) === 'canceled';
        },
      );
      if (getSavingState(getState()) !== 'canceled') {
        dispatch(updateState('completed'));
      }
    } catch (error) {
      console.log(error);
      dispatch(updateState('failed'));
    } finally {
      onProgress.cancel();
    }
  };

export const getBytesSended = (state: RootState) => state.firmware.bytesSended;
export const getBufferSize = (state: RootState) => state.firmware.bufferSize;
export const getStarted = (state: RootState) => state.firmware.started;
export const getSendSpeed = (state: RootState) => state.firmware.sendSpeed;
export const getSavingState = (state: RootState) => state.firmware.state;

// 16bit [8.4.4]
export const getSelectedDeviceFirmwareVersion = createSelector(
  getSelectedConnectedDevice,
  (device) => {
    if (device && device.firmware) {
      return `${(device.firmware >> 8) & 0xff}.${
        (device.firmware >> 4) & 0xf
      }.${device.firmware & 0xf}`;
    }
    return '';
  },
);

export const getCfgFirmwareVersion = createSelector(
  getSelectedTabkbConfig,
  (config) => {
    if (!config || !config.firmware) {
      return '0.0.0';
    }
    return config.firmware;
  },
);

export const getCfgFirmwareVerNum = createSelector(
  getCfgFirmwareVersion,
  (version) => {
    const v = version.split('.');
    if (v.length !== 3) {
      return 0;
    }
    return (parseInt(v[0]) << 8) | (parseInt(v[1]) << 4) | parseInt(v[2]);
  },
);

export const getCfgFirmwareFile = createSelector(
  getSelectedTabkbConfig,
  (config) => {
    return config && config.firmwareFile ? config.firmwareFile : '';
  },
);

export const getFirmwareNeedUpdate = createSelector(
  getSelectedConnectedDevice,
  getCfgFirmwareVerNum,
  getCfgFirmwareFile,
  (device, verNum, file) => {
    if (!device || !file || !verNum || !device.firmware) {
      return false;
    }
    return device.firmware < verNum;
  },
);
