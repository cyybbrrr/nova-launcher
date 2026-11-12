import {useEffect,useMemo,useRef,useState} from 'react';
declare global{interface Window{api:any}}
type Entry={id:string;name:string;exe:string;args:string;cwd:string;admin:boolean;desc:string;category:string;tags:string[];
 env?:string;minimize?:boolean;icon?:string;cover?:string;bg?:string;coverPos?:{x:number;y:number;z:number};folder?:string;fav:boolean;launches:number;lastLaunched?:number;added:number};
type Settings={keys:Record<string,string>;scale:number;font:string;anim:boolean;tray:boolean;startup:boolean;startMin:boolean;startPage:'home'|'library'|'last';custom?:{bg?:string;panel?:string;card?:string;text?:string};page:'home'|'library'|'settings';widgets:{stats:boolean;recent:boolean;favs:boolean;added:boolean};bgImage?:string;bgDim:number;theme:'dark'|'light';accent:string;cardSize:number;view:'grid'|'list';sort:'manual'|'name'|'recent'|'launches'|'added'};
type State={libName:string;others:Record<string,{entries:Entry[];folders:string[]}>;folders:string[];entries:Entry[];settings:Settings};
const KEYS:Record<string,string>={palette:'Ctrl+K',newApp:'Ctrl+N',search:'Ctrl+F',home:'Ctrl+1',library:'Ctrl+2',settings:'Ctrl+,'};
const KNAMES:Record<string,string>={palette:'Global search',newApp:'Add application',search:'Focus library search',home:'Go to Home',library:'Go to Library',settings:'Open Settings'};
const DEF:State={libName:'Main',others:{},folders:[],entries:[],settings:{keys:KEYS,scale:1,font:'',anim:true,tray:false,startup:false,startMin:false,startPage:'home',page:'home',widgets:{stats:true,recent:true,favs:true,added:true},bgDim:0.6,theme:'dark',accent:'#7c5cff',cardSize:200,view:'grid',sort:'manual'}};
const media=(f?:string)=>f?`media://img/${encodeURIComponent(f)}`:'';
const uid=()=>Math.random().toString(36).slice(2,10);
export default function App(){
  const [st,setSt]=useState<State>(DEF),[ready,setReady]=useState(false);
  const [q,setQ]=useState(''),[cat,setCat]=useState('All'),[edit,setEdit]=useState<Entry|null>(null);
  const [toast,setToast]=useState(''),[menu,setMenu]=useState<{x:number,y:number,e:Entry}|null>(null),[run,setRun]=useState<string[]>([]);
  const drag=useRef<string|null>(null);const [hb,setHb]=useState<string|undefined>();const [nf,setNf]=useState<string|null>(null);
  useEffect(()=>{window.api.load().then((s:State|null)=>{if(s){const m={...DEF,...s,settings:{...DEF.settings,...s.settings}};if(m.settings.startPage!=='last')m.settings.page=m.settings.startPage;setSt(m)}setReady(true)})},[]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>window.api.save(st),300);return()=>clearTimeout(t)}},[st,ready]);
  useEffect(()=>{const f=()=>{if(!document.hidden)window.api.running().then(setRun)};f();const i=setInterval(f,5000);return()=>clearInterval(i)},[]);
  useEffect(()=>{document.documentElement.dataset.theme=st.settings.theme;document.documentElement.style.setProperty('--accent',st.settings.accent)},[st.settings]);
  useEffect(()=>{const r=document.documentElement,c=st.settings.custom||{};r.dataset.anim=st.settings.anim?'on':'off';r.style.fontFamily=st.settings.font?`'${st.settings.font}',sans-serif`:'';
    for(const k of ['bg','panel','card','text'] as const){c[k]?r.style.setProperty('--'+k,c[k]!):r.style.removeProperty('--'+k)}},[st.settings]);
  useEffect(()=>{window.api.zoom(st.settings.scale)},[st.settings.scale]);
  useEffect(()=>{if(ready)window.api.sys({tray:st.settings.tray,startup:st.settings.startup,startMin:st.settings.startMin})},[ready,st.settings.tray,st.settings.startup,st.settings.startMin]);
  const setS=(p:Partial<Settings>)=>setSt(s=>({...s,settings:{...s.settings,...p}}));
  const upsert=(e:Entry)=>setSt(s=>({...s,entries:s.entries.some(x=>x.id===e.id)?s.entries.map(x=>x.id===e.id?e:x):[...s.entries,e]}));
  const say=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3500)};
  const blank=(exe=''):Entry=>({id:uid(),name:exe.split(/[\\/]/).pop()?.replace(/\.\w+$/,'')||'',exe,args:'',cwd:'',admin:false,desc:'',category:'',tags:[],fav:false,launches:0,added:Date.now()});
  async function addExe(p:string){const e=blank(p);e.icon=await window.api.extractIcon(p)||undefined;upsert(e);setEdit(e)}
  async function launch(e:Entry){const r=await window.api.launch(e);if(!r.ok)return say(r.error);
    upsert({...e,launches:e.launches+1,lastLaunched:Date.now()});say('Launched '+e.name);if(e.minimize)window.api.win('min')}
  const cats=useMemo(()=>['All','Favorites',...Array.from(new Set(st.entries.map(e=>e.category).filter(Boolean)))],[st.entries]);
  const list=useMemo(()=>{
    let l=st.entries.filter(e=>(cat==='All'||(cat==='Favorites'?e.fav:cat.startsWith('f:')?e.folder===cat.slice(2):e.category===cat))&&
      (e.name+e.desc+e.tags.join(' ')).toLowerCase().includes(q.toLowerCase()));
    const k=st.settings.sort;
    if(k==='name')l=[...l].sort((a,b)=>a.name.localeCompare(b.name));
    if(k==='recent')l=[...l].sort((a,b)=>(b.lastLaunched||0)-(a.lastLaunched||0));
    if(k==='launches')l=[...l].sort((a,b)=>b.launches-a.launches);
    if(k==='added')l=[...l].sort((a,b)=>b.added-a.added);
    return l},[st,q,cat]);
  const recent=[...st.entries].filter(e=>e.lastLaunched).sort((a,b)=>b.lastLaunched!-a.lastLaunched!).slice(0,6);
  const go=(c:string)=>{setCat(c);setS({page:'library'})};
  const W=st.settings.widgets,names={stats:'Stats',recent:'Recently launched',favs:'Favorites',added:'Recently added'};
  const favs=st.entries.filter(e=>e.fav).slice(0,8),added=[...st.entries].sort((a,b)=>b.added-a.added).slice(0,8);
  const tiles=(l:Entry[])=>l.length?<div className="tiles">{l.map(e=><div key={e.id} className="tile" onClick={()=>launch(e)} onMouseEnter={()=>setHb(e.bg)} onMouseLeave={()=>setHb(undefined)}><Cover e={e}/><span>{e.name}</span></div>)}</div>:<div className="muted">Nothing here yet.</div>;
  const isRun=(e:Entry)=>run.includes((e.exe.split(/[\\/]/).pop()||'').toLowerCase());
  const reorder=(onto:string)=>{const from=drag.current;if(!from||from===onto)return;setS({sort:'manual'});

    setSt(s=>{const a=[...s.entries],i=a.findIndex(x=>x.id===from),j=a.findIndex(x=>x.id===onto);const[m]=a.splice(i,1);a.splice(j,0,m);return{...s,entries:a}})};
  const K={...KEYS,...st.settings.keys};
  const sref=useRef<HTMLInputElement>(null),act=useRef<any>({});
  const [pal,setPal]=useState(false),[pq,setPq]=useState(''),[pi,setPi]=useState(0),[cap,setCap]=useState<string|null>(null),[nl,setNl]=useState<string|null>(null),[miss,setMiss]=useState<string[]>([]);
  const combo=(e:KeyboardEvent)=>(e.ctrlKey?'Ctrl+':'')+(e.altKey?'Alt+':'')+(e.shiftKey?'Shift+':'')+(e.key.length===1?e.key.toUpperCase():e.key);
  const addPick=async()=>{const p=await window.api.pickExe();if(p)addExe(p)};
  const importEntries=async()=>{const l:Entry[]=await window.api.importEntries();l.forEach(x=>upsert({...x,id:uid(),added:Date.now(),launches:0,lastLaunched:undefined,folder:undefined}));if(l.length)say(`Imported ${l.length} ${l.length>1?'entries':'entry'}`)};
  const switchLib=(n:string)=>setSt(s=>{if(n===s.libName||!s.others[n])return s;const{[n]:t,...rest}=s.others;return{...s,libName:n,entries:t.entries,folders:t.folders,others:{...rest,[s.libName]:{entries:s.entries,folders:s.folders}}}});
  const addLib=(n:string)=>{n=n.trim();if(!n||n===st.libName||st.others[n])return;setSt(s=>({...s,libName:n,entries:[],folders:[],others:{...s.others,[s.libName]:{entries:s.entries,folders:s.folders}}}));setCat('All')};
  const delLib=()=>{const k=Object.keys(st.others)[0];if(!k||!confirm(`Delete library "${st.libName}" and all its entries?`))return;setSt(s=>{const{[k]:t,...rest}=s.others;return{...s,libName:k,entries:t.entries,folders:t.folders,others:rest}});setCat('All')};
  act.current={palette:()=>{setPq('');setPi(0);setPal(true)},newApp:addPick,home:()=>setS({page:'home'}),library:()=>go('All'),settings:()=>setS({page:'settings'}),search:()=>{setS({page:'library'});setTimeout(()=>sref.current?.focus(),50)}};
  useEffect(()=>{const h=(e:KeyboardEvent)=>{
    if(cap){e.preventDefault();if(['Control','Alt','Shift','Meta'].includes(e.key))return;if(e.key!=='Escape')setS({keys:{...K,[cap]:combo(e)}});setCap(null);return}
    const c=combo(e),a=Object.keys(K).find(k=>K[k]===c);if(a){e.preventDefault();act.current[a]?.()}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)});
  useEffect(()=>{const t=setTimeout(()=>window.api.missing(st.entries.map(e=>e.exe)).then(setMiss),500);return()=>clearTimeout(t)},[st.entries]);
  const all=[...st.entries.map(e=>({e,lib:st.libName})),...Object.entries(st.others).flatMap(([n,l])=>l.entries.map(e=>({e,lib:n})))];
  const res=all.filter(x=>(x.e.name+' '+x.e.tags.join(' ')).toLowerCase().includes(pq.toLowerCase())).slice(0,8);
  const pick=(x:{e:Entry,lib:string})=>{setPal(false);if(x.lib===st.libName)launch(x.e);else{switchLib(x.lib);setQ(x.e.name);setCat('All');setS({page:'library'})}};
  const libUI=<><div className="row"><select value={st.libName} onChange={e=>{switchLib(e.target.value);setCat('All')}}>{[st.libName,...Object.keys(st.others)].map(n=><option key={n}>{n}</option>)}</select>
    <button className="mini" title="New library" onClick={()=>setNl('')}>+</button>{Object.keys(st.others).length>0&&<button className="mini" title="Delete this library" onClick={delLib}>🗑</button>}</div>
    {nl!==null&&<input autoFocus placeholder="Library name" value={nl} onChange={e=>setNl(e.target.value)} onBlur={()=>setNl(null)} onKeyDown={e=>{if(e.key==='Enter')addLib(nl);if(e.key==='Enter'||e.key==='Escape')setNl(null)}}/>}</>;
  const S=st.settings,C=S.custom||{},dflt=S.theme==='dark'?{bg:'#0f1115',panel:'#171a21',card:'#1e222b',text:'#e8eaf0'}:{bg:'#f3f4f8',panel:'#ffffff',card:'#ffffff',text:'#161922'};
  const chk=(l:string,k:'anim'|'tray'|'startup'|'startMin')=><label className="inline"><input type="checkbox" checked={S[k]} onChange={e=>setS({[k]:e.target.checked})}/> {l}</label>;
  const settings=<div className="set"><div className="head"><h1>Settings</h1></div>
    <section><h3>Appearance</h3>
      <label>Theme<select value={S.theme} onChange={e=>setS({theme:e.target.value as any})}><option>dark</option><option>light</option></select></label>
      <label>Accent color (HEX)<div className="row"><input type="color" value={S.accent} onChange={e=>setS({accent:e.target.value})}/>
        <input key={S.accent} defaultValue={S.accent} onBlur={e=>/^#[0-9a-f]{6}$/i.test(e.target.value)&&setS({accent:e.target.value})}/></div></label>
      <div className="row">{(['bg','panel','card','text'] as const).map(k=><label key={k}>{k==='bg'?'Background':k==='panel'?'Panels':k==='card'?'Cards':'Text'}<input type="color" value={C[k]||dflt[k]} onChange={e=>setS({custom:{...C,[k]:e.target.value}})}/></label>)}
        <button className="btn ghost" onClick={()=>setS({custom:undefined})}>Reset colors</button></div>
      <label>Font (any installed font)<input list="fonts" value={S.font} placeholder="Default" onChange={e=>setS({font:e.target.value})}/></label>
      <datalist id="fonts">{['Segoe UI','Inter','Arial','Verdana','Consolas','Georgia','Trebuchet MS','Calibri'].map(f=><option key={f} value={f}/>)}</datalist>
      <label>UI scale: {Math.round(S.scale*100)}%<input type="range" min={0.8} max={1.4} step={0.05} value={S.scale} onChange={e=>setS({scale:+e.target.value})}/></label>
      {chk('Enable animations and transitions','anim')}</section>
    <section><h3>Startup & window</h3>
      <label>Startup page<select value={S.startPage} onChange={e=>setS({startPage:e.target.value as any})}><option value="home">Home</option><option value="library">Library</option><option value="last">Last page used</option></select></label>
      {chk('Minimize / close to system tray','tray')}{chk('Launch Nova when Windows starts','startup')}{chk('Start minimized to tray (needs tray enabled)','startMin')}</section>
    <section><h3>Keyboard shortcuts</h3>
      {Object.entries(KNAMES).map(([k,l])=><div key={k} className="row"><span style={{flex:1}}>{l}</span><button className="btn ghost" onClick={()=>setCap(k)}>{cap===k?'Press keys… (Esc cancels)':K[k]}</button></div>)}
      <div><button className="btn ghost" onClick={()=>setS({keys:KEYS})}>Reset shortcuts</button></div></section>
    <section><h3>Backup & configuration</h3>
      <div className="row"><button className="btn" onClick={async()=>say(await window.api.backup(st)?'Backup saved':'Backup cancelled')}>Backup library + images</button>
      <button className="btn ghost" onClick={async()=>{const r=await window.api.restore();if(r){setSt({...DEF,...r,settings:{...DEF.settings,...r.settings}});say('Library restored')}else say('Restore cancelled or invalid file')}}>Restore backup</button></div>
      <div className="row"><button className="btn ghost" onClick={async()=>{const{page,bgImage,...c}=S;say(await window.api.exportCfg(c)?'Settings exported':'Cancelled')}}>Export settings</button>
      <button className="btn ghost" onClick={async()=>{const r=await window.api.importCfg();if(r&&typeof r==='object'){setS({...r,page:'settings'});say('Settings imported')}else say('Import cancelled or invalid file')}}>Import settings</button></div>
      <span className="muted">An automatic .bak copy of your library is also kept beside library.json on every save.</span></section></div>;
  const home=<div><div className="head"><h1>Home</h1><div className="grow"/><details className="wmenu"><summary className="btn ghost">Customize</summary><div className="pop">{(['stats','recent','favs','added'] as const).map(k=><label key={k} className="inline"><input type="checkbox" checked={W[k]} onChange={ev=>setS({widgets:{...W,[k]:ev.target.checked}})}/> {names[k]}</label>)}</div></details></div>
    {W.stats&&<div className="stats"><div><b>{st.entries.length}</b>Apps</div><div><b>{st.entries.filter(e=>e.fav).length}</b>Favorites</div><div><b>{st.entries.reduce((a,e)=>a+e.launches,0)}</b>Total launches</div><div><b>{st.entries.filter(isRun).length}</b>Running</div></div>}
    {W.recent&&<><h3>Recently launched</h3>{tiles(recent)}</>}{W.favs&&<><h3>Favorites</h3>{tiles(favs)}</>}{W.added&&<><h3>Recently added</h3>{tiles(added)}</>}</div>;
  return <div className="app" onClick={()=>setMenu(null)}
    onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();[...e.dataTransfer.files].forEach(f=>{const p=window.api.pathOf(f);if(/\.(exe|bat|lnk|cmd)$/i.test(p))addExe(p)})}}>
    {(hb||st.settings.bgImage)&&<div className="bgimg" style={{backgroundImage:`url(${media(hb||st.settings.bgImage)})`,opacity:1-st.settings.bgDim}}/>}
    <div className="titlebar"><span className="logo">◆ Nova</span><div className="drag"/>
      <button onClick={()=>window.api.win('min')}>–</button><button onClick={()=>window.api.win('max')}>▢</button><button className="x" onClick={()=>window.api.win('close')}>✕</button></div>
    <div className="body">
      <aside>{libUI}<input ref={sref} placeholder="Search library…" value={q} onChange={e=>setQ(e.target.value)}/>
        <div className={'nav '+(st.settings.page==='home'?'on':'')} onClick={()=>setS({page:'home'})}>⌂ Home</div>
        <div className={'nav '+(st.settings.page==='settings'?'on':'')} onClick={()=>setS({page:'settings'})}>⚙ Settings</div>
        {cats.map(c=><div key={c} className={'nav '+(c===cat&&st.settings.page==='library'?'on':'')} onClick={()=>go(c)}>{c}</div>)}
        <div className="sec">Folders <button className="mini" onClick={()=>setNf('')}>+</button></div>
        {nf!==null&&<input autoFocus placeholder="Folder name" value={nf} onChange={ev=>setNf(ev.target.value)} onBlur={()=>setNf(null)} onKeyDown={ev=>{if(ev.key==='Enter'&&nf.trim()&&!st.folders.includes(nf.trim()))setSt(s=>({...s,folders:[...s.folders,nf.trim()]}));if(ev.key==='Enter'||ev.key==='Escape')setNf(null)}}/>}
        {st.folders.map(f=><div key={f} className={'nav '+(cat==='f:'+f&&st.settings.page==='library'?'on':'')} onClick={()=>go('f:'+f)} onContextMenu={ev=>{ev.preventDefault();if(confirm('Delete folder "'+f+'"? Apps are kept.')){setSt(s=>({...s,folders:s.folders.filter(x=>x!==f),entries:s.entries.map(x=>x.folder===f?{...x,folder:undefined}:x)}));setCat('All')}}}>📁 {f}</div>)}
        <div className="grow"/>
        <label>Background<div className="row"><button className="btn ghost" onClick={async()=>{const f=await window.api.pickImage();if(f)setS({bgImage:f})}}>Image</button>{st.settings.bgImage&&<button className="btn ghost" onClick={()=>setS({bgImage:undefined})}>✕</button>}</div></label>
        <label>Dim<input type="range" min={0} max={0.95} step={0.05} value={st.settings.bgDim} onChange={e=>setS({bgDim:+e.target.value})}/></label>
        <label>Accent <input type="color" value={st.settings.accent} onChange={e=>setS({accent:e.target.value})}/></label>
        <label>Theme <select value={st.settings.theme} onChange={e=>setS({theme:e.target.value as any})}><option>dark</option><option>light</option></select></label>
        <label>Card size <input type="range" min={120} max={360} value={st.settings.cardSize} onChange={e=>setS({cardSize:+e.target.value})}/></label>
        <label>View <select value={st.settings.view} onChange={e=>setS({view:e.target.value as any})}><option>grid</option><option>list</option></select></label>
        <label>Sort <select value={st.settings.sort} onChange={e=>setS({sort:e.target.value as any})}><option>manual</option><option>name</option><option>recent</option><option>launches</option><option>added</option></select></label>
      </aside>
      <main>{st.settings.page==='settings'?settings:st.settings.page==='home'?home:<>
        <div className="head"><h1>{cat.replace(/^f:/,'')}</h1><span className="muted">{st.entries.length} total</span><div className="grow"/>
          <button className="btn ghost" onClick={importEntries}>Import entry</button><button className="btn" onClick={addPick}>+ Add app</button></div>
        {cat==='All'&&!q&&recent.length>0&&<><h3>Recently launched</h3><div className="row">{recent.map(e=><button key={e.id} className="chip" onClick={()=>launch(e)}>
          {e.icon&&<img src={media(e.icon)}/>}{e.name}</button>)}</div></>}
        {list.length===0&&<div className="empty">Drop an .exe here or click “Add app”.</div>}
        <div className={'lib '+st.settings.view} style={{'--s':st.settings.cardSize+'px'} as any}>
          {list.map(e=><div key={e.id} className="card" draggable onDragStart={()=>drag.current=e.id} onDragOver={ev=>ev.preventDefault()}
            onDrop={ev=>{ev.stopPropagation();reorder(e.id)}} onContextMenu={ev=>{ev.preventDefault();setMenu({x:ev.clientX,y:ev.clientY,e})}} onDoubleClick={()=>launch(e)} onMouseEnter={()=>setHb(e.bg)} onMouseLeave={()=>setHb(undefined)}>
            <Cover e={e}>{isRun(e)&&<span className="live">● Running</span>}{miss.includes(e.exe)&&<span className="live warn">⚠ Missing</span>}
              <button className="star" onClick={ev=>{ev.stopPropagation();upsert({...e,fav:!e.fav})}}>{e.fav?'★':'☆'}</button>
              <button className="play" onClick={ev=>{ev.stopPropagation();launch(e)}}>▶ Play</button></Cover>
            <div className="meta"><b>{e.name}</b><span className="muted">{e.category||'Uncategorized'} · {e.launches} launches</span></div></div>)}
        </div>
      </>}</main></div>
    {menu&&<div className="menu" style={{left:menu.x,top:menu.y}}>
      <div onClick={()=>launch(menu.e)}>Launch</div><div onClick={()=>setEdit(menu.e)}>Edit</div>
      <div onClick={()=>upsert({...menu.e,id:uid(),name:menu.e.name+' (copy)',added:Date.now()})}>Duplicate</div>
      <div onClick={()=>window.api.reveal(menu.e.exe)}>Show in folder</div>
      <div onClick={async()=>say(await window.api.exportEntry(menu.e)?'Entry exported':'Export cancelled')}>Export entry…</div>
      <div className="danger" onClick={()=>setSt(s=>({...s,entries:s.entries.filter(x=>x.id!==menu.e.id)}))}>Remove</div></div>}
    {edit&&<Editor e={edit} folders={st.folders} onClose={()=>setEdit(null)} onSave={x=>{upsert(x);setEdit(null)}}/>}
    {pal&&<div className="modal top" onClick={()=>setPal(false)}><div className="pal" onClick={e=>e.stopPropagation()}>
      <input autoFocus placeholder="Search all libraries — Enter to launch" value={pq} onChange={e=>{setPq(e.target.value);setPi(0)}} onKeyDown={e=>{
        if(e.key==='Escape')setPal(false);if(e.key==='ArrowDown'){e.preventDefault();setPi(Math.min(pi+1,res.length-1))}
        if(e.key==='ArrowUp'){e.preventDefault();setPi(Math.max(pi-1,0))}if(e.key==='Enter'&&res[pi])pick(res[pi])}}/>
      {res.map((x,i)=><div key={x.e.id+x.lib} className={'pit '+(i===pi?'on':'')} onClick={()=>pick(x)} onMouseEnter={()=>setPi(i)}>{x.e.icon&&<img src={media(x.e.icon)}/>}<b>{x.e.name}</b><span className="muted">{x.lib}</span></div>)}
      {!res.length&&<div className="muted pit">No matches</div>}</div></div>}
    {toast&&<div className="toast">{toast}</div>}</div>}
