const firebaseConfig = {
    apiKey: "AIzaSyDlnzH1D7D7Q663eWE086ng_1KdP46MZEs",
    authDomain: "deep-freehold-389006.firebaseapp.com",
    databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
    projectId: "deep-freehold-389006",
    storageBucket: "deep-freehold-389006.appspot.com",
    messagingSenderId: "76562961838",
    appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- AUTH STATE & PAGE GUARDING ---
auth.onAuthStateChanged(user => {
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if (user && isLoginPage) {
        // If user is logged in and on the login page, redirect to dashboard
        window.location.replace('Dashboard.html');
    } else if (!user && !isLoginPage) {
        // If user is not logged in and not on the login page, redirect to login
        window.location.replace('index.html');
    }
});

// --- LOGIN FORM LOGIC (for index.html) ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');
        const loginBtn = document.querySelector('.btn-login');

        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        loginBtn.disabled = true;
        errorMsg.style.display = 'none';

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // This will trigger the onAuthStateChanged listener, which handles the redirect.
            })
            .catch(error => {
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Secure Sign-In';
                loginBtn.disabled = false;
            });
    });
}

// --- LOGOUT FUNCTIONALITY ---
function logout() {
    auth.signOut().catch(error => {
        console.error("Logout Error:", error);
    });
}
    