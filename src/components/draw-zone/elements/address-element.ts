import { connectElements, drawRoundRect, fitText, isPointInPath, BoxElement } from '~/helpers';

const ADDRESS_RADIUS = 4;
const ADDRESS_LINE_WIDTH = 2;
const ADDRESS_PADDING = 5;
const ADDRESS_LINE_COLOR = '#42a5f5';
const ADDRESS_HOVER_COLOR = '#0288d1';

type DrawAddressElement = (options: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  address: string;
  moveMouseEvent: MouseEvent | null;
  connect?: BoxElement;
  connectLabel?: string | number;
}) => BoxElement;

export const drawAddressElement: DrawAddressElement = ({
  ctx,
  x,
  y,
  w,
  h,
  address,
  moveMouseEvent,
  connect,
  connectLabel,
}) => {
  const addressPath = drawRoundRect(ctx, x, y, w, h, ADDRESS_RADIUS, {
    lineWidth: ADDRESS_LINE_WIDTH,
    strokeStyle: ADDRESS_LINE_COLOR,
  });

  ctx.font = '14px Roboto, serif';
  ctx.fillStyle = 'white';
  ctx.fillText(
    fitText(ctx, address, w - ADDRESS_PADDING * 2),
    x + ADDRESS_PADDING,
    y + ADDRESS_PADDING + 10
  );

  if (connect) {
    connectElements(ctx, connect, { x, y, w, h, path: addressPath }, { label: connectLabel });
  }

  if (moveMouseEvent) {
    ctx.lineWidth = ADDRESS_LINE_WIDTH;

    if (isPointInPath(ctx, addressPath, moveMouseEvent.offsetX, moveMouseEvent.offsetY)) {
      ctx.strokeStyle = ADDRESS_HOVER_COLOR;
    } else {
      ctx.strokeStyle = ADDRESS_LINE_COLOR;
    }
    ctx.stroke(addressPath);
  }

  return { x, y, w, h, path: addressPath };
};
