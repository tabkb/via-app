import {FC, useState, useEffect, useMemo} from 'react';
import styled from 'styled-components';
import {Button} from 'src/components/inputs/button';
import {KeycodeModal} from 'src/components/inputs/custom-keycode-modal';
import {
  keycodeInMaster,
  getByteForCode,
  getKeycodes,
  getOtherMenu,
  IKeycode,
  IKeycodeMenu,
  categoriesForKeycodeModule,
} from 'src/utils/key';
import {ErrorMessage} from 'src/components/styled';
import {
  KeycodeType,
  getLightingDefinition,
  isVIADefinitionV3,
  isVIADefinitionV2,
  VIADefinitionV3,
} from '@the-via/reader';
import {
  OverflowCell,
  SubmenuOverflowCell,
  SubmenuRow,
} from 'src/components/panes/grid';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  getBasicKeyToByte,
  getSelectedDefinition,
  getSelectedKeyDefinitions,
} from 'src/store/definitionsSlice';
import {getSelectedConnectedDevice} from 'src/store/devicesSlice';
import {
  getSelectedKey,
  getSelectedKeymap,
  updateKey as updateKeyAction,
  updateSelectedKey,
} from 'src/store/keymapSlice';
import {getMacroCount} from 'src/store/macrosSlice';
import {
  disableGlobalHotKeys,
  enableGlobalHotKeys,
  getDisableFastRemap,
} from 'src/store/settingsSlice';
import {getNextKey} from 'src/utils/keyboard-rendering';
import {useTranslation} from 'react-i18next';
import {DKSActions} from 'src/types/types';
import {getDksAction} from 'src/store/actuationSlice';
const KeycodeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 64px);
  grid-auto-rows: 64px;
  justify-content: center;
  grid-gap: 10px;
`;

const MenuContainer = styled.div`
  padding: 10px 10px 0;
  display: flex;
`;

const Keycode = styled(Button)<{disabled: boolean}>`
  width: 50px;
  height: 50px;
  line-height: 18px;
  border-radius: 64px;
  font-size: 14px;
  border: 4px solid var(--border_color_icon);
  background: var(--bg_control);
  color: var(--color_label-highlighted);
  margin: 0;
  box-shadow: none;
  position: relative;
  border-radius: 10px;
  &:hover {
    border-color: var(--color_accent);
    transform: translate3d(0, -2px, 0);
  }
  ${(props: any) => props.disabled && `cursor:not-allowed;filter:opacity(50%);`}
`;

const KeycodeContent = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
`;

const CustomKeycode = styled(Button)`
  width: 50px;
  height: 50px;
  line-height: 18px;
  border-radius: 10px;
  font-size: 14px;
  border: 4px solid var(--border_color_icon);
  background: var(--color_accent);
  border-color: var(--color_inside_accent);
  color: var(--color_inside_accent);
  margin: 0;
`;

const KeycodeContainer = styled.div`
  padding: 12px;
  padding-bottom: 30px;
`;

const KeycodeDesc = styled.div`
  position: fixed;
  bottom: 0;
  background: #d9d9d97a;
  box-sizing: border-box;
  transition: opacity 0.4s ease-out;
  height: 25px;
  width: 100%;
  line-height: 14px;
  padding: 5px;
  font-size: 14px;
  opacity: 1;
  pointer-events: none;
  &:empty {
    opacity: 0;
  }
`;

const generateKeycodeCategories = (
  basicKeyToByte: Record<string, number>,
  numMacros: number = 16,
) => getKeycodes(numMacros).concat(getOtherMenu(basicKeyToByte));

const maybeFilter = <M extends Function>(maybe: boolean, filter: M) =>
  maybe ? () => true : filter;

