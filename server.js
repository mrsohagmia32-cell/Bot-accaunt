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

// তৈরি হওয়া সকল বট অ্যাকাউন্টের লিস্ট (মেমোরিতে সংরক্ষিত থাকবে)
let registeredBots = [];

const botFirstNames = ["আরিফ", "রাহাত", "তানজিম", "নাবিল", "ফারহান", "সোহাগ", "জুবায়ের", "রিদওয়ান", "সাব্বির", "ইশতিয়াক", "নুসরাত", "মেহজাবিন", "ফারিহা", "তানিশা", "সাদিয়া", "সৌরভ", "নাহিয়ান"];
const botLastNames = ["আহমেদ", "ইসলাম", "হাসান", "চৌধুরী", "হাওলাদার", "মজুমদার", "তালুকদার", "সরকার", "রহমান", "خان"];

// Pexels API থেকে ছবি এবং ছবির নিজস্ব বিবরণ (Alt/Description) আনার ফাংশন
async function fetchPexelsImageAndData() {
    try {
        let queryKeywords = ['nature', 'landscape', 'mountains', 'city', 'flowers', 'ocean', 'forest', 'sunset', 'travel'];
        let randomKeyword = queryKeywords[Math.floor(Math.random() * queryKeywords.length)];
        
        let pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${randomKeyword}&per_page=30`, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        
        let pexelsData = await pexelsRes.json();
        if (pexelsData && pexelsData.photos && pexelsData.photos.length > 0) {
            let randomPhoto = pexelsData.photos[Math.floor(Math.random() * pexelsData.photos.length)];
            
            // পিক্সেলস থেকে ছবির আসল ডেসক্রিপশন বা অল্টারনেটিভ টেক্সট নেওয়া (যদি না থাকে তবে ডিফল্ট ট্যাগ ব্যবহার হবে)
            let photoAlt = randomPhoto.alt || "Beautiful moments captured through lens. 🌿✨";
            
            // পিক্সেলস থেকে ইমেজের Direct Static CDN URL নেওয়া
            let imgUrl = randomPhoto.src.large2x || randomPhoto.src.large || randomPhoto.src.medium;
            
            // ছবি ডাউনলোড করে Base64 এ কনভার্ট করা যাতে ১০০% লোড হয়
            let imgBuffer = await fetch(imgUrl).then(res => res.buffer());
            let base64Image = "data:image/jpeg;base64," + imgBuffer.toString('base64');
            
            return { caption: photoAlt, base64Image, imgUrl };
        }
    } catch (e) {
        console.error("Pexels Image & Data Fetch Error:", e.message);
    }
    
    return { 
        caption: "A wonderful capture of nature's beauty! 🌸", 
        base64Image: "", 
        imgUrl: `https://picsum.photos/800/600?random=${Date.now()}` 
    };
}

// নতুন বট অ্যাকাউন্ট খোলার ফাংশন
async function createNewBotAccount() {
    try {
        let fName = botFirstNames[Math.floor(Math.random() * botFirstNames.length)];
        let lName = botLastNames[Math.floor(Math.random() * botLastNames.length)];
        let botName = `${fName} ${lName}`;
        let botEmail = `bot_${Math.floor(Math.random() * 900000 + 100000)}@bbook.com`;
        let botPass = "bot123456";
        
        let bgColors = ["1877f2", "2ecc71", "e74c3c", "9b59b6", "f39c12", "1abc9c", "d35400"];
        let randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
        let botProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=${randomBg}&color=fff&size=256&bold=true`;

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

        let botData = { name: botName, email: botEmail, profilePic: botProfilePic };
        registeredBots.push(botData);
        console.log(`🤖 New Bot Created & Saved: ${botName} (Total Bots: ${registeredBots.length})`);

        // অ্যাকাউন্ট খোলার সাথে সাথে প্রথম পোস্টটি দেওয়া
        await publishBotPost(botData);

    } catch (err) {
        console.error("Create Bot Error:", err.message);
    }
}

// পিক্সেলস থেকে ছবি ও তার নিজস্ব ক্যাপশন নিয়ে পোস্ট করার ফাংশন
async function publishBotPost(bot) {
    try {
        let pexelsData = await PexelsImageAndDataFetch(); // পিক্সেলসের আসল ডেটা ও ছবি আনবে

        let postPayload = {
            action: "addPost",
            username: bot.name,
            profilePic: bot.profilePic,
            postText: pexelsData.caption, // এখানে পিক্সেলসের নিজস্ব ছবি বিবরণ বা ক্যাপশন বসবে
            imageBase64: pexelsData.base64Image,
            imageURL: pexelsData.imgUrl
        };

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });

        console.log(`📸 Pexels Original Post Published by Bot: ${bot.name} -> "${pexelsData.caption}"`);
    } catch (err) {
        console.error("Publish Post Error:", err.message);
    }
}

// সুবিধার জন্য ফাংশন নাম মেলানো
async function PexelsImageAndDataFetch() {
    return await fetchPexelsImageAndData();
}

// প্রতি ১ ঘণ্টা পর পর সব বট অ্যাকাউন্ট থেকে পোস্ট করার লজিক
async function postFromAllBotsHourly() {
    if (registeredBots.length === 0) {
        await createNewBotAccount();
        return;
    }
    console.log(`⏰ Hourly Auto Post Triggered for ${registeredBots.length} Bots...`);
    for (let bot of registeredBots) {
        await publishBotPost(bot);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

// ⏱️ টাইমার কনফিগারেশন:
// ১. প্রতি ৫ মিনিটে ১টি করে নতুন বট অ্যাকাউন্ট তৈরি হবে
setInterval(createNewBotAccount, 300000);

// ২. প্রতি ১ ঘণ্টায় সেভ হওয়া সকল বট অ্যাকাউন্ট থেকে পিক্সেলস ছবির আসল ক্যাপশন সহ পোস্ট তৈরি হবে
setInterval(postFromAllBotsHourly, 3600000);

// সার্ভার স্টার্ট হওয়ার সাথে সাথে প্রথম বট তৈরি হয়ে পোস্ট রান হবে
createNewBotAccount();

app.get('/', (req, res) => {
    res.send(`🤖 B_book Bot Server is Active! Total Saved Bots: ${registeredBots.length}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
