import { art, drawPet, drawProp } from "./assets";
import { createWorld, type World } from "./world";
export function paint(
  canvas: HTMLCanvasElement,
  world: World = createWorld(),
  reduced = true,
  hatched = true,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const w = canvas.width,
    h = canvas.height,
    ground = h - 50;
  ctx.fillStyle = world.scenery === "moonlit" ? "#231e3b" : "#1d3036";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = i % 3 ? "#645270" : "#d9bf88";
    ctx.fillRect((i * 73 + 19) % w, (i * 37 + 11) % 90, 2, 2);
  }
  ctx.fillStyle = "#e9d6a6";
  ctx.fillRect(266, 22, 16, 16);
  ctx.fillStyle = "#231e3b";
  ctx.fillRect(262, 19, 14, 14);
  ctx.fillStyle = "#34463f";
  ctx.fillRect(0, ground, w, h - ground);
  for (let x = 0; x < w; x += 32) {
    drawProp(ctx, "grass", x, ground - 2);
    drawProp(ctx, "path", x, ground + 27);
  }
  drawProp(ctx, "rune", 268, ground - 29);
  drawProp(ctx, "mushroom", 8, ground - 28);
  if (world.scenery === "mushrooms") {
    drawProp(ctx, "mushroom", 40, ground - 34);
    drawProp(ctx, "mushroom", 242, ground - 32);
  }
  drawProp(ctx, "nest", 140, ground - 9);
  for (const item of world.items)
    drawProp(
      ctx,
      item.kind === "food" ? "berries" : "toy",
      40 + item.x * 240 - 16,
      ground - 22,
    );
  if (hatched)
    drawPet(
      ctx,
      40 + world.x * 240,
      ground,
      world.animation,
      world.tick,
      reduced,
      world.direction,
    );
  else drawProp(ctx, "egg", 128, ground - 58, 2);
  if (!art.pet) {
    ctx.fillStyle = "#f6f2e7";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Preparing your garden…", w / 2, ground - 30);
  }
}
