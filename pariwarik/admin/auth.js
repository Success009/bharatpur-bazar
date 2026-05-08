(function() {
    // This IIFE prevents global variable pollution and "already declared" errors
    const config = {
        apiKey: "AIzaSyDlnzH1D7D7Q663eWE086ng_1KdP46MZEs",
        authDomain: "deep-freehold-389006.firebaseapp.com",
        databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
        projectId: "deep-freehold-389006",
        storageBucket: "deep-freehold-389006.appspot.com",
        messagingSenderId: "76562961838",
        appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f"
    };

    // Initialize Firebase only if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }
    
    const auth = firebase.auth();

    // Define logout globally so it can be called from HTML onclick
    window.logout = function() {
        auth.signOut().then(() => {
            window.location.replace('index.html');
        }).catch(err => console.error("Logout Error:", err));
    };

    // Handle authentication state changes
    auth.onAuthStateChanged(user => {
        const path = window.location.pathname;
        const isLoginPage = path.endsWith('index.html') || path.endsWith('/admin/');
        
        if (user) {
            if (isLoginPage) {
                window.location.replace('Dashboard.html');
            }
        } else {
            if (!isLoginPage) {
                window.location.replace('index.html');
            }
        }
    });

    // Handle login form submission
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
                .catch(error => {
                    errorMsg.textContent = error.message;
                    errorMsg.style.display = 'block';
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Secure Sign-In';
                    loginBtn.disabled = false;
                });
        });
    }
})();
    