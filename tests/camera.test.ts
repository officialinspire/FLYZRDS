// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  CameraSession,
  clampOverlay,
  localPhoto,
} from "../apps/web/src/camera";

function mockStream() {
  const track = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    getSettings: () => ({ facingMode: "environment" }),
  });
  const stream = Object.assign(new EventTarget(), {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
  });
  return { track, stream: stream as unknown as MediaStream };
}
function fixture() {
  const video = document.createElement("video");
  video.play = vi.fn(async () => {});
  video.pause = vi.fn();
  const { track, stream } = mockStream();
  const getUserMedia = vi.fn(async () => stream),
    notify = vi.fn();
  let visible = true;
  const session = new CameraSession(
    { getUserMedia },
    video,
    () => visible,
    notify,
  );
  return {
    video,
    track,
    stream,
    getUserMedia,
    notify,
    session,
    hide: () => {
      visible = false;
      session.stop();
    },
  };
}
describe("optional rear camera lifecycle", () => {
  it("requests rear video only on start and releases every track on exit/revocation", async () => {
    const f = fixture();
    expect(f.getUserMedia).not.toHaveBeenCalled();
    await f.session.start();
    expect(f.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: false,
        video: expect.objectContaining({
          facingMode: { exact: "environment" },
        }),
      }),
    );
    expect(f.session.active).toBe(true);
    expect(f.video.srcObject).toBe(f.stream);
    f.track.dispatchEvent(new Event("ended"));
    expect(f.track.stop).toHaveBeenCalled();
    expect(f.session.active).toBe(false);
    expect(f.video.srcObject).toBe(null);
    await f.session.start();
    f.hide();
    expect(f.session.active).toBe(false);
  });
  it("releases late camera permission grants after hide or closing", async () => {
    const f = fixture();
    let grant: (s: MediaStream) => void = () => {};
    f.getUserMedia.mockImplementation(
      () =>
        new Promise((resolve) => {
          grant = resolve;
        }),
    );
    const start = f.session.start();
    expect(f.session.pending).toBe(true);
    f.hide();
    grant(f.stream);
    await start;
    expect(f.track.stop).toHaveBeenCalledTimes(1);
    expect(f.session.active).toBe(false);
    expect(f.video.play).not.toHaveBeenCalled();
  });
  it("handles denial, unavailable hardware and playback failure with no retained stream", async () => {
    const f = fixture();
    f.getUserMedia.mockRejectedValue(new Error("NotAllowedError"));
    await f.session.start();
    expect(f.notify).toHaveBeenLastCalledWith(
      expect.stringContaining("garden"),
    );
    expect(f.session.active).toBe(false);
    const unavailable = new CameraSession(
      undefined,
      f.video,
      () => true,
      f.notify,
    );
    await unavailable.start();
    expect(f.notify).toHaveBeenLastCalledWith(
      expect.stringContaining("unavailable"),
    );
    const broken = fixture();
    broken.video.play = vi.fn(async () => {
      throw new Error("Playback blocked");
    });
    await broken.session.start();
    expect(broken.track.stop).toHaveBeenCalled();
    expect(broken.video.srcObject).toBe(null);
  });
  it("rejects an unexpected front camera or audio track and cleans up", async () => {
    const f = fixture();
    f.track.getSettings = () => ({ facingMode: "user" });
    await f.session.start();
    expect(f.track.stop).toHaveBeenCalled();
    expect(f.session.active).toBe(false);
  });
});
it("keeps the whole sprite in bounds in portrait and landscape", () => {
  for (const [w, h] of [
    [640, 480],
    [640, 1138],
    [640, 180],
  ]) {
    for (const [x, y] of [
      [0, 0],
      [1, 1],
      [0.5, 0.8],
    ]) {
      const p = clampOverlay(w, h, { x, y, scale: 3 }, 64, [32, 56]);
      expect(p.x - 32 * p.scale).toBeGreaterThanOrEqual(0);
      expect(p.x + 32 * p.scale).toBeLessThanOrEqual(w);
      expect(p.ground - 56 * p.scale).toBeGreaterThanOrEqual(0);
      expect(p.ground + 8 * p.scale).toBeLessThanOrEqual(h);
    }
  }
});
it("exports a local PNG and handles failed/tainted canvas encoding", async () => {
  const canvas = document.createElement("canvas");
  const blob = new Blob(["synthetic"], { type: "image/png" });
  canvas.toBlob = vi.fn((callback) => callback(blob));
  expect(await localPhoto(canvas)).toBe(blob);
  expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
  canvas.toBlob = vi.fn((callback) => callback(null));
  await expect(localPhoto(canvas)).rejects.toThrow("unavailable");
  canvas.toBlob = vi.fn(() => {
    throw new DOMException("Tainted canvas", "SecurityError");
  });
  await expect(localPhoto(canvas)).rejects.toThrow("same-origin");
});
