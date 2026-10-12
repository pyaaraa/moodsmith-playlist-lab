import { createFileRoute } from "@tanstack/react-router";
import { Discover } from "@/features/discover";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { library?: boolean } => ({ library: search['library'] === true || search['library'] === 'true' }),
  head: () => ({ meta: [
    {title:"Discover — MoodMix"},
    {name:"description",content:"Find your frequency. Discover mood collections, editorial mixes and a diverse music library."},
    {property:"og:title",content:"Discover — MoodMix"},
    {property:"og:description",content:"Find your frequency with mood-aware musical journeys."},
    {property:"og:type",content:"website"},
    {name:"twitter:card",content:"summary_large_image"},
  ]}),
  component: Index,
});

function Index() {
  const { library } = Route.useSearch();
  return <Discover showLibrary={library ?? false}/>;
}
