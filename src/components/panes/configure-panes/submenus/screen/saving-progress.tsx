import {FC} from 'react';
import {ProgressBarTooltip} from 'src/components/inputs/tooltip';
import styled from 'styled-components';
import {printBytes} from './screen-tool';
import { useTranslation } from 'react-i18next';

const ProgressBarContainer = styled.div`
  position: relative;
  margin-top: 10px;
  line-height: 1;
  &:hover {
    & .tooltip {
      transform: scale(1) translateY(0px);
      opacity: 1;
    }
  }
  .tooltip {
    transform: translateY(5px) scale(0.6);
    opacity: 0;
  }
`;
const ProgressBar = styled.div`
  background: var(--bg_control);
  position: relative;
  padding: 5px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
  cursor: pointer;
  width: 250px;

  > span {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    background: var(--color_accent);
    height: 10px;
    width: 100%;
    transform: scaleX(0.01);
    transform-origin: left;
    transition: transform 0.4s ease-in-out;
  }
`;

const SavingStatus = styled.div`
  margin-left: 10px;
`;

const printTime = (seconds: number) => {
  seconds = ~~seconds;
  const minutes = ~~(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const SavingProgress: FC<{
  bufferSize: number;
  bytesSended: number;
  sendSpeed: number;
}> = ({bufferSize, bytesSended, sendSpeed}) => {
  const {t} = useTranslation()
  return (
    <>
      <ProgressBarContainer>
        <ProgressBar>
          <span style={{transform: `scaleX(${bytesSended / bufferSize})`}} />
        </ProgressBar>
        <ProgressBarTooltip>
          {printBytes(sendSpeed)}/s,{' '}
          {`  -${printTime((bufferSize - bytesSended) / sendSpeed)}`}
        </ProgressBarTooltip>
      </ProgressBarContainer>
      <SavingStatus>
        {~~((bytesSended / bufferSize) * 100)} % ({printBytes(bytesSended)} /{' '}
        {printBytes(bufferSize)}){' '}{bytesSended === 0 && t('Initializing')}
      </SavingStatus>
    </>
  );
};
