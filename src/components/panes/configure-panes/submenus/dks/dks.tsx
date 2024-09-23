import {ActuationPointConfigure} from './actuation';
import {DKSActionPane} from './action-grid';
import {DKSActions} from 'src/types/types';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getConfiguredDksData,
  getSelectDksData,
  updateDksData,
} from 'src/store/actuationSlice';
import {
  getSelectedKey,
  getSelectedKeymapIndexes,
  getSelectedLayerIndex,
  getSelectedRawLayers,
  setLayer,
  updateSelectedKey,
} from 'src/store/keymapSlice';
import styled from 'styled-components';
import {AccentButton} from 'src/components/inputs/accent-button';
import {useTranslation} from 'react-i18next';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';
import {KeycodePane} from './keycode';
import {ControlRow, Detail} from 'src/components/panes/grid';
import {getNameForByte} from 'src/utils/key';
import {SimpleIconButton} from 'src/components/inputs/icon-button';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faBackward,
  faChevronLeft,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import {FlexLabel} from '../screen/screen-tool';

const Pane = styled.div`
  display: flex;
  width: 100%;
`;
const Configure = styled.div`
  width: 450px;
  margin-right: 10px;
  flex-shrink: 0;
  padding-top: 10px;
`;
const NoSelectedKey = styled.div`
  width: 100%;
  display: block;
  border: 1px solid var(--border_color_cell);
  border-style: dashed;
  padding: 20px 20px;
  border-radius: 15px;
  box-sizing: border-box;
  text-align: center;
  color: var(--color_label-highlighted);
`;
const KeycodeContainer = styled.div`
  height: calc(100vh - 580px);
  padding-left: 10px;
  overflow-y: auto;
  width: 100%;
  border-left: 1px solid var(--border_color_cell);
`;

const DksBindingContainer = styled.div`
  height: calc(100vh - 600px);
  overflow-y: auto;
  padding-left: 10px;
  color: var(--color_label);
`;

const DksBindings = styled.div`
  flex-wrap: wrap;
  display: flex;
  margin-top: 20px;
`;

const DksBindingOriginKey = styled.div`
  padding: 0 20px;
  cursor: pointer;
`;

const DksBindingKey = styled.div`
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
  border: 2px solid var(--border_color_icon);
  margin-right: 10px;
  & > span {
    white-space: pre-wrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: none;
    color: var(--color_label-highlighted);
  }
`;

const DksBinding = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  & > button {
    margin-left: 10px;
  }
  &:hover ${DksBindingKey} {
    border-color: var(--color_accent);
  }
`;

const DksBindingKeys = styled.div`
  display: flex;
  cursor: pointer;
`;

const ConfigureHeader = styled.div`
  position: relative;
  height: 24px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border_color_cell);
  text-align: center;
  color: var(--color_label);
  > span {
    color: var(--color_accent);
  }
  margin-bottom: 10px;
  ${SimpleIconButton} {
    position: absolute;
    padding: 0 10px;
    font-size: 16px;
    left: 0px;
    top: 2px;
  }
