const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

router.get('/project/:id/tasks', authenticate, requireProjectMember('member'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assigned_name, u.email as assigned_email, c.name as creator_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      JOIN users c ON t.created_by = c.id WHERE t.project_id = $1
      ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, t.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch tasks' }); }
});

router.post('/project/:id/tasks', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });
    const validS = ['todo','in_progress','review','done'];
    const validP = ['low','medium','high','urgent'];
    const ts = validS.includes(status) ? status : 'todo';
    const tp = validP.includes(priority) ? priority : 'medium';
    if (assigned_to) {
      const mc = await pool.query('SELECT id FROM project_members WHERE project_id=$1 AND user_id=$2', [req.params.id, assigned_to]);
      if (!mc.rows.length) return res.status(400).json({ error: 'Assigned user is not a project member' });
    }
    const result = await pool.query(
      `INSERT INTO tasks (project_id,title,description,status,priority,assigned_to,created_by,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, title.trim(), description||'', ts, tp, assigned_to||null, req.user.id, due_date||null]
    );
    const task = result.rows[0];
    if (task.assigned_to) {
      const ui = await pool.query('SELECT name,email FROM users WHERE id=$1', [task.assigned_to]);
      if (ui.rows.length) { task.assigned_name=ui.rows[0].name; task.assigned_email=ui.rows[0].email; }
    }
    task.creator_name = req.user.name;
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: 'Failed to create task' }); }
});

router.get('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assigned_name, u.email as assigned_email, c.name as creator_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id JOIN users c ON t.created_by = c.id WHERE t.id = $1`,
      [req.params.taskId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    const task = result.rows[0];
    const mc = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [task.project_id, req.user.id]);
    if (!mc.rows.length) return res.status(403).json({ error: 'Access denied' });
    res.json({ ...task, role: mc.rows[0].role });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch task' }); }
});

router.put('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const tr = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.taskId]);
    if (!tr.rows.length) return res.status(404).json({ error: 'Task not found' });
    const task = tr.rows[0];
    const mc = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [task.project_id, req.user.id]);
    if (!mc.rows.length) return res.status(403).json({ error: 'Access denied' });
    const role = mc.rows[0].role;
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const validS = ['todo','in_progress','review','done'];
    const validP = ['low','medium','high','urgent'];

    if (role === 'member') {
      if (task.assigned_to !== req.user.id) return res.status(403).json({ error: 'Members can only update their own tasks' });
      if (!status || !validS.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const r = await pool.query('UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.taskId]);
      const u = r.rows[0];
      if (u.assigned_to) { const ui = await pool.query('SELECT name,email FROM users WHERE id=$1',[u.assigned_to]); if(ui.rows.length){u.assigned_name=ui.rows[0].name;u.assigned_email=ui.rows[0].email;}}
      return res.json(u);
    }

    if (assigned_to) {
      const ac = await pool.query('SELECT id FROM project_members WHERE project_id=$1 AND user_id=$2', [task.project_id, assigned_to]);
      if (!ac.rows.length) return res.status(400).json({ error: 'Assigned user is not a project member' });
    }
    const r = await pool.query(
      `UPDATE tasks SET title=$1,description=$2,status=$3,priority=$4,assigned_to=$5,due_date=$6,updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title||task.title, description!==undefined?description:task.description, validS.includes(status)?status:task.status, validP.includes(priority)?priority:task.priority, assigned_to!==undefined?(assigned_to||null):task.assigned_to, due_date!==undefined?(due_date||null):task.due_date, req.params.taskId]
    );
    const u = r.rows[0];
    if(u.assigned_to){const ui=await pool.query('SELECT name,email FROM users WHERE id=$1',[u.assigned_to]);if(ui.rows.length){u.assigned_name=ui.rows[0].name;u.assigned_email=ui.rows[0].email;}}
    res.json(u);
  } catch (err) { res.status(500).json({ error: 'Failed to update task' }); }
});

router.delete('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const tr = await pool.query('SELECT project_id FROM tasks WHERE id=$1', [req.params.taskId]);
    if (!tr.rows.length) return res.status(404).json({ error: 'Task not found' });
    const mc = await pool.query("SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2 AND role='admin'", [tr.rows[0].project_id, req.user.id]);
    if (!mc.rows.length) return res.status(403).json({ error: 'Admin access required' });
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete task' }); }
});

module.exports = router;
