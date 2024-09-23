import React from 'react';
import styled from 'styled-components';

const Container = styled.span`
  display: inline-flex;
  align-items: center;
  line-height: initial;
  column-gap: 5px;
  min-width: 200px;
`;

const SliderInput = styled.input.attrs({type: 'range'})<any>`
  accent-color: var(--color_accent);
  width: 200px;
`;

export const AccentRange: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
    onChange: (x: number) => void;
    showLabel?: boolean;
  }
> = (props) => {
  const {showLabel, ...otherProps} = props;
  return (
    <Container>
      {props.showLabel && <span>{props.value ?? props.defaultValue}</span>}
      <SliderInput
        {...otherProps}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          props.onChange && props.onChange(+e.target.value);
        }}
      />
    </Container>
  );
};
