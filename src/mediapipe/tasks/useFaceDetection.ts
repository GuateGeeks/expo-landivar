import { useRef, useCallback } from "react";
import { FaceDetector } from "@mediapipe/tasks-vision";
import {
  drawVideoFrame,
  drawBoundingBox,
  drawLandmarks,
} from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useFaceDetection() {
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number>(0);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    detectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["face-detection"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(detectorRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo);
        },
        onFrame: ({ video: frameVideo, ctx: frameCtx, now }) => {
          const detector = detectorRef.current;
          if (!detector) return;

          const result = detector.detectForVideo(frameVideo, now);

          for (const detection of result.detections) {
            if (detection.boundingBox) {
              const score = detection.categories?.[0]?.score ?? 0;
              const label = `Face ${Math.round(score * 100)}%`;
              drawBoundingBox(
                frameCtx,
                detection.boundingBox,
                label,
                "#00FF00",
              );
            }
            if (detection.keypoints) {
              drawLandmarks(
                frameCtx,
                detection.keypoints.map((kp) => ({ x: kp.x, y: kp.y })),
                "#FF0000",
                3,
              );
            }
          }
        },
      });
    },
    [],
  );

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    detectorRef.current?.close();
    detectorRef.current = null;
  }, []);

  return { init, detect, cleanup };
}
