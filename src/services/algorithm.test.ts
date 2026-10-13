import { describe, it, expect } from "vitest";
import { algorithmService, normalizeFeature, transitionCost } from "./algorithm";
import { tracks, defaultSettings } from "@/data/library";
function at<T>(values: T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error("Missing test item");
  return value;
}
describe("MoodMix algorithm service", () => {
  it("has a diverse 60-song library", () => {
    expect(tracks.length).toBe(60);
    expect(new Set(tracks.map((t) => t.title)).size).toBe(60);
  });
  it("computes consistent transitions and metrics", () => {
    const e = algorithmService.evaluate(tracks.slice(10, 16));
    expect(e.totalCost).toBeCloseTo(e.transitions.reduce((s, t) => s + t.cost, 0));
    expect(e.duration).toBe(tracks.slice(10, 16).reduce((s, t) => s + t.duration, 0));
  });
  it("exact algorithms agree and never exceed greedy cost", async () => {
    const b = await algorithmService.compare(tracks.slice(10, 17));
    expect(at(b.results, 1).totalCost).toBeCloseTo(at(b.results, 2).totalCost, 10);
    expect(at(b.results, 1).totalCost).toBeLessThanOrEqual(at(b.results, 0).totalCost + 1e-10);
    for (const r of b.results) {
      expect(at(r.sequence, 0).id).toBe(at(tracks, 10).id);
      expect(new Set(r.sequence.map((t) => t.id)).size).toBe(7);
      expect(r.runtime).toBeGreaterThanOrEqual(0);
    }
  });
  it("uses requested settings and opening track", async () => {
    const p = await algorithmService.generate({
      ...defaultSettings,
      mood: "Chill",
      genres: ["Indie"],
      startingTrack: "track-13",
      duration: 15,
    });
    expect(at(p.tracks, 0).id).toBe("track-13");
    expect(p.tracks.every((t) => t.genre === "Indie")).toBe(true);
    expect(algorithmService.evaluate(p.tracks).duration).toBeLessThanOrEqual(900);
  });
  it("preserves pins at their current positions", async () => {
    const p = await algorithmService.generate(defaultSettings);
    p.pinned = [at(p.tracks, 2).id];
    const next = await algorithmService.generate(defaultSettings, p);
    expect(at(next.tracks, 2).id).toBe(at(p.tracks, 2).id);
  });
  it("rejects invalid durations and conflicting starts", async () => {
    await expect(algorithmService.generate({ ...defaultSettings, duration: 0 })).rejects.toThrow(
      "5 to 120",
    );
    await expect(
      algorithmService.generate({ ...defaultSettings, genres: ["Jazz"], startingTrack: "track-1" }),
    ).rejects.toThrow("outside");
  });
  it("exact path agrees with exhaustive enumeration", async () => {
    const set = tracks.slice(20, 25);
    let minimum = Infinity;
    function visit(path: typeof set, rest: typeof set) {
      if (!rest.length) {
        minimum = Math.min(minimum, algorithmService.evaluate(path).totalCost);
        return;
      }
      rest.forEach((t, i) =>
        visit(
          [...path, t],
          rest.filter((_, j) => j !== i),
        ),
      );
    }
    visit([at(set, 0)], set.slice(1));
    const b = await algorithmService.compare(set);
    expect(at(b.results, 1).totalCost).toBeCloseTo(minimum, 10);
    expect(at(b.results, 2).totalCost).toBeCloseTo(minimum, 10);
  });
  it("normalizes both unit and legacy percent feature inputs", () => {
    expect(normalizeFeature(0.42)).toBe(0.42);
    expect(normalizeFeature(42)).toBe(0.42);
    expect(() => normalizeFeature(-0.1)).toThrow("finite");
    expect(() => normalizeFeature(101)).toThrow("finite");
  });
  it("uses configurable transition weights and applies a same-artist penalty", () => {
    const a = {
        ...at(tracks, 30),
        energy: 0.4,
        valence: 0.4,
        tempo: 100,
        artist: "one",
        genre: "A",
      },
      b = { ...at(tracks, 31), energy: 0.4, valence: 0.4, tempo: 100, artist: "one", genre: "A" };
    const base = transitionCost(a, b, {
      ...defaultSettings,
      transitionWeights: { sameArtist: 0.5 },
    });
    expect(base.cost).toBeCloseTo(0.5);
    expect(transitionCost(a, { ...b, artist: "two" }, defaultSettings).cost).toBe(0);
  });
  it("rejects empty and duplicate comparison inputs", async () => {
    await expect(algorithmService.compare([])).rejects.toThrow("Select at least");
    const duplicate = [at(tracks, 0), { ...at(tracks, 1), id: at(tracks, 0).id }, at(tracks, 2)];
    await expect(algorithmService.compare(duplicate)).rejects.toThrow("Duplicate");
  });
  it("enforces no-consecutive-artist generation constraint", async () => {
    const p = await algorithmService.generate({
      ...defaultSettings,
      mood: "Euphoric",
      duration: 20,
      artistGap: 1,
    });
    for (let i = 1; i < p.tracks.length; i++)
      expect(at(p.tracks, i).artist).not.toBe(at(p.tracks, i - 1).artist);
    expect(algorithmService.evaluate(p.tracks, p.settings).hardConstraintViolations).toEqual([]);
  });
  it("reports exact solver proof metadata and branch-and-bound pruning", async () => {
    const b = await algorithmService.compare(tracks.slice(30, 38));
    const dp = at(b.results, 1),
      bnb = at(b.results, 2);
    expect(dp.optimalityProven).toBe(true);
    expect(bnb.optimalityProven).toBe(true);
    expect(bnb.statesPruned).toBeGreaterThan(0);
    expect(bnb.totalCost).toBeCloseTo(dp.totalCost, 10);
    expect(bnb.constraints).toContain("Fixed start");
  });
});
