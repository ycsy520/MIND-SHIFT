import { RealityMode, Wall } from "../types";

// 函数：确保 Canvas 大小与容器一致（像素级）
export function ensureCanvasSize(canvas: HTMLCanvasElement, wrapper: HTMLElement): void {
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

// 函数：在 Canvas 上绘制所有墙体与缺口
/**
 * 在 Canvas 上绘制所有墙体与缺口
 */
export function drawWallsOnCanvas(
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  mode: RealityMode,
  canvasW: number,
  canvasH: number,
  wallHeightPct: number,
  hitPieceWidthPct: number,
  noShadow?: boolean
): void {
  const isBlue = mode === RealityMode.NORMAL;
  const color = isBlue ? '#06b6d4' : '#ef4444';

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.shadowColor = noShadow ? 'transparent' : (color + '88');
  ctx.shadowBlur = noShadow ? 0 : 10;
  ctx.fillStyle = color;

  for (const w of walls) {
    if (w.hitSide) {
      continue;
    }
    const topPx = (w.y / 100) * canvasH;
    const heightPx = (wallHeightPct / 100) * canvasH;
    const leftW = w.gapX - w.gapWidth / 2;
    const rightW = 100 - (w.gapX + w.gapWidth / 2);

    const leftCut = w.hitSide === 'left' ? Math.max(0, leftW - hitPieceWidthPct) : leftW;
    const rightCut = w.hitSide === 'right' ? Math.max(0, rightW - hitPieceWidthPct) : rightW;

    const leftWidthPx = (leftCut / 100) * canvasW;
    const rightWidthPx = (rightCut / 100) * canvasW;

    if (leftWidthPx > 0.5) {
      ctx.fillRect(0, topPx, leftWidthPx, heightPx);
    }
    if (rightWidthPx > 0.5) {
      ctx.fillRect(canvasW - rightWidthPx, topPx, rightWidthPx, heightPx);
    }
  }
  ctx.restore();
}
