
/* BOOT-GUARD v0.7.3 – 20260210084426
   Ziel: Wenn JS nicht läuft, siehst du es SOFORT. Wenn init crasht, kommt ein Notfall-Overlay.
*/
(function(){
  function showFatal(msg, err){
    try{
      console.error('[Modultool][FATAL]', msg, err||'');
      let ov = document.getElementById('fatalOverlay');
      if(!ov){
        ov = document.createElement('div');
        ov.className = 'fatalOverlay';
        ov.id = 'fatalOverlay';
        document.body.appendChild(ov);
      }
      const details = err ? (err.stack||err.message||String(err)) : '';
      ov.innerHTML = `
        <div class="fatalCard">
          <div class="fatalTitle">Notfall-Overlay: UI hat einen Fehler</div>
          <div class="fatalMsg">${escapeHtml(String(msg||'Unbekannter Fehler'))}</div>
          <div class="fatalMsg" style="opacity:.9">Du kannst weiterarbeiten: Logs exportieren oder Safe-Mode.</div>
          <pre class="fatalPre">${escapeHtml(details).slice(0,4000)}</pre>
          <div class="fatalActions">
            <button class="btn" id="fatalReload">Neu laden</button>
            <button class="btn" id="fatalSafe">Safe-Mode</button>
            <button class="btn btn-warn" id="fatalExport">Logs exportieren</button>
          </div>
        </div>`;
      setTimeout(()=>{
        const r=document.getElementById('fatalReload'); if(r) r.onclick=()=>location.reload();
        const s=document.getElementById('fatalSafe'); if(s) s.onclick=()=>location.href='/safe';
        const x=document.getElementById('fatalExport'); if(x) x.onclick=async()=>{
          try{
            const res = await fetch('/api/export/logs', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
            const j = await res.json();
            alert(j && j.ok ? ('Logs exportiert: '+(j.file||'')) : 'Export fehlgeschlagen.');
          }catch(e){ alert('Export fehlgeschlagen.'); }
        };
      },0);
    }catch(_e){}
  }

  window.addEventListener('error', (e)=> showFatal('JS Fehler', e.error||e.message));
  window.addEventListener('unhandledrejection', (e)=> showFatal('Promise Fehler', e.reason));
  console.log('[Modultool] UI-Boot OK', new Date().toISOString());
  window.__showFatal = showFatal;
})();

/* V067_UI_TRACER */
/* Modultool UI – offline über lokalen Node-Server */
const API = {
  state: () => fetch('/api/state').then(r => r.json()),
  settings: () => fetch('/api/settings').then(r => r.json()),
  saveSettings: (obj) => fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj)}).then(r => r.json()),
  preflightRun: () => fetch('/api/preflight/run').then(r=>r.json()),
  preflightAutoFix: () => fetch('/api/preflight/autofix', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})}).then(r=>r.json()),
  runCheck: () => fetch('/api/run_check', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})}).then(r => r.json()),
  hints: () => fetch('/api/hints').then(r => r.json()),
  dismissHint: (id) => fetch('/api/hints/dismiss', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id})}).then(r => r.json()),
  clearHints: () => fetch('/api/hints/clear', {method:'POST'}).then(r => r.json()),
  testHint: () => fetch('/api/hints/test', {method:'POST'}).then(r => r.json()),
};

const $ = (id) => document.getElementById(id);
const logLines = [];

function uiLog(msg){
  const ts = new Date().toLocaleTimeString('de-DE', {hour12:false});
  logLines.push(`[${ts}] ${msg}`);
  while(logLines.length > 200) logLines.splice(0, 40);
  $('eventLog').textContent = logLines.slice(-22).join('\n') || '—';
}


function renderPreflight(result){
  const box = document.getElementById('preflightResult');
  const body = document.getElementById('preflightResultBody');
  const acts = document.getElementById('preflightActions');
  if(!box || !body) return;

  if(!result || result.ok===undefined){
    body.innerHTML = '<div style="color:var(--mut);font-weight:800;">Noch keine Daten.</div>';
    if(acts) acts.style.display='none';
    return;
  }

  const lvl = String(result.level||'READY').toUpperCase();
  const badgeCls = (lvl==='READY') ? 'ok' : (lvl==='WARN' ? 'warn' : 'fail');
  const top = `
    <div class="kvline">
      <span class="badge ${badgeCls}">${lvl}</span>
      <span style="font-weight:900;">${escapeHtml(result.project_root||'')}</span>
      <span style="color:var(--mut);font-weight:800;">${escapeHtml(result.ts||'')}</span>
    </div>
  `;

  const items = (result.checks||[]).map(c=>{
    const lv = String(c.level||'ok');
    const bc = (lv==='ok')?'ok':(lv==='warn'?'warn':'fail');
    return `<li>
      <span class="badge ${bc}">${escapeHtml(lv.toUpperCase())}</span>
      <div style="flex:1">
        <div class="label">${escapeHtml(c.label||c.id||'')}</div>
        <div class="detail">${escapeHtml(c.detail||'')}</div>
      </div>
    </li>`;
  }).join('');

  body.innerHTML = top + `<ul class="checklist">${items || '<li><span class="badge ok">OK</span><div class="label">Keine Checks</div></li>'}</ul>`;

  if(acts){
    const showFix = (lvl==='WARN' || lvl==='FAIL');
    acts.style.display = 'flex';
    acts.innerHTML = `
      <button class="btn btn-warn" id="pfAutoFixBtn" ${showFix?'':'disabled'} title="Repariert Struktur + Dateinamen (Linux-konform)">${showFix?'AutoFix ausführen':'AutoFix nicht nötig'}</button>
      <button class="btn" id="pfDetailsBtn" title="Zeigt Rohdaten (für Debug)">Details</button>
      <button class="btn" id="pfExportBtn" title="Logs exportieren (ZIP)">Logs exportieren</button>
      <button class="btn btn-ghost" id="pfSafeBtn" title="Weiterarbeiten im Safe-Mode">Safe-Mode</button>
    `;

    // Actions
    const aFix = document.getElementById('pfAutoFixBtn');
    if(aFix){
      aFix.addEventListener('click', async ()=>{
        uiLog('Preflight: AutoFix (Panel)');
        setStatus('AutoFix läuft…', 'warn');
        const r = await API.preflightAutoFix();
        renderPreflight(r);
        await refresh();
        setStatus('Bereit', r.level==='FAIL'?'bad':(r.level==='WARN'?'warn':'good'));
      });
    }
    const aDet = document.getElementById('pfDetailsBtn');
    if(aDet){
      aDet.addEventListener('click', ()=>showDialog('Preflight Details', `<pre style="white-space:pre-wrap;margin:0;">${escapeHtml(JSON.stringify(result,null,2))}</pre>`));
    }
    const aExp = document.getElementById('pfExportBtn');
    if(aExp){
      aExp.addEventListener('click', async ()=>{
        uiLog('Logs exportieren');
        try{
          const r = await fetch('/api/export/logs', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})}).then(x=>x.json());
          showDialog('Export', r && r.ok ? `Logs exportiert: <b>${escapeHtml(r.file||'')}</b>` : 'Export fehlgeschlagen.');
        }catch(e){
          showDialog('Export', 'Export fehlgeschlagen.');
        }
      });
    }
    const aSafe = document.getElementById('pfSafeBtn');
    if(aSafe){
      aSafe.addEventListener('click', ()=>{ location.href='/safe'; });
    }
  }
}

function setStatus(text, kind='good'){
  $('statusText').textContent = `Status: ${text}`;
  const led = $('statusLed');
  if(kind==='bad') led.style.background = 'var(--bad)';
  else if(kind==='warn') led.style.background = 'var(--warn)';
  else led.style.background = 'var(--good)';
}

function showDialog(title, bodyHtml){
  $('dlgTitle').textContent = title;
  $('dlgBody').innerHTML = bodyHtml;
  $('dlg').showModal();
}

function closeDialog(){ $('dlg').close(); }

async function refresh(){
  try{
    const st = await API.state();
    $('metaLine').textContent = `${st.core.current_state} · ${st.core.status_text}`;
    $('chipRoot').textContent = `Root: ${st.project_root}`;
    $('statSession').textContent = st.core.session_id;
    $('statCPU').textContent = st.core.cpu_mode;
    $('statRAM').textContent = st.core.ram_guard_enabled ? 'aktiv' : 'inaktiv';
    $('statUp').textContent = Math.round(st.core.uptime_seconds) + 's';
  }catch(e){
    uiLog('API nicht erreichbar (Server läuft?)');
    setStatus('Server nicht erreichbar', 'bad');
  }

  try{
    const hs = await API.hints();
    if(!hs || hs.length===0){
      $('hintText').textContent = 'Noch keine Hinweise.';
      $('hintMeta').textContent = '—';
      $('btnHintDetails').disabled = true;
      $('btnHintDismiss').disabled = true;
    }else{
      const h = hs[0];
      $('hintText').textContent = h.text || '';
      $('hintMeta').textContent = `${(h.type||'').toUpperCase()} · ${h.timestamp||''}`;
      $('btnHintDetails').disabled = false;
      $('btnHintDismiss').disabled = !h.dismissible;
      $('btnHintDetails').dataset.hid = h.id;
      $('btnHintDismiss').dataset.hid = h.id;
    }
  }catch(e){
    // ignore
  }

  try{
    const s = await API.settings();
    const ui = (s.ui || {});
    $('tHigh').checked = !!ui.high_contrast;
    $('tInv').checked = !!ui.invert_colors;
    $('tBig').checked = !!ui.large_text;
    $('tMotion').checked = !!ui.reduce_motion;
    $('tTips').checked = ui.tooltips !== false;
  }catch(e){
    // ignore
  }
}

