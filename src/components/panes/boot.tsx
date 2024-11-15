import {FC, useRef, useState} from 'react';
import {Pane} from './pane';
import {ControlRow, Detail, Label} from './grid';
import {useTranslation} from 'react-i18next';
import {AccentButton} from '../inputs/accent-button';
import {HiddenInput} from '../inputs/accent-slider';
import {
  getBytesSended,
  getBufferSize,
  getSendSpeed,
  saveTabFirmware,
  getSavingState,
  updateState,
} from 'src/store/boot';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import styled from 'styled-components';
import {SavingProgress} from './configure-panes/submenus/screen/saving-progress';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {FlexLabel} from './configure-panes/submenus/screen/screen-tool';
import {faWarning} from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  padding-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Boot: FC = () => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const state = useAppSelector(getSavingState);
  const bufferSize = useAppSelector(getBufferSize);
  const bytesSended = useAppSelector(getBytesSended);
  const sendSpeed = useAppSelector(getSendSpeed);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<{
    name: string;
    byteArray: Uint8Array;
  } | null>();

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

  const saveFile = () => {
    if (!file) {
      return;
    }
    dispatch(saveTabFirmware(file.byteArray));
  };

  return (
    <Pane>
      <Container>
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
      </Container>
    </Pane>
  );
};
