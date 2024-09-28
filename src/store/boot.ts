import {PayloadAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {getSelectedConnectedDevice, selectDevice} from './devicesSlice';
import {AppThunk, RootState} from '.';
import {CDCDevice, TabKeyboardAPI} from 'src/utils/tab-cdc-api';
import {throttle} from 'lodash';
import {getSelectedTabkbConfig} from './tabkbConfigSlice';
import {ConnectedDevice, DeviceInfo} from 'src/types/types';

type bootState = {
  bytesSended: number;
  bufferSize: number;
  started: number;
  lastUpdate: number;
  sendSpeed: number;
  state: 'waiting' | 'saving' | 'completed' | 'failed' | 'canceled';
};

const initialState: bootState = {
  bytesSended: 0,
  bufferSize: 0,
  started: 0,
  lastUpdate: 0,
  sendSpeed: 0,
  state: 'waiting',
};

const bootSlice = createSlice({
  name: 'boot',
  initialState,
  reducers: {
    updateState(state, action: PayloadAction<bootState['state']>) {
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
  bootSlice.actions;

export default bootSlice.reducer;

export const saveTabFirmware =
  (data: Uint8Array): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    if (getSavingState(state) === 'saving') {
      return;
    }

    const device: CDCDevice = {
      path: 'boot',
      vendorId: 0x54ab,
      productId: 0x4254,
    };

    const tabApi = new TabKeyboardAPI(device);
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

export const getBytesSended = (state: RootState) => state.boot.bytesSended;
export const getBufferSize = (state: RootState) => state.boot.bufferSize;
export const getStarted = (state: RootState) => state.boot.started;
export const getSendSpeed = (state: RootState) => state.boot.sendSpeed;
export const getSavingState = (state: RootState) => state.boot.state;
