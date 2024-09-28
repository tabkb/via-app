import {ConnectedDevice} from 'src/types/types';
import {numIntoBytes} from './bit-pack';
import {isEqual} from 'lodash';

const BAUD = 115200;
const BUFFER_SIZE = 64;

const getSerialPort = async (device: CDCDevice) => {
  let port = await getFilteredPort(device);
  if (!port) {
    port = await navigator.serial.requestPort({
      filters: [{usbVendorId: device.vendorId, usbProductId: device.productId}],
    });
  }
  if (!port) {
    throw new Error('no serial port');
  }
  return port;
};

const getFilteredPort = async (device: CDCDevice) => {
  const ports = await navigator.serial.getPorts();
  const port = ports.find((p) => {
    const info = p.getInfo();
    return (
      info.usbVendorId === device.vendorId &&
      info.usbProductId === device.productId
    );
  });

  return port;
};

const cache: {[path: string]: SerialPort} = {};

enum APICommand {
  TAB_MATRIX_LIGHTING_SET_INFO = 0xc0,
  TAB_MATRIX_LIGHTING_SET_BUFFER = 0xc1,

  TAB_FILE_SET_INFO = 0xe0,
  TAB_FILE_SET_BUFFER = 0xe1,
  TAB_FILE_SET_CANCEL = 0xe2,
  TAB_FIRMWARE_SET_INFO = 0xf0,
  TAB_FIRMWARE_SET_BUFFER = 0xf1,
}

export type CDCDevice = {
  path: string;
  vendorId: number;
  productId: number;
};

export class TabKeyboardAPI {
  device: CDCDevice;

  constructor(device: CDCDevice) {
    this.device = device;
  }

  getPort = async () => {
    if (this.device.path in cache) {
      return cache[this.device.path];
    }

    const port = await getSerialPort(this.device);
    await port.open({baudRate: BAUD, bufferSize: 1024});
    cache[this.device.path] = port;

    return port;
  };

  async setMatrixLighting(
    frames: number,
    fps: number,
    rows: number,
    cols: number,
    data: number[],
  ) {
    const resp = await this.seriaCommandWithResponse(
      APICommand.TAB_MATRIX_LIGHTING_SET_INFO,
      [frames, fps, rows, cols],
    );

    if (resp && resp[5] === 0xee) {
      const error = new Error('Error: ' + resp[5]);
      error.cause = resp[5];
      throw error;
    }

    const bufferSize = BUFFER_SIZE - 8;
    for (let offset = 0; offset < data.length; offset += bufferSize) {
      const buffer = data.slice(offset, offset + bufferSize);
      await this.seriaCommand(APICommand.TAB_MATRIX_LIGHTING_SET_BUFFER, [
        ...numIntoBytes(offset),
        buffer.length,
        ...buffer,
      ]);
    }
  }

  async setTabFile(
    data: number[],
    onProgress?: (sended: number) => void,
    cancel?: () => boolean,
  ) {
    const resp = await this.seriaCommandWithResponse(
      APICommand.TAB_FILE_SET_INFO,
      data.slice(0, 20),
    );

    if (resp && resp[21] === 0xee) {
      const error = new Error('Error: ' + resp[21]);
      error.cause = resp[21];
      throw error;
    }

    return this.setTabBuffer(
      APICommand.TAB_FILE_SET_BUFFER,
      data,
      onProgress,
      cancel,
    );
  }

  async setTabFirmwareBuffer(
    data: number[],
    onProgress?: (sended: number) => void,
    cancel?: () => boolean,
  ) {
    return this.setTabBuffer(
      APICommand.TAB_FIRMWARE_SET_BUFFER,
      data,
      onProgress,
      cancel,
    );
  }

  async setTabFirmwareInfo(size: number, header: number[]): Promise<boolean> {
    const buffer = [...numIntoBytes(size), ...header];
    const resp = await this.seriaCommandWithResponse(
      APICommand.TAB_FIRMWARE_SET_INFO,
      buffer,
    );
    if (resp && resp[buffer.length + 1] === 0xee) {
      return false;
    }
    return true;
  }

  async setTabBuffer(
    cmd: APICommand,
    data: number[],
    onProgress?: (sended: number) => void,
    cancel?: () => boolean,
  ) {
    const bufferSize = BUFFER_SIZE - 8;
    for (let offset = 0; offset < data.length; offset += bufferSize) {
      const buffer = data.slice(offset, offset + bufferSize);
      await this.seriaCommand(cmd, [
        ...numIntoBytes(offset),
        buffer.length,
        ...buffer,
      ]);
      if (cancel && cancel()) {
        await this.seriaCommand(APICommand.TAB_FILE_SET_CANCEL);
        return;
      }
      if (onProgress) {
        onProgress(offset + buffer.length);
      }
    }
  }

  async seriaCommand(command: APICommand, bytes: Array<number> = []) {
    const commandBytes = [command, ...bytes];
    const paddedArray = new Array(BUFFER_SIZE).fill(0);
    commandBytes.forEach((val, idx) => {
      paddedArray[idx] = val;
    });

    const port = await this.getPort();
    if (port.writable) {
      const writer = port.writable.getWriter();
      console.debug('CDC', paddedArray);
      await writer.write(new Uint8Array(paddedArray));
      writer.releaseLock();
    }
  }

  async seriaCommandWithResponse(
    command: APICommand,
    bytes: Array<number> = [],
  ) {
    await this.seriaCommand(command, bytes);

    const port = await this.getPort();

    let resp: number[] = [];

    if (port.readable) {
      const reader = port.readable.getReader();
      try {
        while (true) {
          const {value, done} = await reader.read();
          console.debug('CDC read', value, done);
          if (value) {
            resp = [...resp, ...Array.from(value)];
            if (resp.length === BUFFER_SIZE) {
              console.debug('done...');
              break;
            }
          }
          if (done) {
            console.debug('done');
            break;
          }
        }
      } catch (e) {
        console.log(e);
        throw e;
      } finally {
        reader.releaseLock();
      }
      if (!isEqual(bytes, resp.slice(1, bytes.length + 1))) {
        console.error(`Command for CDC:`, bytes, 'Bad Resp:', resp);
        throw new Error('Receiving incorrect response for command');
      }
    }

    return resp;
  }
}
