
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
    uid: tg.initDataUnsafe?.user?.id || "dev_test",
    username: tg.initDataUnsafe?.user?.username || "Guest",
    balance: 0,
    adsClicked: 0,
    lastAdTime: 0,
    refCode: '',
    inviter: '',
    totalRefs: 0,
    refEarned: 0
};

const AD_REWARD = 0.00014;
const MIN_WD = 0.02;

// 25 Random Sound URLs
const sounds = [
    "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
    "https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3",
    // ... add more URLs up to 25
];

const quotes = [
    "Your potential is endless. Keep inviting!",
    "Psychology says: Small habits lead to big changes.",
    "The brain loves rewards—click more, earn more!",
    "Invite a friend, gain 12% of their efforts forever.",
    "Success is the sum of small efforts repeated daily."
    // ... (up to 150 quotes)
];

// --- INITIALIZATION ---
function init() {
    document.getElementById('tg-username').innerText = `@${userData.username}`;
    
    // Auto-show In-App Ads every 3 mins
    checkAutoAd();

    db.ref('users/' + userData.uid).on('value', snap => {
        if (snap.exists()) {
            userData = snap.val();
        } else {
            userData.refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            db.ref('users/' + userData.uid).set(userData);
        }
        updateUI();
    });

    db.ref('globalStats').on('value', snap => {
        const data = snap.val() || { totalUsers: 0, totalIncome: 0 };
        document.getElementById('total-users').innerText = data.totalUsers;
        document.getElementById('total-income').innerText = data.totalIncome.toFixed(5);
    });

    setInterval(tick, 1000);
}

function tick() {
    document.getElementById('live-clock').innerText = new Date().toLocaleString();
    document.getElementById('online-users').innerText = Math.floor(Math.random() * 20) + 5;
}

// --- AD LOGIC ---
function checkAutoAd() {
    const lastAuto = localStorage.getItem('lastAutoAd') || 0;
    const now = Date.now();

    if (now - lastAuto > 180000) { // 3 Minutes
        if (typeof show_10555746 === 'function') {
            show_10555746({ 
                type: 'inApp', 
                inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
            });
            localStorage.setItem('lastAutoAd', now);
        }
    }
}

async function handleAdClick(title) {
    // Cooldown check (3000 ads per hour)
    const now = Date.now();
    if (userData.adsClicked >= 3000 && (now - userData.lastAdTime < 3600000)) {
        alert("Hourly limit reached. Take a 1-hour break!");
        return;
    }

    // 1. Open external ad link
    window.open("https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca", "_blank");

    // 2. Show Rewarded Ad (Libtl)
    if (typeof show_10555663 === 'function') {
        show_10555663().then(() => {
            startTimer();
        }).catch(() => {
            alert("Please disable ad-blocker to earn rewards.");
        });
    } else {
        startTimer(); // Fallback if SDK fails to load
    }
}

let timerInterval;
function startTimer() {
    let seconds = 20;
    const modal = document.getElementById('ad-modal');
    const text = document.getElementById('timer-text');
    const bar = document.getElementById('timer-bar');
    
    modal.classList.add('active');
    bar.style.strokeDashoffset = 377;

    timerInterval = setInterval(() => {
        seconds--;
        text.innerText = seconds;
        bar.style.strokeDashoffset = 377 - (377 * (20 - seconds) / 20);

        if (seconds <= 0) {
            clearInterval(timerInterval);
            finishAd();
        }
    }, 1000);
}

function finishAd() {
    document.getElementById('ad-modal').classList.remove('active');
    
    // Play Random Sound
    const audio = new Audio(sounds[Math.floor(Math.random() * sounds.length)]);
    audio.play();

    // Credit User
    userData.balance += AD_REWARD;
    userData.adsClicked += 1;
    userData.lastAdTime = Date.now();

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

    db.ref('users/' + userData.uid).set(userData);
    db.ref('globalStats/totalIncome').transaction(val => (val || 0) + AD_REWARD);

    // Random Quote Pop-up
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    alert(`CLAIM REWARD: 0.00014 USDT credited!\n\n"${q}"\n\nKeep inviting!`);
}

// --- WITHDRAWAL ---
function submitWithdraw() {
    const amount = parseFloat(document.getElementById('wd-amount').value);
    const addr = document.getElementById('wd-address').value;
    const method = document.getElementById('wd-method').value;

    if (amount < MIN_WD) return alert("Minimum 0.02 USDT");
    if (amount > userData.balance) return alert("Insufficient balance");
    if (!addr) return alert("Address required");

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
    userData.balance -= amount;
    db.ref('users/' + userData.uid).set(userData);
    alert("Request Sent!");
}

function updateUI() {
    document.getElementById('balance').innerText = userData.balance.toFixed(5);
    document.getElementById('my-code').innerText = userData.refCode;
    document.getElementById('total-refs').innerText = userData.totalRefs || 0;
    document.getElementById('ref-earned').innerText = (userData.refEarned || 0).toFixed(5);
    
    // Load History
    db.ref('withdrawals').orderByChild('uid').equalTo(userData.uid).once('value', snap => {
        const div = document.getElementById('wd-history');
        div.innerHTML = '<h3 class="text-xs font-bold opacity-50 mb-2 uppercase">Recent History</h3>';
        snap.forEach(child => {
            const val = child.val();
            div.innerHTML += `
                <div class="bg-slate-800 p-3 rounded-xl flex justify-between items-center text-sm border border-white/5">
                    <span>${val.amount} USDT</span>
                    <span class="text-[10px] ${val.status == 'pending' ? 'text-yellow-500' : 'text-green-500'} font-bold uppercase">${val.status}</span>
                </div>
            `;
        });
    });
}

// --- REFERRAL SYSTEM ---
function claimReferral() {
    const code = document.getElementById('input-ref').value.trim().toUpperCase();
    if (code === userData.refCode) return alert("Cannot use own code");
    if (userData.inviter) return alert("Already referred!");

    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const inviterId = Object.keys(snap.val())[0];
            userData.inviter = inviterId;
            db.ref('users/' + inviterId + '/totalRefs').transaction(t => (t || 0) + 1);
            db.ref('users/' + userData.uid).update({ inviter: inviterId });
            alert("Referral activated! You're now earning extra for your friend.");
        } else {
            alert("Code not found.");
        }
    });
}

// --- ADMIN PANEL ---
function openAdmin() {
    const p = prompt("Admin Password:");
    if (p === "Propetas12") {
        showSection('admin');
        db.ref('withdrawals').on('value', snap => {
            const list = document.getElementById('admin-list');
            list.innerHTML = '';
            snap.forEach(child => {
                const val = child.val();
                if (val.status === 'pending') {
                    list.innerHTML += `
                        <div class="bg-slate-800 p-4 rounded-2xl border border-red-500/20">
                            <div class="text-xs text-slate-400">User: @${val.username}</div>
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
        });
    }
}

function processWd(key, status) {
    db.ref('withdrawals/' + key).update({ status: status });
}

// --- UI HELPERS ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + id).classList.remove('hidden');
    toggleMenu();
}

function setTheme(color) {
    document.body.style.background = color;
}

init();
