import type { MutableRefObject } from "react";
import { clearCanvas, syncCanvasSize } from "./drawingUtils.ts";

export interface VisionLoopContext {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  now: number;
}

interface StartVisionLoopOptions {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  rafRef: MutableRefObject<number>;
  shouldRun: () => boolean;
  onFrame: (context: VisionLoopContext) => void | Promise<void>;
  beforeFrame?: (context: VisionLoopContext) => void;
}

const isPromise = (value: unknown): value is Promise<void> =>
  typeof (value as Promise<void>)?.then === "function";

export const startVisionLoop = ({
  video,
  canvas,
  rafRef,
  shouldRun,
  onFrame,
  beforeFrame,
}: StartVisionLoopOptions) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const loop = () => {
    if (!shouldRun() || video.paused || video.ended) return;

    syncCanvasSize(canvas, video);
    clearCanvas(ctx);

    const context: VisionLoopContext = {
      video,
      canvas,
      ctx,
      now: performance.now(),
    };

    beforeFrame?.(context);

    const result = onFrame(context);
    if (isPromise(result)) {
      result.finally(() => {
        rafRef.current = requestAnimationFrame(loop);
      });
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  loop();
};
