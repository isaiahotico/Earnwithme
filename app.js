// Configuration & State
const REFERRAL_BONUS_RATE = 0.12; // 12%
const INITIAL_SIGNUP_BONUS = 50; // $50 base to calculate 12% from

let state = {
    currentUser: {
        id: "user_123",
        balance: 100.00,
        referralCode: "A1B2C3",
        referrals: 0,
        earnedFromReferrals: 0,
        isBanned: false,
        hasUsedCode: false
    },
    withdrawals: [],
    users: [
        { id: "user_123", name: "You (Demo)", referralCode: "A1B2C3", isBanned: false },
        { id: "user_999", name: "John Doe", referralCode: "XYZ999", isBanned: false }
    ]
};

// Initialize App
function init() {
    loadData();
    generateReferralCode();
    updateUI();
    startTime();
}

// 1. Footer Time/Date Logic
function startTime() {
    const footer = document.getElementById('footerDateTime');
    setInterval(() => {
        const now = new Date();
        footer.innerText = now.toLocaleDateString() + " | " + now.toLocaleTimeString();
    }, 1000);
}

// 2. Referral System Logic
function generateReferralCode() {
    if (!state.currentUser.referralCode) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        state.currentUser.referralCode = code;
    }
    document.getElementById('myReferralCode').innerText = state.currentUser.referralCode;
}

function applyReferral() {
    const input = document.getElementById('referralInput').value.trim().toUpperCase();
    
    if (state.currentUser.hasUsedCode) {
        alert("You have already used a referral code!");
        return;
    }

    if (input.length === 6) {
        const bonus = INITIAL_SIGNUP_BONUS * REFERRAL_BONUS_RATE;
        state.currentUser.balance += bonus;
        state.currentUser.earnedFromReferrals += bonus;
        state.currentUser.referrals += 1;
        state.currentUser.hasUsedCode = true;
        
        saveData();
        updateUI();
        alert(`Success! 12% bonus ($${bonus.toFixed(2)}) added to your balance.`);
    } else {
        alert("Please enter a valid 6-character code.");
    }
}

// 3. Withdrawal Logic
function requestWithdrawal() {
    if (state.currentUser.balance < 10) {
        alert("Minimum withdrawal is $10");
        return;
    }
    
    const amount = state.currentUser.balance;
    const request = {
        id: Date.now(),
        userId: state.currentUser.id,
        amount: amount,

        status: 'pending',
        date: new Date().toLocaleDateString()
    };
    
    state.withdrawals.push(request);
    state.currentUser.balance = 0; // Empty balance during pending
    
    saveData();
    updateUI();
    alert("Withdrawal request sent for admin approval!");
}

// 4. Admin Logic
function approveWithdrawal(id) {
    const req = state.withdrawals.find(r => r.id === id);
    if (req) req.status = 'approved';
    saveData();
    updateUI();
}

function denyWithdrawal(id) {
    const req = state.withdrawals.find(r => r.id === id);
    if (req) {
        req.status = 'denied';
        state.currentUser.balance += req.amount; // Refund
    }
    saveData();
    updateUI();
}

function toggleBan(userId) {
    const user = state.users.find(u => u.id === userId);
    if (user) {
        user.isBanned = !user.isBanned;
        if (userId === state.currentUser.id) state.currentUser.isBanned = user.isBanned;
    }
    saveData();
    updateUI();
}

// 5. UI Management
function updateUI() {
    // Check Ban Status
    document.getElementById('bannedScreen').style.display = state.currentUser.isBanned ? 'flex' : 'none';

    // Update User Stats
    document.getElementById('userBalance').innerText = `$${state.currentUser.balance.toFixed(2)}`;
    document.getElementById('totalReferrals').innerText = state.currentUser.referrals;
    document.getElementById('totalReferralEarnings').innerText = `$${state.currentUser.earnedFromReferrals.toFixed(2)}`;

    // Update Admin Withdrawal List
    const container = document.getElementById('withdrawalRequests');
    container.innerHTML = state.withdrawals.filter(r => r.status === 'pending').map(req => `
        <div class="request-item">
            <span>User: ${req.userId} - <strong>$${req.amount.toFixed(2)}</strong></span>
            <div>
                <button class="btn-success" onclick="approveWithdrawal(${req.id})">✓</button>
                <button class="btn-danger" onclick="denyWithdrawal(${req.id})">X</button>
            </div>
        </div>
    `).join('') || '<p>No pending requests</p>';

    // Update Admin User List
    const userList = document.getElementById('userList');
    userList.innerHTML = state.users.map(u => `
        <div class="request-item">
            <span>${u.name} (${u.referralCode})</span>
            <button class="${u.isBanned ? 'btn-success' : 'btn-danger'}" onclick="toggleBan('${u.id}')">
                ${u.isBanned ? 'Unban' : 'Ban'}
            </button>
        </div>
    `).join('');
}

function switchView(view) {
    document.getElementById('userView').style.display = (view === 'user') ? 'block' : 'none';
    document.getElementById('adminView').style.display = (view === 'admin') ? 'block' : 'none';
}

// Persistence
function saveData() {
    localStorage.setItem('earnApp_state', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('earnApp_state');
    if (saved) state = JSON.parse(saved);
}

// Start
init();
