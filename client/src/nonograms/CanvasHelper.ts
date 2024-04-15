export function getContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas) return null;
  return canvas.getContext('2d');
}

type Point = {
  x: number;
  y: number;
}

type DrawLineArgs = {
  ctx: CanvasRenderingContext2D;
  from: Point;
  to: Point;
  width?: number;
  style?: string;
  dashed?: boolean;
}

export function drawLine({ctx, from, to, width = 1, style = 'black', dashed = false}: DrawLineArgs) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.lineWidth = width ?? 1;
  ctx.strokeStyle = style;
  if (dashed) ctx.setLineDash([3, 3]);
  else ctx.setLineDash([]);

  ctx.stroke();
}

type DrawTextArgs = {
  ctx: CanvasRenderingContext2D;
  text: string;
  position: Point;
  font?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  style?: string;
}

export function drawText({ctx, text, position, font = '16px Arial', align = 'center', baseline = 'top', style = 'black'}: DrawTextArgs) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = style;
  ctx.fillText(text, position.x, position.y);
}