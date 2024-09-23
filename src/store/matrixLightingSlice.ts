import {RGBColor} from 'react-color';
import type {AppThunk, RootState} from './index';
import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {getMatrixLightingAPI, getSelectedTabkbConfig} from './tabkbConfigSlice';
import {getSelectedKeyboardAPI, selectDevice} from './devicesSlice';

export const mlHeader = [...new TextEncoder().encode('tabml')];
export const mlHeaderSize = 32;
export const DefaultMaxFrame = 200;

type lightingState = {
  color: RGBColor;
  rows: number;
  cols: number;
  fps: number;
  matrixIdx: number;
  matrixList: RGBColor[][][];
  saving: boolean;
};

const initMatrix = (
  rows: number,
  cols: number,
  color: RGBColor = {r: 0, g: 0, b: 0},
): RGBColor[][] => {
  const matrix = Array(rows)
    .fill('')
    .map(() => Array(cols).fill(color));
  return matrix;
};

const initialState: lightingState = {
  color: {r: 255, g: 255, b: 255},
  rows: 0,
  cols: 0,
  fps: 10,
  matrixIdx: 0,
  matrixList: [],
  saving: false,
};

const lightingSlice = createSlice({
  name: 'matrixlighting',
  initialState,
  reducers: {
    updateColor(state, action: PayloadAction<RGBColor>) {
      state.color = action.payload;
    },
    updateMatrix(state, action: PayloadAction<{row: number; col: number}>) {
      const {row, col} = action.payload;
      if (row > state.rows - 1 || col > state.cols - 1) {
        return;
      }
      state.matrixList[state.matrixIdx][row][col] = state.color;
    },
    setMatrix(state, action: PayloadAction<RGBColor[][]>) {
      state.matrixList[state.matrixIdx] = action.payload;
    },
    updateMatrixIndex(state, action: PayloadAction<number | undefined>) {
      if (action.payload === undefined) {
        return;
      }
      state.matrixIdx = action.payload;
    },
    resetMatrix(state) {
      state.matrixIdx = 0;
      state.matrixList = [initMatrix(state.rows, state.cols)];
    },
    addMatrix(state) {
      state.matrixList = [
        ...state.matrixList.slice(0, state.matrixIdx + 1),
        initMatrix(state.rows, state.cols),
        ...state.matrixList.slice(state.matrixIdx + 1),
      ];
      state.matrixIdx += 1;
    },
    deleteMatrix(state) {
      if (state.matrixList.length === 1) {
        state.matrixList[0] = initMatrix(state.rows, state.cols);
        return;
      }
      state.matrixList.splice(state.matrixIdx, 1);
      if (state.matrixIdx >= state.matrixList.length) {
        state.matrixIdx -= 1;
      }
    },
    nextMatrix(state) {
      let idx = state.matrixIdx + 1;
      if (idx >= state.matrixList.length) {
        idx = 0;
      }
      state.matrixIdx = idx;
    },
    copyMatrix(state) {
      state.matrixList = [
        ...state.matrixList.slice(0, state.matrixIdx + 1),
        state.matrixList[state.matrixIdx],
        ...state.matrixList.slice(state.matrixIdx + 1),
      ];
      state.matrixIdx += 1;
    },
    setMatrixList(state, action: PayloadAction<RGBColor[][][]>) {
      state.matrixList = action.payload;
      state.matrixIdx = 0;
    },
    fillMatrix(state) {
      state.matrixList[state.matrixIdx] = initMatrix(state.rows, state.cols);
    },
    sortMatrixByIndex(state, action: PayloadAction<{newIndex: number}>) {
      const {newIndex} = action.payload;
      if (state.matrixIdx === newIndex) {
        return;
      }
      const [removed] = state.matrixList.splice(state.matrixIdx, 1);
      state.matrixList.splice(newIndex, 0, removed);
      state.matrixIdx = newIndex;
    },
    setRows: (state, action: PayloadAction<number>) => {
      state.rows = action.payload;
    },
    setCols: (state, action: PayloadAction<number>) => {
      state.cols = action.payload;
    },
    setFps: (state, action: PayloadAction<number>) => {
      state.fps = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },
    loadFile: (
      state,
      action: PayloadAction<{frames: number; fps: number; data: number[]}>,
    ) => {
      const rows = state.rows;
      const cols = state.cols;
      const {frames, fps, data} = action.payload;
      const frameSize = cols * rows * 3;
      const matrixList: RGBColor[][][] = Array(frames)
        .fill(0)
        .map(() =>
          Array(rows)
            .fill(0)
            .map(() => Array(cols).fill({r: 0, g: 0, b: 0})),
        );
      for (let i = 0; i < data.length; i += 3) {
        const frame = ~~(i / frameSize);
        const idx = (i % frameSize) / 3;
        const row = ~~(idx / cols);
        const col = idx % cols;
        const color = {
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
        };
        matrixList[frame][row][col] = color;
      }
      state.fps = fps;
      state.matrixIdx = 0;
      state.matrixList = matrixList;
    },
  },
  extraReducers(builder) {
    builder.addCase(selectDevice, (state) => {
      state.saving = false;
    });
  },
});

