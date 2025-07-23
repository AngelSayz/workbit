const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// Get all roles
router.get('/', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        users (count)
      `)
      .order('id');

    if (error) throw error;

    // Format response with user count
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      user_count: role.users[0]?.count || 0
    }));

    res.json({
      success: true,
      data: formattedRoles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
});

// Get specific role with users
router.get('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    const { data: role, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        users (
          id,
          name,
          lastname,
          username,
          email,
          created_at
        )
      `)
      .eq('id', roleId)
      .single();

    if (error || !role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        users: role.users || [],
        user_count: role.users?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role',
      error: error.message
    });
  }
});

// Create new role
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('name').isLength({ min: 2, max: 20 }).withMessage('Role name must be between 2 and 20 characters'),
  body('name').matches(/^[a-zA-Z_]+$/).withMessage('Role name must contain only letters and underscores'),
  body('name').customSanitizer(value => value.toLowerCase().trim())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name } = req.body;

    // Check if role already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    // Create new role
    const { data: newRole, error: insertError } = await supabase
      .from('roles')
      .insert({ name })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await logActivity(req.user.id, 'role_created', {
      role_id: newRole.id,
      role_name: name,
      created_by: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRole
    });

  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message
    });
  }
});

// Update role
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('name').isLength({ min: 2, max: 20 }).withMessage('Role name must be between 2 and 20 characters'),
  body('name').matches(/^[a-zA-Z_]+$/).withMessage('Role name must contain only letters and underscores'),
  body('name').customSanitizer(value => value.toLowerCase().trim())
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const roleId = parseInt(req.params.id);
    const { name } = req.body;

    // Check if role exists
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (checkError || !existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent updating system roles
    const systemRoles = ['admin', 'user', 'technician'];
    if (systemRoles.includes(existingRole.name)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system roles'
      });
    }

    // Check if new name already exists (excluding current role)
    const { data: duplicateRole, error: dupError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .neq('id', roleId)
      .single();

    if (dupError && dupError.code !== 'PGRST116') {
      throw dupError;
    }

    if (duplicateRole) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    // Update role
    const { data: updatedRole, error: updateError } = await supabase
      .from('roles')
      .update({ name })
      .eq('id', roleId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await logActivity(req.user.id, 'role_updated', {
      role_id: roleId,
      old_name: existingRole.name,
      new_name: name,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
});

// Delete role
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    // Check if role exists
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (checkError || !existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deleting system roles
    const systemRoles = ['admin', 'user', 'technician'];
    if (systemRoles.includes(existingRole.name)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if role has assigned users
    const { data: usersWithRole, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('role_id', roleId)
      .limit(1);

    if (userError) throw userError;

    if (usersWithRole && usersWithRole.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role '${existingRole.name}'. It is assigned to ${usersWithRole.length} user(s). Please reassign users first.`
      });
    }

    // Delete role
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) throw deleteError;

    // Log activity
    await logActivity(req.user.id, 'role_deleted', {
      role_id: roleId,
      role_name: existingRole.name,
      deleted_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
});

// Get role statistics
router.get('/stats/overview', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    // Get roles with user counts
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        users (count)
      `)
      .order('id');

    if (rolesError) throw rolesError;

    // Get total users
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Format statistics
    const roleStats = roles.map(role => ({
      id: role.id,
      name: role.name,
      user_count: role.users[0]?.count || 0,
      percentage: totalUsers > 0 ? Math.round(((role.users[0]?.count || 0) / totalUsers) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        total_roles: roles.length,
        total_users: totalUsers,
        role_distribution: roleStats
      }
    });

  } catch (error) {
    console.error('Error fetching role statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role statistics',
      error: error.message
    });
  }
});

module.exports = router; 