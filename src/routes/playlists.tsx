import { createFileRoute } from '@tanstack/react-router';
import { Collection } from '@/features/collection';
export const Route=createFileRoute('/playlists')({head:()=>({meta:[{title:'My Playlists — MoodMix'},{name:'description',content:'Your saved musical journeys, organized and ready to revisit.'},{property:'og:title',content:'My Playlists — MoodMix'},{property:'og:description',content:'Your saved musical journeys, organized and ready to revisit.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Collection});
