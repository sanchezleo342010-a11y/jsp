const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Put your Discord Bot Token here OR set DISCORD_TOKEN in environment variables!
const rawToken = "TVRVeU9EZ3lOek0wT1RBeE9UZ3dOemMwTkEuR3QyLWhELmpxR1BZQTJ5ZGtqTUlBSFNrQ0ljQzVvLVdraWZhb09uT2pCRzRn";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || Buffer.from(rawToken, 'base64').toString('utf8');
const BOT_PREFIX = "!";

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
        const init = { keys: { "SERENITY-LIFETIME-DEV": { type: "lifetime", expires: "Lifetime", hwid: "", note: "Default Dev Key" } } };
        fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 4));
        return init;
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { keys: {} };
    }
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4)); }

// ---------------- C++ CLIENT AUTH ENDPOINT ----------------
app.get('/auth.php', (req, res) => {
    const { key, hwid } = req.query;
    if (!key || !hwid) { logActivity(key, hwid, "FAILED: Missing params"); return res.send("INVALID"); }
    const db = loadDB();
    if (!db.keys || !db.keys[key]) { logActivity(key, hwid, "FAILED: Key not found"); return res.send("INVALID"); }
    const k = db.keys[key];
    if (k.type !== 'lifetime' && new Date() > new Date(k.expires)) { logActivity(key, hwid, "FAILED: Expired"); return res.send("EXPIRED"); }
    if (!k.hwid) { k.hwid = hwid; saveDB(db); logActivity(key, hwid, "SUCCESS: Registered HWID"); }
    else if (k.hwid !== hwid) { logActivity(key, hwid, "FAILED: HWID mismatch"); return res.send("HWID_MISMATCH"); }
    else { logActivity(key, hwid, "SUCCESS: Authorized"); }
    res.send("OK:" + (k.expires || "Lifetime"));
});

app.get('/', (req, res) => res.send("Serenity Auth Server & Discord Bot active."));

app.listen(PORT, () => console.log(`[HTTP] Auth server running on port ${PORT}`));

// ---------------- DISCORD BOT CLIENT ----------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`[DISCORD] Logged in as ${client.user.tag}!`);
    client.user.setActivity('Serenity Licenses | !help', { type: 3 });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(BOT_PREFIX)) return;

    const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !help
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Serenity License Bot Commands')
            .setColor(0xFF007F)
            .setDescription('Manage your client licenses directly from Discord!')
            .addFields(
                { name: '`!gen <30d | lifetime> [note]`', value: 'Generate a new license key (e.g. `!gen 30d Alex`)' },
                { name: '`!keys`', value: 'List all generated keys and HWID statuses' },
                { name: '`!reset <KEY>`', value: 'Unlock HWID binding for a client' },
                { name: '`!del <KEY>`', value: 'Delete a license key permanently' },
                { name: '`!logs`', value: 'View 10 recent client authentication logs' }
            )
            .setFooter({ text: 'Serenity Bedrock Edition' });
        return message.reply({ embeds: [embed] });
    }

    // !gen <30d|lifetime> [note]
    if (command === 'gen' || command === 'generatekey') {
        const typeArg = (args[0] || '').toLowerCase();
        if (typeArg !== '30d' && typeArg !== '1month' && typeArg !== 'lifetime') {
            return message.reply('❌ Invalid duration. Usage: `!gen 30d <buyer_name>` or `!gen lifetime <buyer_name>`');
        }
        const note = args.slice(1).join(' ') || message.author.username;
        const type = (typeArg === '30d' || typeArg === '1month') ? '1month' : 'lifetime';

        const r = () => Math.random().toString(16).substring(2, 6).toUpperCase();
        const key = `SERENITY-${r()}-${r()}-${r()}`;
        const db = loadDB();
        if (!db.keys) db.keys = {};

        let expires = "Lifetime";
        if (type === '1month') {
            const d = new Date(); d.setDate(d.getDate() + 30);
            expires = d.toISOString().split('T')[0];
        }

        db.keys[key] = { type, expires, hwid: "", note };
        saveDB(db);

        const embed = new EmbedBuilder()
            .setTitle('🔑 New Serenity License Generated!')
            .setColor(0x00F0FF)
            .addFields(
                { name: 'License Key', value: `\`\`\`${key}\`\`\`` },
                { name: 'Type', value: type === 'lifetime' ? '💎 Lifetime' : '⏰ 30 Days', inline: true },
                { name: 'Expiration', value: expires, inline: true },
                { name: 'Buyer / Note', value: note, inline: true }
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // !keys
    if (command === 'keys' || command === 'list') {
        const db = loadDB();
        const keys = db.keys || {};
        const entries = Object.entries(keys);

        if (entries.length === 0) {
            return message.reply('ℹ️ No active keys found in database.');
        }

        let description = "";
        entries.forEach(([k, d]) => {
            const typeTag = d.type === 'lifetime' ? '💎 Lifetime' : '⏰ 30d';
            const statusTag = d.hwid ? '🔒 Locked' : '🟢 Unused';
            description += `\`${k}\` | ${typeTag} | ${statusTag} | Note: **${d.note || 'N/A'}**\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`📜 Active Licenses (${entries.length})`)
            .setColor(0xFF007F)
            .setDescription(description.substring(0, 4000))
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // !reset <KEY>
    if (command === 'reset' || command === 'resethwid') {
        const key = (args[0] || '').trim();
        if (!key) return message.reply('❌ Usage: `!reset <KEY>`');

        const db = loadDB();
        if (!db.keys || !db.keys[key]) return message.reply(`❌ Key \`${key}\` not found.`);

        db.keys[key].hwid = "";
        saveDB(db);

        return message.reply(`✅ HWID lock for \`${key}\` has been reset successfully!`);
    }

    // !del <KEY>
    if (command === 'del' || command === 'delete') {
        const key = (args[0] || '').trim();
        if (!key) return message.reply('❌ Usage: `!del <KEY>`');

        const db = loadDB();
        if (!db.keys || !db.keys[key]) return message.reply(`❌ Key \`${key}\` not found.`);

        delete db.keys[key];
        saveDB(db);

        return message.reply(`🗑️ License key \`${key}\` deleted.`);
    }

    // !logs
    if (command === 'logs') {
        if (!activationLogs.length) return message.reply('ℹ️ No activity logs recorded yet.');

        let logText = "";
        activationLogs.slice(0, 10).forEach(l => {
            const icon = l.status.startsWith('SUCCESS') ? '✅' : '❌';
            logText += `\`[${l.time}]\` ${icon} \`${l.key}\` — ${l.status}\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle('📋 Recent Auth Activity')
            .setColor(0x00F0FF)
            .setDescription(logText)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
});

if (DISCORD_TOKEN && DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    client.login(DISCORD_TOKEN).catch(err => console.error("[DISCORD] Login failed:", err.message));
} else {
    console.warn("[DISCORD] Bot Token missing. Add DISCORD_TOKEN to process.env or server.js");
}
