#!/usr/bin/env node
let SETTINGS_PATH = null;
/* Modultool – Node Core (no deps)
   Start:
     node server.js --root ~/modultool_project --port 8787 --host 127.0.0.1
*/

const http = require('http');


function readSettingsFile(projectRoot){
  try{
    const p = path.join(projectRoot,'settings.json');
    if(!fs.existsSync(p)) return {paths:{project_root: projectRoot}, ui:{}, accessibility:{}};
    const j = JSON.parse(fs.readFileSync(p,'utf8'));
    if(!j.paths) j.paths = {project_root: projectRoot};
    if(!j.ui) j.ui = {};
    if(!j.accessibility) j.accessibility = {};
    if(!j.paths.project_root) j.paths.project_root = projectRoot;
    return j;
  }catch(e){
    return {paths:{project_root: projectRoot}, ui:{}, accessibility:{}, _error:'settings_parse_failed'};
  }
}
function writeSettingsFile(projectRoot, j){
  const p = path.join(projectRoot,'settings.json');
  fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
  return true;
}
function setStatus(level,msg,extra){
  __LAST_STATUS = {level: level||'READY', msg: msg||'', ts: Date.now(), extra: extra||null};
}

function updateRegistry(projectRoot, patch){
  try{
    const p = path.join(__dirname,'registry.json');
    let r = {};
    try{ r = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ r = {}; }
    r = Object.assign({}, r, patch);

function scanMarkers(repoRoot){
  const markers = [];
  const exDirs = new Set(['node_modules','.git','dist','build','out','.cache']);
  const exFiles = new Set(['package-lock.json']);
  const pats = [
    {k:'TODO', r:/\bTODO\b/g},
    {k:'FIXME', r:/\bFIXME\b/g},
    {k:'PLACEHOLDER', r:/placeholder/ig},
    {k:'PLATZHALTER', r:/platzhalter/ig},
  ];
  const allowedExt = new Set(['.js','.html','.css','.md','.json','.txt','.sh']);
  function walk(dir){
    let items = [];
    try{ items = fs.readdirSync(dir, {withFileTypes:true}); }catch(e){ return; }
    for(const it of items){
      if(it.name.startsWith('.runtime')) continue;
      const p = path.join(dir, it.name);
      if(it.isDirectory()){
        if(exDirs.has(it.name)) continue;
        walk(p);
      }else{
        if(exFiles.has(it.name)) continue;
        const ext = path.extname(it.name).toLowerCase();
        if(!allowedExt.has(ext)) continue;
        let txt='';
        try{ txt = fs.readFileSync(p,'utf8'); }catch(e){ continue; }
        for(const pat of pats){
          let m;
          while((m = pat.r.exec(txt))!==null){
            const idx = m.index;
            // line number
            const before = txt.slice(0, idx);
            const line = before.split('\n').length;
            markers.push({type:pat.k, file: path.relative(repoRoot,p), line});
            if(markers.length>5000) return;
          }
        }
        if(markers.length>5000) return;
      }
      if(markers.length>5000) return;
    }
  }
  walk(repoRoot);
  return markers;
}


    fs.writeFileSync(p, JSON.stringify(r, null, 2), 'utf8');
    return r;
  }catch(e){ return null; }
}

const net = require('net');
// ---- v0.4.6: GLOBALS (server + root) ----
let __SERVER_INSTANCE = null;
let __PROJECT_ROOT = null;
let __BOUND_PORT = null;
// ---- /v0.4.6: V046_GLOBALS ----

// ---- v0.4.1: SAFE MODE + Anti-Crash Shield (laienfreundlich) ----
let __SAFE_MODE = false;
let __FATAL = null;

function nowIso(){ return new Date().toISOString(); }

function setFatal(err, context){
  __FATAL = {
    ts: nowIso(),
    context: context || 'unknown',
    message: String(err && err.message ? err.message : err),
    stack: String(err && err.stack ? err.stack : '')
  };
}

function selftestServerFile(){

// ---- v0.4.2: AUTO-FIX (Safe Mode) ----
function autoFixServerFile(){
  // Fixes common patching accidents by removing route logic after module.exports.
  try{
    const file = fs.readFileSync(__filename, 'utf8');
    const m = file.match(/module\.exports\s*=\s*\{[\s\S]*?\};\s*/);
    if(!m) return {ok:false, code:'no_module_exports', msg:'module.exports Block nicht gefunden.'};
    const fixed = file.slice(0, m.index + m[0].length) + '\n';
    if(fixed === file) return {ok:true, changed:false, msg:'Keine Reparatur nötig.'};
    // Backup first
    const bak = __filename + '.bak_' + new Date().toISOString().replace(/[:]/g,'-');
    fs.writeFileSync(bak, file, 'utf8');
    fs.writeFileSync(__filename, fixed, 'utf8');
    return {ok:true, changed:true, backup: bak, msg:'server.js repariert. Backup erstellt.'};
  }catch(e){
    return {ok:false, code:'autofix_fail', msg:String(e && e.message ? e.message : e)};
  }
}
// ---- /v0.4.2: V042_AUTOFIX ----
  // Heuristic checks that prevent the classic "req is not defined" startup crash.
  try{
    const file = fs.readFileSync(__filename, 'utf8');
    const mexp = file.lastIndexOf('module.exports');
    if(mexp !== -1){
      const tail = file.slice(mexp);
      if(tail.includes('req.url') || tail.includes('res.writeHead') || tail.includes('createServer((req')){
        return {ok:false, code:'routes_after_exports', msg:'Routen-Logik steht hinter module.exports (req/res out-of-scope).'};
      }
    }
    // also block accidental top-level req usage
    const top = file.slice(0, 8000);
    if(top.includes('if(req.url') && !top.includes('createServer((req')){
      // weak signal, ignore
      /* ignore */
    }
    return {ok:true};
  }catch(e){
    return {ok:false, code:'selftest_read_fail', msg:'Selftest konnte server.js nicht lesen.'};
  }
}

process.on('uncaughtException', (err)=>{
  try{ setFatal(err, 'uncaughtException'); }catch(e){}
  try{ console.error('[Modultool] FATAL:', err); }catch(e){}
  // Stay alive so UI can show repair options (do NOT crash)
});

process.on('unhandledRejection', (reason)=>{
  try{ setFatal(reason, 'unhandledRejection'); }catch(e){}
  try{ console.error('[Modultool] FATAL (promise):', reason); }catch(e){}
});

