import { useState } from "react";
import { FlaskConical, ArrowRight, Check, Timer, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeading } from "@/components/moodmix/shared";
import { TrackGraph } from "@/components/moodmix/graph";
import { algorithmService, algorithms } from "@/services/algorithm";
import { tracks } from "@/data/library";
import type { Algorithm, BenchmarkResult } from "@/types/music";
export function Lab() {
  const [size, setSize] = useState(6),
    [offset, setOffset] = useState(10),
    [result, setResult] = useState<BenchmarkResult | null>(null),
    [selected, setSelected] = useState<Algorithm>("Greedy"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dataset = tracks.slice(offset, offset + size);
  const explanation = algorithmService.explanation(selected);
  async function run() {
    setBusy(true);
    setError("");
    await new Promise((r) => setTimeout(r, 25));
    try {
      setResult(await algorithmService.compare(dataset));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setBusy(false);
    }
  }
  const max = Math.max(...(result?.results.map((r) => r.totalCost) ?? [1]), 0.001);
  return (
    <>
      <PageHeader
        eyebrow="WHERE MUSIC MEETS COMPUTER SCIENCE"
        title="A little science. A lot of soul."
        description="Same songs. Three approaches. See how the journey changes."
        action={
          <span className="lab-badge">
            <FlaskConical size={15} /> ALGORITHM LAB
          </span>
        }
      />
      <div className="lab-algorithms">
        {algorithms.map((a, i) => (
          <Button
            key={a}
            variant="outline"
            className={`lab-algorithm ${selected === a ? "selected" : ""}`}
            onClick={() => setSelected(a)}
          >
            <span className="algorithm-number">0{i + 1}</span>
            <strong>{a}</strong>
            <p>{algorithmService.explanation(a).summary}</p>
            <span className="algorithm-badge">
              {i === 0 ? "HEURISTIC" : "EXACT · FIXED SET"}
              {selected === a && <Check size={14} />}
            </span>
          </Button>
        ))}
      </div>
      <div className="comparison-controls">
        <label>
          Dataset
          <select
            aria-label="Comparison dataset"
            value={offset}
            onChange={(e) => {
              setOffset(Number(e.target.value));
              setResult(null);
            }}
          >
            <option value={10}>Chill / Indie</option>
            <option value={20}>Euphoric / Electronic</option>
            <option value={30}>Dreamy / Atmospheric</option>
            <option value={0}>Focus / Instrumental</option>
          </select>
        </label>
        <label>
          Playlist size
          <select
            aria-label="Comparison size"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setResult(null);
            }}
          >
            {[4, 5, 6, 7, 8, 9].map((n) => (
              <option value={n} key={n}>
                {n} tracks
              </option>
            ))}
          </select>
        </label>
        <span className="small-note">
          Fixed first song · All candidates visited once
          <br />
          No artist restriction · 80% continuity
        </span>
        <Button onClick={run} disabled={busy}>
          <FlaskConical />
          {busy ? "Exploring paths…" : "Run Comparison"}
          <ArrowRight />
        </Button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <section className="page-section">
        <SectionHeading
          title="The results"
          description="Live browser measurements. Not a synthetic benchmark."
        />
        {result ? (
          <>
            <div className="results-overflow">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>ALGORITHM</th>
                    <th>TRANSITION COST ↓</th>
                    <th>OBJECTIVE ↑</th>
                    <th>RUNTIME</th>
                    <th>EDGES EVALUATED</th>
                    <th>STATES EXPLORED</th>
                    <th>PRUNED</th>
                    <th>OPTIMALITY</th>
                    <th>INPUT</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.algorithm} className={selected === r.algorithm ? "selected" : ""}>
                      <td>
                        <Button variant="link" onClick={() => setSelected(r.algorithm)}>
                          {r.algorithm}
                        </Button>
                      </td>
                      <td>{r.totalCost.toFixed(4)}</td>
                      <td>{r.objectiveScore.toFixed(2)}%</td>
                      <td>{r.runtime.toFixed(3)} ms</td>
                      <td>{r.transitionsEvaluated}</td>
                      <td>{r.statesExplored}</td>
                      <td>{r.algorithm === "Branch and Bound" ? r.statesPruned : "—"}</td>
                      <td>
                        {r.optimalityProven
                          ? "Proven"
                          : r.algorithm === "Greedy"
                            ? "Heuristic"
                            : "Incomplete"}
                      </td>
                      <td>{r.inputSize} tracks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="benchmark-bars"
              role="img"
              aria-label="Measured transition cost comparison"
            >
              {result.results.map((r) => (
                <div key={r.algorithm}>
                  <span>{r.algorithm}</span>
                  <div>
                    <span style={{ width: `${(r.totalCost / max) * 100}%` }} />
                  </div>
                  <strong>{r.totalCost.toFixed(3)}</strong>
                </div>
              ))}
            </div>
            <div className="sequence-results">
              {result.results.map((r) => (
                <div key={r.algorithm}>
                  <h3>{r.algorithm}</h3>
                  <p className="sequence-text">{r.sequence.map((t) => t.title).join(" → ")}</p>
                  <span className="small-note">{r.guarantee}</span>
                </div>
              ))}
            </div>
            <p className="small-note">
              <Timer size={13} /> Runtime varies with device and browser. Edge evaluations count the
              shared directed cost matrix; explored states count algorithm search work. Objective =
              100 × (1 − cost / number of transitions).
            </p>
          </>
        ) : (
          <div className="comparison-empty">
            <Network size={28} />
            <h3>Let the algorithms make their case.</h3>
            <p>Run a comparison to measure actual sequences, costs, and search work.</p>
            <span className="small-note">No results have been calculated yet.</span>
          </div>
        )}
      </section>
      <section className="page-section">
        <SectionHeading
          title="A map of musical possibilities"
          description="Songs are nodes. Their differences are weighted connections."
        />
        <TrackGraph
          tracks={result?.dataset ?? dataset}
          path={result?.results.find((r) => r.algorithm === selected)?.sequence ?? []}
        />
      </section>
      <section className="algorithm-explanation">
        <div className="eyebrow">UNDER THE SURFACE</div>
        <h2>{selected}</h2>
        <p>{explanation.summary}</p>
        <div className="explanation-metrics">
          <div>
            <small>TIME COMPLEXITY</small>
            <strong>{explanation.complexity}</strong>
          </div>
          <div>
            <small>SPACE COMPLEXITY</small>
            <strong>{explanation.space}</strong>
          </div>
          <div>
            <small>OPTIMALITY</small>
            <span>{explanation.guarantee}</span>
          </div>
        </div>
      </section>
    </>
  );
}
