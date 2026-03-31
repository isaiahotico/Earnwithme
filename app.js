
// --- DATABASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
tg.expand();

// --- STATE ---
let userData = {
    uid: tg.initDataUnsafe?.user?.id || "dev_test", // Use a unique fallback for development
    username: tg.initDataUnsafe?.user?.username || "Guest",
    balance: 0,
    adsClicked: 0,
    lastAdTime: 0,
    refCode: '',
    inviter: '',
    totalRefs: 0,
    refEarned: 0,
    themeColor: '#0f172a' // Default theme color
};

const AD_REWARD = 0.00014;
const MIN_WD = 0.02;
const AD_TIMER_DURATION = 10; // New: Timer duration reduced to 10 seconds

// 25 Random Sound URLs - **IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DIRECT SOUND LINKS**
const sounds = [
    "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3", // Example sound 1
    "https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3", // Example sound 2
    "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3", // Example sound 3
    "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3", // Example sound 4
    "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3", // Example sound 5
    // ADD 20 MORE SOUND URLS HERE
    "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2021/2021-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2022/2022-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2023/2023-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2024/2024-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2025/2025-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2026/2026-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2027/2027-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2028/2028-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2029/2029-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2030/2030-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2031/2031-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2032/2032-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2033/2033-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2034/2034-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2035/2035-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2036/2036-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2037/2037-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2038/2038-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.mp3"
];


const quotes = [
    "Your potential is endless. Keep inviting!",
    "Psychology says: Small habits lead to big changes.",
    "The brain loves rewards—click more, earn more!",
    "Invite a friend, gain 12% of their efforts forever.",
    "Success is the sum of small efforts repeated daily.",
    "Every step forward is a victory. Keep going!",
    "The only limit is your imagination. Think big!",
    "Believe in yourself and all that you are.",
    "Great things never came from comfort zones.",
    "The best way to predict the future is to create it.",
    "Invite to increase your network, multiply your income.",
    "Small actions accumulate into massive results.",
    "You are capable of more than you know.",
    "Patience, persistence, and perspiration make an unbeatable combination.",
    "The mind is everything. What you think you become.",
    // Add more quotes up to 150...
];

// --- INITIALIZATION ---
function init() {
    document.getElementById('tg-username').innerText = `@${userData.username}`;
    
    // Load/Create User Data
    db.ref('users/' + userData.uid).on('value', snap => {
        if (snap.exists()) {
            userData = snap.val();
            // Ensure new fields are initialized if they don't exist in older data
            userData.refCode = userData.refCode || Math.random().toString(36).substring(2, 8).toUpperCase();
            userData.invitedBy = userData.invitedBy || '';
            userData.totalRefs = userData.totalRefs || 0;
            userData.refEarned = userData.refEarned || 0;
            userData.adsClicked = userData.adsClicked || 0;
            userData.lastAdTime = userData.lastAdTime || 0;
            userData.themeColor = userData.themeColor || '#0f172a'; // Initialize theme
            db.ref('users/' + userData.uid).update(userData); // Update any missing fields in DB
        } else {
            userData.refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            db.ref('users/' + userData.uid).set(userData);
        }
        setTheme(userData.themeColor); // Apply user's saved theme
        updateUI();
    });

    // Global Stats
    db.ref('globalStats').on('value', snap => {
        const data = snap.val() || { totalUsers: 0, totalIncome: 0 };
        document.getElementById('total-users').innerText = data.totalUsers;
        document.getElementById('total-income').innerText = data.totalIncome.toFixed(5);
    });

    setInterval(tick, 1000); // Update clock and online users every second
    checkAutoAd(); // Initial check for auto in-app ads
}

function tick() {
    document.getElementById('live-clock').innerText = new Date().toLocaleString();
    // Simulate online users
    document.getElementById('online-users').innerText = Math.floor(Math.random() * 20) + 5; 
}

// --- AD LOGIC ---

let lastAutoAdShownTime = localStorage.getItem('lastAutoAdShownTime') || 0; // Track last auto-ad time
const AUTO_AD_COOLDOWN = 3 * 60 * 1000; // 3 minutes in milliseconds

function checkAutoAd() {
    const now = Date.now();
    if (now - lastAutoAdShownTime > AUTO_AD_COOLDOWN) {
        if (typeof show_10555746 === 'function') {
            console.log("Triggering Libtl auto In-App ad (3-minute cooldown)");
            show_10555746({ 
                type: 'inApp', 
                inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
            }).catch(e => console.error("Libtl Auto In-App Ad failed:", e));
            lastAutoAdShownTime = now;
            localStorage.setItem('lastAutoAdShownTime', now);
        }
    }
}

