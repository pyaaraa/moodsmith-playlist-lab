# Moodsmith Playlist Lab

# MoodMix — Build a Premium Music-Tech Product

Build a polished, responsive web application called **MoodMix**, an algorithmic playlist sequencer that creates smooth musical journeys by arranging tracks according to mood, energy, tempo, genre, and artist diversity.

Act as a senior product designer and frontend engineer. Your primary responsibility is to deliver an exceptional visual experience, complete frontend functionality, realistic sample data, reusable components, and a clean architecture that another engineer can connect to a dedicated algorithm engine.

This is not a generic admin dashboard or a static landing page. It should feel like a real, thoughtfully designed music-tech product that I can demonstrate at a university DAA Lab presentation and feature in my developer portfolio.

## 1. Visual direction

Create a distinctive, premium dark interface.

Design inspiration:
- Immersive music discovery experiences.
- Editorial album artwork layouts.
- Minimal, sophisticated creative software.
- Modern data visualization tools.

Use:
- Deep charcoal and near-black backgrounds.
- Warm white typography.
- Muted gray secondary text.
- Restrained violet or electric-blue accents.
- Large artwork, subtle gradients, fine borders, and generous spacing.
- Carefully designed typography, hover states, transitions, and micro-interactions.
- Lucide icons instead of emoji-based controls.

Avoid generic SaaS dashboards, excessive neon, overly rounded cards everywhere, excessive glassmorphism, random gradients, cluttered layouts, and placeholder content.

The interface must feel cohesive, premium, and intentional. Prioritize visual hierarchy and excellent spacing.

Make every page responsive. Desktop should feel immersive, while mobile should use a compact navigation system and appropriately stacked layouts.

## 2. Application structure

Create these pages with functional navigation:

1. Discover
2. Create a Mix
3. My Playlists
4. Algorithm Lab
5. How It Works

Use React Router if supported by the existing project.

Create a persistent application shell with:
- Collapsible desktop sidebar.
- Mobile navigation.
- Global search.
- User preferences menu.
- Optional mini-player area with honest playback availability.
- Consistent page headers and reusable UI components.

All navigation links must lead to real pages.

## 3. Discover page

Create a visually impressive music discovery home page.

Include:
- An editorial hero section with a featured mix.
- Mood collections: Focus, Chill, Euphoric, Melancholic, Dreamy, and Late Night.
- Curated playlists.
- Recently generated mixes.
- Recommended starting points.
- Searchable music library.
- A prominent Create a Mix action.

Use at least 50 realistic sample track records with different titles, artists, genres, durations, tempos, energy levels, and moods.

Use album artwork with stable image URLs where available. Include fallback artwork for failed image loads.

Make the content varied and believable. Avoid repeating generic placeholder songs.

The mood cards and track cards must be interactive. Clicking a mood should open the mix creation page with that mood selected. Clicking a track should open its details or allow the user to choose it as a starting track.

## 4. Create a Mix page

Design this as the main user journey.

Use a visually balanced two-column layout on desktop:
- Left side: playlist configuration.
- Right side: live preview of the intended mix.

Include these working controls:

### Mood
Selectable mood cards with distinct visual treatments.

### Energy
An interactive slider from 0 to 100, with labels such as Calm, Balanced, and Intense.

### Valence
An interactive slider that moves from darker or melancholic moods toward brighter or more positive moods.

### Genre
Multi-select genre chips.

### Duration
Allow users to select or enter a target duration.

### Artist diversity
Let users configure how frequently the same artist may appear consecutively.

### Transition smoothness
A control balancing musical continuity against variety.

### Starting track
Allow an optional track to be selected as the playlist's opening song.

### Algorithm
Provide Greedy, Dynamic Programming, and Branch and Bound options. Include a brief explanation of each approach and whether it is heuristic or exact for the chosen problem.

Every control must have a visible selected state, useful labels, and sensible validation.

Show a live configuration summary. The Generate My Mix button must create a playlist from the current settings using a clearly defined frontend algorithm service interface.

Do not create buttons that merely animate without performing an action.

## 5. Generated playlist page

Build a premium, artwork-led playlist detail page.

Include:
- Dynamic playlist title.
- Mood and genre labels.
- Total duration.
- Number of tracks.
- Average energy.
- Transition smoothness score.
- Unique artist count.
- Total transition cost.
- Ordered track list with artwork, title, artist, duration, genre, energy, and tempo.

Show transition information between adjacent tracks. Allow a user to expand a transition explanation to understand why two songs fit together or why their transition is relatively abrupt.

Provide working controls for:
- Regenerating the playlist.
- Removing tracks.
- Pinning tracks.
- Manually reordering tracks.
- Shuffling tracks.
- Saving the playlist.
- Renaming the playlist.
- Exporting playlist data as JSON or CSV.

