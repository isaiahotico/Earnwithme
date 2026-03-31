
document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
        authDomain: "facebook-follow-to-follow.firebaseapp.com",
        databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "facebook-follow-to-follow",
        storageBucket: "facebook-follow-to-follow.firebasestorage.app",
        messagingSenderId: "589427984313",
        appId: "1:589427984313:web:a17b8cc851efde6dd79868"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();

    // --- DOM Elements ---
    const telegramUsernameEl = document.getElementById('telegramUsername');
    const userBalanceEl = document.getElementById('userBalance');
    const adsTodayEl = document.getElementById('adsToday');
    const cooldownMessageEl = document.getElementById('cooldownMessage');
    const premiumAds1Btn = document.getElementById('premiumAds1Btn');
    const turboAds2Btn = document.getElementById('turboAds2Btn');
    const adCompletionSection = document.getElementById('adCompletionSection');
    const adTimerEl = document.getElementById('adTimer');
    const countdownEl = document.getElementById('countdown');
    const claimRewardBtn = document.getElementById('claimRewardBtn');
    const adCompleteSound = document.getElementById('adCompleteSound');
    const quoteDisplayEl = document.getElementById('quoteDisplay');
    const currentDateTimeEl = document.getElementById('currentDateTime');

    // Withdrawal elements
    const withdrawBalanceEl = document.getElementById('withdrawBalance');
    const withdrawalForm = document.getElementById('withdrawalForm');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawMethodSelect = document.getElementById('withdrawMethod');
    const contactInfoInput = document.getElementById('contactInfo');
    const withdrawStatusEl = document.getElementById('withdrawStatus');
    const withdrawalHistoryList = document.getElementById('withdrawalHistoryList');

    // Admin elements
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginStatus = document.getElementById('adminLoginStatus');
    const adminContent = document.getElementById('adminContent');
    const totalRegisteredUsersEl = document.getElementById('totalRegisteredUsers');
    const onlineUsersCountEl = document.getElementById('onlineUsersCount');
    const pendingWithdrawalsList = document.getElementById('pendingWithdrawalsList');
    const allUsersList = document.getElementById('allUsersList');

    // Theme picker elements
    const themePickerBtn = document.getElementById('themePickerBtn');
    const themeModal = document.getElementById('themeModal');
    const closeThemeModalBtn = document.getElementById('closeThemeModalBtn');
    const themeColorOptions = document.querySelectorAll('.theme-color-option');

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const appSections = document.querySelectorAll('.app-section');

    // --- Global Variables / Constants ---
    const REWARD_AMOUNT = 0.00014; // USDT
    const AD_VIEW_DURATION = 20; // seconds
    const DAILY_AD_LIMIT = 3000;
    const COOLDOWN_HOURS = 1;
    const ADMIN_PASSWORD = "Propetas12"; // !!! DANGER: FOR DEMO ONLY. USE FIREBASE AUTHENTICATION IN PRODUCTION.

    let currentUser = null; // Firebase User object
    let currentUserId = null; // Unique ID for Firebase DB reference
    let isAdPlaying = false;
    let countdownInterval = null;
    let currentTheme = localStorage.getItem('userTheme') || 'blue'; // Default theme

    // --- Random Quotes for Pop-up/Display (add up to 150) ---
    const rewardQuotes = [
        "Congratulations! Your consistency is truly paying off. Keep up the great work!",
        "Fantastic! Every ad viewed is a step closer to your goals. You're doing great!",
        "Amazing! Small actions lead to big results. Keep inviting for more rewards!",
        "Well done! Your dedication fuels your progress. Keep inviting and earning!",
        "Awesome! Remember, consistent effort yields lasting rewards. Keep sharing!",
        "Success is the sum of small efforts, repeated daily. Keep going!",
        "The journey of a thousand miles begins with a single step. You've taken many!",
        "Your future is created by what you do today, not tomorrow. Keep earning!",
        "Believe you can and you're halfway there. You're almost there!",
        "Motivation comes from working on things we care about. Keep inviting to grow!",
        "The only way to do great work is to love what you do. Enjoy your earnings!",
        "Don't watch the clock; do what it does. Keep going. You're making progress!",
        "The best way to predict the future is to create it. Keep building your income!",
        "Opportunities don't happen, you create them. Invite more, earn more!",
        "The mind is everything. What you think you become. Think abundance!",
        "What you get by achieving your goals is not as important as what you become by achieving your goals.",
        "It's not about perfect. It's about effort. And when you bring that effort every single day, that's where transformation happens. That's how change occurs.",
        "Start where you are. Use what you have. Do what you can.",
        "The only person you are destined to become is the person you decide to be.",
        "The future belongs to those who believe in the beauty of their dreams."
        // Add more quotes here, up to 150
    ];

    // --- Firebase Authentication (for user ID) ---
    // Simulating a user login for demo purposes. In a real app, you'd use Telegram Login Widget
    // and Firebase Authentication (e.g., anonymous auth or custom token from Telegram)
    auth.signInAnonymously().catch(error => {
        console.error("Firebase Anonymous Auth failed:", error);
        alert("Failed to authenticate with Firebase. Please try again.");
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            console.log("Authenticated as:", currentUserId);
            // Check if user exists in DB, if not, create a new entry
            database.ref(`users/${currentUserId}`).once('value', snapshot => {
                if (!snapshot.exists()) {
                    // This is a new user
                    // For demo, we'll assign a mock Telegram username
                    let mockTelegramUsername = `User_${Math.floor(Math.random() * 9000) + 1000}`;
                    const params = new URLSearchParams(window.location.search);
                    if (params.has('tg_username')) {
                        mockTelegramUsername = params.get('tg_username');
                    }
                    database.ref(`users/${currentUserId}`).set({
                        telegramUsername: mockTelegramUsername,
                        balance: 0,
                        adClicks: 0,
                        lastAdClickTimestamp: 0,
                        lastCooldownEnd: 0,
                        theme: 'blue',
                        isAdmin: false,
                        isBanned: false,
                        registeredAt: firebase.database.ServerValue.TIMESTAMP
                    });
                    telegramUsernameEl.textContent = `@${mockTelegramUsername}`;
                    applyTheme('blue'); // Apply default theme for new user
                } else {
                    const userData = snapshot.val();
                    telegramUsernameEl.textContent = `@${userData.telegramUsername || 'N/A'}`;
                    applyTheme(userData.theme || 'blue'); // Apply user's saved theme
                }
                // Start listening to user data changes
                listenToUserData();
            });

            // Set up presence system
            const userStatusRef = database.ref(`onlineUsers/${currentUserId}`);
            userStatusRef.onDisconnect().remove(); // Remove user from online list when disconnected
            userStatusRef.set({
                lastSeen: firebase.database.ServerValue.TIMESTAMP,
                username: telegramUsernameEl.textContent // Use the displayed username
            });
            // Update last seen periodically (every 30 seconds)
            setInterval(() => {
                userStatusRef.set({
                    lastSeen: firebase.database.ServerValue.TIMESTAMP,
                    username: telegramUsernameEl.textContent
                });
            }, 30000); // Update every 30 seconds
        } else {
            console.log("No user is signed in.");
            // Handle not signed in state
        }
    });

    // --- Firebase Data Listeners ---
    function listenToUserData() {
        if (!currentUserId) return;

        database.ref(`users/${currentUserId}`).on('value', snapshot => {
            const userData = snapshot.val();
            if (userData) {
                userBalanceEl.textContent = `$${userData.balance.toFixed(5)}`;
                adsTodayEl.textContent = `${userData.adClicks} / ${DAILY_AD_LIMIT}`;
                withdrawBalanceEl.textContent = `$${userData.balance.toFixed(5)}`;

                // Check cooldown status
                const now = Date.now();
                if (userData.lastCooldownEnd > now) {
                    cooldownMessageEl.textContent = `Ad cooldown active. Please wait ${formatTimeLeft(userData.lastCooldownEnd - now)}.`;
                    cooldownMessageEl.classList.remove('hidden');
                    premiumAds1Btn.disabled = true;
                    turboAds2Btn.disabled = true;
                } else {
                    cooldownMessageEl.classList.add('hidden');
                    premiumAds1Btn.disabled = false;
                    turboAds2Btn.disabled = false;
                }
            }
        });

        database.ref(`withdrawals`).orderByChild('userId').equalTo(currentUserId).on('value', snapshot => {
            const withdrawals = snapshot.val();
            withdrawalHistoryList.innerHTML = '';
            if (withdrawals) {
                const sortedWithdrawals = Object.values(withdrawals).sort((a, b) => b.requestTimestamp - a.requestTimestamp);
                sortedWithdrawals.forEach(req => {
                    const div = document.createElement('div');
                    div.className = `withdrawal-item ${req.status} p-3 rounded-md shadow-sm mb-2`;
                    div.innerHTML = `
                        <p class="font-semibold text-lg">$${req.amount.toFixed(2)} USDT via ${req.method}</p>
                        <p class="text-sm text-gray-600">Requested: ${new Date(req.requestTimestamp).toLocaleString()}</p>
                        <p class="text-sm text-gray-600">Status: <span class="capitalize font-bold">${req.status}</span></p>
                        ${req.adminActionTimestamp ? `<p class="text-sm text-gray-600">Admin Action: ${new Date(req.adminActionTimestamp).toLocaleString()}</p>` : ''}
                    `;
                    withdrawalHistoryList.appendChild(div);
                });
            } else {
                withdrawalHistoryList.innerHTML = '<p class="text-gray-500 text-center">No withdrawal history yet.</p>';
            }
        });
    }

    // --- Ad Functionality ---
    async function showRewardedAd(adZoneName) {
        if (!currentUserId) {
            alert("Please sign in to watch ads.");
            return;
        }

        const userData = (await database.ref(`users/${currentUserId}`).once('value')).val();
        if (userData.lastCooldownEnd > Date.now() || userData.adClicks >= DAILY_AD_LIMIT) {
            alert("You are on cooldown or reached daily ad limit. Please try again later.");
            return;
        }

        if (isAdPlaying) return; // Prevent multiple ad clicks

        premiumAds1Btn.disabled = true;
        turboAds2Btn.disabled = true;
        isAdPlaying = true;
        cooldownMessageEl.textContent = "Loading ad...";
        cooldownMessageEl.classList.remove('hidden');

        // --- AdTerra SDK Call ---
        // The SDK defines `show_10555663` and `show_10555746` globally.
        if (window[adZoneName]) {
            window[adZoneName]().then(() => {
                console.log('Ad finished successfully!');
                adCompleteSound.play().catch(e => console.error("Sound play failed:", e)); // Play sound
                showAdCompletionUI();
            }).catch((error) => {
                console.error('Ad failed or was not completed:', error);
                alert('Ad was not completed or an error occurred. Please try again.');
                resetAdButtons();
            });
        } else {
            console.error(`Ad SDK function for ${adZoneName} not found.`);
            alert('Ad SDK not loaded properly. Please refresh the page.');
            resetAdButtons();
        }
    }

    function showAdCompletionUI() {
        adCompletionSection.classList.remove('hidden');
        claimRewardBtn.classList.add('hidden'); // Hide claim button initially
        countdownEl.textContent = AD_VIEW_DURATION; // Reset countdown
        cooldownMessageEl.classList.add('hidden');

        let timeLeft = AD_VIEW_DURATION;
        countdownInterval = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                adTimerEl.textContent = "Time's up! Claim your reward!";
                claimRewardBtn.classList.remove('hidden');
            }
        }, 1000);
    }

    function resetAdButtons() {
        premiumAds1Btn.disabled = false;
        turboAds2Btn.disabled = false;
        isAdPlaying = false;
        cooldownMessageEl.classList.add('hidden');
        adCompletionSection.classList.add('hidden');
        clearInterval(countdownInterval);
    }

    async function claimReward() {
        if (!currentUserId) return;

        claimRewardBtn.disabled = true; // Prevent double claims

        // !!! IMPORTANT: In a real app, this logic MUST be on your server (Firebase Cloud Function)
        // to prevent client-side manipulation of rewards and cooldowns.
        // This is a client-side simulation only.

        try {
            const userRef = database.ref(`users/${currentUserId}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (!userData) {
                alert("User data not found.");
                return;
            }

            const now = Date.now();
            if (userData.lastCooldownEnd > now || userData.adClicks >= DAILY_AD_LIMIT) {
                alert("You are on cooldown or reached daily ad limit. Reward cannot be claimed.");
                return;
            }

            const newBalance = userData.balance + REWARD_AMOUNT;
            const newAdClicks = userData.adClicks + 1;

            let newLastCooldownEnd = userData.lastCooldownEnd;
            if (newAdClicks % DAILY_AD_LIMIT === 0) { // If 3000 ads clicked
                newLastCooldownEnd = now + (COOLDOWN_HOURS * 60 * 60 * 1000); // 1-hour cooldown
            }

            await userRef.update({
                balance: newBalance,
                adClicks: newAdClicks,
                lastAdClickTimestamp: now,
                lastCooldownEnd: newLastCooldownEnd
            });

            // Pop-up congratulations and quote
            const randomQuote = rewardQuotes[Math.floor(Math.random() * rewardQuotes.length)];
            alert(`Congratulations! You earned $${REWARD_AMOUNT.toFixed(5)} USDT!\n\n${randomQuote}\n\nKeep inviting for more rewards!`);

        } catch (error) {
            console.error("Error claiming reward:", error);
            alert("Failed to claim reward. Please try again.");
        } finally {
            resetAdButtons();
            claimRewardBtn.disabled = false;
            displayRandomQuote(); // Update quote after claiming
        }
    }

    // --- In-App Ads on Load ---
    function initializeInAppAds() {
        // Provided In-App Interstitial config by user
        if (window.show_10555746) {
            console.log('Initializing in-app interstitial...');
            window.show_10555746({
                type: 'inApp',
                inAppSettings: {
                    frequency: 2,
                    capping: 0.1, // 0.1 hours = 6 minutes
                    interval: 30, // 30 seconds
                    timeout: 5, // 5 seconds delay before first show
                    everyPage: false
                }
            }).then(() => {
                console.log('In-app ad shown.');
            }).catch(err => {
                console.warn('In-app ad not shown or error:', err);
            });
        } else {
            console.warn('AdTerra SDK (show_10555746) not loaded for in-app ads.');
        }
    }

    // --- Withdrawal Section Functions ---
    async function requestWithdrawal(event) {
        event.preventDefault();
        if (!currentUserId) {
            withdrawStatusEl.textContent = 'Please sign in to request withdrawals.';
            withdrawStatusEl.className = 'mt-4 text-red-500 text-center';
            return;
        }

        const amount = parseFloat(withdrawAmountInput.value);
        const method = withdrawMethodSelect.value;
        const contact = contactInfoInput.value.trim();
        const MIN_WITHDRAWAL = 0.02;

        if (amount < MIN_WITHDRAWAL) {
            withdrawStatusEl.textContent = `Minimum withdrawal amount is $${MIN_WITHDRAWAL} USDT.`;
            withdrawStatusEl.className = 'mt-4 text-red-500 text-center';
            return;
        }
        if (!method || !contact) {
            withdrawStatusEl.textContent = 'Please fill all withdrawal details.';
            withdrawStatusEl.className = 'mt-4 text-red-500 text-center';
            return;
        }

        const userRef = database.ref(`users/${currentUserId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData.balance < amount) {
            withdrawStatusEl.textContent = 'Insufficient balance.';
            withdrawStatusEl.className = 'mt-4 text-red-500 text-center';
            return;
        }

        // !!! IMPORTANT: In a real app, this would deduct balance and create request on server-side
        // after server-side validation. This is a client-side simulation.
        try {
            const newBalance = userData.balance - amount;
            await userRef.update({ balance: newBalance });

            const withdrawalRequest = {
                userId: currentUserId,
                telegramUsername: userData.telegramUsername,
                amount: amount,
                method: method,
                contactInfo: contact,
                status: 'pending',
                requestTimestamp: firebase.database.ServerValue.TIMESTAMP
            };
            await database.ref('withdrawals').push(withdrawalRequest);

            withdrawStatusEl.textContent = 'Withdrawal request submitted successfully! Pending admin approval.';
            withdrawStatusEl.className = 'mt-4 text-green-500 text-center';
            withdrawalForm.reset();
        } catch (error) {
            console.error("Error submitting withdrawal:", error);
            withdrawStatusEl.textContent = 'Failed to submit withdrawal request.';
            withdrawStatusEl.className = 'mt-4 text-red-500 text-center';
        }
    }

    // --- Admin Panel Functions ---
    async function adminLogin() {
        const password = adminPasswordInput.value;
        if (password === ADMIN_PASSWORD) {
            adminLoginStatus.textContent = '';
            adminLoginBtn.classList.add('hidden');
            adminPasswordInput.classList.add('hidden');
            adminContent.classList.remove('hidden');
            loadAdminData();
            alert("Admin login successful. Remember: this is a client-side demo password. A real app requires Firebase Auth for admins.");
        } else {
            adminLoginStatus.textContent = 'Incorrect password.';
        }
    }

    function loadAdminData() {
        // Total Registered Users and Income
        database.ref('users').on('value', snapshot => {
            const users = snapshot.val();
            let totalUsers = 0;
            let totalIncome = 0;
            allUsersList.innerHTML = '';
            if (users) {
                totalUsers = Object.keys(users).length;
                Object.values(users).forEach(user => {
                    totalIncome += user.balance || 0;

                    const userDiv = document.createElement('div');
                    userDiv.className = 'user-item flex justify-between items-center';
                    userDiv.innerHTML = `
                        <div>
                            <p class="font-semibold text-lg">@${user.telegramUsername}</p>
                            <p class="text-sm text-gray-600">Balance: $${(user.balance || 0).toFixed(5)} USDT</p>
                            <p class="text-sm text-gray-600">Total Ads: ${user.adClicks || 0}</p>
                        </div>
                        <div>
                            <button class="ban-user-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 ${user.isBanned ? 'bg-gray-400 cursor-not-allowed' : ''}" data-uid="${user.telegramUsername}" ${user.isBanned ? 'disabled' : ''}>${user.isBanned ? 'Banned' : 'Ban'}</button>
                        </div>
                    `;
                    allUsersList.appendChild(userDiv);
                });

                // Add ban functionality to buttons (event delegation)
                allUsersList.querySelectorAll('.ban-user-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const targetUsername = e.target.dataset.uid;
                        const userKey = Object.keys(users).find(key => users[key].telegramUsername === targetUsername);
                        if (userKey && confirm(`Are you sure you want to ban @${targetUsername}?`)) {
                            await database.ref(`users/${userKey}`).update({ isBanned: true });
                            alert(`User @${targetUsername} has been banned.`);
                        }
                    });
                });
            } else {
                allUsersList.innerHTML = '<p class="text-gray-500 text-center">No users registered yet.</p>';
            }
            totalRegisteredUsersEl.textContent = totalUsers;
        });

        // Online Users
        database.ref('onlineUsers').on('value', snapshot => {
            const onlineUsers = snapshot.val();
            let count = 0;
            if (onlineUsers) {
                const now = Date.now();
                // Consider user online if last seen within the last 45 seconds (allowing for 30s update interval)
                Object.values(onlineUsers).forEach(user => {
                    if (now - user.lastSeen < 45000) {
                        count++;
                    }
                });
            }
            onlineUsersCountEl.textContent = count;
        });


        // Pending Withdrawals
        database.ref('withdrawals').orderByChild('status').equalTo('pending').on('value', snapshot => {
            const pendingReqs = snapshot.val();
            pendingWithdrawalsList.innerHTML = '';
            if (pendingReqs) {
                Object.keys(pendingReqs).forEach(key => {
                    const req = pendingReqs[key];
                    const div = document.createElement('div');
                    div.className = 'withdrawal-item pending p-3 rounded-md shadow-sm mb-2';
                    div.innerHTML = `
                        <p class="font-semibold text-lg">Amount: $${req.amount.toFixed(2)} USDT</p>
                        <p class="text-sm text-gray-700">User: @${req.telegramUsername} (ID: ${req.userId})</p>
                        <p class="text-sm text-gray-700">Method: ${req.method} | Contact: ${req.contactInfo}</p>
                        <p class="text-sm text-gray-600">Requested: ${new Date(req.requestTimestamp).toLocaleString()}</p>
                        <div class="mt-2 space-x-2">
                            <button class="approve-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600" data-key="${key}" data-uid="${req.userId}" data-amount="${req.amount}">Approve</button>
                            <button class="deny-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600" data-key="${key}">Deny</button>
                        </div>
                    `;
                    pendingWithdrawalsList.appendChild(div);
                });

                // Add event listeners for approve/deny buttons (event delegation for dynamic content)
                pendingWithdrawalsList.querySelectorAll('.approve-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const key = e.target.dataset.key;
                        const uid = e.target.dataset.uid;
                        const amount = parseFloat(e.target.dataset.amount);

                        // !!! IMPORTANT: In a real app, fund transfer and balance deduction for actual payouts
                        // would happen server-side, and then the withdrawal status updated.
                        // This demo only updates the status.
                        if (confirm(`Approve withdrawal for $${amount} from user ${uid}?`)) {
                             try {
                                // No actual balance deduction here as it was already deducted on user side
                                // Admin just marks it as approved
                                await database.ref(`withdrawals/${key}`).update({
                                    status: 'approved',
                                    adminActionTimestamp: firebase.database.ServerValue.TIMESTAMP
                                });
                                alert('Withdrawal approved!');
                            } catch (error) {
                                console.error("Error approving withdrawal:", error);
                                alert("Failed to approve withdrawal.");
                            }
                        }
                    });
                });

                pendingWithdrawalsList.querySelectorAll('.deny-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const key = e.target.dataset.key;
                        if (confirm('Deny this withdrawal request?')) {
                            // If denied, we should return the amount to the user's balance
                            // This part is crucial and should be server-side protected
                            const req = pendingReqs[key];
                            try {
                                const userRef = database.ref(`users/${req.userId}`);
                                const userSnap = await userRef.once('value');
                                const userData = userSnap.val();
                                if (userData) {
                                    await userRef.update({ balance: userData.balance + req.amount });
                                }
                                await database.ref(`withdrawals/${key}`).update({
                                    status: 'denied',
                                    adminActionTimestamp: firebase.database.ServerValue.TIMESTAMP
                                });
                                alert('Withdrawal denied and amount returned to user balance.');
                            } catch (error) {
                                console.error("Error denying withdrawal:", error);
                                alert("Failed to deny withdrawal.");
                            }
                        }
                    });
                });

            } else {
                pendingWithdrawalsList.innerHTML = '<p class="text-gray-500 text-center">No pending requests.</p>';
            }
        });
    }

    // --- Theming Functions ---
    function applyTheme(themeName) {
        document.body.className = ''; // Clear existing themes
        document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem('userTheme', themeName);
        currentTheme = themeName; // Update currentTheme variable
        // Update selected state in modal
        themeColorOptions.forEach(btn => {
            if (btn.dataset.color === themeName) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        // Update Firebase if user is logged in
        if (currentUserId) {
            database.ref(`users/${currentUserId}/theme`).set(themeName).catch(e => console.error("Failed to save theme:", e));
        }
    }

    // --- Utility Functions ---
    function formatTimeLeft(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        let timeString = '';
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;
        return timeString.trim();
    }

    function displayRandomQuote() {
        quoteDisplayEl.textContent = rewardQuotes[Math.floor(Math.random() * rewardQuotes.length)];
    }

    function updateDateTime() {
        const now = new Date();
        currentDateTimeEl.textContent = now.toLocaleString();
    }

    function switchSection(sectionId) {
        appSections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active-section');
        });
        document.getElementById(sectionId).classList.remove('hidden');
        document.getElementById(sectionId).classList.add('active-section');

        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.nav-btn[data-section="${sectionId}"]`).classList.add('active');
    }

    // --- Event Listeners ---
    premiumAds1Btn.addEventListener('click', () => showRewardedAd('show_10555663'));
    turboAds2Btn.addEventListener('click', () => showRewardedAd('show_10555746'));
    claimRewardBtn.addEventListener('click', claimReward);
    withdrawalForm.addEventListener('submit', requestWithdrawal);
    adminLoginBtn.addEventListener('click', adminLogin);
    themePickerBtn.addEventListener('click', () => themeModal.classList.remove('hidden'));
    closeThemeModalBtn.addEventListener('click', () => themeModal.classList.add('hidden'));

    themeColorOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.color);
        });
    });

    navButtons.forEach(button => {
        button.addEventListener('click', () => switchSection(button.dataset.section));
    });

    // --- Initialization ---
    updateDateTime();
    setInterval(updateDateTime, 1000); // Update footer date/time every second
    displayRandomQuote(); // Display initial random quote
    initializeInAppAds(); // Trigger in-app ads as per SDK configuration

    // Set initial theme
    document.body.classList.add(`theme-${currentTheme}`);
    themeColorOptions.forEach(btn => {
        if (btn.dataset.color === currentTheme) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Set initial section
    switchSection('home');
});