// Minimal Safe UI (no dependencies)
function safeHtml(){
  const f = __FATAL;
  const msg = f ? (f.context + ': ' + f.message) : 'Selftest hat einen Startfehler erkannt.';
  const stack = f ? f.stack : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Modultool – Safe Mode</title>
  <style>
    body{background:#120f0d;color:#f2e9e1;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0}
    .wrap{max-width:980px;margin:28px auto;padding:0 16px}
    .card{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:16px 16px 14px;box-shadow:0 10px 40px rgba(0,0,0,.35)}
    h1{font-size:18px;margin:0 0 6px}
    .mut{color:rgba(242,233,225,.75);font-weight:800;font-size:13px;line-height:1.4}
    .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;white-space:pre-wrap;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);padding:10px;border-radius:12px;margin-top:10px}
    .row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
    button{cursor:pointer;border-radius:12px;border:1px solid rgba(255,255,255,.12);padding:10px 12px;font-weight:900;background:rgba(255,122,26,.18);color:#f2e9e1}
    button.secondary{background:rgba(0,0,0,.25)}
    select{border-radius:12px;border:1px solid rgba(255,255,255,.12);padding:10px 12px;font-weight:900;background:rgba(0,0,0,.25);color:#f2e9e1}
    .ok{display:inline-flex;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.10);background:rgba(255,61,26,.18);font-weight:1000;font-size:12px}
  </style></head><body><div class="wrap">
  <div class="card">
    <div class="ok">SAFE MODE</div>
    <h1>Startfehler erkannt – Tool läuft im Reparaturmodus</h1>
    <div class="mut">${escapeHtml(msg)}<br/>Du kannst hier per Button Diagnose ziehen oder Preflight-Reparatur ausführen. Nichts stürzt ab.</div>
    <div class="row">
      <button id="btnPreflight">Preflight + Reparatur</button>
      <button class="secondary" id="btnOpenSafeUrl">↗ Öffnen</button>
      <button id="btnAutoFix">Auto-Fix anwenden</button>
      <button class="secondary" id="btnDiag">Diagnose kopieren</button>
      <button class="secondary" id="btnLogTail">Logs (letzte 60) kopieren</button>
      <button class="secondary" id="btnReport">Report-ZIP erstellen</button>
      <select id="selAction" aria-label="Aktion wählen">
        <option value="none">Aktion wählen…</option>
        <option value="restart">Server neu starten</option>
        <option value="open">Zur Startseite wechseln</option>
      </select>
      <button class="secondary" id="btnGo">Ausführen</button>
    </div>
    <div class="mono" id="out">${escapeHtml(stack||'')}</div>
  </div>
  <script>
    async function post(url){ const r=await fetch(url,{method:'POST'}); return r.json(); }
    async function get(url){ const r=await fetch(url,{cache:'no-store'}); return r.json(); }
    const out=document.getElementById('out');
    document.getElementById('btnPreflight').onclick=async ()=>{
      out.textContent='…';
      try{ out.textContent=JSON.stringify(await post('/api/preflight'),null,2); }catch(e){ out.textContent=String(e); }
    };
    document.getElementById('btnAutoFix').onclick=async ()=>{
      out.textContent='…';
      try{ out.textContent=JSON.stringify(await post('/api/safe/autofix'),null,2); }catch(e){ out.textContent=String(e); }
    };
    document.getElementById('btnDiag').onclick=async ()=>{
      try{ const j=await get('/api/safe/diag'); await navigator.clipboard.writeText(JSON.stringify(j,null,2)); }catch(e){}
    };

    document.getElementById('btnLogTail').onclick=async ()=>{
      try{ out.textContent='…'; const j=await get('/api/safe/logtail'); out.textContent = (j && j.ok) ? (j.tail || '(leer)') : 'Fehler'; }catch(e){ out.textContent=String(e); }
    };

    document.getElementById('btnDiag').onclick=async ()=>{
  if(req.url && req.url.startsWith('/api/log/event') && req.method==='POST'){
    return readJson(req, (body)=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const logp = ensureEventLog(pr);
        const ev = Object.assign({ts: Date.now(), type:'event'}, body||{});
        if(logp) appendLine(logp, JSON.stringify(ev));
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true}));
      }catch(e){
        __LAST_ERROR = e;
        setStatus('WARN','Eventlog fehlgeschlagen');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'eventlog_failed'}));
      }
    });
  }
  if(req.url && req.url.startsWith('/api/snippets/list')){
    try{
      const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
      const p = ensureSnippetsFile(pr);
      let j = {version:1, updated: Date.now(), items:[]};
      try{ j = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){}
      if(!Array.isArray(j.items)) j.items = [];
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, data:j}));
    }catch(e){
      __LAST_ERROR = e;
      setStatus('WARN','Snippets laden fehlgeschlagen');
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:false, error:'snippets_list_failed'}));
    }
  }

  if(req.url && req.url.startsWith('/api/snippets/save') && req.method==='POST'){
    return readJson(req, (body)=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const p = ensureSnippetsFile(pr);
        let j = {version:1, updated: Date.now(), items:[]};
        try{ j = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){}
        if(!Array.isArray(j.items)) j.items = [];
        const it = body && body.item ? body.item : null;
        if(!it || !it.title || !it.text){
          res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
          return res.end(JSON.stringify({ok:false, error:'missing_fields'}));
        }
        const now = Date.now();
        const item = {
          id: it.id ? String(it.id) : ('snip_' + now + '_' + Math.floor(Math.random()*100000)),
          title: String(it.title).slice(0,120),
          text: String(it.text).slice(0,20000),
          key: (typeof it.key==='number' && it.key>=1 && it.key<=12) ? it.key : null,
          updated: now
        };
        const idx = j.items.findIndex(x=>x.id===item.id);
        // snippet_history: when text changes, store old text for later copy
        if(idx>=0){
          try{
            const prev = j.items[idx];
            if(prev && typeof prev.text==='string' && prev.text !== item.text){
              const hp = ensureSnippetsHistory(pr);
              if(hp){
                const line = JSON.stringify({
                  ts: Date.now(),
                  id: prev.id,
                  title: prev.title || '',
                  key: (typeof prev.key==='number') ? prev.key : null,
                  text: prev.text
                });
                appendLine(hp, line);
              }
            }
          }catch(e){}
        }
        if(idx>=0) j.items[idx] = Object.assign({}, j.items[idx], item);
        else j.items.push(item);
        // ensure unique key assignment
        if(item.key!==null){
          j.items = j.items.map(x=>{
            if(x.id!==item.id && x.key===item.key){
              return Object.assign({}, x, {key:null});
            }
            return x;
          });
        }
        j.updated = now;
        safeWriteJson(p, j);
        setStatus('READY','Snippets gespeichert');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, data:j}));
      }catch(e){
        __LAST_ERROR = e;
        setStatus('WARN','Snippets speichern fehlgeschlagen');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'snippets_save_failed'}));
      }
    });
  }

  if(req.url && req.url.startsWith('/api/snippets/delete') && req.method==='POST'){
    return readJson(req, (body)=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const p = ensureSnippetsFile(pr);
        let j = {version:1, updated: Date.now(), items:[]};
        try{ j = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){}
        if(!Array.isArray(j.items)) j.items = [];
        const id = body && body.id ? String(body.id) : '';
        j.items = j.items.filter(x=>x.id!==id);
        j.updated = Date.now();
        safeWriteJson(p, j);
        setStatus('READY','Snippet gelöscht');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, data:j}));
      }catch(e){
        __LAST_ERROR = e;
        setStatus('WARN','Snippet löschen fehlgeschlagen');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'snippets_delete_failed'}));
      }
    });
  }

  if(req.url && req.url.startsWith('/api/snippets/history')){
    try{
      const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
      const hp = ensureSnippetsHistory(pr);
      let lines = [];
      try{
        const raw = fs.readFileSync(hp,'utf8');
        lines = raw.split(/
/).filter(Boolean).slice(-500); // cap
      }catch(e){}
      const items = [];
      for(let i=lines.length-1;i>=0;i--){
        try{ items.push(JSON.parse(lines[i])); }catch(e){}
      }
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, items}));
    }catch(e){
      __LAST_ERROR = e;
      setStatus('WARN','Snippet-History laden fehlgeschlagen');
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:false, error:'snippets_history_failed'}));
    }
  }


  if(req.url && req.url.startsWith('/api/status')){
    const out = {ok:true, status: __LAST_STATUS, last_error: __LAST_ERROR ? String(__LAST_ERROR).slice(0,500) : null};
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify(out));
  }


  if(req.url && req.url.startsWith('/api/scan/status')){
    try{
      const p = path.join(__dirname,'registry.json');
      let r = {};
      try{ r = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ r = {}; }
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, registry:r}));
    }catch(e){
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:false, error:'scan_status_failed'}));
    }
  }

  if(req.url && req.url.startsWith('/api/scan/run') && req.method==='POST'){
    return readJson(req, ()=>{
      try{
        const repoRoot = __dirname;
        const found = scanMarkers(repoRoot);
        const summary = { last_scan: Date.now(), markers_found: found, markers_count: found.length };
        const r = updateRegistry(repoRoot, summary) || summary;
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, count: found.length, registry: r}));
      }catch(e){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'scan_run_failed'}));
      }
    });
  }


  if(req.url && req.url.startsWith('/api/settings/get')){
    try{
      const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
      const st = readSettingsFile(pr);
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, settings: st}));
    }catch(e){
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:false, error:'settings_get_failed'}));
    }
  }

  if(req.url && req.url.startsWith('/api/settings/set') && req.method==='POST'){
    return readJson(req, (body)=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const cur = readSettingsFile(pr);
        const next = Object.assign({}, cur, body||{});
        // keep project_root truth single-source
        next.paths = next.paths || {};
        next.paths.project_root = pr;
        writeSettingsFile(pr, next);
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, settings: next}));
      }catch(e){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'settings_set_failed'}));
      }
    });
  }


  if(req.url && req.url.startsWith('/api/selfrepair/run') && req.method==='POST'){
    return readJson(req, ()=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const fixes = [];
        ['logs','exports','backups','data'].forEach(d=>{
          try{ ensureDir(path.join(pr,d)); fixes.push('ok:'+d); }catch(e){ fixes.push('fail:'+d); }
        });
        const settingsPath = path.join(pr, 'settings.json');
        if(!fs.existsSync(settingsPath)){
          try{ fs.writeFileSync(settingsPath, JSON.stringify({paths:{project_root: pr}}, null, 2), 'utf8'); fixes.push('created:settings.json'); }catch(e){}
        }
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, fixes}));
      }catch(e){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'selfrepair_failed'}));
      }
    });
  }
  if(req.url && req.url.startsWith('/api/export/logs') && req.method==='POST'){
    return readJson(req, ()=>{
      try{
        const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
        const logsDir = path.join(pr,'logs');
        const outDir = path.join(pr,'exports');
        try{ fs.mkdirSync(outDir, {recursive:true}); }catch(e){}
        const stamp = new Date().toISOString().replace(/[:.]/g,'-');
        const outFile = path.join(outDir, 'logs_export_' + stamp + '.txt');
        let buf = '';
        if(fs.existsSync(logsDir)){
          const files = fs.readdirSync(logsDir).filter(f=>f.endsWith('.log')||f.endsWith('.txt')).sort();
          for(const f of files){
            const fp = path.join(logsDir,f);
            try{
              buf += '===== ' + f + ' =====\n';
              buf += fs.readFileSync(fp,'utf8') + '\n\n';
            }catch(e){}
          }
        }else{
          buf = 'Keine Logs vorhanden.\n';
        }
        fs.writeFileSync(outFile, buf, 'utf8');
        setStatus('READY','Log exportiert', {file: outFile});
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, file: outFile}));
      }catch(e){
        __LAST_ERROR = e;
        setStatus('WARN','Log export fehlgeschlagen');
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'log_export_failed'}));
      }
    });
  }




  if(req.url && req.url.startsWith('/api/exit') && req.method==='POST'){
    return readJson(req, (body)=>{
      try{
        const save = body && body.save;
        if(save){
          try{
            const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
            ensureDir(path.join(pr,'logs'));
            fs.writeFileSync(path.join(pr,'logs','last_exit.json'), JSON.stringify({ts:Date.now(), save:true}, null, 2), 'utf8');
          }catch(e){}
        }
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        res.end(JSON.stringify({ok:true, save:!!save}));
        setTimeout(()=>{ try{ server.close(()=>process.exit(0)); }catch(e){ process.exit(0);} }, 250);
      }catch(e){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        res.end(JSON.stringify({ok:false, error:'exit_failed'}));
      }
    });
  }



  if(req.url && req.url.startsWith('/api/safe/logtail')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    try{
      const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
      const lf = path.join(pr, 'logs', 'modultool.log');
      let text = '';
      if(fs.existsSync(lf)){
        const all = fs.readFileSync(lf, 'utf8').split('\n');
        text = all.slice(Math.max(0, all.length-60)).join('\n');
      }
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, logfile: lf, tail: text}));
    }catch(e){
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:false, error:'read_failed'}));
    }
  }

      try{ const j=await get('/api/safe/diag'); await navigator.clipboard.writeText(JSON.stringify(j,null,2)); }catch(e){}
    };
    
    document.getElementById('btnOpenSafeUrl').onclick=async ()=>{
      try{
        const r = await fetch('/api/runtime/status', {cache:'no-store'});
        const j = await r.json();
        if(j && j.ok){
          const url = 'http://' + j.host + ':' + j.port + '/safe';
          window.open(url, '_blank', 'noopener');
        }
      }catch(e){}
    };

    document.getElementById('btnReport').onclick=async ()=>{
      out.textContent='…';
      try{ out.textContent=JSON.stringify(await post('/api/safe/report'),null,2); }catch(e){ out.textContent=String(e); }
    };
    document.getElementById('btnGo').onclick=async ()=>{
      const v=document.getElementById('selAction').value;
      if(v==='restart'){ out.textContent='Neustart…'; await post('/api/safe/restart'); }
      if(v==='open'){ location.href='/'; }
    };
  </script></div></body></html>`;
}

function startSafeServer(opts, projectRoot){
  __SAFE_MODE = true;
  const server = http.createServer((req, res)=>{
  // V054_SAFE_ROOT_REDIRECT: wenn Safe Mode aktiv, "/" => "/safe"
  try{
    if(__SAFE_MODE && (req.url === '/' || req.url === '' || req.url === '/index.html')){
      res.writeHead(302, {'location':'/safe'});
      return res.end();
    }
  }catch(e){}

    // v0.4.6: expose server instance for logout/shutdown
    __SERVER_INSTANCE = server;

    try{
      if(req.url && (req.url === '/safe' || req.url === '/safe/')){
        res.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
        return res.end(safeHtml());
      }
      if(req.url && req.url.startsWith('/api/safe/diag')){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, safe:true, fatal:__FATAL, preflight:__PREFLIGHT||null}));
      }
      if(req.url && req.url.startsWith('/api/safe/report')){
        if(req.method!=='POST'){ res.writeHead(405, {'content-type':'application/json; charset=utf-8'}); return res.end(JSON.stringify({ok:false})); }
        const r = {ok:true, created:false, path:null};
        try{
          // reuse job report zip generation with empty queue (still useful: logs+settings+fatal)
          const report = {
            created: nowIso(),
            project_root: projectRoot,
            safe_mode: true,
            fatal: __FATAL,
            preflight: __PREFLIGHT || null
          };
          const repDir = path.join(projectRoot, 'exports');
          ensureDir(repDir);
          const ts = nowIso().replace(/[:]/g,'-');
          const zipName = safeName('safe_report_'+ts)+'.zip';
          const zipPath = path.join(repDir, zipName);

          const files = [];
          files.push({name:'safe_report.json', data: Buffer.from(JSON.stringify(report, null, 2), 'utf8')});
          try{
            const logPath = path.join(projectRoot, 'logs', 'modultool.log');
            if(fs.existsSync(logPath)) files.push({name:'logs/modultool.log', data: fs.readFileSync(logPath)});
          }catch(e){}
          try{
            const settingsPath = path.join(projectRoot, 'settings.json');
            if(fs.existsSync(settingsPath)) files.push({name:'settings.json', data: fs.readFileSync(settingsPath)});
          }catch(e){}
          const buf = zipStoreFiles(files);
          fs.writeFileSync(zipPath, buf);
          r.created = true;
          r.path = zipPath;
        }catch(e){
          r.ok = false;
          r.error = String(e && e.message ? e.message : e);
        }
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify(r));
      }
      if(req.url && req.url.startsWith('/api/safe/restart')){
        if(req.method!=='POST'){ res.writeHead(405, {'content-type':'application/json; charset=utf-8'}); return res.end(JSON.stringify({ok:false})); }
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        res.end(JSON.stringify({ok:true, exiting:true}));
        // Let start.sh restart if it wants
        setTimeout(()=>process.exit(42), 180);
setTimeout(()=>process.exit(0), 150);
        return;
      }
      // default redirect to safe UI
      res.writeHead(302, {Location:'/safe'});
      return res.end();
    }catch(e){
      res.writeHead(500, {'content-type':'text/plain; charset=utf-8'});
      return res.end('safe_mode_error');
    }
  });
  /* V046_START_LISTEN */
  listenWithAutoPort(server, opts.host, opts.port, 30).then((boundPort)=>{
    __BOUND_PORT = boundPort;
    console.log('[Modultool] Port gewählt:', boundPort);

// V067_DEBUG_HINTS
console.log('[Modultool] UI Debug: Wenn Buttons nichts machen -> Browser F12 (Console) öffnen. Dort stehen [UI]-Logs.');
console.log('[Modultool] Theme: oben rechts im Header umschaltbar. Persistenz: localStorage provoware_theme.');

    console.log('[Modultool] SAFE MODE aktiv:', opts.host+':'+opts.port, '(open /safe)');
  });
  return {server, projectRoot};
}
// ---- /v0.4.1: V041_SAFE_MODE ----

// ---- v0.3.0 additions: status/settings endpoints + buffered logging (no deps) ----
const os = require('os');

function nowIso(){ return new Date().toISOString(); }

function safeJsonParse(s, fallback){
  try { return JSON.parse(s); } catch { return fallback; }
}

function getDefaultSettings(){
  return {
    ui: {
      auto_open_browser: true
    },
    version: "0.3.0",
    ui: { high_contrast:false, invert:false, big_text:false, reduced_motion:false, tooltips:true },
    paths: { project_root: DEFAULT_PROJECT_ROOT },
    runtime: { cpu_mode: "Schonend", ram_watch: true }
  };
}

function loadSettings(settingsPath){
  try{
    if(fs.existsSync(settingsPath)){
      const raw = fs.readFileSync(settingsPath,'utf8');
      const obj = safeJsonParse(raw, null);
      if(obj && typeof obj === 'object') return obj;
    }
  }catch(e){}
  return getDefaultSettings();
}

function saveSettings(settingsPath, obj){
  const tmp = settingsPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, settingsPath);
}

let LOG_BUFFER = [];
let LOG_FLUSH_TIMER = null;

function logBuffered(projectRoot, line){
  const ts = nowIso();
  const entry = `[${ts}] ${line}`;
  LOG_BUFFER.push(entry);
  // Keep memory bounded
  if(LOG_BUFFER.length > 5000) LOG_BUFFER = LOG_BUFFER.slice(-3000);

  // Line-buffered-ish: batch flush every 400ms
  if(!LOG_FLUSH_TIMER){
    LOG_FLUSH_TIMER = setTimeout(() => {
      try{
        const logDir = path.join(projectRoot, 'logs');
        if(!fs.existsSync(logDir)) fs.mkdirSync(logDir, {recursive:true});
        const logfile = path.join(logDir, 'modultool.log');
        fs.appendFileSync(logfile, LOG_BUFFER.join(os.EOL) + os.EOL, 'utf8');
        LOG_BUFFER = [];
      }catch(e){
        // swallow
      }finally{
        LOG_FLUSH_TIMER = null;
      }
    }, 400);
  }
}

function getRuntimeStatus(projectRoot, sessionId, startedAt){
  const mem = process.memoryUsage();
  const total = os.totalmem();
  const free = os.freemem();
  return {
    ok: true,
    ts: nowIso(),
    session: sessionId,
    uptime_s: Math.floor((Date.now() - startedAt)/1000),
    process: {
      rss_mb: Math.round(mem.rss/1024/1024),
      heapUsed_mb: Math.round(mem.heapUsed/1024/1024)
    },
    system: {
      totalmem_gb: Math.round(total/1024/1024/1024*10)/10,
      freemem_gb: Math.round(free/1024/1024/1024*10)/10,
      loadavg: os.loadavg()
    },
    project_root: projectRoot
  };
}
// ---- /v0.3.0 additions ----

// ---- v0.3.5: Export/Backup helpers (ZIP store, no deps) ----
function u32(n){ const b = Buffer.alloc(4); b.writeUInt32LE(n>>>0,0); return b; }
function u16(n){ const b = Buffer.alloc(2); b.writeUInt16LE(n>>>0,0); return b; }
function dosTime(date){
  const d = date || new Date();
  const sec = Math.floor(d.getSeconds()/2);
  const min = d.getMinutes();
  const hr  = d.getHours();
  const day = d.getDate();
  const mon = d.getMonth()+1;
  const yr  = d.getFullYear()-1980;
  const time = (hr<<11) | (min<<5) | sec;
  const dat  = (yr<<9) | (mon<<5) | day;
  return {time, dat};
}
function crc32(buf){
  let crc = ~0;
  for(let i=0;i<buf.length;i++){
    crc ^= buf[i];
    for(let k=0;k<8;k++){
      const m = -(crc & 1);
      crc = (crc>>>1) ^ (0xEDB88320 & m);
    }
  }
  return (~crc)>>>0;
}
function zipStoreFiles(files){
  const now = new Date();
  const dt = dosTime(now);
  let offset = 0;
  const localParts = [];
  const centralParts = [];
  for(const f of files){
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = f.data || Buffer.alloc(0);
    const c = crc32(data);
    const lh = Buffer.concat([
      u32(0x04034b50),
      u16(20), u16(0), u16(0),
      u16(dt.time), u16(dt.dat),
      u32(c), u32(data.length), u32(data.length),
      u16(nameBuf.length), u16(0),
      nameBuf
    ]);
    localParts.push(lh, data);
    const ch = Buffer.concat([
      u32(0x02014b50),
      u16(20), u16(20),
      u16(0), u16(0),
      u16(dt.time), u16(dt.dat),
      u32(c), u32(data.length), u32(data.length),
      u16(nameBuf.length), u16(0), u16(0),
      u16(0), u16(0),
      u32(0),
      u32(offset),
      nameBuf
    ]);
    centralParts.push(ch);
    offset += lh.length + data.length;
  }
  const centralStart = offset;
  const central = Buffer.concat(centralParts);
  const centralSize = central.length;
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(centralSize),
    u32(centralStart),
    u16(0)
  ]);
  return Buffer.concat([...localParts, central, eocd]);
}
function safeName(s){
  return String(s||'').toLowerCase()
    .replace(/[^a-z0-9._-]+/g,'_')
    .replace(/_+/g,'_')
    .replace(/^_+|_+$/g,'');
}
function ensureDir(p){
  if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true});
}

// ---- v0.5.0 runtime file (for start.sh auto-open) ----
function writeRuntimeFile(projectRoot, host, port, safe){
  try{
    const p = path.join(projectRoot, '.runtime.json');
    const data = {
      ts: new Date().toISOString(),
      host, port,
      safe_mode: !!safe
    };
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  }catch(e){}
}
// ---- /v0.5.0 runtime file ----


// ---- /v0.3.5 ----

// ---- v0.3.6: Export endpoints handler (keeps req in-scope) ----
function handleExportEndpoints(req, res, project_root){
  if(req.url && req.url.startsWith('/api/export/list')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({ok:false, error:'forbidden'}));
      return true;
    }
    const dir = path.join(project_root, 'exports');
    ensureDir(dir);
    let items = [];
    try{
      items = fs.readdirSync(dir)
        .filter(n=>n.endsWith('.zip'))
        .map(n=>{
          const p = path.join(dir,n);
          const st = fs.statSync(p);
          return {name:n, size: st.size, mtime: st.mtimeMs};
        })
        .sort((a,b)=>b.mtime-a.mtime);
    }catch(e){}
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify({ok:true, items}));
    return true;
  }

  if(req.url && req.url.startsWith('/api/export/create')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({ok:false, error:'forbidden'}));
      return true;
    }
    if(req.method !== 'POST'){
      res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({ok:false, error:'Method not allowed'}));
      return true;
    }
    let body='';
    req.on('data', c=>body+=c);
    req.on('end', ()=>{
      const j = safeJsonParse(body, {}) || {};
      const mode = j.mode || 'core';
      const dir = path.join(project_root, 'exports');
      ensureDir(dir);
      const ts = new Date().toISOString().replace(/[:]/g,'-');
      const base = safeName(`modultool_${mode}_${ts}`) || ('modultool_'+ts);
      const zipName = base + '.zip';
      const zipPath = path.join(dir, zipName);

      const files = [];
      try{
        const settingsPath = path.join(project_root, 'settings.json');
        if(fs.existsSync(settingsPath)) files.push({name:'settings.json', data: fs.readFileSync(settingsPath)});
      }catch(e){}
      try{
        const notesPath = path.join(project_root, 'notizen.txt');
        if(fs.existsSync(notesPath)) files.push({name:'notizen.txt', data: fs.readFileSync(notesPath)});
      }catch(e){}
      try{
        const logPath = path.join(project_root, 'logs', 'modultool.log');
        if(fs.existsSync(logPath)) files.push({name:'logs/modultool.log', data: fs.readFileSync(logPath)});
      }catch(e){}
      const info = Buffer.from(JSON.stringify({created:new Date().toISOString(), mode, project_root}, null, 2),'utf8');
      files.push({name:'export_info.json', data: info});

      try{
        const buf = zipStoreFiles(files);
        fs.writeFileSync(zipPath, buf);
        try{ logBuffered(project_root, `Export erstellt: ${zipName}`); }catch(e){}
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        res.end(JSON.stringify({ok:true, name: zipName, url: `/exports/${encodeURIComponent(zipName)}`}));
      }catch(e){
        res.writeHead(500, {'content-type':'application/json; charset=utf-8'});
        res.end(JSON.stringify({ok:false, error:'export_failed'}));
      }
    });
    return true;
  }

  if(req.url && req.url.startsWith('/exports/')){
    const rel = decodeURIComponent(req.url.slice('/exports/'.length));
    const fname = safeName(rel);
    if(!fname || !fname.endsWith('.zip')){
      res.writeHead(400, {'content-type':'text/plain; charset=utf-8'});
      res.end('bad name');
      return true;
    }
    const p = path.join(project_root, 'exports', fname);
    try{
      if(!fs.existsSync(p)){
        
  // ---- v0.4.6 Logout: Speichern + sauber schließen ----
  if(req.url && req.url.startsWith('/api/logout')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    if(req.method !== 'POST'){
      res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'Method not allowed'}));
    }

    try{
      // Minimal: settings flush + log flush
      const settingsPath = getSettingsPath();
      const settings = loadSettings(settingsPath) || getDefaultSettings();
      // ensure current root is persisted
      if(settings.paths) settings.paths.project_root = project_root;
      saveSettings(settingsPath, settings);
      try{ flushLog(project_root); }catch(e){}
      try{ logBuffered(project_root, 'LOGOUT: Speichern + Shutdown'); }catch(e){}
    }catch(e){}

    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify({ok:true, shutting_down:true}));

    // Close server after response
    setTimeout(()=>{
      try{
        if(__SERVER_INSTANCE){
          __SERVER_INSTANCE.close(()=>process.exit(0));
          // fallback hard-exit
          setTimeout(()=>process.exit(0), 600);
        }else{
          process.exit(0);
        }
      }catch(e){
        process.exit(0);
      }
    }, 150);
    return;
  }
  // ---- /v0.4.6 Logout ----


  // ---- v0.4.7 Runtime Status (Port/Host) ----
  if(req.url && req.url.startsWith('/api/runtime/status')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({
      ok:true,
      host: (opts && opts.host) ? opts.host : '127.0.0.1',
      port: __BOUND_PORT || (opts && opts.port) || 0,
      project_root: __PROJECT_ROOT || project_root || null,
      safe_mode: !!__SAFE_MODE
    }));
  }
  // ---- v0.5.1 Wizard API (Laien-Erststart) ----
  if(req.url && req.url.startsWith('/api/wizard/status')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    const settingsPath = getSettingsPath();
    const settings = loadSettings(settingsPath) || getDefaultSettings();
    const pr = (settings.paths && settings.paths.project_root) ? settings.paths.project_root : DEFAULT_PROJECT_ROOT;
    const configured = !!(settings.paths && settings.paths.project_root);
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true, configured, project_root: pr, auto_open_browser: !!(settings.ui && settings.ui.auto_open_browser)}));
  }

  if(req.url && req.url.startsWith('/api/wizard/set_project_root')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    if(req.method !== 'POST'){
      res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'method_not_allowed'}));
    }
    let body='';
    req.on('data', (c)=>{ body += c; if(body.length>1e6) req.destroy(); });
    req.on('end', ()=>{
      try{
        const j = JSON.parse(body||'{}');
        const pr = String(j.project_root||'').trim();
        if(!isLikelySafePath(pr)){
          res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
          return res.end(JSON.stringify({ok:false, error:'invalid_path'}));
        }
        const norm = path.resolve(pr);
        ensureProjectStructure(norm);

        const settingsPath = getSettingsPath();
        const settings = loadSettings(settingsPath) || getDefaultSettings();
        settings.paths = settings.paths || {};
        settings.paths.project_root = norm;

        // optional: set auto open
        settings.ui = settings.ui || {auto_open_browser:true};
        if(typeof j.auto_open_browser === 'boolean'){
          settings.ui.auto_open_browser = j.auto_open_browser;
        }

        saveSettings(settingsPath, settings);
        // keep globals consistent
        __PROJECT_ROOT = norm;

        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, project_root:norm, auto_open_browser: settings.ui.auto_open_browser}));
      }catch(e){
        res.writeHead(400, {'content-type':'application/json; charset=utf-8'});
        return res.end(JSON.stringify({ok:false, error:'bad_json'}));
      }
    });
    return;
  }
  
  if(req.url && req.url.startsWith('/api/wizard/test_path')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    if(req.method !== 'POST'){
      res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'method_not_allowed'}));
    }
    let body='';
    req.on('data', (c)=>{ body += c; if(body.length>1e6) req.destroy(); });
    req.on('end', ()=>{
      try{
        const j = JSON.parse(body||'{}');
        const pr = String(j.project_root||'').trim();
        if(!isLikelySafePath(pr)){
          res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
          return res.end(JSON.stringify({ok:false, error:'invalid_path'}));
        }
        const norm = path.resolve(pr);
        ensureDir(norm);

        const testFile = path.join(norm, '.write_test.tmp');
        fs.writeFileSync(testFile, 'ok', 'utf8');
        fs.unlinkSync(testFile);

        // also check we can create structure
        ensureProjectStructure(norm);

        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:true, project_root:norm, writable:true}));
      }catch(e){
        res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
        return res.end(JSON.stringify({ok:false, error:'not_writable_or_other'}));
      }
    });
    return;
  }

// ---- /v0.5.1 Wizard API ----


  // ---- v0.5.0 UI Settings (Auto-Open Browser) ----
  if(req.url && req.url.startsWith('/api/ui/settings')){
    const ip = (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : '';
    const loopback = (ip === '127.0.0.1' || ip === '::1' || ip.endsWith('127.0.0.1'));
    if(!loopback){
      res.writeHead(403, {'content-type':'application/json; charset=utf-8'});
      return res.end(JSON.stringify({ok:false, error:'forbidden'}));
    }
    const settingsPath = getSettingsPath();
    const settings = loadSettings(settingsPath) || getDefaultSettings();
    settings.ui = settings.ui || { auto_open_browser: true };

    if(req.method === 'GET'){
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true, ui: settings.ui}));
    }
    if(req.method === 'POST'){
      let body='';
      req.on('data', (c)=>{ body += c; if(body.length>1e6) req.destroy(); });
      req.on('end', ()=>{
        try{
          const j = JSON.parse(body||'{}');
          if(typeof j.auto_open_browser === 'boolean'){
            settings.ui.auto_open_browser = j.auto_open_browser;
            saveSettings(settingsPath, settings);
          }
          res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
          return res.end(JSON.stringify({ok:true, ui: settings.ui}));
        }catch(e){
          res.writeHead(400, {'content-type':'application/json; charset=utf-8'});
          return res.end(JSON.stringify({ok:false, error:'bad_json'}));
        }
      });
      return;
    }
    res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({ok:false, error:'method_not_allowed'}));
  }
  // ---- /v0.5.0 UI Settings ----


  // ---- /v0.4.7 Runtime Status ----

res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
        res.end('not found');
        return true;
      }
      const st = fs.statSync(p);
      res.writeHead(200, {
        'content-type':'application/zip',
        'content-length': st.size,
        'content-disposition': `attachment; filename="${fname}"`,
        'cache-control':'no-store'
      });
      fs.createReadStream(p).pipe(res);
      return true;
    }catch(e){
      res.writeHead(500, {'content-type':'text/plain; charset=utf-8'});
      res.end('error');
      return true;
    }
  }

  return false;
}
// ---- /v0.3.6 ----

// ---- v0.3.7: Preflight + Self-Repair (auto) ----
let __PREFLIGHT = {
  ts: null,
  ok: true,
  level: 'gruen',
  issues: [],
  repaired: [],
  project_root: null
};

function canWriteDir(dirPath){
  try{
    const test = path.join(dirPath, '.modultool_write_test.tmp');
    fs.writeFileSync(test, 'ok', 'utf8');
    fs.unlinkSync(test);
    return true;
  }catch(e){ return false; }
}


function ensureSnippetsFile(projectRoot){
  try{
    const dir = path.join(projectRoot,'data');
    ensureDir(dir);
    const p = path.join(dir,'snippets.json');
    if(!fs.existsSync(p)){
      safeWriteJson(p, {version:1, updated: Date.now(), items:[]});
    }
    return p;
  }catch(e){ return null; }
}

function ensureSnippetsHistory(projectRoot){
  try{
    const dir = path.join(projectRoot,'data');
    ensureDir(dir);
    const p = path.join(dir,'snippets_history.txt');
    if(!fs.existsSync(p)) fs.writeFileSync(p, '', 'utf8');
    return p;
  }catch(e){ return null; }
}


function ensureInfoLog(projectRoot){
  try{
    const dir = path.join(projectRoot,'logs');
    ensureDir(dir);
    const p = path.join(dir,'info.log');
    if(!fs.existsSync(p)) fs.writeFileSync(p, '', 'utf8');
    return p;
  }catch(e){ return null; }
}

function ensureEventLog(projectRoot){
  try{
    const dir = path.join(projectRoot,'logs');
    ensureDir(dir);
    const p = path.join(dir,'events.log');
    if(!fs.existsSync(p)) fs.writeFileSync(p, '', 'utf8');
    return p;
  }catch(e){ return null; }
}

function runPreflight(project_root){
  const issues = [];
  const repaired = [];
  const now = new Date().toISOString();

  function addIssue(code, msg, level){
    issues.push({code, msg, level: level||'warn'});
  }
  function addRepaired(code, msg){
    repaired.push({code, msg});
  }

  // Ensure root exists
  try{
    if(!fs.existsSync(project_root)){
      fs.mkdirSync(project_root, {recursive:true});
      addRepaired('mkdir_root', 'Projektordner erstellt');
    }
  }catch(e){
    addIssue('root_missing', 'Projektordner konnte nicht erstellt werden', 'kritisch');
  }

  // Ensure subdirs
  const needDirs = ['logs','exports','backups'];
  for(const d of needDirs){
    const p = path.join(project_root, d);
    try{
      if(!fs.existsSync(p)){
        fs.mkdirSync(p, {recursive:true});
        addRepaired('mkdir_'+d, d+' erstellt');
      }
    }catch(e){
      addIssue('dir_'+d, 'Ordner konnte nicht erstellt werden: '+d, 'kritisch');
    }
  }

  // Ensure settings.json exists
  const sp = path.join(project_root, 'settings.json');
  try{
    if(!fs.existsSync(sp)){
      const fresh = getDefaultSettings();
      fresh.paths.project_root = project_root;
      saveSettings(sp, fresh);
      addRepaired('settings_create', 'settings.json erstellt');
    }
  }catch(e){
    addIssue('settings_write', 'settings.json konnte nicht geschrieben werden', 'kritisch');
  }

  // Write permission check
  if(!canWriteDir(project_root)){
    addIssue('write_root', 'Keine Schreibrechte im Projektordner', 'kritisch');
  }
  for(const d of ['logs','exports']){
    const p = path.join(project_root, d);
    if(fs.existsSync(p) && !canWriteDir(p)) addIssue('write_'+d, 'Keine Schreibrechte in '+d+'/', 'kritisch');
  }

  // Determine level
  let level = 'gruen';
  if(issues.some(i=>i.level==='kritisch')) level = 'rot';
  else if(issues.length) level = 'gelb';

  __PREFLIGHT = {
    ts: now,
    ok: level==='gruen',
    level,
    issues,
    repaired,
    project_root
  };
  try{ logBuffered(project_root, 'Preflight: '+level.toUpperCase()+' (issues='+issues.length+', repaired='+repaired.length+')'); }catch(e){}
  return __PREFLIGHT;
}
// ---- /v0.3.7 ----

// ---- v0.3.8: JOB QUEUE CORE (nachtfest) ----
// Default: Retry 1×, danach Skip. Kritische Jobs stoppen.
let __JOBQ = {
  running: false,
  started_ts: null,
  finished_ts: null,
  cursor: 0,
  items: [],
  summary: {done:0, skipped:0, failed:0, total:0},
  last_report_path: null
};

function newJobId(){
  return 'j_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

function jobReset(){
  __JOBQ.running = false;
  __JOBQ.started_ts = null;
  __JOBQ.finished_ts = null;
  __JOBQ.cursor = 0;
  __JOBQ.items = [];
  __JOBQ.summary = {done:0, skipped:0, failed:0, total:0};
  __JOBQ.last_report_path = null;
}

function jobAdd(title, payload){
  const it = {
    id: newJobId(),
    title: String(title||'Job'),
    payload: payload || {},
    state: 'queued',
    attempts: 0,
    max_attempts: 2,
    last_error: '',
    started_ts: null,
    finished_ts: null
  };
  __JOBQ.items.push(it);
  __JOBQ.summary.total = __JOBQ.items.length;
  return it;
}

function jobList(){
  __JOBQ.summary.total = __JOBQ.items.length;
  __JOBQ.summary.done = __JOBQ.items.filter(x=>x.state==='done').length;
  __JOBQ.summary.skipped = __JOBQ.items.filter(x=>x.state==='skipped').length;
  __JOBQ.summary.failed = __JOBQ.items.filter(x=>x.state==='failed').length;
  return __JOBQ;
}

function isCriticalPreflight(pf){
  if(!pf) return true;
  return pf.level === 'rot';
}

// Dummy runner (safe): simulates work until FFmpeg module arrives.
function runOneJobSim(job){
  return new Promise((resolve, reject)=>{
    const ms = Math.max(150, Math.min(2500, Number(job.payload && job.payload.ms || 650)));
    const fail = !!(job.payload && job.payload.fail);
    setTimeout(()=>{
      if(fail) reject(new Error('simulated_fail'));
      else resolve({ok:true, ms});
    }, ms);
  });
}

async function jobRunAll(project_root){
  if(__JOBQ.running) return {ok:false, error:'already_running'};

  const pf = __PREFLIGHT || runPreflight(projectRoot);
  if(isCriticalPreflight(pf)){
    try{ logBuffered(project_root, 'JOBQ: STOP (Preflight ROT)'); }catch(e){}
    return {ok:false, error:'preflight_critical', preflight: pf};
  }

  __JOBQ.running = true;
  __JOBQ.started_ts = new Date().toISOString();
  __JOBQ.finished_ts = null;
  __JOBQ.cursor = 0;

  for(let i=0;i<__JOBQ.items.length;i++){
    __JOBQ.cursor = i;
    const job = __JOBQ.items[i];
    if(job.state !== 'queued') continue;

    job.state = 'running';
    job.started_ts = new Date().toISOString();
    job.attempts += 1;

    try{
      await runOneJobSim(job);
      job.state = 'done';
      job.finished_ts = new Date().toISOString();
      try{ logBuffered(project_root, 'JOB OK: '+job.title+' ('+job.id+')'); }catch(e){}
    }catch(err){
      job.last_error = String(err && err.message ? err.message : err);

      if(job.attempts < job.max_attempts){
        try{ logBuffered(project_root, 'JOB RETRY: '+job.title+' ('+job.id+')'); }catch(e){}
        job.state = 'queued';
        i -= 1;
        continue;
      }

      const crit = !!(job.payload && job.payload.critical);
      if(crit){
        job.state = 'failed';
        job.finished_ts = new Date().toISOString();
        try{ logBuffered(project_root, 'JOB FAIL (critical): '+job.title+' ('+job.id+')'); }catch(e){}
        break; // stop on critical
      }else{
        job.state = 'skipped';
        job.finished_ts = new Date().toISOString();
        try{ logBuffered(project_root, 'JOB SKIP: '+job.title+' ('+job.id+')'); }catch(e){}
      }
    }
  }

  __JOBQ.running = false;
  __JOBQ.finished_ts = new Date().toISOString();

  // Auto-report ZIP in exports/
  try{
    const report = {
      created: new Date().toISOString(),
      project_root,
      preflight: __PREFLIGHT,
      summary: jobList().summary,
      items: __JOBQ.items
    };
    const repDir = path.join(project_root, 'exports');
    ensureDir(repDir);
    const ts = new Date().toISOString().replace(/[:]/g,'-');
    const zipName = safeName('job_report_'+ts)+'.zip';
    const zipPath = path.join(repDir, zipName);

    const files = [];
    files.push({name:'job_report.json', data: Buffer.from(JSON.stringify(report, null, 2), 'utf8')});
    try{
      const logPath = path.join(project_root, 'logs', 'modultool.log');
      if(fs.existsSync(logPath)) files.push({name:'logs/modultool.log', data: fs.readFileSync(logPath)});
    }catch(e){}
    try{
      const settingsPath = path.join(project_root, 'settings.json');
      if(fs.existsSync(settingsPath)) files.push({name:'settings.json', data: fs.readFileSync(settingsPath)});
    }catch(e){}

    const buf = zipStoreFiles(files);
    fs.writeFileSync(zipPath, buf);
    __JOBQ.last_report_path = zipPath;
    try{ logBuffered(project_root, 'JOBQ: Report ZIP erstellt: '+zipName); }catch(e){}
  }catch(e){
    try{ logBuffered(project_root, 'JOBQ: Report ZIP fehlgeschlagen'); }catch(_e){}
  }

  return {ok:true, jobq: jobList()};
}
// ---- /v0.3.8: V038_JOBQUEUE ----


const fs = require('fs');
const path = require('path');
let __LAST_STATUS = {level:'READY', msg:'Bereit', ts:Date.now()};
let __LAST_ERROR = null;
const url = require('url');
const crypto = require('crypto');

const TOOL_NAME = 'Modultool';
const TOOL_VERSION = '0.2.0';
const BUILD_DATE = '2026-02-04';

const DEFAULT_PROJECT_ROOT = path.resolve('./project');

const DIRS = {
  app: 'app',
  modules: 'modules',
  data: 'data',
  config: 'data/config',
  state: 'data/state',
  logs: 'data/logs',
  index: 'data/index',
  archive: 'data/archive',
  user: 'user'
};

const FILES = {
  manifest: 'manifest.json',
  settings: 'data/config/settings.json',
  state: 'data/state/state.json',
  hints: 'data/state/hints.json',
  log: 'data/logs/core.log'
};

const DEFAULT_SETTINGS = {
  ui: { high_contrast:false, invert_colors:false, large_text:false, reduce_motion:false, tooltips:true },
  paths: { project_root: DEFAULT_PROJECT_ROOT },
  runtime: {
    auto_save_seconds: 600,
    ram_guard_enabled: true,
    ram_guard_min_free_mb: 1200,
    cpu_mode: 'Schonend',
    log_buffer_enabled: false,
    log_buffer_flush_seconds: 2,
    log_buffer_max_lines: 200
  }
};

const DEFAULT_STATE = {
  last_state: 'READY',
  last_module: null,
  open_hints: [],
  last_session_clean: true,
  session_started: null
};

function nowIso(){
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function safeMkdir(p){
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p, fallback){
  try{
    const s = fs.readFileSync(p, 'utf8');
    return JSON.parse(s);
  }catch(_e){
    return fallback;
  }
}

function atomicWriteJson(p, obj){
  safeMkdir(path.dirname(p));
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

class CoreLogger{
  constructor(projectRoot, opts){
    this.projectRoot = projectRoot;
    this.enabled = true;
    this.bufferEnabled = !!opts.bufferEnabled;
    this.flushSeconds = Math.max(1, Number(opts.flushSeconds||2));
    this.maxLines = Math.max(10, Number(opts.maxLines||200));
    this.buf = [];
    this.timer = null;

    if(this.bufferEnabled){
      this.arm();
      process.on('exit', ()=>this.flush());
      process.on('SIGINT', ()=>{ this.flush(); process.exit(0); });
    }
  }
  logPath(){ return path.join(this.projectRoot, FILES.log); }
  write(line){
    try{
      safeMkdir(path.dirname(this.logPath()));
      fs.appendFileSync(this.logPath(), line, { encoding:'utf8' });
    }catch(_e){}
  }
  arm(){
    if(this.timer) return;
    this.timer = setInterval(()=>this.flush(), this.flushSeconds*1000);
    this.timer.unref?.();
  }
  flush(){
    if(!this.enabled) return;
    if(!this.bufferEnabled) return;
    if(this.buf.length===0) return;
    const chunk = this.buf.join('');
    this.buf = [];
    this.write(chunk);
  }
  log(msg){
    if(!this.enabled) return;
    const stamp = new Date().toISOString().replace('T',' ').replace(/\.\d{3}Z$/, '');
    const line = `[${stamp}] ${msg}\n`;
    if(!this.bufferEnabled){
      this.write(line);
      return;
    }
    this.buf.push(line);
    if(this.buf.length >= this.maxLines) this.flush();
  }
}

function parseRootStr(s){
  if(!s) return null;
  try{
    return path.resolve(s.replace(/^~\//, process.env.HOME + '/'));
  }catch(_e){
    return null;
  }
}

function parseCli(argv){
  const out = { root:null, host:'127.0.0.1', port:8787 };
  for(let i=0;i<argv.length;i++){
    const a = argv[i];
    if(a==='--root') out.root = argv[++i] || null;
    else if(a==='--host') out.host = argv[++i] || out.host;
    else if(a==='--port') out.port = Number(argv[++i] || out.port);
  }
  return out;
}


// ---- v0.5.1 WIZARD helpers ----
function isLikelySafePath(p){
  if(!p || typeof p !== 'string') return false;
  if(p.includes('\0')) return false;
  // do not allow root or home directly
  const norm = path.resolve(p);
  if(norm === '/' || norm === path.resolve(os.homedir())) return false;
  // avoid weird characters (keep it simple for laien)
  if(/[<>:"|?*]/.test(norm)) return false;
  return true;
}


function linuxSafeSegment(seg){
  // Linux-konform: keine Leerzeichen, keine Sonderzeichen (sehr konservativ)
  const orig = String(seg||'');
  const replaced = orig
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return replaced || 'unnamed';
}

function uniquePath(absPath){
  if(!fs.existsSync(absPath)) return absPath;
  const dir = path.dirname(absPath);
  const ext = path.extname(absPath);
  const base = path.basename(absPath, ext);
  for(let i=1;i<10000;i++){
    const cand = path.join(dir, `${base}_${i}${ext}`);
    if(!fs.existsSync(cand)) return cand;
  }
  return absPath; // fallback (should not happen)
}

function scanLinuxNameProblems(projectRoot){
  const problems = [];
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build']);
  const walk = (dir)=>{
    let items = [];
    try{ items = fs.readdirSync(dir, {withFileTypes:true}); }catch(e){ return; }
    for(const it of items){
      const abs = path.join(dir, it.name);
      const rel = path.relative(projectRoot, abs);
      if(it.isDirectory()){
        if(skipDirs.has(it.name)) continue;
        walk(abs);
        continue;
      }
      if(!it.isFile()) continue;
      if(rel.startsWith('logs'+path.sep)) continue; // logs bleiben wie sie sind
      const safe = linuxSafeSegment(it.name);
      if(safe !== it.name){
        problems.push({
          kind: 'name',
          rel,
          current: it.name,
          proposed: safe,
          reason: 'Nicht Linux-konform (Leerzeichen/Sonderzeichen)'
        });
      }
    }
  };
  walk(projectRoot);
  return problems;
}

function applyLinuxRenames(projectRoot, logger){
  const probs = scanLinuxNameProblems(projectRoot);
  const changes = [];
  for(const p of probs){
    const abs = path.join(projectRoot, p.rel);
    const dir = path.dirname(abs);
    const target = uniquePath(path.join(dir, p.proposed));
    try{
      fs.renameSync(abs, target);
      const relNew = path.relative(projectRoot, target);
      changes.push({from: p.rel, to: relNew, reason: p.reason});
      logger && logger.log(`AutoFix: rename ${p.rel} -> ${relNew}`);
    }catch(e){
      logger && logger.log(`AutoFix: rename FAIL ${p.rel} (${String(e.message||e)})`);
    }
  }
  return {changes, planned: probs.length};
}

function buildPreflightResult(projectRoot, logger, doFix){
  const checks = [];
  const fixes = [];
  const now = nowIso();

  // Check: root exists
  const rootExists = fs.existsSync(projectRoot);
  checks.push({id:'root_exists', label:'Projektordner vorhanden', ok:!!rootExists, level: rootExists?'ok':'fail', detail: projectRoot});

  // Ensure base dirs
  const dirs = ['logs','exports','data','trash'];
  for(const d of dirs){
    const abs = path.join(projectRoot, d);
    const ok = fs.existsSync(abs) && fs.statSync(abs).isDirectory();
    if(!ok && doFix){
      try{ safeMkdir(abs); fixes.push({id:'mk_'+d, label:`Ordner anlegen: ${d}`, ok:true}); }catch(e){ fixes.push({id:'mk_'+d,label:`Ordner anlegen: ${d}`, ok:false, error:String(e.message||e)}); }
    }
    const ok2 = fs.existsSync(abs) && (fs.statSync(abs).isDirectory());
    checks.push({id:'dir_'+d, label:`Ordner: ${d}`, ok:ok2, level: ok2?'ok': (doFix?'warn':'fail'), detail: abs});
  }

  // Check settings json readable
  const settingsPath = path.join(projectRoot, FILES.settings);
  let settingsOk = true;
  try{ readJson(settingsPath, {}); }catch(e){ settingsOk = false; }
  checks.push({id:'settings_json', label:'settings.json lesbar', ok:settingsOk, level: settingsOk?'ok':'fail', detail: settingsPath});

  // Linux name scan
  const nameProblems = scanLinuxNameProblems(projectRoot);
  const nameOk = nameProblems.length===0;
  checks.push({id:'linux_names', label:'Linux-konforme Dateinamen', ok:nameOk, level: nameOk?'ok':'warn', detail: `${nameProblems.length} Problem(e)`});
  if(!nameOk){
    fixes.push({id:'rename_linux', label:'AutoFix: Dateinamen reparieren', ok:null, count:nameProblems.length});
  }
  let renameSummary = null;
  if(doFix && nameProblems.length){
    renameSummary = applyLinuxRenames(projectRoot, logger);
    // refresh check
    const left = scanLinuxNameProblems(projectRoot).length;
    checks.push({id:'linux_names_after', label:'Linux-konforme Dateinamen (nach AutoFix)', ok:left===0, level:left===0?'ok':'warn', detail:`${left} Problem(e) übrig`});
  }

  // Determine overall level
  const hasFail = checks.some(c=>c.level==='fail');
  const hasWarn = checks.some(c=>c.level==='warn');
  const level = hasFail ? 'FAIL' : (hasWarn ? 'WARN' : 'READY');
  const ok = !hasFail;

  const summary = {
    ok,
    level,
    ts: now,
    project_root: projectRoot,
    checks,
    fixes,
    rename: renameSummary
  };

  try{
    atomicWriteJson(path.join(projectRoot,'logs','preflight_last.json'), summary);
  }catch(e){
    // ignore
  }
  return summary;
}

function ensureProjectStructure(projectRoot){
  ensureDir(projectRoot);
  ensureDir(path.join(projectRoot, 'logs'));
  ensureDir(path.join(projectRoot, 'exports'));
  ensureDir(path.join(projectRoot, 'data'));
  ensureDir(path.join(projectRoot, 'queue'));
  // touch log file
  try{
    const lp = path.join(projectRoot, 'logs', 'modultool.log');
    if(!fs.existsSync(lp)) fs.writeFileSync(lp, '', 'utf8');
  }catch(e){}
}
// ---- /v0.5.1 WIZARD helpers ----
function resolveProjectRoot(cliRoot){
  if(cliRoot){
    const p = parseRootStr(cliRoot);
    if(p) return p;
  }
  const envRoot = (process.env.MODULTOOL_PROJECT_ROOT||'').trim();
  if(envRoot){
    const p = parseRootStr(envRoot);
    if(p) return p;
  }
  // optional bootstrap settings under DEFAULT_PROJECT_ROOT
  const bootSettings = path.join(DEFAULT_PROJECT_ROOT, FILES.settings);
  if(fs.existsSync(bootSettings)){
    const s = readJson(bootSettings, DEFAULT_SETTINGS);
    const pr = parseRootStr(String(((s.paths||{}).project_root)||''));
    if(pr) return pr;
  }
  return DEFAULT_PROJECT_ROOT;
}

// ---- v0.4.6: PORT PICKER ----
function listenWithAutoPort(server, host, port, maxTries){
  return new Promise((resolve, reject)=>{
    const tries = Math.max(1, Math.min(50, Number(maxTries||20)));
    let p = Number(port||0);
    if(!p || p < 1024) p = 8787; // sane default
    let n = 0;

    const onError = (err)=>{
      if(err && err.code === 'EADDRINUSE' && n < tries){
        n += 1;
        p += 1;
        try{ server.listen(p, host, onListen); }catch(e){ return reject(e); }
        return;
      }
      return reject(err);
    };
    const onListen = ()=>{
      server.off('error', onError);
      return resolve(p);
    };

    server.on('error', onError);
    try{ server.listen(p, host, onListen); }catch(e){ return reject(e); }
  });
}
// ---- /v0.4.6: V046_PORT_PICKER ----



function ensureProjectStructure(projectRoot, logger){
  const hints = [];
  for(const rel of Object.values(DIRS)){
    safeMkdir(path.join(projectRoot, rel));
  }

  const manifestPath = path.join(projectRoot, FILES.manifest);
  if(!fs.existsSync(manifestPath)){
    atomicWriteJson(manifestPath, {
      tool: TOOL_NAME,
      version: TOOL_VERSION,
      build_date: BUILD_DATE,
      compatible_with: 'linux',
      core_state: 'stable'
    });
    hints.push({ id:`info_${crypto.randomBytes(3).toString('hex')}`, type:'info', text:'manifest.json wurde neu angelegt.', action:'details', dismissible:true, timestamp: nowIso() });
  }

  const settingsPath = path.join(projectRoot, FILES.settings);
  const settings = readJson(settingsPath, DEFAULT_SETTINGS);
  settings.ui ||= {};
  settings.paths ||= {};
  settings.runtime ||= {};
  settings.paths.project_root = projectRoot; // eine Wahrheit
  atomicWriteJson(settingsPath, settings);

  const statePath = path.join(projectRoot, FILES.state);
  const state = readJson(statePath, DEFAULT_STATE);
  if(!state.session_started) state.session_started = nowIso();
  atomicWriteJson(statePath, state);

  const hintsPath = path.join(projectRoot, FILES.hints);
  if(!fs.existsSync(hintsPath)){
    atomicWriteJson(hintsPath, []);
  }

  // Schreibtest
  try{
    const test = path.join(projectRoot, 'data/state/.write_test');
    safeMkdir(path.dirname(test));
    fs.writeFileSync(test, 'ok', 'utf8');
    fs.unlinkSync(test);
  }catch(_e){
    hints.push({ id:`prob_${crypto.randomBytes(3).toString('hex')}`, type:'problem', text:'Schreibtest fehlgeschlagen. Projektordner hat evtl. keine Rechte.', action:'details', dismissible:true, timestamp: nowIso() });
  }

  logger?.log('Preflight abgeschlossen.');
  return hints;
}

function chooseActiveHint(hints){
  if(!Array.isArray(hints) || hints.length===0) return null;
  const prio = { problem:3, warning:2, info:1 };
  const sorted = [...hints].sort((a,b)=>{
    const pa = prio[a.type]||0, pb = prio[b.type]||0;
    if(pa!==pb) return pb-pa;
    return String(b.timestamp||'').localeCompare(String(a.timestamp||''));
  });
  return sorted[0] || null;
}

function serveStatic(reqPath, res){
  const webRoot = path.join(__dirname, 'web');
  let filePath = reqPath === '/' ? '/index.html' : reqPath;
  filePath = filePath.replace(/\.\.+/g, '.'); // basic traversal guard
  const abs = path.join(webRoot, filePath);
  if(!abs.startsWith(webRoot)){
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if(!fs.existsSync(abs)){
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(abs).toLowerCase();
  const ct = ext==='.html' ? 'text/html; charset=utf-8'
            : ext==='.css' ? 'text/css; charset=utf-8'
            : ext==='.js'  ? 'application/javascript; charset=utf-8'
            : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct, 'Cache-Control':'no-store' });
  res.end(fs.readFileSync(abs));
}

function readBody(req){
  return new Promise((resolve)=>{
    let data = '';
    req.on('data', chunk=>{ data += chunk; if(data.length>2_000_000) data=''; });
    req.on('end', ()=>{
      try{ resolve(JSON.parse(data||'{}')); }catch(_e){ resolve({}); }
    });
  });
}

function startServer(opts){
  // V041_SELFTEST_HOOK: early selftest -> safe mode (no crash)
  const st = selftestServerFile();
  if(!st.ok){
    try{ setFatal(new Error(st.code+': '+st.msg), 'selftest'); }catch(e){}
    // Ensure projectRoot exists for reports
    const projectRoot = resolveProjectRoot(opts);
    
  __PROJECT_ROOT = projectRoot;
try{ runPreflight(projectRoot); }catch(e){}
    return startSafeServer(opts, projectRoot);
  }

  const startedAt = Date.now();
  const sessionId = crypto.randomBytes(4).toString('hex');
  const projectRoot = resolveProjectRoot(opts.root);
  safeMkdir(projectRoot);

  // temp logger until settings loaded
  let logger = new CoreLogger(projectRoot, { bufferEnabled:false, flushSeconds:2, maxLines:200 });
  ensureProjectStructure(projectRoot, logger);

  const settings = readJson(path.join(projectRoot, FILES.settings), DEFAULT_SETTINGS);
  const rt = settings.runtime || {};
  logger = new CoreLogger(projectRoot, {
    bufferEnabled: !!rt.log_buffer_enabled,
    flushSeconds: Number(rt.log_buffer_flush_seconds||2),
    maxLines: Number(rt.log_buffer_max_lines||200)
  });

  logger.log(`Start ${TOOL_NAME} v${TOOL_VERSION} (root=${projectRoot})`);

  const coreState = {
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    build_date: BUILD_DATE,
    project_root: projectRoot,
    core: {
      session_id: sessionId,
      current_state: 'READY',
      status_text: 'Bereit',
      last_save_iso: null,
      cpu_mode: String((settings.runtime||{}).cpu_mode || 'Schonend'),
      ram_guard_enabled: !!((settings.runtime||{}).ram_guard_enabled ?? true),
      uptime_seconds: 0
    }
  };

  let __HTTP_SERVER = null;
const server = http.createServer(async (req, res)=>{
    const u = url.parse(req.url, true);
    const p = u.pathname || '/';

    // API
    if(p.startsWith('/api/')){
      res.setHeader('Cache-Control', 'no-store');
      const send = (code, obj)=>{
        const body = Buffer.from(JSON.stringify(obj));
        res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length': body.length });
        res.end(body);
      };

      coreState.core.uptime_seconds = (Date.now()-startedAt)/1000;

      if(req.method==='GET' && p==='/api/state'){
        send(200, coreState);
        return;
      }

      if(req.method==='GET' && p==='/api/settings'){
        send(200, readJson(path.join(projectRoot, FILES.settings), DEFAULT_SETTINGS));
        return;
      }

      if(req.method==='POST' && p==='/api/settings'){
        const body = await readBody(req);
        body.ui ||= {};
        body.paths ||= {};
        body.runtime ||= {};
        body.paths.project_root = projectRoot; // eine Wahrheit
        atomicWriteJson(path.join(projectRoot, FILES.settings), body);
        coreState.core.last_save_iso = nowIso();
        coreState.core.cpu_mode = String((body.runtime||{}).cpu_mode || 'Schonend');
        coreState.core.ram_guard_enabled = !!((body.runtime||{}).ram_guard_enabled ?? true);
        logger.log('settings.json gespeichert.');
        send(200, { ok:true });
        return;
      }

      if(req.method==='POST' && p==='/api/run_check'){
        // Legacy-Endpunkt: führt Preflight aus (Kurzantwort ok:true), UI nutzt neuerdings /api/preflight/run
        coreState.core.current_state = 'CHECK';
        coreState.core.status_text = 'Prüfe Projektstruktur…';

        // 1) Struktur + Hinweise
        const newHints = ensureProjectStructure(projectRoot, logger);
        const all = readJson(path.join(projectRoot, FILES.hints), []);
        const merged = Array.isArray(all) ? [...all, ...newHints] : [...newHints];
        atomicWriteJson(path.join(projectRoot, FILES.hints), merged);

        // 2) Detaillierte Preflight-Info (für Logs)
        try{ buildPreflightResult(projectRoot, logger, false); }catch(e){}

        if(newHints.some(h=>h.type==='problem')){
          coreState.core.current_state = 'PROBLEM';
          coreState.core.status_text = 'Problem erkannt (Tool läuft)';
        }else{
          coreState.core.current_state = 'READY';
          coreState.core.status_text = 'Bereit';
        }
        coreState.core.last_save_iso = nowIso();
        logger.log(`CHECK abgeschlossen. State=${coreState.core.current_state}`);
        send(200, { ok:true });
        return;
      }

      if(req.method==='GET' && p==='/api/hints'){
        const hints = readJson(path.join(projectRoot, FILES.hints), []);
        const active = chooseActiveHint(hints);
        send(200, active ? [active] : []);
        return;
      }

      if(req.method==='POST' && p==='/api/hints/test'){
        const all = readJson(path.join(projectRoot, FILES.hints), []);
        const arr = Array.isArray(all) ? all : [];
        arr.push({ id:`warn_${crypto.randomBytes(3).toString('hex')}`, type:'warning', text:'Test-Hinweis: Alles sichtbar, nichts blockiert.', action:'details', dismissible:true, timestamp: nowIso() });
        atomicWriteJson(path.join(projectRoot, FILES.hints), arr);
        logger.log('Test-Hinweis erzeugt.');
        send(200, { ok:true });
        return;
      }

      if(req.method==='POST' && p==='/api/hints/clear'){
        atomicWriteJson(path.join(projectRoot, FILES.hints), []);
        logger.log('Hinweise geleert.');
        send(200, { ok:true });
        return;
      }

      if(req.method==='POST' && p==='/api/hints/dismiss'){
        const body = await readBody(req);
        const id = String(body.id||'');
        const all = readJson(path.join(projectRoot, FILES.hints), []);
        const arr = Array.isArray(all) ? all : [];
        const filtered = arr.filter(h=>String(h.id)!==id);
        atomicWriteJson(path.join(projectRoot, FILES.hints), filtered);
        logger.log(`Hinweis entfernt: ${id}`);
        send(200, { ok:true });
        return;
      }

      send(404, { ok:false, error:'Not found' });
      return;
    }

    // Static UI
    serveStatic(p, res);
  });

  return { server, projectRoot, coreState, logger };
}

if(require.main === module){
  const opts = parseCli(process.argv.slice(2));
  const { server, projectRoot } = startServer(opts);
  __HTTP_SERVER = server;
// Preflight (auto self-repair)
runPreflight(projectRoot);

  server.listen(opts.port, opts.host, ()=>{
    // V057_RUNTIME_WRITE: runtime file fuer Laien-Start + Browser Auto-Open
    try{
      const pr = (__PROJECT_ROOT || DEFAULT_PROJECT_ROOT);
      ensureDir(pr);
      const rp = path.join(pr, '.runtime.json');
      fs.writeFileSync(rp, JSON.stringify({host: opts.host, port: opts.port, started: Date.now(), pid: process.pid}, null, 2), 'utf8');
    }catch(e){}

    const addr = server.address();
    const port = addr && typeof addr==='object' ? addr.port : opts.port;
    const host = opts.host;
    console.log(`${TOOL_NAME} Node-Server läuft: http://${host}:${port}/`);
  });
}

module.exports = {
  resolveProjectRoot,
  ensureProjectStructure,
  parseCli,
  DEFAULT_PROJECT_ROOT,
  FILES,
  DIRS,
  readJson,
  atomicWriteJson,
  chooseActiveHint,
  startServer
};



// V054_SAFE_ROOT_REDIRECT
// V057_RUNTIME_WRITE
