// 函数：判断玩家与墙体在垂直方向是否重叠（使用范围碰撞）
export function isVerticalOverlap(
  wallTopPct: number, 
  wallHeightPct: number, 
  playerTopPct: number, 
  playerBottomPct: number
): boolean {
  const wallBottom = wallTopPct + wallHeightPct;
  // 两个区间 [wallTop, wallBottom] 和 [playerTop, playerBottom] 是否有交集
  return wallTopPct < playerBottomPct && wallBottom > playerTopPct;
}

// 函数：计算玩家与缺口的横向关系，返回碰撞侧或 null
export function collisionSide(
  playerXPct: number,
  playerSizePct: number,
  gapXPct: number,
  gapWidthPct: number,
  forgivenessPct: number
): 'left' | 'right' | null {
  const pLeft = playerXPct - (playerSizePct / 2);
  const pRight = playerXPct + (playerSizePct / 2);
  const gapLeft = gapXPct - (gapWidthPct / 2);
  const gapRight = gapXPct + (gapWidthPct / 2);

  const collideLeft = pLeft < gapLeft - forgivenessPct;
  const collideRight = pRight > gapRight + forgivenessPct;
  if (collideLeft) return 'left';
  if (collideRight) return 'right';
  return null;
}