export const KeycodePane: React.FC<{
  actions: DKSActions;
  updateActions(actioins: DKSActions): void;
}> = ({actions, updateActions}) => {
  const {t} = useTranslation();
  const dispatch = useAppDispatch();
  const macros = useAppSelector((state: any) => state.macros);
  const selectedDefinition = useAppSelector(getSelectedDefinition);
  const selectedDevice = useAppSelector(getSelectedConnectedDevice);
  const matrixKeycodes = useAppSelector(getSelectedKeymap);
  const selectedKey = useAppSelector(getSelectedKey);
  const selectedKeyDefinitions = useAppSelector(getSelectedKeyDefinitions);
  const {basicKeyToByte} = useAppSelector(getBasicKeyToByte);
  const macroCount = useAppSelector(getMacroCount);
  const activeAction = useAppSelector(getDksAction);

  const KeycodeCategories = useMemo(
    () => generateKeycodeCategories(basicKeyToByte, macroCount),
    [basicKeyToByte, macroCount],
  );

  // TODO: improve typing so we can get rid of this
  if (!selectedDefinition || !selectedDevice || !matrixKeycodes) {
    return null;
  }

  const [selectedCategory, setSelectedCategory] = useState(
    KeycodeCategories[0].id,
  );
  const [mouseOverDesc, setMouseOverDesc] = useState<string | null>(null);
  const [showKeyTextInputModal, setShowKeyTextInputModal] = useState(false);

  const getEnabledMenus = (): IKeycodeMenu[] => {
    if (isVIADefinitionV3(selectedDefinition)) {
      return getEnabledMenusV3(selectedDefinition);
    }
    const {lighting, customKeycodes} = selectedDefinition;
    const {keycodes} = getLightingDefinition(lighting);
    return KeycodeCategories.filter(
      maybeFilter(
        keycodes === KeycodeType.QMK,
        ({id}) => id !== 'qmk_lighting',
      ),
    )
      .filter(
        maybeFilter(keycodes === KeycodeType.WT, ({id}) => id !== 'lighting'),
      )
      .filter(
        maybeFilter(
          typeof customKeycodes !== 'undefined',
          ({id}) => id !== 'custom',
        ),
      );
  };
  const getEnabledMenusV3 = (definition: VIADefinitionV3): IKeycodeMenu[] => {
    const keycodes = ['default' as const, ...(definition.keycodes || [])];
    const allowedKeycodes = keycodes.flatMap((keycodeName) =>
      categoriesForKeycodeModule(keycodeName),
    );
    if ((selectedDefinition.customKeycodes || []).length !== 0) {
      allowedKeycodes.push('custom');
    }
    return KeycodeCategories.filter((category) =>
      allowedKeycodes.includes(category.id),
    );
  };

  const renderMacroError = () => {
    return (
      <ErrorMessage>
        {t(
          'Your current firmware does not support macros. Install the latest firmware for your device.',
        )}
      </ErrorMessage>
    );
  };

  const renderCategories = () => {
    const {t} = useTranslation();
    return (
      <MenuContainer>
        {getEnabledMenus().map(({id, label}) => (
          <SubmenuRow
            $selected={id === selectedCategory}
            onClick={() => setSelectedCategory(id)}
            key={id}
            className="dks-keycode-submenu"
            style={{fontSize: 18}}
          >
            {t(label)}
          </SubmenuRow>
        ))}
      </MenuContainer>
    );
  };

  const renderKeyInputModal = () => {
    dispatch(disableGlobalHotKeys());

    return (
      <KeycodeModal
        defaultValue={
          selectedKey !== null ? matrixKeycodes[selectedKey] : undefined
        }
        onExit={() => {
          dispatch(enableGlobalHotKeys());
          setShowKeyTextInputModal(false);
        }}
        onConfirm={(keycode) => {
          dispatch(enableGlobalHotKeys());
          updateKey(keycode);
          setShowKeyTextInputModal(false);
        }}
      />
    );
  };

  const updateKey = (value: number) => {
    if (selectedKey !== null && activeAction !== null) {
      const newActions = actions.map((v, i) =>
        i === activeAction ? {...v, key: value} : v,
      ) as DKSActions;
      updateActions(newActions);
    }
  };

  const handleClick = (code: string, i: number) => {
    if (code == 'text') {
      setShowKeyTextInputModal(true);
    } else {
      return (
        keycodeInMaster(code, basicKeyToByte) &&
        updateKey(getByteForCode(code, basicKeyToByte))
      );
    }
  };

  const renderKeycode = (keycode: IKeycode, index: number) => {
    const {code, title, name} = keycode;
    return (
      <Keycode
        key={code}
        disabled={!keycodeInMaster(code, basicKeyToByte) && code != 'text'}
        onClick={() => handleClick(code, index)}
        onMouseOver={() => setMouseOverDesc(title ? `${code}: ${title}` : code)}
        onMouseOut={() => setMouseOverDesc(null)}
      >
        <KeycodeContent>{name}</KeycodeContent>
      </Keycode>
    );
  };

  const renderCustomKeycode = () => {
    return (
      <CustomKeycode
        key="customKeycode"
        onClick={() => selectedKey !== null && handleClick('text', 0)}
        onMouseOver={() => setMouseOverDesc('Enter any QMK Keycode')}
        onMouseOut={() => setMouseOverDesc(null)}
      >
        Any
      </CustomKeycode>
    );
  };

  const renderSelectedCategory = (
    keycodes: IKeycode[],
    selectedCategory: string,
  ) => {
    const keycodeListItems = keycodes.map((keycode, i) =>
      renderKeycode(keycode, i),
    );
    switch (selectedCategory) {
      case 'macro': {
        return !macros.isFeatureSupported ? (
          renderMacroError()
        ) : (
          <KeycodeList>{keycodeListItems}</KeycodeList>
        );
      }
      // case 'special': {
      //   return (
      //     <KeycodeList>
      //       {keycodeListItems.concat(renderCustomKeycode())}
      //     </KeycodeList>
      //   );
      // }
      case 'custom': {
        if (
          (!isVIADefinitionV2(selectedDefinition) &&
            !isVIADefinitionV3(selectedDefinition)) ||
          !selectedDefinition.customKeycodes
        ) {
          return null;
        }
        return (
          <KeycodeList>
            {selectedDefinition.customKeycodes.map((keycode, idx) => {
              return renderKeycode(
                {
                  ...keycode,
                  code: `CUSTOM(${idx})`,
                },
                idx,
              );
            })}
          </KeycodeList>
        );
      }
      default: {
        return <KeycodeList>{keycodeListItems}</KeycodeList>;
      }
    }
  };

  const selectedCategoryKeycodes = KeycodeCategories.find(
    ({id}) => id === selectedCategory,
  )?.keycodes as IKeycode[];

  return (
    <>
      <SubmenuOverflowCell
        style={{background: 'none', borderTop: 'none', borderRight: 'none'}}
      >
        {renderCategories()}
      </SubmenuOverflowCell>
      <OverflowCell style={{borderRight: 'none'}}>
        <KeycodeContainer>
          {renderSelectedCategory(selectedCategoryKeycodes, selectedCategory)}
        </KeycodeContainer>
        <KeycodeDesc>{mouseOverDesc}</KeycodeDesc>
        {showKeyTextInputModal && renderKeyInputModal()}
      </OverflowCell>
    </>
  );
};
