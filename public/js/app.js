// ===== App Router =====

function navigate() {
  const hash = window.location.hash || '#/auth';
  const navbar = document.getElementById('navbar');

  if (!isLoggedIn()) {
    navbar.classList.add('hidden');
    if (hash !== '#/auth') { window.location.hash = '#/auth'; return; }
    renderAuthPage();
    return;
  }

  navbar.classList.remove('hidden');
  renderNav();

  if (hash === '#/auth') { window.location.hash = '#/dashboard'; return; }

  // Route matching
  if (hash === '#/dashboard') {
    setActiveNav('dashboard');
    renderDashboardPage();
  } else if (hash === '#/projects') {
    setActiveNav('projects');
    renderProjectsPage();
  } else if (hash.startsWith('#/project/')) {
    setActiveNav('projects');
    const projectId = hash.split('#/project/')[1];
    renderProjectDetailPage(projectId);
  } else {
    window.location.hash = '#/dashboard';
  }
}

function renderNav() {
  const user = getUser();
  document.getElementById('navLinks').innerHTML = `
    <button class="nav-link" data-nav="dashboard" onclick="window.location.hash='#/dashboard'">Dashboard</button>
    <button class="nav-link" data-nav="projects" onclick="window.location.hash='#/projects'">Projects</button>
  `;
  document.getElementById('navUser').innerHTML = `
    <div class="user-avatar">${getInitials(user ? user.name : '')}</div>
    <button class="btn-logout" onclick="handleLogout()">Sign Out</button>
  `;
}

function setActiveNav(name) {
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === name);
  });
}

function handleLogout() {
  removeToken();
  removeUser();
  showToast('Signed out successfully', 'info');
  window.location.hash = '#/auth';
}

// Initialize
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