function Editor({e,folders,onSave,onClose}:{e:Entry,folders:string[],onSave:(e:Entry)=>void,onClose:()=>void}){
  const [d,setD]=useState(e);const set=(p:Partial<Entry>)=>setD(x=>({...x,...p}));
  const F=(l:string,k:'name'|'args'|'cwd'|'desc'|'category')=><label>{l}<input value={d[k]} onChange={ev=>set({[k]:ev.target.value})}/></label>;
  return <div className="modal" onClick={onClose}><div className="dlg" onClick={ev=>ev.stopPropagation()}><h2>Edit entry</h2>
    {F('Name','name')}
    <label>Executable<div className="row"><input value={d.exe} onChange={ev=>set({exe:ev.target.value})}/>
      <button className="btn" onClick={async()=>{const p=await window.api.pickExe();if(p)set({exe:p})}}>Browse</button></div></label>
    {F('Launch arguments','args')}{F('Working directory','cwd')}{F('Category','category')}<label>Folder<select value={d.folder||''} onChange={ev=>set({folder:ev.target.value||undefined})}><option value="">None</option>{folders.map(f=><option key={f}>{f}</option>)}</select></label>{F('Description','desc')}
    <label>Tags (comma separated)<input value={d.tags.join(', ')} onChange={ev=>set({tags:ev.target.value.split(',').map(t=>t.trim()).filter(Boolean)})}/></label>
    <label className="inline"><input type="checkbox" checked={d.admin} onChange={ev=>set({admin:ev.target.checked})}/> Run as administrator</label>
    <label className="inline"><input type="checkbox" checked={!!d.minimize} onChange={ev=>set({minimize:ev.target.checked})}/> Minimize launcher after launching</label>
    <label>Environment variables (KEY=VALUE per line; not applied when running as admin)<textarea rows={3} value={d.env||''} onChange={ev=>set({env:ev.target.value})}/></label>
    <div className="row">
      <button className="btn ghost" onClick={async()=>{const f=await window.api.pickImage();if(f)set({icon:f})}}>Custom icon</button>
      <button className="btn ghost" onClick={async()=>{const f=await window.api.extractIcon(d.exe);if(f)set({icon:f})}}>Extract from exe</button>
      <button className="btn ghost" onClick={async()=>{const f=await window.api.pickImage();if(f)set({cover:f})}}>Cover image</button>
      <button className="btn ghost" onClick={async()=>{const f=await window.api.pickImage();if(f)set({bg:f})}}>Background</button>{d.bg&&<button className="btn ghost" onClick={()=>set({bg:undefined})}>Clear bg</button>}
      {d.cover&&<button className="btn ghost" onClick={()=>set({cover:undefined})}>Clear cover</button>}</div>
    {d.cover&&<div className="pv"><div style={{width:130}}><Cover e={d}/></div><div className="sl">{(['x','y','z'] as const).map(k=>{const P=d.coverPos||{x:50,y:50,z:1};return <label key={k}>{k==='z'?'Zoom':k==='x'?'Horizontal':'Vertical'}<input type="range" min={k==='z'?1:0} max={k==='z'?3:100} step={k==='z'?0.05:1} value={P[k]} onChange={ev=>set({coverPos:{...P,[k]:+ev.target.value}})}/></label>})}<button className="btn ghost" onClick={()=>set({coverPos:undefined})}>Reset</button></div></div>}
    <div className="row end"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={()=>onSave(d)}>Save</button></div></div></div>}

function Cover({e,children}:{e:Entry,children?:any}){const p=e.coverPos||{x:50,y:50,z:1};
  return <div className="cover">{e.cover?<img className="cimg" src={media(e.cover)} style={{objectPosition:`${p.x}% ${p.y}%`,transform:`scale(${p.z})`,transformOrigin:`${p.x}% ${p.y}%`}}/>:e.icon&&<img className="ico" src={media(e.icon)}/>}{children}</div>}
