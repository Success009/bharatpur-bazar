(function() {
    // Unique local config name to avoid any chance of collision with global scope
    const _internalAuthConfig = {
        apiKey: "AIzaSyDlnzH1D7D7Q663eWE086ng_1KdP46MZEs",
        authDomain: "deep-freehold-389006.firebaseapp.com",
        databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
        projectId: "deep-freehold-389006",
        storageBucket: "deep-freehold-389006.appspot.com",
        messagingSenderId: "76562961838",
        appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f"
    };

    // Initialize Firebase only if no app exists yet
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(_internalAuthConfig);
    }
    
    const auth = firebase.auth();

    // Export logout function to global window so HTML onclick can see it
    window.logout = function() {
        auth.signOut().then(() => {
            window.location.replace('index.html');
        }).catch(err => console.error("Logout error:", err));
    };

    // Global guard for all admin pages
    auth.onAuthStateChanged(user => {
        const isLogin = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/');
        
        if (user) {
            if (isLogin) window.location.replace('Dashboard.html');
        } else {
            if (!isLogin) window.location.replace('index.html');
        }
    });

    // Handle the Login Form specifically for index.html
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-message');
            const btn = document.querySelector('.btn-login');

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            btn.disabled = true;
            if(errorMsg) errorMsg.style.display = 'none';

            auth.signInWithEmailAndPassword(email, password)
                .catch(err => {
                    if(errorMsg) {
                        errorMsg.textContent = err.message;
                        errorMsg.style.display = 'block';
                    }
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Secure Sign-In';
                    btn.disabled = false;
                });
        });
    }
})();