export function getContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  if (!canvas) return null;
  return canvas.getContext('2d');
}

export type Point = {
  x: number;
  y: number;
}

type DrawLineArgs = {
  ctx: CanvasRenderingContext2D;
  from: Point;
  to: Point;
  width?: number;
  style?: string;
}

export function drawLine({ctx, from, to, width = 1, style = 'black'}: DrawLineArgs) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.lineWidth = width ?? 1;
  ctx.strokeStyle = style;
  ctx.stroke();
}