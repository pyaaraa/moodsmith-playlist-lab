import { defaultSettings, tracks } from "@/data/library";
import type {
  Algorithm,
  AlgorithmResult,
  AlgorithmService,
  Playlist,
  PlaylistSettings,
  Track,
  Transition,
  TransitionWeights,
} from "@/types/music";

/** Real identities; illustrative synthetic feature metadata. This module has no React dependency. */
export const algorithms: Algorithm[] = ["Greedy", "Dynamic Programming", "Branch and Bound"];
export const defaultTransitionWeights: TransitionWeights = {
  energy: 0.3,
  valence: 0.2,
  tempo: 0.3,
  genreMismatch: 0.12,
  sameArtist: 0.08,
};
const EXACT_LIMIT = 10;
const BNB_TIME_LIMIT_MS = 1_500;
const descriptions = {
  Greedy: {
    summary:
      "Choose the lowest-cost feasible next track. This is a fast heuristic, not a global optimum.",
    complexity: "O(n²)",
    space: "O(n)",
    guarantee: "Heuristic; no global optimality guarantee.",
  },
  "Dynamic Programming": {
    summary:
      "Held–Karp finds a minimum-cost fixed-start Hamiltonian path over the selected candidate set.",
    complexity: "O(n² · 2ⁿ)",
    space: "O(n · 2ⁿ)",
    guarantee:
      "Optimal for the fixed candidate set, fixed start, and encoded artist/pin constraints.",
  },
  "Branch and Bound": {
    summary:
      "Depth-first exact search uses an admissible lower bound and a greedy incumbent to prune paths.",
    complexity: "O(n!) worst case",
    space: "O(n)",
    guarantee:
      "Optimal when the search completes; explicitly incomplete if the time limit is reached.",
  },
} as const;
type FixedPositions = Map<number, string>;
type PathResult = { path: number[]; cost: number; complete: boolean };

/** Normalizes unit features (0..1) and legacy UI/library percent values (0..100). */
export function normalizeFeature(value: number, name = "feature"): number {
  if (!Number.isFinite(value) || value < 0 || value > 100)
    throw new Error(`${name} must be a finite value from 0 to 1 (or legacy 0 to 100).`);
  return value > 1 ? value / 100 : value;
}
function feature(track: Track, key: "energy" | "valence"): number {
  return normalizeFeature(track[key], `${track.title} ${key}`);
}
function target(value: number, name: string): number {
  return normalizeFeature(value, name);
}
function assertTrack(track: Track): void {
  if (!track.id || !track.title || !track.artist || !track.genre)
    throw new Error("Every track needs an ID, title, artist, and genre.");
  if (!Number.isFinite(track.duration) || track.duration <= 0)
    throw new Error(`${track.id} has an invalid duration.`);
  if (!Number.isFinite(track.tempo) || track.tempo <= 0)
    throw new Error(`${track.id} has an invalid tempo.`);
  feature(track, "energy");
  feature(track, "valence");
}
function assertInput(input: Track[]): void {
  if (!input.length) throw new Error("Select at least one track.");
  const ids = new Set<string>();
  for (const track of input) {
    assertTrack(track);
    if (ids.has(track.id)) throw new Error(`Duplicate track ID: ${track.id}.`);
    ids.add(track.id);
  }
}
function weights(settings: PlaylistSettings): TransitionWeights {
  const merged = { ...defaultTransitionWeights, ...settings.transitionWeights };
  for (const [name, value] of Object.entries(merged))
    if (!Number.isFinite(value) || value < 0)
      throw new Error(`Transition weight ${name} must be non-negative.`);
  return merged;
}

