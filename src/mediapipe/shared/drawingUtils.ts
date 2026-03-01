/** Lightweight drawing helpers for MediaPipe task results on a canvas overlay. */

export function clearCanvas(ctx: CanvasRenderingContext2D): void {
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
 * Draw text that reads correctly on a CSS-mirrored canvas.
 *
 * The canvas element uses `transform: scaleX(-1)` so the overlay
 * matches the mirrored selfie-camera video.  Geometry (boxes,
 * landmarks) looks fine mirrored, but text becomes backwards.
 *
 * This helper temporarily un-mirrors the context, draws the text,
 * and restores.  The caller passes the *mirrored* x position
 * (i.e. the position that already looks correct for geometry)
 * and this function maps it to the un-mirrored coordinate.
 */
function drawTextUnmirrored(
  ctx: CanvasRenderingContext2D,
  text: string,
  mirroredX: number,
  y: number,
): void {
  ctx.save()
  ctx.scale(-1, 1)
  ctx.fillText(text, -mirroredX, y)
  ctx.restore()
}

function fillRectUnmirrored(
  ctx: CanvasRenderingContext2D,
  mirroredX: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save()
  ctx.scale(-1, 1)
  ctx.fillRect(-mirroredX - width, y, width, height)
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
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(box.originX, box.originY, box.width, box.height)

  if (label) {
    ctx.font = '14px system-ui, sans-serif'
    const textWidth = ctx.measureText(label).width
    const labelX = box.originX
    const labelY = box.originY - 20

    // Background rect (un-mirrored so it aligns with text)
    ctx.fillStyle = color
    fillRectUnmirrored(ctx, labelX, labelY, textWidth + 8, 20)

    // Label text (un-mirrored so it reads correctly)
    ctx.fillStyle = '#000'
    drawTextUnmirrored(ctx, label, labelX - 4, box.originY - 5)
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

    // Background (un-mirrored)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    fillRectUnmirrored(ctx, x - 2, textY - 16, textWidth + 8, 22)

    // Text (un-mirrored)
    ctx.fillStyle = '#FFFFFF'
    drawTextUnmirrored(ctx, text, x - 2, textY)
  }
}

/**
 * Draw a text label on an un-mirrored canvas (e.g. segmentation legend).
 * Exported for task hooks that draw text directly.
 */
export function drawLegendText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  drawTextUnmirrored(ctx, text, x, y)
}

/**
 * Draw a filled rect on an un-mirrored canvas.
 * Exported for task hooks that draw rects alongside un-mirrored text.
 */
export function drawLegendRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRectUnmirrored(ctx, x, y, width, height)
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
