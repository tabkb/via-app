import {useCallback, useEffect, useMemo, useState} from 'react';
import {getBasicKeyToByte} from 'src/store/definitionsSlice';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {getSelectedKey, getSelectedKeys} from 'src/store/keymapSlice';
import {Keycap} from './unit-key/keycap';
import {
  calculateKeyboardFrameDimensions,
  CSSVarObject,
  getComboKeyProps,
} from 'src/utils/keyboard-rendering';
import {getExpressions} from 'src/store/macrosSlice';
import styled from 'styled-components';
import {getSelectedTheme} from 'src/store/settingsSlice';
import {CaseInsideBorder} from './case';
import {
  getKeycapSharedProps,
  getKeysKeys,
  getLabels,
} from '../n-links/key-group';
import {KeyGroupProps, KeysKeys} from 'src/types/keyboard-rendering';
import {getRGB} from 'src/utils/color-math';
import {Color} from 'three';
import {useSkipFontCheck} from 'src/utils/use-skip-font-check';
import {getSelectedDksmap} from 'src/store/actuationSlice';
import {getSelectedActuationMap} from 'src/store/actuationSlice';
import {getTapDanceKeycodes} from 'src/store/tabkbConfigSlice';

const KeyGroupContainer = styled.div<{height: number; width: number}>`
  position: absolute;
  top: ${(p) => CaseInsideBorder * 1.5}px;
  left: ${(p) => CaseInsideBorder * 1.5}px;
`;

const getPosition = (x: number, y: number): [number, number, number] => [
  x - CSSVarObject.keyWidth / 2,
  y - CSSVarObject.keyHeight / 2,
  0,
];
const getRGBArray = (keyColors: number[][]) => {
  return keyColors.map(([hue, sat]) => {
    const rgbStr = getRGB({
      hue: Math.round((255 * hue) / 360),
      sat: Math.round(255 * sat),
    });
    const srgbStr = `#${new Color(rgbStr).getHexString()}`;
    const keyColor = {c: srgbStr, t: srgbStr};
    return keyColor;
  });
};

export const KeyGroup: React.FC<KeyGroupProps<React.MouseEvent>> = (props) => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(getSelectedKey);
  const selectedKeys = useAppSelector(getSelectedKeys);
  const selectedTheme = useAppSelector(getSelectedTheme);
  const macroExpressions = useAppSelector(getExpressions);
  const skipFontCheck = useSkipFontCheck();
  const keyColorPalette = props.keyColors
    ? getRGBArray(props.keyColors)
    : selectedTheme;
  const {basicKeyToByte, byteToKey} = useAppSelector(getBasicKeyToByte);
  const macros = useAppSelector((state) => state.macros);
  const {keys, selectedKey: externalSelectedKey} = props;
  const selectedKeyIndex =
    externalSelectedKey === undefined ? selectedKey : externalSelectedKey;
  const keysKeys: KeysKeys<React.MouseEvent> = useMemo(() => {
    return getKeysKeys(props, keyColorPalette, dispatch, getPosition);
  }, [
    keys,
    keyColorPalette,
    props.onKeycapPointerDown,
    props.onKeycapPointerOver,
  ]);
  const selecteDksmap = useAppSelector(getSelectedDksmap) || [];
  const actuationMap = useAppSelector(getSelectedActuationMap) || [];
  const tapDanceKeycodes = useAppSelector(getTapDanceKeycodes);
  const labels = useMemo(() => {
    return getLabels(
      props,
      macroExpressions,
      basicKeyToByte,
      byteToKey,
      tapDanceKeycodes,
    );
  }, [keys, props.matrixKeycodes, macros, props.definition, tapDanceKeycodes]);
  const {width, height} = calculateKeyboardFrameDimensions(keys);
  const elems = useMemo(() => {
    return props.keys.map((k, i) => {
      return k.d ? null : (
        <Keycap
          {...getComboKeyProps(k)}
          {...getKeycapSharedProps(
            k,
            i,
            props,
            keysKeys,
            selectedKeyIndex,
            selectedKeys,
            labels,
            skipFontCheck,
            selecteDksmap,
            actuationMap,
          )}
        />
      );
    });
  }, [
    keys,
    selectedKeyIndex,
    selectedKeys,
    labels,
    props.pressedKeys,
    props.selectable,
    keyColorPalette,
    props.definition.vendorProductId,
    skipFontCheck,
    props.mode,
    selecteDksmap,
    actuationMap,
    props.multiSelect,
  ]);
  return (
    <KeyGroupContainer
      height={height}
      width={width}
      style={{
        pointerEvents: props.selectable || props.multiSelect ? 'all' : 'none',
      }}
    >
      {elems}
    </KeyGroupContainer>
  );
};
