import { useRef, useCallback } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { drawVideoFrame } from "../shared/drawingUtils.ts";
import { TASK_META } from "../shared/types.ts";
import { getVisionFileset } from "../shared/visionWasm.ts";
import { startVisionLoop } from "../shared/visionLoop.ts";

export function useFaceLandmark() {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  const init = useCallback(async () => {
    const vision = await getVisionFileset();
    landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META["face-landmark"].modelUrl,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 2,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
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
        shouldRun: () => Boolean(landmarkerRef.current),
        beforeFrame: ({ ctx: frameCtx, video: frameVideo }) => {
          drawVideoFrame(frameCtx, frameVideo, shouldMirror());
        },
        onFrame: ({ video: frameVideo, ctx: frameCtx, now }) => {
          const landmarker = landmarkerRef.current;
          if (!landmarker) return;

          if (!drawingUtils) {
            drawingUtils = new DrawingUtils(frameCtx);
          }

          const result = landmarker.detectForVideo(frameVideo, now);

          for (const landmarks of result.faceLandmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_TESSELATION,
              { color: "#C0C0C070", lineWidth: 1 },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
              { color: "#30FF30" },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
              { color: "#30FF30" },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
              { color: "#E0E0E0" },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LIPS,
              { color: "#FF3030" },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
              { color: "#30FF30" },
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
              { color: "#30FF30" },
            );
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
