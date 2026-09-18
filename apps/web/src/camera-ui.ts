import { art, drawPet, drawProp, manifest } from "./assets";
import {
  CameraSession,
  clampOverlay,
  localPhoto,
  type OverlayPosition,
} from "./camera";
import type { ActivityHost } from "./expedition-ui";
export function setupCamera(host: ActivityHost) {
  const get = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const dialog = get<HTMLDialogElement>("camera-dialog"),
    video = get<HTMLVideoElement>("camera-video"),
    canvas = get<HTMLCanvasElement>("camera-canvas");
  const position: OverlayPosition = { x: 0.5, y: 0.8, scale: 2 };
  let feedback =
    "Choose the garden background or enable the rear camera while stationary.";
  let photoUrl: string | null = null,
    exporting = false,
    generation = 0;
  const session = new CameraSession(
    navigator.mediaDevices,
    video,
    () => dialog.open && !document.hidden && window.isSecureContext,
    (message) => {
      feedback = message;
      update();
    },
  );
  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
    get("camera-photo").hidden = true;
    get<HTMLImageElement>("camera-photo-preview").removeAttribute("src");
    get<HTMLAnchorElement>("camera-download").removeAttribute("href");
  }
  function stop(
    reason = "Camera stopped. Use the garden background or enable it again explicitly.",
  ) {
    generation++;
    exporting = false;
    session.stop();
    clearPhoto();
    feedback = reason;
    update();
  }
  function update() {
    get<HTMLButtonElement>("camera-open").disabled =
      !host.getSave()?.pet.hatched || host.busy();
    get<HTMLButtonElement>("camera-enable").disabled =
      session.pending || session.active || document.hidden || !dialog.open;
    get<HTMLButtonElement>("camera-export").disabled =
      exporting ||
      !art.pet ||
      document.hidden ||
      !dialog.open ||
      (session.active && video.readyState < 2);
    get("camera-status").textContent = feedback;
  }
  function render(now: number) {
    if (!dialog.open || document.hidden) return;
    update();
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      stop("Preview unavailable in this browser. Camera stopped.");
      return;
    }
    const live =
      session.active &&
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;
    const width = 640,
      height = live
        ? Math.max(
            180,
            Math.min(
              1280,
              Math.round((width * video.videoHeight) / video.videoWidth),
            ),
          )
        : 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#141a2b";
    ctx.fillRect(0, 0, width, height);
    try {
      if (live) {
        // Contain the full unmirrored camera frame, using the identical export canvas.
        const factor = Math.min(
          width / video.videoWidth,
          height / video.videoHeight,
        );
        const w = video.videoWidth * factor,
          h = video.videoHeight * factor;
        ctx.drawImage(video, (width - w) / 2, (height - h) / 2, w, h);
      } else {
        ctx.fillStyle = "#244740";
        ctx.fillRect(0, height * 0.65, width, height * 0.35);
        for (let x = 0; x < width; x += 64)
          drawProp(ctx, "grass", x, height - 64, 2);
        drawProp(ctx, "mushroom", 40, height - 110, 2);
        drawProp(ctx, "mushroom", width - 100, height - 110, 2);
      }
      const placed = clampOverlay(
        width,
        height,
        position,
        manifest.pet.cell,
        manifest.pet.pivot,
      );
      drawPet(
        ctx,
        placed.x,
        placed.ground,
        "idle",
        Math.floor(now / 50),
        host.getSave().settings.reducedMotion,
        1,
        placed.scale,
      );
    } catch {
      stop(
        "Camera or preview error. Camera stopped; use the garden background.",
      );
    }
  }
  function sliders() {
    get<HTMLInputElement>("camera-x").value = String(
      Math.round(position.x * 100),
    );
    get<HTMLInputElement>("camera-y").value = String(
      Math.round(position.y * 100),
    );
    get<HTMLInputElement>("camera-scale").value = String(position.scale);
  }
  for (const axis of ["x", "y", "scale"] as const)
    get<HTMLInputElement>(`camera-${axis}`).oninput = (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      if (!Number.isFinite(value)) return;
      position[axis] =
        axis === "scale"
          ? Math.max(0.5, Math.min(3, value))
          : Math.max(0, Math.min(1, value / 100));
    };
  let dragging = false;
  const move = (e: PointerEvent) => {
    if (!dialog.open || !dragging) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const factor = Math.min(r.width / canvas.width, r.height / canvas.height);
    const w = canvas.width * factor,
      h = canvas.height * factor;
    const left = r.left + (r.width - w) / 2,
      top = r.top + (r.height - h) / 2;
    position.x = Math.max(0, Math.min(1, (e.clientX - left) / w));
    position.y = Math.max(0, Math.min(1, (e.clientY - top) / h));
    sliders();
  };
  canvas.onpointerdown = (e) => {
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    move(e);
  };
  canvas.onpointermove = move;
  canvas.onpointerup = canvas.onpointercancel = () => {
    dragging = false;
  };
  get("camera-open").onclick = () => {
    if (!host.getSave().pet.hatched || host.busy()) return;
    dialog.showModal();
    feedback =
      "Garden preview ready. Enable the rear camera only while stationary.";
    host.sync();
    update();
  };
  get("camera-enable").onclick = () => {
    if (!dialog.open || document.hidden || session.pending || session.active)
      return;
    clearPhoto();
    if (!window.isSecureContext) {
      feedback =
        "Camera requires HTTPS or localhost. Garden preview is available.";
      update();
      return;
    }
    void session.start();
  };
  get("camera-garden").onclick = () =>
    stop("Garden background selected. Camera is off.");
  get("camera-close").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    dragging = false;
    stop();
    host.sync();
  });
  video.addEventListener("error", () =>
    stop("Camera playback error. Camera stopped; use the garden."),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden)
      stop(
        "Page hidden: camera stopped and photo preview cleared. Enable again explicitly.",
      );
  });
  window.addEventListener("pagehide", () => stop());
  get("camera-export").onclick = async () => {
    if (
      !dialog.open ||
      document.hidden ||
      exporting ||
      !art.pet ||
      (session.active && video.readyState < 2)
    )
      return;
    clearPhoto();
    exporting = true;
    const request = generation;
    update();
    render(performance.now());
    // Freeze a transient copy so an async encoder cannot capture a later frame.
    const photo = document.createElement("canvas");
    photo.width = canvas.width;
    photo.height = canvas.height;
    try {
      const ctx = photo.getContext("2d");
      if (!ctx)
        throw new Error("Photo composition unavailable in this browser.");
      ctx.drawImage(canvas, 0, 0);
      const blob = await localPhoto(photo);
      if (request !== generation || !dialog.open || document.hidden) return;
      photoUrl = URL.createObjectURL(blob);
      get<HTMLImageElement>("camera-photo-preview").src = photoUrl;
      get<HTMLAnchorElement>("camera-download").href = photoUrl;
      get("camera-photo").hidden = false;
      feedback =
        "Photo composed locally. Choose Download PNG, or open the photo and use your browser's save/share controls. Nothing is uploaded.";
    } catch (error) {
      if (request === generation) {
        session.stop();
        feedback =
          error instanceof Error
            ? error.message
            : "Export unavailable. Camera stopped; try the garden background.";
      }
    } finally {
      if (request === generation) {
        exporting = false;
        update();
      }
    }
  };
  sliders();
  return { update, render, stop };
}
