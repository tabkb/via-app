import styled from 'styled-components';
import {
  type FC,
  memo,
  useState,
  useRef,
  useEffect,
  useMemo,
  DragEvent,
  MutableRefObject,
  useCallback,
} from 'react';
import {CenterPane} from '../pane';
import {ControlRow, Detail} from '../grid';
import {shallowEqual} from 'react-redux';
import {RGBColor, SketchPicker} from 'react-color';
import {useAppDispatch, useAppSelector} from 'src/store/hooks';
import {
  addMatrix,
  deleteMatrix,
  fillMatrix,
  getActiveColor,
  getActiveMatrix,
  getCols,
  getFileContent,
  getFps,
  getImportEnable,
  getMatrixIdx,
  getMatrixList,
  getMaxFrame,
  getRows,
  getSaving,
  loadFile,
  mlHeader,
  mlHeaderSize,
  nextMatrix,
  resetMatrix,
  saveToKeyboard,
  setFps,
  setMatrix,
  setMatrixList,
  sortMatrixByIndex,
  updateColor,
  updateMatrix,
  updateMatrixIndex,
} from 'src/store/matrixLightingSlice';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faMinus,
  faStop,
  faAdd,
  faTrash,
  faImage,
  faVideo,
  faRotateLeft,
  faDownload,
  faFileImport,
} from '@fortawesome/free-solid-svg-icons';
import {IconButtonTooltip} from 'src/components/inputs/tooltip';
import {IconButtonContainer} from 'src/components/inputs/icon-button';
import {AccentSelect} from 'src/components/inputs/accent-select';
import {pixleImg} from 'src/utils/pixelit';
import {useKbres} from 'src/utils/use-kbres';
import {AccentButton} from 'src/components/inputs/accent-button';
import {useTranslation} from 'react-i18next';
import {isEqual} from 'lodash';
import {ErrorMessage} from 'src/components/styled';

const title = 'Matrix Lighting';

const MatrixLightingPane = styled(CenterPane)`
  height: 100%;
  overflow: auto;
  grid-column: span 2;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  flex-direction: column;
`;

const MatrixEditor = styled.div`
  display: flex;
  // align-items: flex-end;
  justify-content: center;
  width: 100%;
  max-width: 960px;
`;

const MatrixConfigure = styled.div`
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const MatrixControlRows = styled.div`
  width: 400px;
`;

const MatrixIndex = styled.div`
  font-size: 14px;
  color: var(--color_label);
`;

const MatrixWrapper = styled.div`
  border: 1px solid var(--border_color_cell);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  padding: 1px;
  background: var(--bg_menu);
  height: fit-content;
`;

const Light = styled.div.attrs<{$color: RGBColor}>(({$color}) => {
  return {
    style: {
      background: `rgb(${$color.r},${$color.g},${$color.b})`,
      boxShadow: `rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset, rgb(${$color.r},${$color.g},${$color.b}) 0px 0px 3px`,
    },
  };
})`
  width: 20px;
  height: 20px;
  display: inline-block;
  border-radius: 50%;
  cursor: pointer;
  margin: 1px;
`;

const ColorPicker = styled(SketchPicker)`
  line-height: 1;
  input {
    color: var(--color_accent);
    background: none;
    border: none !important;
    border-bottom: 1px solid var(--color_accent) !important;
    box-shadow: none !important;
    text-align: center;
  }
  label {
    color: var(--color_accent) !important;
  }
  .flexbox-fix {
    border: none !important;
  }
  position: absolute;
  transform: translate3d(14px, -22px, 0);
  z-index: 1;
  &::after {
    content: '';
    position: absolute;
    width: 0px;
    height: 0px;
    border: 11px solid var(--border_color_cell);
    border-top-color: transparent;
    border-bottom-color: transparent;
    border-left-color: transparent;
    top: 12px;
    left: -22px;
    pointer-events: none;
  }
