import {Detail, Label, ControlRow} from 'src/components/panes/grid';
import React, {useEffect, useState} from 'react';
import {AccentRange} from 'src/components/inputs/accent-range';
import {useDispatch} from 'react-redux';
import {
  getEnableRT,
  getContinuousRT,
  defaultRtSensitivity,
  defaultRt2ndSensitivity,
  updatePerKeyRT,
  updateEnableRT,
  updateContinuousRT,
  deletePerKeyRT,
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
import {t} from 'i18next';
import {FlexLabel} from '../screen/screen-tool';

export const RTConfiger: React.FC = () => {
  const dispatch = useDispatch();
  const appDispatch = useAppDispatch();
  const enableRT = useAppSelector(getEnableRT);
  const continuousRT = useAppSelector(getContinuousRT);
  const selectedKeys = useAppSelector(getSelectedKeys);
  const actuationMap = useAppSelector(getSelectedActuationMap);

  const [rtSensitivity, setRtSensitivity] = useState(defaultRtSensitivity);
  const [rt2ndSensitivity, setRt2ndSensitivity] = useState(
    defaultRt2ndSensitivity,
  );

  const updatePerKeyAct = () => {
    if (selectedKeys) {
      appDispatch(
        updatePerKeyRT(selectedKeys, rtSensitivity, rt2ndSensitivity),
      );
    }
    dispatch(clearSelectedKeys());
  };

  const deletePerKeyAct = () => {
    if (selectedKeys) {
      appDispatch(deletePerKeyRT(selectedKeys));
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
      const rt1 = actuationMap[idx].rtSensitivity;
      const rt2 = actuationMap[idx].rt2ndSensitivity;
      rt1 && setRtSensitivity(rt1);
      rt2 && setRt2ndSensitivity(rt2);
    }
  }, [selectedKeys]);

  return (
    <>
      <ControlRow>
        <Label>{t('Rapit Trigger')}</Label>
        <Detail>
          <AccentSlider
            isChecked={enableRT}
            onChange={(v) => appDispatch(updateEnableRT(v))}
          ></AccentSlider>
        </Detail>
      </ControlRow>
      {enableRT && (
        <>
          <ControlRow>
            <Label>{t('Continuous rapid trigger')}</Label>
            <Detail>
              <AccentSlider
                isChecked={continuousRT}
                onChange={(v) => appDispatch(updateContinuousRT(v))}
              ></AccentSlider>
            </Detail>
          </ControlRow>
          <ControlRow>
            <Label
              style={{color: 'var(--color_label-highlighted)', marginTop: 20}}
            >
              {t('Selecting keys to set rapid trigger')}
            </Label>
          </ControlRow>
          <ControlRow>
            <Label>
              {t('Press(active)')} {t('sensitivity')} {rtSensitivity.toFixed(2)}{' '}
              mm
            </Label>
            <Detail>
              <AccentRange
                min={0.1}
                max={2.35}
                step={0.05}
                value={rtSensitivity}
                disabled={!selectedKeys?.length}
                onChange={(v) => setRtSensitivity(v)}
              />
            </Detail>
          </ControlRow>
          <ControlRow>
            <Label>
              {t('Release(reset)')} {t('sensitivity')}{' '}
              {rt2ndSensitivity.toFixed(2)} mm
            </Label>
            <Detail>
              <AccentRange
                min={0.1}
                max={2.35}
                step={0.05}
                value={rt2ndSensitivity}
                disabled={!selectedKeys?.length}
                onChange={(v) => setRt2ndSensitivity(v)}
              />
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