After any edit, recompute the displayed metrics using a shared evaluation function. Clearly distinguish user-modified sequences from algorithm-generated sequences.

Pinned tracks should be respected during regeneration when feasible. Show a useful error if the requested constraints cannot be satisfied.

If playback is unavailable, display a clear preview-unavailable state. Do not simulate audio playback or pretend to connect to a streaming service.

## 6. Algorithm Lab page

This is a signature feature and must look exceptional.

Design an interactive algorithm comparison workspace with:
- Three algorithm cards: Greedy, Dynamic Programming, Branch and Bound.
- A dataset or playlist-size selector.
- A Run Comparison action.
- A results table.
- A comparison chart.
- A graph visualization of selected tracks and transitions.
- A detailed algorithm explanation panel.

The result layout should display:
- Algorithm name.
- Resulting sequence.
- Total transition cost.
- Objective score.
- Runtime.
- Candidate transitions evaluated.
- Search states explored.
- States pruned, where applicable.
- Optimality guarantee for the specific problem formulation.

Use clean typography and carefully organized metric cards.

Make it easy to compare results side by side.

Do not invent metrics, benchmark numbers, or algorithm results. Display values supplied by the algorithm service. If the service is not yet connected, provide a clearly labeled preview state instead of presenting hardcoded demonstration numbers as actual results.

### Interactive graph

Visualize songs as nodes and transitions as weighted edges.

Allow users to:
- Select a node.
- Inspect a track's properties.
- Hover over an edge to see its transition cost.
- Highlight a selected playlist path.
- Toggle strong and weak transitions.
- Focus on a subset of tracks.

Use a readable SVG-based graph or a suitable graph library. The graph should be visually clean, responsive, and interactive, not a giant tangled network.

For larger datasets, show a focused subgraph instead of rendering every edge.

## 7. My Playlists

Create a visually appealing saved-playlists page.

Include:
- Grid and list views.
- Artwork-led playlist cards.
- Playlist title, mood, duration, and track count.
- Date created.
- Search and sorting.
- Rename, delete, duplicate, and reopen actions.
- An empty state with a clear Create a Mix button.

Persist saved playlists and preferences using localStorage for the initial version.

The data must survive page refreshes.

## 8. How It Works page

Build an educational page that explains the product's algorithmic model in a clear and visually engaging way.

Include:
- Songs as graph nodes.
- Transitions as weighted edges.
- The transition-cost concept.
- Greedy selection.
- Dynamic programming.
- Branch and bound.
- Time and space complexity.
- Heuristic versus exact solutions.
- Why different algorithms can produce different sequences.

Use small visual examples, diagrams, equations, and expandable explanations where appropriate.

Avoid walls of text. This page should help me explain the project during my DAA Lab viva.

## 9. Frontend architecture for later Codex integration

Keep the frontend clean and modular.

Use the existing project framework if one is already configured. Otherwise prefer:
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- Lucide icons.
- A suitable charting library.
- SVG or a suitable graph visualization library.

Organize the project into:
- Pages.
- Reusable components.
- Hooks.
- Types.
- Seed data.
- State management.
- Services.
- Algorithm interface and evaluation utilities.

Create strongly typed models for tracks, playlist settings, playlists, transitions, algorithm results, and benchmark results.

Create a dedicated algorithm service interface exposing operations equivalent to:
- Generate a playlist from settings.
- Calculate transition costs.
- Evaluate a playlist.
- Compare algorithms.
- Retrieve algorithm explanations.

Keep the UI independent of the underlying implementation so a separate TypeScript algorithm engine can replace the initial implementation without rewriting the pages.

Do not put complex algorithm code inside React components.

Do not introduce unnecessary backend services, paid API integrations, authentication, or environment variables.

## 10. Functional quality requirements

Verify that:
- Navigation works.
- Search and filters work.
- Mood selection carries over to the mix builder.
- Sliders and selectors update the configuration summary.
- Playlist generation uses the current configuration.
- Track removal and reordering work.
- Pinned tracks are visibly distinguished.
- Playlist metrics update after edits.
- Save, rename, duplicate, delete, and reopen work.
- JSON and CSV exports contain the actual playlist data.
- Graph interactions work.
- Preferences and saved playlists persist after refresh.
- Invalid settings display useful errors.
- Responsive layouts work on mobile.
- No buttons or controls are purely decorative.
- No fake audio playback or fabricated algorithm benchmark claims appear.

Build the product in stages, beginning with the application shell, Discover page, and complete Create a Mix to Generated Playlist flow. Then build My Playlists, Algorithm Lab, the graph visualization, and How It Works.

Deliver a coherent, functional frontend with excellent design quality and clean code. Do not stop after creating a static mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd413bc0-86ee-463c-89ce-df6581d82efd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
