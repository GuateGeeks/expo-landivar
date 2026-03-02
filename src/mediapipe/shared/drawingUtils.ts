/** Lightweight drawing helpers for MediaPipe task results on a canvas overlay. */

export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  // Reset any lingering transform (e.g. the mirror set by drawVideoFrame)
  // so clearRect covers the full canvas and the next frame starts clean.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

export function syncCanvasSize(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): void {
  if (
    canvas.width !== video.videoWidth ||
    canvas.height !== video.videoHeight
  ) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }
}

/**
 * Draw the current video frame onto the canvas (mirrored for selfie view)
 * and set a persistent mirror transform so all subsequent overlay drawing
 * aligns with the mirrored video.
 *
 * Previously the canvas used CSS `scaleX(-1)` to mirror, but that meant
 * `captureStream()` captured un-mirrored pixels — the Control Center saw
 * raw canvas content without the CSS transform. By mirroring in canvas
 * drawing code instead, `captureStream()` captures exactly what the user sees.
 *
 * After this call the context has `translate(w, 0) + scale(-1, 1)` active,
 * so all coordinate-based drawing (landmarks, boxes) is automatically mirrored.
 * Text helpers temporarily reset to identity to draw readable text.
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height

  // Mirror transform: flip horizontally around canvas center
  ctx.save()
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, w, h)
  ctx.restore()

  // Set persistent mirror transform for all subsequent overlay drawing.
  // This ensures landmarks, boxes, etc. align with the mirrored video.
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
}

/**
 * Draw readable text at a specific pixel position.
 *
 * Temporarily resets the transform to identity so text is not affected
 * by the mirror transform set by drawVideoFrame.
 *
 * @param pixelX  The pixel x position (0 = left edge of canvas).
 * @param pixelY  The pixel y position.
 */
function drawTextAtPixel(
  ctx: CanvasRenderingContext2D,
  text: string,
  pixelX: number,
  pixelY: number,
): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillText(text, pixelX, pixelY)
  ctx.restore()
}

/**
 * Draw a filled rect at a specific pixel position.
 *
 * Temporarily resets the transform to identity so the rect is not affected
 * by the mirror transform.
 */
function fillRectAtPixel(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  width: number,
  height: number,
): void {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillRect(pixelX, pixelY, width, height)
  ctx.restore()
}

export interface BoundingBox {
  originX: number
  originY: number
  width: number
  height: number
}

export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  label?: string,
  color = '#00FF00',
): void {
  // strokeRect runs through the mirror transform — box aligns with mirrored video
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(box.originX, box.originY, box.width, box.height)

  if (label) {
    ctx.font = '14px system-ui, sans-serif'
    const textWidth = ctx.measureText(label).width
    const w = ctx.canvas.width

    // Convert box origin from mirrored coords to pixel coords.
    // Mirror transform maps coord x -> pixel (w - x).
    // The box visual left edge in pixels = w - originX - box.width
    const pixelLeft = w - box.originX - box.width

    // Background rect
    ctx.fillStyle = color
    fillRectAtPixel(ctx, pixelLeft, box.originY - 20, textWidth + 8, 20)

    // Label text
    ctx.fillStyle = '#000'
    drawTextAtPixel(ctx, label, pixelLeft + 4, box.originY - 5)
  }
}

export interface Point {
  x: number
  y: number
}

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Point[],
  color = '#FF0000',
  radius = 2,
): void {
  ctx.fillStyle = color
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(
      point.x * ctx.canvas.width,
      point.y * ctx.canvas.height,
      radius,
      0,
      2 * Math.PI,
    )
    ctx.fill()
  }
}

export function drawConnectors(
  ctx: CanvasRenderingContext2D,
  landmarks: Point[],
  connections: [number, number][],
  color = '#00FF00',
  lineWidth = 2,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  for (const [startIdx, endIdx] of connections) {
    const start = landmarks[startIdx]
    const end = landmarks[endIdx]
    if (!start || !end) continue
    ctx.beginPath()
    ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height)
    ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height)
    ctx.stroke()
  }
}

export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x = 10,
  y = 30,
): void {
  ctx.font = 'bold 16px system-ui, sans-serif'
  const lineHeight = 22
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]
    const textWidth = ctx.measureText(text).width
    const textY = y + i * lineHeight

    // Background (pinned to visual left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    fillRectAtPixel(ctx, x - 2, textY - 16, textWidth + 8, 22)

    // Text (pinned to visual left)
    ctx.fillStyle = '#FFFFFF'
    drawTextAtPixel(ctx, text, x + 2, textY)
  }
}

/**
 * Draw a text label at a pixel position.
 * @param x  Pixel x position (0 = left edge of canvas).
 */
export function drawLegendText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  drawTextAtPixel(ctx, text, x, y)
}

/**
 * Draw a filled rect at a pixel position.
 * @param x  Pixel x position (0 = left edge of canvas).
 */
export function drawLegendRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRectAtPixel(ctx, x, y, width, height)
}

export function drawSegmentationMask(
  ctx: CanvasRenderingContext2D,
  mask: Float32Array | Uint8Array,
  width: number,
  height: number,
  colorMap: [number, number, number, number][] = CATEGORY_COLORS,
): void {
  const imageData = ctx.createImageData(width, height)
  for (let i = 0; i < mask.length; i++) {
    const category = Math.round(mask[i])
    const color = colorMap[category % colorMap.length]
    imageData.data[i * 4] = color[0]
    imageData.data[i * 4 + 1] = color[1]
    imageData.data[i * 4 + 2] = color[2]
    imageData.data[i * 4 + 3] = color[3]
  }
  ctx.putImageData(imageData, 0, 0)
}

export function drawConfidenceMask(
  ctx: CanvasRenderingContext2D,
  mask: Float32Array,
  width: number,
  height: number,
  color: [number, number, number] = [255, 0, 255],
): void {
  const imageData = ctx.createImageData(width, height)
  for (let i = 0; i < mask.length; i++) {
    const confidence = mask[i]
    imageData.data[i * 4] = color[0]
    imageData.data[i * 4 + 1] = color[1]
    imageData.data[i * 4 + 2] = color[2]
    imageData.data[i * 4 + 3] = Math.round(confidence * 180)
  }
  ctx.putImageData(imageData, 0, 0)
}

/** Default category colors for segmentation (21 categories for DeepLab v3). */
const CATEGORY_COLORS: [number, number, number, number][] = [
  [0, 0, 0, 0],         // background (transparent)
  [128, 0, 0, 160],     // aeroplane
  [0, 128, 0, 160],     // bicycle
  [128, 128, 0, 160],   // bird
  [0, 0, 128, 160],     // boat
  [128, 0, 128, 160],   // bottle
  [0, 128, 128, 160],   // bus
  [128, 128, 128, 160], // car
  [64, 0, 0, 160],      // cat
  [192, 0, 0, 160],     // chair
  [64, 128, 0, 160],    // cow
  [192, 128, 0, 160],   // dining table
  [64, 0, 128, 160],    // dog
  [192, 0, 128, 160],   // horse
  [64, 128, 128, 160],  // motorbike
  [192, 128, 128, 160], // person
  [0, 64, 0, 160],      // potted plant
  [128, 64, 0, 160],    // sheep
  [0, 192, 0, 160],     // sofa
  [128, 192, 0, 160],   // train
  [0, 64, 128, 160],    // tv/monitor
]
