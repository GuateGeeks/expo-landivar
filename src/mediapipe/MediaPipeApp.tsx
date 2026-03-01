import { useState, useRef, useCallback, useEffect } from 'react'
import './MediaPipeApp.css'
import { VISION_TASKS, TASK_META } from './shared/types.ts'
import type { VisionTaskId } from './shared/types.ts'
import { useCamera } from './shared/useCamera.ts'
import { useBroadcast } from './shared/useBroadcast.ts'
import { useFaceDetection } from './tasks/useFaceDetection.ts'
import { useFaceLandmark } from './tasks/useFaceLandmark.ts'
import { useHandLandmark } from './tasks/useHandLandmark.ts'
import { useGestureRecognition } from './tasks/useGestureRecognition.ts'
import { usePoseLandmark } from './tasks/usePoseLandmark.ts'
import { useObjectDetection } from './tasks/useObjectDetection.ts'
import { useImageClassification } from './tasks/useImageClassification.ts'
import { useImageSegmentation } from './tasks/useImageSegmentation.ts'
import { useInteractiveSegmentation } from './tasks/useInteractiveSegmentation.ts'

type Status = 'idle' | 'loading' | 'running' | 'error' | 'captured'

export function MediaPipeApp() {
  const [activeTask, setActiveTask] = useState<VisionTaskId>('face-detection')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const camera = useCamera()
  const broadcast = useBroadcast()

  // All task hooks
  const faceDetection = useFaceDetection()
  const faceLandmark = useFaceLandmark()
  const handLandmark = useHandLandmark()
  const gestureRecognition = useGestureRecognition()
  const poseLandmark = usePoseLandmark()
  const objectDetection = useObjectDetection()
  const imageClassification = useImageClassification()
  const imageSegmentation = useImageSegmentation()
  const interactiveSegmentation = useInteractiveSegmentation()

  const tasks = {
    'face-detection': faceDetection,
    'face-landmark': faceLandmark,
    'hand-landmark': handLandmark,
    'gesture-recognition': gestureRecognition,
    'pose-landmark': poseLandmark,
    'object-detection': objectDetection,
    'image-classification': imageClassification,
    'image-segmentation': imageSegmentation,
    'interactive-segmentation': interactiveSegmentation,
  } as const

  const activeTaskHook = tasks[activeTask]
  const taskMeta = TASK_META[activeTask]

  const stopAll = useCallback(() => {
    for (const task of Object.values(tasks)) {
      task.cleanup()
    }
    camera.stop()
    broadcast.stopBroadcast()
    setStatus('idle')
    setStatusMessage('')
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, broadcast])

  const handleStart = useCallback(async () => {
    stopAll()
    setStatus('loading')
    setStatusMessage(`Loading ${taskMeta.label} model...`)

    try {
      await activeTaskHook.init()
      setStatusMessage('Starting camera...')
      await camera.start()

      // Wait for video to be ready
      const video = camera.videoRef.current
      if (!video || !canvasRef.current) {
        throw new Error('Video or canvas not available')
      }

      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve()
        } else {
          video.addEventListener('loadeddata', () => resolve(), { once: true })
        }
      })

      if (activeTask === 'interactive-segmentation') {
        // Capture a frame and wait for clicks
        activeTaskHook.detect(video, canvasRef.current)
        setStatus('captured')
        setStatusMessage('Click on the image to segment a region.')
      } else {
        activeTaskHook.detect(video, canvasRef.current)
        setStatus('running')
        setStatusMessage(`${taskMeta.label} running`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setStatus('error')
      setStatusMessage(`Error: ${message}`)
    }
  }, [activeTask, activeTaskHook, camera, stopAll, taskMeta.label])

  const handleTaskChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      stopAll()
      setActiveTask(e.target.value as VisionTaskId)
    },
    [stopAll],
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTask !== 'interactive-segmentation' || status !== 'captured')
        return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      // Account for the scaleX(-1) transform by mirroring X
      const rawX = (e.clientX - rect.left) / rect.width
      const normalizedX = 1 - rawX
      const normalizedY = (e.clientY - rect.top) / rect.height

      interactiveSegmentation.segmentAtPoint(
        canvas,
        normalizedX,
        normalizedY,
      )
      setStatusMessage('Segmented! Click another point or recapture.')
    },
    [activeTask, status, interactiveSegmentation],
  )

  const handleRecapture = useCallback(() => {
    const video = camera.videoRef.current
    if (!video || !canvasRef.current) return
    interactiveSegmentation.captureFrame(video, canvasRef.current)
    setStatusMessage('New frame captured. Click to segment.')
  }, [camera.videoRef, interactiveSegmentation])

  const handleToggleBroadcast = useCallback(() => {
    if (broadcast.isBroadcasting) {
      broadcast.stopBroadcast()
    } else {
      const canvas = canvasRef.current
      if (!canvas) return
      broadcast.startBroadcast(canvas)
    }
  }, [broadcast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const task of Object.values(tasks)) {
        task.cleanup()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isInteractive = activeTask === 'interactive-segmentation'
  const isRunning = status === 'running' || status === 'captured'

  return (
    <div className="mediapipe-app">
      <a href="/" className="back-link">
        ← Back to demos
      </a>
      <h1>MediaPipe Vision</h1>
      <p className="subtitle">
        Real-time AI vision tasks running in the browser via WebAssembly
      </p>

      <div className="controls">
        <select
          value={activeTask}
          onChange={handleTaskChange}
          disabled={isRunning}
          aria-label="Select vision task"
        >
          {VISION_TASKS.map((taskId) => (
            <option key={taskId} value={taskId}>
              {TASK_META[taskId].label}
            </option>
          ))}
        </select>

        {!isRunning ? (
          <button onClick={handleStart} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Start'}
          </button>
        ) : (
          <>
            <button className="stop" onClick={stopAll}>
              Stop
            </button>
            {isInteractive && status === 'captured' && (
              <button className="capture" onClick={handleRecapture}>
                Recapture
              </button>
            )}
          </>
        )}
      </div>

      <p className="task-description">{taskMeta.description}</p>

      {/* Broadcast controls — only visible when a task is running */}
      {isRunning && (
        <div className="broadcast-controls">
          <div className="broadcast-row">
            <label className="broadcast-name-label">
              Name:
              <input
                type="text"
                value={broadcast.displayName}
                onChange={(e) => broadcast.setDisplayName(e.target.value)}
                disabled={broadcast.isBroadcasting}
                className="broadcast-name-input"
                aria-label="Display name for broadcast"
              />
            </label>
            <button
              className={broadcast.isBroadcasting ? 'broadcast-btn active' : 'broadcast-btn'}
              onClick={handleToggleBroadcast}
            >
              {broadcast.isBroadcasting ? '⏹ Stop Broadcast' : '📡 Broadcast'}
            </button>
          </div>
          {broadcast.isBroadcasting && (
            <div className="broadcast-status">
              <span className="live-badge">🔴 EN VIVO</span>
              <span className="broadcast-info">
                Signal: {broadcast.signalingStatus} · Viewers: {broadcast.viewerCount}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="viewport">
        <video
          ref={camera.videoRef}
          playsInline
          muted
          style={{
            display:
              isInteractive && status === 'captured' ? 'none' : 'block',
          }}
        />
        <canvas
          ref={canvasRef}
          className={
            isInteractive && status === 'captured' ? 'interactive' : ''
          }
          onClick={handleCanvasClick}
        />
      </div>

      {isInteractive && status === 'captured' && (
        <p className="interactive-hint">
          👆 Click anywhere on the image to segment that region
        </p>
      )}

      <p
        className={`status-bar ${status === 'error' ? 'error' : ''} ${status === 'loading' ? 'loading' : ''} ${status === 'running' || status === 'captured' ? 'ready' : ''}`}
      >
        {statusMessage}
      </p>
    </div>
  )
}
