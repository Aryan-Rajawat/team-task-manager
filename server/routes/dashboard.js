const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    // Get all tasks assigned to or created by user
    const tasksResult = await pool.query(
      `SELECT t.*, p.name as project_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      ORDER BY t.updated_at DESC`,
      [req.user.id]
    );
    const tasks = tasksResult.rows;

    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
    const myTasks = tasks.filter(t => t.assigned_to === req.user.id).length;

    // Project stats
    const projectsResult = await pool.query(
      'SELECT COUNT(*) as count FROM project_members WHERE user_id = $1',
      [req.user.id]
    );

    // Recent tasks (last 10)
    const recentTasks = tasks.slice(0, 10);

    // Overdue tasks
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').slice(0, 10);

    res.json({
      stats: { total, todo, inProgress, review, done, overdue, myTasks, projects: parseInt(projectsResult.rows[0].count) },
      recentTasks,
      overdueTasks
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

module.exports = router;