/** Shared directed transition objective: normalized energy, valence, tempo, genre and same-artist terms. */
export function transitionCost(
  from: Track,
  to: Track,
  settings: PlaylistSettings = defaultSettings,
): Transition {
  assertTrack(from);
  assertTrack(to);
  const w = weights(settings);
  const energyDifference = Math.abs(feature(from, "energy") - feature(to, "energy"));
  const valenceDifference = Math.abs(feature(from, "valence") - feature(to, "valence"));
  const tempoDifference = Math.min(Math.abs(from.tempo - to.tempo) / 100, 1);
  const cost =
    w.energy * energyDifference +
    w.valence * valenceDifference +
    w.tempo * tempoDifference +
    (from.genre === to.genre ? 0 : w.genreMismatch) +
    (from.artist === to.artist ? w.sameArtist : 0);
  return {
    from: from.id,
    to: to.id,
    cost,
    explanation: `${Math.round(Math.abs(from.tempo - to.tempo))} BPM tempo difference · ${Math.round(energyDifference * 100)} energy points · ${Math.round(valenceDifference * 100)} valence points. ${from.genre === to.genre ? `Shared ${from.genre} texture.` : `${from.genre} → ${to.genre} genre change.`}${from.artist === to.artist ? " Same-artist penalty applied." : ""} ${cost < 0.2 ? "A gentle transition." : "A more noticeable shift."}`,
  };
}
export function evaluatePlaylist(list: Track[], settings: PlaylistSettings = defaultSettings) {
  assertInput(list);
  const transitions = list
    .slice(1)
    .map((track, index) => transitionCost(list[index]!, track, settings));
  const totalCost = transitions.reduce((sum, item) => sum + item.cost, 0);
  const duration = list.reduce((sum, track) => sum + track.duration, 0);
  const averageEnergy =
    list.reduce((sum, track) => sum + feature(track, "energy"), 0) / list.length;
  const averageValence =
    list.reduce((sum, track) => sum + feature(track, "valence"), 0) / list.length;
  const repeats =
    settings.artistGap > 0
      ? list
          .slice(1)
          .filter((track, index) => track.artist === list[index]!.artist)
          .map((track) => track.id)
      : [];
  return {
    duration,
    averageEnergy,
    averageValence,
    smoothness: transitions.length ? Math.max(0, 100 * (1 - totalCost / transitions.length)) : 100,
    uniqueArtists: new Set(list.map((track) => track.artist)).size,
    totalCost,
    transitions,
    abruptTransitions: transitions.filter((item) => item.cost > 0.45),
    hardConstraintViolations: repeats.length
      ? [`Consecutive artist repeats: ${repeats.join(", ")}`]
      : [],
  };
}
function makeMatrix(
  input: Track[],
  settings: PlaylistSettings,
  count: { value: number },
): number[][] {
  return input.map((from, i) =>
    input.map((to, j) => {
      if (i === j) return Infinity;
      count.value++;
      return settings.artistGap > 0 && from.artist === to.artist
        ? Infinity
        : transitionCost(from, to, settings).cost;
    }),
  );
}
function allowedAt(
  input: Track[],
  fixed: FixedPositions,
  position: number,
  index: number,
): boolean {
  const required = fixed.get(position);
  if (required && input[index]?.id !== required) return false;
  for (const [p, id] of fixed) if (p !== position && input[index]?.id === id) return false;
  return true;
}
function objective(cost: number, n: number): number {
  return Math.max(0, 100 * (1 - cost / Math.max(1, n - 1)));
}
function greedyPath(
  input: Track[],
  edge: (a: number, b: number) => number,
  fixed: FixedPositions,
  states: { value: number },
): PathResult {
  const visit = (path: number[], used: Set<number>, cost: number): PathResult | null => {
    if (path.length === input.length) return { path, cost, complete: true };
    const last = path[path.length - 1]!;
    const candidates = input
      .map((_, index) => index)
      .filter(
        (index) =>
          !used.has(index) &&
          allowedAt(input, fixed, path.length, index) &&
          Number.isFinite(edge(last, index)),
      )
      .sort((a, b) => edge(last, a) - edge(last, b));
    for (const next of candidates) {
      states.value++;
      const result = visit([...path, next], new Set([...used, next]), cost + edge(last, next));
      if (result) return result;
    }
    return null;
  };
  return visit([0], new Set([0]), 0) ?? { path: [], cost: Infinity, complete: true };
}
function popcount(mask: number): number {
  let count = 0;
  while (mask) {
    count += mask & 1;
    mask >>>= 1;
  }
  return count;
}
/** Held–Karp exact solver: fixed start, visit each candidate once; no duration selection problem is claimed here. */
function dynamicProgramming(
  input: Track[],
  edge: (a: number, b: number) => number,
  fixed: FixedPositions,
  states: { value: number },
): PathResult {
  const dp = new Map<string, { cost: number; previous: number }>();
  dp.set("1:0", { cost: 0, previous: -1 });
  for (let mask = 1; mask < 1 << input.length; mask++) {
    if (!(mask & 1)) continue;
    const position = popcount(mask);
    for (let last = 0; last < input.length; last++) {
      const current = dp.get(`${mask}:${last}`);
      if (!current) continue;
      states.value++;
      for (let next = 1; next < input.length; next++) {
        if (mask & (1 << next) || !allowedAt(input, fixed, position, next)) continue;
        const step = edge(last, next);
        if (!Number.isFinite(step)) continue;
        const key = `${mask | (1 << next)}:${next}`;
        const old = dp.get(key);
        const cost = current.cost + step;
        if (!old || cost < old.cost) dp.set(key, { cost, previous: last });
      }
    }
  }
  const full = (1 << input.length) - 1;
  let end = -1;
  let best = Infinity;
  for (let last = 0; last < input.length; last++) {
    const state = dp.get(`${full}:${last}`);
    if (state && state.cost < best) {
      best = state.cost;
      end = last;
    }
  }
  if (end < 0) return { path: [], cost: Infinity, complete: true };
  const path: number[] = [];
  let mask = full;
  while (end >= 0) {
    path.unshift(end);
    const state = dp.get(`${mask}:${end}`)!;
    mask &= ~(1 << end);
    end = state.previous;
  }
  return { path, cost: best, complete: true };
}
/** Admissible bound = accrued cost + cheapest required edge from the current tail. Every completion contains that edge. */
function branchAndBound(
  input: Track[],
  edge: (a: number, b: number) => number,
  fixed: FixedPositions,
  states: { value: number },
  pruned: { value: number },
): PathResult {
  const initial = greedyPath(input, edge, fixed, states);
  let incumbent = initial.cost;
  let bestPath = initial.path;
  let complete = true;
  const started = performance.now();
  const search = (path: number[], mask: number, cost: number): void => {
    if (performance.now() - started > BNB_TIME_LIMIT_MS) {
      complete = false;
      return;
    }
    states.value++;
    if (path.length === input.length) {
      if (cost < incumbent) {
        incumbent = cost;
        bestPath = [...path];
      }
      return;
    }
    const last = path[path.length - 1]!;
    const remaining = input
      .map((_, index) => index)
      .filter((index) => !(mask & (1 << index)) && allowedAt(input, fixed, path.length, index));
    const cheapestExit = Math.min(...remaining.map((next) => edge(last, next)));
    if (!Number.isFinite(cheapestExit) || cost + cheapestExit >= incumbent) {
      pruned.value++;
      return;
    }
    for (const next of remaining.sort((a, b) => edge(last, a) - edge(last, b)))
      if (Number.isFinite(edge(last, next)))
        search([...path, next], mask | (1 << next), cost + edge(last, next));
  };
  search([0], 1, 0);
  return { path: bestPath, cost: incumbent, complete };
}
function solve(
  input: Track[],
  algorithm: Algorithm,
  settings: PlaylistSettings,
  fixed: FixedPositions = new Map(),
): AlgorithmResult {
  const started = performance.now();
  assertInput(input);
  if (fixed.get(0) && fixed.get(0) !== input[0]?.id)
    throw new Error("The starting track conflicts with a pinned opening track.");
  if (algorithm !== "Greedy" && input.length > EXACT_LIMIT)
    throw new Error(
      `Exact sequencing supports at most ${EXACT_LIMIT} selected tracks. Use Greedy or reduce the candidate set.`,
    );
  const edgeCount = { value: 0 },
    states = { value: 0 },
    pruned = { value: 0 };
  const matrix = makeMatrix(input, settings, edgeCount);
  const edge = (a: number, b: number) => matrix[a]?.[b] ?? Infinity;
  const result =
    algorithm === "Greedy"
      ? greedyPath(input, edge, fixed, states)
      : algorithm === "Dynamic Programming"
        ? dynamicProgramming(input, edge, fixed, states)
        : branchAndBound(input, edge, fixed, states, pruned);
  if (!result.path.length)
    throw new Error(
      "No feasible sequence meets the starting, artist, or pinned-position constraints. Allow consecutive artists, unpin a track, or change the starting song.",
    );
  return {
    algorithm,
    sequence: result.path.map((index) => input[index]!),
    totalCost: result.cost,
    objectiveScore: objective(result.cost, input.length),
    runtime: performance.now() - started,
    transitionsEvaluated: edgeCount.value,
    statesExplored: states.value,
    statesPruned: pruned.value,
    guarantee: result.complete
      ? descriptions[algorithm].guarantee
      : "Incomplete: time limit reached; the incumbent is feasible but optimality is not proven.",
    optimalityProven: algorithm !== "Greedy" && result.complete,
    inputSize: input.length,
    constraints:
      "Fixed start; each candidate visited once; optional no-consecutive-artist and fixed positions. Duration and mood select candidates before sequencing.",
  };
}
function validateSettings(settings: PlaylistSettings): void {
  if (!Number.isFinite(settings.duration) || settings.duration < 5 || settings.duration > 120)
    throw new Error("Choose a target duration from 5 to 120 minutes.");
  target(settings.energy, "Energy");
  target(settings.valence, "Valence");
  if (!Number.isFinite(settings.smoothness) || settings.smoothness < 0 || settings.smoothness > 100)
    throw new Error("Smoothness must be between 0 and 100.");
  if (!Number.isInteger(settings.artistGap) || settings.artistGap < 0 || settings.artistGap > 1)
    throw new Error("Artist repetition limit must be 0 or 1.");
  weights(settings);
}
function rank(track: Track, settings: PlaylistSettings): number {
  return (
    0.45 * Math.abs(feature(track, "energy") - target(settings.energy, "Energy")) +
    0.25 * Math.abs(feature(track, "valence") - target(settings.valence, "Valence")) +
    (track.mood === settings.mood ? 0 : 0.25)
  );
}
function selectedCandidates(
  settings: PlaylistSettings,
  previous?: Playlist,
): { selected: Track[]; fixed: FixedPositions; pins: Track[] } {
  const pins = previous?.tracks.filter((track) => previous.pinned.includes(track.id)) ?? [];
  if (pins.some((track) => settings.genres.length && !settings.genres.includes(track.genre)))
    throw new Error(
      "A pinned track conflicts with the selected genres. Unpin it or include its genre.",
    );
  const pool = tracks
    .filter((track) => !settings.genres.length || settings.genres.includes(track.genre))
    .sort((a, b) => rank(a, settings) - rank(b, settings));
  const fixed: FixedPositions = new Map();
  previous?.tracks.forEach((track, index) => {
    if (previous.pinned.includes(track.id)) fixed.set(index, track.id);
  });
  const startId = settings.startingTrack ?? fixed.get(0);
  const start = startId ? tracks.find((track) => track.id === startId) : pool[0];
  if (!start) throw new Error("No tracks match these genres.");
  if (settings.genres.length && !settings.genres.includes(start.genre))
    throw new Error("The starting track is outside the selected genres.");
  const selected = [start, ...pins.filter((track) => track.id !== start.id)];
  let seconds = selected.reduce((sum, track) => sum + track.duration, 0);
  if (seconds > settings.duration * 60)
    throw new Error("Pinned tracks exceed the target duration. Increase it or unpin tracks.");
  const limit = settings.algorithm === "Greedy" ? Infinity : EXACT_LIMIT;
  for (const track of pool)
    if (
      !selected.some((item) => item.id === track.id) &&
      selected.length < limit &&
      seconds + track.duration <= settings.duration * 60
    ) {
      selected.push(track);
      seconds += track.duration;
    }
  if (selected.length < 2)
    throw new Error("Not enough tracks fit this duration. Increase the target duration.");
  if ([...fixed.keys()].some((position) => position >= selected.length))
    throw new Error(
      "A pinned position is beyond the new mix length. Increase duration or unpin that track.",
    );
  return { selected: [start, ...selected.filter((track) => track.id !== start.id)], fixed, pins };
}
export const algorithmService: AlgorithmService = {
  transition: transitionCost,
  evaluate: evaluatePlaylist,
  explanation: (algorithm) => descriptions[algorithm],
  async generate(settings, previous) {
    validateSettings(settings);
    const { selected, fixed, pins } = selectedCandidates(settings, previous);
    const result = solve(selected, settings.algorithm, settings, fixed);
    return {
      id: previous?.id ?? crypto.randomUUID(),
      title:
        previous?.title ??
        `${settings.mood} ${settings.energy > 65 ? "Momentum" : "State of Mind"}`,
      settings: { ...settings },
      tracks: result.sequence,
      pinned: pins.map((track) => track.id),
      modified: false,
      createdAt: previous?.createdAt ?? new Date().toISOString(),
    };
  },
  async compare(dataset) {
    assertInput(dataset);
    if (dataset.length < 3 || dataset.length > 9) throw new Error("Compare between 3 and 9 songs.");
    const settings = { ...defaultSettings, artistGap: 0 };
    return { dataset, results: algorithms.map((algorithm) => solve(dataset, algorithm, settings)) };
  },
};
