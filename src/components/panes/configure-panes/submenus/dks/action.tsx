import React from 'react';
import {DKSPoint, DKSAction, DKSPointLength, DKSKey} from 'src/types/types';
import styled from 'styled-components';
import {PointControl} from './point';
import {KeyBinding} from './key';

const Row = styled.div`
  padding: 5px 0;
  display: flex;
  align-items: center;
`;

const Points = styled.div`
  width: 330px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
  height: 24px;
`;

const lengthToPoint = (length: DKSPointLength): DKSAction['points'] => {
  let p1 = DKSPoint.Hold;
  let p2 = DKSPoint.Hold;
  let p3 = DKSPoint.Hold;
  let p4 = DKSPoint.Hold;
  switch (length[0]) {
    case 1:
      p1 = DKSPoint.Single;
      break;
    case 2:
      p1 = DKSPoint.Down;
      p2 = DKSPoint.Up;
      p3 = DKSPoint.Hold;
      p4 = DKSPoint.Up;
      break;
    case 3:
      p1 = DKSPoint.Down;
      p2 = DKSPoint.Hold;
      p3 = DKSPoint.Up;
      p4 = DKSPoint.Up;
      break;
    case 4:
      p1 = DKSPoint.Down;
      p2 = DKSPoint.Hold;
      p3 = DKSPoint.Hold;
      p4 = DKSPoint.Up;
      break;
  }
  switch (length[1]) {
    case 1:
      p2 = DKSPoint.Single;
      break;
    case 2:
      p2 = DKSPoint.Down;
      p3 = DKSPoint.Up;
      p4 = DKSPoint.Up;
      break;
    case 3:
    case 4:
      p2 = DKSPoint.Down;
      p3 = DKSPoint.Hold;
      p4 = DKSPoint.Up;
      break;
  }
  switch (length[2]) {
    case 1:
      p3 = DKSPoint.Single;
      break;
    case 2:
    case 3:
    case 4:
      p3 = DKSPoint.Down;
      p4 = DKSPoint.Up;
      break;
  }
  if (length[3] === 1) {
    p4 = DKSPoint.Single;
  }
  return [p1, p2, p3, p4] as DKSAction['points'];
};

const pointToLength = (points: DKSAction['points']): DKSPointLength => {
  const [p1, p2, p3, p4] = points;
  let l1 = 0;
  let l2 = 0;
  let l3 = 0;
  let l4 = 0;
  if (p1 === DKSPoint.Single) {
    l1 = 1;
  } else if (p1 === DKSPoint.Down) {
    if (p2 === DKSPoint.Hold) {
      l1 = p3 === DKSPoint.Hold ? 4 : 3;
    } else {
      l1 = 2;
    }
  }
  if (p2 === DKSPoint.Single) {
    l2 = 1;
  } else if (p2 === DKSPoint.Down && l1 < 3) {
    l2 = p3 === DKSPoint.Hold ? 3 : 2;
  }
  if (p3 === DKSPoint.Single) {
    l3 = 1;
  } else if (p3 === DKSPoint.Down && l1 < 4 && l2 < 3) {
    l3 = 2;
  }
  if (p4 === DKSPoint.Single) {
    l4 = 1;
  }
  return [l1, l2, l3, l4];
};

export const ActionRow: React.FC<{
  action: DKSAction;
  index: number;
  updateAction(i: number, a: DKSAction): void;
}> = ({action, index, updateAction}) => {
  const pointLength = pointToLength(action.points);

  const updatePointLength = (pointIdx: number, length: number) => {
    const newLength = pointLength.map((v, i) =>
      i === pointIdx ? length : v,
    ) as DKSPointLength;
    updateAction(index, {
      key: action.key,
      points: lengthToPoint(newLength),
    });
  };

  const updateKey = (key: DKSKey) => {
    updateAction(index, {key: key, points: action.points});
  };

  return (
    <Row>
      <KeyBinding rowIndex={index} dksKey={action.key} updateKey={updateKey} />
      <Points>
        {action.points.map((p, i) => (
          <PointControl
            key={i}
            points={action.points}
            pointIndex={i}
            pointLength={pointLength}
            updatePointLength={updatePointLength}
          />
        ))}
      </Points>
    </Row>
  );
};
