const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');
const { publishAccessResponse, publishGuestsAccess } = require('../config/mqtt');
const auth = require('../middleware/auth');

// Get all access logs with pagination and filtering
router.get('/logs', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      card_code,
      user_id,
      access_granted,
      access_type,
      space_id,
      start_date,
      end_date
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (card_code) filter.card_code = card_code;
    if (user_id) filter.user_id = parseInt(user_id);
    if (access_granted !== undefined) filter.access_granted = access_granted === 'true';
    if (access_type) filter.access_type = access_type;
    if (space_id) filter.space_id = parseInt(space_id);
    
    if (start_date || end_date) {
      filter.timestamp = {};
      if (start_date) filter.timestamp.$gte = new Date(start_date);
      if (end_date) filter.timestamp.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const accessLogs = await AccessLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await AccessLog.countDocuments(filter);

    res.json({
      success: true,
      data: accessLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching access logs',
      error: error.message
    });
  }
});

// Get access log statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const filter = {};
    if (start_date || end_date) {
      filter.timestamp = {};
      if (start_date) filter.timestamp.$gte = new Date(start_date);
      if (end_date) filter.timestamp.$lte = new Date(end_date);
    }

    const stats = await AccessLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_attempts: { $sum: 1 },
          granted_access: { $sum: { $cond: ['$access_granted', 1, 0] } },
          denied_access: { $sum: { $cond: ['$access_granted', 0, 1] } },
          unique_cards: { $addToSet: '$card_code' },
          unique_users: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          _id: 0,
          total_attempts: 1,
          granted_access: 1,
          denied_access: 1,
          unique_cards: { $size: '$unique_cards' },
          unique_users: { $size: '$unique_users' },
          success_rate: {
            $multiply: [
              { $divide: ['$granted_access', '$total_attempts'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total_attempts: 0,
        granted_access: 0,
        denied_access: 0,
        unique_cards: 0,
        unique_users: 0,
        success_rate: 0
      }
    });

  } catch (error) {
    console.error('Error fetching access stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching access statistics',
      error: error.message
    });
  }
});

// Grant or deny access to a specific card
router.post('/grant-access', auth, async (req, res) => {
  try {
    const { card_code, access_granted, user_id, username, space_id, space_name, reservation_id, notes } = req.body;

    if (!card_code) {
      return res.status(400).json({
        success: false,
        message: 'Card code is required'
      });
    }

    // Publish access response via MQTT
    publishAccessResponse(card_code, access_granted);

    // Log the access decision
    const accessLog = new AccessLog({
      card_code,
      user_id,
      username,
      access_granted,
      space_id,
      space_name,
      reservation_id,
      source: 'api',
      notes,
      timestamp: new Date()
    });

    await accessLog.save();

    res.json({
      success: true,
      message: `Access ${access_granted ? 'granted' : 'denied'} for card: ${card_code}`,
      data: accessLog
    });

  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({
      success: false,
      message: 'Error granting access',
      error: error.message
    });
  }
});

// Manage guest access list
router.post('/guests', auth, async (req, res) => {
  try {
    const { guests, action = 'update' } = req.body;

    if (!Array.isArray(guests)) {
      return res.status(400).json({
        success: false,
        message: 'Guests must be an array'
      });
    }

    // Publish guest access update via MQTT
    publishGuestsAccess(guests);

    // Log the guest access update
    const accessLog = new AccessLog({
      card_code: 'GUEST_ACCESS_UPDATE',
      access_granted: guests.length > 0,
      access_type: 'guest',
      source: 'api',
      raw_data: { guests, action },
      notes: `Guest access ${action}: ${guests.length} guests`,
      timestamp: new Date()
    });

    await accessLog.save();

    res.json({
      success: true,
      message: `Guest access ${action} completed`,
      data: {
        guests_count: guests.length,
        guests: guests
      }
    });

  } catch (error) {
    console.error('Error managing guest access:', error);
    res.status(500).json({
      success: false,
      message: 'Error managing guest access',
      error: error.message
    });
  }
});

// Clear all guest access
router.delete('/guests', auth, async (req, res) => {
  try {
    // Publish empty guest list via MQTT
    publishGuestsAccess([]);

    // Log the guest access clear
    const accessLog = new AccessLog({
      card_code: 'GUEST_ACCESS_CLEAR',
      access_granted: false,
      access_type: 'guest',
      source: 'api',
      raw_data: { guests: [] },
      notes: 'All guest access cleared',
      timestamp: new Date()
    });

    await accessLog.save();

    res.json({
      success: true,
      message: 'All guest access cleared'
    });

  } catch (error) {
    console.error('Error clearing guest access:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing guest access',
      error: error.message
    });
  }
});

// Get recent access attempts for a specific card
router.get('/card/:cardCode', auth, async (req, res) => {
  try {
    const { cardCode } = req.params;
    const { limit = 10 } = req.query;

    const accessLogs = await AccessLog.find({ card_code: cardCode })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: accessLogs
    });

  } catch (error) {
    console.error('Error fetching card access history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card access history',
      error: error.message
    });
  }
});

module.exports = router; 