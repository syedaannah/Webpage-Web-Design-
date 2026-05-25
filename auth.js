// ===== TAB SWITCHING =====
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

// ===== AUTH ACTIONS =====
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const btn = document.querySelector('#loginForm .btn-auth');

    if (!email || !pass) return alert('Please enter email and password');

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('userSessionEmail', data.email);
            localStorage.setItem('userSessionRole', data.role || 'customer');
            // If the name wasn't already set during registration, default to email prefix
            if (!localStorage.getItem('userName')) {
                localStorage.setItem('userName', data.email.split('@')[0]);
            }
            window.location.href = data.role === 'admin' ? '/admin.html' : '/orders.html';
        } else {
            alert(data.message || 'Login failed');
            btn.textContent = 'Login to Account ✦';
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        btn.textContent = 'Login to Account ✦';
        btn.disabled = false;
    }
}

async function handleRegister() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const btn = document.querySelector('#registerForm .btn-auth');

    if (!firstName || !lastName || !email || !pass) return alert('Please fill all fields');

    const fullName = `${firstName} ${lastName}`;
    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, name: fullName })
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('userName', fullName);
            alert('Account created! Please log in.');
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPass').value = pass;
            switchTab('login');
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
    } finally {
        btn.textContent = 'Create Account ✦';
        btn.disabled = false;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/auth.html';
}