import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Playlist } from '@/types/music';
interface Preferences { collapsed:boolean; reducedMotion:boolean; defaultAlgorithm:'Greedy'|'Dynamic Programming'|'Branch and Bound' }
interface MusicState { playlists:Playlist[]; recent:Playlist[]; active:Playlist|null; ready:boolean; search:string; setSearch:(s:string)=>void; preferences:Preferences; setPreferences:(p:Preferences)=>void; save:(p:Playlist)=>void; remove:(id:string)=>void; activate:(p:Playlist)=>void; update:(p:Playlist)=>void }
const MusicContext=createContext<MusicState|null>(null);
const defaults:Preferences={collapsed:false,reducedMotion:false,defaultAlgorithm:'Greedy'};
export function MusicProvider({children}:{children:ReactNode}){
 const [playlists,setPlaylists]=useState<Playlist[]>([]),[recent,setRecent]=useState<Playlist[]>([]),[active,setActive]=useState<Playlist|null>(null),[preferences,setPreferences]=useState(defaults),[ready,setReady]=useState(false),[search,setSearch]=useState('');
 useEffect(()=>{try {const saved=JSON.parse(localStorage.getItem('moodmix.v1')??'null');if(saved){setPlaylists(Array.isArray(saved.playlists)?saved.playlists:[]);setRecent(Array.isArray(saved.recent)?saved.recent:[]);setActive(saved.active??null);setPreferences({...defaults,...saved.preferences});}}catch{ /* Corrupt storage resets safely. */ }setReady(true);},[]);
 useEffect(()=>{if(ready){try{localStorage.setItem('moodmix.v1',JSON.stringify({playlists,recent,active,preferences}));}catch{ /* Keep this session usable if storage is full. */ }document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);}},[playlists,recent,active,preferences,ready]);
 const update=(p:Playlist)=>{setActive(p);setPlaylists(old=>old.map(x=>x.id===p.id?p:x));setRecent(old=>old.map(x=>x.id===p.id?p:x));};
 return <MusicContext.Provider value={{playlists,recent,active,ready,search,setSearch,preferences,setPreferences,save:p=>setPlaylists(old=>[p,...old.filter(x=>x.id!==p.id)]),remove:id=>setPlaylists(old=>old.filter(x=>x.id!==id)),activate:p=>{setActive(p);setRecent(old=>[p,...old.filter(x=>x.id!==p.id)].slice(0,8));},update}}>{children}</MusicContext.Provider>;
}
export function useMusic(){const value=useContext(MusicContext);if(!value)throw new Error('MusicProvider missing');return value;}
