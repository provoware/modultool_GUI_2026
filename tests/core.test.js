// core.test.js (node:test) – no external deps
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel){
  return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');
}

test('server.js parses/accepts project root', async () => {
  const s = read('server.js');
  assert.ok(s.includes('resolveProjectRoot'), 'resolveProjectRoot exists');
  assert.ok(s.includes('MODULTOOL_PROJECT_ROOT'), 'env override exists');
  assert.ok(s.includes('parseRootStr'), 'root parser exists');
});

test('project structure maker exists', async () => {
  const s = read('server.js');
  assert.ok(s.includes('ensureProjectStructure'), 'ensureProjectStructure exists');
  assert.ok(s.includes('settings.json'), 'settings file referenced');
});

test('API endpoints exist (state/settings/preflight/export/safe)', async () => {
  const s = read('server.js');
  for(const p of ['/api/state','/api/settings','/api/run_check','/api/export/list','/api/export/create','/api/preflight','/api/safe/diag','/api/safe/report','/api/safe/restart','/api/safe/autofix']){
    assert.ok(s.includes(p), 'endpoint exists: '+p);
  }
});

test('startServer returns projectRoot and server', async () => {
  const s = read('server.js');
  assert.ok(s.includes('return { server, projectRoot'), 'startServer return includes projectRoot');
});

test('no orphaned .listen and no common typos', async () => {
  const s = read('server.js');
  assert.ok(!s.includes('\n.listen('), 'no orphaned .listen');
  assert.ok(!s.includes('server__HTTP_SERVER'), 'no server__HTTP_SERVER typo');
});

test('export handler not appended after module.exports', async () => {
  const s = read('server.js');
  const idx = s.lastIndexOf('module.exports');
  assert.ok(idx !== -1, 'module.exports exists');
  const tail = s.slice(idx);
  assert.ok(!tail.includes('/api/export/list'), 'no export route after module.exports');
  assert.ok(!tail.includes('req.url'), 'no req usage after module.exports');
});

test('safe mode UI exists and has buttons/dropdown', async () => {
  const s = read('server.js');
  assert.ok(s.includes('SAFE MODE'), 'safe mode label');
  assert.ok(s.includes('btnPreflight'), 'preflight button in safe UI');
  assert.ok(s.includes('btnAutoFix'), 'autofix button in safe UI');
  assert.ok(s.includes('selAction'), 'dropdown in safe UI');
});

test('web UI exists and contains core layout hooks', async () => {
    const html = read('web/index.html');
  const js = read('web/app.js');
  assert.ok(html.includes('<title>'), 'has title');
  assert.ok(html.toLowerCase().includes('sidebar') || html.includes('nav'), 'has sidebar-ish structure');
  assert.ok(js.includes('fetch(') || js.includes('XMLHttpRequest'), 'UI talks to API');
});

test('logout endpoint exists', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('/api/logout'), 'has /api/logout');
  t.ok(s.includes('listenWithAutoPort'), 'has auto port picker');
});

test('runtime status endpoint exists', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('/api/runtime/status'), 'has /api/runtime/status');
});

test('ui settings endpoint exists', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('/api/ui/settings'), 'has /api/ui/settings');
  t.ok(s.includes('writeRuntimeFile'), 'has writeRuntimeFile');
});

test('wizard endpoints exist', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('/api/wizard/status'), 'has /api/wizard/status');
  t.ok(s.includes('/api/wizard/set_project_root'), 'has /api/wizard/set_project_root');
});

test('wizard test endpoint exists', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('/api/wizard/test_path'), 'has /api/wizard/test_path');
});

test('wizard solutions ui exists', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const h = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(h.includes('btnWizUseProjects'), 'has solution button 1');
  t.ok(h.includes('btnWizMakeNew'), 'has solution button 2');
});

test('wizard finish gated', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const h = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(h.includes('id="btnWizFinish"') && h.includes('disabled'), 'finish button starts disabled');
});
test('safe force env supported', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes('MODULTOOL_FORCE_SAFE'), 'supports MODULTOOL_FORCE_SAFE');
});

test('start.sh robust node argv', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const sh = fs.readFileSync(path.join(__dirname,'..','start.sh'),'utf8');
  t.ok(sh.includes('process.argv[1]'), 'uses argv for node -e json read (no bash quoting bug)');
});

test('no nested template url', async (t) => {
  const fs = require('fs');
  const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.notOk(s.includes('`http://${j.host}:${j.port}/safe`'), 'removed nested template literal');
});

