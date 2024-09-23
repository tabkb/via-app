import {Detail, Label, ControlRow} from 'src/components/panes/grid';
import React, {useEffect, useState} from 'react';
import {AccentRange} from 'src/components/inputs/accent-range';
import {useDispatch} from 'react-redux';
import {
  getActuationPoint,
  getEnableAP,
  updatePerKeyActuation,
  updateEnableAP,
  updateActuationPoint,
  deletePerKeyActuation,
  getSelectedActuationMap,
} from 'src/store/actuationSlice';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  clearSelectedKeys,
  getSelectedKeymapIndexes,
  getSelectedKeys,
  updateSelectedKeys,
} from 'src/store/keymapSlice';
import {
  AccentButton,
  PrimaryAccentButton,
} from 'src/components/inputs/accent-button';
import {AccentSlider} from 'src/components/inputs/accent-slider';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {FlexLabel} from '../screen/screen-tool';

const PerKeyAct = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ActuationConfiger: React.FC = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const appDispatch = useAppDispatch();
  const actuationPoint = useAppSelector(getActuationPoint);
  const selectedKeys = useAppSelector(getSelectedKeys);
  const [perKeyAct, setPerKeyAct] = useState(actuationPoint);
  const enableAP = useAppSelector(getEnableAP);
  const actuationMap = useAppSelector(getSelectedActuationMap);
  const updatePerKeyAct = () => {
    if (selectedKeys) {
      appDispatch(updatePerKeyActuation(selectedKeys, perKeyAct));
    }
    dispatch(clearSelectedKeys());
  };
  const deletePerKeyAct = () => {
    if (selectedKeys) {
      appDispatch(deletePerKeyActuation(selectedKeys));
    }
    dispatch(clearSelectedKeys());
  };
  const indexes = useAppSelector(getSelectedKeymapIndexes);

  useEffect(() => {
    if (actuationMap && selectedKeys && selectedKeys.length > 0) {
      const idx = selectedKeys[selectedKeys.length - 1];
      if (!actuationMap[idx]) {
        return
      }
      const act = actuationMap[idx].actuationPoint;
      act && setPerKeyAct(act);
    }
  }, [selectedKeys]);

  return (
    <>
      <ControlRow>
        <Label>{t('Set Actuatoin Point')}</Label>
        <Detail>
          <AccentSlider
            isChecked={enableAP}
            onChange={(v) => appDispatch(updateEnableAP(v))}
          ></AccentSlider>
        </Detail>
      </ControlRow>
      {enableAP && (
        <>
          <ControlRow>
            <Label>
              {t('Global actuation')} {actuationPoint.toFixed(1)} mm
            </Label>
            <Detail>
              <AccentRange
                min={0.1}
                max={4}
                step={0.05}
                value={actuationPoint}
                onChange={(v) => appDispatch(updateActuationPoint(v))}
              />
            </Detail>
          </ControlRow>

          <ControlRow>
            <Label
              style={{color: 'var(--color_label-highlighted)', marginTop: 20}}
            >
              {t('Selecting keys to set per key actuation')}
            </Label>
          </ControlRow>
          <ControlRow>
            <Label>
              {t('Per key actuation')} {`${perKeyAct} mm`}{' '}
            </Label>
            <Detail>
              <PerKeyAct>
                <AccentRange
                  min={0.1}
                  max={4}
                  step={0.05}
                  value={perKeyAct}
                  disabled={!selectedKeys?.length}
                  onChange={(v) => setPerKeyAct(v)}
                />
              </PerKeyAct>
            </Detail>
          </ControlRow>
          <ControlRow>
            <FlexLabel>
              <AccentButton
                onClick={() => {
                  dispatch(updateSelectedKeys([...indexes.keys()]));
                }}
                style={{marginRight: 5}}
              >
                {t('Select All')}
              </AccentButton>
              <AccentButton
                disabled={!selectedKeys?.length}
                onClick={() => {
                  dispatch(updateSelectedKeys([]));
                }}
              >
                {t('Deselect All')}
              </AccentButton>
            </FlexLabel>
            <Detail>
              <AccentButton
                disabled={!selectedKeys?.length}
                onClick={deletePerKeyAct}
              >
                {t('Delete')}
              </AccentButton>
              <PrimaryAccentButton
                style={{marginLeft: 5}}
                disabled={!selectedKeys?.length}
                onClick={updatePerKeyAct}
              >
                {t('Confirm')}
              </PrimaryAccentButton>
            </Detail>
          </ControlRow>
        </>
      )}
    </>
  );
};
