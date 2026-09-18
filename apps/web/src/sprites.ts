import "./style.css";
import {
  art,
  drawPet,
  drawProp,
  loadArt,
  manifest,
  type PropKey,
} from "./assets";
import type { Animation } from "./world";

const scale = document.getElementById("sprite-scale") as HTMLSelectElement;
const animate = document.getElementById("animate") as HTMLInputElement;
const previews: Array<{
  canvas: HTMLCanvasElement;
  draw: (ctx: CanvasRenderingContext2D, tick: number) => void;
}> = [];
function card(
  parent: string,
  label: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, tick: number) => void,
) {
  const figure = document.createElement("figure"),
    canvas = document.createElement("canvas"),
    caption = document.createElement("figcaption");
  canvas.width = size;
  canvas.height = size;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  caption.textContent = label;
  figure.append(canvas, caption);
  document.getElementById(parent)?.append(figure);
  previews.push({ canvas, draw });
}
void loadArt()
  .then(() => {
    for (const key of Object.keys(manifest.animations) as Animation[])
      card("animations", key, 64, (ctx, tick) =>
        drawPet(ctx, 32, 60, key, tick, !animate.checked, 1, 1),
      );
    for (let i = 0; i < 16; i++)
      card("frames", `Frame ${i}`, 64, (ctx) => {
        if (art.pet)
          ctx.drawImage(
            art.pet,
            (i % 4) * 64,
            Math.floor(i / 4) * 64,
            64,
            64,
            0,
            0,
            64,
            64,
          );
      });
    for (const key of Object.keys(manifest.propFrames) as PropKey[])
      card("props", key, 32, (ctx) => drawProp(ctx, key, 0, 0));
    const status = document.getElementById("art-status");
    if (status)
      status.textContent =
        "16 pet frames • 8 animations • 16 garden sprites • 64px ground-aligned pet cells";
    render(0);
  })
  .catch((error) => {
    const status = document.getElementById("art-status");
    if (status) status.textContent = String(error);
  });
function render(time: number) {
  for (const { canvas, draw } of previews) {
    const s = Number(scale.value);
    canvas.style.width = `${canvas.width * s}px`;
    canvas.style.height = `${canvas.height * s}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    draw(ctx, Math.floor(time / 50));
  }
  requestAnimationFrame(render);
}
