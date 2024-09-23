import React, {useEffect, useRef, useState} from 'react';
import {DKSAction, DKSPoint, DKSPointLength} from 'src/types/types';
import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import Draggable, {DraggableEventHandler} from 'react-draggable';
import {SvgIconBorder} from './icons';

const size = 100;
const minSize = 24;

const calcWidthFromLength = (length: number) => {
  return length === 0 ? 0 : length === 1 ? minSize : (length - 1) * size;
};

const Flow = styled.div.attrs<{$width: number}>((props) => ({
  style: {
    width: props.$width + 'px',
  },
}))`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  background: var(--color_accent);
  border-radius: ${minSize}px;
  height: ${minSize}px;
  cursor: pointer;
`;

const IconWrapper = styled.div`
  width: ${minSize}px;
  height: ${minSize}px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color_label-highlighted);
  border-radius: ${minSize}px;
  background: var(--bg_control);
`;

const PointContainer = styled.div.attrs<{$index: number}>((props) => ({
  style: {
    left: size * props.$index + 'px',
  },
}))`
  position: absolute;
  height: ${minSize}px;
`;

const Dragger = styled.div.attrs<{$width: number}>((props) => ({
  style: {
    left:
      props.$width > 0
        ? props.$width - minSize / 2 + minSize / 4 + 'px'
        : '0px',
    cursor: props.$width > 0 ? 'ew-resize' : 'pointer',
    width: props.$width > 0 ? minSize / 2 + 'px' : minSize + 'px',
  },
}))`
  position: absolute;
  z-index: 2;
  height: ${minSize}px;
  top: 0;
`;

const getMaxLength = (index: number, points: DKSAction['points']): number => {
  let maxLength = 1;
  for (let i = index + 1; i < points.length - 1; i++) {
    if (points[i] === DKSPoint.Down || points[i] === DKSPoint.Single) {
      break;
    }
    maxLength++;
  }
  return maxLength;
};

const isDisabled = (index: number, pointLength: DKSPointLength): boolean => {
  if (index === 0 || index === pointLength.length - 1) {
    return false;
  }
  for (let i = 0; i < index; i++) {
    if (pointLength[i] > index - i + 1) {
      return true;
    }
  }
  return false;
};

export const PointControl: React.FC<{
  pointIndex: number;
  points: DKSAction['points'];
  pointLength: DKSPointLength;
  updatePointLength(index: number, length: number): void;
}> = ({points, pointIndex, updatePointLength, pointLength}) => {
  const disabled = isDisabled(pointIndex, pointLength);

  const length = pointLength[pointIndex];
  const maxLength = getMaxLength(pointIndex, points);
  const maxWidth =
    pointIndex === points.length - 1 ? minSize : maxLength * size;

  const [width, setWidth] = useState(0);

  const updateWidth = (x: number) => {
    const startX = containerRef.current?.getBoundingClientRect().x;
    if (!startX) {
      return;
    }
    let width = x - startX;
    if (width > maxWidth) {
      width = maxWidth;
    } else if (width < minSize) {
      width = minSize;
    }
    setWidth(width);
  };

  const handleStop: DraggableEventHandler = (e, data) => {
    const length =
      Math.floor(width / size) + (width % size > size / 2 ? 1 : 0) + 1;
    updatePointLength(pointIndex, length);
    setWidth(calcWidthFromLength(length));
  };

  const handleDrag: DraggableEventHandler = (e, data) => {
    const {clientX} = e as MouseEvent;
    updateWidth(clientX);
  };

  const handleStart: DraggableEventHandler = (e, data) => {
    const {clientX} = e as MouseEvent;
    updateWidth(clientX);
  };

  const handleTriggerClick = () => {
    setWidth(0);
    updatePointLength(pointIndex, 0);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWidth(calcWidthFromLength(length));
  }, [length]);

  return (
    <PointContainer ref={containerRef} $index={pointIndex}>
      {width === 0 && (
        <IconWrapper>
          <FontAwesomeIcon icon={faPlus} />
        </IconWrapper>
      )}
      {!disabled && (
        <Draggable
          axis="x"
          onStart={handleStart}
          onDrag={handleDrag}
          onStop={handleStop}
          position={{x: 0, y: 0}}
        >
          <Dragger $width={width} />
        </Draggable>
      )}
      {width > 0 && (
        <Flow $width={width} onClick={handleTriggerClick}>
          <SvgIconBorder size={minSize} />
        </Flow>
      )}
    </PointContainer>
  );
};
