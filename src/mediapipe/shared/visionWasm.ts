import { FilesetResolver } from "@mediapipe/tasks-vision";

const VISION_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let visionFilesetPromise: Promise<VisionFileset> | null = null;

export const getVisionFileset = () => {
  if (!visionFilesetPromise) {
    visionFilesetPromise = FilesetResolver.forVisionTasks(
      VISION_WASM_URL,
    ).catch((error) => {
      visionFilesetPromise = null;
      throw error;
    });
  }
  return visionFilesetPromise;
};
