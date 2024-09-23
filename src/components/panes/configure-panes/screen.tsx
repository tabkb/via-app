import styled from 'styled-components';
import {type FC, memo} from 'react';
import {CenterPane} from '../pane';
import {OverflowCell, SubmenuOverflowCell, SubmenuRow} from '../grid';
import {useAppSelector} from 'src/store/hooks';
import {
  getDeviceConfig,
  getSavingState,
  getScreenMenus,
  getSelectedTool,
  updateTool,
} from 'src/store/screenSlice';
import {shallowEqual, useDispatch} from 'react-redux';
import {ScreenTool} from 'src/types/types';
import {CropTool} from './submenus/screen/crop-tool';
import {SliderTool} from './submenus/screen/slider-tool';
import {useTranslation} from 'react-i18next';

const title = 'Screen';

const ScreenPane = styled(CenterPane)`
  height: 100%;
`;

const MenuContainer = styled.div<{$disabled: boolean}>`
  padding: 15px 10px 20px 10px;
  pointer-events: ${(p) => (p.$disabled ? 'none' : 'auto')};
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 12px;
`;

export const Media: FC<{
  type: string | undefined;
  src: string;
  width: number;
  height: number;
}> = memo(({type, src, width, height}) => {
  return (
    <div style={{pointerEvents: 'none'}}>
      {type?.startsWith('image') && (
        <img src={src} style={{width: width, height: height}} />
      )}
      {type?.startsWith('video') && (
        <video
          style={{width: width, height: height}}
          muted
          autoPlay
          loop
          src={src}
        />
      )}
    </div>
  );
}, shallowEqual);

export const Pane: FC = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const selectedTool = useAppSelector(getSelectedTool);
  const state = useAppSelector(getSavingState);

  const menus: ScreenTool[] = useAppSelector(getScreenMenus);
  const screenConfig = useAppSelector(getDeviceConfig);

  const screenMenus = menus.map((menu) => (
    <SubmenuRow
      $selected={selectedTool === menu}
      onClick={() => dispatch(updateTool(menu))}
      key={menu}
      style={{borderWidth: 0, textAlign: 'center'}}
    >
      {t(menu)}
    </SubmenuRow>
  ));

  const renderDetail = () => {
    if (!screenConfig) {
      return <></>;
    }
    switch (selectedTool) {
      case 'video':
        return <CropTool key="video" />;
      case 'image':
        return <CropTool key="image" />;
      case 'slider':
        return <SliderTool key="slider" />;
    }
  };

  return (
    <>
      <SubmenuOverflowCell>
        <MenuContainer $disabled={state === 'saving'}>
          {screenMenus}
        </MenuContainer>
      </SubmenuOverflowCell>
      <OverflowCell>
        <ScreenPane>
          <Container>{renderDetail()}</Container>
        </ScreenPane>
      </OverflowCell>
    </>
  );
};

export const Icon: FC = () => {
  return (
    <svg viewBox="1 1 22 22" fill="currentColor">
      <path d="M6.25,4 L17.75,4 C19.4830315,4 20.8992459,5.35645477 20.9948552,7.06557609 L21,7.25 L21,16.75 C21,18.4830315 19.6435452,19.8992459 17.9344239,19.9948552 L17.75,20 L6.25,20 C4.51696854,20 3.10075407,18.6435452 3.00514479,16.9344239 L3,16.75 L3,7.25 C3,5.51696854 4.35645477,4.10075407 6.06557609,4.00514479 L6.25,4 L17.75,4 L6.25,4 Z M17.75,5.5 L6.25,5.5 C5.3318266,5.5 4.57880766,6.20711027 4.5058012,7.10647279 L4.5,7.25 L4.5,16.75 C4.5,17.6681734 5.20711027,18.4211923 6.10647279,18.4941988 L6.25,18.5 L17.75,18.5 C18.6681734,18.5 19.4211923,17.7928897 19.4941988,16.8935272 L19.5,16.75 L19.5,7.25 C19.5,6.3318266 18.7928897,5.57880766 17.8935272,5.5058012 L17.75,5.5 Z M10.0527864,9.5854102 C10.1625594,9.3658642 10.4120593,9.26236922 10.639617,9.328815 L10.7236068,9.3618034 L15.1055728,11.5527864 C15.2023365,11.6011683 15.2807978,11.6796295 15.3291796,11.7763932 C15.4389526,11.9959392 15.3720486,12.2576361 15.1823574,12.3998148 L15.1055728,12.4472136 L10.7236068,14.6381966 C10.6541791,14.6729105 10.5776225,14.690983 10.5,14.690983 C10.2545401,14.690983 10.0503916,14.5141078 10.0080557,14.2808586 L10,14.190983 L10,9.80901699 C10,9.73139445 10.0180725,9.65483791 10.0527864,9.5854102 Z"></path>
    </svg>
  );
};
export const Title = title;
