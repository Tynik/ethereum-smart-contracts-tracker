import {
  getAngelBetween2Points,
  getBoxElementConnectPoints,
  getPointsDistance,
} from '~/helpers/math';

export const isPointInPath = (
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  x: number,
  y: number
) => {
  const pixelRatio = window.devicePixelRatio;

  return ctx.isPointInPath(path, x * pixelRatio, y * pixelRatio);
};

type DrawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  options: {
    lineWidth?: CanvasPathDrawingStyles['lineWidth'];
    fillStyle?: CanvasFillStrokeStyles['fillStyle'];
    strokeStyle?: CanvasFillStrokeStyles['strokeStyle'];
  }
) => Path2D;

export const drawRoundRect: DrawRoundRect = (
  ctx,
  x,
  y,
  w,
  h,
  r,
  { lineWidth, fillStyle, strokeStyle } = {}
) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;

  const rect = new Path2D();

  rect.moveTo(x + r, y);
  rect.arcTo(x + w, y, x + w, y + h, r);
  rect.arcTo(x + w, y + h, x, y + h, r);
  rect.arcTo(x, y + h, x, y, r);
  rect.arcTo(x, y, x + w, y, r);
  rect.closePath();

  if (lineWidth) {
    ctx.lineWidth = lineWidth;
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill(rect);
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke(rect);
  }

  return rect;
};

type BinarySearch = (options: {
  max: number;
  getValue: (v: number) => number;
  match: number;
}) => number;

const binarySearch: BinarySearch = ({ max, getValue, match }) => {
  let min = 0;

  while (min <= max) {
    const guess = Math.floor((min + max) / 2);
    const compareVal = getValue(guess);

    if (compareVal === match) return guess;
    if (compareVal < match) min = guess + 1;
    else max = guess - 1;
  }

  return max;
};

export const fitText = (ctx: CanvasRenderingContext2D, str: string, maxWidth: number) => {
  const { width } = ctx.measureText(str);

  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;

  if (width <= maxWidth || width <= ellipsisWidth) {
    return str;
  }

  const index = binarySearch({
    max: str.length,
    getValue: guess => ctx.measureText(str.substring(0, guess)).width,
    match: maxWidth - ellipsisWidth,
  });

  return str.substring(0, index) + ellipsis;
};

type Line = { x1: number; y1: number; x2: number; y2: number };

type DrawLineOptions = {
  label?: string | number;
  labelFontSize?: string;
  labelFontFamily?: string;
  labelColor?: string;
  lineWidth?: CanvasPathDrawingStyles['lineWidth'];
  lineColor?: string;
};

type DrawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: DrawLineOptions
) => void;

export const drawLine: DrawLine = (
  ctx,
  x1,
  y1,
  x2,
  y2,
  {
    label,
    labelFontSize = '12px',
    labelFontFamily = 'Roboto',
    labelColor = 'white',
    lineWidth = 1,
    lineColor = 'white',
  } = {}
) => {
  const distance = getPointsDistance(x1, y1, x2, y2);

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;

  ctx.moveTo(x1, y1);

  if (label !== undefined) {
    const distanceCenter = distance / 2;
    const labelCenterWidth = (ctx.measureText(label.toString()).width + 6) / 2;

    const t = (distanceCenter - labelCenterWidth) / distance;
    const t2 = (distanceCenter + labelCenterWidth) / distance;

    const labelStartPoint = {
      x: (1 - t) * x1 + t * x2,
      y: (1 - t) * y1 + t * y2,
    };

    const labelEndPoint = {
      x: (1 - t2) * x1 + t2 * x2,
      y: (1 - t2) * y1 + t2 * y2,
    };

    ctx.lineTo(labelStartPoint.x, labelStartPoint.y);
    ctx.moveTo(labelEndPoint.x, labelEndPoint.y);

    ctx.font = `${labelFontSize} ${labelFontFamily}, serif`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'left';

    const angle = getAngelBetween2Points(x1, y1, x2, y2);

    const cond = angle >= 0 && angle <= Math.PI;

    const translatePoint = cond ? labelStartPoint : labelEndPoint;

    ctx.save();

    ctx.translate(translatePoint.x, translatePoint.y);
    ctx.rotate((cond ? 0 : Math.PI) + angle);
    ctx.fillText(label.toString(), 3, 3);

    ctx.restore();
  }

  ctx.lineTo(x2, y2);
  ctx.stroke();
};

export type BoxElement = {
  x: number;
  y: number;
  w: number;
  h: number;
  path: Path2D;
};

type ConnectElements = (
  ctx: CanvasRenderingContext2D,
  element1: BoxElement,
  element2: BoxElement,
  options?: DrawLineOptions
) => void;

export const connectElements: ConnectElements = (ctx, element1, element2, drawLineOptions = {}) => {
  ctx.beginPath();

  const element1ConnectPoints = getBoxElementConnectPoints(element1);
  const element2ConnectPoints = getBoxElementConnectPoints(element2);

  const lines: Line[] = [];

  for (let i = 0; i < element1ConnectPoints.length; i += 1) {
    for (let j = 0; j < element2ConnectPoints.length; j += 1) {
      lines.push({
        x1: element1ConnectPoints[i].x,
        y1: element1ConnectPoints[i].y,
        x2: element2ConnectPoints[j].x,
        y2: element2ConnectPoints[j].y,
      });
    }
  }

  const [line] = lines.sort((line1, line2) =>
    getPointsDistance(line1.x1, line1.y1, line1.x2, line1.y2) >
    getPointsDistance(line2.x1, line2.y1, line2.x2, line2.y2)
      ? 1
      : -1
  );

  drawLine(ctx, line.x1, line.y1, line.x2, line.y2, drawLineOptions);
};
