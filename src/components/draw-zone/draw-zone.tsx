import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { noop } from '~/helpers';

const DrawZoneStyled = styled.canvas`
  width: 100%;
  height: 100%;

  border: 1px solid #eee;
`;

const scale = (drawZone: HTMLCanvasElement) => {
  const pixelRatio = window.devicePixelRatio;

  const zoneCtx = drawZone.getContext('2d');

  const { width, height } = drawZone.getBoundingClientRect();

  drawZone.width = Math.floor(width * pixelRatio);
  drawZone.height = Math.floor(height * pixelRatio);

  zoneCtx.scale(pixelRatio, pixelRatio);
};

const updatePixelRatio = (drawZone: HTMLCanvasElement) => {
  const update = () => {
    scale(drawZone);

    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', update, {
      once: true,
    });
  };

  update();
};

type Viewport = { x: number; y: number; width: number; height: number };

type Drag = { x: number; y: number };

type Event = {
  type: 'onclick';
  event: PointerEvent;
};

export type Draw = (
  ctx: CanvasRenderingContext2D,
  options: { moveMouseEvent: MouseEvent | null; events: Event[]; viewport: Viewport | null }
) => void;

type DrawZoneProps = {
  draw: Draw;
  maxFPS?: number;
  debug?: boolean;
};

export const DrawZone = ({ draw, maxFPS = 30, debug = false }: DrawZoneProps) => {
  const zoneRef = useRef<HTMLCanvasElement | null>(null);

  const dragStartRef = useRef<Drag | null>(null);

  const viewportStartRef = useRef<Viewport | null>(null);
  const viewportRef = useRef<Viewport | null>(null);

  const moveMouseEvent = useRef<MouseEvent | null>(null);

  const events = useRef<Event[]>([]);

  useEffect(() => {
    if (!zoneRef.current) {
      return noop;
    }
    const zoneCtx = zoneRef.current.getContext('2d');

    const { width, height } = zoneRef.current.getBoundingClientRect();

    // set initial viewport
    viewportRef.current = {
      x: 0,
      y: 0,
      width,
      height,
    };

    updatePixelRatio(zoneRef.current);

    const onClickHandler = (event: PointerEvent) => {
      events.current.push({
        type: 'onclick',
        event,
      });
    };

    const onMouseMoveHandler = (e: MouseEvent) => {
      moveMouseEvent.current = e;

      if (dragStartRef.current) {
        const dragDelta = {
          x: dragStartRef.current.x - e.clientX,
          y: dragStartRef.current.y - e.clientY,
        };

        if (viewportRef.current) {
          viewportRef.current.x = viewportStartRef.current.x + dragDelta.x;
          viewportRef.current.y = viewportStartRef.current.y + dragDelta.y;
        }
        // zoneCtx.translate(viewportRef.current.x, viewportRef.current.y);
      }
    };

    const onMouseDownHandler = (e: MouseEvent) => {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
      viewportStartRef.current = { ...viewportRef.current };
    };

    const onMouseUpHandler = () => {
      dragStartRef.current = null;
    };

    const onResizeHandler = () => {
      scale(zoneRef.current);
    };

    zoneRef.current.addEventListener('click', onClickHandler);
    zoneRef.current.addEventListener('mousemove', onMouseMoveHandler);
    zoneRef.current.addEventListener('mousedown', onMouseDownHandler);
    zoneRef.current.addEventListener('mouseup', onMouseUpHandler);

    window.addEventListener('resize', onResizeHandler);

    return () => {
      zoneRef.current.removeEventListener('click', onClickHandler);
      zoneRef.current.removeEventListener('mousemove', onMouseMoveHandler);
      zoneRef.current.removeEventListener('mousedown', onMouseDownHandler);
      zoneRef.current.removeEventListener('mouseup', onMouseUpHandler);

      window.removeEventListener('resize', onResizeHandler);
    };
  }, [zoneRef]);

  useEffect(() => {
    const zoneCtx = zoneRef.current.getContext('2d');

    let animationFrameId: number = null;
    let lastTimestamp: DOMHighResTimeStamp = 0;

    const frameTime = 1000 / maxFPS;

    const render = (timestamp: DOMHighResTimeStamp) => {
      animationFrameId = window.requestAnimationFrame(render);

      if (timestamp - lastTimestamp < frameTime) {
        return;
      }
      lastTimestamp = timestamp;

      draw(zoneCtx, {
        moveMouseEvent: moveMouseEvent.current,
        viewport: viewportRef.current,
        events: events.current,
      });

      events.current = [];
    };

    window.requestAnimationFrame(render);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [draw]);

  return <DrawZoneStyled ref={zoneRef} />;
};
