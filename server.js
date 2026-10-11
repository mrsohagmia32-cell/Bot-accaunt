const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ১. আপনার মূল গুগল অ্যাপস স্ক্রিপ্ট ডাটাবেজ URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9V9Fsqhxxqjd3mIPGWQBwwmHpNSOO01TuO_R3iUPbYbflJjYa9vj91T8PeXlhengtIg/exec";

// ২. আপনার Pexels API Key
const PEXELS_API_KEY = "DiqA3nNE1bXk1CaViv1inoLX9HW18I8g6GtECOhrp6y8kdloYRvRZRCd";

// --------------------------------------------------
// 🤖 অটো বট জেনারেটর (Account + Profile Pic + Post)
// --------------------------------------------------

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

// অটোমেটিক বট অ্যাকাউন্ট তৈরি ও পোস্ট পাবলিশ করার প্রধান ফাংশন
async function runAutoBotRunner() {
    try {
        // ১. র্যান্ডম নাম, ইমেইল ও প্রোফাইল পিকচার তৈরি
        let fName = botFirstNames[Math.floor(Math.random() * botFirstNames.length)];
        let lName = botLastNames[Math.floor(Math.random() * botLastNames.length)];
        let botName = `${fName} ${lName}`;
        let botEmail = `bot_${Math.floor(Math.random() * 900000 + 100000)}@bbook.com`;
        let botPass = "bot123456";
        
        let bgColors = ["1877f2", "2ecc71", "e74c3c", "9b59b6", "f39c12", "1abc9c", "d35400"];
        let randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
        let botProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=${randomBg}&color=fff&size=256&bold=true`;

        // ২. ডাটাবেজে নতুন বট ইউজার অ্যাকাউন্ট রেজিস্টার করা (প্রোফাইল পিক সহ)
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
            body: JSON.stringify(regPayload),
            redirect: 'follow'
        });
        console.log(`✅ [1/2] New Bot Account Created: ${botName}`);

        // ৩. Pexels থেকে ছবি এনে সেই নতুন বট আইডির মাধ্যমে পোস্ট পাবলিশ করা
        let pexelsImageURL = await fetchPexelsImage();
        let randomCaption = botCaptions[Math.floor(Math.random() * botCaptions.length)];

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

        console.log(`✅ [2/2] Pexels Post Published by: ${botName}`);

    } catch (err) {
        console.error("❌ Bot Runner Error:", err.message);
    }
}

// ⏱️ কত সময় পর পর নতুন অ্যাকাউন্ট খুলে পোস্ট করবে?
// এখানে ২ মিনিট (১২০,০০০ মিলি-সেকেন্ড) দেওয়া আছে। আপনি চাইলে '60000' দিয়ে ১ মিনিট করতে পারেন।
setInterval(runAutoBotRunner, 120000);

// সার্ভার চালু হওয়ার সাথে সাথে একবার টেস্ট রান হবে
runAutoBotRunner();

// --------------------------------------------------
// 🌐 সাধারণ রুট (সার্ভার চেক করার জন্য)
// --------------------------------------------------
app.get('/', (req, res) => {
    res.send("🤖 B_book Bot Runner Server is active and running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Bot Runner Server is running on port ${PORT}`);
});
