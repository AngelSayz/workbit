const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// Get all access cards
router.get('/', async (req, res) => {
  try {
    const { data: cards, error } = await supabase
      .from('codecards')
      .select(`
        id,
        code,
        created_at,
        users (
          id,
          name,
          lastname,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format response to show card assignment status
    const formattedCards = cards.map(card => ({
      id: card.id,
      code: card.code,
      created_at: card.created_at,
      is_assigned: !!card.users,
      assigned_user: card.users ? {
        id: card.users.id,
        name: card.users.name,
        lastname: card.users.lastname,
        username: card.users.username
      } : null
    }));

    res.json({
      success: true,
      data: formattedCards,
      summary: {
        total_cards: formattedCards.length,
        assigned_cards: formattedCards.filter(c => c.is_assigned).length,
        available_cards: formattedCards.filter(c => !c.is_assigned).length
      }
    });

  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cards',
      error: error.message
    });
  }
});

// Get available (unassigned) cards
router.get('/available', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    // Get cards that are not assigned to any user
    const { data: availableCards, error } = await supabase
      .from('codecards')
      .select('id, code, created_at')
      .not('id', 'in', 
        await supabase
          .from('users')
          .select('card_id')
          .not('card_id', 'is', null)
          .then(result => result.data?.map(u => u.card_id) || [])
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: availableCards || [],
      count: availableCards?.length || 0
    });

  } catch (error) {
    console.error('Error fetching available cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available cards',
      error: error.message
    });
  }
});

// Create new access card
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('code').isLength({ min: 4, max: 20 }).withMessage('Card code must be between 4 and 20 characters'),
  body('code').matches(/^[A-Z0-9]+$/).withMessage('Card code must contain only uppercase letters and numbers')
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

    const { code } = req.body;

    // Check if card code already exists
    const { data: existingCard, error: checkError } = await supabase
      .from('codecards')
      .select('id')
      .eq('code', code)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'Card code already exists'
      });
    }

    // Create new card
    const { data: newCard, error: insertError } = await supabase
      .from('codecards')
      .insert({ code })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await logActivity(req.user.id, 'card_created', {
      card_id: newCard.id,
      card_code: code,
      created_by: req.user.username
    });

    res.status(201).json({
      success: true,
      message: 'Access card created successfully',
      data: newCard
    });

  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating card',
      error: error.message
    });
  }
});

// Update access card
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('code').isLength({ min: 4, max: 20 }).withMessage('Card code must be between 4 and 20 characters'),
  body('code').matches(/^[A-Z0-9]+$/).withMessage('Card code must contain only uppercase letters and numbers')
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

    const cardId = parseInt(req.params.id);
    const { code } = req.body;

    // Check if card exists
    const { data: existingCard, error: checkError } = await supabase
      .from('codecards')
      .select('id, code')
      .eq('id', cardId)
      .single();

    if (checkError || !existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if new code already exists (excluding current card)
    const { data: duplicateCard, error: dupError } = await supabase
      .from('codecards')
      .select('id')
      .eq('code', code)
      .neq('id', cardId)
      .single();

    if (dupError && dupError.code !== 'PGRST116') {
      throw dupError;
    }

    if (duplicateCard) {
      return res.status(400).json({
        success: false,
        message: 'Card code already exists'
      });
    }

    // Update card
    const { data: updatedCard, error: updateError } = await supabase
      .from('codecards')
      .update({ code })
      .eq('id', cardId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await logActivity(req.user.id, 'card_updated', {
      card_id: cardId,
      old_code: existingCard.code,
      new_code: code,
      updated_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Access card updated successfully',
      data: updatedCard
    });

  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating card',
      error: error.message
    });
  }
});

// Delete access card
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const cardId = parseInt(req.params.id);

    // Check if card exists and get details
    const { data: existingCard, error: checkError } = await supabase
      .from('codecards')
      .select('id, code')
      .eq('id', cardId)
      .single();

    if (checkError || !existingCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if card is assigned to any user
    const { data: assignedUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('card_id', cardId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (assignedUser) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete card ${existingCard.code}. It is assigned to user ${assignedUser.username}. Please unassign it first.`
      });
    }

    // Delete card
    const { error: deleteError } = await supabase
      .from('codecards')
      .delete()
      .eq('id', cardId);

    if (deleteError) throw deleteError;

    // Log activity
    await logActivity(req.user.id, 'card_deleted', {
      card_id: cardId,
      card_code: existingCard.code,
      deleted_by: req.user.username
    });

    res.json({
      success: true,
      message: 'Access card deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting card',
      error: error.message
    });
  }
});

