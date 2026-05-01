// ===== Auth Page =====

function renderAuthPage() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px;">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="10" height="10" rx="3" fill="#06b6d4"/><rect x="16" y="2" width="10" height="10" rx="3" fill="#8b5cf6" opacity="0.7"/><rect x="2" y="16" width="10" height="10" rx="3" fill="#8b5cf6" opacity="0.7"/><rect x="16" y="16" width="10" height="10" rx="3" fill="#06b6d4"/></svg>
          </div>
          <h1>Welcome to TeamFlow</h1>
          <p>Manage projects and tasks with your team</p>
        </div>
        <div class="auth-tabs">
          <button class="auth-tab active" id="loginTab" onclick="switchAuthTab('login')">Sign In</button>
          <button class="auth-tab" id="signupTab" onclick="switchAuthTab('signup')">Sign Up</button>
        </div>
        <div id="authFormContainer">
          ${renderLoginForm()}
        </div>
      </div>
    </div>
  `;
}

function switchAuthTab(tab) {
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  const container = document.getElementById('authFormContainer');
  container.style.opacity = '0';
  setTimeout(() => {
    container.innerHTML = tab === 'login' ? renderLoginForm() : renderSignupForm();
    container.style.opacity = '1';
  }, 150);
}

function renderLoginForm() {
  return `
    <form id="loginForm" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label class="form-label" for="loginEmail">Email</label>
        <input class="form-input" type="email" id="loginEmail" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="loginPassword">Password</label>
        <input class="form-input" type="password" id="loginPassword" placeholder="••••••••" required>
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="loginBtn">Sign In</button>
    </form>
  `;
}

function renderSignupForm() {
  return `
    <form id="signupForm" onsubmit="handleSignup(event)">
      <div class="form-group">
        <label class="form-label" for="signupName">Full Name</label>
        <input class="form-input" type="text" id="signupName" placeholder="John Doe" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="signupEmail">Email</label>
        <input class="form-input" type="email" id="signupEmail" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="signupPassword">Password</label>
        <input class="form-input" type="password" id="signupPassword" placeholder="Min 6 characters" required minlength="6">
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="signupBtn">Create Account</button>
    </form>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const data = await api.login({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value,
    });
    setToken(data.token); setUser(data.user);
    showToast('Welcome back, ' + data.user.name + '!', 'success');
    window.location.hash = '#/dashboard';
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signupBtn');
  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const data = await api.signup({
      name: document.getElementById('signupName').value,
      email: document.getElementById('signupEmail').value,
      password: document.getElementById('signupPassword').value,
    });
    setToken(data.token); setUser(data.user);
    showToast('Account created! Welcome, ' + data.user.name + '!', 'success');
    window.location.hash = '#/dashboard';
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}
