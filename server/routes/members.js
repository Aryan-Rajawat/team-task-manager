const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// List project members
router.get('/', authenticate, requireProjectMember('member'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pm.id, pm.role, pm.joined_at, u.id as user_id, u.name, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Add member by email
router.post('/', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const memberRole = role === 'admin' ? 'admin' : 'member';

    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    const user = userResult.rows[0];

    const existingMember = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, user.id]
    );
    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this project' });
    }

    const result = await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING id, role, joined_at',
      [req.params.id, user.id, memberRole]
    );

    res.status(201).json({ ...result.rows[0], user_id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Update member role
router.put('/:memberId', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }

    const result = await pool.query(
      'UPDATE project_members SET role = $1 WHERE id = $2 AND project_id = $3 RETURNING *',
      [role, req.params.memberId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Remove member
router.delete('/:memberId', authenticate, requireProjectMember('admin'), async (req, res) => {
  try {
    // Prevent removing yourself if you're the only admin
    const member = await pool.query(
      'SELECT user_id, role FROM project_members WHERE id = $1 AND project_id = $2',
      [req.params.memberId, req.params.id]
    );

    if (member.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.rows[0].role === 'admin') {
      const adminCount = await pool.query(
        "SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'admin'",
        [req.params.id]
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    await pool.query('DELETE FROM project_members WHERE id = $1', [req.params.memberId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
