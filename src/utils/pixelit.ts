export const pixleImg = (
  img: HTMLImageElement,
  width: number,
  height: number,
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

  const canvasRatio = width / height;

  let sx, sy, sw, sh, imgRatio;
  imgRatio = scaleW / scaleH;
  if (imgRatio <= canvasRatio) {
    sw = scaleW;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (scaleH - sh) / 2;
  } else {
    sh = scaleH;
    sw = sh * canvasRatio;
    sx = (scaleW - sw) / 2;
    sy = 0;
  }

  ctx.drawImage(tempCanvas, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return Uint8Array.from(
    ctx.getImageData(0, 0, width, height, {
      colorSpace: 'srgb',
    }).data,
  );
};
