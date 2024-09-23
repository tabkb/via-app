import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faDisplay,
  faGear,
  faHeadphones,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {
  ControlRow,
  Detail,
  Label,
  OverflowCell,
  SubmenuCell,
  SubmenuRow,
} from '../../grid';
import {CenterPane} from '../../pane';
import {title, component} from '../../../icons/lightbulb';
import {VIACustomItem} from './custom-control';
import {evalExpr} from '@the-via/pelpi';
import type {
  VIAMenu,
  VIASubmenu,
  VIASubmenuSlice,
  VIAItem,
  VIAItemSlice,
} from '@the-via/reader';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {getSelectedDefinition} from 'src/store/definitionsSlice';
import {
  getSelectedCustomMenuData,
  updateCustomMenuValue,
} from 'src/store/menusSlice';
import {useTranslation} from 'react-i18next';
import {AccentButton} from 'src/components/inputs/accent-button';
import {getSelectedKeyboardAPI} from 'src/store/devicesSlice';
import {numIntoBytes} from 'src/utils/bit-pack';

type Category = {
  label: string;
  // TODO: type this any
  Menu: React.FC<any>;
};

const CustomPane = styled(CenterPane)`
  height: 100%;
  background: var(--color_dark_grey);
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0 12px;
`;

type Props = {
  viaMenu: VIAMenu;
};

function isItem(
  elem: VIAMenu | VIAItem | VIAItemSlice | VIASubmenu | VIASubmenuSlice,
): boolean {
  return 'type' in elem;
}

function isSlice(
  elem: VIAMenu | VIAItem | VIAItemSlice | VIASubmenu | VIASubmenuSlice,
): boolean {
  return !('label' in elem);
}

function categoryGenerator(props: any): Category[] {
  return props.viaMenu.content.flatMap((menu: any) =>
    submenuGenerator(menu, props),
  );
}

function itemGenerator(
  elem: TagWithId<VIAItem, VIAItemSlice>,
  props: any,
): any {
  if (
    'showIf' in elem &&
    !evalExpr(elem.showIf as string, props.selectedCustomMenuData)
  ) {
    return [];
  }
  if ('label' in elem) {
    return {...elem, key: elem._id};
  } else {
    return elem.content.flatMap((e) =>
      itemGenerator(e as TagWithId<VIAItem, VIAItemSlice>, props),
    );
  }
}

const TimeSyncItem = () => {
  const channel = 25;

  const {t} = useTranslation();
  const api = useAppSelector(getSelectedKeyboardAPI);
  const tRef = useRef<ReturnType<typeof setInterval>>();
  const [now, setNow] = useState(new Date());
  const formatedTime = now.toLocaleDateString(undefined, {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

  useEffect(() => {
    tRef.current = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(tRef.current);
    };
  }, []);

  const timeSync = () => {
    if (!api) {
      return;
    }
    const t = ~~(now.getTime() / 1000) - now.getTimezoneOffset() * 60;

    api.setCustomMenuValue(channel, ...numIntoBytes(t));
    api.commitCustomMenu(channel);
  };

  return (
    <ControlRow>
      <Label>{formatedTime}</Label>
      <Detail>
        <AccentButton onClick={timeSync}>{t('Time Sync')}</AccentButton>
      </Detail>
    </ControlRow>
  );
};

const MenuComponent = React.memo((props: any) => {
  return (
    <>
      {props.elem.content
        .flatMap((elem: any) => itemGenerator(elem, props))
        .map((itemProps: any) => (
          <VIACustomItem
            {...itemProps}
            updateValue={props.updateCustomMenuValue}
            value={props.selectedCustomMenuData[itemProps.content[0]]}
          />
        ))}
      {props.elem.label == 'Date Time' && <TimeSyncItem />}
    </>
  );
});

const MenuBuilder = (elem: any) => (props: any) =>
  <MenuComponent {...props} key={elem._id} elem={elem} />;

function submenuGenerator(
  elem: TagWithId<VIASubmenu, VIASubmenuSlice>,
  props: any,
): any {
  if (
    'showIf' in elem &&
    !evalExpr(elem.showIf as string, props.selectedCustomMenuData)
  ) {
    return [];
  }
  if ('label' in elem) {
    return {
      label: elem.label,
      Menu: MenuBuilder(elem),
    };
  } else {
    return elem.content.flatMap((e) =>
      submenuGenerator(e as TagWithId<VIASubmenu, VIASubmenuSlice>, props),
    );
  }
}

export const Pane: React.FC<Props> = (props: any) => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const menus = categoryGenerator(props);
  const [selectedCategory, setSelectedCategory] = useState(
    menus[0] || {label: '', Menu: () => <div />},
  );
  const SelectedMenu = selectedCategory.Menu;

  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedCustomMenuData = useAppSelector(getSelectedCustomMenuData);

  const childProps = {
    ...props,
    selectedDefinition,
    selectedCustomMenuData,
    updateCustomMenuValue: (command: string, ...rest: number[]) =>
      dispatch(updateCustomMenuValue(command, ...rest)),
  };

  if (!selectedDefinition || !selectedCustomMenuData) {
    return null;
  }

  return (
    <>
      <SubmenuCell>
        <MenuContainer>
          {menus.map((menu) => (
            <SubmenuRow
              $selected={selectedCategory.label === menu.label}
              onClick={() => setSelectedCategory(menu)}
              key={menu.label}
            >
              {t(menu.label)}
            </SubmenuRow>
          ))}
        </MenuContainer>
      </SubmenuCell>
      <OverflowCell>
        <CustomPane>
          <Container>{SelectedMenu(childProps)}</Container>
        </CustomPane>
      </OverflowCell>
    </>
  );
};

