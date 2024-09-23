import {useTranslation} from 'react-i18next';
import {AccentButton, PrimaryAccentButton} from './accent-button';

import {
  ModalBackground,
  ModalContainer,
  PromptText,
  RowDiv,
} from './dialog-base';

export const Dialog: React.FC<{
  text?: string;
  onConfirm: () => void;
  onExit?: () => void;
  cancelText?: string;
  confirmText?: string;
}> = (props) => {
  const {t} = useTranslation();
  const cancelText = props.cancelText ?? 'Cancel';
  const confirmText = props.confirmText ?? 'Confirm';

  return (
    <ModalBackground>
      <ModalContainer>
        <PromptText>{props.text && props.text}</PromptText>
        <RowDiv>
          <AccentButton onClick={props.onExit}>{t(cancelText)}</AccentButton>
          <PrimaryAccentButton onClick={props.onConfirm}>
            {t(confirmText)}
          </PrimaryAccentButton>
        </RowDiv>
      </ModalContainer>
    </ModalBackground>
  );
};