async function updateSetting(key, val){
  uiLog(`UI-Option: ${key} = ${val}`);
  const s = await API.settings();
  s.ui = s.ui || {};
  s.ui[key] = !!val;
  await API.saveSettings(s);
  await refresh();
}

function wire(){
  $('dlgClose').addEventListener('click', closeDialog);

  $('btnPreflight').addEventListener('click', async () => {
    uiLog('Klick: Preflight');
    setStatus('Preflight läuft…', 'warn');
    const r = await API.preflightRun();
    renderPreflight(r);
    await refresh();
    setStatus('Bereit', r.level==='FAIL'?'bad':(r.level==='WARN'?'warn':'good'));
  });

  $('btnAutoFix') && $('btnAutoFix').addEventListener('click', async () => {
    uiLog('Klick: AutoFix');
    setStatus('AutoFix läuft…', 'warn');
    const r = await API.preflightAutoFix();
    renderPreflight(r);
    await refresh();
    setStatus('Bereit', r.level==='FAIL'?'bad':(r.level==='WARN'?'warn':'good'));
  });

  $('btnTestHint').addEventListener('click', async () => {
    uiLog('Klick: Test-Hinweis');
    await API.testHint();
    await refresh();
  });

  $('btnClearHints').addEventListener('click', async () => {
    uiLog('Klick: Hinweise leeren');
    await API.clearHints();
    await refresh();
  });

  $('btnHintDetails').addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.hid;
    uiLog('Klick: Details (Hinweis)');
    const hs = await API.hints();
    const h = (hs && hs[0]) ? hs[0] : null;
    if(!h){ showDialog('Details', 'Keine Hinweise.'); return; }
    showDialog('Details', `<pre style="white-space:pre-wrap;margin:0;">${escapeHtml(JSON.stringify(h,null,2))}</pre>`);
  });

  $('btnHintDismiss').addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.hid;
    uiLog('Klick: Hinweis entfernen');
    if(id) await API.dismissHint(id);
    await refresh();
  });

  $('btnHelp').addEventListener('click', () => {
    uiLog('Klick: Hilfe');
    showDialog('Hilfe', `
      <div style="color:var(--mut);font-weight:700;">
        <p>Dieses Hauptmodul läuft komplett offline, aber über lokalen Node-Server für Dateizugriff.</p>
        <ul>
          <li><b>Preflight</b> prüft/erstellt die Projektstruktur und schreibt Settings/Logs.</li>
          <li><b>Eventlog</b> zeigt jeden Klick. Wenn etwas klemmt, sieht man es sofort.</li>
          <li>Alle Pfade bleiben Linux-konform. Keine Cloud, keine Telemetrie.</li>
        </ul>
      </div>
    `);
  });

  $('btnDetails').addEventListener('click', async () => {
    uiLog('Klick: Details');
    const st = await API.state();
    showDialog('Details', `<pre style="white-space:pre-wrap;margin:0;">${escapeHtml(JSON.stringify(st,null,2))}</pre>`);
  });

  
  $('tHigh').addEventListener('change', (e)=>updateSetting('high_contrast', e.target.checked));
  $('tInv').addEventListener('change', (e)=>updateSetting('invert_colors', e.target.checked));
  $('tBig').addEventListener('change', (e)=>updateSetting('large_text', e.target.checked));
  $('tMotion').addEventListener('change', (e)=>updateSetting('reduce_motion', e.target.checked));
  $('tTips').addEventListener('change', (e)=>updateSetting('tooltips', e.target.checked));

  // Sidebar purely visual for now
  document.querySelectorAll('.navitem').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.navitem').forEach(b=>b.classList.remove('navitem-active'));
      btn.classList.add('navitem-active');
      uiLog(`Tab: ${btn.textContent.trim()}`);
    });
  });
}

function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

(async function boot(){
  uiLog('UI gestartet');
  try{ wire(); }catch(e){ window.__showFatal && window.__showFatal('wire() crash', e); }
  await refresh();
  setInterval(refresh, 1500);
})();


// V030_UI: Pages + MacroKeys + ConsoleTabs + Status polling

(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));

  function logLine(msg){
    const box = $('#eventLog');
    if(!box) return;
    const t = new Date();
    const stamp = t.toTimeString().slice(0,8);
    const line = `[${stamp}] ${msg}`;
    box.textContent = (box.textContent && box.textContent !== '—') ? (box.textContent + "\n" + line) : line;
    box.scrollTop = box.scrollHeight;
  }

  function setStatus(txt, ok=true){
    const s = $('#statusText'); if(s) s.textContent = 'Status: ' + txt;
    const led = $('#statusLed'); if(led) led.style.background = ok ? 'var(--good)' : 'var(--bad)';
  }

  function setActivePage(name){
    $$('.page').forEach(p=>p.classList.toggle('page-active', p.dataset.page===name));
    $$('.navitem').forEach(b=>b.classList.toggle('navitem-active', b.dataset.tab===name));
    logLine(`Tab: ${name}`);
  }

  // Sidebar navigation
  $$('.navitem').forEach(btn=>{
    btn.addEventListener('click', ()=> setActivePage(btn.dataset.tab));
  });

  // Macrokeys: map to key actions
  const keyMap = {
    '1': ()=>setActivePage('dashboard'),
    '2': ()=>setActivePage('settings'),
    '3': ()=>setActivePage('plugins'),
    '4': ()=>setActivePage('updates'),
    '5': ()=>setActivePage('files'),
    '6': ()=>setActivePage('logs'),
    '7': ()=>setActivePage('notes'),
    '8': ()=>setActivePage('ffmpeg'),
    '9': ()=>$('#btnPreflight')?.click(),
    '0': ()=>$('#btnHelp')?.click(),
  };
  $$('.mkey').forEach(k=>{
    k.addEventListener('click', ()=>{
      const key = k.dataset.key;
      if(keyMap[key]) keyMap[key]();
      else logLine(`Schnelltaste ${key}`);
    });
  });
  document.addEventListener('keydown', (e)=>{
    if(e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if(keyMap[k]){
      e.preventDefault();
      keyMap[k]();
    }
  });

  // Save quick: save settings + notes (best effort)
  const btnSaveQuick = $('#btnSaveQuick');
  if(btnSaveQuick){
    btnSaveQuick.addEventListener('click', async ()=>{
      logLine('Klick: Save');
      await saveSettingsFromUI(true);
      await saveNotes(true);
      setStatus('Gespeichert', true);
    });
  }

  // Console tabs
  $$('.ctab').forEach(t=>{
    t.addEventListener('click', ()=>{
      $$('.ctab').forEach(x=>x.classList.remove('ctab-active'));
      t.classList.add('ctab-active');
      logLine(`Konsole: ${t.dataset.ctab}`);
    });
  });

  // Status polling -> chips and header stats
  async function pollStatus(){
    try{
      const r = await fetch('/api/status', {cache:'no-store'});
      if(!r.ok) throw new Error('status http '+r.status);
      const st = await r.json();
      const up = st.uptime_s ?? 0;
      const root = st.project_root ?? '—';
      $('#kvUp') && ($('#kvUp').textContent = up+'s');
      $('#statUp') && ($('#statUp').textContent = up+'s');
      $('#kvRoot') && ($('#kvRoot').textContent = root);
      $('#chipRoot') && ($('#chipRoot').textContent = 'Root: ' + root);
      $('#statSession') && ($('#statSession').textContent = String(st.session||'—'));
      // runtime toggles reflect settings? best-effort
      setStatus('Bereit', true);
    }catch(e){
      setStatus('Offline', false);
    }
  }
  setInterval(pollStatus, 2000);
  pollStatus();

  // Settings: load/save via API
  function uiBool(id){ return !!$(id)?.checked; }
  function setBool(id, v){ if($(id)) $(id).checked = !!v; }

  async function loadSettingsToUI(silent=false){
    try{
      const r = await fetch('/api/settings', {cache:'no-store'});
      const j = await r.json();
      const s = j.settings || {};
      const ui = s.ui || {};
      const rt = s.runtime || {};
      setBool('#sTips', ui.tooltips);
      setBool('#sBig', ui.big_text);
      setBool('#sHigh', ui.high_contrast);
      setBool('#sInv', ui.invert);
      setBool('#sMotion', ui.reduced_motion);
      if($('#sCpu')) $('#sCpu').value = rt.cpu_mode || 'Schonend';
      setBool('#sRam', rt.ram_watch);
      if(!silent) logLine('Settings geladen');
    }catch(e){
      if(!silent) logLine('Settings laden fehlgeschlagen');
    }
  }

  async function saveSettingsFromUI(silent=false){
    const payload = {
      ui: {
        tooltips: uiBool('#sTips'),
        big_text: uiBool('#sBig'),
        high_contrast: uiBool('#sHigh'),
        invert: uiBool('#sInv'),
        reduced_motion: uiBool('#sMotion')
      },
      runtime: {
        cpu_mode: $('#sCpu') ? $('#sCpu').value : 'Schonend',
        ram_watch: uiBool('#sRam')
      }
    };
    try{
      const r = await fetch('/api/settings', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)});
      if(!r.ok) throw new Error('save http '+r.status);
      const j = await r.json();
      if(!silent) logLine('Settings gespeichert');
      // apply toggles to footer instantly
      applyUiToggles(payload.ui);
      return j;
    }catch(e){
      if(!silent) logLine('Settings speichern fehlgeschlagen');
      return null;
    }
  }

  async function saveNotes(silent=false){
    const box = $('#notesBox');
    if(!box) return;
    try{
      localStorage.setItem('modultool_notes', box.value || '');
      if(!silent) logLine('Notizen gespeichert');
    }catch(e){
      if(!silent) logLine('Notizen speichern fehlgeschlagen');
    }
  }
  async function loadNotes(silent=false){
    const box = $('#notesBox');
    if(!box) return;
    try{
      box.value = localStorage.getItem('modultool_notes') || '';
      if(!silent) logLine('Notizen geladen');
    }catch(e){
      if(!silent) logLine('Notizen laden fehlgeschlagen');
    }
  }

  $('#btnLoadSettings')?.addEventListener('click', ()=>loadSettingsToUI());
  $('#btnSaveSettings')?.addEventListener('click', ()=>saveSettingsFromUI());
  $('#btnNotesSave')?.addEventListener('click', ()=>saveNotes());
  $('#btnNotesLoad')?.addEventListener('click', ()=>loadNotes());

  // Apply toggles from footer checkboxes (existing ones) to body classes
  function applyUiToggles(ui){
    const b = document.body;
    b.classList.toggle('ui-high', !!ui.high_contrast);
    b.classList.toggle('ui-inv', !!ui.invert);
    b.classList.toggle('ui-big', !!ui.big_text);
    b.classList.toggle('ui-motionless', !!ui.reduced_motion);
  }

  // Wire footer toggles to immediate effect + reflect into settings UI (best effort)
  const footerMap = [
    ['#tHigh', 'high_contrast'],
    ['#tInv', 'invert'],
    ['#tBig', 'big_text'],
    ['#tMotion', 'reduced_motion'],
    ['#tTips', 'tooltips'],
  ];
  footerMap.forEach(([id, key])=>{
    const el = $(id);
    if(!el) return;
    el.addEventListener('change', ()=>{
      const ui = {
        tooltips: uiBool('#tTips'),
        big_text: uiBool('#tBig'),
        high_contrast: uiBool('#tHigh'),
        invert: uiBool('#tInv'),
        reduced_motion: uiBool('#tMotion'),
      };
      applyUiToggles(ui);
      // keep settings page checkboxes in sync
      setBool('#sTips', ui.tooltips);
      setBool('#sBig', ui.big_text);
      setBool('#sHigh', ui.high_contrast);
      setBool('#sInv', ui.invert);
      setBool('#sMotion', ui.reduced_motion);
    });
  });

  // Initial load
  loadSettingsToUI(true);
  loadNotes(true);

})();

