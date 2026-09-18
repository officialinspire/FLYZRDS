import manifest from "./asset-manifest.json";
import type { Animation } from "./world";

export { manifest };
export type PropKey = keyof typeof manifest.propFrames;
export const art: {
  pet: HTMLImageElement | null;
  props: HTMLImageElement | null;
} = { pet: null, props: null };
function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Garden artwork could not load. Reload to retry."));
    img.src = src;
  });
}
export async function loadArt() {
  const [pet, props] = await Promise.all([
    load(`${import.meta.env.BASE_URL}assets/longneck.png`),
    load(`${import.meta.env.BASE_URL}assets/garden.png`),
  ]);
  art.pet = pet;
  art.props = props;
}
export function frameFor(
  animation: Animation,
  tick: number,
  reduced: boolean,
): number {
  const a = manifest.animations[animation];
  return a.frames[
    reduced ? 0 : Math.floor((tick * 50) / a.frameMs) % a.frames.length
  ];
}
export function drawPet(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  animation: Animation,
  tick: number,
  reduced: boolean,
  direction = 1,
  scale = 2,
) {
  if (!art.pet) return;
  const frame = frameFor(animation, tick, reduced),
    cell = manifest.pet.cell;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(ground));
  ctx.scale(direction < 0 ? -1 : 1, 1);
  ctx.drawImage(
    art.pet,
    (frame % 4) * cell,
    Math.floor(frame / 4) * cell,
    cell,
    cell,
    -manifest.pet.pivot[0] * scale,
    -manifest.pet.pivot[1] * scale,
    cell * scale,
    cell * scale,
  );
  ctx.restore();
}
export function drawProp(
  ctx: CanvasRenderingContext2D,
  key: PropKey,
  x: number,
  y: number,
  scale = 1,
) {
  if (!art.props) return;
  const frame = manifest.propFrames[key];
  ctx.drawImage(
    art.props,
    (frame % 4) * 32,
    Math.floor(frame / 4) * 32,
    32,
    32,
    Math.round(x),
    Math.round(y),
    32 * scale,
    32 * scale,
  );
}
