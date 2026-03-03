import { useRef, useCallback } from "react";
import { GestureRecognizer, DrawingUtils } from "@mediapipe/tasks-vision";
import { drawVideoFrame, drawTextOverlay } from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useGestureRecognition() {
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const rafRef = useRef<number>(0);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["gesture-recognition"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }, []);

  const detect = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      shouldMirror: () => boolean,
    ) => {
      let drawingUtils: DrawingUtils | null = null;
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(recognizerRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo, shouldMirror());
        },
        onFrame: ({ video: frameVideo, ctx: frameCtx, now }) => {
          const recognizer = recognizerRef.current;
          if (!recognizer) return;

          if (!drawingUtils) {
            drawingUtils = new DrawingUtils(frameCtx);
          }

          const result = recognizer.recognizeForVideo(frameVideo, now);

          for (const landmarks of result.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              GestureRecognizer.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 3 },
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 1,
              radius: 3,
            });
          }

          const lines: string[] = [];
          for (let i = 0; i < result.gestures.length; i++) {
            const gesture = result.gestures[i][0];
            const handedness = result.handednesses[i][0];
            if (gesture && handedness) {
              lines.push(
                `${handedness.categoryName}: ${gesture.categoryName} (${Math.round(gesture.score * 100)}%)`,
              );
            }
          }
          if (lines.length > 0) {
            drawTextOverlay(frameCtx, lines);
          }
        },
      });
    },
    [],
  );

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    recognizerRef.current?.close();
    recognizerRef.current = null;
  }, []);

  return { init, detect, cleanup };
}