// Assign card to user
router.put('/assign/:cardId/user/:userId', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const cardId = parseInt(req.params.cardId);
    const userId = parseInt(req.params.userId);

    // Check if card exists and is available
    const { data: card, error: cardError } = await supabase
      .from('codecards')
      .select('id, code')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, card_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a card
    if (user.card_id) {
      return res.status(400).json({
        success: false,
        message: `User ${user.username} already has a card assigned`
      });
    }

    // Check if card is already assigned
    const { data: assignedUser, error: assignError } = await supabase
      .from('users')
      .select('id, username')
      .eq('card_id', cardId)
      .single();

    if (assignError && assignError.code !== 'PGRST116') {
      throw assignError;
    }

    if (assignedUser) {
      return res.status(400).json({
        success: false,
        message: `Card ${card.code} is already assigned to ${assignedUser.username}`
      });
    }

    // Assign card to user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ card_id: cardId })
      .eq('id', userId)
      .select('id, username, name, lastname')
      .single();

    if (updateError) throw updateError;

    // Log activity
    await logActivity(req.user.id, 'card_assigned', {
      card_id: cardId,
      card_code: card.code,
      user_id: userId,
      username: user.username,
      assigned_by: req.user.username
    });

    res.json({
      success: true,
      message: `Card ${card.code} assigned to ${user.username} successfully`,
      data: {
        card: card,
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error assigning card:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning card',
      error: error.message
    });
  }
});

// Unassign card from user
router.delete('/unassign/user/:userId', [
  authenticateToken,
  requireRole(['admin', 'technician'])
], async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Check if user exists and has a card
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id, username, card_id,
        codecards (
          id, code
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.card_id) {
      return res.status(400).json({
        success: false,
        message: `User ${user.username} does not have a card assigned`
      });
    }

    // Unassign card from user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ card_id: null })
      .eq('id', userId)
      .select('id, username, name, lastname')
      .single();

    if (updateError) throw updateError;

    // Log activity
    await logActivity(req.user.id, 'card_unassigned', {
      card_id: user.card_id,
      card_code: user.codecards?.code,
      user_id: userId,
      username: user.username,
      unassigned_by: req.user.username
    });

    res.json({
      success: true,
      message: `Card ${user.codecards?.code} unassigned from ${user.username} successfully`,
      data: {
        user: updatedUser,
        unassigned_card: user.codecards
      }
    });

  } catch (error) {
    console.error('Error unassigning card:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning card',
      error: error.message
    });
  }
});

// Bulk create cards
router.post('/bulk', [
  authenticateToken,
  requireRole(['admin']),
  body('codes').isArray().withMessage('Codes must be an array'),
  body('codes.*').isLength({ min: 4, max: 20 }).withMessage('Each card code must be between 4 and 20 characters'),
  body('codes.*').matches(/^[A-Z0-9]+$/).withMessage('Each card code must contain only uppercase letters and numbers')
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

    const { codes } = req.body;
    const results = [];
    const errorResults = [];

    for (const code of codes) {
      try {
        // Check if code already exists
        const { data: existingCard } = await supabase
          .from('codecards')
          .select('id')
          .eq('code', code)
          .single();

        if (existingCard) {
          errorResults.push({
            code: code,
            error: 'Code already exists'
          });
          continue;
        }

        // Create card
        const { data: newCard, error } = await supabase
          .from('codecards')
          .insert({ code })
          .select()
          .single();

        if (error) throw error;
        results.push(newCard);

      } catch (error) {
        errorResults.push({
          code: code,
          error: error.message
        });
      }
    }

    // Log activity
    await logActivity(req.user.id, 'bulk_cards_created', {
      total_requested: codes.length,
      successful_created: results.length,
      failed_created: errorResults.length,
      created_by: req.user.username
    });

    res.status(201).json({
      success: true,
      message: `Created ${results.length} out of ${codes.length} cards`,
      data: {
        successful_cards: results,
        failed_cards: errorResults
      }
    });

  } catch (error) {
    console.error('Error bulk creating cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating cards',
      error: error.message
    });
  }
});

module.exports = router; 