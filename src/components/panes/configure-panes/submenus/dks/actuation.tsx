import styled from 'styled-components';
import {
  SvgIconArrowDownLine,
  SvgIconArrowUpLine,
  SvgIconLineArrowDown,
  SvgIconLineArrowUp,
} from './icons';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {AccentButton} from 'src/components/inputs/accent-button';
import {ModalContainer, PromptText} from 'src/components/inputs/dialog-base';
import {AccentRange} from 'src/components/inputs/accent-range';
import {useTranslation} from 'react-i18next';
import {useAppSelector} from 'src/store/hooks';
import {getDKSActuations} from 'src/store/actuationSlice';

const ActuationContainer = styled.div`
  display: flex;
  margin-left: 50px;
  margin-bottom: 10px;
  font-size: 12px;
`;

const IconWrapper = styled.div`
  width: 30px;
  height: 30px;
  border: 2px solid var(--color_accent);
  border-radius: 5px;
  color: var(--color_accent);
`;

const Point = styled.div`
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Position = styled.div<{$enable: boolean}>`
  padding: 5px 0;
  text-decoration: ${(p) => (p.$enable ? 'underline' : 'none')};
  cursor: ${(p) => (p.$enable ? 'pointer' : 'default')};
  color: var(--color_label-highlighted);
  pointer-events: ${(p) => (p.$enable ? 'auto' : 'none')};
`;

const DialogContainer = styled.dialog`
  padding: 0;
  border-width: 0;

  background: transparent;
  &::backdrop {
    background: rgba(0, 0, 0, 0.75);
  }

  & > div {
    transition: transform 0.2s ease-out;
    transform: translateY(-20px);
  }

  &[open] > div {
    transform: translateY(0px);
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Range = styled(AccentRange)`
  transform: rotate(90deg);
  transform-origin: center;
  height: 150px;
  width: 150px;
`;

const RangeWrapper = styled.div`
  position: relative;
`;

const RangeLabel = styled.div.attrs<{$value: number}>((props) => {
  // 150 - 16
  const step = 134 / (meta.max - meta.min);
  return {
    style: {
      top: step * (props.$value - meta.min) + 4,
    },
  };
})`
  position: absolute;
  left: 120px;
  font-size: 12px;
  color: var(--color_accent);
`;

const Dialog: React.FC<
  PropsWithChildren<{
    isOpen: boolean;
    onClose?(): void;
  }>
> = (props) => {
  const {t} = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const closeModalWithCallback = useCallback(() => {
    if (ref.current) {
      ref.current.close();
    }
    if (props.onClose) {
      props.onClose();
    }
  }, [ref.current, props.onClose]);
  useEffect(() => {
    if (ref.current) {
      if (props.isOpen) {
        ref.current.showModal();
      } else {
        ref.current.close();
      }
    }
  }, [props.isOpen]);
  return (
    <DialogContainer ref={ref}>
      <ModalContainer>
        <PromptText>{props.children}</PromptText>
        <Controls>
          <AccentButton onClick={closeModalWithCallback}>
            {t('Confirm')}
          </AccentButton>
        </Controls>
      </ModalContainer>
    </DialogContainer>
  );
};

const meta = {
  min: 0.5,
  max: 2.5,
};

export const ActuationPointConfigure: React.FC<{
  actuation: number;
  updateActuation(a: number): void;
}> = ({actuation: actuation, updateActuation: updateActuation}) => {
  const [highestAct, setHightestAct] = useState(actuation);
  const actions = useAppSelector(getDKSActuations);
  const points = [
    {Icon: SvgIconLineArrowDown, value: highestAct},
    {Icon: SvgIconArrowDownLine, value: actions[1]},
    {Icon: SvgIconArrowUpLine, value: actions[1]},
    {Icon: SvgIconLineArrowUp, value: highestAct},
  ];
  const [dialogOpen, setDialogOpen] = useState(false);

  const onClose = () => {
    setDialogOpen(false);
    updateActuation(highestAct);
  };

  useEffect(() => {
    setHightestAct(actuation);
  }, [actuation]);

  return (
    <ActuationContainer>
      {points.map(({Icon, value}, i) => (
        <Point key={i}>
          <Position
            onClick={() => setDialogOpen(true)}
            $enable={i === 0 || i === 3}
          >
            {value} mm
          </Position>
          <IconWrapper>
            <Icon width={30} />
          </IconWrapper>
        </Point>
      ))}
      <Dialog isOpen={dialogOpen} onClose={onClose}>
        <RangeWrapper>
          <RangeLabel $value={highestAct}>{highestAct}mm</RangeLabel>
          <Range
            max={meta.max}
            min={meta.min}
            defaultValue={highestAct}
            step={0.05}
            onChange={(v) => {
              setHightestAct(v);
            }}
          />
        </RangeWrapper>
      </Dialog>
    </ActuationContainer>
  );
};
