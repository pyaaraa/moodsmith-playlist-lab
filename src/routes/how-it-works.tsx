import { createFileRoute } from '@tanstack/react-router';
import { Learn } from '@/features/learn';
export const Route=createFileRoute('/how-it-works')({head:()=>({meta:[{title:'How It Works — MoodMix'},{name:'description',content:'Explore the graph model and algorithms behind mood-aware playlist sequencing.'},{property:'og:title',content:'How It Works — MoodMix'},{property:'og:description',content:'Explore the graph model and algorithms behind mood-aware playlist sequencing.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Learn});
