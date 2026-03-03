import { useRef, useCallback } from "react";
import { HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { drawVideoFrame } from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useHandLandmark() {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["hand-landmark"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      let drawingUtils: DrawingUtils | null = null;
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(landmarkerRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo);
        },
        onFrame: ({ video: frameVideo, ctx: frameCtx, now }) => {
          const landmarker = landmarkerRef.current;
          if (!landmarker) return;

          if (!drawingUtils) {
            drawingUtils = new DrawingUtils(frameCtx);
          }

          const result = landmarker.detectForVideo(frameVideo, now);

          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 3 },
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 1,
              radius: 3,
            });
          }
        },
      });
    },
    [],
  );

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  return { init, detect, cleanup };
}