export const {
  updateColor,
  updateMatrix,
  resetMatrix,
  addMatrix,
  deleteMatrix,
  updateMatrixIndex,
  nextMatrix,
  copyMatrix,
  setMatrix,
  setMatrixList,
  fillMatrix,
  sortMatrixByIndex,
  setRows,
  setCols,
  setFps,
  setSaving,
  loadFile,
} = lightingSlice.actions;

export default lightingSlice.reducer;

export const saveToKeyboard = (): AppThunk => async (dispatch, getState) => {
  const state = getState();
  const api = getMatrixLightingAPI(state);
  const saving = getSaving(state);

  if (!api || saving) {
    return;
  }

  const rows = getRows(state);
  const cols = getCols(state);
  const frames = getFrames(state);
  const fps = getFps(state);
  const data = getMatrixData(state);

  dispatch(setSaving(true));

  await api.setMatrixLighting(frames, fps, rows, cols, data).finally(() => {
    dispatch(setSaving(false));
  });
};

export const loadMatrixLighintConfig =
  (): AppThunk => async (dispatch, getState) => {
    const state = getState();
    const tabkbConfig = getSelectedTabkbConfig(state);

    if (!tabkbConfig?.matrixLighting) {
      return;
    }

    const {cols, rows} = tabkbConfig.matrixLighting;
    dispatch(setCols(cols));
    dispatch(setRows(rows));
    dispatch(setMatrixList([initMatrix(rows, cols)]));
  };

export const getActiveColor = (state: RootState) => state.matrixlighting.color;
export const getRows = (state: RootState) => state.matrixlighting.rows;
export const getCols = (state: RootState) => state.matrixlighting.cols;
export const getMatrixList = (state: RootState) =>
  state.matrixlighting.matrixList;
export const getMatrixIdx = (state: RootState) =>
  state.matrixlighting.matrixIdx;
export const getFps = (state: RootState) => state.matrixlighting.fps;
export const getSaving = (state: RootState) => state.matrixlighting.saving;
export const getFrames = (state: RootState) =>
  state.matrixlighting.matrixList.length;

export const getMaxFrame = createSelector(getSelectedTabkbConfig, (config) => {
  if (!config) {
    return DefaultMaxFrame;
  }
  return config?.matrixLighting.maxFrame ?? DefaultMaxFrame;
});

export const getImportEnable = createSelector(
  getSelectedTabkbConfig,
  (config) => {
    if (!config) {
      return false;
    }
    return !!config?.matrixLighting.importEnable;
  },
);

export const getActiveMatrix = createSelector(
  getMatrixList,
  getMatrixIdx,
  (list, idx) => {
    if (!list[idx]) {
      return [];
    }
    return list[idx];
  },
);

export const getMatrixData = createSelector(getMatrixList, (matrixList) => {
  return matrixList.flatMap((f) =>
    f.flatMap((r) =>
      r.flatMap((c) => {
        // const rgb565 = ((c.r >> 3) << 11) | ((c.g >> 2) << 5) | (c.b >> 3);
        return [c.r, c.g, c.b];
      }),
    ),
  );
});

export const getFileContent = createSelector(
  getFrames,
  getRows,
  getCols,
  getFps,
  getMatrixData,
  (frames, rows, cols, fps, data) => {
    const header = Array(mlHeaderSize).fill(0);
    const headerBuffer = [...mlHeader, frames, fps, rows, cols];
    headerBuffer.forEach((v, i) => {
      header[i] = v;
    });
    return [...header, ...data];
  },
);
