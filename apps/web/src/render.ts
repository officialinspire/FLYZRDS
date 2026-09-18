/** Original code-native placeholder art. Phase 04 replaces with an approved atlas. */
export function paint(
  canvas: HTMLCanvasElement,
  x = 0.5,
  tick = 0,
  reduced = false,
  direction = 1,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const w = canvas.width,
    h = canvas.height;
  const box = (
    color: string,
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(bx), Math.round(by), bw, bh);
  };
  box("#231e3b", 0, 0, w, h);
  box("#2c2549", 0, 70, w, h - 70);
  for (let i = 0; i < 22; i++) {
    const sx = (i * 73 + 19) % w,
      sy = (i * 37 + 11) % 100;
    box(i % 3 ? "#645270" : "#d9bf88", sx, sy, 2, 2);
  }
  box("#e9d6a6", 262, 22, 16, 16);
  box("#231e3b", 258, 19, 14, 14);
  for (let i = 0; i < 8; i++) {
    const xx = i * 48 - 10;
    box("#343451", xx, 104, 35, h - 104);
    box("#343451", xx + 7, 95, 20, 10);
  }
  box("#34463f", 0, h - 49, w, 49);
  box("#526149", 0, h - 49, w, 5);
  for (let i = 0; i < 38; i++)
    box(
      i % 2 ? "#657250" : "#293c38",
      (i * 47) % w,
      h - 40 + ((i * 13) % 30),
      3,
      3,
    );
  // Rune stones and tiny toadstools.
  for (const [mx, my] of [
    [35, h - 55],
    [280, h - 60],
    [68, h - 38],
  ]) {
    box("#b6a9b1", mx, my, 3, 13);
    box("#a575bb", mx - 5, my - 3, 13, 5);
    box("#dec6df", mx - 2, my - 3, 3, 2);
  }
  box("#6e647a", 244, h - 55, 12, 18);
  box("#b7dcbe", 249, h - 51, 2, 8);
  const px = Math.round(x * 220 + 30),
    py = h - 60;
  const bob = reduced ? 0 : Math.floor(tick / 10) % 2;
  ctx.save();
  ctx.translate(px, py + bob);
  ctx.scale(direction < 0 ? -1 : 1, 1);
  const p = (color: string, bx: number, by: number, bw: number, bh: number) =>
    box(color, bx, by, bw, bh);
  p("#132c30", -21, -17, 42, 28);
  p("#80c9ad", -19, -15, 36, 22);
  p("#a6e4bb", -14, -13, 25, 19);
  p("#80c9ad", -28, -13, 12, 7);
  p("#80c9ad", -33, -17, 7, 6);
  p("#80c9ad", 5, -35, 14, 33);
  p("#a6e4bb", 8, -34, 9, 31);
  p("#162e34", 1, -52, 29, 23);
  p("#a6e4bb", 3, -50, 25, 19);
  p("#c9edc5", 17, -39, 12, 7);
  p("#162839", 21, -46, 4, 5);
  p("#fff0cf", 22, -46, 1, 2);
  p("#dbb19c", 25, -39, 3, 2);
  p("#182e31", -14, 4, 9, 9);
  p("#182e31", 7, 4, 9, 9);
  p("#80c9ad", -12, 4, 6, 7);
  p("#80c9ad", 9, 4, 5, 7);
  p("#6f5598", 0, -29, 10, 28);
  p("#9574b6", 1, -27, 4, 23);
  p("#e9c47c", 9, -28, 5, 4);
  // Oversized crooked wizard hat.
  p("#161b2c", -3, -55, 36, 6);
  p("#8464ad", 0, -55, 30, 4);
  p("#70528e", 5, -64, 20, 10);
  p("#8464ad", 9, -73, 13, 10);
  p("#9579b7", 13, -79, 14, 7);
  p("#9579b7", 23, -77, 8, 4);
  p("#e9c47c", 6, -58, 19, 3);
  p("#e9c47c", 33, -18, 3, 30);
  p("#a8e6d1", 30, -24, 9, 9);
  p("#e8f5d5", 33, -27, 3, 15);
  ctx.restore();
}
