import {Media} from '../../screen';
import {getScreenFiles} from './screen-tool';
import {MediaRow, HiddenInput} from './screen-tool';
import {FC, memo, useState, useRef, useEffect} from 'react';
import Draggable, {DraggableEventHandler} from 'react-draggable';
import {shallowEqual} from 'react-redux';
import {AccentButton} from 'src/components/inputs/accent-button';
import {ControlRow, Label, Detail} from 'src/components/panes/grid';
import {useAppSelector} from 'src/store/hooks';
import {
  getSelectedTool,
  getDefaultArea,
  getKbresFlags,
} from 'src/store/screenSlice';
import {useKbres} from 'src/utils/use-kbres';
import {ScreenFile} from './screen-tool';
import styled from 'styled-components';
import {ScreenFileType} from 'src/types/types';
import {FileSaveControl} from './save-control';
import {useTranslation} from 'react-i18next';

const MediaContainer = styled.div.attrs<{
  $width: number;
  $height: number;
}>(({$width, $height}) => {
  return {
    style: {
      width: $width,
      height: $height,
      display: $width > 0 && $height > 0 ? 'block' : 'none',
    },
  };
})`
  position: relative;
`;

const Dragger = styled.div`
  top: 0;
  left: 0;
  position: absolute;
  cursor: move;
  cursor: grab;
  transition: all 0.3s;
  z-index: 1;
  &.react-draggable-dragging {
    transition: none;
    cursor: grabbing;
  }
`;

const getDimension = (area: ScreenFileType, file: ScreenFile) => {
  if (area && file) {
    const [sw, sh] = [file.width, file.height];
    const [tw, th] = [area.owidth, area.oheight];
    const sr = sw / sh;
    const tr = tw / th;
    if (sr > tr) {
      return [~~(sr * th), th];
    }
    return [tw, ~~(tw / sr)];
  }
  return [0, 0];
};

export const CropTool: FC<{}> = memo(() => {
  const {t} = useTranslation();
  const tool = useAppSelector(getSelectedTool);
  const defaultArea = useAppSelector(getDefaultArea);
  const kbresFlags = useAppSelector(getKbresFlags);

  if (!defaultArea) {
    return null;
  }
  const [files, setFiles] = useState<ScreenFile[]>([]);
  const [area, setArea] = useState<ScreenFileType>(defaultArea);
  const file = files[0];
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [width, height] = getDimension(area, file);
  const [x, setX] = useState(Math.floor((width - area.owidth) / 2));
  const [y, setY] = useState(Math.floor((height - area.oheight) / 2));
  const bounds = {
    left: 0,
    top: 0,
    right: width - area.owidth,
    bottom: height - area.oheight,
  };
  const accept =
    tool === 'video' ? 'image/gif,video/mp4' : 'image/png,image/jpeg,image/bmp';

  const importFile = () => {
    fileRef.current?.click();
  };

  const kbres = useKbres();

  const handleFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (evt.target.files) {
      setFiles(await getScreenFiles(Array.from(evt.target.files)));
    }
  };

  const handleDrag: DraggableEventHandler = (e, data) => {
    setX(data.x);
    setY(data.y);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaDashOffset = useRef<number>(0);

  const drawArea = () => {
    if (!canvasRef.current) {
      areaDashOffset.current = 0;
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const dash = 5;

    context.setLineDash([dash, dash]);
    context.lineDashOffset = areaDashOffset.current;
    context.strokeStyle = 'white';
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.stroke();

    context.lineDashOffset = areaDashOffset.current + dash;
    context.strokeStyle = 'black';
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.stroke();

    areaDashOffset.current += 3;

    setTimeout(drawArea, 200);
  };

  useEffect(() => {
    setTimeout(() => {
      setX(Math.floor((width - area.owidth) / 2));
      setY(Math.floor((height - area.oheight) / 2));
      if (areaDashOffset.current === 0) {
        drawArea();
      }
    }, 0);
  }, [area, width, height]);

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

    const outName = `${area.format}`;
    const fileName = inputDir + '/' + file.name;

    kbres.FS.writeFile(fileName, file.byteArray);

    const outVec = new kbres.IntVec();
    outVec.push_back(area.owidth);
    outVec.push_back(area.oheight);

    const resVec = new kbres.IntVec();
    resVec.push_back(width);
    resVec.push_back(height);

    const offVec = new kbres.IntVec();
    offVec.push_back(x);
    offVec.push_back(y);

    console.debug(
      fileName,
      outName,
      area.orientations,
      [area.owidth, area.oheight],
      [width, height],
      [x, y],
      area.format,
      area.animFramesLimit,
      kbresFlags,
    );

    let ret = 0;
    if (tool === 'image') {
      ret = kbres.convert_image_ext(
        fileName,
        outName,
        area.orientations,
        outVec,
        resVec,
        offVec,
        area.format,
        kbresFlags,
      );
    } else {
      ret = kbres.convert_video_ext(
        fileName,
        outName,
        area.orientations,
        outVec,
        resVec,
        offVec,
        area.format,
        area.animFramesLimit,
        kbresFlags,
      );
    }

    kbres.FS.unlink(fileName);

    if (ret === 0) {
      const data = kbres.FS.readFile(outName);
      return data;
    }
    return null;
  };

  return (
    <>
      <MediaRow>
        <MediaContainer $width={width} $height={height}>
          <Media
            type={file?.type}
            src={file?.src}
            width={width}
            height={height}
          />

          <Draggable position={{x, y}} onStop={handleDrag} bounds={bounds}>
            <Dragger>
              {file && (
                <canvas
                  ref={canvasRef}
                  width={area.owidth}
                  height={area.oheight}
                ></canvas>
              )}
            </Dragger>
          </Draggable>
        </MediaContainer>
      </MediaRow>
      <ControlRow>
        <Label>
          {t('File')}：{file?.name}
        </Label>
        <Detail>
          <AccentButton onClick={importFile}>
            {t('Import ' + (tool === 'video' ? 'Video' : 'Image'))}
          </AccentButton>
          <HiddenInput
            accept={accept}
            onChange={handleFileChange}
            type="file"
            ref={fileRef}
          />
        </Detail>
      </ControlRow>
      <ControlRow>
        <Label>
          {t('Original Size')}: {file?.width || 0} x {file?.height || 0}
        </Label>
      </ControlRow>
      <FileSaveControl
        area={area}
        setArea={setArea}
        generate={generate}
        disabled={!file}
      />
    </>
  );
}, shallowEqual);
