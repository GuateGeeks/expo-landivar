import { useRef, useCallback } from 'react'
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'
import { clearCanvas, syncCanvasSize } from '../shared/drawingUtils.ts'
import { TASK_META } from '../shared/types.ts'

/** DeepLab v3 category labels (21 Pascal VOC classes). */
const CATEGORY_LABELS = [
  'background', 'aeroplane', 'bicycle', 'bird', 'boat', 'bottle',
  'bus', 'car', 'cat', 'chair', 'cow', 'dining table', 'dog',
  'horse', 'motorbike', 'person', 'potted plant', 'sheep', 'sofa',
  'train', 'tv/monitor',
]

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
]

export function useImageSegmentation() {
  const segmenterRef = useRef<ImageSegmenter | null>(null)
  const rafRef = useRef<number>(0)

  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    )
    segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: TASK_META['image-segmentation'].modelUrl,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    })
  }, [])

  const detect = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !segmenterRef.current) return

      const loop = () => {
        if (!segmenterRef.current || video.paused || video.ended) return
        syncCanvasSize(canvas, video)
        clearCanvas(ctx)

        segmenterRef.current.segmentForVideo(
          video,
          performance.now(),
          (result) => {
            if (!result.categoryMask) return

            const mask = result.categoryMask.getAsUint8Array()
            const width = result.categoryMask.width
            const height = result.categoryMask.height
            const imageData = ctx.createImageData(width, height)

            const detectedCategories = new Set<number>()

            for (let i = 0; i < mask.length; i++) {
              const category = mask[i]
              if (category > 0) detectedCategories.add(category)
              const color = CATEGORY_COLORS[category % CATEGORY_COLORS.length]
              imageData.data[i * 4] = color[0]
              imageData.data[i * 4 + 1] = color[1]
              imageData.data[i * 4 + 2] = color[2]
              imageData.data[i * 4 + 3] = color[3]
            }

            ctx.putImageData(imageData, 0, 0)

            // Show legend for detected categories
            if (detectedCategories.size > 0) {
              const legendY = canvas.height - 30 * detectedCategories.size - 10
              let i = 0
              for (const cat of detectedCategories) {
                const color = CATEGORY_COLORS[cat % CATEGORY_COLORS.length]
                const label = CATEGORY_LABELS[cat] ?? `class ${cat}`
                ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`
                ctx.fillRect(10, legendY + i * 30, 20, 20)
                ctx.fillStyle = '#FFFFFF'
                ctx.font = 'bold 14px system-ui, sans-serif'
                ctx.fillText(label, 36, legendY + i * 30 + 15)
                i++
              }
            }

            result.categoryMask.close()
          },
        )

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    },
    [],
  )

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    segmenterRef.current?.close()
    segmenterRef.current = null
  }, [])

  return { init, detect, cleanup }
}
