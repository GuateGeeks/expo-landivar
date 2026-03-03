import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "./MediaPipeApp.css";
import { VISION_TASKS, TASK_META } from "./shared/types.ts";
import type { VisionTaskId } from "./shared/types.ts";
import { useCamera } from "./shared/useCamera.ts";
import { useBroadcast } from "./shared/useBroadcast.ts";
import { useFaceDetection } from "./tasks/useFaceDetection.ts";
import { useFaceLandmark } from "./tasks/useFaceLandmark.ts";
import { useHandLandmark } from "./tasks/useHandLandmark.ts";
import { useGestureRecognition } from "./tasks/useGestureRecognition.ts";
import { usePoseLandmark } from "./tasks/usePoseLandmark.ts";
import { useObjectDetection } from "./tasks/useObjectDetection.ts";
import { useImageClassification } from "./tasks/useImageClassification.ts";
import { useImageSegmentation } from "./tasks/useImageSegmentation.ts";
import { TaskCarousel } from "./TaskCarousel.tsx";

type Status = "idle" | "loading" | "running" | "error";

export function MediaPipeApp() {
  const baseUrl = import.meta.env.BASE_URL;
  const [activeTask, setActiveTask] = useState<VisionTaskId>("face-landmark");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mirrorRef = useRef(true);
  const camera = useCamera();
  const broadcast = useBroadcast();

  useEffect(() => {
    mirrorRef.current = camera.facingMode === "user";
  }, [camera.facingMode]);

  // All task hooks
  const faceDetection = useFaceDetection();
  const faceLandmark = useFaceLandmark();
  const handLandmark = useHandLandmark();
  const gestureRecognition = useGestureRecognition();
  const poseLandmark = usePoseLandmark();
  const objectDetection = useObjectDetection();
  const imageClassification = useImageClassification();
  const imageSegmentation = useImageSegmentation();

  const tasks = useMemo(
    () =>
      ({
        "face-detection": faceDetection,
        "face-landmark": faceLandmark,
        "hand-landmark": handLandmark,
        "gesture-recognition": gestureRecognition,
        "pose-landmark": poseLandmark,
        "object-detection": objectDetection,
        "image-classification": imageClassification,
        "image-segmentation": imageSegmentation,
      }) as const,
    [
      faceDetection,
      faceLandmark,
      handLandmark,
      gestureRecognition,
      poseLandmark,
      objectDetection,
      imageClassification,
      imageSegmentation,
    ],
  );

  const stopTasks = useCallback(() => {
    for (const task of Object.values(tasks)) {
      task.cleanup();
    }
    setStatus("idle");
    setStatusMessage("");
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [tasks]);

  const stopAll = useCallback(() => {
    stopTasks();
    camera.stop();
    broadcast.stopBroadcast();
  }, [broadcast, camera, stopTasks]);

  const getShouldMirror = useCallback(() => mirrorRef.current, []);

  const startTask = useCallback(
    async (taskId: VisionTaskId) => {
      stopTasks();
      setActiveTask(taskId);
      setStatus("loading");
      setStatusMessage(`Loading ${TASK_META[taskId].label} model...`);
      const taskHook = tasks[taskId];

      try {
        await taskHook.init();
        if (!camera.isStreaming) {
          setStatusMessage("Starting camera...");
          await camera.start();
        }

        // Wait for video to be ready
        const video = camera.videoRef.current;
        if (!video || !canvasRef.current) {
          throw new Error("Video or canvas not available");
        }

        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.addEventListener("loadeddata", () => resolve(), {
              once: true,
            });
          }
        });

        taskHook.detect(video, canvasRef.current, getShouldMirror);
        setStatus("running");
        setStatusMessage(`${TASK_META[taskId].label} running`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setStatus("error");
        setStatusMessage(`Error: ${message}`);
      }
    },
    [camera, getShouldMirror, stopTasks, tasks],
  );

  const handleToggleBroadcast = useCallback(() => {
    if (broadcast.isBroadcasting) {
      broadcast.stopBroadcast();
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      broadcast.startBroadcast(canvas);
    }
  }, [broadcast]);

  const handleStop = useCallback(() => {
    stopAll();
  }, [stopAll]);

  const handleFlipCamera = useCallback(async () => {
    if (!camera.hasMultipleCameras) return;
    await camera.flip();
  }, [camera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const task of Object.values(tasks)) {
        task.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRunning = status === "running";
  const isMirror = camera.facingMode === "user";

  const statusPillClass = [
    "status-pill",
    status === "error" ? "error" : "",
    status === "loading" ? "loading" : "",
    status === "running" ? "ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const taskIcons: Record<VisionTaskId, string> = {
    "face-detection": "🙂",
    "face-landmark": "🧠",
    "hand-landmark": "✋",
    "gesture-recognition": "👆",
    "pose-landmark": "🕺",
    "object-detection": "📦",
    "image-classification": "🔎",
    "image-segmentation": "🧩",
  };

  return (
    <div className="mediapipe-app">
      {/* Fullscreen viewport — video + canvas fill the screen */}
      <div className="viewport">
        <video
          ref={camera.videoRef}
          className={isMirror ? "mirror" : undefined}
          playsInline
          muted
        />
        <canvas ref={canvasRef} />
      </div>

      {/* Top bar overlay — back link (left) + task name + status pill (right) */}
      <div className="top-bar">
        <a href={baseUrl} className="back-link">
          ← Back
        </a>
        <div className="top-bar-right">
          <span className="top-bar-task-name">
            {TASK_META[activeTask].label}
          </span>
          {statusMessage ? (
            <span className={statusPillClass}>{statusMessage}</span>
          ) : null}
        </div>
      </div>

      {/* Live badge — floating top-center, only when broadcasting */}
      {broadcast.isBroadcasting && (
        <div className="live-badge-container">
          <span className="live-badge">EN VIVO · {broadcast.viewerCount}</span>
        </div>
      )}

      {/* Floating action buttons — above record ring, only when running */}
      {isRunning && (
        <div className="action-float" role="group" aria-label="Task actions">
          {camera.hasMultipleCameras && (
            <button
              type="button"
              className="action-float-btn action-float-flip"
              onClick={handleFlipCamera}
              aria-label="Flip camera"
            >
              🔄
            </button>
          )}
          <button
            type="button"
            className="action-float-btn action-float-stop"
            onClick={handleStop}
            aria-label="Stop task"
          >
            ⏹
          </button>
        </div>
      )}

      <TaskCarousel
        tasks={VISION_TASKS}
        taskMeta={TASK_META}
        taskIcons={taskIcons}
        activeTaskId={activeTask}
        isBusy={status === "loading"}
        onSelectTask={startTask}
      />

      {/* Record ring — broadcast toggle, sits at z-index 12 above carousel */}
      <button
        type="button"
        className={
          broadcast.isBroadcasting ? "record-btn active" : "record-btn"
        }
        onClick={handleToggleBroadcast}
        aria-label={
          broadcast.isBroadcasting ? "Stop broadcast" : "Start broadcast"
        }
        disabled={!isRunning}
      >
        <span className="record-btn-inner" aria-hidden="true">
          {broadcast.isBroadcasting ? "🔴" : ""}
        </span>
      </button>
    </div>
  );
}
