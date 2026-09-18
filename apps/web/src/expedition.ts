import { number, object } from "@flyzrds/contracts";

export const EXPEDITION = {
  maxAccuracy: 25,
  maxSpeed: 3,
  maxGapMs: 30000,
  maxAgeMs: 10000,
  goalMeters: 500,
  stationMs: 20000,
  stations: 5,
  maxReward: 5,
  dailyCap: 20,
  inventoryCap: 1000,
} as const;
export interface Journey {
  id: number;
  mode: "walk" | "indoor";
  meters: number;
  stations: number;
  finished: boolean;
}
export interface Exploration {
  journeys: number;
  claimed: number;
  supplies: number;
  day: number;
  earnedToday: number;
  journey: Journey | null;
}
export function freshExploration(): Exploration {
  return {
    journeys: 0,
    claimed: 0,
    supplies: 0,
    day: 0,
    earnedToday: 0,
    journey: null,
  };
}
export function beginJourney(
  e: Exploration,
  mode: Journey["mode"],
): Exploration {
  if (e.journey && !e.journey.finished) return e;
  if (mode !== "walk" && mode !== "indoor")
    throw new Error("Invalid expedition mode");
  const id = number(e.journeys + 1, 1, 1000000, true);
  return {
    ...e,
    journeys: id,
    journey: { id, mode, meters: 0, stations: 0, finished: false },
  };
}
export function pendingSupplies(e: Exploration) {
  const j = e.journey;
  return !j
    ? 0
    : Math.min(
        EXPEDITION.maxReward,
        j.mode === "walk" ? Math.floor(j.meters / 100) : j.stations,
      );
}
export function finishJourney(e: Exploration, now: number): Exploration {
  const j = e.journey;
  if (!j || j.finished || j.id <= e.claimed) return e;
  const day = Math.floor(number(now, 0, Number.MAX_SAFE_INTEGER) / 86400000);
  // Moving a device clock backwards never refreshes the local daily cap.
  const used = day > e.day ? 0 : e.earnedToday;
  const reward = Math.min(
    pendingSupplies(e),
    EXPEDITION.dailyCap - used,
    EXPEDITION.inventoryCap - e.supplies,
  );
  return {
    ...e,
    claimed: j.id,
    day: Math.max(day, e.day),
    earnedToday: used + reward,
    supplies: e.supplies + reward,
    journey: { ...j, finished: true },
  };
}
export function validateExploration(value: unknown): Exploration {
  const e = object(value);
  const journeys = number(e.journeys, 0, 1000000, true);
  const result: Exploration = {
    journeys,
    claimed: number(e.claimed, 0, journeys, true),
    supplies: number(e.supplies, 0, EXPEDITION.inventoryCap, true),
    day: number(e.day, 0, 100000000, true),
    earnedToday: number(e.earnedToday, 0, EXPEDITION.dailyCap, true),
    journey: null,
  };
  if (result.earnedToday > result.supplies)
    throw new Error("Invalid resource totals");
  if (e.journey === null) {
    if (journeys || result.claimed || result.supplies || result.earnedToday)
      throw new Error("Missing expedition history");
    return result;
  }
  const j = object(e.journey);
  if (
    (j.mode !== "walk" && j.mode !== "indoor") ||
    typeof j.finished !== "boolean"
  )
    throw new Error("Invalid expedition");
  result.journey = {
    id: number(j.id, journeys, journeys, true),
    mode: j.mode,
    meters: number(j.meters, 0, EXPEDITION.goalMeters),
    stations: number(j.stations, 0, EXPEDITION.stations, true),
    finished: j.finished,
  };
  if (
    !journeys ||
    result.claimed !== (j.finished ? journeys : journeys - 1) ||
    (j.mode === "walk"
      ? result.journey.stations !== 0
      : result.journey.meters !== 0)
  )
    throw new Error("Inconsistent expedition claim");
  return result;
}
export interface Sample {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}
export function distance(a: Sample, b: Sample) {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad;
  const dlon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dlon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
// Coordinates exist only in this transient filter; they never enter a save or log.
export class DistanceFilter {
  private anchor: Sample | null = null;
  reset() {
    this.anchor = null;
  }
  accept(sample: Sample, now: number): { meters: number; reason: string } {
    const reject = (reason: string, reset = true) => {
      if (reset) this.reset();
      return { meters: 0, reason };
    };
    if (
      ![
        sample.latitude,
        sample.longitude,
        sample.accuracy,
        sample.timestamp,
        now,
      ].every(Number.isFinite) ||
      Math.abs(sample.latitude) > 90 ||
      Math.abs(sample.longitude) > 180 ||
      sample.accuracy < 0
    )
      return reject("Invalid location sample");
    if (sample.accuracy > EXPEDITION.maxAccuracy)
      return reject("Waiting for better GPS accuracy");
    if (
      now - sample.timestamp > EXPEDITION.maxAgeMs ||
      sample.timestamp > now + 2000
    )
      return reject("Stale location sample");
    const a = this.anchor;
    if (!a) {
      this.anchor = { ...sample };
      return { meters: 0, reason: "GPS ready; foreground walking only" };
    }
    const elapsed = sample.timestamp - a.timestamp;
    if (elapsed <= 0) return reject("Out-of-order location sample", false);
    if (elapsed > EXPEDITION.maxGapMs) {
      this.anchor = { ...sample };
      return { meters: 0, reason: "GPS gap; new starting point" };
    }
    const meters = distance(a, sample);
    if (meters / (elapsed / 1000) > EXPEDITION.maxSpeed)
      return reject("Fast travel or GPS jump ignored");
    if (meters < Math.max(6, (a.accuracy + sample.accuracy) / 2))
      return reject("Stationary jitter ignored", false);
    this.anchor = { ...sample };
    return { meters, reason: "Foreground walking distance accepted" };
  }
}

export class ForegroundWatch {
  private id: number | null = null;
  private generation = 0;
  private filter = new DistanceFilter();
  constructor(
    private gps: Geolocation | undefined,
    private onSample: (meters: number, reason: string) => void,
    private onError: () => void,
    private now = Date.now,
  ) {}
  start() {
    this.stop();
    if (!this.gps) {
      this.onError();
      return;
    }
    const generation = this.generation;
    try {
      const id = this.gps.watchPosition(
        (position) => {
          if (generation !== this.generation) return;
          const result = this.filter.accept(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            },
            this.now(),
          );
          this.onSample(result.meters, result.reason);
        },
        () => {
          if (generation === this.generation) {
            this.stop();
            this.onError();
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
      if (generation === this.generation) this.id = id;
      else this.gps.clearWatch(id);
    } catch {
      this.stop();
      this.onError();
    }
  }
  stop() {
    this.generation++;
    if (this.id !== null) this.gps?.clearWatch(this.id);
    this.id = null;
    this.filter.reset();
  }
}
