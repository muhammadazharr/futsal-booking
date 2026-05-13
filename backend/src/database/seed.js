/**
 * Database Seed Script
 * Run: npm run db:seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { PERMISSIONS, ROLES } = require('../config/constants');

const seed = async () => {
  console.log('Starting database seeding...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create roles
    console.log('Creating roles...');
    const userRole = await client.query(
      `INSERT INTO roles (role_name) VALUES ($1) 
       ON CONFLICT (role_name) DO UPDATE SET role_name = $1
       RETURNING role_id`,
      [ROLES.USER]
    );
    const adminRole = await client.query(
      `INSERT INTO roles (role_name) VALUES ($1) 
       ON CONFLICT (role_name) DO UPDATE SET role_name = $1
       RETURNING role_id`,
      [ROLES.ADMIN]
    );

    const userRoleId = userRole.rows[0].role_id;
    const adminRoleId = adminRole.rows[0].role_id;

    // 2. Create permissions
    console.log('Creating permissions...');
    const permissionIds = {};
    
    for (const [key, name] of Object.entries(PERMISSIONS)) {
      const result = await client.query(
        `INSERT INTO permissions (permission_name) VALUES ($1) 
         ON CONFLICT (permission_name) DO UPDATE SET permission_name = $1
         RETURNING permission_id`,
        [name]
      );
      permissionIds[key] = result.rows[0].permission_id;
    }

    // 3. Assign permissions to roles
    console.log('Assigning permissions to roles...');
    
    // USER permissions
    const userPermissions = [
      'BOOKING_CREATE', 'BOOKING_READ', 'BOOKING_CANCEL', 'BOOKING_RESCHEDULE',
      'PAYMENT_READ', 'MEMBERSHIP_READ'
    ];
    
    for (const perm of userPermissions) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [userRoleId, permissionIds[perm]]
      );
    }

    // ADMIN permissions (all)
    for (const permId of Object.values(permissionIds)) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [adminRoleId, permId]
      );
    }

    // 4. Create admin user
    console.log('Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
    const adminUser = await client.query(
      `INSERT INTO users (name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone) DO UPDATE SET name = $1
       RETURNING user_id`,
      ['Admin', '08001234567', 'admin@futsal.com', adminPasswordHash]
    );
    
    // Assign admin role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [adminUser.rows[0].user_id, adminRoleId]
    );

    // 5. Create sample branch
    console.log('Creating sample branch...');
    const branch = await client.query(
      `INSERT INTO branches (name, address)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING branch_id`,
      ['Futsal Center Jakarta', 'Jl. Sudirman No. 123, Jakarta']
    );
    
    if (branch.rows.length > 0) {
      const branchId = branch.rows[0].branch_id;

      // 6. Create sample fields
      console.log('Creating sample fields...');
      const fields = [];
      for (let i = 1; i <= 3; i++) {
        const field = await client.query(
          `INSERT INTO fields (branch_id, name)
           VALUES ($1, $2)
           RETURNING field_id`,
          [branchId, `Lapangan ${i}`]
        );
        fields.push(field.rows[0].field_id);
      }

      // 7. Create time slots
      console.log('Creating time slots...');
      const slots = [];
      const timeSlots = [
        { start: '08:00', end: '09:00', isDay: true },
        { start: '09:00', end: '10:00', isDay: true },
        { start: '10:00', end: '11:00', isDay: true },
        { start: '11:00', end: '12:00', isDay: true },
        { start: '13:00', end: '14:00', isDay: true },
        { start: '14:00', end: '15:00', isDay: true },
        { start: '15:00', end: '16:00', isDay: true },
        { start: '16:00', end: '17:00', isDay: true },
        { start: '18:00', end: '19:00', isDay: false },
        { start: '19:00', end: '20:00', isDay: false },
        { start: '20:00', end: '21:00', isDay: false },
        { start: '21:00', end: '22:00', isDay: false }
      ];

      for (const slot of timeSlots) {
        const result = await client.query(
          `INSERT INTO time_slots (start_time, end_time, is_day)
           VALUES ($1, $2, $3)
           RETURNING slot_id`,
          [slot.start, slot.end, slot.isDay]
        );
        slots.push({ id: result.rows[0].slot_id, isDay: slot.isDay });
      }

      // 8. Create pricing
      console.log('Creating pricing...');
      for (const fieldId of fields) {
        for (const slot of slots) {
          // Weekday pricing
          const weekdayPrice = slot.isDay ? 100000 : 150000;
          await client.query(
            `INSERT INTO slot_pricing (field_id, slot_id, day_type, price)
             VALUES ($1, $2, 'WEEKDAY', $3)
             ON CONFLICT (field_id, slot_id, day_type) DO UPDATE SET price = $3`,
            [fieldId, slot.id, weekdayPrice]
          );

          // Weekend pricing (20% more)
          const weekendPrice = slot.isDay ? 120000 : 180000;
          await client.query(
            `INSERT INTO slot_pricing (field_id, slot_id, day_type, price)
             VALUES ($1, $2, 'WEEKEND', $3)
             ON CONFLICT (field_id, slot_id, day_type) DO UPDATE SET price = $3`,
            [fieldId, slot.id, weekendPrice]
          );
        }
      }

      // 9. Create sample membership types
      console.log('Creating membership types...');
      await client.query(
        `INSERT INTO memberships (name, discount_type, discount_value, duration_days)
         VALUES 
           ('Bronze', 'PERCENTAGE', 5, 30),
           ('Silver', 'PERCENTAGE', 10, 30),
           ('Gold', 'PERCENTAGE', 15, 30),
           ('Platinum', 'PERCENTAGE', 20, 30)
         ON CONFLICT DO NOTHING`
      );

      // 10. Create sample promo
      console.log('Creating sample promo...');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await client.query(
        `INSERT INTO promos (code, discount_type, discount_value, start_date, end_date)
         VALUES ($1, 'PERCENTAGE', 10, CURRENT_DATE, $2)
         ON CONFLICT (code) DO NOTHING`,
        ['WELCOME10', nextMonth.toISOString().split('T')[0]]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    
    console.log('\n=== Test Credentials ===');
    console.log('Admin: 08001234567 / Admin123!');
    console.log('========================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
