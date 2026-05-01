const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/rbac');

const router = express.Router();

// List user's projects
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role, u.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
      JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    await client.query('BEGIN');

    const projectResult = await client.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || '', req.user.id]
    );
    const project = projectResult.rows[0];

    // Add creator as admin
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );

    await client.query('COMMIT');

    res.status(201).json({ ...project, role: 'admin', task_count: '0', done_count: '0', member_count: '1' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    client.release();
  }
});

// Get project details
router.get('/:id', authenticate, requireProjectMember('member'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ ...result.rows[0], role: req.projectRole });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name.trim(), description || '', req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