// v0.3.2: Beenden -> Save + Shutdown
async function shutdownServer(){
  try{
    await fetch('/api/shutdown', {method:'POST'});
  }catch(e){}
}

(function(){
  const btnExit = document.querySelector('#btnExit');
  if(btnExit){
    btnExit.addEventListener('click', async ()=>{
      try{
        // best effort: Save quick if available
        const sq = document.querySelector('#btnSaveQuick');
        if(sq) sq.click();
      }catch(e){}
      // Give UI a moment to flush logs/settings, then shutdown
      setTimeout(()=>shutdownServer(), 120);
    });
  }
})();

// V034_FAILSAFE: Notfall-Overlay bei API-Problemen (ohne Blockade)
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const failsafe = $('#failsafe');
  const fsMsg = $('#fsMsg');
  const fsReload = $('#fsReload');
  const fsReset = $('#fsReset');
  const fsCopy = $('#fsCopyDiag');
  const fsHide = $('#fsHide');

  let lastOkTs = 0;
  let lastErr = '';
  let lastDiag = '';

  function show(msg){
    if(!failsafe) return;
    failsafe.classList.add('fs-show');
    failsafe.setAttribute('aria-hidden','false');
    if(fsMsg) fsMsg.textContent = msg;
  }
  function hide(){
    if(!failsafe) return;
    failsafe.classList.remove('fs-show');
    failsafe.setAttribute('aria-hidden','true');
  }

  async function copyText(txt){
    try{
      await navigator.clipboard.writeText(txt);
      return true;
    }catch(e){
      try{
        const ta = document.createElement('textarea');
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        return true;
      }catch(e2){ return false; }
    }
  }

  function diag(){
    const d = {
      ts: new Date().toISOString(),
      href: location.href,
      ua: navigator.userAgent,
      lastOk: lastOkTs ? new Date(lastOkTs).toISOString() : null,
      lastErr,
    };
    return JSON.stringify(d, null, 2);
  }

  fsReload && fsReload.addEventListener('click', ()=>location.reload());
  fsHide && fsHide.addEventListener('click', ()=>hide());
  fsCopy && fsCopy.addEventListener('click', async ()=>{
    lastDiag = diag();
    await copyText(lastDiag);
  });
  fsReset && fsReset.addEventListener('click', async ()=>{
    try{
      const r = await fetch('/api/reset_settings', {method:'POST'});
      if(!r.ok) throw new Error('http '+r.status);
      show('Settings wurden zurückgesetzt. Neu laden empfohlen.');
    }catch(e){
      show('Reset fehlgeschlagen (API offline?).');
    }
  });

  // Hook into status polling: if status fails N times -> show
  let failCount = 0;
  const oldFetch = window.fetch;
  window.fetch = async function(...args){
    try{
      const res = await oldFetch.apply(this, args);
      // Track core endpoints only
      if(typeof args[0] === 'string' && (args[0].includes('/api/status') || args[0].includes('/api/settings'))){
        if(res && res.ok){
          lastOkTs = Date.now();
          failCount = 0;
          hide();
        } else {
          failCount++;
          lastErr = 'HTTP ' + (res ? res.status : '0');
        }
      }
      return res;
    }catch(e){
      if(typeof args[0] === 'string' && (args[0].includes('/api/status') || args[0].includes('/api/settings'))){
        failCount++;
        lastErr = String(e && e.message ? e.message : e);
      }
      if(failCount >= 2){
        show('Kern/API nicht erreichbar. Lösung: Neu laden, Port prüfen, oder Settings reset.');
      }
      throw e;
    }
  };

})();

// V035_EXPORT: Export-Zentrum + Notes server-side (fallback localStorage)
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const list = $('#exportsList');

  function fmtSize(n){
    if(n===undefined || n===null) return '—';
    const kb = n/1024;
    if(kb < 1024) return Math.round(kb)+' KB';
    const mb = kb/1024;
    return (Math.round(mb*10)/10)+' MB';
  }
  function fmtDate(ms){
    try{ return new Date(ms).toLocaleString(); }catch(e){ return '—'; }
  }

  async function refresh(){
    if(!list) return;
    list.textContent = '…';
    try{
      const r = await fetch('/api/export/list', {cache:'no-store'});
      const j = await r.json();
      if(!j.ok) throw new Error('bad');
      if(!j.items.length){
        list.textContent = 'Keine Exporte vorhanden.';
        return;
      }
      list.innerHTML = '';
      for(const it of j.items){
        const row = document.createElement('div');
        row.className = 'exports-row';
        row.innerHTML = `
          <div class="mono">${it.name}</div>
          <div>${fmtSize(it.size)}</div>
          <div>${fmtDate(it.mtime)}</div>
          <div><a class="btn btn-primary" href="/exports/${encodeURIComponent(it.name)}" download>Download</a></div>
        `;
        list.appendChild(row);
      }
    }catch(e){
      list.textContent = 'Fehler beim Laden.';
    }
  }

  async function createExport(){
    try{
      const r = await fetch('/api/export/create', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({mode:'core'})
      });
      const j = await r.json();
      if(!j.ok) throw new Error('export failed');
      await refresh();
    }catch(e){}
  }

  $('#btnExportRefresh')?.addEventListener('click', refresh);
  $('#btnExportCreate')?.addEventListener('click', createExport);

  async function loadNotesServer(){
    const box = document.querySelector('#notesBox');
    if(!box) return false;
    try{
      const r = await fetch('/api/notes', {cache:'no-store'});
      const j = await r.json();
      if(j.ok){ box.value = j.text || ''; return true; }
    }catch(e){}
    return false;
  }
  async function saveNotesServer(){
    const box = document.querySelector('#notesBox');
    if(!box) return false;
    try{
      const r = await fetch('/api/notes', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({text: box.value || ''})
      });
      const j = await r.json();
      return !!j.ok;
    }catch(e){ return false; }
  }

  const btnNS = document.querySelector('#btnNotesSave');
  const btnNL = document.querySelector('#btnNotesLoad');
  if(btnNL){
    btnNL.addEventListener('click', async ()=>{
      const ok = await loadNotesServer();
      if(!ok){
        try{
          const box = document.querySelector('#notesBox');
          if(box) box.value = localStorage.getItem('modultool_notes') || '';
        }catch(e){}
      }
    });
  }
  if(btnNS){
    btnNS.addEventListener('click', async ()=>{
      const ok = await saveNotesServer();
      if(!ok){
        try{
          const box = document.querySelector('#notesBox');
          if(box) localStorage.setItem('modultool_notes', box.value || '');
        }catch(e){}
      }
    });
  }

  refresh();
  loadNotesServer();
})();

