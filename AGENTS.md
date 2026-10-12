<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## MoodMix architecture
- Keep TanStack file routes as thin page entries and the shared shell in the root layout, so navigation retains the existing framework.
- Keep typed music data, sequencing, transition evaluation, and measured benchmarks in a replaceable algorithm service outside React, so a dedicated engine can replace it.
- Use a hydrated React context for browser-local playlist and preference persistence, so SSR and client first render stay consistent.
- Limit exact playlist sequencing to ten selected tracks and comparison datasets to nine, and label guarantees as fixed-set minimum-cost Hamiltonian paths rather than global playlist selection.
- Use global semantic OKLCH tokens and bundled editorial artwork for all visual treatments, so appearance is consistent and media is reliable.
