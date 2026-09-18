import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { DemoController } from "../apps/web/src/controller";
import { freshProgress } from "../apps/web/src/duel";
import {
  beginJourney,
  DistanceFilter,
  ForegroundWatch,
  finishJourney,
  freshExploration,
  type Sample,
  validateExploration,
} from "../apps/web/src/expedition";
import { type Save, SaveStore } from "../apps/web/src/storage";
import { createWorld } from "../apps/web/src/world";

const at = (meters: number, timestamp: number, accuracy = 3): Sample => ({
  latitude: 0,
  longitude: meters / 111195,
  accuracy,
  timestamp,
});
describe("foreground distance filter", () => {
  it("accepts normal walking but rejects jitter, bad accuracy and invalid timestamps", () => {
    const f = new DistanceFilter();
    expect(f.accept(at(0, 10000), 10000).meters).toBe(0);
    for (let i = 1; i < 6; i++)
      expect(
        f.accept(at(i % 2, 10000 + i * 1000), 10000 + i * 1000).meters,
      ).toBe(0);
    expect(f.accept(at(10, 20000), 20000).meters).toBeCloseTo(10, 1);
    expect(f.accept(at(20, 30000, 60), 30000).meters).toBe(0);
    expect(f.accept(at(30, 40000), 40000).meters).toBe(0);
    expect(f.accept(at(40, 45000), 45000).meters).toBeCloseTo(10, 1);
    expect(f.accept(at(50, 45000), 45000).meters).toBe(0);
    expect(f.accept(at(60, 30000), 50000).meters).toBe(0);
    expect(f.accept(at(60, 60000), 50000).meters).toBe(0);
    expect(
      f.accept({ ...at(0, 50000), latitude: Number.NaN }, 50000).meters,
    ).toBe(0);
  });
  it("does not bridge gaps, fast travel, pauses or poor samples", () => {
    const f = new DistanceFilter();
    f.accept(at(0, 1000), 1000);
    expect(f.accept(at(100, 41000), 41000).meters).toBe(0);
    expect(f.accept(at(1000, 42000), 42000).meters).toBe(0);
    expect(f.accept(at(1010, 47000), 47000).meters).toBe(0);
    expect(f.accept(at(1020, 52000), 52000).meters).toBeCloseTo(10, 1);
    f.reset();
    expect(f.accept(at(1100, 57000), 57000).meters).toBe(0);
  });
});
it("cleans up GPS watches and ignores delayed callbacks after pause or denial", () => {
  let success: PositionCallback = () => {},
    failure: PositionErrorCallback = () => {};
  const clearWatch = vi.fn();
  const gps = {
    watchPosition: vi.fn((s: PositionCallback, e: PositionErrorCallback) => {
      success = s;
      failure = e;
      return 7;
    }),
    clearWatch,
  } as unknown as Geolocation;
  const samples = vi.fn(),
    denied = vi.fn();
  const watch = new ForegroundWatch(gps, samples, denied, () => 1000);
  expect(gps.watchPosition).not.toHaveBeenCalled();
  watch.start();
  watch.stop();
  success({
    coords: { latitude: 0, longitude: 0, accuracy: 3 },
    timestamp: 1000,
  } as GeolocationPosition);
  expect(samples).not.toHaveBeenCalled();
  expect(clearWatch).toHaveBeenCalledWith(7);
  watch.start();
  failure({ code: 1 } as GeolocationPositionError);
  expect(denied).toHaveBeenCalledTimes(1);
  watch.stop();
  new ForegroundWatch(undefined, samples, denied).start();
  expect(denied).toHaveBeenCalledTimes(2);
});
it("caps claims, supports equivalent indoor rewards and prevents repeat/reload claims", async () => {
  let e = freshExploration();
  for (let i = 0; i < 6; i++) {
    e = beginJourney(e, i % 2 ? "indoor" : "walk");
    if (!e.journey) throw new Error("Missing journey");
    if (e.journey.mode === "walk") e.journey.meters = 500;
    else e.journey.stations = 5;
    e = finishJourney(e, 86400000);
  }
  expect(e.supplies).toBe(20);
  expect(finishJourney(e, 86400000)).toEqual(e);
  e = beginJourney(e, "indoor");
  if (!e.journey) throw new Error("Missing journey");
  e.journey.stations = 5;
  expect(finishJourney(e, 0).supplies).toBe(20);
  e = finishJourney(e, 172800000);
  expect(e.supplies).toBe(25);
  const store = new SaveStore(new IDBFactory());
  const save: Save = {
    version: 4,
    exploration: e,
    progress: freshProgress(),
    pet: { id: "quest", name: "Fern", hatched: true },
    world: createWorld(),
    controller: new DemoController().checkpoint(),
    settings: { reducedMotion: false, sound: false },
    cloud: null,
  };
  await store.write(save);
  const loaded = await store.load();
  if (!loaded) throw new Error("Missing save");
  expect(finishJourney(loaded.exploration, 172800000)).toEqual(e);
  expect(JSON.stringify(loaded)).not.toMatch(
    /latitude|longitude|accuracy|timestamp/,
  );
  expect(() => validateExploration({ ...e, claimed: 0 })).toThrow();
  expect(() => validateExploration({ ...e, supplies: Infinity })).toThrow();
  e.supplies = 999;
  e = beginJourney(e, "indoor");
  if (e.journey) e.journey.stations = 5;
  expect(finishJourney(e, 259200000).supplies).toBe(1000);
});
