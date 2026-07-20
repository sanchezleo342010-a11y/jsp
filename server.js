const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'database.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.json());

let activationLogs = [];
function logActivity(key, hwid, status) {
    activationLogs.unshift({
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        key: key || "N/A", hwid: hwid || "N/A", status
    });
    if (activationLogs.length > 50) activationLogs.pop();
}

function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        const init = { keys: { "SERENITY-LIFETIME-DEV": { type: "lifetime", expires: "Lifetime", hwid: "", note: "Test Key" } } };
        fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 4));
        return init;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4)); }

// Client Auth Endpoint
app.get('/auth.php', (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) { logActivity(key, hwid, "FAILED: Missing params"); return res.send("INVALID"); }
    const db = loadDB();
    if (!db.keys[key]) { logActivity(key, hwid, "FAILED: Key not found"); return res.send("INVALID"); }
    const k = db.keys[key];
    if (k.type !== 'lifetime' && new Date() > new Date(k.expires)) { logActivity(key, hwid, "FAILED: Expired"); return res.send("EXPIRED"); }
    if (!k.hwid) { k.hwid = hwid; saveDB(db); logActivity(key, hwid, "SUCCESS: Registered HWID"); }
    else if (k.hwid !== hwid) { logActivity(key, hwid, "FAILED: HWID mismatch"); return res.send("HWID_MISMATCH"); }
    else { logActivity(key, hwid, "SUCCESS: Authorized"); }
    res.send("OK:" + k.expires);
});

// Admin API
const requireAuth = (req, res, next) => (req.headers['authorization'] === ADMIN_PASSWORD) ? next() : res.status(401).json({ error: "Unauthorized" });
app.get('/api/keys', requireAuth, (req, res) => res.json(loadDB().keys));
app.get('/api/logs', requireAuth, (req, res) => res.json(activationLogs));
app.post('/api/generate', requireAuth, (req, res) => {
    const { type, note } = req.body;
    if (type !== '1month' && type !== 'lifetime') return res.status(400).json({ error: "Invalid type" });
    const r = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const key = `SERENITY-${r()}-${r()}-${r()}`;
    const db = loadDB();
    let expires = "Lifetime";
    if (type === '1month') { const d = new Date(); d.setDate(d.getDate() + 30); expires = d.toISOString().split('T')[0]; }
    db.keys[key] = { type, expires, hwid: "", note: note || "N/A" };
    saveDB(db);
    res.json({ key, type, expires, note: db.keys[key].note });
});
app.post('/api/reset', requireAuth, (req, res) => {
    const { key } = req.body; const db = loadDB();
    if (!db.keys[key]) return res.status(404).json({ error: "Key not found" });
    db.keys[key].hwid = ""; saveDB(db); res.json({ success: true });
});
app.post('/api/update-note', requireAuth, (req, res) => {
    const { key, note } = req.body; const db = loadDB();
    if (!db.keys[key]) return res.status(404).json({ error: "Key not found" });
    db.keys[key].note = note || ""; saveDB(db); res.json({ success: true });
});
app.post('/api/delete', requireAuth, (req, res) => {
    const { key } = req.body; const db = loadDB();
    if (!db.keys[key]) return res.status(404).json({ error: "Key not found" });
    delete db.keys[key]; saveDB(db); res.json({ success: true });
});