let timerInterval;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 60; // For r=60 in SVG

async function handleAdClick(title) {
    const now = Date.now();
    
    // Cooldown check (3000 ads per hour)
    if (userData.adsClicked >= 3000 && (now - userData.lastAdTime < 3600000)) { // 3,600,000 ms = 1 hour
        alert("Hourly limit reached. Take a 1-hour break!");
        return;
    }

    // 1. Open external Adterra ad link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    // 2. Start our in-app timer immediately
    startInAppTimer();

    // 3. Trigger Libtl rewarded and in-app ads simultaneously
    if (typeof show_10555663 === 'function') {
        console.log("Triggering Libtl Rewarded ad on click");
        show_10555663().then(() => {
            alert('You have seen an ad from Libtl rewarded interstitial!'); // This is the alert from Libtl's own instructions
        }).catch(e => console.error("Libtl Rewarded Ad failed:", e));
    } else {
        console.warn("Libtl Rewarded SDK (show_10555663) not loaded or available.");
    }

    if (typeof show_10555746 === 'function') {
        console.log("Triggering Libtl In-App ad on click");
        // Triggering the in-app interstitial explicitly on click as well
        show_10555746({ 
            type: 'inApp', 
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
        }).catch(e => console.error("Libtl In-App Ad failed:", e));
    } else {
        console.warn("Libtl In-App SDK (show_10555746) not loaded or available.");
    }
}

function startInAppTimer() {
    let seconds = AD_TIMER_DURATION;
    const modal = document.getElementById('ad-modal');
    const text = document.getElementById('timer-text');
    const bar = document.getElementById('timer-bar');
    
    modal.classList.add('active');
    text.innerText = seconds; // Set initial text
    bar.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE; // Start with full offset

    timerInterval = setInterval(() => {
        seconds--;
        text.innerText = seconds;
        // Update the circle's stroke-dashoffset to show progress
        bar.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * (AD_TIMER_DURATION - seconds) / AD_TIMER_DURATION);

        if (seconds <= 0) {
            clearInterval(timerInterval);
            finishAdReward(); // Our reward function
        }
    }, 1000);
}

function finishAdReward() {
    document.getElementById('ad-modal').classList.remove('active');
    
    // Play Random Sound
    if (sounds.length > 0) {
        const audio = new Audio(sounds[Math.floor(Math.random() * sounds.length)]);
        audio.play().catch(e => console.error("Error playing sound:", e));
    } else {
        console.warn("No sound URLs provided in the 'sounds' array.");
    }

    // Credit User Balance
    userData.balance += AD_REWARD;
    userData.adsClicked += 1;
    userData.lastAdTime = Date.now(); // Update last ad time for cooldown

    // Referral 12% Bonus
    if (userData.inviter) {
        const bonus = AD_REWARD * 0.12;
        db.ref('users/' + userData.inviter).transaction(user => {
            if (user) {
                user.balance = (user.balance || 0) + bonus;
                user.refEarned = (user.refEarned || 0) + bonus;
            }
            return user;
        });
    }

    // Update user data in Firebase
    db.ref('users/' + userData.uid).set(userData);
    
    // Update global total income
    db.ref('globalStats/totalIncome').transaction(val => (val || 0) + AD_REWARD);

    // Random Quote Pop-up
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    alert(`CLAIM REWARD: ${AD_REWARD.toFixed(5)} USDT credited!\n\n"${q}"\n\nKeep inviting!`);
    updateUI();
}

// --- WITHDRAWAL ---
function submitWithdraw() {
    const amount = parseFloat(document.getElementById('wd-amount').value);
    const addr = document.getElementById('wd-address').value.trim();
    const method = document.getElementById('wd-method').value;

    if (isNaN(amount) || amount < MIN_WD) return alert(`Minimum withdrawal is ${MIN_WD.toFixed(2)} USDT`);
    if (amount > userData.balance) return alert("Insufficient balance");
    if (!addr) return alert("Please enter your payment address/phone number.");

    const request = {
        uid: userData.uid,
        username: userData.username,
        amount: amount,
        method: method,
        address: addr,
        status: 'pending',
        time: Date.now()
    };

    db.ref('withdrawals').push(request);
    userData.balance -= amount; // Deduct from user's balance immediately
    db.ref('users/' + userData.uid).set(userData);
    alert("Withdrawal request submitted! Please wait for admin approval.");
    updateUI();
}