`;

export const DKSConfigure: React.FC = () => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(getSelectedKey);
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedLayerIndex = useAppSelector(getSelectedLayerIndex);
  const showConfigure = selectedKey !== null && selectedDefinition;

  const configuredDksData = useAppSelector(getConfiguredDksData);
  const keymapIndexes = useAppSelector(getSelectedKeymapIndexes);

  const {basicKeyToByte, byteToKey} = useAppSelector(getBasicKeyToByte);
  const defineition = useAppSelector(getSelectedDefinition);
  const customKeycodes = defineition ? defineition.customKeycodes : undefined;

  const layers = useAppSelector(getSelectedRawLayers);

  const dksData = useAppSelector(getSelectDksData);
  if (!dksData) {
    return null;
  }

  const getKeyName = (byte: number) => {
    // return getLabelForByte(byte, 100, basicKeyToByte, byteToKey);
    return getNameForByte(byte, basicKeyToByte, byteToKey, customKeycodes);
  };

  const {actuation, actions} = dksData;

  const updateActuation = (actv: number) => {
    if (selectedKey === null) {
      return;
    }
    dispatch(
      updateDksData(selectedLayerIndex, selectedKey, {
        actuation: actv,
        actions: actions,
      }),
    );
  };
  const updateActions = (acts: DKSActions) => {
    if (selectedKey === null) {
      return;
    }
    dispatch(
      updateDksData(selectedLayerIndex, selectedKey, {
        actuation: actuation,
        actions: acts,
      }),
    );
  };

  const clear = () => {
    if (selectedKey === null) {
      return;
    }
    dispatch(updateDksData(selectedLayerIndex, selectedKey, null));
    dispatch(updateSelectedKey(null));
  };

  return (
    <Pane>
      <Configure>
        {showConfigure ? (
          <>
            <ConfigureHeader>
              <SimpleIconButton
                onClick={() => dispatch(updateSelectedKey(null))}
              >
                <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
              </SimpleIconButton>
              [{' '}
              <span>
                {getKeyName(
                  layers[selectedLayerIndex].keymap[keymapIndexes[selectedKey]],
                )}
              </span>{' '}
              ]
            </ConfigureHeader>
            <ActuationPointConfigure
              actuation={actuation}
              updateActuation={updateActuation}
            />
            <DKSActionPane actions={actions} updateActions={updateActions} />
            <div
              style={{
                borderTop: '1px solid var(--border_color_cell)',
                marginTop: 20,
              }}
            >
              <ControlRow>
                <FlexLabel></FlexLabel>
                <Detail>
                  <SimpleIconButton
                    style={{
                      fontSize: 20,
                      paddingRight: 10,
                    }}
                  >
                    <FontAwesomeIcon
                      onClick={clear}
                      icon={faTrashCan}
                    ></FontAwesomeIcon>
                  </SimpleIconButton>
                  {/* <AccentButton
                    onClick={() => dispatch(updateSelectedKey(null))}
                  >
                    {t('Done')}
                  </AccentButton> */}
                </Detail>
              </ControlRow>
            </div>
          </>
        ) : (
          <>
            {configuredDksData.length > 0 ? (
              <DksBindingContainer>
                {t('Current bindings')} : {configuredDksData.length}
                <DksBindings>
                  {configuredDksData.map((dks, idx) => {
                    const keyIdx = keymapIndexes.indexOf(dks.key);
                    if (keyIdx === -1) {
                      return null;
                    }
                    return (
                      <DksBinding key={idx}>
                        <DksBindingOriginKey
                          onClick={() => {
                            dispatch(setLayer(dks.layerIdx));
                            dispatch(updateSelectedKey(keyIdx));
                          }}
                        >
                          <DksBindingKey>
                            <span>
                              {getKeyName(layers[dks.layerIdx].keymap[dks.key])}
                            </span>
                          </DksBindingKey>
                        </DksBindingOriginKey>
                        <DksBindingKeys
                          onClick={() => {
                            dispatch(setLayer(dks.layerIdx));
                            dispatch(updateSelectedKey(keyIdx));
                          }}
                        >
                          {dks.data?.actions.map((a, aIdx) => (
                            <DksBindingKey key={aIdx}>
                              <span>{getKeyName(a.key)}</span>
                            </DksBindingKey>
                          ))}
                        </DksBindingKeys>
                        <SimpleIconButton
                          onClick={() =>
                            dispatch(updateDksData(dks.layerIdx, keyIdx, null))
                          }
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </SimpleIconButton>
                      </DksBinding>
                    );
                  })}
                </DksBindings>
              </DksBindingContainer>
            ) : (
              <NoSelectedKey>
                {t('Selecting a key to start setting dynamic keystroke')}
              </NoSelectedKey>
            )}
          </>
        )}
      </Configure>
      <KeycodeContainer>
        <KeycodePane actions={actions} updateActions={updateActions} />
      </KeycodeContainer>
    </Pane>
  );
};
