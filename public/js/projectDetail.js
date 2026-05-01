// ===== Project Detail Page (Kanban Board) =====

let _projectData = null;
let _projectTasks = [];
let _projectMembers = [];

async function renderProjectDetailPage(projectId) {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="page">${renderLoading()}</div>`;

  try {
    const [project, tasks, members] = await Promise.all([
      api.getProject(projectId),
      api.getTasks(projectId),
      api.getMembers(projectId),
    ]);
    _projectData = project;
    _projectTasks = tasks;
    _projectMembers = members;
    renderProjectUI();
  } catch (err) {
    content.innerHTML = `<div class="page"><p style="color:var(--accent-red);">Failed to load project: ${err.message}</p></div>`;
  }
}

function renderProjectUI() {
  const p = _projectData;
  const isAdmin = p.role === 'admin';
  const content = document.getElementById('content');

  const statuses = [
    { key: 'todo', label: 'To Do', icon: '📋' },
    { key: 'in_progress', label: 'In Progress', icon: '🔄' },
    { key: 'review', label: 'Review', icon: '👀' },
    { key: 'done', label: 'Done', icon: '✅' },
  ];

  content.innerHTML = `
    <div class="page">
      <div class="project-detail-header">
        <div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
            <a href="#/projects" style="color:var(--text-muted);font-size:0.85rem;">← Projects</a>
            <span class="role-badge ${p.role}">${p.role}</span>
          </div>
          <h1>${escHtml(p.name)}</h1>
          ${p.description ? `<p style="color:var(--text-secondary);margin-top:4px;">${escHtml(p.description)}</p>` : ''}
        </div>
        <div class="project-actions">
          ${isAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="showCreateTaskModal()">+ Add Task</button>
            <button class="btn btn-secondary btn-sm" onclick="showAddMemberModal()">+ Add Member</button>
            <button class="btn btn-secondary btn-sm" onclick="showEditProjectModal()">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteProject()">🗑️</button>
          ` : ''}
        </div>
      </div>

      <div class="kanban-board" id="kanbanBoard">
        ${statuses.map(s => {
          const tasks = _projectTasks.filter(t => t.status === s.key);
          return `
            <div class="kanban-column" data-status="${s.key}"
              ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${s.key}')"
              ondragenter="event.currentTarget.classList.add('drag-over')"
              ondragleave="handleDragLeave(event)">
              <div class="kanban-column-header">
                <span class="kanban-column-title">${s.icon} ${s.label}</span>
                <span class="kanban-count">${tasks.length}</span>
              </div>
              <div class="kanban-cards" data-status="${s.key}">
                ${tasks.map(t => renderKanbanCard(t, isAdmin)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="members-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <h3>👥 Team Members (${_projectMembers.length})</h3>
        </div>
        <div class="members-list">
          ${_projectMembers.map(m => `
            <div class="member-item">
              <div class="user-avatar">${getInitials(m.name)}</div>
              <div class="member-info">
                <div class="name">${escHtml(m.name)}</div>
                <div class="email">${escHtml(m.email)}</div>
              </div>
              <span class="role-badge ${m.role}">${m.role}</span>
              ${isAdmin && m.user_id !== getUser().id ? `
                <div class="member-actions">
                  <select class="form-input" style="width:auto;padding:4px 8px;font-size:0.75rem;" onchange="handleRoleChange('${m.id}', this.value)">
                    <option value="member" ${m.role==='member'?'selected':''}>Member</option>
                    <option value="admin" ${m.role==='admin'?'selected':''}>Admin</option>
                  </select>
                  <button class="btn btn-danger btn-sm" style="padding:4px 10px;" onclick="handleRemoveMember('${m.id}')">✕</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderKanbanCard(t, isAdmin) {
  const dueClass = t.due_date && isOverdue(t.due_date) && t.status !== 'done' ? 'overdue' : '';
  return `
    <div class="kanban-card" draggable="true" data-task-id="${t.id}"
      ondragstart="handleDragStart(event, '${t.id}')" ondragend="handleDragEnd(event)"
      onclick="showTaskDetailModal('${t.id}')">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span class="priority-dot ${t.priority}"></span>
        <span class="priority-badge ${t.priority}">${t.priority}</span>
      </div>
      <div class="kanban-card-title">${escHtml(t.title)}</div>
      ${t.description ? `<div class="kanban-card-desc">${escHtml(t.description)}</div>` : ''}
      <div class="kanban-card-footer">
        <div class="kanban-card-assignee">
          ${t.assigned_name
            ? `<div class="mini-avatar">${getInitials(t.assigned_name)}</div><span>${escHtml(t.assigned_name)}</span>`
            : '<span style="color:var(--text-muted);">Unassigned</span>'}
        </div>
        ${t.due_date ? `<div class="kanban-card-due ${dueClass}">${formatDate(t.due_date)}</div>` : ''}
      </div>
    </div>
  `;
}

// ===== Drag & Drop =====
let _draggedTaskId = null;

function handleDragStart(e, taskId) {
  _draggedTaskId = taskId;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
}

function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

async function handleDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!_draggedTaskId) return;
  const task = _projectTasks.find(t => t.id === _draggedTaskId);
  if (!task || task.status === newStatus) return;

  try {
    await api.updateTask(_draggedTaskId, { status: newStatus });
    task.status = newStatus;
    renderProjectUI();
    showToast('Task moved to ' + newStatus.replace('_', ' '), 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
  _draggedTaskId = null;
}

// ===== Task Modals =====
function showCreateTaskModal() {
  showModal(`
    <h2>Create New Task</h2>
    <form id="createTaskForm" onsubmit="handleCreateTask(event)">
      <div class="form-group">
        <label class="form-label">Title</label>
        <input class="form-input" type="text" id="taskTitle" required placeholder="Task title">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="taskDesc" rows="3" placeholder="Task description" style="resize:vertical;"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-input" id="taskPriority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-input" id="taskStatus">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <select class="form-input" id="taskAssign">
            <option value="">Unassigned</option>
            ${_projectMembers.map(m => `<option value="${m.user_id}">${escHtml(m.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input class="form-input" type="date" id="taskDue">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" type="button" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" type="submit" id="createTaskBtn">Create Task</button>
      </div>
    </form>
  `);
}

async function handleCreateTask(e) {
  e.preventDefault();
  const btn = document.getElementById('createTaskBtn');
  btn.disabled = true; btn.textContent = 'Creating...';
  try {
    const task = await api.createTask(_projectData.id, {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDesc').value,
      priority: document.getElementById('taskPriority').value,
      status: document.getElementById('taskStatus').value,
      assigned_to: document.getElementById('taskAssign').value || null,
      due_date: document.getElementById('taskDue').value || null,
    });
    _projectTasks.push(task);
    hideModal();
    renderProjectUI();
    showToast('Task created!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Create Task';
  }
}

function showTaskDetailModal(taskId) {
  const t = _projectTasks.find(x => x.id === taskId);
  if (!t) return;
  const isAdmin = _projectData.role === 'admin';
  const user = getUser();
  const canEdit = isAdmin || t.assigned_to === user.id;

  showModal(`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem;">
      <span class="priority-badge ${t.priority}">${t.priority}</span>
      <span class="status-badge ${t.status}">${t.status.replace('_',' ')}</span>
    </div>
    <h2 style="margin-bottom:0.5rem;">${escHtml(t.title)}</h2>
    ${t.description ? `<p style="color:var(--text-secondary);margin-bottom:1rem;">${escHtml(t.description)}</p>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
      <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Assigned To</span>${t.assigned_name || 'Unassigned'}</div>
      <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Due Date</span>${t.due_date ? formatDate(t.due_date) : 'No due date'}</div>
      <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Created By</span>${t.creator_name || 'Unknown'}</div>
      <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Updated</span>${formatDate(t.updated_at)}</div>
    </div>
    ${canEdit ? `
      <hr style="border-color:var(--border);margin:1rem 0;">
      <h3 style="font-size:0.9rem;margin-bottom:1rem;">Quick Update</h3>
      <form onsubmit="handleQuickUpdateTask(event,'${t.id}')">
        ${isAdmin ? `
          <div class="form-group">
            <label class="form-label">Title</label>
            <input class="form-input" type="text" id="editTaskTitle" value="${escHtml(t.title)}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input" id="editTaskPriority">
                ${['low','medium','high','urgent'].map(p=>`<option value="${p}" ${t.priority===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assign To</label>
              <select class="form-input" id="editTaskAssign">
                <option value="">Unassigned</option>
                ${_projectMembers.map(m=>`<option value="${m.user_id}" ${t.assigned_to===m.user_id?'selected':''}>${escHtml(m.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        ` : '<div style="display:grid;grid-template-columns:1fr;gap:1rem;">'}
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" id="editTaskStatus">
                ${['todo','in_progress','review','done'].map(s=>`<option value="${s}" ${t.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
              </select>
            </div>
            ${isAdmin ? `<div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="editTaskDue" value="${t.due_date?t.due_date.split('T')[0]:''}">
            </div>` : ''}
          </div>
        <div class="modal-actions">
          ${isAdmin ? `<button class="btn btn-danger btn-sm" type="button" onclick="handleDeleteTask('${t.id}')">Delete Task</button>` : ''}
          <div style="flex:1"></div>
          <button class="btn btn-secondary" type="button" onclick="hideModal()">Cancel</button>
          <button class="btn btn-primary" type="submit" id="updateTaskBtn">Update</button>
        </div>
      </form>
    ` : `<div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">Close</button></div>`}
  `);
}

async function handleQuickUpdateTask(e, taskId) {
  e.preventDefault();
  const btn = document.getElementById('updateTaskBtn');
  btn.disabled = true; btn.textContent = 'Saving...';
  const isAdmin = _projectData.role === 'admin';
  const payload = { status: document.getElementById('editTaskStatus').value };
  if (isAdmin) {
    payload.title = document.getElementById('editTaskTitle').value;
    payload.priority = document.getElementById('editTaskPriority').value;
    payload.assigned_to = document.getElementById('editTaskAssign').value || null;
    payload.due_date = document.getElementById('editTaskDue').value || null;
  }
  try {
    const updated = await api.updateTask(taskId, payload);
    const idx = _projectTasks.findIndex(t => t.id === taskId);
    if (idx !== -1) _projectTasks[idx] = { ..._projectTasks[idx], ...updated };
    hideModal();
    renderProjectUI();
    showToast('Task updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Update';
  }
}

async function handleDeleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    await api.deleteTask(taskId);
    _projectTasks = _projectTasks.filter(t => t.id !== taskId);
    hideModal();
    renderProjectUI();
    showToast('Task deleted', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== Member Modals =====
function showAddMemberModal() {
  showModal(`
    <h2>Add Team Member</h2>
    <form onsubmit="handleAddMember(event)">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input class="form-input" type="email" id="memberEmail" required placeholder="teammate@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-input" id="memberRole">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" type="button" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" type="submit" id="addMemberBtn">Add Member</button>
      </div>
    </form>
  `);
}

async function handleAddMember(e) {
  e.preventDefault();
  const btn = document.getElementById('addMemberBtn');
  btn.disabled = true; btn.textContent = 'Adding...';
  try {
    const member = await api.addMember(_projectData.id, {
      email: document.getElementById('memberEmail').value,
      role: document.getElementById('memberRole').value,
    });
    _projectMembers.push(member);
    hideModal();
    renderProjectUI();
    showToast('Member added!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = 'Add Member';
  }
}

async function handleRoleChange(memberId, newRole) {
  try {
    await api.updateMemberRole(_projectData.id, memberId, { role: newRole });
    const m = _projectMembers.find(x => x.id === memberId);
    if (m) m.role = newRole;
    showToast('Role updated', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleRemoveMember(memberId) {
  if (!confirm('Remove this member?')) return;
  try {
    await api.removeMember(_projectData.id, memberId);
    _projectMembers = _projectMembers.filter(m => m.id !== memberId);
    renderProjectUI();
    showToast('Member removed', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== Edit / Delete Project =====
function showEditProjectModal() {
  showModal(`
    <h2>Edit Project</h2>
    <form onsubmit="handleEditProject(event)">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" type="text" id="editProjName" value="${escHtml(_projectData.name)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="editProjDesc" rows="3" style="resize:vertical;">${_projectData.description||''}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" type="button" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" type="submit">Save Changes</button>
      </div>
    </form>
  `);
}

async function handleEditProject(e) {
  e.preventDefault();
  try {
    const updated = await api.updateProject(_projectData.id, {
      name: document.getElementById('editProjName').value,
      description: document.getElementById('editProjDesc').value,
    });
    _projectData = { ..._projectData, ...updated };
    hideModal();
    renderProjectUI();
    showToast('Project updated!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleDeleteProject() {
  if (!confirm('Are you sure? This will delete the project and all its tasks.')) return;
  try {
    await api.deleteProject(_projectData.id);
    showToast('Project deleted', 'success');
    window.location.hash = '#/projects';
  } catch (err) { showToast(err.message, 'error'); }
}