// V037_PREFLIGHT: Dashboard Preflight Ampel + Copy
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const dot = $('#pfDot');
  const txt = $('#pfTxt');
  const det = $('#pfDetails');

  function setLevel(level){
    if(!dot) return;
    dot.classList.remove('pf-gruen','pf-gelb','pf-rot');
    if(level==='gruen') dot.classList.add('pf-gruen');
    else if(level==='gelb') dot.classList.add('pf-gelb');
    else if(level==='rot') dot.classList.add('pf-rot');
  }

  function summarize(r){
    const issues = (r && r.issues) ? r.issues.length : 0;
    const rep = (r && r.repaired) ? r.repaired.length : 0;
    return {issues, rep};
  }

  async function load(){
    try{
      const res = await fetch('/api/preflight', {cache:'no-store'});
      const j = await res.json();
      if(!j.ok) return;
      const r = j.result;
      setLevel(r.level);
      if(txt){
        const label = (r.level||'—').toUpperCase();
        txt.textContent = 'Status: '+label;
      }
      if(det){
        const s = summarize(r);
        const hint = r.level==='gruen' ? 'System bereit.' : (r.level==='gelb' ? 'Warnungen vorhanden.' : 'Kritisch: bitte reparieren.');
        det.textContent = hint+' Issues: '+s.issues+' | Repariert: '+s.rep;
      }
    }catch(e){}
  }

  async function run(){
    try{
      const res = await fetch('/api/preflight', {method:'POST', cache:'no-store'});
      const j = await res.json();
      if(j.ok) await load();
    }catch(e){}
  }

  async function copyDiag(){
    try{
      const res = await fetch('/api/preflight', {cache:'no-store'});
      const j = await res.json();
      const txt = JSON.stringify(j, null, 2);
      if(navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(txt);
    }catch(e){}
  }

  $('#btnPreflightRun')?.addEventListener('click', run);
  $('#btnPreflightCopy')?.addEventListener('click', copyDiag);

  load();
})();

// V038_BATCH_UI: Job Queue UI (Batch/Nachtmodus)
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const list = $('#jobList');
  const tag = $('#jobStatusTag');

  function badge(state){
    if(state==='done') return '✅ done';
    if(state==='running') return '⏳ running';
    if(state==='queued') return '🕓 queued';
    if(state==='skipped') return '⚠️ skipped';
    if(state==='failed') return '🛑 failed';
    return state||'—';
  }

  async function refresh(){
    if(!list) return;
    try{
      const r = await fetch('/api/jobs/status', {cache:'no-store'});
      const j = await r.json();
      if(!j.ok) throw new Error('bad');
      const q = j.jobq;
      const sum = q.summary || {};
      if(tag){
        tag.textContent = (q.running ? 'RUNNING' : 'IDLE') + ` | OK ${sum.done||0} | SKIP ${sum.skipped||0} | FAIL ${sum.failed||0} | TOTAL ${sum.total||0}`;
      }
      if(!q.items || !q.items.length){
        list.textContent = 'Keine Jobs. (Tipp: Job hinzufügen und Start drücken.)';
        return;
      }
      list.innerHTML = '';
      for(const it of q.items){
        const row = document.createElement('div');
        row.className = 'exports-row';
        const info = it.last_error ? ('err: '+it.last_error) : (it.payload && it.payload.ms ? (it.payload.ms+'ms') : '—');
        row.innerHTML = `
          <div class="mono">${it.title}</div>
          <div>${badge(it.state)}</div>
          <div>${it.attempts}/${it.max_attempts}</div>
          <div class="mono">${info}</div>
        `;
        list.appendChild(row);
      }
    }catch(e){
      list.textContent = 'Fehler beim Laden.';
    }
  }

  async function addOk(){
    try{
      await fetch('/api/jobs/add', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({title:'Sim-Job OK', payload:{ms:650}})
      });
      await refresh();
    }catch(e){}
  }
  async function addFail(){
    try{
      await fetch('/api/jobs/add', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({title:'Sim-Job FAIL (skip)', payload:{ms:450, fail:true}})
      });
      await refresh();
    }catch(e){}
  }
  async function reset(){
    try{
      await fetch('/api/jobs/reset', {method:'POST'});
      await refresh();
    }catch(e){}
  }
  async function run(){
    try{
      await fetch('/api/jobs/run', {method:'POST'});
      for(let i=0;i<40;i++){
        await new Promise(r=>setTimeout(r, 450));
        await refresh();
        try{
          const r = await fetch('/api/jobs/status', {cache:'no-store'});
          const j = await r.json();
          if(j.ok && !j.jobq.running) break;
        }catch(e){}
      }
    }catch(e){}
  }

  $('#btnJobAddOk')?.addEventListener('click', addOk);
  $('#btnJobAddFail')?.addEventListener('click', addFail);
  $('#btnJobReset')?.addEventListener('click', reset);
  $('#btnJobRun')?.addEventListener('click', run);
  $('#btnJobRefresh')?.addEventListener('click', refresh);

  refresh();
})();

// V046_LOGOUT: Speichern & schließen (Logout)
(function(){
  const b = document.getElementById('btnLogout');
  if(!b) return;

  b.addEventListener('click', async ()=>{
    b.disabled = true;
    b.textContent = '⏻ Speichern…';
    try{
      const r = await fetch('/api/logout', {method:'POST'});
      const j = await r.json();
      b.textContent = j && j.ok ? '⏻ Schließt…' : '⏻ Fehler';
      // give the server a moment to close
      setTimeout(()=>{ window.close(); }, 350);
    }catch(e){
      b.textContent = '⏻ Fehler';
    }finally{
      setTimeout(()=>{ b.disabled = false; b.textContent='⏻ Logout'; }, 1200);
    }
  });
})();

// V047_PORT_BANNER: zeigt Port/URL + Kopierbutton
(function(){
  const banner = document.getElementById('portBanner');
  const txt = document.getElementById('portBannerText');
  const btnOpen = document.getElementById('btnOpenUrl');
  const btnCopy = document.getElementById('btnCopyUrl');
  const btnHide = document.getElementById('btnHideBanner');
  if(!banner || !txt) return;

  function show(url){
    banner.style.display = 'flex';
    txt.textContent = url;
    btnOpen && (btnOpen.onclick = ()=>{ try{ window.open(url, '_blank', 'noopener'); }catch(e){} });
    btnCopy && (btnCopy.onclick = async ()=>{
      try{ await navigator.clipboard.writeText(url); btnCopy.textContent='✅ Kopiert'; setTimeout(()=>btnCopy.textContent='📋 Kopieren', 900);}catch(e){}
    });
    btnHide && (btnHide.onclick = ()=>{
      banner.style.display = 'none';
      try{ localStorage.setItem('hide_port_banner','1'); }catch(e){}
    });
  }

  async function init(){
    try{
      if(localStorage.getItem('hide_port_banner')==='1') return;
    }catch(e){}
    try{
      const r = await fetch('/api/runtime/status', {cache:'no-store'});
      const j = await r.json();
      if(!j || !j.ok) return;
      const url = `http://${j.host}:${j.port}/`;
      show(url);
    }catch(e){}
  }
  init();
})();

// V050_AUTO_OPEN_UI: Dropdown – Browser automatisch öffnen (persistiert in settings.json)
(function(){
  const sel = document.getElementById('autoOpenSelect');
  if(!sel) return;

  async function load(){
    try{
      const r = await fetch('/api/ui/settings', {cache:'no-store'});
      const j = await r.json();
      const v = j && j.ok && j.ui ? !!j.ui.auto_open_browser : true;
      sel.value = v ? 'on' : 'off';
    }catch(e){}
  }
  async function save(){
    try{
      const v = sel.value === 'on';
      await fetch('/api/ui/settings', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({auto_open_browser:v})});
    }catch(e){}
  }
  sel.addEventListener('change', save);
  load();
})();

