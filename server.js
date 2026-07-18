const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'database.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Change this password!

app.use(express.json());

// Initialize database
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initData = {
            keys: {
                "SERENITY-LIFETIME-DEV": {
                    type: "lifetime",
                    expires: "Lifetime",
                    hwid: ""
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
        return res.send("INVALID");
    }

    const db = loadDB();

    // 1. Verify key exists
    if (!db.keys[key]) {
        return res.send("INVALID");
    }

    const keyData = db.keys[key];

    // 2. Verify key has not expired
    if (keyData.type !== 'lifetime') {
        const expiryDate = new Date(keyData.expires);
        const now = new Date();
        if (now > expiryDate) {
            return res.send("EXPIRED");
        }
    }

    // 3. HWID Lock
    if (!keyData.hwid) {
        db.keys[key].hwid = hwid;
        saveDB(db);
    } else {
        if (keyData.hwid !== hwid) {
            return res.send("HWID_MISMATCH");
        }
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

// Generate new key
app.post('/api/generate', requireAuth, (req, res) => {
    const { type } = req.body;
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
        hwid: ""
    };

    saveDB(db);
    res.json({ key: newKey, type, expires });
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
        <title>Serenity | Admin Dashboard</title>
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
            h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 2px;
                color: #ff007f;
                text-shadow: 0 0 10px rgba(255, 0, 127, 0.3);
            }
            .container {
                width: 100%;
                max-width: 1100px;
                padding: 0 20px 40px 20px;
            }
            .card {
                background: rgba(8, 11, 17, 0.6);
                border: 1px solid #121727;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 30px;
                backdrop-filter: blur(10px);
            }
            .card-title {
                font-size: 18px;
                font-weight: 600;
                color: #00f0ff;
                margin-top: 0;
                margin-bottom: 20px;
            }
            .login-box {
                max-width: 400px;
                width: 100%;
                margin-top: 100px;
            }
            input[type="password"], input[type="text"], select {
                background: #0c1018;
                border: 1px solid #121727;
                border-radius: 8px;
                color: #fff;
                padding: 12px 16px;
                font-size: 14px;
                width: 100%;
                margin-bottom: 15px;
                outline: none;
                transition: border 0.2s;
            }
            input:focus, select:focus {
                border-color: #00f0ff;
            }
            button {
                background: linear-gradient(135deg, #00f0ff, #0094a0);
                border: none;
                border-radius: 8px;
                color: #000;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s, opacity 0.2s;
                width: 100%;
            }
            button:hover {
                opacity: 0.9;
            }
            button:active {
                transform: scale(0.98);
            }
            button.danger {
                background: linear-gradient(135deg, #ff007f, #b30059);
                color: #fff;
            }
            button.secondary {
                background: #1c2435;
                color: #fff;
            }
            .flex-group {
                display: flex;
                gap: 15px;
            }
            .stats {
                display: flex;
                gap: 20px;
                margin-bottom: 35px;
            }
            .stat-box {
                flex: 1;
                background: #080b11;
                border: 1px solid #121727;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .stat-num {
                font-size: 32px;
                font-weight: 800;
                color: #fff;
                margin-bottom: 5px;
            }
            .stat-num.active { color: #00f0ff; }
            .stat-num.total { color: #ff007f; }
            .stat-label {
                font-size: 12px;
                color: #485464;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th {
                text-align: left;
                padding: 12px 16px;
                color: #485464;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid #121727;
            }
            td {
                padding: 16px;
                border-bottom: 1px solid #121727;
                font-size: 14px;
            }
            tr:hover td {
                background: rgba(18, 23, 39, 0.2);
            }
            .key-cell {
                font-family: monospace;
                color: #fff;
                font-weight: 600;
            }
            .badge {
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
            }
            .badge.lifetime { background: rgba(0, 240, 255, 0.1); color: #00f0ff; }
            .badge.month { background: rgba(255, 0, 127, 0.1); color: #ff007f; }
            .badge.locked { background: rgba(72, 84, 100, 0.2); color: #8a9bb4; }
            .badge.unlocked { background: rgba(0, 255, 127, 0.1); color: #00ff7f; }
            .action-buttons {
                display: flex;
                gap: 8px;
            }
            .action-buttons button {
                padding: 6px 12px;
                font-size: 11px;
                width: auto;
            }
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #1c2435;
                border-left: 4px solid #00f0ff;
                padding: 16px 24px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                display: none;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="header-line"></div>
        
        <!-- LOGIN VIEW -->
        <div id="loginView" class="container login-box" style="display: block;">
            <div class="card">
                <div class="card-title" style="text-align: center;">SERENITY ADMIN ACCESS</div>
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
                <div class="card-title">Key Generator</div>
                <div class="flex-group">
                    <select id="keyType">
                        <option value="1month">30 Days (1 Month)</option>
                        <option value="lifetime">Lifetime Access</option>
                    </select>
                    <button onclick="generateKey()" style="max-width: 200px;">Generate Key</button>
                </div>
                <div id="generatedKeyDisplay" style="margin-top: 15px; font-weight: 600; font-size: 16px; color: #00f0ff; text-align: center;"></div>
            </div>

            <!-- KEYS TABLE CARD -->
            <div class="card">
                <div class="card-title">Active Licenses</div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>License Key</th>
                                <th>Duration</th>
                                <th>Expiration</th>
                                <th>HWID Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="keysTableBody">
                            <!-- Injected dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="toast" class="toast">Action completed successfully</div>

        <script>
            let adminPassword = "";

            function showToast(text) {
                const toast = document.getElementById("toast");
                toast.innerText = text;
                toast.style.display = "block";
                setTimeout(() => { toast.style.display = "none"; }, 3000);
            }

            // Auto-check session storage
            window.onload = function() {
                const saved = sessionStorage.getItem("admin_auth");
                if (saved) {
                    adminPassword = saved;
                    document.getElementById("loginView").style.display = "none";
                    document.getElementById("dashboardView").style.display = "block";
                    refreshDashboard();
                }
            }

            function attemptLogin() {
                const pwd = document.getElementById("passwordInput").value;
                // Test fetch
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
                    const tbody = document.getElementById("keysTableBody");
                    tbody.innerHTML = "";
                    
                    let total = 0;
                    let active = 0;

                    for (const [key, data] of Object.entries(keys)) {
                        total++;
                        if (data.hwid) active++;

                        const tr = document.createElement("tr");

                        const badgeType = data.type === "lifetime" ? "lifetime" : "month";
                        const typeLabel = data.type === "lifetime" ? "Lifetime" : "30 Days";
                        
                        const hwidBadge = data.hwid ? 
                            '<span class="badge locked">Locked to ' + data.hwid + '</span>' : 
                            '<span class="badge unlocked">Unused</span>';

                        tr.innerHTML = \`
                            <td class="key-cell">\${key}</td>
                            <td><span class="badge \${badgeType}">\${typeLabel}</span></td>
                            <td>\${data.expires}</td>
                            <td>\${hwidBadge}</td>
                            <td class="action-buttons">
                                \${data.hwid ? '<button class="secondary" onclick="resetHWID(\\\'' + key + '\\\')">Reset HWID</button>' : ''}
                                <button class="danger" onclick="deleteKey(\\\'' + key + '\\\')">Delete</button>
                            </td>
                        \`;
                        tbody.appendChild(tr);
                    }

                    document.getElementById("totalKeys").innerText = total;
                    document.getElementById("activeKeys").innerText = active;
                });
            }

            function generateKey() {
                const type = document.getElementById("keyType").value;
                fetch("/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": adminPassword
                    },
                    body: JSON.stringify({ type })
                })
                .then(res => res.json())
                .then(res => {
                    document.getElementById("generatedKeyDisplay").innerText = "Generated: " + res.key;
                    showToast("Key generated successfully!");
                    refreshDashboard();
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
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
});
