// 🔥 REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let points = 0;
let perSecond = 0;
let clickTimes = [];
let flagged = false;

const upgrades = [
  { name: "Liam", cost: 10, power: 1, owned: 0 },
  { name: "OD", cost: 50, power: 5, owned: 0 },
  { name: "Dan", cost: 200, power: 20, owned: 0 },
  { name: "Chud", cost: 1000, power: 100, owned: 0 },
  { name: "Beefus", cost: 5000, power: 500, owned: 0 },
  { name: "Oddizy", cost: 20000, power: 2000, owned: 0 },
  { name: "Chud Beefus", cost: 100000, power: 10000, owned: 0 },
  { name: "Personal Butler", cost: 500000, power: 50000, owned: 0 },
  { name: "Max Chud Beefus", cost: 2000000, power: 200000, owned: 0 }
];

// Elements
const loginDiv = document.getElementById("loginDiv");
const gameDiv = document.getElementById("gameDiv");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const pointsEl = document.getElementById("points");
const ppsEl = document.getElementById("pps");
const btn = document.getElementById("leefusBtn");
const container = document.getElementById("upgradeContainer");
const leaderboardList = document.getElementById("leaderboardList");

// LOGIN
signupBtn.onclick = () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.createUserWithEmailAndPassword(email, pass)
    .catch(e => alert(e.message));
};

loginBtn.onclick = () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.signInWithEmailAndPassword(email, pass)
    .catch(e => alert(e.message));
};

logoutBtn.onclick = () => auth.signOut();

// ON AUTH CHANGE
auth.onAuthStateChanged(user => {
  if (user) {
    loginDiv.style.display = "none";
    gameDiv.style.display = "block";
    userInfo.textContent = user.email;
    loadData();
    loadLeaderboard();
  } else {
    loginDiv.style.display = "block";
    gameDiv.style.display = "none";
  }
});

// CLICKER WITH ANTI-CHEAT
btn.onclick = () => {
  if (flagged) return;
  const now = Date.now();
  clickTimes.push(now);
  clickTimes = clickTimes.filter(t => now - t < 5000);
  const cps = clickTimes.length / 5;
  if (cps > 10) {
    flagged = true;
    alert("Autoclicker detected");
    setTimeout(() => flagged = false, 10000);
    return;
  }
  points++;
  updateUI();
  saveData();
};

// POINTS PER SECOND
setInterval(() => {
  points += perSecond;
  updateUI();
  saveData();
}, 1000);

// UPGRADES
function renderUpgrades() {
  container.innerHTML = "";
  upgrades.forEach((u, i) => {
    const b = document.createElement("button");
    b.textContent = `${u.name} - ${u.cost} (Owned: ${u.owned})`;
    b.onclick = () => buyUpgrade(i);
    container.appendChild(b);
  });
}

function buyUpgrade(i) {
  const u = upgrades[i];
  if (points >= u.cost) {
    points -= u.cost;
    u.owned++;
    perSecond += u.power;
    u.cost = Math.floor(u.cost * 1.5);
    updateUI();
    renderUpgrades();
    saveData();
  }
}

// SAVE / LOAD
function saveData() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("players").doc(user.uid).set({
    points,
    perSecond,
    upgrades
  });
}

function loadData() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection("players").doc(user.uid).get().then(doc => {
    if (doc.exists) {
      points = doc.data().points || 0;
      perSecond = doc.data().perSecond || 0;
      if (doc.data().upgrades) upgrades.forEach((u,i)=>u.owned=doc.data().upgrades[i].owned);
    }
    renderUpgrades();
    updateUI();
  });
}

// LEADERBOARD
function loadLeaderboard() {
  db.collection("players")
    .orderBy("points", "desc")
    .limit(10)
    .onSnapshot(snapshot => {
      leaderboardList.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${doc.data().points} - ${doc.id}`;
        leaderboardList.appendChild(li);
      });
    });
}

// UI UPDATE
function updateUI() {
  pointsEl.textContent = Math.floor(points);
  ppsEl.textContent = perSecond;
}

renderUpgrades();
updateUI();
