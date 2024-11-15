import styled from 'styled-components';
import {OverflowCell, SubmenuOverflowCell, SubmenuRow} from '../grid';
import {CenterPane} from '../pane';
import React, {useEffect, useMemo, useState} from 'react';
import {useDispatch} from 'react-redux';
import {
  getActiveMenu,
  getSelfChecked,
  updateMenu,
} from 'src/store/actuationSlice';
import {useAppSelector} from 'src/store/hooks';
import {
  clearSelectedKeys,
  setConfigureKeyboardIsSelectable,
  setLayer,
  updateMultiSelectAble,
  updateSelectedKey,
  updateSelectedKeys,
  updateShowLayerControl,
} from 'src/store/keymapSlice';
import {ActuationMenu} from 'src/types/types';
import {useTranslation} from 'react-i18next';
import {DKSConfigure} from './submenus/dks/dks';
import {ActuationConfiger} from './submenus/actuation/actuation';
import {RTConfiger} from './submenus/actuation/rt';
import {SelfCheck} from './submenus/actuation/self-check';

const title = 'Actuation';

const MenuContainer = styled.div`
  padding: 15px 10px 20px 10px;
`;

const ActuationPane = styled(CenterPane)`
  height: 100%;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 12px;
`;

export const Pane: React.FC = () => {
  const {t, i18n} = useTranslation();
  const dispatch = useDispatch();
  const selfChecked = useAppSelector(getSelfChecked);

  const menus: {
    action: ActuationMenu;
    configure: JSX.Element;
  }[] = [
    {
      action: 'AP',
      configure: <ActuationConfiger />,
    },
    {action: 'RT', configure: <RTConfiger />},
    {action: 'DKS', configure: <DKSConfigure />},
    {action: 'SELF CHECK', configure: <SelfCheck />},
  ];

  const menu = useAppSelector(getActiveMenu);

  const changeMenu = (m: ActuationMenu) => {
    dispatch(updateMenu(m));
    dispatch(clearSelectedKeys());
  };

  const screenMenus = useMemo(
    () =>
      menus.map((m) => (
        <SubmenuRow
          $selected={m.action === menu}
          onClick={() => changeMenu(m.action)}
          key={m.action}
          style={{
            borderWidth: 0,
            textAlign: 'center',
            cursor: selfChecked ? 'pointer' : 'default',
          }}
        >
          {t(m.action)}
        </SubmenuRow>
      )),
    [menus, menu, i18n.language],
  );

  useEffect(() => {
    switch (menu) {
      case 'DKS':
        dispatch(setConfigureKeyboardIsSelectable(true));
        break;
      case 'AP':
      case 'RT':
        dispatch(updateShowLayerControl(false));
        dispatch(updateMultiSelectAble(true));
        dispatch(setLayer(0));
        break;
    }
    return () => {
      dispatch(setConfigureKeyboardIsSelectable(false));
      dispatch(updateMultiSelectAble(false));
      dispatch(updateShowLayerControl(true));
      dispatch(updateSelectedKey(null));
      dispatch(updateSelectedKeys([]));
    };
  }, [menu]);

  return (
    <>
      <SubmenuOverflowCell>
        <MenuContainer>{screenMenus}</MenuContainer>
      </SubmenuOverflowCell>
      <OverflowCell>
        <ActuationPane>
          <Container>
            {menus.filter((m) => m.action === menu)[0].configure}
          </Container>
        </ActuationPane>
      </OverflowCell>
    </>
  );
};

export const Icon: React.FC = () => {
  return (
    <svg fill="currentColor" viewBox="0 0 54 54">
      <path d="M 13.7851 49.5742 L 42.2382 49.5742 C 47.1366 49.5742 49.5743 47.1367 49.5743 42.3086 L 49.5743 13.6914 C 49.5743 8.8633 47.1366 6.4258 42.2382 6.4258 L 13.7851 6.4258 C 8.9101 6.4258 6.4257 8.8398 6.4257 13.6914 L 6.4257 42.3086 C 6.4257 47.1602 8.9101 49.5742 13.7851 49.5742 Z M 13.8554 45.8008 C 11.5117 45.8008 10.1992 44.5586 10.1992 42.1211 L 10.1992 13.8789 C 10.1992 11.4414 11.5117 10.1992 13.8554 10.1992 L 42.1679 10.1992 C 44.4882 10.1992 45.8007 11.4414 45.8007 13.8789 L 45.8007 42.1211 C 45.8007 44.5586 44.4882 45.8008 42.1679 45.8008 Z M 28.0351 13.4571 C 27.4960 13.4571 27.0976 13.6914 26.6523 14.1133 L 18.7070 22.0352 C 18.4023 22.3398 18.2148 22.7617 18.2148 23.2539 C 18.2148 24.2149 18.9882 24.9414 19.9257 24.9414 C 20.4413 24.9414 20.8632 24.7539 21.1913 24.4258 L 24.0742 21.4961 L 26.4648 18.6602 L 26.2773 23.6289 L 26.2773 32.2774 L 26.4648 37.2461 L 24.0742 34.4102 L 21.1913 31.4571 C 20.8632 31.1289 20.4413 30.9414 19.9257 30.9414 C 18.9882 30.9414 18.2148 31.6680 18.2148 32.6289 C 18.2148 33.1211 18.4023 33.5430 18.7070 33.8477 L 26.6523 41.7695 C 27.0976 42.2149 27.4960 42.4492 28.0351 42.4492 C 28.5273 42.4492 28.9257 42.2383 29.3944 41.7695 L 37.3398 33.8477 C 37.6444 33.5430 37.8085 33.1211 37.8085 32.6289 C 37.8085 31.6680 37.0820 30.9414 36.1210 30.9414 C 35.6054 30.9414 35.1835 31.1523 34.8788 31.4571 L 31.9726 34.4102 L 29.6054 37.2227 L 29.7929 32.2774 L 29.7929 23.6289 L 29.6054 18.6836 L 31.9726 21.4961 L 34.8788 24.4258 C 35.1835 24.7305 35.6054 24.9414 36.1210 24.9414 C 37.0820 24.9414 37.8085 24.2149 37.8085 23.2539 C 37.8085 22.7617 37.6444 22.3398 37.3398 22.0352 L 29.3944 14.1133 C 28.9257 13.6445 28.5273 13.4571 28.0351 13.4571 Z"></path>
    </svg>
  );
};
export const Title = title;