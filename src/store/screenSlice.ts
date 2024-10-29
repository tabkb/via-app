import type {AppThunk, RootState} from './index';
import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {getSelectedConnectedDevice, selectDevice} from './devicesSlice';
import {ScreenConfig, ScreenFileType, ScreenTool} from 'src/types/types';

import {throttle} from 'lodash';
import {getSelectedTabkbConfig, getTabFileAPI} from './tabkbConfigSlice';

const KBRE_FLAGS_SWAP_BIT = 1 << 0;

type screenState = {
  selectedTool: ScreenTool;
  toolConfigs: {
    [venderProductId: number]: {
      [tool: string]: {area: ScreenConfig};
    };
  };
  state: 'waiting' | 'saving' | 'completed' | 'failed' | 'canceled';
  bytesSended: number;
  bufferSize: number;
  started: number;
  lastUpdate: number;
  sendSpeed: number;
};

const initialState: screenState = {
  selectedTool: 'video',
  toolConfigs: {},
  state: 'waiting',
  bytesSended: 0,
  bufferSize: 0,
  started: 0,
  lastUpdate: 0,
  sendSpeed: 0,
};

const screenSlice = createSlice({
  name: 'screen',
  initialState,
  reducers: {
    updateTool: (state, action: PayloadAction<ScreenTool>) => {
      state.selectedTool = action.payload;
    },
    updateState(state, action: PayloadAction<screenState['state']>) {
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
    updateStarted: (state) => {
      const t = Date.now();
      state.started = t;
      state.lastUpdate = t;
      state.sendSpeed = 0;
      state.state = 'saving';
    },
    initSendState: (state, action: PayloadAction<{size: number}>) => {
      const {size} = action.payload;
      state.bufferSize = size;
      state.state = 'waiting';
      state.bytesSended = 0;
    },
  },
  extraReducers(builder) {
    builder.addCase(selectDevice, (state) => {
      state.state = 'waiting';
      state.bytesSended = 0;
    });
  },
});

export const {
  updateTool,
  updateBytesSended,
  updateStarted,
  updateState,
  initSendState,
} = screenSlice.actions;

export default screenSlice.reducer;

export const saveTabFile =
  (data: Uint8Array, reslove: (success: boolean) => void): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    const selectedDevice = getSelectedConnectedDevice(state);

    if (!selectedDevice) {
      return;
    }

    if (getSavingState(state) === 'saving') {
      return;
    }

    const api = getTabFileAPI(state);
    if (!api) {
      return;
    }

    const onProgress = throttle((sended) => {
      dispatch(updateBytesSended(sended));
    }, 1000);

    try {
      dispatch(updateStarted());
      await api.setTabFile(
        Array.from(data),
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
      reslove(false);
      dispatch(updateState('failed'));
    } finally {
      onProgress.cancel();
    }
  };

export const getSelectedTool = (state: RootState) => state.screen.selectedTool;
export const getToolConfigs = (state: RootState) => state.screen.toolConfigs;
export const getBytesSended = (state: RootState) => state.screen.bytesSended;
export const getBufferSize = (state: RootState) => state.screen.bufferSize;
export const getStarted = (state: RootState) => state.screen.started;
export const getSendSpeed = (state: RootState) => state.screen.sendSpeed;
export const getSavingState = (state: RootState) => state.screen.state;

export const getDeviceConfig = createSelector(
  getSelectedTabkbConfig,
  (config) => {
    if (!config || !config['screen']) {
      return undefined;
    }
    return config['screen'];
  },
);

export const getExportOptions = createSelector(
  getDeviceConfig,
  getSelectedTool,
  (config, tool) => {
    if (config && config.fileTypes) {
      const types = config.fileTypes;
      switch (tool) {
        case 'image':
          return types.filter((c: ScreenFileType) => c.type === 'image');
        case 'video':
          return types.filter((c: ScreenFileType) => c.type === 'video');
        case 'slider':
          return types.filter((c: ScreenFileType) => c.type === 'slider');
      }
    }
    return undefined;
  },
);

export const getDefaultArea = createSelector(
  getSelectedTool,
  getExportOptions,
  (tool, options) => {
    if (options !== undefined) {
      return options[0];
    }
    return undefined;
  },
);

export const getScreenMenus = createSelector(getDeviceConfig, (config) => {
  if (config && config.menus) {
    return config.menus;
  }
  return [];
});

export const getKbresFlags = createSelector(getDeviceConfig, (config) => {
  if (!config) {
    return 0;
  }
  let flags = 0;
  if (config.swapBit) {
    flags |= KBRE_FLAGS_SWAP_BIT;
  }
  return flags;
});