export const Icon = component;
export const Title = title;

export type IdTag = {_id: string};
export type MapIntoArr<A, C> = A extends (infer B)[] ? (C & B)[] : any;
export type IntersectKey<A, B extends keyof A, C> = A & {
  [K in B]: MapIntoArr<A[B], C>;
};
export type TagWithId<A, B extends {content: any}> =
  | (IdTag & A)
  | IntersectKey<B, 'content', IdTag>;

export const MenuContainer = styled.div`
  padding: 15px 10px 20px 10px;
`;

export type LabelProps = {
  _type?: 'slice' | 'submenu' | 'menu';
  _id?: string;
  _renderIf?: (props: any) => boolean;
  content: any;
};

export function elemLabeler(elem: any, prefix: string = ''): any {
  if (isItem(elem)) {
    return {
      ...elem,
      ...(elem.showIf
        ? {_renderIf: (props: any) => evalExpr(elem.showIf, props)}
        : {}),
      _id: prefix,
      _type: 'item',
    };
  } else if (isSlice(elem)) {
    return {
      ...elem,
      ...(elem.showIf
        ? {_renderIf: (props: any) => evalExpr(elem.showIf, props)}
        : {}),
      _id: prefix,
      _type: 'slice',
      content: menuLabeler(elem.content, prefix),
    };
  } else {
    return {
      ...elem,
      ...(elem.showIf
        ? {_renderIf: (props: any) => evalExpr(elem.showIf, props)}
        : {}),
      _id: prefix,
      _type: 'menu',
      content: menuLabeler(elem.content, prefix),
    };
  }
}

export function menuLabeler(menus: any, prefix: string = ''): any {
  return menus.map((menu: any, idx: number) =>
    elemLabeler(menu, `${prefix}-${idx}`),
  );
}

const iconKeywords = [
  {
    icon: faLightbulb,
    keywords: ['light', 'rgb'],
  },
  {
    icon: faHeadphones,
    keywords: ['audio', 'sound'],
  },
  {
    icon: faDisplay,
    keywords: ['display', 'oled', 'lcd'],
  },
];

const getIconFromLabel = (menu: VIAMenu) => {
  const label = menu.label.toLowerCase();
  const defaultIcon = {icon: faGear};
  return (
    iconKeywords.find((icon) =>
      icon.keywords.some((keyword) => label.includes(keyword)),
    ) || defaultIcon
  ).icon;
};

export const makeCustomMenu = (menu: VIAMenu, idx: number) => {
  return {
    Title: menu.label,
    // Allow icon to be configurable
    Icon: () => <FontAwesomeIcon icon={getIconFromLabel(menu)} />,
    Pane: (props: any) => (
      <Pane {...props} key={`${menu.label}-${idx}`} viaMenu={menu} />
    ),
  };
};
export const makeCustomMenus = (menus: VIAMenu[]) => menus.map(makeCustomMenu);