test('state endpoint exists', async (t) => {
  const fs = require('fs'); const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes("/api/state"), "has /api/state");
  t.ok(s.includes("/api/exit"), "has /api/exit");
  t.ok(s.includes("/api/selfrepair/run"), "has /api/selfrepair/run");
});
test('exit modal exists', async (t) => {
  const fs = require('fs'); const path = require('path');
  const h = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(h.includes('id="exitModal"'), 'exit modal present');
  t.ok(h.includes('id="exitMode"'), 'exit dropdown present');
});

test('manifest endpoint exists', async (t) => {
  const fs = require('fs'); const path = require('path');
  const s = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(s.includes("/api/manifest"), "has /api/manifest");
});

test('integration: start server and call state', async (t) => {
  const {spawn} = require('child_process');
  const http = require('http');
  const path = require('path');

  function reqJson(port, p, method='GET', body=null){
    return new Promise((resolve,reject)=>{
      const data = body ? Buffer.from(JSON.stringify(body)) : null;
      const opt = {host:'127.0.0.1', port, path:p, method, headers:{}};
      if(data){ opt.headers['content-type']='application/json'; opt.headers['content-length']=data.length; }
      const r = http.request(opt, (res)=>{
        let buf=''; res.on('data',c=>buf+=c);
        res.on('end', ()=>{
          try{ resolve(JSON.parse(buf||'{}')); }catch(e){ resolve({}); }
        });
      });
      r.on('error', reject);
      if(data) r.write(data);
      r.end();
    });
  }

  const port = 18000 + Math.floor(Math.random()*1000);
  const child = spawn(process.execPath, [path.join(__dirname,'..','server.js'), '--host','127.0.0.1','--port', String(port)], {stdio:['ignore','pipe','pipe']});

  await new Promise((resolve)=>{
    let done=false;
    const to = setTimeout(()=>{ if(!done) resolve(); }, 1500);
    child.stdout.on('data', ()=>{ if(!done){ done=true; clearTimeout(to); resolve(); }});
    child.stderr.on('data', ()=>{ /* ignore */ });
  });

  const st = await reqJson(port, '/api/state').catch(()=>null);
  t.ok(st && st.ok===true, 'state ok');
  const mf = await reqJson(port, '/api/manifest').catch(()=>null);
  t.ok(mf && mf.ok===true, 'manifest ok');
  const ex = await reqJson(port, '/api/exit', 'POST', {save:false}).catch(()=>null);
  t.ok(ex && ex.ok===true, 'exit ok');

  try{ child.kill('SIGTERM'); }catch(e){}
});

test('api: status endpoint exists', (t) => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(src.includes("/api/status"), 'status endpoint declared');
});

test('api: snippets endpoints declared', (t) => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(src.includes("/api/snippets/list"), 'snippets list');
  t.ok(src.includes("/api/snippets/save"), 'snippets save');
  t.ok(src.includes("/api/snippets/delete"), 'snippets delete');
  t.ok(src.includes("/api/log/event"), 'event log');
});

test('api: snippets history endpoint declared', (t) => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  t.ok(src.includes("/api/snippets/history"), 'snippets history');
});

test('ui: panelgrid exists', (t) => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(html.includes('panelgrid'), 'panelgrid wrapper');
});
test('ui: empty key focus helper present', (t) => {
  const fs = require('fs');
  const path = require('path');
  const js = fs.readFileSync(path.join(__dirname,'..','web','app.js'),'utf8');
  t.ok(js.includes('focusSnippetsWithKey'), 'empty key focus');
});

test('ui: layout wrapper exists', (t) => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(html.includes('class="layout"'), 'layout wrapper');
});

test('ui: theme select exists', (t) => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(html.includes('id="themeSelect"'), 'theme select');
});
test('ui: mainwrap exists', (t) => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname,'..','web','index.html'),'utf8');
  t.ok(html.includes('class="mainwrap"'), 'mainwrap');
});


test('preflight endpoints exist', async () => {
  const s = read('server.js');
  assert.ok(s.includes('/api/preflight/run'));
  assert.ok(s.includes('/api/preflight/autofix'));
  assert.ok(s.includes('buildPreflightResult'));
});

test('UI has Preflight result box + AutoFix', async () => {
  const h = read('web/index.html');
  assert.ok(h.includes('id="preflightResult"'));
  assert.ok(h.includes('id="btnAutoFix"'));
  assert.ok(h.includes('id="panelSystemSlot"'));
  const js = read('web/app.js');
  assert.ok(js.includes('renderPreflight'));
  assert.ok(js.includes('preflightAutoFix'));
});
