const { pool } = require('../config/database');

const roleRepository = {
  async findAll() {
    const result = await pool.query(`
      SELECT 
        r.role_id,
        r.role_name,
        COALESCE(
          json_agg(
            json_build_object('id', p.permission_id, 'name', p.permission_name)
          ) FILTER (WHERE p.permission_id IS NOT NULL),
          '[]'
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      GROUP BY r.role_id
      ORDER BY r.role_id
    `);
    return result.rows;
  },

  async findById(roleId) {
    const result = await pool.query(`
      SELECT 
        r.role_id,
        r.role_name,
        COALESCE(
          json_agg(
            json_build_object('id', p.permission_id, 'name', p.permission_name)
          ) FILTER (WHERE p.permission_id IS NOT NULL),
          '[]'
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE r.role_id = $1
      GROUP BY r.role_id
    `, [roleId]);
    return result.rows[0] || null;
  },

  async findByName(roleName) {
    const result = await pool.query(
      `SELECT * FROM roles WHERE role_name = $1`,
      [roleName]
    );
    return result.rows[0] || null;
  },

  async create(roleName) {
    const result = await pool.query(
      `INSERT INTO roles (role_name) VALUES ($1) RETURNING *`,
      [roleName]
    );
    return result.rows[0];
  },

  async addPermission(roleId, permissionId) {
    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [roleId, permissionId]
    );
  },

  async removePermission(roleId, permissionId) {
    await pool.query(
      `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId]
    );
  },

  async findAllPermissions() {
    const result = await pool.query(
      `SELECT * FROM permissions ORDER BY permission_name`
    );
    return result.rows;
  },

  async findPermissionByName(permissionName) {
    const result = await pool.query(
      `SELECT * FROM permissions WHERE permission_name = $1`,
      [permissionName]
    );
    return result.rows[0] || null;
  },

  async createPermission(permissionName) {
    const result = await pool.query(
      `INSERT INTO permissions (permission_name) VALUES ($1) RETURNING *`,
      [permissionName]
    );
    return result.rows[0];
  }
};

module.exports = roleRepository;
