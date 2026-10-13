export const moods = ["Focus", "Chill", "Euphoric", "Melancholic", "Dreamy", "Late Night"] as const;
export type Mood = (typeof moods)[number];
export type Algorithm = "Greedy" | "Dynamic Programming" | "Branch and Bound";
export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  tempo: number;
  energy: number;
  valence: number;
  acousticness?: number;
  mood: Mood;
  artwork?: string;
}
export interface TransitionWeights {
  energy: number;
  valence: number;
  tempo: number;
  genreMismatch: number;
  sameArtist: number;
}
export interface PlaylistSettings {
  mood: Mood;
  energy: number;
  valence: number;
  genres: string[];
  duration: number;
  artistGap: number;
  smoothness: number;
  startingTrack?: string | undefined;
  algorithm: Algorithm;
  transitionWeights?: Partial<TransitionWeights>;
}
export interface Transition {
  from: string;
  to: string;
  cost: number;
  explanation: string;
}
export interface Evaluation {
  duration: number;
  averageEnergy: number;
  averageValence: number;
  smoothness: number;
  uniqueArtists: number;
  totalCost: number;
  transitions: Transition[];
  abruptTransitions: Transition[];
  hardConstraintViolations: string[];
}
export interface Playlist {
  id: string;
  title: string;
  settings: PlaylistSettings;
  tracks: Track[];
  pinned: string[];
  modified: boolean;
  createdAt: string;
}
export interface AlgorithmResult {
  algorithm: Algorithm;
  sequence: Track[];
  totalCost: number;
  objectiveScore: number;
  runtime: number;
  transitionsEvaluated: number;
  statesExplored: number;
  statesPruned: number;
  guarantee: string;
  optimalityProven: boolean;
  inputSize: number;
  constraints: string;
}
export interface BenchmarkResult {
  dataset: Track[];
  results: AlgorithmResult[];
}
export interface AlgorithmService {
  generate(settings: PlaylistSettings, previous?: Playlist): Promise<Playlist>;
  transition(a: Track, b: Track, settings?: PlaylistSettings): Transition;
  evaluate(tracks: Track[], settings?: PlaylistSettings): Evaluation;
  compare(tracks: Track[]): Promise<BenchmarkResult>;
  explanation(algorithm: Algorithm): {
    summary: string;
    complexity: string;
    space: string;
    guarantee: string;
  };
}
