export const pixleImg = (
  img: HTMLImageElement,
  height: number,
  width: number,
): Uint8Array => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;

  const scaleW = img.width * 0.2;
  const scaleH = img.height * 0.2;

  const tempContext = tempCanvas.getContext('2d') as CanvasRenderingContext2D;
  tempContext.drawImage(img, 0, 0, scaleW, scaleH);
  tempContext.imageSmoothingEnabled = false;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = false;

  let ratio = 1.0;

  if (img.width > img.height) {
    ratio = width / img.width;
  } else {
    ratio = height / img.height;
  }

  const x = (width - img.width * ratio) / 2;
  const y = (height - img.height * ratio) / 2;
  const w = img.width * ratio;
  const h = img.height * ratio;

  ctx.drawImage(tempCanvas, 0, 0, scaleW, scaleH, x, y, w, h);

  tempCanvas.remove();
  canvas.remove();

  return Uint8Array.from(
    ctx.getImageData(0, 0, width, height, {
      colorSpace: 'srgb',
    }).data,
  );
};
