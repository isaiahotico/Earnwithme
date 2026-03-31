
// --- DATABASE CONFIGURATION ---
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

// --- GLOBALS ---
const tg = window.Telegram.WebApp;
tg.expand();

let currentUser = {
    uid: tg.initDataUnsafe?.user?.id || "guest_user",
    username: tg.initDataUnsafe?.user?.username || "Guest",
    balance: 0,
    adsToday: 0,
    lastAdTime: 0,
    refCode: '',
    invitedBy: '',
    totalRefEarned: 0,
    totalRefs: 0
};

const AD_LINK = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";
const REWARD_AMOUNT = 0.00014;
const MIN_WITHDRAW = 0.02;

const quotes = [
    "Success is not final; failure is not fatal.",
    "The only way to do great work is to love what you do.",
    "Invite friends to multiply your earnings by 12%!",
    "Consistency is the key to psychological resilience.",
    "The human mind is your greatest asset in business."
    // Add more up to 150...
];

// --- INITIALIZATION ---
function init() {
    document.getElementById('tg-username').innerText = `@${currentUser.username}`;
    
    // Load/Create User
    db.ref('users/' + currentUser.uid).once('value', (snap) => {
        if (snap.exists()) {
            currentUser = snap.val();
        } else {
            currentUser.refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            db.ref('users/' + currentUser.uid).set(currentUser);
        }
        updateUI();
    });

    // Global Stats
    db.ref('globalStats').on('value', (snap) => {
        const data = snap.val() || { totalUsers: 0, totalIncome: 0 };
        document.getElementById('total-users').innerText = data.totalUsers;
        document.getElementById('total-paid').innerText = data.totalIncome.toFixed(5);
    });

    // Online Users (Simulated)
    setInterval(() => {
        const online = Math.floor(Math.random() * 50) + 10;
        document.getElementById('online-users').innerText = online;
        document.getElementById('footer-date').innerText = new Date().toLocaleString();
    }, 1000);

    showQuote();
}

// --- UI LOGIC ---
function toggleMenu() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sb.classList.toggle('active');
    overlay.classList.toggle('hidden');
}

function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + id).classList.remove('hidden');
    toggleMenu();
}

function updateUI() {
    document.getElementById('user-balance').innerText = currentUser.balance.toFixed(5) + " USDT";
    document.getElementById('my-ref-code').value = currentUser.refCode;
    document.getElementById('total-refs').innerText = currentUser.totalRefs || 0;
    document.getElementById('total-ref-earned').innerText = (currentUser.totalRefEarned || 0).toFixed(5);
    loadWithdrawalHistory();
}

// --- AD LOGIC ---
let adTimer;
function startAdTask(type) {
    const now = Date.now();
    
    // Cooldown check (3000 ads per 1 hour)
    if (currentUser.adsToday >= 3000 && (now - currentUser.lastAdTime) < 3600000) {
        alert("Cooldown active. Please wait 1 hour.");
        return;
    }

    // Open Ad Link
    window.open(AD_LINK, '_blank');
    
    // Inject Random SDK Ad Script (Internal)
    const script = document.createElement('script');
    script.src = "//libtl.com/sdk.js";
    script.setAttribute('data-zone', '10555663');
    script.setAttribute('data-sdk', 'show_10555663');
    document.body.appendChild(script);

    // Start Timer
    let timeLeft = 20;
    const modal = document.getElementById('ad-modal');
    const timerText = document.getElementById('timer-text');
    const circle = document.getElementById('timer-circle');
    
    modal.classList.add('active');
    
    adTimer = setInterval(() => {
        timeLeft--;
        timerText.innerText = timeLeft;
        const offset = 251.2 - (251.2 * (20 - timeLeft) / 20);
        circle.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            clearInterval(adTimer);
            finishAd();
        }
    }, 1000);
}