// V051_WIZARD_UI: Erststart-Assistent (Projektordner + Auto-Open)
(function(){
  const overlay = document.getElementById('wizardOverlay');
  if(!overlay) return;

  const step1 = document.getElementById('wizStep1');
  const step2 = document.getElementById('wizStep2');
  const step3 = document.getElementById('wizStep3');

  const inpRoot = document.getElementById('wizProjectRoot');
  const selPreset = document.getElementById('wizPreset');
  const selAuto = document.getElementById('wizAutoOpen');

  const err1 = document.getElementById('wizErr1');
  const out = document.getElementById('wizOut');

  const btnDefault = document.getElementById('btnWizUseDefault');
  const btnApplyPreset = document.getElementById('btnWizApplyPreset');
  const btnBack1 = document.getElementById('btnWizBack1');
  const btnFinish = document.getElementById('btnWizFinish');
  const finishHint = document.getElementById('wizFinishHint');

  const btnSkip = document.getElementById('btnWizSkip');

  function showOverlay(){ overlay.style.display = 'flex'; if(btnFinish){btnFinish.disabled=true;} }
  function hideOverlay(){ overlay.style.display = 'none'; }
  function showStep(n){
    step1.style.display = (n===1)?'block':'none';
    step2.style.display = (n===2)?'block':'none';
    step3.style.display = (n===3)?'block':'none';
  }
  function showErr(msg){
    err1.style.display = 'block';
    err1.textContent = msg;
  }
  function clearErr(){ err1.style.display='none'; err1.textContent=''; }

  function expandTilde(p){
    if(p && p.startsWith('~/')){
      // browser-side guess; server resolves anyway
      return p.replace('~/', '/home/' + (window.__USER || 'pppoppi') + '/');
    }
    return p;
  }

  async function api(url, method, body){
    const opt = {method: method||'GET', headers:{'content-type':'application/json'}};
    if(body) opt.body = JSON.stringify(body);
    const r = await fetch(url, opt);
    return r.json();
  }

  async function initWizard(){
    try{
      const forced = (localStorage.getItem('wizard_force')==='1');
      const st = await api('/api/wizard/status','GET');
      const already = localStorage.getItem('wizard_done')==='1';

      if(!forced && (already || (st && st.ok && st.configured))){
        return;
      }

      showOverlay();
      showStep(1);

      // prefill
      if(st && st.ok){
        inpRoot.value = st.project_root || '';
        selAuto.value = (st.auto_open_browser ? 'on' : 'off');
      }

      btnDefault && (btnDefault.onclick = ()=>{
        // default suggestion
        inpRoot.value = '~/Projekte/modultool_project';
        clearErr();
      });

      btnApplyPreset && (btnApplyPreset.onclick = ()=>{
        if(selPreset.value) inpRoot.value = selPreset.value;
        clearErr();
      });

      // Step1: validate -> go step2
      inpRoot.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'){
          e.preventDefault();
          if(!inpRoot.value.trim()){
            showErr('Bitte Projektordner eintragen oder Schnellwahl nutzen.');
            return;
          }
          clearErr();
          showStep(2);
        }
      });

  // V052_WIZARD_TEST: Projektordner testen (Schreibrechte + Struktur)
  
  const sol = document.getElementById('wizSolutions');
  const btnUseProjects = document.getElementById('btnWizUseProjects');
  const btnMakeNew = document.getElementById('btnWizMakeNew');
const btnTest = document.getElementById('btnWizTestPath');
  const testOut = document.getElementById('wizTestOut');
  let lastTestOk = false;

  function gateFinish(){
    lastTestOk = false;
    if(btnFinish) btnFinish.disabled = true;
    if(finishHint) finishHint.textContent = 'Aktiviert sich nach „Ordner testen“ = OK.';
  }
  inpRoot && inpRoot.addEventListener('input', gateFinish);


  function showTest(msg, ok){
    try{ if(sol) sol.style.display = ok ? 'none' : 'flex'; }catch(e){}

    if(!testOut) return;
    testOut.style.display='block';
    testOut.classList.remove('ok','bad');
    testOut.classList.add(ok?'ok':'bad');
    testOut.textContent = msg;
  }

  btnTest && (btnTest.onclick = async ()=>{
    clearErr();
    lastTestOk = false;
    const pr = inpRoot.value.trim();
    if(!pr){
      showErr('Bitte Projektordner eintragen oder Schnellwahl nutzen.');
      return;
    }
    showTest('Teste…', true);
    try{
      const j = await api('/api/wizard/test_path','POST',{project_root: pr});
      if(j && j.ok){
        lastTestOk = true;
        if(btnFinish) btnFinish.disabled=false;
        if(finishHint) finishHint.textContent='OK. Du kannst jetzt auf „Fertig starten“.';
        showTest('OK: Ordner ist beschreibbar und Struktur kann angelegt werden.', true);
      }else{
        if(btnFinish) btnFinish.disabled=true;
        if(finishHint) finishHint.textContent='Aktiviert sich nach „Ordner testen“ = OK.';
        showTest('Nicht OK: Ordner nicht beschreibbar oder Pfad ungültig.', false);
      }
    }catch(e){
      if(btnFinish) btnFinish.disabled=true;
      if(finishHint) finishHint.textContent='Aktiviert sich nach „Ordner testen“ = OK.';
      showTest('Nicht OK: Test fehlgeschlagen.', false);
    }
  });

  // V053_WIZARD_SOLUTIONS: immer Klick-Ausweg anbieten (Laien)
  function suggestProjects(){
    inpRoot.value = '~/Projekte/modultool_project';
    clearErr();
    showTest('Vorschlag gesetzt. Drück jetzt „Ordner testen“.', true);
  }

  btnUseProjects && (btnUseProjects.onclick = ()=>{
    suggestProjects();
  });

  btnMakeNew && (btnMakeNew.onclick = ()=>{
    const base = '~/Projekte/modultool_project_' + Math.floor(Math.random()*9000 + 1000);
    inpRoot.value = base;
    clearErr();
    showTest('Neuer Ordner vorgeschlagen. Drück jetzt „Ordner testen“.', true);
  });





      // click anywhere on step1 next by using Default button twice: keep simple
      step1.addEventListener('dblclick', ()=>{
        if(!inpRoot.value.trim()){
          showErr('Bitte Projektordner eintragen oder Schnellwahl nutzen.');
          return;
        }
        clearErr();
        showStep(2);
      });

      btnBack1 && (btnBack1.onclick = ()=>{ showStep(1); });

      // Step2 -> step3 when selection changes
      selAuto && selAuto.addEventListener('change', ()=>{ showStep(3);
      if(!lastTestOk && btnFinish){btnFinish.disabled=true;}
 });

      // if user does not touch dropdown, allow doubleclick to proceed
      step2.addEventListener('dblclick', ()=>{ showStep(3); });

      btnSkip && (btnSkip.onclick = ()=>{
        localStorage.setItem('wizard_done','1');
        hideOverlay();
      });

      btnFinish && (btnFinish.onclick = async ()=>{
        // Tipp: Du kannst vorher „Ordner testen“ drücken. Ist optional.

        out.style.display='block';
        out.textContent='Speichere…';
        btnFinish.disabled = true;
        try{
          const pr = inpRoot.value.trim();
          const auto = (selAuto.value === 'on');
          const j = await api('/api/wizard/set_project_root','POST',{project_root: pr, auto_open_browser: auto});
          if(j && j.ok){
            localStorage.setItem('wizard_done','1');
            out.textContent = 'Fertig. Lade Oberfläche…';
            setTimeout(()=>location.reload(), 350);
          }else{
            out.textContent = 'Fehler: ' + (j && j.error ? j.error : 'unbekannt');
            btnFinish.disabled = false;
          }
        }catch(e){
          out.textContent = 'Fehler: ' + String(e);
          btnFinish.disabled = false;
        }
      });
    }catch(e){
      // fail silent
    }
  }

  initWizard();
})();

// V053_WIZARD_SOLUTIONS

