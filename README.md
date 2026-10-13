# MoodMix

MoodMix is a local-first, algorithmic playlist sequencer built for a Design and Analysis of Algorithms lab. It arranges a selected set of illustrative music-library tracks into a low-cost listening path; it does not stream or play music.

## Run locally

Use Node.js 22+ and npm:

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm test
npm run build
```

## Application flow

Discover tracks, select a mood or starting track, configure a mix, generate it, inspect transition explanations, edit or pin tracks, save locally, and export the current sequence as JSON or CSV. Saved playlists and preferences are stored in browser `localStorage` under `moodmix.v1` and are structurally validated on restore.

The library contains 60 real song identities with **illustrative, synthetic** metadata and editorial artwork. Energy and valence are normalized to 0–1; the user interface presents them as 0–100.

## Transition objective

Every algorithm uses the same directed non-negative cost:

`0.30 × energy difference + 0.20 × valence difference + 0.30 × normalized tempo difference + continuity × (0.12 × genre mismatch + 0.08 × same-artist)`

`continuity = 0.5 + smoothness / 100`. The transition weights can be overridden through `PlaylistSettings.transitionWeights`. A no-consecutive-artist setting makes those edges infeasible rather than silently accepting them.

## Algorithms

| Algorithm           | Problem solved                                  | Complexity                   | Guarantee                            |
| ------------------- | ----------------------------------------------- | ---------------------------- | ------------------------------------ |
| Greedy              | Selects the lowest-cost feasible next candidate | O(n²), O(n) space            | Heuristic                            |
| Dynamic Programming | Held–Karp fixed-start Hamiltonian path          | O(n² × 2ⁿ), O(n × 2ⁿ) space  | Exact for the selected candidate set |
| Branch and Bound    | Same fixed-start Hamiltonian path               | O(n!) worst case, O(n) space | Exact only when it completes         |

Exact sequencing is capped at 10 candidates; Algorithm Lab comparisons use 3–9. Mood, genre, duration, and library selection happen before exact ordering, so an exact result is not a proof of global library-subset optimality. Branch and bound uses a mathematically admissible lower bound and reports an incomplete result if its time limit is reached.

## Known limitations

- No audio previews or streaming-provider integration is present.
- Pin positions and no-consecutive-artist restrictions are encoded during sequencing; a conflicting configuration produces a recovery-oriented error.
- The project has a legacy repository-wide formatting baseline. Modified production files are formatted and targeted linted; `npm run lint` may report style errors in unrelated legacy files.