function finishAd() {
    document.getElementById('ad-modal').classList.remove('active');
    document.getElementById('reward-sound').play();
    
    // Reward Logic
    currentUser.balance += REWARD_AMOUNT;
    currentUser.adsToday = (currentUser.adsToday || 0) + 1;
    currentUser.lastAdTime = Date.now();

    // Referral Commission (12%)
    if (currentUser.invitedBy) {
        db.ref('users/' + currentUser.invitedBy).transaction(user => {
            if (user) {
                const comm = REWARD_AMOUNT * 0.12;
                user.balance += comm;
                user.totalRefEarned = (user.totalRefEarned || 0) + comm;
            }
            return user;
        });
    }

    db.ref('users/' + currentUser.uid).set(currentUser);
    db.ref('globalStats/totalIncome').transaction(val => (val || 0) + REWARD_AMOUNT);
    
    alert(`Congratulations! Reward 0.00014 USDT credited. Keep inviting!\n\n"${quotes[Math.floor(Math.random() * quotes.length)]}"`);
    updateUI();
}

// --- WITHDRAWAL ---
function requestWithdrawal() {
    const amount = parseFloat(document.getElementById('wd-amount').value);
    const method = document.getElementById('wd-method').value;
    const address = document.getElementById('wd-address').value;

    if (amount < MIN_WITHDRAW) return alert("Min withdrawal is 0.02 USDT");
    if (amount > currentUser.balance) return alert("Insufficient balance");
    if (!address) return alert("Enter payment address");

    const wdData = {
        uid: currentUser.uid,
        username: currentUser.username,
        amount: amount,
        method: method,
        address: address,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref('withdrawals').push(wdData);
    currentUser.balance -= amount;
    db.ref('users/' + currentUser.uid).set(currentUser);
    
    alert("Withdrawal request submitted!");
    updateUI();
}

function loadWithdrawalHistory() {
    db.ref('withdrawals').orderByChild('uid').equalTo(currentUser.uid).on('value', snap => {
        const list = document.getElementById('wd-history');
        list.innerHTML = '';
        snap.forEach(child => {
            const data = child.val();
            list.innerHTML += `
                <div class="bg-gray-700 p-2 rounded flex justify-between">
                    <span>${data.amount} (${data.method})</span>
                    <span class="${data.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}">${data.status}</span>
                </div>
            `;
        });
    });
}

// --- ADMIN ---
function openAdmin() {
    const pass = prompt("Enter Admin Password:");
    if (pass === "Propetas12") {
        showSection('admin');
        loadAdminPanel();
    } else {
        alert("Wrong Password");
    }
}

function loadAdminPanel() {
    db.ref('withdrawals').on('value', snap => {
        const container = document.getElementById('admin-withdrawals');
        container.innerHTML = '';
        snap.forEach(child => {
            const data = child.val();
            if (data.status === 'pending') {
                container.innerHTML += `
                    <div class="bg-gray-800 p-4 rounded border border-red-900">
                        <p>User: @${data.username}</p>
                        <p>Amount: ${data.amount} USDT</p>
                        <p>Method: ${data.method} (${data.address})</p>
                        <div class="flex gap-2 mt-2">
                            <button onclick="updateWd('${child.key}', 'approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                            <button onclick="updateWd('${child.key}', 'rejected')" class="bg-red-600 px-4 py-1 rounded">Reject</button>
                        </div>
                    </div>
                `;
            }
        });
    });
}

function updateWd(key, status) {
    db.ref('withdrawals/' + key).update({ status: status });
}

// --- REFERRALS ---
function applyReferral() {
    const code = document.getElementById('input-ref-code').value.trim();
    if (code === currentUser.refCode) return alert("Cannot use own code");
    
    db.ref('users').orderByChild('refCode').equalTo(code).once('value', snap => {
        if (snap.exists()) {
            const parentUid = Object.keys(snap.val())[0];
            currentUser.invitedBy = parentUid;
            db.ref('users/' + currentUser.uid).update({ invitedBy: parentUid });
            db.ref('users/' + parentUid + '/totalRefs').transaction(c => (c || 0) + 1);
            alert("Referral Applied!");
        } else {
            alert("Invalid Code");
        }
    });
}

// --- THEME ---
function changeColor(hex) {
    document.body.style.backgroundColor = hex;
}

function showQuote() {
    if (Math.random() > 0.7) {
        alert("Psychology Tip: " + quotes[Math.floor(Math.random() * quotes.length)]);
    }
}

init();
