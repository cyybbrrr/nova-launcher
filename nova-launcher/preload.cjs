const {contextBridge,ipcRenderer,webUtils,webFrame}=require('electron');
const i=n=>(...a)=>ipcRenderer.invoke(n,...a);
contextBridge.exposeInMainWorld('api',{load:i('load'),save:i('save'),pickExe:i('pickExe'),pickImage:i('pickImage'),extractIcon:i('extractIcon'),
 launch:i('launch'),running:i('running'),reveal:i('reveal'),sys:i('sys'),exportEntry:i('exportEntry'),importEntries:i('importEntries'),missing:i('missing'),backup:i('backup'),restore:i('restore'),exportCfg:i('exportCfg'),importCfg:i('importCfg'),zoom:z=>webFrame.setZoomFactor(z),win:a=>ipcRenderer.send('win',a),pathOf:f=>webUtils.getPathForFile(f)});
