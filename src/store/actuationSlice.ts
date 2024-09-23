import {
  ActuationData,
  ActuationMenu,
  DKSAction,
  DKSActions,
  DKSData,
  DKSPoint,
  DksMap,
} from 'src/types/types';
import type {AppThunk, RootState} from './index';
import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  getSelectedDefinition,
  getSelectedKeyDefinitions,
} from './definitionsSlice';
import {
  getSelectedConnectedDevice,
  getSelectedDevicePath,
  getSelectedKeyboardAPI,
  selectDevice,
} from './devicesSlice';
import {
  getNumberOfLayers,
  getSelectedKey,
  getSelectedKeymap,
  getSelectedLayerIndex,
} from './keymapSlice';
import {ActuationApi, getActuationApi} from 'src/utils/actuation-api';
import {debounce} from 'lodash';
import {getSelectedTabkbConfig} from './tabkbConfigSlice';

export const defaultActuationPoint = 2;
export const defaultRtSensitivity = 0.2;
export const defaultRt2ndSensitivity = 0.55;
export const defaultDKSActuation = 0.7;
export const defaultDKS2ndActuation = 3.5;

type actuationState = {
  actuationMenu: ActuationMenu;
  enableAP: boolean;
  actuationPoint: number;
  actuationMap: {[devicePath: string]: ActuationData[]};
  enableRT: boolean;
  continuousRT: boolean;
  selfChecked: boolean;
  selfCheckStartTimeout: number;
  dksActionIndex: number | null;
  dksmap: DksMap;
  dksActuations: [number, number];
};

const initialState: actuationState = {
  enableAP: false,
  actuationPoint: defaultActuationPoint,
  actuationMap: {},
  actuationMenu: 'AP',
  enableRT: false,
  continuousRT: false,
  selfChecked: false,
  selfCheckStartTimeout: 0,
  dksActionIndex: null,
  dksmap: {},
  dksActuations: [defaultDKSActuation, defaultDKS2ndActuation],
};

const actuationSlice = createSlice({
  name: 'actuation',
  initialState,
  reducers: {
    setActuationPoint: (state, action: PayloadAction<number>) => {
      state.actuationPoint = action.payload;
    },
    setActuation: (
      state,
      action: PayloadAction<{
        devicePath: string;
        keymapIdxes: number[];
        actuation: ActuationData;
      }>,
    ) => {
      const {devicePath, keymapIdxes, actuation} = action.payload;
      state.actuationMap[devicePath] = state.actuationMap[devicePath] || [];
      keymapIdxes.map((keymapIdx) => {
        state.actuationMap[devicePath][keymapIdx] =
          state.actuationMap[devicePath][keymapIdx] || {};
        state.actuationMap[devicePath][keymapIdx] = {
          ...state.actuationMap[devicePath][keymapIdx],
          ...actuation,
        };
      });
    },
    resetActuation: (state, action: PayloadAction<string>) => {
      state.actuationMap[action.payload] = [];
    },
    updateMenu: (state, action: PayloadAction<ActuationMenu>) => {
      state.actuationMenu = action.payload;
    },
    setEnableAP: (state, action: PayloadAction<boolean>) => {
      state.enableAP = action.payload;
    },
    setEnableRT: (state, action: PayloadAction<boolean>) => {
      state.enableRT = action.payload;
    },
    setContinuousRT: (state, action: PayloadAction<boolean>) => {
      state.continuousRT = action.payload;
    },
    updateSelfChecked: (state, action: PayloadAction<boolean>) => {
      state.selfChecked = action.payload;
    },
    updateSelfCheckTimeout: (state, action: PayloadAction<number>) => {
      state.selfCheckStartTimeout = action.payload;
    },
    updateDksAction: (state, action: PayloadAction<number | null>) => {
      state.dksActionIndex = action.payload;
    },
    setDksData: (
      state,
      action: PayloadAction<{
        devicePath: string;
        selectedLayerIndex: number;
        keymapIndex: number;
        value: DKSData;
      }>,
    ) => {
      const {keymapIndex, value, devicePath, selectedLayerIndex} =
        action.payload;
      state.dksmap[devicePath] = state.dksmap[devicePath] || [];
      state.dksmap[devicePath][selectedLayerIndex] =
        state.dksmap[devicePath][selectedLayerIndex] || [];
      state.dksmap[devicePath][selectedLayerIndex][keymapIndex] = value;
    },
    resetDksData: (state, action: PayloadAction<string>) => {
      state.dksmap[action.payload] = [];
    },
    deleteDksBaseLayerData: (
      state,
      action: PayloadAction<{path: string; keymapIndexes: number[]}>,
    ) => {
      const {path, keymapIndexes} = action.payload;
      if (!state.dksmap[path]?.[0]) {
        return;
      }
      keymapIndexes.forEach((idx) => {
        state.dksmap[path][0][idx] = null;
      });
    },
    setDKSActuations: (state, action: PayloadAction<number[]>) => {
      state.dksActuations = action.payload as actuationState['dksActuations'];
    },
  },
  extraReducers(builder) {
    builder.addCase(selectDevice, (state) => {
      state.selfChecked = false;
    });
  },
});

