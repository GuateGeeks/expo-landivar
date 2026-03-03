export const VISION_TASKS = [
  "face-detection",
  "hand-landmark",
  "gesture-recognition",
  "pose-landmark",
  "face-landmark",
  "object-detection",
  "image-classification",
  "image-segmentation",
] as const;

export type VisionTaskId = (typeof VISION_TASKS)[number];

export interface VisionTaskMeta {
  id: VisionTaskId;
  label: string;
  description: string;
  modelUrl: string;
  supportsVideo: boolean;
}

export const TASK_META: Record<VisionTaskId, VisionTaskMeta> = {
  "face-detection": {
    id: "face-detection",
    label: "Face Detection",
    description: "Detect faces and draw bounding boxes with keypoints.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    supportsVideo: true,
  },
  "face-landmark": {
    id: "face-landmark",
    label: "Face Landmark",
    description: "Detect 478 face landmarks and draw a mesh overlay.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    supportsVideo: true,
  },
  "hand-landmark": {
    id: "hand-landmark",
    label: "Hand Landmark",
    description: "Detect hand skeleton with 21 landmarks per hand.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    supportsVideo: true,
  },
  "gesture-recognition": {
    id: "gesture-recognition",
    label: "Gesture Recognition",
    description: "Recognize hand gestures (thumbs up, peace, fist, etc.).",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
    supportsVideo: true,
  },
  "pose-landmark": {
    id: "pose-landmark",
    label: "Pose Landmark",
    description: "Detect 33 body pose landmarks and draw a skeleton.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    supportsVideo: true,
  },
  "object-detection": {
    id: "object-detection",
    label: "Object Detection",
    description: "Detect objects with bounding boxes and class labels.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
    supportsVideo: true,
  },
  "image-classification": {
    id: "image-classification",
    label: "Image Classification",
    description: "Classify the dominant object in view with confidence scores.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite",
    supportsVideo: true,
  },
  "image-segmentation": {
    id: "image-segmentation",
    label: "Image Segmentation",
    description:
      "Segment the scene into semantic regions with colored overlays.",
    modelUrl:
      "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
    supportsVideo: true,
  },
};