function updateUI() {
    document.getElementById('balance').innerText = userData.balance.toFixed(5);
    document.getElementById('my-code').innerText = userData.refCode;
    document.getElementById('total-refs').innerText = userData.totalRefs || 0;
    document.getElementById('ref-earned').innerText = (userData.refEarned || 0).toFixed(5);
    
    // Load Withdrawal History
    db.ref('withdrawals').orderByChild('uid').equalTo(userData.uid).once('value', snap => {
        const div = document.getElementById('wd-history');
        div.innerHTML = '<h3 class="text-xs font-bold opacity-50 mb-2 uppercase">Your Withdrawal History</h3>';
        if (!snap.exists()) {
            div.innerHTML += '<p class="text-center text-slate-500">No withdrawal history yet.</p>';
        }
        snap.forEach(child => {
            const val = child.val();
            const date = new Date(val.time).toLocaleDateString();
            div.innerHTML += `
                <div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center text-sm border border-white/5">
                    <div>
                        <span>${val.amount} USDT via ${val.method}</span><br>
                        <span class="text-xs text-slate-400">${date} - ${val.address}</span>
                    </div>
                    <span class="text-[10px] ${val.status == 'pending' ? 'text-yellow-500' : val.status == 'Approved' ? 'text-green-500' : 'text-red-500'} font-bold uppercase">${val.status}</span>
                </div>
            `;
        });
    });
}

// --- REFERRAL SYSTEM ---
function claimReferral() {
    const code = document.getElementById('input-ref').value.trim().toUpperCase();
    if (!code) return alert("Please enter a referral code.");
    if (code === userData.refCode) return alert("You cannot use your own referral code.");
    if (userData.inviter) return alert("You have already been referred by someone else.");

    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const inviterId = Object.keys(snap.val())[0];
            userData.inviter = inviterId;
            // Increment inviter's totalRefs count
            db.ref('users/' + inviterId + '/totalRefs').transaction(t => (t || 0) + 1);
            // Update current user's inviter field
            db.ref('users/' + userData.uid).update({ inviter: inviterId });
            alert("Referral activated! You are now linked and will earn extra bonuses.");
            updateUI();
        } else {
            alert("Invalid referral code. Please check and try again.");
        }
    });
}

// --- ADMIN PANEL ---
function openAdmin() {
    const p = prompt("Enter Admin Password:");
    if (p === "Propetas12") {
        showSection('admin');
        db.ref('withdrawals').on('value', snap => {
            const list = document.getElementById('admin-list');
            list.innerHTML = '';
            let pendingFound = false;
            snap.forEach(child => {
                const val = child.val();
                if (val.status === 'pending') {
                    pendingFound = true;
                    list.innerHTML += `
                        <div class="bg-slate-800 p-4 rounded-2xl border border-red-500/20">
                            <div class="text-xs text-slate-400">User: @${val.username} (${val.uid})</div>
                            <div class="font-bold">${val.amount} USDT via ${val.method}</div>
                            <div class="text-[10px] text-blue-400 mb-3">${val.address}</div>
                            <div class="flex gap-2">
                                <button onclick="processWd('${child.key}', 'Approved')" class="bg-green-600 flex-1 py-2 rounded-lg text-xs font-bold">APPROVE</button>
                                <button onclick="processWd('${child.key}', 'Rejected')" class="bg-red-600 flex-1 py-2 rounded-lg text-xs font-bold">REJECT</button>
                            </div>
                        </div>
                    `;
                }
            });
            if (!pendingFound) {
                list.innerHTML = '<p class="text-center text-slate-500">No pending withdrawal requests.</p>';
            }
        });
    } else {
        alert("Incorrect Admin Password.");
    }
}

function processWd(key, status) {
    db.ref('withdrawals/' + key).update({ status: status })
        .then(() => alert(`Withdrawal ${key} ${status.toLowerCase()}.`))
        .catch(e => console.error("Error updating withdrawal status:", e));
}

// --- UI HELPERS ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + id).classList.remove('hidden');
    toggleMenu(); // Close sidebar after selecting a section
    checkAutoAd(); // Trigger auto-ad check when section changes
}

function setTheme(color) {
    document.body.style.backgroundColor = color;
    userData.themeColor = color; // Save selected theme
    if (userData.uid !== "dev_test") { // Only save for real users
        db.ref('users/' + userData.uid).update({ themeColor: color });
    }
}

// Initialize the app
init();
