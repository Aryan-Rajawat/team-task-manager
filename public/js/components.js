// ===== Reusable UI Components =====

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.classList.remove('hidden');
  overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };
}

function hideModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function renderLoading() {
  return '<div class="loading-page"><div class="spinner"></div></div>';
}

function renderEmptyState(icon, title, desc, btnText, btnAction) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${desc}</p>
    ${btnText ? `<button class="btn btn-primary" onclick="${btnAction}">${btnText}</button>` : ''}
  </div>`;
}
