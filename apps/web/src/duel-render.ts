import { drawPet, drawProp } from "./assets";
import { level, type Progress } from "./duel";

export function paintDuel(
  canvas: HTMLCanvasElement,
  progress: Progress,
  reduced: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#211d38";
  ctx.fillRect(0, 0, 320, 150);
  const accent = ["#80cdb5", "#e2ad66", "#69daed", "#b494dc", "#f2d078"][
    level(progress.xp) - 1
  ];
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 314, 144);
  for (let i = 1; i < level(progress.xp); i++)
    drawProp(ctx, "star", 40 + i * 42, 12);
  const m = progress.duel;
  const last = m?.trace.at(-1);
  const record = last
    ? (() => {
        try {
          return JSON.parse(last);
        } catch {
          return null;
        }
      })()
    : null;
  for (const [x, direction, side] of [
    [82, 1, "player"],
    [238, -1, "opponent"],
  ] as const) {
    const spell = record?.rules?.[side];
    drawPet(
      ctx,
      x,
      135,
      spell === "Ward" ? "ward" : spell === "Spark" ? "cast" : "idle",
      (m?.round ?? 0) * 5,
      reduced,
      direction,
      1,
    );
    if (spell === "Bloom") drawProp(ctx, "bloom", x - 16, 60);
    if (spell === "Spark") drawProp(ctx, "spark", x - 16, 55);
    ctx.fillStyle = accent;
    ctx.fillRect(x - 23, 140, 46, 2);
  }
}