export const {
  setActuationPoint,
  setActuation,
  updateMenu,
  setEnableRT,
  setEnableAP,
  setContinuousRT,
  updateSelfChecked,
  updateSelfCheckTimeout,
  updateDksAction,
  deleteDksBaseLayerData,
  setDksData,
  setDKSActuations,
  resetActuation,
  resetDksData,
} = actuationSlice.actions;

export default actuationSlice.reducer;

export const updatePerKeyActuation =
  (keys: number[], actuation: number): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const definitions = getSelectedKeyDefinitions(state);
    const connectedDevice = getSelectedConnectedDevice(state);
    const selectedDefinition = getSelectedDefinition(state);
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (
      !connectedDevice ||
      !definitions ||
      !selectedDefinition ||
      !keyboardApi
    ) {
      return;
    }

    const api = getActuationApi(keyboardApi);
    const {matrix} = selectedDefinition;
    const {path} = connectedDevice;
    const keymapIdxes = [];
    const commandP = [];
    for (const keyIndex of keys) {
      const {row, col} = definitions[keyIndex];
      const keymapIdx = row * matrix.cols + col;
      keymapIdxes.push(keymapIdx);
      commandP.push(api.setAPValue(row, col, actuation));
    }
    await Promise.all(commandP);
    dispatch(
      setActuation({
        devicePath: path,
        keymapIdxes,
        actuation: {actuationPoint: actuation},
      }),
    );
    dispatch(deleteDksData(keymapIdxes));
  };

export const deletePerKeyActuation =
  (keys: number[], localUpdate: boolean = false): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const validKeys = getValidAPKeys(state);
    dispatch(deleteActuation(keys, validKeys, 'AP', localUpdate));
  };

export const deleteActuation =
  (
    keys: number[],
    validKeys: number[],
    type: 'AP' | 'RT' | 'ALL',
    localUpdate: boolean = false,
  ): AppThunk =>
  async (dispatch, getState) => {
    if (keys.length === 0 || validKeys.length === 0) {
      return;
    }

    const state = getState();
    const definitions = getSelectedKeyDefinitions(state);
    const connectedDevice = getSelectedConnectedDevice(state);
    const selectedDefinition = getSelectedDefinition(state);
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (
      !connectedDevice ||
      !definitions ||
      !selectedDefinition ||
      !keyboardApi
    ) {
      return;
    }

    let actuation;
    if (type === 'AP') {
      actuation = {actuationPoint: 0};
    } else if (type === 'RT') {
      actuation = {rtSensitivity: 0, rt2ndSensitivity: 0};
    } else {
      actuation = {
        actuationPoint: 0,
        rtSensitivity: 0,
        rt2ndSensitivity: 0,
      };
    }

    const api = getActuationApi(keyboardApi);
    const {matrix} = selectedDefinition;
    const {path} = connectedDevice;
    const keymapIdxes = [];
    const commandP = [];
    for (const keyIndex of keys) {
      if (!validKeys.includes(keyIndex)) {
        continue;
      }
      const {row, col} = definitions[keyIndex];
      const keymapIdx = row * matrix.cols + col;
      keymapIdxes.push(keymapIdx);
      if (!localUpdate) {
        if (type === 'AP') {
          commandP.push(api.setAPValue(row, col, 0));
        } else if (type === 'RT') {
          commandP.push(api.setRTValue(row, col, 0, 0));
        }
      }
    }

    await Promise.all(commandP);
    dispatch(
      setActuation({
        devicePath: path,
        keymapIdxes,
        actuation: actuation,
      }),
    );
  };

