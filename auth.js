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

if (document.getElementById('tabLogin')) {
    document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
}
if (document.getElementById('tabRegister')) {
    document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));
}

// ===== PASSWORD TOGGLE =====
function togglePass(id, el) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
    el.textContent = input.type === 'password' ? '👁' : '🙈';
  }
}

// ===== PASSWORD STRENGTH =====
const regPass = document.getElementById('regPass');
if (regPass) {
  regPass.addEventListener('input', () => {
    const val = regPass.value;
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    let strength = 0;
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#f87171', '#fbbf24', '#34d399', '#10b981'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];

    if (fill && label) {
      fill.style.width = widths[strength];
      fill.style.background = colors[strength];
      label.textContent = val ? levels[strength] : '';
      label.style.color = colors[strength];
    }
  });
}

// ===== LOGIN WITH PROPER SESSION STORAGE =====
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const btn = document.querySelector('#loginForm .btn-auth');

  if (!email || !pass) {
    alert('Please enter email and password');
    return;
  }

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
        // FIXED: Set localStorage IMMEDIATELY and EXPLICITLY
        console.log('✓ Setting session for:', data.email);
        
        localStorage.setItem('userSessionRole', data.role || 'customer');
        localStorage.setItem('userSessionEmail', data.email);
        
        // If user has a saved name, use it. Otherwise use email
        const savedName = localStorage.getItem('userName');
        if (!savedName) {
            localStorage.setItem('userName', data.email.split('@')[0]);
        }
        
        // Verify it was set
        const savedEmail = localStorage.getItem('userSessionEmail');
        const savedRole = localStorage.getItem('userSessionRole');
        const savedUserName = localStorage.getItem('userName');
        console.log('✓ Session saved:', { email: savedEmail, role: savedRole, name: savedUserName });
        
        // Wait a moment for localStorage to persist, then redirect
        setTimeout(() => {
            if (data.role === 'admin') {
                console.log('✓ Redirecting to admin.html');
                window.location.href = '/admin.html';
            } else {
                console.log('✓ Redirecting to orders.html');
                window.location.href = '/orders.html';
            }
        }, 300); // 300ms delay ensures localStorage is persisted
        
    } else {
        alert(data.message || 'Login failed');
        btn.textContent = 'Login to Account ✦';
        btn.disabled = false;
    }
  } catch (err) {
      console.error('Login error:', err);
      alert('Server error. Make sure server is running!');
      btn.textContent = 'Login to Account ✦';
      btn.disabled = false;
  }
}

// ===== REGISTER - CAPTURES FULL NAME =====
async function handleRegister() {
  // FIXED: Capture first name and last name from inputs
  const registerForm = document.getElementById('registerForm');
  const firstNameInput = registerForm.querySelector('input[placeholder="Aisha"]');
  const lastNameInput = registerForm.querySelector('input[placeholder="Khan"]');
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value.trim();
  const btn = document.querySelector('#registerForm .btn-auth');

  // Get name values
  const firstName = firstNameInput?.value.trim() || '';
  const lastName = lastNameInput?.value.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Validate fields
  if (!firstName) {
    alert('Please enter your first name');
    firstNameInput?.focus();
    return;
  }
  
  if (!lastName) {
    alert('Please enter your last name');
    lastNameInput?.focus();
    return;
  }
  
  if (!email) {
    alert('Please enter email');
    return;
  }
  
  if (!pass) {
    alert('Please enter password');
    return;
  }
  
  if (pass.length < 6) {
    alert('Password must be 6+ characters');
    return;
  }

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
          console.log('✓ Account created with name:', fullName);
          alert('Account created! Switching to login...');
          
          // Store the name in localStorage so we can use it on login
          localStorage.setItem('userName', fullName);
          
          // Auto-fill login form
          document.getElementById('loginEmail').value = email;
          document.getElementById('loginPass').value = pass;
          
          // Switch to login tab
          switchTab('login');
          
          // Focus on login button
          document.querySelector('#loginForm .btn-auth').focus();
          
          btn.textContent = 'Create Account ✦';
          btn.disabled = false;
      } else {
          alert(data.message || 'Registration failed');
          btn.textContent = 'Create Account ✦';
          btn.disabled = false;
      }
  } catch (err) {
      console.error('Registration error:', err);
      alert('Server error. Make sure server is running!');
      btn.textContent = 'Create Account ✦';
      btn.disabled = false;
  }
}

// ===== LOGOUT FUNCTION =====
function logout() {
  console.log('Logging out...');
  localStorage.removeItem('userSessionRole');
  localStorage.removeItem('userSessionEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('intendedServiceSelection');
  localStorage.removeItem('selectedTierName');
  localStorage.removeItem('selectedTierCost');
  
  // Make sure we're on login page after clearing localStorage
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 100);
}