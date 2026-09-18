export class CameraSession {
  private stream: MediaStream | null = null;
  private generation = 0;
  pending = false;
  constructor(
    private devices: Pick<MediaDevices, "getUserMedia"> | undefined,
    private video: HTMLVideoElement,
    private allowed: () => boolean,
    private notify: (message: string) => void,
  ) {}
  async start() {
    this.stop();
    if (!this.devices || !this.allowed()) {
      this.notify("Camera unavailable here. Use the garden background.");
      return;
    }
    const generation = this.generation;
    this.pending = true;
    this.notify(
      "Waiting for rear-camera permission. You can cancel and use the garden.",
    );
    let acquired: MediaStream | null = null;
    try {
      acquired = await this.devices.getUserMedia({
        audio: false,
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (generation !== this.generation || !this.allowed()) {
        if (generation === this.generation) this.stop();
        acquired.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      // Never retain an unexpected audio track or a reported front-camera feed.
      if (
        acquired.getAudioTracks().length ||
        !acquired.getVideoTracks().length ||
        acquired
          .getVideoTracks()
          .some((track) => track.getSettings().facingMode === "user")
      )
        throw new Error("Rear camera unavailable");
      this.stream = acquired;
      for (const track of acquired.getTracks())
        track.addEventListener(
          "ended",
          () => {
            if (generation === this.generation) this.fail();
          },
          { once: true },
        );
      acquired.addEventListener(
        "inactive",
        () => {
          if (generation === this.generation) this.fail();
        },
        { once: true },
      );
      this.video.srcObject = acquired;
      await this.video.play();
      if (generation !== this.generation || !this.allowed()) {
        if (generation === this.generation) this.stop();
        acquired.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      this.pending = false;
      this.notify(
        "Rear camera active. Stay stationary; drag your companion or use the sliders.",
      );
    } catch {
      acquired?.getTracks().forEach((track) => {
        track.stop();
      });
      if (generation === this.generation)
        this.fail(
          "Camera permission denied, no rear camera, or playback unavailable. Use the garden background.",
        );
    }
  }
  private fail(
    message = "Camera stopped or permission revoked. Garden background is available.",
  ) {
    this.stop();
    this.notify(message);
  }
  stop() {
    this.generation++;
    this.pending = false;
    const stream = this.stream;
    this.stream = null;
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.video.pause();
    this.video.srcObject = null;
  }
  get active() {
    return this.stream !== null;
  }
}
export interface OverlayPosition {
  x: number;
  y: number;
  scale: number;
}
export function clampOverlay(
  width: number,
  height: number,
  position: OverlayPosition,
  cell: number,
  pivot: readonly number[],
) {
  const scale = Math.min(
    Math.max(0.5, position.scale),
    3,
    width / cell,
    height / cell,
  );
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  return {
    scale,
    x: clamp(
      position.x * width,
      pivot[0] * scale,
      width - (cell - pivot[0]) * scale,
    ),
    ground: clamp(
      position.y * height,
      pivot[1] * scale,
      height - (cell - pivot[1]) * scale,
    ),
  };
}
export function localPhoto(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new Error(
                  "Photo export unavailable. Try the garden background or another browser.",
                ),
              ),
        "image/png",
      );
    } catch {
      reject(
        new Error(
          "Photo export unavailable. Reload same-origin artwork and try the garden background.",
        ),
      );
    }
  });
}
