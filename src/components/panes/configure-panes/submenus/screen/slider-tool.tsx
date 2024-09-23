import {useEffect, type FC, useState, useRef, useMemo} from 'react';
import {Detail, Label, ControlRow} from '../../../grid';
import {AccentButton} from 'src/components/inputs/accent-button';
import {AccentSelect} from 'src/components/inputs/accent-select';
import {useAppSelector} from 'src/store/hooks';
import {getDefaultArea, getKbresFlags} from 'src/store/screenSlice';
import {useKbres} from 'src/utils/use-kbres';
import {ScreenFile} from './screen-tool';
import {getScreenFiles} from './screen-tool';
import {MediaRow, HiddenInput} from './screen-tool';
import styled, {keyframes} from 'styled-components';
import {sortBy} from 'lodash';
import {ScreenFileType} from 'src/types/types';
import {FileSaveControl} from './save-control';
import {useTranslation} from 'react-i18next';

enum Anim {
  None = 1,
  Down = 2,
  Up = 3,
  Right = 4,
  Left = 5,
}

export const Slider = styled.div.attrs<{$width: number; $height: number}>(
  (props) => {
    return {
      style: {
        width: props.$width,
        height: props.$height,
      },
    };
  },
)`
  position: relative;
  overflow: hidden;
`;

const upAnima = keyframes`
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
`;
const downAnim = keyframes`
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100%);
  }
`;
const leftAnim = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
`;
const rightAnim = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
`;

export const SliderImage = styled.img.attrs<{
  $interval: number;
  $anim: Anim;
  $isNext: boolean;
  $width: number;
  $height: number;
}>((props) => {
  let left = '0';
  let top = '0';
  if (props.$isNext) {
    switch (props.$anim) {
      case Anim.Up:
        top = '100%';
        break;
      case Anim.Down:
        top = '-100%';
        break;
      case Anim.Left:
        left = '100%';
        break;
      case Anim.Right:
        left = '-100%';
        break;
    }
  }
  return {
    style: {
      width: props.$width,
      height: props.$height,
      left,
      top,
      zIndex: props.$anim !== Anim.None ? 0 : props.$isNext ? 0 : 1,
    },
  };
})`
  background: #000;
  object-fit: cover;
  position: absolute;
  animation-name: ${(props) => {
    if (!props.$isNext) {
      return '';
    }
    switch (props.$anim) {
      case Anim.Up:
        return upAnima;
      case Anim.Down:
        return downAnim;
      case Anim.Left:
        return leftAnim;
      case Anim.Right:
        return rightAnim;
      default:
        return '';
    }
  }};
  animation-delay: ${(props) => (props.$interval || 1) - 0.3}s;
  animation-duration: 0.3s;
  animation-fill-mode: forwards;
  animation-timing-function: linear;
  pointer-events: none;
`;

