const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'database.json');

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

// ----------------- Client HWID License Check -----------------
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

    // 3. HWID Lock (Only 1 person can use the key)
    if (!keyData.hwid) {
        // First activation: Lock to this HWID
        db.keys[key].hwid = hwid;
        saveDB(db);
    } else {
        // Prevent connection if HWID mismatch
        if (keyData.hwid !== hwid) {
            return res.send("HWID_MISMATCH");
        }
    }

    res.send("OK:" + keyData.expires);
});

// ----------------- License Key Generation -----------------
// Access via browser: http://your-domain.com/generate?type=1month OR http://your-domain.com/generate?type=lifetime
app.get('/generate', (req, res) => {
    const type = req.query.type;
    if (type !== '1month' && type !== 'lifetime') {
        return res.status(400).send("Usage: /generate?type=1month OR /generate?type=lifetime");
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

    res.json({
        message: "Key generated successfully!",
        key: newKey,
        type: type,
        expires: expires
    });
});

// ----------------- Reset Key HWID -----------------
// Access via browser: http://your-domain.com/reset?key=SERENITY-XXXX-XXXX-XXXX
app.get('/reset', (req, res) => {
    const key = req.query.key;
    if (!key) {
        return res.status(400).send("Usage: /reset?key=KEY");
    }

    const db = loadDB();
    if (!db.keys[key]) {
        return res.status(404).send("Key not found");
    }

    db.keys[key].hwid = "";
    saveDB(db);

    res.send("HWID reset successfully! The customer can now login on their new PC.");
});

app.listen(PORT, () => {
    console.log(`Auth server running on port ${PORT}`);
});