// V054_FINISH_GATED


  // V057_STATE_REFRESH: UI-State (Root/Session/Runtime) + Exit-Modal fuer Laien
  const exitModal = document.getElementById('exitModal');
  const exitMode = document.getElementById('exitMode');
  const exitOut = document.getElementById('exitOut');
  const btnExitGo = document.getElementById('btnExitGo');
  const btnExitCancel = document.getElementById('btnExitCancel');
  const btnBeenden = document.getElementById('btnBeenden');

  async function refreshState(){
    try{
      const j = await get('/api/state');
      if(!j || !j.ok) return;

      // Root badge (falls vorhanden)
      const pill = document.querySelector('.pill-root') || document.querySelector('[data-root]') || document.querySelector('.root-pill') || document.querySelector('.root');
      if(pill) pill.textContent = 'Root: ' + (j.project_root || '-');

      // Falls KV-Table vorhanden (data-kv Struktur)
      const map = {
        'Session': j.session_id || '-',
        'CPU-Modus': (j.cpu_mode || 'schonend'),
        'RAM-Wächter': j.ram_watcher ? 'aktiv' : 'aus',
        'Laufzeit': (j.uptime_s||0) + 's'
      };
      document.querySelectorAll('[data-kv]').forEach(row=>{
        const k=row.getAttribute('data-kv');
        const v=map[k];
        const vv = row.querySelector('.kv-v');
        if(v!==undefined && vv) vv.textContent = v;
      });
    }catch(e){}
  }
  refreshState();
  setInterval(refreshState, 10000);

  function openExitModal(){
    if(exitOut) exitOut.textContent='';
    if(exitModal) exitModal.style.display='flex';
  }
  function closeExitModal(){
    if(exitModal) exitModal.style.display='none';
  }
  if(btnBeenden) btnBeenden.onclick = ()=> openExitModal();
  if(btnExitCancel) btnExitCancel.onclick = ()=> closeExitModal();
  if(exitModal) exitModal.addEventListener('click', (ev)=>{ if(ev.target===exitModal) closeExitModal(); 

  // V058_BRIEF: Projektbeschreibung fuellen + Toggle
  const btnBriefToggle = document.getElementById('btnBriefToggle');
  const briefBody = document.getElementById('briefBody');

  function setTxt(id, v){
    const el = document.getElementById(id);
    if(el) el.textContent = (v===undefined || v===null || v==='') ? '—' : String(v);
  }

  async function refreshManifestAndState(){
    try{
      const mf = await get('/api/manifest');
      if(mf && mf.ok && mf.manifest){
        setTxt('mfName', mf.manifest.name || 'Modultool');
        setTxt('mfVersion', mf.manifest.version || '—');
        setTxt('mfBuild', mf.manifest.build_date || '—');
      }
    }catch(e){}
    try{
      const st = await get('/api/state');
      if(st && st.ok){
        // host/port aus runtime wenn vorhanden
        const rt = st.runtime || {};
        setTxt('mfHost', rt.host || '127.0.0.1');
        setTxt('mfPort', rt.port || '—');
        setTxt('mfRoot', st.project_root || '—');
      }
    }catch(e){}
  }
  refreshManifestAndState();
  setInterval(refreshManifestAndState, 15000);

  if(btnBriefToggle && briefBody){
    btnBriefToggle.onclick = ()=>{
      const hidden = (briefBody.style.display==='none');
      briefBody.style.display = hidden ? 'block' : 'none';
      btnBriefToggle.textContent = hidden ? '▾' : '▸';
    };
  }
  // V058_BRIEF



  // V059_LAYOUT: Panel-Raster + Theme + A11y + Scan + FailSafe
  function moveIntoSlot(selector, slotId){
    const el = document.querySelector(selector);
    const slot = document.getElementById(slotId);
    if(el && slot && !slot.__filled){
      slot.appendChild(el);
      slot.__filled = true;
    }
  }
  // Versuche, existierende Blöcke in die 2x2 Slots zu schieben
  moveIntoSlot('#systemOverview, .system-overview, [data-block="system"]', 'panelSystemSlot');
  moveIntoSlot('#hintBox, .hinweisbox, [data-block="hints"]', 'panelHintsSlot');
  moveIntoSlot('#eventLog, .eventlog, [data-block="eventlog"]', 'panelEventlogSlot');
  moveIntoSlot('#projectBrief, .card#projectBrief', 'panelBriefSlot');

  // Theme + A11y laden/speichern
  const themeSelect = document.getElementById('themeSelect');
  const btnA11y = document.getElementById('btnA11y');
  const a11yModal = document.getElementById('a11yModal');
  const btnA11yClose = document.getElementById('btnA11yClose');
  const btnA11ySave = document.getElementById('btnA11ySave');
  const a11yOut = document.getElementById('a11yOut');

  const a11yContrast = document.getElementById('a11yContrast');
  const a11yInvert = document.getElementById('a11yInvert');
  const a11yBig = document.getElementById('a11yBig');
  const a11yMotion = document.getElementById('a11yMotion');
  const a11yTips = document.getElementById('a11yTips');

  function applyUiFromSettings(st){
    const ui = (st && st.ui) ? st.ui : {};
    const ax = (st && st.accessibility) ? st.accessibility : {};
    const theme = ui.theme || 'dunkel';
    document.body.classList.remove('theme-dunkel','theme-hell','theme-carmouflage','theme-sonnendaemmerung');
    document.body.classList.add('theme-' + theme);
    if(themeSelect) themeSelect.value = theme;

    document.body.classList.toggle('a11y-contrast', !!ax.high_contrast);
    document.body.classList.toggle('a11y-invert', !!ax.invert);
    document.body.classList.toggle('a11y-big', !!ax.big_text);
    document.body.classList.toggle('a11y-motion', !!ax.reduced_motion);
    // Tooltips: simple switch via data-tooltip usage
    document.body.dataset.tooltips = ax.tooltips ? '1' : '0';

    if(a11yContrast) a11yContrast.checked = !!ax.high_contrast;
    if(a11yInvert) a11yInvert.checked = !!ax.invert;
    if(a11yBig) a11yBig.checked = !!ax.big_text;
    if(a11yMotion) a11yMotion.checked = !!ax.reduced_motion;
    if(a11yTips) a11yTips.checked = !!ax.tooltips;
  }

  async function loadSettings(){
    try{
      const j = await get('/api/settings/get');
      if(j && j.ok) applyUiFromSettings(j.settings);
      return j && j.settings;
    }catch(e){ return null; }
  }
  async function saveSettings(patch){
    try{
      const cur = await get('/api/settings/get').catch(()=>({ok:false}));
      const base = (cur && cur.ok) ? cur.settings : {};
      const next = Object.assign({}, base, patch||{});
      const j = await post('/api/settings/set', next).catch(()=>null);
      if(j && j.ok){ applyUiFromSettings(j.settings); return true; }
      return false;
    }catch(e){ return false; }
  }

  loadSettings();

  if(themeSelect){
    themeSelect.onchange = async ()=>{
      await saveSettings({ ui: { theme: themeSelect.value } });
    };
  }

  function openA11y(){ if(a11yOut) a11yOut.textContent=''; if(a11yModal) a11yModal.style.display='flex'; }
  function closeA11y(){ if(a11yModal) a11yModal.style.display='none'; }
  if(btnA11y) btnA11y.onclick = ()=> openA11y();
  if(btnA11yClose) btnA11yClose.onclick = ()=> closeA11y();
  if(a11yModal) a11yModal.addEventListener('click', (ev)=>{ if(ev.target===a11yModal) closeA11y(); });

  if(btnA11ySave){
    btnA11ySave.onclick = async ()=>{
      const patch = { accessibility: {
        high_contrast: !!(a11yContrast && a11yContrast.checked),
        invert: !!(a11yInvert && a11yInvert.checked),
        big_text: !!(a11yBig && a11yBig.checked),
        reduced_motion: !!(a11yMotion && a11yMotion.checked),
        tooltips: !!(a11yTips && a11yTips.checked),
      }};
      const ok = await saveSettings(patch);
      if(a11yOut) a11yOut.textContent = ok ? 'OK gespeichert.' : 'Konnte nicht speichern. Safe Mode nutzen.';
    };
  }

  // Marker-Scan (Button optional in UI: wir hängen ihn an die Hinweisbox Actions falls vorhanden)
  async function runScan(){
    const j = await post('/api/scan/run', {}).catch(()=>null);
    if(j && j.ok){
      addHint('Scan OK: ' + j.count + ' Marker gefunden.', 'info');
    }else{
      addHint('Scan fehlgeschlagen. Safe Mode nutzen.', 'warn');
    }
  }
  const scanBtn = document.getElementById('btnScan') || document.querySelector('[data-action="scan"]');
  if(scanBtn) scanBtn.onclick = ()=> runScan();

  // Fail-Safe Overlay
  const fsOv = document.getElementById('failsafeOverlay');
  const fsTxt = document.getElementById('failsafeText');
  const fsDiag = document.getElementById('failsafeDiag');
  function showFailSafe(msg, diag){
    if(fsTxt) fsTxt.textContent = msg || 'Problem erkannt.';
    if(fsDiag) fsDiag.textContent = diag ? String(diag) : '';
    if(fsOv) fsOv.style.display='flex';
  }
  function hideFailSafe(){ if(fsOv) fsOv.style.display='none'; }

  const fsRetry = document.getElementById('fsRetry');
  const fsPreflight = document.getElementById('fsPreflight');
  const fsSelf = document.getElementById('fsSelfRepair');
  const fsSafe = document.getElementById('fsSafe');
  const fsExport = document.getElementById('fsExport');
  const fsClose = document.getElementById('fsClose');

  if(fsClose) fsClose.onclick = ()=> hideFailSafe();
  if(fsSafe) fsSafe.onclick = ()=> { window.location.href='/safe'; };
  if(fsRetry) fsRetry.onclick = async ()=> { hideFailSafe(); await refreshState(); };
  if(fsPreflight) fsPreflight.onclick = async ()=> { try{ await post('/api/preflight', {}); addHint('Preflight gestartet.', 'info'); }catch(e){} };
  if(fsSelf) fsSelf.onclick = async ()=> { try{ const j=await post('/api/selfrepair/run', {}); addHint('Self-Repair: ' + ((j&&j.ok)?'OK':'fail'), (j&&j.ok)?'info':'warn'); }catch(e){} };
  if(fsExport) fsExport.onclick = async ()=> { try{ const j=await post('/api/export/logs', {}); addHint((j&&j.ok)?'Log exportiert.':'Log export fehlgeschlagen.', (j&&j.ok)?'info':'warn'); }catch(e){} };

  // Hook: wenn wichtige API-Calls scheitern -> Overlay statt stiller Leere
  const __oldGet = get;
  window.get = async function(url){
    const r = await __oldGet(url).catch((e)=>{ showFailSafe('API nicht erreichbar: ' + url, e); throw e; });
    if(!r || r.ok===false){
      showFailSafe('Antwort fehlerhaft: ' + url, JSON.stringify(r));
    }
    return r;
  };

  // V059_LAYOUT



  // V060_FOOTER: Tabs + Systemstatus + Export + Macro Save + Scan
  const footer = document.getElementById('footer');
  const sysState = document.getElementById('sysState');
  const kvChips = document.getElementById('kvChips');
  const btnFooterExport = document.getElementById('btnFooterExport');
  const keySave = document.getElementById('keySave');
  const btnScan2 = document.getElementById('btnScan');

  function setSysBadge(level){
    if(!sysState) return;
    const lv = (level||'READY').toUpperCase();
    sysState.textContent = lv;
    sysState.classList.remove('ready','warn','safe');
    if(lv==='WARN') sysState.classList.add('warn');
    else if(lv==='SAFE') sysState.classList.add('safe');
    else sysState.classList.add('ready');
  }

  async function pollStatus(){
    try{
      const st = await get('/api/status');
      if(st && st.ok){
        setSysBadge((st.status && st.status.level) ? st.status.level : 'READY');
      }
    }catch(e){
      setSysBadge('WARN');
    }
  }
  setInterval(pollStatus, 2000);
  pollStatus();

  function renderChips(state){
    if(!kvChips) return;
    kvChips.innerHTML = '';
    const items = [
      ['Root', state && state.project_root ? state.project_root : '-'],
      ['Port', state && state.runtime ? String(state.runtime.port) : '-'],
      ['CPU', state && state.cpu_mode ? state.cpu_mode : '-'],
      ['RAM', state && state.ram_guard ? 'aktiv' : 'aus'],
    ];
    for(const [k,v] of items){
      const d = document.createElement('div');
      d.className='chip';
      d.textContent = k + ': ' + v;
      kvChips.appendChild(d);
    }
  }

  // Patch refreshState to also update footer chips
  const __oldRefresh = (typeof refreshState==='function') ? refreshState : null;
  window.refreshState = async function(){
    let j = null;
    try{
      j = await get('/api/state');
      if(j && j.ok){
        renderChips(j);
      }
    }catch(e){}
    if(__oldRefresh){
      try{ await __oldRefresh(); }catch(e){}
    }
    return j;
  };
  // initial
  refreshState();

  // Footer tabs basic switching (keine harte Logik, nur UI)
  if(footer){
    footer.querySelectorAll('.tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        footer.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        addHint('Tab: ' + btn.dataset.tab, 'info');
      });
    });
  }

  if(btnFooterExport){
    btnFooterExport.onclick = async ()=>{
      const j = await post('/api/export/logs', {}).catch(()=>null);
      addHint((j&&j.ok)?('Log exportiert: ' + j.file):'Log export fehlgeschlagen.', (j&&j.ok)?'info':'warn');
    };
  }

  if(btnScan2){
    btnScan2.onclick = async ()=>{
      const j = await post('/api/scan/run', {}).catch(()=>null);
      addHint((j&&j.ok)?('Scan OK: ' + j.count + ' Marker'): 'Scan fehlgeschlagen.', (j&&j.ok)?'info':'warn');
    };
  }

  if(keySave){
    keySave.onclick = async ()=>{
      // "Save" als harter Anker: speichert Settings + schreibt Save-Event (Server kann später mehr speichern)
      const ok = await saveSettings({ ui: { last_save: Date.now() } });
      addHint(ok ? 'Save: OK' : 'Save: fehlgeschlagen', ok?'info':'warn');
    };
  }

  
  // V061_GRID: Inhalte ins 2x2 Panel-Raster ziehen (robust, ohne Crash)
  function moveInto(slotId, selectorList){
    const slot = document.getElementById(slotId);
    if(!slot) return false;
    for(const sel of selectorList){
      const el = document.querySelector(sel);
      if(el){
        slot.appendChild(el);
        return true;
      }
    }
    return false;
  }

  // Heuristik: wir ziehen bestehende Karten/Blöcke nach Slots
  try{
    // System Overview
    moveInto('slotA', ['#systemOverviewCard', '#systemOverview', '.system-overview', '[data-block="system-overview"]']);
    // Hinweisbox
    moveInto('slotB', ['#hintBoxCard', '#hintBox', '.hintbox', '[data-block="hintbox"]']);
    // Projektbeschreibung / Status
    moveInto('slotC', ['#projectBriefCard', '#projectBrief', '.project-brief', '[data-block="project-brief"]']);
    // Eventlog
    moveInto('slotD', ['#eventLogCard', '#eventLog', '.eventlog', '[data-block="eventlog"]']);
  }catch(e){
    // niemals crashen, höchstens Warn-Hint
    try{ addHint('Raster: Inhalte konnten nicht komplett umsortiert werden.', 'warn'); }catch(_){}
  }

  // Panel-Icon Buttons: nur UX (keine harte Window-Logik), niemals crashen
  document.querySelectorAll('.panel .picon').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const t = (btn.getAttribute('title')||'').toLowerCase();
      if(t.includes('close')) addHint('Panel: Close (Demo)', 'info');
      else if(t.includes('min')) addHint('Panel: Min (Demo)', 'info');
      else if(t.includes('pop')) addHint('Panel: Pop (Demo)', 'info');
      else if(t.includes('pin')) addHint('Panel: Pin (Demo)', 'info');
    });
  });

  // V061_GRID


  // V062_SNIPPETS: Textbausteine + Macrokeys -> Clipboard + Eventlog

  // V064_INIT_KEYS: Macro-Keys Defaultanzeige
  (function initKeys(){
    for(let k=1;k<=12;k++){
      const btn = document.getElementById('key'+k);
      if(!btn) continue;
      btn.classList.add('empty');
      btn.setAttribute('data-tip', 'Taste '+k+': leer (Baustein zuweisen)');
      btn.innerHTML = `<div class="knum">${k}</div><div class="ktitle">leer</div>`;
    }
  })()

  // V065_EMPTY_KEY_FOCUS: Klick auf leere Taste -> Snippets öffnen + Taste vorwählen
  function focusSnippetsWithKey(k){
    try{
      const mod = document.getElementById('snippetModule');
      const sel = document.getElementById('snipKey');
      const title = document.getElementById('snipTitle');
      if(sel) sel.value = String(k);
      if(mod){
        mod.scrollIntoView({behavior:'smooth', block:'start'});
        setTimeout(()=>{ if(title) title.focus(); }, 380);
      }
      addHint('Taste '+k+' ist leer: Baustein anlegen und speichern.', 'info');
    }catch(e){}
  }

