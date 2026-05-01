// ===== Dashboard Page =====

async function renderDashboardPage() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="page">${renderLoading()}</div>`;

  try {
    const data = await api.getDashboard();
    const s = data.stats;
    const user = getUser();

    content.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1>Good ${getGreeting()}, ${user ? user.name.split(' ')[0] : 'there'}! 👋</h1>
          <p>Here's an overview of your tasks and projects</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card cyan">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${s.total}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon">🚀</div>
            <div class="stat-value">${s.inProgress}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${s.done}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card red">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value">${s.overdue}</div>
            <div class="stat-label">Overdue</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon">📂</div>
            <div class="stat-value">${s.projects}</div>
            <div class="stat-label">Projects</div>
          </div>
          <div class="stat-card pink">
            <div class="stat-icon">👤</div>
            <div class="stat-value">${s.myTasks}</div>
            <div class="stat-label">My Tasks</div>
          </div>
        </div>

        <div class="chart-section">
          <div class="chart-card">
            <h3>Task Distribution</h3>
            <canvas id="taskChart" width="400" height="220"></canvas>
          </div>
          <div class="chart-card">
            <h3>⚠️ Overdue Tasks</h3>
            ${data.overdueTasks.length === 0
              ? '<p style="color:var(--text-muted);padding:2rem 0;text-align:center;">No overdue tasks! 🎉</p>'
              : `<div class="task-list">${data.overdueTasks.map(t => `
                <div class="task-item" onclick="window.location.hash='#/project/${t.project_id}'">
                  <div class="priority-dot ${t.priority}"></div>
                  <div style="flex:1">
                    <div class="task-item-title">${escHtml(t.title)}</div>
                    <div class="task-item-project">${escHtml(t.project_name)}</div>
                  </div>
                  <div class="task-item-due overdue">${formatDate(t.due_date)}</div>
                </div>
              `).join('')}</div>`
            }
          </div>
        </div>

        <div class="chart-card">
          <h3>Recent Tasks</h3>
          ${data.recentTasks.length === 0
            ? '<p style="color:var(--text-muted);padding:2rem 0;text-align:center;">No tasks yet. Create a project to get started!</p>'
            : `<div class="task-list">${data.recentTasks.map(t => `
              <div class="task-item" onclick="window.location.hash='#/project/${t.project_id}'">
                <div class="priority-dot ${t.priority}"></div>
                <div style="flex:1">
                  <div class="task-item-title">${escHtml(t.title)}</div>
                  <div class="task-item-project">${escHtml(t.project_name)}</div>
                </div>
                <span class="status-badge ${t.status}">${t.status.replace('_',' ')}</span>
              </div>
            `).join('')}</div>`
          }
        </div>
      </div>
    `;

    // Draw chart
    drawTaskChart(s);
  } catch (err) {
    content.innerHTML = `<div class="page"><p style="color:var(--accent-red);">Failed to load dashboard: ${err.message}</p></div>`;
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function drawTaskChart(stats) {
  const canvas = document.getElementById('taskChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const data = [
    { label: 'To Do', value: stats.todo, color: '#94a3b8' },
    { label: 'In Progress', value: stats.inProgress, color: '#06b6d4' },
    { label: 'Review', value: stats.review, color: '#f59e0b' },
    { label: 'Done', value: stats.done, color: '#10b981' },
  ];
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No tasks to display', w / 2, h / 2);
    return;
  }

  // Draw donut chart
  const cx = w / 3, cy = h / 2, r = 70, inner = 45;
  let startAngle = -Math.PI / 2;
  data.forEach(d => {
    if (d.value === 0) return;
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, inner, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 24px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 4);
  ctx.font = '11px Inter';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('tasks', cx, cy + 20);

  // Legend
  let ly = 40;
  data.forEach(d => {
    ctx.fillStyle = d.color;
    ctx.fillRect(w * 0.6, ly, 12, 12);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${d.label}: ${d.value}`, w * 0.6 + 20, ly + 10);
    ly += 28;
  });
}
