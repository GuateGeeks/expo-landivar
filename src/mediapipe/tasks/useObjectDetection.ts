import { useRef, useCallback } from "react";
import { ObjectDetector } from "@mediapipe/tasks-vision";
import { drawVideoFrame, drawBoundingBox } from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useObjectDetection() {
  const detectorRef = useRef<ObjectDetector | null>(null);
  const rafRef = useRef<number>(0);
  const runningModeRef = useRef<"IMAGE" | "VIDEO">("IMAGE");
  const lastVideoTimeRef = useRef(-1);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    detectorRef.current = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["object-detection"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      scoreThreshold: 0.5,
    });
    runningModeRef.current = "IMAGE";
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const COLORS = ["#FF6633", "#33FF66", "#3366FF", "#FF33FF", "#FFFF33"];
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(detectorRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo);
        },
        onFrame: async ({
          video: frameVideo,
          canvas: frameCanvas,
          ctx: frameCtx,
          now,
        }) => {
          const detector = detectorRef.current;
          if (!detector) return;

          if (runningModeRef.current === "IMAGE") {
            runningModeRef.current = "VIDEO";
            await detector.setOptions({ runningMode: "VIDEO" });
          }

          if (frameVideo.currentTime === lastVideoTimeRef.current) return;
          lastVideoTimeRef.current = frameVideo.currentTime;

          const result = detector.detectForVideo(frameVideo, now);

          for (let i = 0; i < result.detections.length; i++) {
            const detection = result.detections[i];
            if (!detection.boundingBox) continue;
            const category = detection.categories[0];
            const label = category
              ? `${category.categoryName} ${Math.round(category.score * 100)}%`
              : undefined;
            const color = COLORS[i % COLORS.length];
            const box = detection.boundingBox;
            const isNormalized = box.width <= 1 && box.height <= 1;
            const scaledBox = isNormalized
              ? {
                  originX: box.originX * frameCanvas.width,
                  originY: box.originY * frameCanvas.height,
                  width: box.width * frameCanvas.width,
                  height: box.height * frameCanvas.height,
                }
              : box;
            drawBoundingBox(frameCtx, scaledBox, label, color);
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