export const updatePerKeyRT =
  (keys: number[], rt1st: number, rt2nd: number): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const definitions = getSelectedKeyDefinitions(state);
    const connectedDevice = getSelectedConnectedDevice(state);
    const selectedDefinition = getSelectedDefinition(state);
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (
      !connectedDevice ||
      !definitions ||
      !selectedDefinition ||
      !keyboardApi
    ) {
      return;
    }

    const api = getActuationApi(keyboardApi);
    const {matrix} = selectedDefinition;
    const {path} = connectedDevice;

    const keymapIdxes = [];
    const commandP = [];
    for (const keyIndex of keys) {
      const {row, col} = definitions[keyIndex];
      const keymapIdx = row * matrix.cols + col;
      keymapIdxes.push(keymapIdx);
      commandP.push(api.setRTValue(row, col, rt1st, rt2nd));
    }

    await Promise.all(commandP);
    dispatch(
      setActuation({
        devicePath: path,
        keymapIdxes,
        actuation: {rtSensitivity: rt1st, rt2ndSensitivity: rt2nd},
      }),
    );
    dispatch(deleteDksData(keymapIdxes));
  };

export const deletePerKeyRT =
  (keys: number[], localUpdate: boolean = false): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const validKeys = getValidRTKeys(state);
    dispatch(deleteActuation(keys, validKeys, 'RT', localUpdate));
  };

export const selfCheck = (): AppThunk => async (dispatch, getState) => {
  const state = getState();
  if (getSelfCheckTimeout(state) > 0) {
    return;
  }
  const keyboardApi = getSelectedKeyboardAPI(state);
  if (!keyboardApi) {
    return;
  }

  const api = getActuationApi(keyboardApi);

  dispatch(updateSelfChecked(false));
  dispatch(updateSelfCheckTimeout(4));
  let interval: any;
  try {
    api.selfCheck();

    await new Promise((resolve) => {
      interval = setInterval(async () => {
        const ok = await api.getSelfCheckResult();
        const timeout = getSelfCheckTimeout(getState());
        if (ok) {
          clearInterval(interval);
          dispatch(updateSelfChecked(true));
          dispatch(updateSelfCheckTimeout(0));
          resolve(true);
          return;
        }
        if (timeout === 1) {
          clearInterval(interval);
          dispatch(updateSelfCheckTimeout(-1));
          resolve(true);
          return;
        }
        dispatch(updateSelfCheckTimeout(timeout - 1));
      }, 1000);
    });
  } catch (e) {
    dispatch(updateSelfCheckTimeout(-1));
    clearInterval(interval);
  }
};

