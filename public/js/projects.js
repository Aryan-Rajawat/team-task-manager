// ===== Projects List Page =====

async function renderProjectsPage() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="page">${renderLoading()}</div>`;

  try {
    const projects = await api.getProjects();
    content.innerHTML = `
      <div class="page">
        <div class="projects-header">
          <div>
            <h1>Projects</h1>
            <p style="color:var(--text-secondary);">${projects.length} project${projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-primary" onclick="showCreateProjectModal()">
            <span>+</span> New Project
          </button>
        </div>
        ${projects.length === 0
          ? renderEmptyState('📂', 'No projects yet', 'Create your first project to start managing tasks with your team.', '+ Create Project', 'showCreateProjectModal()')
          : `<div class="projects-grid">${projects.map(p => renderProjectCard(p)).join('')}</div>`
        }
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="page"><p style="color:var(--accent-red);">Failed to load projects: ${err.message}</p></div>`;
  }
}

function renderProjectCard(p) {
  const total = parseInt(p.task_count) || 0;
  const done = parseInt(p.done_count) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return `
    <div class="project-card" onclick="window.location.hash='#/project/${p.id}'">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span class="role-badge ${p.role}">${p.role}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">${formatDate(p.created_at)}</span>
      </div>
      <h3>${escHtml(p.name)}</h3>
      <p>${p.description ? escHtml(p.description) : '<em style="color:var(--text-muted)">No description</em>'}</p>
      <div class="project-meta">
        <div class="project-meta-item">📋 ${total} task${total !== 1 ? 's' : ''}</div>
        <div class="project-meta-item">👥 ${p.member_count} member${parseInt(p.member_count) !== 1 ? 's' : ''}</div>
        <div class="project-meta-item" style="color:var(--accent-green);">${pct}% done</div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function showCreateProjectModal() {
  showModal(`
    <h2>Create New Project</h2>
    <form id="createProjectForm" onsubmit="handleCreateProject(event)">
      <div class="form-group">
        <label class="form-label" for="projectName">Project Name</label>
        <input class="form-input" type="text" id="projectName" placeholder="e.g. Marketing Campaign" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="projectDesc">Description</label>
        <textarea class="form-input" id="projectDesc" rows="3" placeholder="Describe your project..." style="resize:vertical;"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" type="button" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" type="submit" id="createProjectBtn">Create Project</button>
      </div>
    </form>
  `);
}

async function handleCreateProject(e) {
  e.preventDefault();
  const btn = document.getElementById('createProjectBtn');
  btn.disabled = true; btn.textContent = 'Creating...';
  try {
    await api.createProject({
      name: document.getElementById('projectName').value,
      description: document.getElementById('projectDesc').value,
    });
    hideModal();
    showToast('Project created!', 'success');
    renderProjectsPage();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Create Project';
  }
}
