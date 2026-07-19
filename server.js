const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'database.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Change this password!

app.use(express.json());

// ----------------- HTML Landing Page UI -----------------
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Serenity Client | Bedrock Edition</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                font-family: 'Outfit', sans-serif;
            }
            body {
                background: #06080c;
                color: #e5e6e8;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                overflow-x: hidden;
            }
            .header-line {
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #ff007f, #00f0ff);
            }
            header {
                width: 100%;
                max-width: 1100px;
                padding: 30px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .logo {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 2px;
                color: #ff007f;
                text-shadow: 0 0 10px rgba(255, 0, 127, 0.3);
                text-decoration: none;
            }
            .admin-btn {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #8a9bb4;
                padding: 10px 20px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 13px;
                font-weight: 600;
                transition: background 0.2s, border 0.2s, color 0.2s;
            }
            .admin-btn:hover {
                background: rgba(0, 240, 255, 0.08);
                border-color: #00f0ff;
                color: #00f0ff;
            }
            .hero {
                text-align: center;
                padding: 80px 20px;
                max-width: 800px;
            }
            .hero h2 {
                font-size: 54px;
                font-weight: 800;
                margin: 0 0 15px 0;
                background: linear-gradient(90deg, #fff, #8a9bb4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: 1px;
            }
            .hero p {
                font-size: 18px;
                color: #8a9bb4;
                line-height: 1.6;
                margin: 0 0 35px 0;
            }
            .hero-btns {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            .btn {
                padding: 14px 28px;
                font-size: 15px;
                font-weight: 600;
                border-radius: 8px;
                text-decoration: none;
                transition: transform 0.1s, opacity 0.2s;
            }
            .btn.primary {
                background: linear-gradient(135deg, #ff007f, #b30059);
                color: #fff;
                box-shadow: 0 4px 20px rgba(255, 0, 127, 0.3);
            }
            .btn.secondary {
                background: linear-gradient(135deg, #00f0ff, #0094a0);
                color: #000;
                box-shadow: 0 4px 20px rgba(0, 240, 255, 0.2);
            }
            .btn:hover {
                opacity: 0.9;
            }
            .btn:active {
                transform: scale(0.97);
            }
            .section {
                width: 100%;
                max-width: 1100px;
                padding: 60px 20px;
            }
            .section-title {
                text-align: center;
                font-size: 32px;
                font-weight: 800;
                color: #fff;
                margin-bottom: 50px;
                letter-spacing: 1px;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
            }
            .card {
                background: rgba(8, 11, 17, 0.4);
                border: 1px solid #121727;
                border-radius: 12px;
                padding: 30px;
                backdrop-filter: blur(10px);
                transition: border 0.3s, transform 0.3s;
            }
            .card:hover {
                border-color: #00f0ff;
                transform: translateY(-5px);
            }
            .card h3 {
                font-size: 20px;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 12px;
                color: #00f0ff;
            }
            .card p {
                font-size: 14px;
                color: #8a9bb4;
                line-height: 1.6;
                margin: 0;
            }
            footer {
                width: 100%;
                border-top: 1px solid #121727;
                padding: 40px 20px;
                text-align: center;
                font-size: 13px;
                color: #485464;
                margin-top: auto;
            }
        </style>
    </head>
    <body>
        <div class="header-line"></div>
        <header>
            <a href="#" class="logo">SERENITY</a>
            <a href="/admin" class="admin-btn">Dashboard Access</a>
        </header>

        <div class="hero">
            <h2>UNLEASH ULTIMATE POWER</h2>
            <p>Experience Minecraft Bedrock like never before. Serenity is a native, highly-optimized utility client featuring customizable combat extensions, bypass modules, and a sleek modern sidebar dashboard.</p>
            <div class="hero-btns">
                <a href="#features" class="btn primary">Explore Features</a>
                <a href="/admin" class="btn secondary">Get License Key</a>
            </div>
        </div>

        <div class="section" id="features">
            <div class="section-title">ENGINE FEATURES</div>
            <div class="grid">
                <div class="card">
                    <h3>Sleek Sidebar UI</h3>
                    <p>Designed with Dear ImGui and DirectX 11 for hardware-accelerated rendering. Smooth transitions, flat layout, and quick navigation.</p>
                </div>
                <div class="card">
                    <h3>Combat Extensions</h3>
                    <p>Unlock custom Reach parameters up to 15 blocks, and tweak horizontal/vertical knockback to completely negate enemy combos.</p>
                </div>
                <div class="card">
                    <h3>Movement Utility</h3>
                    <p>Fly with absolute control, Boost jump boosts, trigger high-velocity Speed modifiers, and climb vertical walls automatically.</p>
                </div>
                <div class="card">
                    <h3>Stream Proof Security</h3>
                    <p>Enable OBS/Discord bypass to completely hide the client menu from share screens, stream feeds, and screenshot captures.</p>
                </div>
                <div class="card">
                    <h3>HWID License System</h3>
                    <p>Secure database licensing locks each key to a single PC via hardware signature to prevent unauthorized key sharing.</p>
                </div>
                <div class="card">
                    <h3>Stealth Mode</h3>
                    <p>Hide the client icon entirely from the Windows taskbar with one toggle, and auto-hide the debug logging console.</p>
                </div>
            </div>
        </div>

        <footer>
            &copy; 2026 Serenity Client. Built for performance and utility.
        </footer>
    </body>
    </html>
    `);
});

// In-memory activation logs
let activationLogs = [];

function logActivity(key, hwid, status) {
    const entry = {
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        key: key || "N/A",
        hwid: hwid || "N/A",
        status: status
    };
    activationLogs.unshift(entry);
    if (activationLogs.length > 50) {
        activationLogs.pop(); // Keep last 50 entries
    }
}

// Initialize database
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initData = {
            keys: {
                "SERENITY-LIFETIME-DEV": {
                    type: "lifetime",
                    expires: "Lifetime",
                    hwid: "",
                    note: "Developer default test key"
                }
            }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 4));
        return initData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

// ----------------- Client HWID License Check (C++ client) -----------------
app.get('/auth.php', (req, res) => {
    const key = req.query.key;
    const hwid = req.query.hwid;

    if (!key || !hwid) {
        logActivity(key, hwid, "FAILED: Missing parameters");
        return res.send("INVALID");
    }

    const db = loadDB();

    // 1. Verify key exists
    if (!db.keys[key]) {
        logActivity(key, hwid, "FAILED: Key not found");
        return res.send("INVALID");
    }

    const keyData = db.keys[key];

    // 2. Verify key has not expired
    if (keyData.type !== 'lifetime') {
        const expiryDate = new Date(keyData.expires);
        const now = new Date();
        if (now > expiryDate) {
            logActivity(key, hwid, "FAILED: Key expired");
            return res.send("EXPIRED");
        }
    }

    // 3. HWID Lock
    if (!keyData.hwid) {
        db.keys[key].hwid = hwid;
        saveDB(db);
        logActivity(key, hwid, "SUCCESS: Registered HWID");
    } else {
        if (keyData.hwid !== hwid) {
            logActivity(key, hwid, "FAILED: HWID mismatch");
            return res.send("HWID_MISMATCH");
        }
        logActivity(key, hwid, "SUCCESS: Authorized");
    }

    res.send("OK:" + keyData.expires);
});

// ----------------- Admin API Endpoints -----------------

// Middleware to check admin password
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
};

// Get all keys
app.get('/api/keys', requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.keys);
});

// Get activation logs
app.get('/api/logs', requireAuth, (req, res) => {
    res.json(activationLogs);
});

// Generate new key
app.post('/api/generate', requireAuth, (req, res) => {
    const { type, note } = req.body;
    if (type !== '1month' && type !== 'lifetime') {
        return res.status(400).json({ error: "Invalid key type" });
    }

    const randomHex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const newKey = `SERENITY-${randomHex()}-${randomHex()}-${randomHex()}`;

    const db = loadDB();
    
    let expires = "Lifetime";
    if (type === '1month') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expires = d.toISOString().split('T')[0];
    }

    db.keys[newKey] = {
        type: type,
        expires: expires,
        hwid: "",
        note: note || "N/A"
    };

    saveDB(db);
    res.json({ key: newKey, type, expires, note: db.keys[newKey].note });
});

// Reset key HWID
app.post('/api/reset', requireAuth, (req, res) => {
    const { key } = req.body;
    const db = loadDB();
    if (!db.keys[key]) {
        return res.status(404).json({ error: "Key not found" });
    }

    db.keys[key].hwid = "";
    saveDB(db);
    res.json({ success: true });
});

// Update key note/buyer details
app.post('/api/update-note', requireAuth, (req, res) => {
    const { key, note } = req.body;
    const db = loadDB();
    if (!db.keys[key]) {
        return res.status(404).json({ error: "Key not found" });
    }

    db.keys[key].note = note || "";
    saveDB(db);
    res.json({ success: true });
});

// Delete key
app.post('/api/delete', requireAuth, (req, res) => {
    const { key } = req.body;
    const db = loadDB();
    if (!db.keys[key]) {
        return res.status(404).json({ error: "Key not found" });
    }

    delete db.keys[key];
    saveDB(db);
    res.json({ success: true });
});

// ----------------- HTML Admin Dashboard UI -----------------
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Serenity | Admin Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            * {
                box-sizing: border-box;
                font-family: 'Outfit', sans-serif;
            }
            body {
                background: #04060a;
                color: #e5e6e8;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            .header-line {
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #ff007f, #00f0ff);
                box-shadow: 0 2px 15px rgba(0, 240, 255, 0.4);
            }
            header {
                width: 100%;
                max-width: 1100px;
                padding: 30px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 3px;
                color: #ff007f;
                text-shadow: 0 0 15px rgba(255, 0, 127, 0.4);
            }
            .container {
                width: 100%;
                max-width: 1100px;
                padding: 0 20px 40px 20px;
            }
            .card {
                background: rgba(8, 11, 17, 0.7);
                border: 1px solid rgba(18, 23, 39, 0.8);
                border-radius: 16px;
                padding: 28px;
                margin-bottom: 30px;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                transition: border-color 0.3s;
            }
            .card:hover {
                border-color: rgba(0, 240, 255, 0.15);
            }
            .card-title {
                font-size: 18px;
                font-weight: 600;
                color: #00f0ff;
                margin-top: 0;
                margin-bottom: 22px;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .login-box {
                max-width: 400px;
                width: 100%;
                margin-top: 100px;
            }
            input[type="password"], input[type="text"], select {
                background: #070a0f;
                border: 1px solid #161e30;
                border-radius: 10px;
                color: #fff;
                padding: 14px 18px;
                font-size: 14px;
                width: 100%;
                margin-bottom: 18px;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            input:focus, select:focus {
                border-color: #00f0ff;
                box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
            }
            button {
                background: linear-gradient(135deg, #00f0ff, #0094a0);
                border: none;
                border-radius: 10px;
                color: #000;
                padding: 14px 22px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s, opacity 0.2s, box-shadow 0.2s;
                width: 100%;
            }
            button:hover {
                opacity: 0.95;
                box-shadow: 0 4px 15px rgba(0, 240, 255, 0.2);
            }
            button:active {
                transform: scale(0.98);
            }
            button.danger {
                background: linear-gradient(135deg, #ff007f, #b30059);
                color: #fff;
            }
            button.danger:hover {
                box-shadow: 0 4px 15px rgba(255, 0, 127, 0.2);
            }
            button.secondary {
                background: #121926;
                color: #8a9bb4;
                border: 1px solid #1c293f;
            }
            button.secondary:hover {
                color: #fff;
                border-color: #00f0ff;
                box-shadow: none;
            }
            .flex-group {
                display: flex;
                gap: 15px;
                align-items: center;
                flex-wrap: wrap;
            }
            .flex-group > * {
                margin-bottom: 0 !important;
                flex: 1;
                min-width: 150px;
            }
            .flex-group button {
                flex: 0 0 180px;
            }
            .stats {
                display: flex;
                gap: 20px;
                margin-bottom: 35px;
            }
            .stat-box {
                flex: 1;
                background: rgba(8, 11, 17, 0.5);
                border: 1px solid #121727;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                backdrop-filter: blur(8px);
            }
            .stat-num {
                font-size: 36px;
                font-weight: 800;
                color: #fff;
                margin-bottom: 5px;
            }
            .stat-num.active { color: #00f0ff; text-shadow: 0 0 10px rgba(0, 240, 255, 0.2); }
            .stat-num.total { color: #ff007f; text-shadow: 0 0 10px rgba(255, 0, 127, 0.2); }
            .stat-label {
                font-size: 12px;
                color: #485464;
                text-transform: uppercase;
                letter-spacing: 1.5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th {
                text-align: left;
                padding: 14px 18px;
                color: #485464;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                border-bottom: 1px solid #121727;
            }
            td {
                padding: 16px 18px;
                border-bottom: 1px solid #121727;
                font-size: 14px;
            }
            tr:hover td {
                background: rgba(18, 23, 39, 0.15);
            }
            .key-cell {
                font-family: monospace;
                color: #fff;
                font-weight: 600;
                font-size: 14px;
            }
            .badge {
                padding: 5px 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .badge.lifetime { background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.2); }
            .badge.month { background: rgba(255, 0, 127, 0.1); color: #ff007f; border: 1px solid rgba(255, 0, 127, 0.2); }
            .badge.locked { background: rgba(72, 84, 100, 0.15); color: #8a9bb4; border: 1px solid rgba(72, 84, 100, 0.25); }
            .badge.unlocked { background: rgba(0, 255, 127, 0.1); color: #00ff7f; border: 1px solid rgba(0, 255, 127, 0.2); }
            .action-buttons {
                display: flex;
                gap: 8px;
            }
            .action-buttons button {
                padding: 8px 14px;
                font-size: 12px;
                width: auto;
                border-radius: 8px;
            }
            .toast {
                position: fixed;
                bottom: 25px;
                right: 25px;
                background: #0c1018;
                border: 1px solid #00f0ff;
                border-left: 4px solid #00f0ff;
                color: #fff;
                padding: 16px 28px;
                border-radius: 8px;
                box-shadow: 0 8px 30px rgba(0, 240, 255, 0.25);
                display: none;
                z-index: 1000;
                font-weight: 600;
            }
            .log-box {
                max-height: 220px;
                overflow-y: auto;
                background: #05070b;
                border: 1px solid #121727;
                border-radius: 10px;
                padding: 15px;
                font-family: monospace;
                font-size: 13px;
            }
            .log-entry {
                padding: 8px 0;
                border-bottom: 1px solid rgba(18, 23, 39, 0.5);
                display: flex;
                justify-content: space-between;
            }
            .log-entry:last-child {
                border-bottom: none;
            }
            .log-entry .success { color: #00ff7f; font-weight: 600; }
            .log-entry .failed { color: #ff007f; font-weight: 600; }
            
            /* Generation Output Box */
            .gen-output {
                background: rgba(0, 240, 255, 0.05);
                border: 1px dashed rgba(0, 240, 255, 0.3);
                border-radius: 10px;
                padding: 16px;
                margin-top: 20px;
                display: none;
                align-items: center;
                justify-content: space-between;
            }
            .gen-output-key {
                font-family: monospace;
                font-size: 18px;
                color: #00f0ff;
                font-weight: 800;
                letter-spacing: 1px;
            }
            .gen-output button {
                width: auto;
                padding: 10px 18px;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="header-line"></div>
        
        <!-- LOGIN VIEW -->
        <div id="loginView" class="container login-box" style="display: block;">
            <div class="card">
                <div class="card-title" style="text-align: center; justify-content: center; font-size: 20px; color: #ff007f;">SERENITY ADMIN ACCESS</div>
                <input type="password" id="passwordInput" placeholder="Enter Admin Password">
                <button onclick="attemptLogin()">Login to Dashboard</button>
                <div id="loginError" style="color: #ff007f; text-align: center; margin-top: 15px; font-size: 14px;"></div>
            </div>
        </div>

        <!-- DASHBOARD VIEW -->
        <div id="dashboardView" class="container" style="display: none;">
            <header>
                <h1>SERENITY</h1>
                <button class="secondary" onclick="logout()" style="width: auto; padding: 8px 16px; font-size: 12px;">Logout</button>
            </header>

            <div class="stats">
                <div class="stat-box">
                    <div class="stat-num total" id="totalKeys">0</div>
                    <div class="stat-label">Total Keys</div>
                </div>
                <div class="stat-box">
                    <div class="stat-num active" id="activeKeys">0</div>
                    <div class="stat-label">Active Users (HWID Locked)</div>
                </div>
            </div>

            <!-- KEY GENERATION CARD -->
            <div class="card">
                <div class="card-title">Key Generator & Buyer Notes</div>
                <div class="flex-group">
                    <input type="text" id="buyerNote" placeholder="Buyer Name / Notes (e.g. 'Alex Discord')" style="flex: 2; min-width: 250px;">
                    <select id="keyType" style="flex: 1; min-width: 150px;">
                        <option value="1month">30 Days (1 Month)</option>
                        <option value="lifetime">Lifetime Access</option>
                    </select>
                    <button onclick="generateKey()">Generate Key</button>
                </div>
                
                <!-- New Sleek Copy Key Box -->
                <div class="gen-output" id="genOutputBox">
                    <span class="gen-output-key" id="genKeyText">SERENITY-XXXX-XXXX-XXXX</span>
                    <button onclick="copyGeneratedKey()">Copy Key</button>
                </div>
            </div>

            <!-- KEYS TABLE CARD -->
            <div class="card">
                <div class="card-title">
                    <span>Active Licenses</span>
                    <input type="text" id="searchInput" placeholder="Search by Key or Notes..." oninput="filterKeys()" style="max-width: 280px; margin-bottom: 0; padding: 10px 14px; font-size: 13px;">
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>License Key</th>
                                <th>Duration</th>
                                <th>Expiration</th>
                                <th>HWID Status</th>
                                <th>Notes / Buyer</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="keysTableBody">
                            <!-- Injected dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- LIVE ACTIVITY LOGS -->
            <div class="card">
                <div class="card-title">
                    <span>Live Activation Log (Last 50 Events)</span>
                    <button class="secondary" onclick="refreshLogs()" style="width: auto; padding: 6px 14px; font-size: 12px; border-radius: 8px;">Refresh Logs</button>
                </div>
                <div class="log-box" id="logsContainer">
                    <!-- Logs injected dynamically -->
                </div>
            </div>
        </div>

        <div id="toast" class="toast">Action completed successfully</div>

        <script>
            let adminPassword = "";
            let cachedKeys = {};
            let lastGeneratedKey = "";

            function showToast(text) {
                const toast = document.getElementById("toast");
                toast.innerText = text;
                toast.style.display = "block";
                setTimeout(() => { toast.style.display = "none"; }, 3000);
            }

            window.onload = function() {
                const saved = sessionStorage.getItem("admin_auth");
                if (saved) {
                    adminPassword = saved;
                    document.getElementById("loginView").style.display = "none";
                    document.getElementById("dashboardView").style.display = "block";
                    refreshDashboard();
                    refreshLogs();
                    setInterval(refreshLogs, 15000); // Auto-refresh logs every 15s
                }
            }

            function attemptLogin() {
                const pwd = document.getElementById("passwordInput").value;
                fetch("/api/keys", {
                    headers: { "Authorization": pwd }
                })
                .then(res => {
                    if (res.ok) {
                        adminPassword = pwd;
                        sessionStorage.setItem("admin_auth", pwd);
                        document.getElementById("loginView").style.display = "none";
                        document.getElementById("dashboardView").style.display = "block";
                        refreshDashboard();
                        refreshLogs();
                        setInterval(refreshLogs, 15000);
                    } else {
                        document.getElementById("loginError").innerText = "Invalid Admin Password.";
                    }
                })
                .catch(() => {
                    document.getElementById("loginError").innerText = "Connection error.";
                });
            }

            function logout() {
                sessionStorage.removeItem("admin_auth");
                window.location.reload();
            }

            function refreshDashboard() {
                fetch("/api/keys", {
                    headers: { "Authorization": adminPassword }
                })
                .then(res => res.json())
                .then(keys => {
                    cachedKeys = keys;
                    renderKeysTable(keys);
                });
            }

            function renderKeysTable(keys) {
                const tbody = document.getElementById("keysTableBody");
                tbody.innerHTML = "";
                
                let total = 0;
                let active = 0;

                for (const [key, data] of Object.entries(keys)) {
                    total++;
                    if (data.hwid) active++;

                    const tr = document.createElement("tr");
                    tr.setAttribute("data-key", key.toLowerCase());
                    tr.setAttribute("data-note", (data.note || "").toLowerCase());

                    const badgeType = data.type === "lifetime" ? "lifetime" : "month";
                    const typeLabel = data.type === "lifetime" ? "Lifetime" : "30 Days";
                    
                    const hwidBadge = data.hwid ? 
                        '<span class="badge locked">Locked: ' + data.hwid + '</span>' : 
                        '<span class="badge unlocked">Unused</span>';

                    tr.innerHTML = 
                        '<td class="key-cell">' + key + '</td>' +
                        '<td><span class="badge ' + badgeType + '">' + typeLabel + '</span></td>' +
                        '<td>' + data.expires + '</td>' +
                        '<td>' + hwidBadge + '</td>' +
                        '<td>' +
                            '<input type="text" value="' + (data.note || '') + '" ' +
                            'onchange="updateNote(\'' + key + '\', this.value)" ' +
                            'style="margin-bottom: 0; padding: 6px 10px; font-size: 13px; background: transparent; border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; color: #fff;">' +
                        '</td>' +
                        '<td class="action-buttons">' +
                            (data.hwid ? '<button class="secondary" onclick="resetHWID(\'' + key + '\')">Reset HWID</button>' : '') +
                            '<button class="danger" onclick="deleteKey(\'' + key + '\')">Delete</button>' +
                        '</td>';
                    tbody.appendChild(tr);
                }

                document.getElementById("totalKeys").innerText = total;
                document.getElementById("activeKeys").innerText = active;
            }

            function filterKeys() {
                const query = document.getElementById("searchInput").value.toLowerCase();
                const rows = document.querySelectorAll("#keysTableBody tr");
                
                rows.forEach(row => {
                    const keyAttr = row.getAttribute("data-key");
                    const noteAttr = row.getAttribute("data-note");
                    if (keyAttr.includes(query) || noteAttr.includes(query)) {
                        row.style.display = "";
                    } else {
                        row.style.display = "none";
                    }
                });
            }

            function updateNote(key, note) {
                fetch("/api/update-note", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": adminPassword
                    },
                    body: JSON.stringify({ key, note })
                })
                .then(() => {
                    showToast("Note updated successfully!");
                    refreshDashboard();
                });
            }

            function generateKey() {
                const type = document.getElementById("keyType").value;
                const note = document.getElementById("buyerNote").value;
                fetch("/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": adminPassword
                    },
                    body: JSON.stringify({ type, note })
                })
                .then(res => res.json())
                .then(res => {
                    lastGeneratedKey = res.key;
                    document.getElementById("genKeyText").innerText = res.key;
                    document.getElementById("genOutputBox").style.display = "flex";
                    document.getElementById("buyerNote").value = ""; // Clear input
                    showToast("Key generated successfully!");
                    refreshDashboard();
                });
            }

            function copyGeneratedKey() {
                if (!lastGeneratedKey) return;
                navigator.clipboard.writeText(lastGeneratedKey).then(() => {
                    showToast("Copied to clipboard!");
                }).catch(() => {
                    showToast("Failed to copy. Double click key text.");
                });
            }

            function resetHWID(key) {
                fetch("/api/reset", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": adminPassword
                    },
                    body: JSON.stringify({ key })
                })
                .then(() => {
                    showToast("HWID unlocked!");
                    refreshDashboard();
                });
            }

            function deleteKey(key) {
                if (confirm("Are you sure you want to delete this key?")) {
                    fetch("/api/delete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": adminPassword
                        },
                        body: JSON.stringify({ key })
                    })
                    .then(() => {
                        showToast("Key deleted permanently.");
                        refreshDashboard();
                    });
                }
            }

            function refreshLogs() {
                fetch("/api/logs", {
                    headers: { "Authorization": adminPassword }
                })
                .then(res => res.json())
                .then(logs => {
                    const container = document.getElementById("logsContainer");
                    if (logs.length === 0) {
                        container.innerHTML = '<div style="color: #485464; text-align: center; padding: 20px;">No activity logged yet.</div>';
                        return;
                    }
                    container.innerHTML = "";
                    logs.forEach(log => {
                        const div = document.createElement("div");
                        div.className = "log-entry";
                        
                        const isSuccess = log.status.startsWith("SUCCESS");
                        const statusClass = isSuccess ? "success" : "failed";
                        
                        div.innerHTML = 
                            '<span>[' + log.time + '] Key: <b style="font-family: monospace;">' + log.key + '</b></span>' +
                            '<span>HWID: <b style="font-family: monospace;">' + log.hwid + '</b></span>' +
                            '<span class="' + statusClass + '">' + log.status + '</span>';
                        container.appendChild(div);
                    });
                });
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
});