export const loadActuation = (): AppThunk => async (dispatch, getState) => {
  const state = getState();
  const config = getSelectedTabkbConfig(state);
  if (!config?.actuation) {
    return;
  }

  const keyboardApi = getSelectedKeyboardAPI(state);
  const devicePath = getSelectedDevicePath(state);
  const definition = getSelectedDefinition(state);

  if (!definition || !keyboardApi || !devicePath) {
    return;
  }
  const {
    matrix: {cols, rows},
  } = definition;
  const api = getActuationApi(keyboardApi);

  try {
    const [
      checked,
      APEnabled,
      APGlobal,
      APData,
      rtEnabled,
      rtContinuousEnabled,
      rtData,
      dksActuations,
      dksData,
    ] = await Promise.all([
      api.getSelfCheckResult(),
      api.getAPEnabled(),
      api.getAPGlobalValue(),
      api.getAPData(cols * rows),
      api.getRTEnabled(),
      api.getRTContinuousEnabled(),
      api.getRTData(cols * rows),
      api.getDKSActuation(),
      api.getDKSValues(),
    ]);

    dispatch(updateSelfChecked(checked));

    dispatch(setEnableAP(APEnabled));

    dispatch(setActuationPoint(APGlobal));

    APData.map((p, keymapIdx) => {
      dispatch(
        setActuation({
          devicePath,
          keymapIdxes: [keymapIdx],
          actuation: {actuationPoint: p},
        }),
      );
    });

    dispatch(setEnableRT(rtEnabled));

    dispatch(setContinuousRT(rtContinuousEnabled));

    rtData.map(([rt1st, rt2nd], keymapIdx) => {
      dispatch(
        setActuation({
          devicePath,
          keymapIdxes: [keymapIdx],
          actuation: {rtSensitivity: rt1st, rt2ndSensitivity: rt2nd},
        }),
      );
    });

    dispatch(setDKSActuations(dksActuations));

    dksData.map(({layer, row, col, dks}) => {
      const keymapIndex = row * cols + col;
      dispatch(
        setDksData({
          devicePath,
          selectedLayerIndex: layer,
          keymapIndex,
          value: dks,
        }),
      );
    });
  } catch (err) {
    console.log(err);
  }
};

export const updateEnableAP =
  (enabled: boolean): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (!keyboardApi) {
      return;
    }
    const api = getActuationApi(keyboardApi);
    await api.setAPEnabled(enabled);
    dispatch(setEnableAP(enabled));
  };

const updateAP = debounce((api: ActuationApi, value: number) => {
  api.setAPGlobalValue(value);
}, 300);

export const updateActuationPoint =
  (value: number): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (!keyboardApi) {
      return;
    }
    const api = getActuationApi(keyboardApi);
    updateAP(api, value);
    dispatch(setActuationPoint(value));
  };

export const updateEnableRT =
  (enabled: boolean): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (!keyboardApi) {
      return;
    }
    const api = getActuationApi(keyboardApi);
    await api.setRTEnabled(enabled);
    dispatch(setEnableRT(enabled));
  };

export const updateContinuousRT =
  (enabled: boolean): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keyboardApi = getSelectedKeyboardAPI(state);
    if (!keyboardApi) {
      return;
    }
    const api = getActuationApi(keyboardApi);
    await api.setRTContinuousEnabled(enabled);
    dispatch(setContinuousRT(enabled));
  };

export const updateDksData =
  (layer: number, keyIndex: number, value: DKSData): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const keys = getSelectedKeyDefinitions(state);
    const connectedDevice = getSelectedConnectedDevice(state);
    const keyboardApi = getSelectedKeyboardAPI(state);
    const selectedDefinition = getSelectedDefinition(state);
    if (!connectedDevice || !keys || !selectedDefinition || !keyboardApi) {
      return;
    }

    const api = getActuationApi(keyboardApi);
    const {path} = connectedDevice;
    const {row, col} = keys[keyIndex];

    await api.setDksValue(layer, row, col, value);

    const {matrix} = selectedDefinition;
    const keymapIndex = row * matrix.cols + col;

    dispatch(
      setDksData({
        keymapIndex,
        value,
        devicePath: path,
        selectedLayerIndex: layer,
      }),
    );

    if (layer === 0) {
      // delete actuation
      dispatch(deleteActuation([keyIndex], [keyIndex], 'ALL', true));
    }
  };

export const deleteDksData =
  (keymapIndexes: number[]): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const connectedDevice = getSelectedConnectedDevice(state);
    if (!connectedDevice) {
      return;
    }
    const {path} = connectedDevice;

    dispatch(
      deleteDksBaseLayerData({
        path,
        keymapIndexes,
      }),
    );
  };

