import { RealityMode, Wall } from "../types";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  alpha: number;
}

// 函数：生成撞击碎片
export function spawnShatter(
  particles: Particle[],
  wall: Wall,
  side: 'left' | 'right',
  mode: RealityMode,
  canvasW: number,
  canvasH: number,
  wallHeightPct: number,
  hitPieceWidthPct: number
): void {
  const color = mode === RealityMode.NORMAL ? '#06b6d4' : '#ef4444';
  const topPx = (wall.y / 100) * canvasH;
  const heightPx = (wallHeightPct / 100) * canvasH;
  const leftW = wall.gapX - wall.gapWidth / 2;
  const rightW = 100 - (wall.gapX + wall.gapWidth / 2);
  const pieceWidthPx = (hitPieceWidthPct / 100) * canvasW;

  const originX = side === 'left'
    ? Math.max(0, ((leftW - hitPieceWidthPct) / 100) * canvasW) + pieceWidthPx
    : canvasW - Math.max(0, ((rightW - hitPieceWidthPct) / 100) * canvasW) - pieceWidthPx;
  const originY = topPx + heightPx / 2;

  const n = 18;
  for (let i = 0; i < n; i++) {
    const speed = 0.05 * canvasW + Math.random() * 0.05 * canvasW;
    const angle = side === 'left'
      ? (Math.PI * 1.1) + Math.random() * (Math.PI * 0.3)
      : (Math.PI * 1.8) + Math.random() * (Math.PI * 0.3);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed * 0.5;
    particles.push({
      x: originX,
      y: originY,
      vx, vy,
      life: 600,
      size: Math.max(2, pieceWidthPx * 0.35 + Math.random() * 2),
      color,
      alpha: 1
    });
  }
}

/**
 * 生成整条墙体的碎裂
 */
/**
 * 生成整条墙体的碎裂，密度随墙总宽与速度（可由外部控制颜色）变化
 */
/**
 * 生成整条墙体的碎裂，密度可按 densityScale 缩放
 */
export function spawnFullShatter(
  particles: Particle[],
  wall: Wall,
  mode: RealityMode,
  canvasW: number,
  canvasH: number,
  wallHeightPct: number,
  densityScale: number = 1
): void {
  const color = mode === RealityMode.NORMAL ? '#06b6d4' : '#ef4444';
  const topPx = (wall.y / 100) * canvasH;
  const heightPx = (wallHeightPct / 100) * canvasH;
  const leftW = wall.gapX - wall.gapWidth / 2;
  const rightW = 100 - (wall.gapX + wall.gapWidth / 2);
  const totalW = (leftW + rightW) / 100 * canvasW;
  const startLeft = 0;
  const startRight = canvasW - (rightW / 100 * canvasW);
  const base = Math.max(12, Math.floor(totalW / 18));
  const jitter = Math.floor(Math.random() * 6);
  const density = Math.max(6, Math.floor((base + jitter) * densityScale));

  for (let i = 0; i < density; i++) {
    const isLeft = Math.random() < (leftW / (leftW + rightW));
    const xBase = isLeft
      ? startLeft + Math.random() * (leftW / 100 * canvasW)
      : startRight + Math.random() * (rightW / 100 * canvasW);
    const yBase = topPx + Math.random() * heightPx;
    const speed = 0.035 * canvasW + Math.random() * 0.05 * canvasW;
    const angle = isLeft
      ? (Math.PI * 1.05) + Math.random() * (Math.PI * 0.4)
      : (Math.PI * 1.55) + Math.random() * (Math.PI * 0.4);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed * 0.6;
    particles.push({
      x: xBase,
      y: yBase,
      vx, vy,
      life: 800,
      size: 2 + Math.random() * 3,
      color,
      alpha: 1
    });
  }
}

// 函数：更新并绘制碎片
export function updateAndDrawParticles(
  particles: Particle[],
  ctx: CanvasRenderingContext2D,
  dtMs: number
): void {
  const gravity = 0.0016 * ctx.canvas.height;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += gravity * dtMs;
    p.x += p.vx * dtMs;
    p.y += p.vy * dtMs;
    p.life -= dtMs;
    p.alpha = Math.max(0, p.life / 700);
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

export interface Debris {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: string;
  life: number;
  maxLife: number;
}

export function spawnDebrisShatter(
  debrisList: Debris[],
  wall: Wall,
  mode: RealityMode,
  canvasW: number,
  canvasH: number,
  wallHeightPct: number,
  colorOverride?: string
): void {
  const color = colorOverride ?? (mode === RealityMode.NORMAL ? '#06b6d4' : '#ef4444');
  const topPx = (wall.y / 100) * canvasH;
  const heightPx = (wallHeightPct / 100) * canvasH;
  
  const leftW_pct = wall.gapX - wall.gapWidth / 2;
  const rightW_pct = 100 - (wall.gapX + wall.gapWidth / 2);
  
  const leftW_px = (leftW_pct / 100) * canvasW;
  const rightW_px = (rightW_pct / 100) * canvasW;
  
  const rightStart_px = canvasW - rightW_px;

  // Helper to spawn a chunk
  const addChunk = (x: number, w: number) => {
    debrisList.push({
      id: Date.now() + Math.random(),
      x: x + w/2,
      y: topPx + heightPx/2,
      width: w,
      height: heightPx,
      vx: (Math.random() - 0.5) * 0.0008 * canvasW, 
      vy: (Math.random() * 0.0002) * canvasH,
      rotation: 0,
      vr: (Math.random() - 0.5) * 0.008,
      color,
      life: 1500,
      maxLife: 1500
    });
  };

  // Left chunks
  if (leftW_pct > 0) {
      const count = leftW_pct > 25 ? 2 : 1;
      const w = leftW_px / count;
      for (let i = 0; i < count; i++) addChunk(i * w, w);
  }

  // Right chunks
  if (rightW_pct > 0) {
      const count = rightW_pct > 25 ? 2 : 1;
      const w = rightW_px / count;
      for (let i = 0; i < count; i++) addChunk(rightStart_px + i * w, w);
  }
}

export function updateAndDrawDebris(
  debrisList: Debris[],
  ctx: CanvasRenderingContext2D,
  dtMs: number
): void {
  const gravity = 0.000005 * ctx.canvas.height; 
  
  for (let i = debrisList.length - 1; i >= 0; i--) {
    const d = debrisList[i];
    d.vy += gravity * dtMs;
    d.x += d.vx * dtMs;
    d.y += d.vy * dtMs;
    d.rotation += d.vr * dtMs;
    d.life -= dtMs;
    
    if (d.life <= 0 || d.y > ctx.canvas.height + 200) {
      debrisList.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);
    
    // Flash white at start
    if (d.life > d.maxLife - 80) {
         ctx.fillStyle = '#ffffff';
    } else {
         ctx.fillStyle = d.color;
    }
    
    ctx.globalAlpha = Math.min(1, d.life / 300);
    ctx.fillRect(-d.width/2, -d.height/2, d.width, d.height);
    ctx.restore();
  }
}
