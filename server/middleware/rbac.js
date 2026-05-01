const pool = require('../db');

function requireProjectMember(requiredRole) {
  return async (req, res, next) => {
    const projectId = req.params.id || req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    try {
      const result = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this project' });
      }

      const memberRole = result.rows[0].role;
      req.projectRole = memberRole;

      if (requiredRole === 'admin' && memberRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      next();
    } catch (err) {
      console.error('RBAC error:', err);
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

module.exports = { requireProjectMember };