// Landing Page
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Serenity Client</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;font-family:'Outfit',sans-serif}body{background:#06080c;color:#e5e6e8;margin:0;display:flex;flex-direction:column;align-items:center;min-height:100vh}.bar{width:100%;height:4px;background:linear-gradient(90deg,#ff007f,#00f0ff)}header{width:100%;max-width:1100px;padding:25px 20px;display:flex;justify-content:space-between;align-items:center}.logo{font-size:26px;font-weight:800;color:#ff007f;text-decoration:none;letter-spacing:2px}.admin-link{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#8a9bb4;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600}.hero{text-align:center;padding:60px 20px;max-width:800px}.hero h2{font-size:46px;font-weight:800;margin:0 0 15px;color:#fff}.hero p{font-size:16px;color:#8a9bb4;line-height:1.6;margin-bottom:30px}.btns{display:flex;gap:15px;justify-content:center}.btn{padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none}.btn.p{background:linear-gradient(135deg,#ff007f,#b30059);color:#fff}.btn.s{background:linear-gradient(135deg,#00f0ff,#0094a0);color:#000}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;width:100%;max-width:1100px;padding:40px 20px}.card{background:rgba(8,11,17,0.5);border:1px solid #121727;border-radius:12px;padding:24px}.card h3{color:#00f0ff;margin:0 0 10px;font-size:18px}.card p{color:#8a9bb4;font-size:14px;margin:0}</style></head><body><div class="bar"></div><header><a href="#" class="logo">SERENITY</a><a href="/admin" class="admin-link">Admin Access</a></header><div class="hero"><h2>SERENITY CLIENT</h2><p>Native, highly-optimized utility client for Minecraft Bedrock Edition featuring modern sidebar UI, Reach & Knockback extensions, and Stream Proof security.</p><div class="btns"><a href="/admin" class="btn p">Get Started</a><a href="/admin" class="btn s">Admin Panel</a></div></div><div class="grid"><div class="card"><h3>Sleek UI</h3><p>Built with Dear ImGui and DirectX 11 for hardware acceleration.</p></div><div class="card"><h3>Combat Extensions</h3><p>Custom Reach and Velocity knockback controls.</p></div><div class="card"><h3>Stream Proof</h3><p>Bypass OBS and Discord screen capture automatically.</p></div><div class="card"><h3>HWID Protection</h3><p>Locks keys to unique hardware signatures.</p></div></div></body></html>`);
});

