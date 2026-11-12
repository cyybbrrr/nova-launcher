const {app,BrowserWindow,ipcMain,dialog,protocol,net,shell,Tray,Menu,nativeImage}=require('electron');
const path=require('path'),fs=require('fs'),{spawn}=require('child_process'),{pathToFileURL}=require('url');
const DATA=()=>app.getPath('userData'),DB=()=>path.join(DATA(),'library.json'),IMG=()=>path.join(DATA(),'images');
protocol.registerSchemesAsPrivileged([{scheme:'media',privileges:{standard:true,supportFetchAPI:true,secure:true}}]);
let W,T,sys={tray:false,startup:false,startMin:false},quitting=false;
function win(){
  const hidden=process.argv.includes('--hidden');
  W=new BrowserWindow({width:1280,height:800,minWidth:900,minHeight:600,frame:false,show:false,backgroundColor:'#0f1115',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true}});
  W.once('ready-to-show',()=>{if(!(hidden&&sys.tray))W.show()});
  W.on('close',e=>{if(sys.tray&&!quitting){e.preventDefault();W.hide()}});
  W.on('minimize',()=>{if(sys.tray)W.hide()});
  const dev = process.argv.includes('--dev');
  if (dev) {
    W.loadURL('http://localhost:5173');
    W.webContents.openDevTools({ mode: 'detach' });
  } else {
    W.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
  W.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('Nova failed to load:', code, description, url);
  });
}
function mkTray(){
  const b=Buffer.alloc(16*16*4);for(let i=0;i<256;i++){b[i*4]=0xff;b[i*4+1]=0x5c;b[i*4+2]=0x7c;b[i*4+3]=0xff}
  T=new Tray(nativeImage.createFromBitmap(b,{width:16,height:16}));T.setToolTip('Nova Launcher');
  const show=()=>{W.show();W.focus()};T.on('click',show);
  T.setContextMenu(Menu.buildFromTemplate([{label:'Open Nova',click:show},{label:'Quit',click:()=>{quitting=true;app.quit()}}]));
}
const mkEnv=t=>{const v={...process.env};String(t||'').split(/\r?\n/).forEach(l=>{const i=l.indexOf('=');if(i>0)v[l.slice(0,i).trim()]=l.slice(i+1).trim()});return v};
app.on('before-quit',()=>{quitting=true});
const jsonDlg=async(save,name)=>save?dialog.showSaveDialog({defaultPath:name,filters:[{name:'JSON',extensions:['json']}]}):dialog.showOpenDialog({properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]});
app.whenReady().then(()=>{
  fs.mkdirSync(IMG(),{recursive:true});
  protocol.handle('media',r=>net.fetch(pathToFileURL(path.join(IMG(),path.basename(decodeURIComponent(new URL(r.url).pathname.slice(1))))).toString()));
  ipcMain.handle('load',()=>{try{return JSON.parse(fs.readFileSync(DB(),'utf8'))}catch{return null}});
  ipcMain.handle('save',(_,s)=>{const t=DB()+'.tmp';fs.writeFileSync(t,JSON.stringify(s,null,1));fs.renameSync(t,DB());
    fs.copyFileSync(DB(),DB()+'.bak');return true});
  ipcMain.handle('pickExe',async()=>{const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Executables',extensions:['exe','bat','lnk','cmd']}]});return r.canceled?null:r.filePaths[0]});
  ipcMain.handle('pickImage',async()=>{const r=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Images',extensions:['png','jpg','jpeg','ico','webp']}]});
    if(r.canceled)return null;const n=Date.now()+'-'+Math.random().toString(36).slice(2,6)+path.extname(r.filePaths[0]).toLowerCase();fs.copyFileSync(r.filePaths[0],path.join(IMG(),n));return n});
  ipcMain.handle('extractIcon',async(_,exe)=>{try{const i=await app.getFileIcon(exe,{size:'large'});const n=Date.now()+'-icon.png';
    fs.writeFileSync(path.join(IMG(),n),i.toPNG());return n}catch{return null}});
  ipcMain.handle('launch',(_,e)=>{
    if(!fs.existsSync(e.exe))return{ok:false,error:'Executable not found: '+e.exe};
    const cwd=e.cwd&&fs.existsSync(e.cwd)?e.cwd:path.dirname(e.exe);
    try{
      if(e.admin){const q=s=>"'"+s.replace(/'/g,"''")+"'";
        const a=e.args?` -ArgumentList ${q(e.args)}`:'';
        spawn('powershell',['-NoProfile','-Command',`Start-Process -FilePath ${q(e.exe)} -WorkingDirectory ${q(cwd)} -Verb RunAs${a}`],{detached:true,stdio:'ignore'}).unref();
      }else spawn(`"${e.exe}"`,[e.args||''].filter(Boolean),{cwd,detached:true,stdio:'ignore',shell:true,env:mkEnv(e.env)}).unref();
      return{ok:true}}catch(x){return{ok:false,error:String(x.message)}}});
  ipcMain.handle('running',()=>new Promise(r=>require('child_process').exec('tasklist /fo csv /nh',(e,o)=>r((o||'').split('\n').map(l=>(l.split('","')[0]||'').replace('"','').toLowerCase())))));
  ipcMain.handle('reveal',(_,p)=>shell.showItemInFolder(p));
  ipcMain.on('win',(e,a)=>{const w=BrowserWindow.fromWebContents(e.sender);a==='min'?w.minimize():a==='max'?(w.isMaximized()?w.unmaximize():w.maximize()):w.close()});
  ipcMain.handle('sys',(_,s)=>{sys=s;app.setLoginItemSettings({openAtLogin:!!s.startup,args:s.startMin?['--hidden']:[]})});
  ipcMain.handle('backup',async(_,state)=>{const r=await jsonDlg(true,'nova-backup.json');if(r.canceled)return false;
    const images={};for(const f of fs.readdirSync(IMG()))images[f]=fs.readFileSync(path.join(IMG(),f)).toString('base64');
    fs.writeFileSync(r.filePath,JSON.stringify({v:1,state,images}));return true});
  ipcMain.handle('restore',async()=>{const r=await jsonDlg(false);if(r.canceled)return null;
    try{const j=JSON.parse(fs.readFileSync(r.filePaths[0],'utf8'));if(!j.state)return null;
      for(const[f,b]of Object.entries(j.images||{}))fs.writeFileSync(path.join(IMG(),path.basename(f)),Buffer.from(b,'base64'));return j.state}catch{return null}});
  ipcMain.handle('exportCfg',async(_,c)=>{const r=await jsonDlg(true,'nova-settings.json');if(r.canceled)return false;fs.writeFileSync(r.filePath,JSON.stringify(c,null,1));return true});
  ipcMain.handle('importCfg',async()=>{const r=await jsonDlg(false);if(r.canceled)return null;try{return JSON.parse(fs.readFileSync(r.filePaths[0],'utf8'))}catch{return null}});
  const IMGK=['icon','cover','bg'],rnd=()=>Date.now()+'-'+Math.random().toString(36).slice(2,6);
  ipcMain.handle('missing',(_,ps)=>ps.filter(p=>p&&!fs.existsSync(p)));
  ipcMain.handle('exportEntry',async(_,e)=>{const r=await jsonDlg(true,(e.name||'entry').replace(/[^\w-]+/g,'_')+'.nova.json');if(r.canceled)return false;
    const images={};for(const k of IMGK){if(e[k]){try{images[k]={ext:path.extname(e[k]),b64:fs.readFileSync(path.join(IMG(),path.basename(e[k]))).toString('base64')}}catch{}}}
    fs.writeFileSync(r.filePath,JSON.stringify({v:1,entry:e,images}));return true});
  ipcMain.handle('importEntries',async()=>{const r=await dialog.showOpenDialog({properties:['openFile','multiSelections'],filters:[{name:'Nova entry',extensions:['json']}]});
    if(r.canceled)return[];const out=[];
    for(const fp of r.filePaths){try{const j=JSON.parse(fs.readFileSync(fp,'utf8'));if(!j.entry)continue;const e=j.entry;
      for(const k of IMGK){delete e[k];const im=j.images&&j.images[k];if(im){const n=rnd()+(String(im.ext).replace(/[^.\w]/g,'')||'.png');fs.writeFileSync(path.join(IMG(),n),Buffer.from(im.b64,'base64'));e[k]=n}}
      out.push(e)}catch{}}return out});
  try{const d=JSON.parse(fs.readFileSync(DB(),'utf8')).settings||{};sys={tray:!!d.tray,startup:!!d.startup,startMin:!!d.startMin}}catch{}
  win();mkTray();
});
