import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {AppThunk, RootState} from './index';
import {getVendorProductId} from 'src/utils/hid-keyboards';
import {getSelectedDefinition} from './definitionsSlice';
import {MatrixLightingAPI, TabFileAPI, TabkbConfig} from 'src/types/types';
import {
  getSelectedConnectedDevice,
  getSelectedDevicePath,
} from './devicesSlice';
import {KeyboardAPI} from 'src/utils/keyboard-api';
import {TabKeyboardAPI} from 'src/utils/tab-cdc-api';
import {IKeycode} from 'src/utils/key';

type tabkbConfigState = {
  configs: {[vendorProductId: number]: TabkbConfig};
};

const tabkbConfigSlice = createSlice({
  name: 'tabkbconfig',
  initialState: {
    configs: {},
  } as tabkbConfigState,
  reducers: {
    setTabkbConfigs(state, action: PayloadAction<tabkbConfigState['configs']>) {
      state.configs = action.payload;
    },
  },
});

export const {setTabkbConfigs} = tabkbConfigSlice.actions;

export default tabkbConfigSlice.reducer;

export const loadTabkbConfigs = (): AppThunk => async (dispatch, getState) => {
  const response = await fetch('/tabkb/configs.json', {
    cache: 'reload',
  });
  const loadConfigs: TabkbConfig[] = await response.json();
  let configs: tabkbConfigState['configs'] = {};
  for (const c of loadConfigs) {
    if (!c.vendorId || !c.productId) {
      continue;
    }
    const venderProductId = getVendorProductId(
      parseInt(c.vendorId),
      parseInt(c.productId),
    );
    configs[venderProductId] = c;
  }
  dispatch(setTabkbConfigs(configs));
};

export const getConfigs = (state: RootState) => state.tabkbconfig.configs;

export const getSelectedTabkbConfig = createSelector(
  [getConfigs, getSelectedDefinition],
  (configs, definition) => {
    if (!definition || !configs[definition.vendorProductId]) {
      return undefined;
    }
    return configs[definition.vendorProductId];
  },
);

export const getTabFileAPI = createSelector(
  getSelectedConnectedDevice,
  getSelectedDevicePath,
  getSelectedTabkbConfig,
  (device, path, config): TabFileAPI | undefined => {
    if (!path || !config || !device) {
      return undefined;
    }
    const api = new KeyboardAPI(path);
    if (!config.cdc) {
      return api;
    }
    return new TabKeyboardAPI(device);
  },
);

export const getMatrixLightingAPI = createSelector(
  getSelectedConnectedDevice,
  getSelectedDevicePath,
  getSelectedTabkbConfig,
  (device, path, config): MatrixLightingAPI | undefined => {
    if (!path || !config || !device) {
      return undefined;
    }
    const api = new KeyboardAPI(path);
    if (!config.matrixLighting.cdc) {
      return api;
    }
    return new TabKeyboardAPI(device);
  },
);

export const getTapDanceKeycodes = createSelector(
  getSelectedTabkbConfig,
  (config): IKeycode[] => {
    if (!config || !config.tapDance) {
      return [];
    }
    return config.tapDance;
  },
);
