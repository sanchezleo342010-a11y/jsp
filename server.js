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
        const init = { keys: { "SERENITY-LIFETIME-DEV": { type: "lifetime", expires: "Lifetime", hwid: "", note: "Default Key" } } };
        fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 4));
        return init;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4)); }

// Client Auth API
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
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Serenity Client</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;font-family:'Outfit',sans-serif}body{background:#05070b;color:#e5e6e8;margin:0;display:flex;flex-direction:column;align-items:center;min-height:100vh}.bar{width:100%;height:3px;background:linear-gradient(90deg,#ff007f,#00f0ff);box-shadow:0 0 12px rgba(0,240,255,0.5)}header{width:100%;max-width:1100px;padding:25px 20px;display:flex;justify-content:space-between;align-items:center}.logo{font-size:26px;font-weight:800;color:#ff007f;text-decoration:none;letter-spacing:2px;text-shadow:0 0 12px rgba(255,0,127,0.4)}.admin-link{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#8a9bb4;padding:8px 18px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;transition:all 0.2s}.admin-link:hover{border-color:#00f0ff;color:#00f0ff}.hero{text-align:center;padding:70px 20px;max-width:800px}.hero h2{font-size:48px;font-weight:800;margin:0 0 15px;color:#fff;letter-spacing:1px}.hero p{font-size:16px;color:#8a9bb4;line-height:1.6;margin-bottom:30px}.btns{display:flex;gap:15px;justify-content:center}.btn{padding:13px 28px;border-radius:10px;font-weight:600;text-decoration:none;transition:all 0.2s}.btn.p{background:linear-gradient(135deg,#ff007f,#b30059);color:#fff;box-shadow:0 4px 20px rgba(255,0,127,0.3)}.btn.s{background:linear-gradient(135deg,#00f0ff,#0094a0);color:#000;box-shadow:0 4px 20px rgba(0,240,255,0.2)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;width:100%;max-width:1100px;padding:40px 20px}.card{background:rgba(12,16,25,0.6);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:25px;backdrop-filter:blur(10px);transition:all 0.2s}.card:hover{border-color:rgba(0,240,255,0.3);transform:translateY(-3px)}.card h3{color:#00f0ff;margin:0 0 10px;font-size:18px}.card p{color:#8a9bb4;font-size:14px;margin:0}</style></head><body><div class="bar"></div><header><a href="#" class="logo">SERENITY</a><a href="/admin" class="admin-link">Admin Access</a></header><div class="hero"><h2>SERENITY CLIENT</h2><p>Native, highly-optimized utility client for Minecraft Bedrock Edition featuring modern sidebar UI, Reach & Knockback extensions, and Stream Proof security.</p><div class="btns"><a href="/admin" class="btn p">Get Started</a><a href="/admin" class="btn s">Admin Panel</a></div></div><div class="grid"><div class="card"><h3>Sleek UI</h3><p>Built with Dear ImGui and DirectX 11 for hardware acceleration.</p></div><div class="card"><h3>Combat Extensions</h3><p>Custom Reach and Velocity knockback controls.</p></div><div class="card"><h3>Stream Proof</h3><p>Bypass OBS and Discord screen capture automatically.</p></div><div class="card"><h3>HWID Protection</h3><p>Locks keys to unique hardware signatures.</p></div></div></body></html>`);
});

