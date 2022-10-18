import { BoxElement } from '~/helpers/canvas';

export const getPointsDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

export const getAngelBetween2Points = (x1: number, y1: number, x2: number, y2: number) =>
  Math.atan2(y2 - y1, x2 - x1);

export const getBoxElementConnectPoints = (element: BoxElement) => {
  return [
    {
      x: element.x + element.w / 2,
      y: element.y,
    },
    {
      x: element.x + element.w,
      y: element.y + element.h / 2,
    },
    {
      x: element.x + element.w / 2,
      y: element.y + element.h,
    },
    {
      x: element.x,
      y: element.y + element.h / 2,
    },
  ];
};
