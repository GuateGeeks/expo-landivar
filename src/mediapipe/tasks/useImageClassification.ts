import { useRef, useCallback } from "react";
import { ImageClassifier } from "@mediapipe/tasks-vision";
import { drawVideoFrame, drawTextOverlay } from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useImageClassification() {
  const classifierRef = useRef<ImageClassifier | null>(null);
  const rafRef = useRef<number>(0);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    classifierRef.current = await ImageClassifier.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["image-classification"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      maxResults: 5,
    });
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(classifierRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo);
        },
        onFrame: ({ video: frameVideo, ctx: frameCtx, now }) => {
          const classifier = classifierRef.current;
          if (!classifier) return;

          const result = classifier.classifyForVideo(frameVideo, now);

          const lines: string[] = [];
          if (result.classifications.length > 0) {
            const categories = result.classifications[0].categories;
            for (const cat of categories) {
              lines.push(
                `${cat.categoryName}: ${Math.round(cat.score * 100)}%`,
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
    classifierRef.current?.close();
    classifierRef.current = null;
  }, []);

  return { init, detect, cleanup };
}