// Admin Panel (Upgraded Premium Glassmorphic Design)
app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Serenity Admin Panel</title><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;font-family:'Outfit',sans-serif}
body{background:#040609;color:#e2e8f0;margin:0;display:flex;flex-direction:column;align-items:center;min-height:100vh;background-image:radial-gradient(circle at 50% -20%,rgba(0,240,255,0.1),transparent 50%),radial-gradient(circle at 80% 80%,rgba(255,0,127,0.06),transparent 45%)}
.top-glow{width:100%;height:3px;background:linear-gradient(90deg,#ff007f,#00f0ff);box-shadow:0 0 15px rgba(0,240,255,0.6)}
.container{width:100%;max-width:1100px;padding:25px 20px}
.glass-card{background:rgba(10,14,23,0.75);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:24px;backdrop-filter:blur(16px);box-shadow:0 12px 40px rgba(0,0,0,0.4);transition:border-color 0.2s}
.glass-card:hover{border-color:rgba(0,240,255,0.2)}
.card-head{font-size:18px;font-weight:700;color:#00f0ff;margin:0 0 20px;display:flex;justify-content:space-between;align-items:center;letter-spacing:0.5px}
input,select{background:rgba(6,9,15,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;padding:14px 16px;font-size:14px;width:100%;margin-bottom:16px;outline:none;transition:all 0.2s}
input:focus,select:focus{border-color:#ff007f;box-shadow:0 0 15px rgba(255,0,127,0.25)}
button{background:linear-gradient(135deg,#00f0ff,#009eb0);border:none;border-radius:10px;color:#030712;padding:13px 20px;font-weight:700;font-size:14px;cursor:pointer;width:100%;transition:all 0.2s;box-shadow:0 4px 15px rgba(0,240,255,0.25)}
button:hover{opacity:0.95;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,240,255,0.35)}
button:active{transform:scale(0.98)}
button.danger{background:linear-gradient(135deg,#ff007f,#b30059);color:#fff;box-shadow:0 4px 15px rgba(255,0,127,0.25)}
button.danger:hover{box-shadow:0 6px 20px rgba(255,0,127,0.35)}
button.secondary{background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);box-shadow:none}
button.secondary:hover{color:#fff;border-color:#00f0ff;background:rgba(0,240,255,0.1)}
.login-card{max-width:400px;width:100%;margin-top:90px;position:relative;background:rgba(10,14,23,0.85);border:1px solid rgba(255,0,127,0.3);box-shadow:0 0 50px rgba(255,0,127,0.15)}
.login-card::before{content:'';position:absolute;top:-1px;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,#ff007f,transparent)}
.login-btn{background:linear-gradient(135deg,#ff007f,#b30059);color:#fff;box-shadow:0 4px 20px rgba(255,0,127,0.3)}
.login-btn:hover{box-shadow:0 6px 25px rgba(255,0,127,0.45)}
.grid-flex{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.grid-flex>*{margin-bottom:0!important;flex:1}
.stats-container{display:flex;gap:18px;margin-bottom:24px}
.stat-pill{flex:1;background:rgba(10,14,23,0.6);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:22px;text-align:center;backdrop-filter:blur(10px)}
.stat-val{font-size:36px;font-weight:800;margin-bottom:4px}
.stat-val.total{color:#ff007f;text-shadow:0 0 15px rgba(255,0,127,0.3)}
.stat-val.active{color:#00f0ff;text-shadow:0 0 15px rgba(0,240,255,0.3)}
.stat-title{font-size:11px;color:#64748b;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
table{width:100%;border-collapse:collapse}
th,td{padding:14px 16px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13.5px}
th{color:#64748b;text-transform:uppercase;font-size:11px;letter-spacing:1px;font-weight:700}
tr:hover td{background:rgba(255,255,255,0.02)}
.badge{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.5px}
.badge.lft{background:rgba(0,240,255,0.12);color:#00f0ff;border:1px solid rgba(0,240,255,0.25)}
.badge.mth{background:rgba(255,0,127,0.12);color:#ff007f;border:1px solid rgba(255,0,127,0.25)}
.badge.lck{background:rgba(100,116,139,0.15);color:#cbd5e1;border:1px solid rgba(100,116,139,0.3)}
.badge.free{background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.25)}
.toast-msg{position:fixed;bottom:24px;right:24px;background:#0f172a;border:1px solid #00f0ff;color:#fff;padding:14px 24px;border-radius:10px;display:none;font-weight:600;box-shadow:0 10px 30px rgba(0,240,255,0.3);z-index:100}
.log-terminal{max-height:200px;overflow-y:auto;background:#020408;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;font-family:monospace;font-size:12.5px}
.log-row{padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;justify-content:space-between}
.status-indicator{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;display:inline-block;margin-right:8px}
.lock-icon{font-size:24px;margin-bottom:8px;display:block;text-align:center}
</style></head><body><div class="top-glow"></div>
<div id="loginView" class="container login-card glass-card">
    <span class="lock-icon">🔒</span>
    <div class="card-head" style="justify-content:center;color:#ff007f;font-size:22px;letter-spacing:3px;margin-bottom:24px">SERENITY ADMIN</div>
    <input type="password" id="passwordInput" placeholder="Enter Password" onkeydown="if(event.key==='Enter')attemptLogin()">
    <button id="loginBtn" class="login-btn" onclick="attemptLogin()">Login to Dashboard</button>
    <div id="loginError" style="color:#ff007f;text-align:center;margin-top:14px;font-size:13px;font-weight:600"></div>
</div>
<div id="dashboardView" class="container" style="display:none">
    <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <div style="display:flex;align-items:center">
            <span class="status-indicator"></span>
            <h1 style="color:#ff007f;margin:0;font-size:26px;letter-spacing:2px;text-shadow:0 0 15px rgba(255,0,127,0.4)">SERENITY</h1>
        </div>
        <button class="secondary" onclick="logout()" style="width:auto;padding:8px 18px">Logout</button>
    </header>
    <div class="stats-container">
        <div class="stat-pill"><div class="stat-val total" id="totalKeys">0</div><div class="stat-title">Total Licenses</div></div>
        <div class="stat-pill"><div class="stat-val active" id="activeKeys">0</div><div class="stat-title">Active Users (HWID Locked)</div></div>
    </div>
    <div class="glass-card">
        <div class="card-head">Key Generator</div>
        <div class="grid-flex">
            <input type="text" id="buyerNote" placeholder="Buyer Note (e.g. Alex Discord)">
            <select id="keyType"><option value="1month">30 Days (1 Month)</option><option value="lifetime">Lifetime Access</option></select>
            <button onclick="generateKey()" style="max-width:160px">Generate</button>
        </div>
        <div id="genOutput" style="display:none;margin-top:18px;background:rgba(0,240,255,0.06);border:1px dashed rgba(0,240,255,0.3);padding:14px;border-radius:10px;align-items:center;justify-content:space-between">
            <span id="genKeyText" style="font-family:monospace;color:#00f0ff;font-size:17px;font-weight:800;letter-spacing:1px"></span>
            <button onclick="copyKey()" style="width:auto;padding:8px 16px">Copy Key</button>
        </div>
    </div>
    <div class="glass-card">
        <div class="card-head">
            <span>Licenses Database</span>
            <input type="text" id="searchInput" placeholder="Search key or notes..." oninput="filterKeys()" style="max-width:220px;margin:0;padding:8px 12px;font-size:13px">
        </div>
        <div style="overflow-x:auto">
            <table>
                <thead><tr><th>License Key</th><th>Duration</th><th>Expiration</th><th>HWID Lock</th><th>Buyer Note</th><th>Actions</th></tr></thead>
                <tbody id="keysTable"></tbody>
            </table>
        </div>
    </div>
    <div class="glass-card">
        <div class="card-head">
            <span>Live System Activity</span>
            <button class="secondary" onclick="refreshLogs()" style="width:auto;padding:5px 12px;font-size:11px">Refresh Logs</button>
        </div>
        <div class="log-terminal" id="logsBox"></div>
    </div>
</div>
<div id="toast" class="toast-msg"></div>
<script>
let adminPassword="", lastKey="";
function showToast(m){const t=document.getElementById("toast");t.innerText=m;t.style.display="block";setTimeout(()=>t.style.display="none",3000);}
window.onload=function(){const s=sessionStorage.getItem("admin_auth");if(s){adminPassword=s;document.getElementById("loginView").style.display="none";document.getElementById("dashboardView").style.display="block";refreshDashboard();refreshLogs();setInterval(refreshLogs,15000);}}
function attemptLogin(){const p=document.getElementById("passwordInput").value,e=document.getElementById("loginError"),b=document.getElementById("loginBtn");if(!p){e.innerText="Please enter password";return;}b.innerText="Checking...";fetch("/api/keys",{headers:{"Authorization":p}}).then(r=>{if(r.ok){adminPassword=p;sessionStorage.setItem("admin_auth",p);document.getElementById("loginView").style.display="none";document.getElementById("dashboardView").style.display="block";refreshDashboard();refreshLogs();setInterval(refreshLogs,15000);}else{e.innerText="Invalid Admin Password";b.innerText="Login to Dashboard";}}).catch(()=>{e.innerText="Connection error";b.innerText="Login to Dashboard";});}
function logout(){sessionStorage.removeItem("admin_auth");location.reload();}
function refreshDashboard(){fetch("/api/keys",{headers:{"Authorization":adminPassword}}).then(r=>r.json()).then(renderTable);}
function renderTable(keys){const tb=document.getElementById("keysTable");tb.innerHTML="";let t=0,a=0;for(const[k,d] of Object.entries(keys)){t++;if(d.hwid)a++;const tr=document.createElement("tr");tr.setAttribute("data-k",k.toLowerCase());tr.setAttribute("data-n",(d.note||"").toLowerCase());const bt=d.type==="lifetime"?"lft":"mth",tl=d.type==="lifetime"?"Lifetime":"30 Days",hb=d.hwid?'<span class="badge lck">Locked</span>':'<span class="badge free">Unused</span>';tr.innerHTML='<td style="font-family:monospace;font-weight:700;color:#fff">'+k+'</td><td><span class="badge '+bt+'">'+tl+'</span></td><td>'+d.expires+'</td><td>'+hb+'</td><td><input type="text" value="'+(d.note||'')+'" onchange="updateNote(\''+k+'\',this.value)" style="margin:0;padding:6px 10px;font-size:12px;background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.15)"></td><td>'+(d.hwid?'<button class="secondary" onclick="resetHWID(\''+k+'\')" style="padding:5px 10px;font-size:11px;margin-right:4px">Reset HWID</button>':'')+'<button class="danger" onclick="deleteKey(\''+k+'\')" style="padding:5px 10px;font-size:11px">Delete</button></td>';tb.appendChild(tr);}document.getElementById("totalKeys").innerText=t;document.getElementById("activeKeys").innerText=a;}
function filterKeys(){const q=document.getElementById("searchInput").value.toLowerCase();document.querySelectorAll("#keysTable tr").forEach(r=>{r.style.display=(r.getAttribute("data-k").includes(q)||r.getAttribute("data-n").includes(q))?"":"none";});}
function updateNote(k,n){fetch("/api/update-note",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k,note:n})}).then(()=>{showToast("Note updated");refreshDashboard();});}
function generateKey(){const t=document.getElementById("keyType").value,n=document.getElementById("buyerNote").value;fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({type:t,note:n})}).then(r=>r.json()).then(r=>{lastKey=r.key;document.getElementById("genKeyText").innerText=r.key;document.getElementById("genOutput").style.display="flex";document.getElementById("buyerNote").value="";showToast("Key generated");refreshDashboard();});}
function copyKey(){if(lastKey)navigator.clipboard.writeText(lastKey).then(()=>showToast("Copied to clipboard!"));}
function resetHWID(k){fetch("/api/reset",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k})}).then(()=>{showToast("HWID unlocked");refreshDashboard();});}
function deleteKey(k){if(confirm("Delete key "+k+"?"))fetch("/api/delete",{method:"POST",headers:{"Content-Type":"application/json","Authorization":adminPassword},body:JSON.stringify({key:k})}).then(()=>{showToast("Key deleted");refreshDashboard();});}
function refreshLogs(){fetch("/api/logs",{headers:{"Authorization":adminPassword}}).then(r=>r.json()).then(logs=>{const box=document.getElementById("logsBox");if(!logs.length){box.innerHTML='<div style="color:#64748b;text-align:center">No activity logged</div>';return;}box.innerHTML="";logs.forEach(l=>{const d=document.createElement("div");d.className="log-row";const s=l.status.startsWith("SUCCESS")?"#4ade80":"#f43f5e";d.innerHTML='<span>['+l.time+'] Key: <b style="font-family:monospace;color:#fff">'+l.key+'</b></span><span style="color:'+s+';font-weight:700">'+l.status+'</span>';box.appendChild(d);});});}
</script></body></html>`);
});

app.listen(PORT, () => { console.log(`Auth server running on port ${PORT}`); });