export const saveConfigToDevice =
  (config: {
    apEnabled: boolean;
    apGlobal: number;
    rtEnabled: boolean;
    rtContinuous: boolean;
    ap: number[][];
    rt: number[][];
    dks: number[][];
  }): AppThunk =>
  async (dispatch, getState) => {
    // todo self check
    const state = getState();

    const keyboardApi = getSelectedKeyboardAPI(state);
    const devicePath = getSelectedDevicePath(state);
    const definition = getSelectedDefinition(state);
    const numberOfLayers = getNumberOfLayers(state);

    if (!definition || !keyboardApi || !devicePath) {
      return;
    }

    const api = getActuationApi(keyboardApi);

    dispatch(updateEnableAP(!!config.apEnabled));
    dispatch(updateEnableRT(!!config.rtEnabled));
    dispatch(updateActuationPoint(config.apGlobal || defaultActuationPoint));
    dispatch(updateContinuousRT(!!config.rtContinuous));

    const {
      matrix: {cols, rows},
    } = definition;

    const keysLength = cols * rows;

    const apCmd = [];
    const rtCmd = [];
    const dksCmd = [];

    const apPayloads: any = [];
    const rtPayloads: any = [];
    const dksPayloads: any = [];

    config.ap &&
      config.ap.map(([i, value]) => {
        apCmd[i] = api.setAPValue(~~(i / cols), i % cols, value);
        apPayloads.push({
          devicePath,
          keymapIdxes: [i],
          actuation: {actuationPoint: value},
        });
      });

    config.rt &&
      config.rt.map(([i, se1, se2]) => {
        rtCmd[i] = api.setRTValue(~~(i / cols), i % cols, se1, se2);
        rtPayloads.push({
          devicePath,
          keymapIdxes: [i],
          actuation: {rtSensitivity: se1, rt2ndSensitivity: se2},
        });
      });

    config.dks &&
      config.dks.map(([l, i, actuation, ...value]) => {
        const actions: DKSAction[] = [];
        for (let a = 0; a < 4; a++) {
          const [key, p1, p2, p3, p4] = value.slice(a * 5, (a + 1) * 5);
          actions.push({
            key,
            points: [p1, p2, p3, p4],
          });
        }
        const dksData = {
          actuation,
          actions,
        } as DKSData;
        dksCmd[l * i + i] = api.setDksValue(l, ~~(i / cols), i % cols, dksData);
        dksPayloads.push({
          devicePath,
          selectedLayerIndex: l,
          keymapIndex: i,
          value: dksData,
        });
      });

    for (let l = 0; l < numberOfLayers; l++) {
      for (let i = 0; i < keysLength; i++) {
        if (l === 0) {
          if (!apCmd[i]) {
            apCmd[i] = api.setAPValue(~~(i / cols), i % cols, 0);
          }
          if (!rtCmd[i]) {
            rtCmd[i] = api.setRTValue(~~(i / cols), i % cols, 0, 0);
          }
        }
        dksCmd[l * i + i] = api.setDksValue(l, ~~(i / cols), i % cols, null);
      }
    }

    await Promise.all([
      Promise.all(apCmd),
      Promise.all(rtCmd),
      Promise.all(dksCmd),
    ]);

    dispatch(resetActuation(devicePath));
    apPayloads.map((p: any) => dispatch(setActuation(p)));
    rtPayloads.map((p: any) => dispatch(setActuation(p)));
    dispatch(resetDksData(devicePath));
    dksPayloads.map((p: any) => dispatch(setDksData(p)));
  };

export const getActuationPoint = (state: RootState) =>
  state.actuation.actuationPoint;
export const getActuationMap = (state: RootState) =>
  state.actuation.actuationMap;
export const getMenu = (state: RootState) => state.actuation.actuationMenu;
export const getEnableAP = (state: RootState) => state.actuation.enableAP;
export const getEnableRT = (state: RootState) => state.actuation.enableRT;
export const getContinuousRT = (state: RootState) =>
  state.actuation.continuousRT;
export const getSelfChecked = (state: RootState) => state.actuation.selfChecked;
export const getSelfCheckTimeout = (state: RootState) =>
  state.actuation.selfCheckStartTimeout;