;
  const snipTitle = document.getElementById('snipTitle');
  const snipText  = document.getElementById('snipText');
  const snipKey   = document.getElementById('snipKey');
  const snipSave  = document.getElementById('snipSave');
  const snipClear = document.getElementById('snipClear');
  const snipReload= document.getElementById('snipReload');
  const snipList  = document.getElementById('snipList');
  const snipOut   = document.getElementById('snipOut');

  let __snips = [];
  let __activeId = null;

  function uiMsg(txt){
    if(!snipOut) return;
    snipOut.textContent = txt || '';
  }

  async function loadSnips(){
    const j = await get('/api/snippets/list').catch(()=>null);
    if(j && j.ok && j.data && Array.isArray(j.data.items)){
      __snips = j.data.items.slice();
      renderSnips();
      uiMsg('OK geladen: ' + __snips.length);
      return true;
    }
    uiMsg('Konnte nicht laden. Safe Mode nutzen.');
    return false;
  }

  function renderSnips(){
    if(!snipList) return;
    snipList.innerHTML = '';
    const items = __snips.slice().sort((a,b)=> (a.key||999)-(b.key||999) || String(a.title).localeCompare(String(b.title)));
    for(const it of items){
      const d = document.createElement('div');
      d.className = 'item';
      const keyTag = (it.key!=null) ? ('<span class="k">Taste '+it.key+'</span>') : '';
      d.innerHTML = `<div class="t">${escapeHtml(it.title||'')}</div><div class="m">${escapeHtml((it.text||'').slice(0,120))}</div>${keyTag}
        <div class="row2">
          <button class="btn btn-ghost mini" data-act="del">Löschen</button>
        </div>`;
      d.addEventListener('click', (ev)=>{
        const act = ev.target && ev.target.dataset ? ev.target.dataset.act : '';
        if(act==='del'){ ev.stopPropagation(); deleteSnip(it.id); return; }
        __activeId = it.id;
        if(snipTitle) snipTitle.value = it.title||'';
        if(snipText) snipText.value = it.text||'';
        if(snipKey) snipKey.value = (it.key!=null) ? String(it.key) : '';
        uiMsg('Bearbeiten: ' + (it.title||''));
      });
      snipList.appendChild(d);
    }
    syncMacroKeyTips();
  }

  function syncMacroKeyTips(){

    for(let k=1;k<=12;k++){
      const btn = document.getElementById('key'+k);
      if(!btn) continue;
      const it = __snips.find(x=>x.key===k);
      const title = it ? (it.title||('Taste '+k)) : '';
      btn.classList.toggle('empty', !it);
      btn.setAttribute('data-tip', it ? (title) : ('Taste '+k+': leer (Baustein zuweisen)'));
      btn.innerHTML = `<div class="knum">${k}</div><div class="ktitle">${escapeHtml(it ? (it.title||'') : 'leer')}</div>`;
    }

  }
  }

  async function saveSnip(){
    const title = snipTitle ? snipTitle.value.trim() : '';
    const text  = snipText ? snipText.value : '';
    const keyV  = snipKey && snipKey.value ? Number(snipKey.value) : null;
    if(!title || !text){
      uiMsg('Titel + Text sind Pflicht.');
      return;
    }
    const item = {id: __activeId, title, text, key: keyV};
    const j = await post('/api/snippets/save', {item}).catch(()=>null);
    if(j && j.ok){
      __snips = (j.data && Array.isArray(j.data.items)) ? j.data.items : __snips;
      __activeId = item.id;
      renderSnips();
      uiMsg('Gespeichert.');
      await post('/api/log/event', {type:'snippet_save', title, key:keyV}).catch(()=>null);
      return;
    }
    uiMsg('Speichern fehlgeschlagen. Safe Mode nutzen.');
  }

  async function deleteSnip(id){
    const j = await post('/api/snippets/delete', {id}).catch(()=>null);
    if(j && j.ok){
      __snips = (j.data && Array.isArray(j.data.items)) ? j.data.items : [];
      if(__activeId===id) __activeId=null;
      renderSnips();
      uiMsg('Gelöscht.');
      await post('/api/log/event', {type:'snippet_delete', id}).catch(()=>null);
      return;
    }
    uiMsg('Löschen fehlgeschlagen.');
  }

  function clearForm(){
    __activeId = null;
    if(snipTitle) snipTitle.value='';
    if(snipText) snipText.value='';
    if(snipKey) snipKey.value='';
    uiMsg('');
  }

  if(snipSave) snipSave.onclick = ()=> saveSnip();
  if(snipClear) snipClear.onclick = ()=> clearForm();
  if(snipReload) snipReload.onclick = ()=> loadSnips();

  async function copyToClipboard(txt){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(txt);
        return true;
      }
    }catch(e){}
    try{
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position='fixed';
      ta.style.left='-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){ return false; }
  }

  
  // V063_CLIP_OVERLAY: manuelles Kopieren wenn Browser blockt
  const clipOverlay = document.getElementById('clipOverlay');
  const clipText = document.getElementById('clipText');
  const clipTry = document.getElementById('clipTry');
  const clipClose = document.getElementById('clipClose');
  const clipOut = document.getElementById('clipOut');

  function openClipOverlay(txt){
    if(!clipOverlay || !clipText) return;
    clipText.value = txt || '';
    clipOverlay.style.display = 'flex';
    clipText.focus();
    clipText.select();
    if(clipOut) clipOut.textContent = 'Hinweis: STRG+C kopiert sicher.';
  }
  function closeClipOverlay(){
    if(!clipOverlay) return;
    clipOverlay.style.display = 'none';
    if(clipOut) clipOut.textContent = '';
  }
  if(clipClose) clipClose.onclick = ()=> closeClipOverlay();
  if(clipTry) clipTry.onclick = async ()=>{
    const ok = await copyToClipboard(clipText ? clipText.value : '');
    if(clipOut) clipOut.textContent = ok ? 'OK kopiert.' : 'Kopieren erneut blockiert. Nutze STRG+C.';
  };
  // V063_CLIP_OVERLAY

