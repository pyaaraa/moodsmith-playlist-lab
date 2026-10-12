import { createFileRoute } from '@tanstack/react-router';
import { PlaylistPage } from '@/features/playlist';
export const Route=createFileRoute('/mix')({head:()=>({meta:[{title:'Your Mix — MoodMix'},{name:'description',content:'Explore, edit, save and export your sequenced musical journey.'},{property:'og:title',content:'Your Mix — MoodMix'},{property:'og:description',content:'Explore, edit, save and export your sequenced musical journey.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:PlaylistPage});