export const getDksAction = (state: RootState) =>
  state.actuation.dksActionIndex;
export const getDksmap = (state: RootState) => state.actuation.dksmap;
export const getDKSActuations = (state: RootState) =>
  state.actuation.dksActuations;

export const getSelectedPerKeyActuation = createSelector(
  getActuationMap,
  getSelectedDevicePath,
  (actMap, path) => {
    if (path && actMap[path]) {
      return actMap[path];
    }
    return undefined;
  },
);

export const getSelectedActuationMap = createSelector(
  getSelectedKeyDefinitions,
  getSelectedDefinition,
  getSelectedPerKeyActuation,
  getSelectedLayerIndex,
  (keys, definition, actuationMap, layerIdx) => {
    if (layerIdx !== 0) {
      return undefined;
    }
    if (definition && actuationMap) {
      const {
        matrix: {cols},
      } = definition;
      return keys.map(({col, row}) => actuationMap[row * cols + col]);
    }
    return undefined;
  },
);

export const getValidAPKeys = createSelector(
  getSelectedActuationMap,
  (actuationMap) => {
    if (!actuationMap) {
      return [];
    }
    const keys: number[] = [];
    actuationMap.map((a, idx) => {
      if (a?.actuationPoint) {
        keys.push(idx);
      }
    });
    return keys;
  },
);

export const getValidRTKeys = createSelector(
  getSelectedActuationMap,
  (actuationMap) => {
    if (!actuationMap) {
      return [];
    }
    const keys: number[] = [];
    actuationMap.map((a, idx) => {
      if (a?.rtSensitivity && a?.rt2ndSensitivity) {
        keys.push(idx);
      }
    });
    return keys;
  },
);

export const getSelectedDksmap = createSelector(
  getSelectedKeyDefinitions,
  getSelectedDefinition,
  getSelectedDevicePath,
  getSelectedLayerIndex,
  getDksmap,
  (keys, definition, path, layerIdx, dksmap) => {
    if (definition && path && dksmap[path]?.[layerIdx]) {
      const {
        matrix: {cols},
      } = definition;
      return keys.map(({row, col}) => dksmap[path][layerIdx][row * cols + col]);
    }
    return undefined;
  },
);

export const getSelectedDksRawMap = createSelector(
  getDksmap,
  getSelectedDevicePath,
  (dksmap, path) => {
    if (path && dksmap[path]) {
      return dksmap[path];
    }
    return undefined;
  },
);

export const getDefaultDksData = createSelector(
  getSelectedKey,
  getSelectedKeymap,
  getDKSActuations,
  (key, keymap, actuations) => {
    // const firstKey = key && keymap && keymap[key] ? keymap[key] : 0;
    const defaultDksData: DKSData = {
      actuation: actuations[0],
      actions: Array(4)
        .fill(0)
        .map((_, idx) => {
          return {
            key: 0,
            points: [
              DKSPoint.Hold,
              DKSPoint.Hold,
              DKSPoint.Hold,
              DKSPoint.Hold,
            ],
          };
        }) as DKSActions,
    };
    return defaultDksData;
  },
);

export const getSelectDksData = createSelector(
  getSelectedKey,
  getSelectedDksmap,
  getDefaultDksData,
  (key, dksmap, defaultData) => {
    if (key !== null && dksmap) {
      return dksmap[key] || defaultData;
    }
    return defaultData;
  },
);

export const getActiveMenu = createSelector(
  getSelfChecked,
  getMenu,
  (checked, menu): ActuationMenu => {
    if (!checked) {
      return 'SELF CHECK';
    }
    return menu;
  },
);

export const getConfiguredDksData = createSelector(
  getSelectedDksRawMap,
  (dksmap) => {
    if (!dksmap) {
      return [];
    }
    const dksdata: {layerIdx: number; key: number; data: DKSData}[] = [];
    dksmap.forEach((layer, layerIdx) => {
      layer.forEach((data, key) => {
        if (data !== null) {
          dksdata.push({layerIdx, key, data});
        }
      });
    });
    return dksdata;
  },
);
