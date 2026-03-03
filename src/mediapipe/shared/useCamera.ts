import { useRef, useState, useCallback, useEffect } from "react";

type FacingMode = "user" | "environment";

export interface CameraState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  error: string | null;
  facingMode: FacingMode;
  hasMultipleCameras: boolean;
  start: () => Promise<void>;
  stop: () => void;
  flip: () => Promise<void>;
}

export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const updateDeviceCount = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(
      (device) => device.kind === "videoinput",
    );
    setHasMultipleCameras(videoInputs.length > 1);
  }, []);

  const startWithMode = useCallback(
    async (mode: FacingMode) => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          setFacingMode(mode);
        }
        await updateDeviceCount();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Camera access denied";
        setError(message);
        setIsStreaming(false);
      }
    },
    [updateDeviceCount],
  );

  const start = useCallback(async () => {
    await startWithMode(facingMode);
  }, [facingMode, startWithMode]);

  const flip = useCallback(async () => {
    const nextMode: FacingMode = facingMode === "user" ? "environment" : "user";
    stop();
    await startWithMode(nextMode);
  }, [facingMode, startWithMode, stop]);

  useEffect(() => {
    return stop;
  }, [stop]);

  return {
    videoRef,
    isStreaming,
    error,
    facingMode,
    hasMultipleCameras,
    start,
    stop,
    flip,
  };
}