export const SliderTool: FC<{}> = () => {
  const {t, i18n} = useTranslation();
  const defaultArea = useAppSelector(getDefaultArea);
  const kbresFlags = useAppSelector(getKbresFlags);
  if (!defaultArea) {
    return null;
  }

  const animIntervalOptions = useMemo(
    () =>
      [5, 10, 15, 30].map((n) => ({
        label: n + ' ' + t('S'),
        value: n,
      })),
    [i18n.language],
  );

  const animOptions: {label: string; value: Anim}[] = useMemo(
    () => [
      {label: t('None'), value: Anim.None},
      {label: t('Top to bottom'), value: Anim.Down},
      {label: t('Bottom to top'), value: Anim.Up},
      {label: t('Left to right'), value: Anim.Right},
      {label: t('Right to left'), value: Anim.Left},
    ],
    [i18n.language],
  );

  const [area, setArea] = useState<ScreenFileType>(defaultArea);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<ScreenFile[]>([]);

  const [index, setIndex] = useState(0);
  const next = files.length <= 1 || index === files.length - 1 ? 0 : index + 1;
  const [animInterval, setAnimInterval] = useState(
    animIntervalOptions[0].value,
  );
  const [anim, setAnim] = useState<Anim>(animOptions[0].value);

  const tRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kbres = useKbres();

  const importFile = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (evt.target.files) {
      const files = Array.from(evt.target.files).filter((f) =>
        ['image/jpeg', 'image/png', 'image/bmp'].includes(f.type),
      );
      const sortedFiles = sortBy(await getScreenFiles(files), [(o) => o.name]);
      setFiles(sortedFiles);
    }
  };

  useEffect(() => {
    if (fileRef.current !== null) {
      fileRef.current.setAttribute('directory', '');
      fileRef.current.setAttribute('webkitdirectory', '');
    }
  }, [fileRef]);

  useEffect(() => {
    if (files.length === 0) {
      return;
    }
    tRef.current = setInterval(() => {
      setIndex((i) => (i === files.length - 1 ? 0 : i + 1));
    }, animInterval * 1000);
    return () => {
      if (tRef.current) {
        clearInterval(tRef.current);
        setIndex(0);
      }
    };
  }, [area, anim, animInterval, files]);

  const generate = () => {
    if (!kbres) {
      return null;
    }

    const inputDir = `/tabkb`;
    try {
      kbres.FS.stat(inputDir);
    } catch {
      kbres.FS.mkdir(inputDir);
    }

    const outName = 'ANPS';
    const format = 'ANPS';

    const inputVec = new kbres.StrVec();
    for (const f of files) {
      kbres.FS.writeFile(inputDir + '/' + f.name, f.byteArray);
      inputVec.push_back(inputDir + '/' + f.name);
    }

    const outVec = new kbres.IntVec();
    outVec.push_back(area.owidth);
    outVec.push_back(area.oheight);

    console.debug(
      inputDir,
      outName,
      area.orientations,
      animInterval,
      anim,
      [area.owidth, area.oheight],
      format,
      kbresFlags,
    );

    const ret = kbres.convert_image_folder_ext(
      inputVec,
      outName,
      area.orientations,
      animInterval,
      anim,
      outVec,
      format,
      kbresFlags,
    );

    for (let i = 0; i < inputVec.size(); i++) {
      const f = inputVec.get(i) as string;
      kbres.FS.unlink(f);
    }

    if (ret === 0) {
      const data = kbres.FS.readFile(outName);
      return data;
    }
    return null;
  };

  return (
    <>
      <MediaRow>
        <Slider $width={area.owidth} $height={area.oheight} key={index}>
          {files.length > 0 && (
            <SliderImage
              $interval={animInterval}
              $anim={anim}
              src={files[index]?.src}
              $width={area.owidth}
              $height={area.oheight}
            />
          )}
          {files.length > 1 && (
            <SliderImage
              $interval={animInterval}
              $anim={anim}
              $isNext
              src={files[next]?.src}
              $width={area.owidth}
              $height={area.oheight}
            />
          )}
        </Slider>
      </MediaRow>
      <ControlRow>
        <Label>
          {t('image')}: {files.length === 0 ? 0 : index + 1} / {files.length}{' '}
          {files.length === 0 ? '' : `( ${files[index].name} )`}
        </Label>
        <Detail>
          <AccentButton onClick={importFile}>
            {t('Import From Album')}
          </AccentButton>
          <HiddenInput onChange={handleFileChange} type="file" ref={fileRef} />
        </Detail>
      </ControlRow>
      <ControlRow>
        <Label>{t('Interval')}: </Label>
        <Detail>
          <AccentSelect
            onChange={(o: any) => setAnimInterval(o.value)}
            value={animIntervalOptions.find((o) => o.value === animInterval)}
            options={animIntervalOptions}
          />
        </Detail>
      </ControlRow>
      <ControlRow>
        <Label>{t('Transition Animation')}: </Label>
        <Detail>
          <AccentSelect
            onChange={(o: any) => setAnim(o.value)}
            value={animOptions.find((o) => o.value === anim)}
            options={animOptions}
          />
        </Detail>
      </ControlRow>
      <FileSaveControl
        area={area}
        setArea={setArea}
        generate={generate}
        disabled={files.length === 0}
      />
    </>
  );
};
