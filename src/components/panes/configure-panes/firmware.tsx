import {faMicrochip, faWarning} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {FC, useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {CenterPane} from '../pane';
import {ControlRow, Detail, Label} from '../grid';
import {AccentButton} from 'src/components/inputs/accent-button';
import {useTranslation} from 'react-i18next';
import {FlexLabel} from './submenus/screen/screen-tool';
import {
  getBytesSended,
  getBufferSize,
  getSendSpeed,
  saveTabFirmware,
  getSavingState,
  updateState,
  getCfgFirmwareFile,
} from 'src/store/firmware';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {SavingProgress} from './submenus/screen/saving-progress';
import {
  getFirmwareNeedUpdate,
  getCfgFirmwareVersion,
  getSelectedDeviceFirmwareVersion,
} from 'src/store/firmware';

const FirmwarePane = styled(CenterPane)`
  grid-column: span 2;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0 12px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const PointBadge = styled.div`
  position: absolute;
  background: rgb(220 53 69);
  padding: 5px;
  border-radius: 50%;
  right: 0;
  top: 0;
`;

const TextBadge = styled.span`
  position: absolute;
  top: 4px;
  display: inline-block;
  background: rgb(220 53 69);
  line-height: 1em;
  color: #fff;
  font-size: 12px;
  margin-left: 6px;
  padding: 2px;
  vertical-align: middle;
  border-radius: 5px;
`;

export const Pane: FC = () => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const state = useAppSelector(getSavingState);
  const bufferSize = useAppSelector(getBufferSize);
  const bytesSended = useAppSelector(getBytesSended);
  const sendSpeed = useAppSelector(getSendSpeed);
  const needUpdate = useAppSelector(getFirmwareNeedUpdate);
  const currentVersion = useAppSelector(getSelectedDeviceFirmwareVersion);
  const newVersion = useAppSelector(getCfgFirmwareVersion);
  const newFirmwareFile = useAppSelector(getCfgFirmwareFile);

  const [newFirmware, setNewFirmware] = useState<Uint8Array | null>(null);
  const [file, setFile] = useState<{
    name: string;
    byteArray: Uint8Array;
  } | null>();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const importFile = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (evt.target.files?.[0]) {
      const file = evt.target.files[0];
      const name = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      setFile({name, byteArray});
      dispatch(updateState('waiting'));
    } else {
      setFile(null);
    }
  };

  const loadFirmware = async () => {
    if (!newFirmwareFile || newFirmware) {
      return;
    }
    const url = '/tabkb/firmwares/' + newFirmwareFile;
    const response = await fetch(url, {
      cache: 'reload',
    });
    if (response.status !== 200) {
      console.log(url + ': ' + response.statusText);
      return;
    }
    const data = await response.arrayBuffer();
    const byteArray = new Uint8Array(data);
    setNewFirmware(byteArray);
  };

  const update = () => {
    if (!newFirmware) {
      dispatch(updateState('failed'));
      return;
    }
    dispatch(saveTabFirmware(newFirmware));
  };

  const saveFile = () => {
    if (!file) {
      return;
    }
    dispatch(saveTabFirmware(file.byteArray));
  };

  useEffect(() => {
    loadFirmware();
  }, []);

  return (
    <FirmwarePane>
      <Container>
        {currentVersion && (
          <ControlRow>
            <Label>
              {t('Current Version')}: v{currentVersion}
              {needUpdate && (
                <>
                  , {t('Update Available')} : v{newVersion}{' '}
                  <TextBadge>new</TextBadge>
                </>
              )}
            </Label>
            {needUpdate && (
              <Detail>
                <AccentButton onClick={update} disabled={state === 'saving'}>
                  {t('Update')}
                </AccentButton>
              </Detail>
            )}
          </ControlRow>
        )}
        <ControlRow>
          <Label>
            {t('Firmware')}：{file?.name}
          </Label>
          <Detail>
            <AccentButton disabled={state === 'saving'} onClick={importFile}>
              {t('Open')}
            </AccentButton>
            <HiddenInput
              accept={'.uf2'}
              onChange={handleFileChange}
              type="file"
              ref={fileRef}
            />
          </Detail>
        </ControlRow>
        <ControlRow>
          <FlexLabel>
            {state === 'failed' && (
              <>
                <FontAwesomeIcon
                  icon={faWarning}
                  size="xs"
                  style={{color: 'gold', marginRight: 5}}
                />
                {t('Failed to flash.')}
              </>
            )}
            {state === 'completed' && t('Flash successful.')}{' '}
            {state === 'saving' && (
              <SavingProgress
                bufferSize={bufferSize}
                sendSpeed={sendSpeed}
                bytesSended={bytesSended}
              />
            )}
          </FlexLabel>
          <Detail>
            <AccentButton
              onClick={saveFile}
              disabled={!file || state === 'saving'}
            >
              {t('Flash')}
            </AccentButton>
          </Detail>
        </ControlRow>
        <ControlRow>
        <Label style={{fontSize: 16}}>
          {t(
            'Please DO NOT disconnect or switch mode during the upgrade, until the keyboard auto-reboot finishes.',
          )}
        </Label>
      </ControlRow>
      </Container>
    </FirmwarePane>
  );
};

export const Icon = () => {
  const needUpdate = useAppSelector(getFirmwareNeedUpdate);
  return (
    <div style={{position: 'relative'}}>
      {needUpdate ? <PointBadge /> : null}
      <FontAwesomeIcon icon={faMicrochip} />
    </div>
  );
};

export const Title = 'Firmware';
