import { useRef, useCallback } from "react";
import { ImageSegmenter } from "@mediapipe/tasks-vision";
import {
  drawVideoFrame,
  drawLegendText,
  drawLegendRect,
} from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

/** DeepLab v3 category labels (21 Pascal VOC classes). */
const CATEGORY_LABELS = [
  "background",
  "aeroplane",
  "bicycle",
  "bird",
  "boat",
  "bottle",
  "bus",
  "car",
  "cat",
  "chair",
  "cow",
  "dining table",
  "dog",
  "horse",
  "motorbike",
  "person",
  "potted plant",
  "sheep",
  "sofa",
  "train",
  "tv/monitor",
];

/** Per-category RGBA colors for the segmentation overlay. */
const CATEGORY_COLORS: [number, number, number, number][] = [
  [0, 0, 0, 0],
  [128, 0, 0, 160],
  [0, 128, 0, 160],
  [128, 128, 0, 160],
  [0, 0, 128, 160],
  [128, 0, 128, 160],
  [0, 128, 128, 160],
  [128, 128, 128, 160],
  [64, 0, 0, 160],
  [192, 0, 0, 160],
  [64, 128, 0, 160],
  [192, 128, 0, 160],
  [64, 0, 128, 160],
  [192, 0, 128, 160],
  [64, 128, 128, 160],
  [192, 128, 128, 160],
  [0, 64, 0, 160],
  [128, 64, 0, 160],
  [0, 192, 0, 160],
  [128, 192, 0, 160],
  [0, 64, 128, 160],
];

export function useImageSegmentation() {
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const rafRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["image-segmentation"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  }, []);

  const detect = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      shouldMirror: () => boolean,
    ) => {
      startVisionLoop({
        video,
        canvas,
        rafRef,
        shouldRun: () => Boolean(segmenterRef.current),
        onFrame: ({
          video: frameVideo,
          canvas: frameCanvas,
          ctx: frameCtx,
          now,
        }) => {
          const segmenter = segmenterRef.current;
          if (!segmenter || isProcessingRef.current) return;

          isProcessingRef.current = true;

          return new Promise<void>((resolve) => {
            segmenter.segmentForVideo(frameVideo, now, (result) => {
              if (!result.categoryMask) {
                isProcessingRef.current = false;
                resolve();
                return;
              }

              const mask = result.categoryMask.getAsUint8Array();
              const width = result.categoryMask.width;
              const height = result.categoryMask.height;
              drawVideoFrame(frameCtx, frameVideo, shouldMirror());

              const overlayCanvas = document.createElement("canvas");
              overlayCanvas.width = width;
              overlayCanvas.height = height;
              const overlayCtx = overlayCanvas.getContext("2d");
              if (!overlayCtx) {
                isProcessingRef.current = false;
                resolve();
                return;
              }

              const imageData = overlayCtx.createImageData(width, height);
              const detectedCategories = new Set<number>();

              for (let i = 0; i < mask.length; i++) {
                const category = mask[i];
                if (category > 0) detectedCategories.add(category);
                const color =
                  CATEGORY_COLORS[category % CATEGORY_COLORS.length];
                imageData.data[i * 4] = color[0];
                imageData.data[i * 4 + 1] = color[1];
                imageData.data[i * 4 + 2] = color[2];
                imageData.data[i * 4 + 3] = color[3];
              }

              overlayCtx.putImageData(imageData, 0, 0);
              frameCtx.drawImage(
                overlayCanvas,
                0,
                0,
                frameCanvas.width,
                frameCanvas.height,
              );

              if (detectedCategories.size > 0) {
                const legendY =
                  frameCanvas.height - 30 * detectedCategories.size - 10;
                let i = 0;
                for (const cat of detectedCategories) {
                  const color = CATEGORY_COLORS[cat % CATEGORY_COLORS.length];
                  const label = CATEGORY_LABELS[cat] ?? `class ${cat}`;
                  frameCtx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`;
                  drawLegendRect(frameCtx, 10, legendY + i * 30, 20, 20);
                  frameCtx.fillStyle = "#FFFFFF";
                  frameCtx.font = "bold 14px system-ui, sans-serif";
                  drawLegendText(frameCtx, label, 36, legendY + i * 30 + 15);
                  i++;
                }
              }

              result.categoryMask.close();
              isProcessingRef.current = false;
              resolve();
            });
          });
        },
      });
    },
    [],
  );

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    isProcessingRef.current = false;
    segmenterRef.current?.close();
    segmenterRef.current = null;
  }, []);

  return { init, detect, cleanup };
}
