import { createFileRoute } from '@tanstack/react-router';
import { Builder } from '@/features/builder';
import { moods, type Mood } from '@/types/music';
export const Route=createFileRoute('/create')({validateSearch:(s:Record<string,unknown>)=>({mood:moods.includes(s.mood as Mood)?s.mood as Mood:undefined,start:typeof s.start==='string'?s.start:undefined}),head:()=>({meta:[{title:'Create a Mix — MoodMix'},{name:'description',content:'Shape your musical journey with mood, energy, genre and algorithm controls.'},{property:'og:title',content:'Create a Mix — MoodMix'},{property:'og:description',content:'A musical journey built around your mood.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const s=Route.useSearch();return <Builder key={`${s.mood}-${s.start}`} mood={s.mood} start={s.start}/>;}