async function macroCopy(k){
    const it = __snips.find(x=>x.key===k);
    if(!it){
      addHint('Taste '+k+': leer. Baustein zuweisen.', 'warn');
      return;
    }
    const ok = await copyToClipboard(it.text||'');
    addHint(ok ? ('Kopiert: '+it.title) : ('Kopieren fehlgeschlagen: '+it.title), ok?'info':'warn');
    await post('/api/log/event', {type:'snippet_copy', key:k, title: it.title}).catch(()=>null);
  }

  for(let k=1;k<=12;k++){
    const btn = document.getElementById('key'+k);
    if(btn) btn.onclick = ()=> macroCopy(k);
  }

  loadSnips();
  // V062_SNIPPETS


  // V062_TOOLTIP: Tooltip bleibt sichtbar (Offset + Clamp)
  const tipEl = document.getElementById('tooltip');
  let tipOn = false;

  function showTip(text, x, y){
    if(!tipEl || !text) return;
    tipEl.textContent = text;
    tipEl.style.display = 'block';
    const pad = 14;
    let nx = x + 18;
    let ny = y + 22;
    tipEl.style.left = nx + 'px';
    tipEl.style.top  = ny + 'px';
    const r = tipEl.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    if(r.right > vw - pad) nx = Math.max(pad, vw - pad - r.width);
    if(r.bottom > vh - pad) ny = Math.max(pad, vh - pad - r.height);
    tipEl.style.left = nx + 'px';
    tipEl.style.top  = ny + 'px';
    tipOn = true;
  }
  function hideTip(){
    if(!tipEl) return;
    tipEl.style.display = 'none';
    tipOn = false;
  }

  document.addEventListener('mouseover', (ev)=>{
    const t = ev.target;
    if(!t) return;
    const txt = t.getAttribute('data-tip') || t.getAttribute('title');
    if(txt){
      showTip(txt, ev.clientX, ev.clientY);
    }
  });
  document.addEventListener('mouseout', ()=> hideTip());
  document.addEventListener('mousemove', (ev)=>{
    if(!tipOn) return;
    showTip(tipEl.textContent, ev.clientX, ev.clientY);
  });
  window.addEventListener('scroll', ()=> hideTip(), {passive:true});

  // V062_TOOLTIP

// V060_FOOTER

});

  if(btnExitGo) btnExitGo.onclick = async ()=>{
    const mode = (exitMode && exitMode.value) ? exitMode.value : 'save_exit';
    try{
      if(exitOut) exitOut.textContent='…';
      if(mode==='safe'){ window.location.href='/safe'; return; }
      if(mode==='selfrepair'){
        const j = await post('/api/selfrepair/run', {}).catch(()=>null);
        if(exitOut) exitOut.textContent = (j && j.ok) ? ('Self-Repair OK: ' + (j.fixes||[]).join(', ')) : 'Self-Repair nicht verfügbar. Safe Mode nutzen.';
        return;
      }
      const j = await post('/api/exit', { save: (mode==='save_exit') }).catch(()=>null);
      if(exitOut) exitOut.textContent = (j && j.ok) ? 'OK. Du kannst den Tab schließen.' : 'Exit konnte nicht bestätigt werden. Safe Mode öffnen.';
      try{ window.close(); }catch(e){}
    }catch(e){ if(exitOut) exitOut.textContent = String(e); }
  };

  // V057_STATE_REFRESH

  // V063_HISTORY: Verlauf (alte Snippets) laden und kopierbar machen
  const histReload = document.getElementById('histReload');
  const histList = document.getElementById('histList');
  const histCount = document.getElementById('histCount');

  async function loadHistory(){
    const j = await get('/api/snippets/history').catch(()=>null);
    const items = (j && j.ok && Array.isArray(j.items)) ? j.items : [];
    if(histCount) histCount.textContent = items.length + ' Einträge';
    if(!histList) return;
    histList.innerHTML = '';
    for(const it of items){
      const d = document.createElement('div');
      d.className = 'item';
      const when = it.ts ? new Date(it.ts).toLocaleString() : '';
      d.innerHTML = `<div class="t">${escapeHtml(it.title||'')}</div>
        <div class="m">${escapeHtml((it.text||'').slice(0,120))}</div>
        <div class="row2">
          <span class="chip">${escapeHtml(when)}</span>
          <div style="flex:1"></div>
          <button class="btn mini" data-act="copy">Kopieren</button>
        </div>`;
      const b = d.querySelector('button[data-act="copy"]');
      if(b) b.onclick = async (ev)=>{
        ev.stopPropagation();
        const ok = await copyToClipboard(it.text||'');
        addHint(ok ? 'Verlauf kopiert.' : 'Kopieren blockiert (Fallback geöffnet).', ok?'info':'warn');
        if(!ok) openClipOverlay(it.text||'');
        await post('/api/log/event', {type:'snippet_history_copy', title: it.title||''}).catch(()=>null);
      };
      histList.appendChild(d);
    }
  }
  if(histReload) histReload.onclick = ()=> loadHistory();
  setTimeout(()=> loadHistory(), 800);

  // V065_BIND_KEYS
  const macroBar = document.querySelector('.macrokeys');
  if(macroBar){
    macroBar.addEventListener('click', (ev)=>{
      const b = ev.target.closest && ev.target.closest('button.key');
      if(!b) return;
      const id = b.id || '';
      const m = id.match(/key(\d+)/);
      if(!m) return;
      const k = parseInt(m[1],10);
      const it = __snips.find(x=>x.key===k);
      if(!it){ focusSnippetsWithKey(k); }
    });
  }


  // V063_HISTORY


(function(){
  const __log = (...a)=>{ try{ console.log('[UI]',...a);}catch(e){} };
  const __warn = (...a)=>{ try{ console.warn('[UI]',...a);}catch(e){} };

  function wireClickTracer(){
    document.addEventListener('click',(ev)=>{
      const b = ev.target && (ev.target.closest ? ev.target.closest('button,a,[role="button"]') : null);
      if(!b) return;
      const label = (b.innerText||b.title||b.id||b.className||'button').toString().trim().slice(0,60);
      __log('Klick:', label, 'Hinweis: falls nichts passiert -> F12 Console + Eventlog prüfen.');
    }, true);
    __log('Click-Tracer aktiv.');
  }

  function applyTheme(val){
    const v = (val||'dawn').toLowerCase();
    document.body.classList.remove('theme-dark','theme-light','theme-dawn','theme-camo');
    document.body.classList.add('theme-'+v);
    try{ localStorage.setItem('provoware_theme', v);}catch(e){}
    __log('Theme gesetzt:', v);
  }

  function wireTheme(){
    const sel = document.getElementById('themeSelect');
    if(!sel){ __warn('ThemeSelect fehlt'); return; }
    let saved = 'dawn';
    try{ saved = localStorage.getItem('provoware_theme') || 'dawn'; }catch(e){}
    sel.value = saved;
    applyTheme(saved);
    sel.addEventListener('change', ()=> applyTheme(sel.value));
  }

  function boot(){
    wireClickTracer();
    wireTheme();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();

// V067_BIND_FALLBACK: falls ältere App-Version, minimal Buttons aktivieren
(function(){
  function q(id){ return document.getElementById(id); }
  function safe(fn){ return ()=>{ try{ fn(); }catch(e){ console.error('[UI] Fehler:',e); alert('Fehler: '+e.message+'\nTipp: öffne F12 -> Console und nutze Export/Logs.'); } }; }
  function boot(){
    const pre = document.querySelector('button[data-action="preflight"], #btnPreflight');
    if(pre) pre.addEventListener('click', safe(()=>{ console.log('[UI] Preflight (Fallback)'); }));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
