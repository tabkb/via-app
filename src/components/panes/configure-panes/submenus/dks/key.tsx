import React, {useEffect, useRef} from 'react';
import {DKSKey} from 'src/types/types';
import styled from 'styled-components';
import {mapEvtToKeycode} from 'src/utils/key-event';
import {useAppSelector} from 'src/store/hooks';
import {getDksAction, updateDksAction} from 'src/store/actuationSlice';
import {useDispatch} from 'react-redux';
import {getByteForCode, getNameForByte} from 'src/utils/key';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';
import {TooltipContainer} from 'src/components/two-string/unit-key/keycap-base';
import {IconButtonTooltip, Tooltip} from 'src/components/inputs/tooltip';
import {IconButton} from 'src/components/inputs/icon-button';

const KeyBox = styled.div<{$active: boolean}>`
  border: 4px solid
    ${(p) => (p.$active ? 'var(--color_accent)' : 'var(--border_color_icon)')};
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: var(--bg_control);
  margin-right: 30px;
  cursor: pointer;
  text-align: center;
  line-height: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  // position: relative;
  // padding: 0;
  // &:hover {
  //   background: var(--bg_control);
  //   border: 4px solid
  //     ${(p) =>
    p.$active ? 'var(--color_accent)' : 'var(--border_color_icon)'};
  // }
`;

const KeyLabel = styled.div`
  white-space: pre-wrap;
  text-overflow: ellipsis;
  overflow: hidden;
  user-select: none;
  color: var(--color_label-highlighted);
`;

export const KeyBinding: React.FC<{
  dksKey: DKSKey;
  rowIndex: number;
  updateKey(key: DKSKey): void;
}> = ({dksKey, rowIndex, updateKey}) => {
  const dispatch = useDispatch();
  const activeAction = useAppSelector(getDksAction);
  const active = activeAction === rowIndex;
  const {basicKeyToByte, byteToKey} = useAppSelector(getBasicKeyToByte);
  const defineition = useAppSelector(getSelectedDefinition);
  const customKeycodes = defineition ? defineition.customKeycodes : undefined;
  const label = active
    ? ''
    : getNameForByte(dksKey, basicKeyToByte, byteToKey, customKeycodes);

  const keyRef = useRef<HTMLDivElement>(null);

  const upHandler = (evt: KeyboardEvent) => {
    evt.preventDefault();
    const keycode = mapEvtToKeycode(evt);
    if (keycode) {
      const byte = getByteForCode(keycode, basicKeyToByte);
      updateKey(byte);
    }
    dispatch(updateDksAction(null));
  };

  const globalClickHandler = (evt: MouseEvent) => {
    const element = evt.target as HTMLDivElement;
    if (
      evt.target === keyRef.current ||
      keyRef.current?.contains(element) ||
      element.classList.contains('dks-keycode-submenu')
    ) {
      return;
    }
    dispatch(updateDksAction(null));
  };

  const handleClick = () => {
    dispatch(updateDksAction(rowIndex));
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (dksKey === 0) {
      return;
    }
    updateKey(0);
  };

  useEffect(() => {
    if (active) {
      window.addEventListener('keyup', upHandler);
      document.addEventListener('click', globalClickHandler);
    }
    return () => {
      window.removeEventListener('keyup', upHandler);
      document.removeEventListener('click', globalClickHandler);
    };
  }, [active]);

  useEffect(
    () => () => {
      dispatch(updateDksAction(null));
    },
    [],
  );

  return (
    <KeyBox
      $active={active}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      ref={keyRef}
    >
      <KeyLabel>{label}</KeyLabel>
      {/* <IconButtonTooltip>点击输入按键，右键清除</IconButtonTooltip> */}
    </KeyBox>
  );
};
