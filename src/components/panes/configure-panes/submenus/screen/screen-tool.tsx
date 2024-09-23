import {FC} from 'react';
import {AccentSelect} from 'src/components/inputs/accent-select';
import {getSelectedConnectedDevice} from 'src/store/devicesSlice';
import {useAppSelector} from 'src/store/hooks';
import {getSelectedTool, getExportOptions} from 'src/store/screenSlice';
import {ScreenFileType} from 'src/types/types';
import styled from 'styled-components';

export type ScreenFile = {
  name: string;
  type: string;
  src: string;
  width: number;
  height: number;
  byteArray: Uint8Array;
};

export const HiddenInput = styled.input`
  display: none;
`;

export const MediaRow = styled.div`
  max-width: 960px;
  width: 100%;
  display: flex;
  border: 1px solid var(--border_color_cell);
  border-style: dashed;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 15px;
  min-height: 100px;
  margin-bottom: 10px;
  box-sizing: border-box;
  text-align: center;
  color: var(--color_label-highlighted);
`;

export const FlexLabel = styled.div`
  color: var(--color_label);
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  position: relative;
`;

export const getScreenFiles = (files: File[]): Promise<ScreenFile[]> => {
  const getVideoDimension = (src: string): Promise<[number, number]> => {
    return new Promise((res, rej) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        res([video.videoWidth, video.videoHeight]);
      };
      video.src = src;
      video.load();
    });
  };

  const getImageDimension = (src: string): Promise<[number, number]> => {
    return new Promise((res, rej) => {
      const img = document.createElement('img');
      img.onload = () => {
        res([img.width, img.height]);
      };
      img.src = src;
    });
  };

  return Promise.all(
    files.map(async (file: File) => {
      const url = URL.createObjectURL(file);
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      let width = 0;
      let height = 0;
      if (file.type.startsWith('video')) {
        [width, height] = await getVideoDimension(url);
      } else if (file.type.startsWith('image')) {
        [width, height] = await getImageDimension(url);
      }
      return {
        name: file.name,
        type: file.type,
        src: url,
        width: width,
        height: height,
        byteArray,
      } as ScreenFile;
    }),
  );
};

export const downloadFile = function (
  arrayBuffer: Uint8Array,
  fileName: string,
) {
  const blob = new Blob([arrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const ExportSelect: FC<{
  area: ScreenFileType;
  onChange: (option: any) => void;
}> = ({area, onChange}) => {
  const tool = useAppSelector(getSelectedTool);
  const exportOptions = useAppSelector(getExportOptions);
  const device = useAppSelector(getSelectedConnectedDevice);
  const venderProductId = device ? device.vendorProductId : -1;
  if (!exportOptions) {
    return null;
  }
  const defaultValue = exportOptions.find((opt: any) => opt.value === area);
  if (exportOptions.length === 1) {
    return <>{defaultValue?.label}</>;
  }
  return (
    <>
      <AccentSelect
        key={venderProductId + tool}
        onChange={onChange}
        value={defaultValue}
        options={exportOptions}
      />
    </>
  );
};

export const printBytes = (bufferSize: number) => {
  if (bufferSize === 0) {
    return 0;
  }
  const units = ['Bytes', 'kB', 'MB', 'GB'];
  const scale = Math.floor(Math.log10(bufferSize) / 3);
  const suffix = units[scale];
  const denominator = scale === 0 ? 1 : Math.pow(1000, scale);
  const convertedBufferSize = bufferSize / denominator;

  return `${convertedBufferSize.toFixed(scale)} ${suffix}`;
};
