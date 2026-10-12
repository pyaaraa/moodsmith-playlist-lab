import { tracks, defaultSettings } from '@/data/library';
import type { Algorithm, AlgorithmService, AlgorithmResult, PlaylistSettings, Playlist, Track } from '@/types/music';
const algorithms: Algorithm[] = ['Greedy','Dynamic Programming','Branch and Bound'];
export { algorithms };
const explanations = {
 'Greedy': { summary:'Choose the least-cost feasible next song. Fast and intuitive, but a locally good choice can miss a better overall path.', complexity:'O(n²)', space:'O(n)', guarantee:'Heuristic; no global optimality guarantee.' },
 'Dynamic Programming': { summary:'Held–Karp stores the best path for each visited subset and final song, then reconstructs the least-cost complete path.', complexity:'O(n² · 2ⁿ)', space:'O(n · 2ⁿ)', guarantee:'Exact minimum-cost path for a fixed candidate set and starting song.' },
 'Branch and Bound': { summary:'Explore possible paths, keeping a greedy incumbent. Prune a branch when its accumulated nonnegative cost cannot improve the best complete path.', complexity:'O(n!) worst case', space:'O(n²)', guarantee:'Exact minimum-cost path for a fixed candidate set and starting song.' }
};
function transition(a:Track,b:Track,s=defaultSettings) {
 const tempo=Math.min(Math.abs(a.tempo-b.tempo)/100,1), energy=Math.abs(a.energy-b.energy)/100, valence=Math.abs(a.valence-b.valence)/100;
 const w=s.smoothness/100;
 const cost=(tempo*.35+energy*.35+valence*.2+(a.genre===b.genre?0:.1))*w+(a.genre===b.genre?.12:0)*(1-w);
 return {from:a.id,to:b.id,cost,explanation:`${Math.abs(a.tempo-b.tempo)} BPM tempo difference · ${Math.abs(a.energy-b.energy)} energy points · ${Math.abs(a.valence-b.valence)} valence points. ${a.genre===b.genre?'Shared '+a.genre+' texture.':'A change from '+a.genre+' to '+b.genre+'.'} ${cost<.2?'A gentle transition.':'A more noticeable shift.'}`};
}
function evaluate(list:Track[],s=defaultSettings) {
 const transitions=list.flatMap((t,i)=>{const previous=list[i-1];return previous?[transition(previous,t,s)]:[];});
 const totalCost=transitions.reduce((a,t)=>a+t.cost,0);
 return { duration:list.reduce((a,t)=>a+t.duration,0), averageEnergy:list.length?list.reduce((a,t)=>a+t.energy,0)/list.length:0, smoothness:transitions.length?100*(1-totalCost/transitions.length):100, uniqueArtists:new Set(list.map(t=>t.artist)).size, totalCost, transitions };
}
// A fixed-start Hamiltonian path. Infinity edges prohibit adjacent identical artists.
function solve(input:Track[],algorithm:Algorithm,s=defaultSettings,fixed=new Map<number,string>()):AlgorithmResult {
 const begin=performance.now(), n=input.length;
 if(n<1) throw new Error('Select at least one track.');
 if(algorithm!=='Greedy' && n>10) throw new Error('Exact algorithms support up to 10 selected tracks. Shorten the duration or use Greedy.');
 let transitionsEvaluated=0, statesExplored=0, statesPruned=0;
 const matrix=input.map((a,i)=>input.map((b,j)=>{ if(i===j)return Infinity; transitionsEvaluated++; return s.artistGap===1 && a.artist===b.artist?Infinity:transition(a,b,s).cost; }));
 const edge=(i:number,j:number)=>matrix[i]?.[j]??Infinity;
 const allowed=(position:number,j:number)=>!fixed.has(position)||fixed.get(position)===input[j]?.id;
 if(!allowed(0,0))throw new Error('The starting track conflicts with a pinned opening track.');
 function greedy() {
  const path=[0]; let cost=0;
  while(path.length<n) { const last=path[path.length-1]??0; const choices=input.map((_,i)=>i).filter(i=>!path.includes(i)&&allowed(path.length,i)&&!([...fixed.entries()].some(([pos,id])=>pos>path.length&&id===input[i]?.id))).sort((a,b)=>edge(last,a)-edge(last,b)); statesExplored+=choices.length; const next=choices[0]; if(next===undefined||!Number.isFinite(edge(last,next))) return {path:[] as number[],cost:Infinity}; path.push(next);cost+=edge(last,next); }
  return {path,cost};
 }
 let best=greedy();
 if(algorithm==='Greedy'&&!best.path.length){
  let budget=100000;
  const feasible=(path:number[],used:Set<number>,cost:number):{path:number[];cost:number}|null=>{
   statesExplored++;if(--budget<0)return null;if(path.length===n)return {path,cost};const last=path[path.length-1]??0;
   const choices=input.map((_,i)=>i).filter(i=>!used.has(i)&&allowed(path.length,i)&&Number.isFinite(edge(last,i))&&![...fixed.entries()].some(([pos,id])=>pos>path.length&&id===input[i]?.id)).sort((a,b)=>edge(last,a)-edge(last,b));
   for(const next of choices){const found=feasible([...path,next],new Set([...used,next]),cost+edge(last,next));if(found)return found;}return null;
  };best=feasible([0],new Set([0]),0)??best;
 }

 if(algorithm==='Dynamic Programming') {
  const dp=new Map<string,{cost:number;path:number[]}>();dp.set('1:0',{cost:0,path:[0]});
  for(let mask=1;mask<(1<<n);mask++) { if(!(mask&1))continue; const position=mask.toString(2).replace(/0/g,'').length;
   for(let last=0;last<n;last++){ const state=dp.get(`${mask}:${last}`); if(!state)continue; statesExplored++;
    for(let next=1;next<n;next++){ if(mask&(1<<next)||!allowed(position,next))continue; const cost=state.cost+edge(last,next), key=`${mask|(1<<next)}:${next}`, old=dp.get(key); if(Number.isFinite(cost)&&(!old||cost<old.cost))dp.set(key,{cost,path:[...state.path,next]}); }
   }
  }
  best={path:[],cost:Infinity};for(let last=0;last<n;last++){const state=dp.get(`${(1<<n)-1}:${last}`);if(state&&state.cost<best.cost)best=state;}
 } else if(algorithm==='Branch and Bound') {
  const visit=(path:number[],mask:number,cost:number)=>{statesExplored++;if(cost>=best.cost){statesPruned++;return;}if(path.length===n){best={path:[...path],cost};return;}
   const last=path[path.length-1]??0; const candidates=input.map((_,i)=>i).filter(i=>!(mask&(1<<i))&&allowed(path.length,i)).sort((a,b)=>edge(last,a)-edge(last,b));
   for(const j of candidates){if(Number.isFinite(edge(last,j)))visit([...path,j],mask|(1<<j),cost+edge(last,j));}
  };visit([0],1,0);
 }
 if(!best.path.length)throw new Error('No valid sequence meets the artist or pinned-position constraints. Allow consecutive artists, unpin a track, or change the starting song.');
 return { algorithm,sequence:best.path.flatMap(i=>{const track=input[i];return track?[track]:[];}),totalCost:best.cost,objectiveScore:100*(1-best.cost/Math.max(n-1,1)),runtime:performance.now()-begin,transitionsEvaluated,statesExplored,statesPruned,guarantee:explanations[algorithm].guarantee };
}
function validate(s:PlaylistSettings){if(!Number.isFinite(s.duration)||s.duration<5||s.duration>120)throw new Error('Choose a target duration from 5 to 120 minutes.');for(const x of [s.energy,s.valence,s.smoothness])if(!Number.isFinite(x)||x<0||x>100)throw new Error('Energy, valence and smoothness must be between 0 and 100.');}
export const algorithmService:AlgorithmService={
 transition,evaluate,explanation:a=>explanations[a],
 async generate(s,previous){
  validate(s);
  const pinned=previous?.tracks.filter(t=>previous.pinned.includes(t.id))??[];
  const fixed=new Map<number,string>();previous?.tracks.forEach((t,i)=>{if(previous.pinned.includes(t.id))fixed.set(i,t.id);});
  if(pinned.some(t=>s.genres.length&&!s.genres.includes(t.genre)))throw new Error('A pinned track conflicts with the selected genres. Unpin it or include its genre.');
  const pool=tracks.filter(t=>!s.genres.length||s.genres.includes(t.genre)).sort((a,b)=>rank(a,s)-rank(b,s));
  const start=tracks.find(t=>t.id===(s.startingTrack??fixed.get(0)))??previous?.tracks[0]??pool.find(t=>!pinned.some(p=>p.id===t.id))??pool[0];
  if(!start)throw new Error('No tracks match these genres.');
  if(s.genres.length&&!s.genres.includes(start.genre))throw new Error('The starting track is outside the selected genres.');
  const selected=[start,...pinned.filter(t=>t.id!==start.id)];let seconds=selected.reduce((a,t)=>a+t.duration,0);
  if(seconds>s.duration*60)throw new Error('Pinned tracks exceed the target duration. Increase it or unpin tracks.');
  for(const t of pool){if(selected.some(x=>x.id===t.id))continue;if(seconds+t.duration>s.duration*60)continue;selected.push(t);seconds+=t.duration;}
  if(selected.length<2)throw new Error('Not enough tracks fit this duration. Increase the target duration.');
  if([...fixed.keys()].some(i=>i>=selected.length))throw new Error('A pinned position is beyond the new mix length. Increase duration or unpin that track.');
  const result=solve(selected,s.algorithm,s,fixed);
  return {id:previous?.id??crypto.randomUUID(),title:previous?.title??`${s.mood} ${s.energy>65?'Momentum':'State of Mind'}`,settings:{...s},tracks:result.sequence,pinned:pinned.map(t=>t.id),modified:false,createdAt:previous?.createdAt??new Date().toISOString()};
 },
 async compare(dataset){if(dataset.length<3||dataset.length>9)throw new Error('Compare between 3 and 9 songs.');const settings={...defaultSettings,artistGap:0};return {dataset,results:algorithms.map(a=>solve(dataset,a,settings))};}
};
function rank(t:Track,s:PlaylistSettings){return Math.abs(t.energy-s.energy)*.45+Math.abs(t.valence-s.valence)*.25+(t.mood===s.mood?0:25);}
