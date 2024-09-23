import React from 'react';
import styled from 'styled-components';
import {ActionRow} from './action';
import {DKSAction, DKSActions} from 'src/types/types';

const ActionGrid = styled.div``;

export const DKSActionPane: React.FC<{
  actions: DKSActions;
  updateActions(actioins: DKSActions): void;
}> = ({actions, updateActions}) => {
  const updateAction = (index: number, newAction: DKSAction) => {
    const newActions = actions.map((v, i) =>
      i === index ? newAction : v,
    ) as DKSActions;
    updateActions(newActions);
  };
  return (
    <ActionGrid>
      {actions.map((a, i) => (
        <ActionRow key={i} action={a} index={i} updateAction={updateAction} />
      ))}
    </ActionGrid>
  );
};
