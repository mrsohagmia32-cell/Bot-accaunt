const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ১. গুগল অ্যাপস স্ক্রিপ্ট ডাটাবেজ URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9V9Fsqhxxqjd3mIPGWQBwwmHpNSOO01TuO_R3iUPbYbflJjYa9vj91T8PeXlhengtIg/exec";

// ২. আপনার Pexels API Key
const PEXELS_API_KEY = "DiqA3nNE1bXk1CaViv1inoLX9HW18I8g6GtECOhrp6y8kdloYRvRZRCd";

// মেমোরিতে সংরক্ষিত বট অ্যাকাউন্টের লিস্ট
let registeredBots = [];

// Pexels API থেকে ছবি, ছবির নিজস্ব ক্যাপশন এবং আসল ফটোগ্রাফারের নাম আনার ফাংশন
async function fetchPexelsImageAndData() {
    try {
        let queryKeywords = ['nature', 'landscape', 'mountains', 'city', 'flowers', 'ocean', 'forest', 'sunset', 'travel', 'portraits'];
        let randomKeyword = queryKeywords[Math.floor(Math.random() * queryKeywords.length)];
        
        let pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${randomKeyword}&per_page=30`, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        
        let pexelsData = await pexelsRes.json();
        if (pexelsData && pexelsData.photos && pexelsData.photos.length > 0) {
            let randomPhoto = pexelsData.photos[Math.floor(Math.random() * pexelsData.photos.length)];
            
            // পিক্সেলসের আসল ফটোগ্রাফারের নাম (যেমন: Alex Johnson, John Doe ইত্যাদি)
            let photographerName = randomPhoto.photographer || "B_book Creator";
            
            let photoAlt = randomPhoto.alt || "Beautiful moments captured through lens. 🌿✨";
            let imgUrl = randomPhoto.src.large2x || randomPhoto.src.large || randomPhoto.src.medium;
            
            let imgBuffer = await fetch(imgUrl).then(res => res.buffer());
            let base64Image = "data:image/jpeg;base64," + imgBuffer.toString('base64');
            
            return { authorName: photographerName, caption: photoAlt, base64Image, imgUrl };
        }
    } catch (e) {
        console.error("Pexels Image & Data Fetch Error:", e.message);
    }
    
    return { 
        authorName: "Tanvir Ahmed", 
        caption: "A wonderful capture of nature's beauty! 🌸", 
        base64Image: "", 
        imgUrl: `https://picsum.photos/800/600?random=${Date.now()}` 
    };
}

async function PexelsImageAndDataFetch() {
    return await fetchPexelsImageAndData();
}

// নতুন বট অ্যাকাউন্ট খোলা এবং পিক্সেলসের আসল ফটোগ্রাফারের নামে অ্যাকাউন্ট তৈরি করার ফাংশন
async function createNewBotAccount() {
    try {
        // প্রথমে পিক্সেলস থেকে ছবি ও ওই ছবির আসল ফটোগ্রাফারের নাম ফেচ করা হবে
        let pexelsData = await PexelsImageAndDataFetch();
        
        let botName = pexelsData.authorName;
        let cleanEmailName = botName.toLowerCase().replace(/[^a-z0-9]/g, '');
        let botEmail = `bot_${cleanEmailName}_${Math.floor(Math.random() * 9000 + 1000)}@bbook.com`;
        let botPass = "bot123456";
        
        let bgColors = ["1877f2", "2ecc71", "e74c3c", "9b59b6", "f39c12", "1abc9c", "d35400"];
        let randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
        let botProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=${randomBg}&color=fff&size=256&bold=true`;

        // ডাটাবেজে নতুন বট ইউজার অ্যাকাউন্ট রেজিস্টার করা (ফটোগ্রাফারের নামে)
        let regPayload = {
            action: "register",
            name: botName,
            email: botEmail,
            password: botPass,
            profilePicBase64: botProfilePic
        };

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });

        // ডুপ্লিকেট অ্যাকাউন্ট সেভ হওয়া রোধ করতে চেক করা
        if (!registeredBots.some(b => b.name === botName)) {
            let botData = { name: botName, email: botEmail, profilePic: botProfilePic };
            registeredBots.push(botData);
            console.log(`🤖 Pexels Photographer Bot Created: ${botName} (Total Active Bots: ${registeredBots.length})`);
        }

        // অ্যাকাউন্ট খোলার সাথে সাথেই সেই ফটোগ্রাফারের নাম দিয়ে প্রথম পোস্টটি করে দেওয়া
        let postPayload = {
            action: "addPost",
            username: botName,
            profilePic: botProfilePic,
            postText: pexelsData.caption,
            imageBase64: pexelsData.base64Image,
            imageURL: pexelsData.imgUrl
        };

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });

        console.log(`📸 Initial Post Published by Photographer Bot: ${botName}`);

    } catch (err) {
        console.error("Create Bot Error:", err.message);
    }
}

// পিক্সেলস থেকে ছবি ও ক্যাপশন নিয়ে নির্দিষ্ট বট অ্যাকাউন্ট থেকে পোস্ট করার ফাংশন
async function publishBotPost(bot) {
    try {
        let pexelsData = await PexelsImageAndDataFetch();

        let postPayload = {
            action: "addPost",
            username: bot.name,
            profilePic: bot.profilePic,
            postText: pexelsData.caption,
            imageBase64: pexelsData.base64Image,
            imageURL: pexelsData.imgUrl
        };

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });

        console.log(`📸 Regular Post Published by Bot: ${bot.name}`);
    } catch (err) {
        console.error("Publish Post Error:", err.message);
    }
}

// প্রতি ১০ মিনিট পর পর সেভ থাকা সকল বট অ্যাকাউন্ট থেকে পর্যায়ক্রমে পোস্ট করার লজিক
async function postFromAllBotsRegularly() {
    if (registeredBots.length === 0) return;
    
    console.log(`⏰ Regular Auto Post Cycle Triggered for ${registeredBots.length} Bots...`);
    
    for (let i = 0; i < registeredBots.length; i++) {
        let bot = registeredBots[i];
        await publishBotPost(bot);
        let randomGap = Math.floor(Math.random() * 5000) + 5000;
        await new Promise(resolve => setTimeout(resolve, randomGap));
    }
}

// ⏱️ টাইমার কনফিগারেশন:
// ১. প্রতি ২ মিনিটে নতুন বট একাউন্ট খুলবে (পিক্সেলস ফটোগ্রাফারের নামে) এবং সাথে সাথে পোস্ট করবে
setInterval(createNewBotAccount, 120000);

// ২. প্রতি ১০ মিনিটে সমস্ত সেভ থাকা বট অ্যাকাউন্ট থেকে পর্যায়ক্রমে পোস্ট হবে
setInterval(postFromAllBotsRegularly, 600000);

// সার্ভার স্টার্ট হওয়ার সাথে সাথে প্রথম বট তৈরি হয়ে রান হবে
createNewBotAccount();

app.get('/', (req, res) => {
    res.send(`🤖 B_book Pexels-Name Bot Server is Active! Total Saved Bots: ${registeredBots.length}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
