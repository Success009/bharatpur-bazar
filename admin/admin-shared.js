// Shared Admin Logic and Configuration

const firebaseConfig = {
    apiKey: "AIzaSyDlnzH1D7D7Q663eWE086ng_1KdP46MZEs",
    authDomain: "deep-freehold-389006.firebaseapp.com",
    databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
    projectId: "deep-freehold-389006",
    storageBucket: "deep-freehold-389006.appspot.com",
    messagingSenderId: "76562961838",
    appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f",
    measurementId: "G-VZC36FJC24"
};

// Initialize Firebase if not already initialized by the page
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

function signOut() {
    if (confirm("Are you sure you want to log out?")) {
        auth.signOut();
    }
}

// Unified Admin Authentication Check
function initAdminAuth(onSuccess) {
    auth.onAuthStateChanged(user => {
        if (user && !user.isAnonymous) {
            const adminRef = firebase.database().ref('admins/' + user.uid);
            adminRef.once('value', snapshot => {
                if (snapshot.exists() && snapshot.val() === true) {
                    console.log("Admin access granted.");
                    if (typeof onSuccess === 'function') onSuccess();
                } else {
                    console.warn("Access Denied: User is not a verified admin.");
                    auth.signOut();
                }
            });
        } else {
            if (user && user.isAnonymous) {
                auth.signOut();
                return;
            }
            const password = prompt("Admin Access Required. Please enter the password:");
            if (password) {
                const email = "bharatpurbazar@gmail.com";
                auth.signInWithEmailAndPassword(email, password)
                    .catch(error => {
                        console.error("Login failed:", error.message);
                        alert(`Login Failed: Incorrect password or user not found.`);
                        window.location.reload();
                    });
            } else {
                document.body.innerHTML = '<div style="text-align:center; margin-top:50px;"><h1>Login Canceled</h1><p>Please refresh the page to try again.</p></div>';
            }
        }
    });
}

// Unified Header Injection
function injectAdminHeader(title) {
    const headerHTML = `
        <header class="admin-header">
            <h1>${title}</h1>
            <div class="header-nav">
                <button class="nav-btn" onclick="window.location.href='StaffMenu.html'"><i class="fas fa-utensils"></i> Menu</button>
                <button class="nav-btn" onclick="window.location.href='StaffOrder.html'"><i class="fas fa-clipboard-list"></i> Orders</button>
                <button class="nav-btn" onclick="window.location.href='StaffChat.html'"><i class="fas fa-comments"></i> Chat</button>
                <button class="nav-btn" onclick="window.location.href='StaffUplode.html'"><i class="fas fa-image"></i> Images</button>
                <button class="nav-btn logout-btn" onclick="signOut()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </header>
    `;
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
}