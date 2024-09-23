import {ThreeEvent} from '@react-three/fiber';
import {useRef} from 'react';
import {useDispatch} from 'react-redux';
import {addSelectedKey, toggleSelectedKey} from 'src/store/keymapSlice';

export const useMultiSelect = () => {
  const dispatch = useDispatch();
  const selecting = useRef(false);

  const handlePointerUp = () => {
    window.removeEventListener('pointerup', handlePointerUp);
    selecting.current = false;
  };

  const onPointerDownHandler = (
    evt: ThreeEvent<MouseEvent> | React.MouseEvent,
    idx: number,
  ) => {
    window.addEventListener('pointerup', handlePointerUp);
    dispatch(toggleSelectedKey(idx));
    selecting.current = true;
  };

  const onPointerOverHandler = (
    evt: ThreeEvent<MouseEvent> | React.MouseEvent,
    idx: number,
  ) => {
    if (selecting.current) {
      dispatch(addSelectedKey(idx));
    }
  };

  return {
    onMultiPointerDown: onPointerDownHandler,
    onMultiPointerOver: onPointerOverHandler,
  };
};