`;

const ColorPreview = styled.div<{$color: RGBColor}>`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  background: ${(p) => `rgb(${p.$color.r},${p.$color.g},${p.$color.b})`};
  border: 1px solid var(--color_accent);
  cursor: pointer;
  margin-left: 5px;
`;

const MatrixList = styled.div`
  margin-top: 20px;
  display: flex;
  width: 100%;
  border-top: 1px solid var(--border_color_cell);
  padding-top: 10px;
  flex-wrap: wrap;
  & > div {
    margin: 0 6px 6px 0;
  }
`;

const MatrixButtons = styled.div`
  border-radius: 2px;
  border: 1px solid var(--border_color_icon);
  display: inline-flex;
  > button:last-child {
    border: none;
  }
`;

const FpsSelect = styled(AccentSelect)`
  > div[class*='-control'] {
    width: 100%;
  }
`;
const FlexLabel = styled.div`
  color: var(--color_label);
  font-weight: 400;
  display: inline-flex;
  align-items: center;
`;

const HiddenInput = styled.input`
  display: none;
`;

const MainMatrixContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const getMatrixData = (
  buffer: Uint8Array,
  start: number,
  width: number,
  height: number,
  ts: number,
) => {
  const size = width * height * ts;
  const matrix = Array(height)
    .fill(0)
    .map(() => Array(width).fill({r: 0, g: 0, b: 0}));
  for (let i = start; i < start + size; i += ts) {
    const idx = (i % size) / ts;
    const row = ~~(idx / width);
    const col = idx % width;
    const [r, g, b] = [buffer[i], buffer[i + 1], buffer[i + 2]];
    matrix[row][col] = {r, g, b};
  }
  return matrix;
};

const Lighting: FC<{
  color: RGBColor;
  row: number;
  col: number;
  changing: MutableRefObject<boolean>;
}> = memo(({color, row, col, changing}) => {
  const dispatch = useAppDispatch();

  const pointerDown = (evt: React.MouseEvent) => {
    if (evt.button !== 0) {
      return;
    }
    changing.current = true;
    dispatch(updateMatrix({row, col}));
    window.addEventListener('pointerup', pointerUp);
  };

  const pointerOver = () => {
    if (changing.current) {
      dispatch(updateMatrix({row, col}));
    }
  };

  const pointerUp = () => {
    changing.current = false;
    window.removeEventListener('pointerup', pointerUp);
  };

  const handleContextMenu = (evt: React.MouseEvent) => {
    evt.preventDefault();
    dispatch(updateColor(color));
  };

  return (
    <Light
      onContextMenu={handleContextMenu}
      onPointerDown={pointerDown}
      onPointerOver={pointerOver}
      $color={color}
    />
  );
}, shallowEqual);

const MatrixFrame: FC<{
  matrix: RGBColor[][];
  index: number;
  active: boolean;
}> = memo(({matrix, index, active}) => {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rows = matrix.length;
  const cols = matrix[0].length;
  const width = cols * 5;
  const height = rows * 5;

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    dispatch(updateMatrixIndex(index));
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (index === undefined) {
      return;
    }
    dispatch(sortMatrixByIndex({newIndex: index}));
  };

  const draw = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = 10 * cols;
    canvas.height = 10 * rows;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = matrix[r][c];
        context.beginPath();
        context.arc(c * 10 + 5, r * 10 + 5, 4, 0, Math.PI * 2);
        context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 5;
        context.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        context.fill();
      }
    }
  }, [matrix]);

  useEffect(draw, [matrix]);

  return (
    <div
      style={{
        width: width,
        height: height,
        background: '#000',
        border: active
          ? '1px solid var(--color_accent)'
          : '1px solid var(--border_color_cell)',
        borderRadius: 5,
        cursor: 'pointer',
      }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onClick={() => dispatch(updateMatrixIndex(index))}
    >
      <canvas style={{width: '100%', height: '100%'}} ref={canvasRef} />
    </div>
  );
}, shallowEqual);

const MatrixPane: FC<{
  matrix: RGBColor[][];
}> = memo(({matrix}) => {
  const changing = useRef(false);
  return (
    <MatrixWrapper>
      {matrix.map((row, i) => (
        <div key={i} style={{display: 'flex'}}>
          {row.map((col, j) => (
            <Lighting key={j} color={col} row={i} col={j} changing={changing} />
          ))}
        </div>
      ))}
    </MatrixWrapper>
  );
}, shallowEqual);

export const Pane: FC = () => {
  const {t, i18n} = useTranslation();
  const dispatch = useAppDispatch();
  const kbres = useKbres();

  const color = useAppSelector(getActiveColor);
  const matrixList = useAppSelector(getMatrixList);
  const matrixIndex = useAppSelector(getMatrixIdx);
  const activeMatrix = useAppSelector(getActiveMatrix);
  const fps = useAppSelector(getFps);
  const saving = useAppSelector(getSaving);
  const fileContent = useAppSelector(getFileContent);
  const rows = useAppSelector(getRows);
  const cols = useAppSelector(getCols);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [playing, setPlaying] = useState(false);
  const importEnable = useAppSelector(getImportEnable);
  const maxFrame = useAppSelector(getMaxFrame);

  const fpsOptions = useMemo(
    () =>
      [5, 10, 15, 20].map((fps) => ({
        label: fps + ' ' + t('FPS'),
        value: fps,
      })),
    [i18n.language],
  );

  const fpsOption = fpsOptions.find((o) => o.value === fps);

  const picker = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const playingTimer = useRef<ReturnType<typeof setInterval>>();

  const pickerStyles = {
    default: {
      picker: {
        background: 'var(--border_color_cell)',
      },
    },
  };

  const presetColors = [
    '#000',
    '#fff',
    '#f00',
    '#0f0',
    '#00f',
    '#ff0',
    '#f0f',
    '#0ff',
  ];

  const onDocumentClick = (evt: MouseEvent) => {
    if (!showPicker || !picker.current || !preview.current) {
      return;
    }
    if (
      evt.target !== preview.current &&
      !picker.current.contains(evt.target as HTMLDivElement)
    ) {
      setShowPicker(false);
    }
  };

  const handleImageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!evt.target.files) {
      return;
    }

    const img = new Image();
    const imgSrc = URL.createObjectURL(evt.target.files[0]);
    img.onload = () => {
      const data = pixleImg(img, cols, rows);
      dispatch(setMatrix(getMatrixData(data, 0, cols, rows, 4)));
      URL.revokeObjectURL(imgSrc);
      if (imageInput.current) {
        imageInput.current.value = '';
      }
    };
    img.src = imgSrc;
  };

  const handleVideoChange = async (
    evt: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!evt.target.files || !kbres || loading) {
      return;
    }
    setLoading(true);
    const outName = 'pixel.out';
    const file = evt.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    kbres.FS.writeFile(file.name, byteArray);
    const outVec = new kbres.IntVec();
    outVec.push_back(cols);
    outVec.push_back(rows);
    kbres.pixelit(file.name, outName, outVec, maxFrame);
    const buffer = kbres.FS.readFile(outName);

    const mList = [];

    const size = rows * cols * 3;
    for (let f = 0; f < buffer.length; f += size) {
      mList.push(getMatrixData(buffer, f, cols, rows, 3));
    }

    dispatch(setMatrixList(mList));

    if (videoInput.current) {
      videoInput.current.value = '';
    }
    setLoading(false);
  };

  const handleFileChange = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);

    if (!evt.target.files) {
      return;
    }

    const file = evt.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onabort = () => setErrorMessage(t('File reading was cancelled.'));
    reader.onerror = () => setErrorMessage(t('Failed to read file.'));
    reader.onload = () => {
      if (reader.result) {
        const result = Array.from(new Uint8Array((reader as any).result));
        const header = result.slice(0, mlHeaderSize);
        const data = result.slice(mlHeaderSize);
        if (!isEqual(mlHeader, header.slice(0, mlHeader.length))) {
          setErrorMessage(t('Could not load file: invalid data.'));
          return;
        }
        const [frames, fps, r, c] = header.slice(mlHeader.length);
        if (
          frames === 0 ||
          rows !== r ||
          cols !== c ||
          cols * rows * 3 * frames !== data.length
        ) {
          setErrorMessage(t('Could not load file: invalid data.'));
          return;
        }
        dispatch(loadFile({frames, fps, data}));
      }
    };
    reader.readAsArrayBuffer(file);

    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const save = async () => {
    try {
      await dispatch(saveToKeyboard());
    } catch (e: any) {
      setErrorMessage(t('Failed to save.'));
    }
  };

  const importFile = () => {
    fileInput.current?.click();
  };

  const downloadFile = async () => {
    const suggestedName = `via_lighting_${cols}_${rows}.tabml`;
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
      });
      const blob = new Blob([Uint8Array.from(fileContent)], {
        type: 'octet/stream',
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    document.addEventListener('click', onDocumentClick);
    return () => {
      document.removeEventListener('click', onDocumentClick);
    };
  }, [showPicker]);

  useEffect(() => {
    clearInterval(playingTimer.current);
    if (playing) {
      playingTimer.current = setInterval(() => {
        dispatch(nextMatrix());
      }, 1000 / fps);
    }
    return () => {
      clearInterval(playingTimer.current);
    };
  }, [playing, fps]);

  return (
    <MatrixLightingPane
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <Container>
        <MatrixEditor>
          <MainMatrixContainer>
            <MatrixPane matrix={activeMatrix} />
            <MatrixIndex>
              {matrixIndex + 1}/{matrixList.length}
            </MatrixIndex>
          </MainMatrixContainer>
          <MatrixConfigure>
            <MatrixControlRows>
              <ControlRow style={{pointerEvents: playing ? 'none' : 'auto'}}>
                <FlexLabel>
                  <ColorPreview
                    ref={preview}
                    onMouseOver={() => setShowPicker(true)}
                    $color={color}
                  />
                  {showPicker && (
                    <div ref={picker}>
                      <ColorPicker
                        styles={pickerStyles}
                        presetColors={presetColors}
                        disableAlpha
                        color={color}
                        onChange={(color) => {
                          dispatch(updateColor(color.rgb));
                        }}
                      />
                    </div>
                  )}
                  <></>
                </FlexLabel>
                <Detail>
                  <MatrixButtons>
                    <IconButtonContainer
                      onClick={() => dispatch(resetMatrix())}
                    >
                      <FontAwesomeIcon size={'sm'} icon={faTrash} />
                      <IconButtonTooltip>{t('Delete All')}</IconButtonTooltip>
                    </IconButtonContainer>
                  </MatrixButtons>
                </Detail>
              </ControlRow>
              <ControlRow style={{pointerEvents: playing ? 'none' : 'auto'}}>
                <FlexLabel>
                  <MatrixButtons>
                    <IconButtonContainer
                      disabled={matrixList.length >= maxFrame}
                      onClick={() => dispatch(addMatrix())}
                    >
                      <FontAwesomeIcon size={'sm'} icon={faAdd} />
                      <IconButtonTooltip>{t('Add')}</IconButtonTooltip>
                    </IconButtonContainer>
                    <IconButtonContainer
                      onClick={() => dispatch(deleteMatrix())}
                    >
                      <FontAwesomeIcon size={'sm'} icon={faMinus} />
                      <IconButtonTooltip>{t('Delete')}</IconButtonTooltip>
                    </IconButtonContainer>
                    <IconButtonContainer onClick={() => dispatch(fillMatrix())}>
                      <FontAwesomeIcon size={'sm'} icon={faRotateLeft} />
                      <IconButtonTooltip>{t('Reset')}</IconButtonTooltip>
                    </IconButtonContainer>
                    {importEnable && (
                      <>
                        <IconButtonContainer
                          onClick={() => imageInput.current?.click()}
                        >
                          <FontAwesomeIcon size={'sm'} icon={faImage} />
                          <IconButtonTooltip>
                            {t('Import Image')}
                          </IconButtonTooltip>
                        </IconButtonContainer>
                        <IconButtonContainer
                          onClick={() => videoInput.current?.click()}
                        >
                          <FontAwesomeIcon size={'sm'} icon={faVideo} />
                          <IconButtonTooltip>
                            {t('Import Video')}
                          </IconButtonTooltip>
                        </IconButtonContainer>
                      </>
                    )}
                  </MatrixButtons>
                </FlexLabel>
                <Detail>
                  <HiddenInput
                    accept={'image/*'}
                    onChange={handleImageChange}
                    type="file"
                    ref={imageInput}
                  />
                  <HiddenInput
                    accept={'video/mp4,image/gif'}
                    onChange={handleVideoChange}
                    type="file"
                    ref={videoInput}
                  />
                </Detail>
              </ControlRow>
              <ControlRow>
                <FlexLabel>
                  <Detail>
                    <FpsSelect
                      value={fpsOption}
                      onChange={(o: any) => dispatch(setFps(o.value))}
                      options={fpsOptions}
                    />
                  </Detail>
                </FlexLabel>
                <Detail>
                  <MatrixButtons>
                    <IconButtonContainer onClick={() => setPlaying(!playing)}>
                      <FontAwesomeIcon
                        size={'sm'}
                        icon={playing ? faStop : faPlay}
                      />
                      <IconButtonTooltip>
                        {playing ? t('Stop') : t('Play')}
                      </IconButtonTooltip>
                    </IconButtonContainer>
                  </MatrixButtons>
                </Detail>
              </ControlRow>
              <ControlRow>
                <FlexLabel>
                  <MatrixButtons>
                    <IconButtonContainer onClick={importFile}>
                      <FontAwesomeIcon size={'sm'} icon={faFileImport} />
                      <IconButtonTooltip>{t('Import File')}</IconButtonTooltip>
                    </IconButtonContainer>
                    <HiddenInput
                      accept={'.tabml'}
                      onChange={handleFileChange}
                      type="file"
                      ref={fileInput}
                    />
                    <IconButtonContainer onClick={downloadFile}>
                      <FontAwesomeIcon size={'sm'} icon={faDownload} />
                      <IconButtonTooltip>
                        {t('Download File')}
                      </IconButtonTooltip>
                    </IconButtonContainer>
                  </MatrixButtons>
                </FlexLabel>
                <Detail>
                  <AccentButton disabled={saving} onClick={save}>
                    {t('Save')}
                  </AccentButton>
                </Detail>
              </ControlRow>
              {errorMessage ? (
                <ErrorMessage onClick={() => setErrorMessage(null)}>
                  {errorMessage}
                </ErrorMessage>
              ) : null}
            </MatrixControlRows>
          </MatrixConfigure>
        </MatrixEditor>
        <MatrixList>
          {matrixList.map((matrix, i) => (
            <MatrixFrame
              key={i}
              matrix={matrix}
              index={i}
              active={i === matrixIndex}
            />
          ))}
        </MatrixList>
      </Container>
    </MatrixLightingPane>
  );
};

export const Icon: FC = () => {
  return (
    <svg viewBox="-1 -1 18 18" fill="currentColor">
      <path d="M3.5 2.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm11.5 0a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm-1.25 7a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm1.25 4.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM2.25 9.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm7-1.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM8 15a1.25 1.25 0 100-2.5A1.25 1.25 0 008 15zM9.25 2.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM2.25 15a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"></path>
    </svg>
  );
};
export const Title = title;