// Admin Panel
app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Serenity Admin</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;font-family:'Outfit',sans-serif}body{background:#04060a;color:#e5e6e8;margin:0;display:flex;flex-direction:column;align-items:center;min-height:100vh}.bar{width:100%;height:4px;background:linear-gradient(90deg,#ff007f,#00f0ff)}.container{width:100%;max-width:1100px;padding:20px}.card{background:rgba(8,11,17,0.7);border:1px solid #121727;border-radius:12px;padding:24px;margin-bottom:20px}.title{font-size:18px;font-weight:600;color:#00f0ff;margin:0 0 15px;display:flex;justify-content:space-between;align-items:center}input,select{background:#070a0f;border:1px solid #161e30;border-radius:8px;color:#fff;padding:12px;font-size:14px;width:100%;margin-bottom:12px;outline:none}button{background:linear-gradient(135deg,#00f0ff,#0094a0);border:none;border-radius:8px;color:#000;padding:12px;font-weight:600;cursor:pointer;width:100%}button.danger{background:linear-gradient(135deg,#ff007f,#b30059);color:#fff}button.secondary{background:#121926;color:#8a9bb4;border:1px solid #1c293f}.flex{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.flex>*{margin-bottom:0!important;flex:1}.stats{display:flex;gap:15px;margin-bottom:20px}.stat{flex:1;background:#080b11;border:1px solid #121727;border-radius:10px;padding:20px;text-align:center}.stat-num{font-size:32px;font-weight:800}.stat-num.a{color:#00f0ff}.stat-num.t{color:#ff007f}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:left;border-bottom:1px solid #121727;font-size:13px}th{color:#485464;text-transform:uppercase;font-size:11px}.badge{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600}.badge.l{background:rgba(0,240,255,0.1);color:#00f0ff}.badge.m{background:rgba(255,0,127,0.1);color:#ff007f}.badge.off{background:rgba(72,84,100,0.2);color:#8a9bb4}.toast{position:fixed;bottom:20px;right:20px;background:#0c1018;border:1px solid #00f0ff;color:#fff;padding:12px 24px;border-radius:8px;display:none;font-weight:600}.log-box{max-height:180px;overflow-y:auto;background:#05070b;border:1px solid #121727;border-radius:8px;padding:12px;font-family:monospace;font-size:12px}.log-item{padding:5px 0;border-bottom:1px solid #121727;display:flex;justify-content:space-between}</style></head><body><div class="bar"></div><div id="loginView" class="container" style="max-width:380px;margin-top:80px"><div class="card"><div class="title" style="justify-center;color:#ff007f">SERENITY ADMIN</div><input type="password" id="passwordInput" placeholder="Password" onkeydown="if(event.key==='Enter')attemptLogin()"><button id="loginBtn" onclick="attemptLogin()">Login</button><div id="loginError" style="color:#ff007f;text-align:center;margin-top:10px;font-size:13px"></div></div></div><div id="dashboardView" class="container" style="display:none"><header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h1 style="color:#ff007f;margin:0">SERENITY</h1><button class="secondary" onclick="logout()" style="width:auto;padding:6px 14px">Logout</button></header><div class="stats"><div class="stat"><div class="stat-num t" id="totalKeys">0</div><div style="font-size:12px;color:#485464">TOTAL KEYS</div></div><div class="stat"><div class="stat-num a" id="activeKeys">0</div><div style="font-size:12px;color:#485464">ACTIVE USERS</div></div></div><div class="card"><div class="title">Key Generator</div><div class="flex"><input type="text" id="buyerNote" placeholder="Buyer Note (e.g. Alex)"><select id="keyType"><option value="1month">30 Days</option><option value="lifetime">Lifetime</option></select><button onclick="generateKey()" style="max-width:140px">Generate</button></div><div id="genOutput" style="display:none;margin-top:15px;background:rgba(0,240,255,0.05);border:1px dashed rgba(0,240,255,0.3);padding:12px;border-radius:8px;align-items:center;justify-content:space-between"><span id="genKeyText" style="font-family:monospace;color:#00f0ff;font-weight:800"></span><button onclick="copyKey()" style="width:auto;padding:6px 14px">Copy</button></div></div><div class="card"><div class="title"><span>Licenses</span><input type="text" id="searchInput" placeholder="Search..." oninput="filterKeys()" style="max-width:200px;margin:0;padding:6px 10px;font-size:12px"></div><div style="overflow-x:auto"><table><thead><tr><th>Key</th><th>Duration</th><th>Expiration</th><th>HWID</th><th>Notes</th><th>Actions</th></tr></thead><tbody id="keysTable"></tbody></table></div></div><div class="card"><div class="title"><span>Live Logs</span><button class="secondary" onclick="refreshLogs()" style="width:auto;padding:4px 10px;font-size:11px">Refresh</button></div><div class="log-box" id="logsBox"></div></div></div><div id="toast" class="toast"></div><script>
let adminPassword = "", lastKey = "";
function showToast(m){const t=document.getElementById("toast");t.innerText=m;t.style.display="block";setTimeout(()=>t.style.display="none",3000);}
window.onload=function(){const s=sessionStorage.getItem("admin_auth");if(s){adminPassword=s;document.getElementById("loginView").style.display="none";document.getElementById("dashboardView").style.display="block";refreshDashboard();refreshLogs();setInterval(refreshLogs,15000);}}
function attemptLogin(){const p=document.getElementById("passwordInput").value,e=document.getElementById("loginError"),b=document.getElementById("loginBtn");if(!p){e.innerText="Enter password";return;}b.innerText="Checking...";fetch("/api/keys",{headers:{"Authorization":p}}).then(r=>{if(r.ok){adminPassword=p;sessionStorage.setItem("admin_auth",p);document.getElementById("loginView").style.display="none";document.getElementById("dashboardView").style.display="block";refreshDashboard();refreshLogs();setInterval(refreshLogs,15000);}else{e.innerText="Invalid Password";b.innerText="Login";}}).catch(()=>{e.innerText="Connection error";b.innerText="Login";});}
function logout(){sessionStorage.removeItem("admin_auth");location.reload();}
function refreshDashboard(){fetch("/api/keys",{headers:{"Authorization":adminPassword}}).then(r=>r.json()).then(renderTable);}
function renderTable(keys){const tb=document.getElementById("keysTable");tb.innerHTML="";let t=0,a=0;for(const[k,d] of Object.entries(keys)){t++;if(d.hwid)a++;const tr=document.createElement("tr");tr.setAttribute("data-k",k.toLowerCase());tr.setAttribute("data-n",(d.note||"").toLowerCase());const bt=d.type==="lifetime"?"l":"m",tl=d.type==="lifetime"?"Lifetime":"30 Days",hb=d.hwid?'<span class="badge off">Locked</span>':'<span class="badge l">Unused</span>';tr.innerHTML='<td style="font-family:monospace;font-weight:600">'+k+'</td><td><span class="badge '+bt+'">'+tl+'</span></td><td>'+d.expires+'</td><td>'+hb+'</td><td><input type="text" value="'+(d.note||'')+'" onchange="updateNote(\''+k+'\',this.value)" style="margin:0;padding:4px;font-size:12px;background:transparent;border:1px dashed rgba(255,255,255,0.15)"></td><td>'+(d.hwid?'<button class="secondary" onclick="resetHWID(\''+k+'\')" style="padding:4px 8px;font-size:11px;margin-right:4px">Reset</button>':'')+'<button class="danger" onclick="deleteKey(\''+k+'\')" style="padding:4px 8px;font-size:11px">Delete</button></td>';tb.appendChild(tr);}document.getElementById("totalKeys").innerText=t;document.getElementById("activeKeys").innerText=a;}
function filterKeys(){const q=document.getElementById("searchInput").value.toLowerCase();document.querySelectorAll("#keysTable tr").forEach(r=>{r.style.display=(r.getAttribute("data-k").includes(q)||r.getAttribute("data-n").includes(q))?"":"none";});}
function updateNote(k,n){fetch("/api/update-note",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k,note:n})}).then(()=>{showToast("Note updated");refreshDashboard();});}
function generateKey(){const t=document.getElementById("keyType").value,n=document.getElementById("buyerNote").value;fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({type:t,note:n})}).then(r=>r.json()).then(r=>{lastKey=r.key;document.getElementById("genKeyText").innerText=r.key;document.getElementById("genOutput").style.display="flex";document.getElementById("buyerNote").value="";showToast("Key generated");refreshDashboard();});}
function copyKey(){if(lastKey)navigator.clipboard.writeText(lastKey).then(()=>showToast("Copied!"));}
function resetHWID(k){fetch("/api/reset",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k})}).then(()=>{showToast("HWID unlocked");refreshDashboard();});}
function deleteKey(k){if(confirm("Delete key "+k+"?"))fetch("/api/delete",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k})}).then(()=>{showToast("Deleted");refreshDashboard();});}
function refreshLogs(){fetch("/api/logs",{headers:{"Authorization":adminPassword}}).then(r=>r.json()).then(logs=>{const box=document.getElementById("logsBox");if(!logs.length){box.innerHTML='<div style="color:#485464;text-align:center">No activity</div>';return;}box.innerHTML="";logs.forEach(l=>{const d=document.createElement("div");d.className="log-item";const s=l.status.startsWith("SUCCESS")?"#00ff7f":"#ff007f";d.innerHTML='<span>['+l.time+'] Key: <b style="font-family:monospace">'+l.key+'</b></span><span style="color:'+s+'">'+l.status+'</span>';box.appendChild(d);});});}
</script></body></html>`);
});

app.listen(PORT, () => { console.log(`Auth server running on port ${PORT}`); });
