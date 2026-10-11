const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// আপনার মূল গুগল অ্যাপস স্ক্রিপ্ট ওয়েব অ্যাপের লিংক
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9V9Fsqhxxqjd3mIPGWQBwwmHpNSOO01TuO_R3iUPbYbflJjYa9vj91T8PeXlhengtIg/exec";

// আপনার দেওয়া Pexels API Key
const PEXELS_API_KEY = "DiqA3nNE1bXk1CaViv1inoLX9HW18I8g6GtECOhrp6y8kdloYRvRZRCd";

// মেমোরি ক্যাশ স্টোরেজ
let cachedPosts = [];
let cachedUsers = [];

// --- ব্যাকগ্রাউন্ড সিঙ্ক ---
async function backgroundSync() {
    try {
        let postRes = await fetch(`${APPS_SCRIPT_URL}?type=posts&t=${Date.now()}`);
        let postData = await postRes.json();
        if (Array.isArray(postData) && postData.length > 0) {
            cachedPosts = postData;
        }

        let userRes = await fetch(`${APPS_SCRIPT_URL}?type=users&t=${Date.now()}`);
        let userData = await userRes.json();
        if (Array.isArray(userData) && userData.length > 0) {
            cachedUsers = userData;
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
    }
}

// সার্ভার চালু হওয়ার সাথে সিঙ্ক হবে এবং প্রতি ৫ সেকেন্ড পর পর চলতে থাকবে
backgroundSync();
setInterval(backgroundSync, 5000);

// রাত ৩:০০ টায় ক্যাশ রিসেট (বাংলাদেশ সময়)
cron.schedule('0 3 * * *', async () => {
    cachedPosts = [];
    cachedUsers = [];
    await backgroundSync();
}, { timezone: "Asia/Dhaka" });


// ==========================================
// 🤖 অ্যাডভান্সড অটো বট: অ্যাকাউন্ট, প্রোফাইল পিক ও পিক্সেল পোস্টার
// ==========================================

const botFirstNames = ["আরিফ", "রাহাত", "তানজিম", "নাবিল", "ফারহান", "সোহাগ", "জুবায়ের", "রিদওয়ান", "সাব্বির", "ইশতিয়াক", "নুসরাত", "মেহজাবিন", "ফারিহা", "তানিশা", "সাদিয়া"];
const botLastNames = ["আহমেদ", "ইসলাম", "হাসান", "চৌধুরী", "হাওলাদার", "মজুমদার", "তালুকদার", "সরকার", "রহমান", "খান"];

const botCaptions = [
    "প্রকৃতির অপরূপ রূপ! মন জুড়িয়ে যাওয়ার মতো দৃশ্য। 🌿✨",
    "আজকের আকাশটা মেঘে ঢাকা, বেশ দারুণ আবহাওয়া। ☁️💙",
    "ছোট ছোট মুহূর্তগুলোই জীবনের আসল সুখ। 😊",
    "চলো আজ নতুন কিছু দেখা যাক! প্রকৃতির মাঝে হারিয়ে যাওয়া। 🌄",
    "কাজের ফাঁকে একটু শান্তির ছোঁয়া। সবাইকে শুভকামনা! 🌸",
    "শহরের যান্ত্রিকতা ছেড়ে একটু নিরিবিলি পরিবেশ। 🍃",
    "সুন্দর একটি সকালের কিছু সুন্দর স্মৃতি। ☀️"
];

// Pexels API থেকে হাই-কোয়ালিটি ছবি আনার ফাংশন
async function fetchPexelsImage() {
    try {
        let queryKeywords = ['nature', 'sunset', 'mountain', 'forest', 'cityscape', 'river', 'sky'];
        let randomKeyword = queryKeywords[Math.floor(Math.random() * queryKeywords.length)];
        
        let pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${randomKeyword}&per_page=15`, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        
        let pexelsData = await pexelsRes.json();
        if (pexelsData && pexelsData.photos && pexelsData.photos.length > 0) {
            let randomPhoto = pexelsData.photos[Math.floor(Math.random() * pexelsData.photos.length)];
            return randomPhoto.src.large2x || randomPhoto.src.medium;
        }
    } catch (e) {
        console.error("Pexels API Error:", e.message);
    }
    return `https://picsum.photos/800/600?random=${Date.now()}`;
}

// অটো অ্যাকাউন্ট, প্রোফাইল পিকচার ও পোস্ট তৈরির মূল ফাংশন
async function runAutoBotSystem() {
    try {
        let fName = botFirstNames[Math.floor(Math.random() * botFirstNames.length)];
        let lName = botLastNames[Math.floor(Math.random() * botLastNames.length)];
        let botName = `${fName} ${lName}`;
        let botEmail = `bot_${Math.floor(Math.random() * 900000 + 100000)}@bbook.com`;
        let botPass = "bot123456";
        
        // রেন্ডম স্টাইলিশ প্রোফাইল পিকচার (UI Avatars বা রেন্ডম ফেস এপিআই থেকে ইউনিক প্রোফাইল পিক জেনারেট হবে)
        let bgColors = ["1877f2", "2ecc71", "e74c3c", "9b59b6", "f39c12", "1abc9c", "d35400"];
        let randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
        let botProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=${randomBg}&color=fff&size=256&bold=true`;

        // ১. নতুন অ্যাকাউন্ট রেজিস্টার করা (সাথে ইউনিক প্রোফাইল পিকচার সহ)
        let regPayload = {
            action: "register",
            name: botName,
            email: botEmail,
            password: botPass,
            profilePicBase64: botProfilePic
        };

        let regRes = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload),
            redirect: 'follow'
        });
        let regResult = await regRes.json();
        
        if(regResult.status === "success" || regResult.status === "exists") {
            console.log(`🤖 New Bot Account Created with Profile Pic: ${botName}`);

            // ২. Pexels থেকে ছবি আনা
            let pexelsImageURL = await fetchPexelsImage();
            let randomCaption = botCaptions[Math.floor(Math.random() * botCaptions.length)];

            // ৩. ওই নতুন বট ইউজারের প্রোফাইল পিক ও নাম দিয়ে পোস্ট পাবলিশ করা
            let postPayload = {
                action: "addPost",
                username: botName,
                profilePic: botProfilePic,
                postText: randomCaption,
                imageBase64: "", 
                imageURL: pexelsImageURL
            };

            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postPayload),
                redirect: 'follow'
            });

            console.log(`📸 Bot Post Published by ${botName} using Pexels Image`);
        }

        // ক্যাশ সিঙ্ক করে নেওয়া
        setTimeout(backgroundSync, 1500);

    } catch (err) {
        console.error("Auto Bot System Error:", err.message);
    }
}

// ⚠️ কত সময় পর পর বট নতুন অ্যাকাউন্ট খুলবে এবং পোস্ট করবে?
// এখানে ২ মিনিট (১২০,০০০ মিলি-সেকেন্ড) সেট করা আছে। আপনি চাইলে পরিবর্তন করতে পারেন।
setInterval(runAutoBotSystem, 120000);

// ==========================================


// --- GET রিকোয়েস্ট (ক্যাশ থেকে ডেটা দেবে) ---
app.get('/', async (req, res) => {
    const type = req.query.type;
    
    if (type === 'posts') {
        return res.json(cachedPosts);
    } 
    else if (type === 'users') {
        return res.json(cachedUsers);
    } 
    else {
        try {
            let targetURL = `${APPS_SCRIPT_URL}?${new URLSearchParams(req.query).toString()}`;
            let r = await fetch(targetURL);
            let d = await r.json();
            return res.json(d);
        } catch (e) {
            return res.json([]);
        }
    }
});

// --- POST রিকোয়েস্ট ---
app.post('/', async (req, res) => {
    try {
        let response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
            redirect: 'follow'
        });
        
        let result = await response.json();
        setTimeout(backgroundSync, 1000);
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "error", message: err.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`B_book Advanced Bot Server running on port ${PORT}`);
});
