import {FC, useEffect, useState} from 'react';

import {ControlRow, Label, Detail} from 'src/components/panes/grid';
import {ScreenFileType} from 'src/types/types';
import {ExportSelect, FlexLabel} from './screen-tool';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getSavingState,
  getSelectedTool,
  initSendState,
  saveTabFile,
  updateState,
} from 'src/store/screenSlice';
import {SavingProgress} from './saving-progress';
import {AccentButton} from 'src/components/inputs/accent-button';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faWarning} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {
  getBytesSended,
  getBufferSize,
  getSendSpeed,
} from 'src/store/screenSlice';
import {Dialog} from 'src/components/inputs/dialog';
import {
  getLightingSupport,
  getSelectedDefinition,
} from 'src/store/definitionsSlice';

export const FileSaveControl: FC<{
  area: ScreenFileType;
  setArea: React.Dispatch<React.SetStateAction<ScreenFileType>>;
  generate: () => Uint8Array | null;
  disabled: boolean;
}> = ({area, setArea, generate, disabled}) => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const state = useAppSelector(getSavingState);
  const [error, setError] = useState('');
  const bufferSize = useAppSelector(getBufferSize);
  const bytesSended = useAppSelector(getBytesSended);
  const sendSpeed = useAppSelector(getSendSpeed);
  const [processing, setProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const selectedTool = useAppSelector(getSelectedTool);
  const lightingSupport = useAppSelector(getLightingSupport);

  const saveFile = async () => {
    setError('');
    setProcessing(true);

    const process = async () => {
      let data = null;

      try {
        data = generate();
      } catch (e) {
        console.log(e);
      }

      setProcessing(false);
      if (data == null) {
        setError(t('Failed to process.'));
        return;
      }

      await dispatch(initSendState({size: data.length}));
      dispatch(
        saveTabFile(data, (success) => {
          if (!success) {
            setError(t('Failed to save.'));
          }
        }),
      );
    };

    setTimeout(() => {
      process();
    }, 300);
  };

  useEffect(() => {
    if (state !== 'saving') {
      setShowDialog(false);
    }
  }, [state]);

  return (
    <>
      <ControlRow>
        <Label>{t('Type')}：</Label>
        <Detail>
          <ExportSelect
            area={area}
            onChange={(option) => setArea(option.value)}
          />
        </Detail>
      </ControlRow>
      <ControlRow>
        <FlexLabel>
          {error && (
            <>
              <FontAwesomeIcon
                icon={faWarning}
                size="xs"
                style={{color: 'gold', marginRight: 5}}
              />
              {error}
            </>
          )}{' '}
          {processing && t('Processing')}
          {state === 'saving' && (
            <SavingProgress
              bufferSize={bufferSize}
              sendSpeed={sendSpeed}
              bytesSended={bytesSended}
            />
          )}
        </FlexLabel>
        <Detail>
          {state === 'saving' && bytesSended > 0 && (
            <>
              <AccentButton onClick={() => setShowDialog(true)}>
                {t('Cancel')}
              </AccentButton>
              {showDialog && state === 'saving' && bytesSended > 0 && (
                <Dialog
                  text={t(
                    `Cancel transfer will revert to factory default ${selectedTool}, confirm cancel?`,
                  )}
                  cancelText="No"
                  confirmText="Yes"
                  onConfirm={() => {
                    dispatch(updateState('canceled'));
                    setShowDialog(false);
                  }}
                  onExit={() => setShowDialog(false)}
                />
              )}
            </>
          )}
          {state !== 'saving' && (
            <>
              <AccentButton onClick={saveFile} disabled={disabled}>
                {t('Save')}
              </AccentButton>
            </>
          )}
        </Detail>
      </ControlRow>
      {lightingSupport && (
        <ControlRow>
          <Label style={{fontSize: 16}}>
            {t(
              'To boost the data transfer speed, the backlight will shut off during transfer period and resume afterwards.',
            )}
          </Label>
        </ControlRow>
      )}
    </>
  );
};
