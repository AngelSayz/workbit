const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// POST /api/chat - Chat with AI
router.post('/', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      });
    }

    const { message } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OpenRouter API key not configured');
      return res.status(500).json({
        error: 'Chat service not configured'
      });
    }

    // Prepare request to OpenRouter
    const openRouterRequest = {
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    };

    // Make request to OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      openRouterRequest,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://workbit.com',
          'X-Title': 'WorkBit Assistant'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // Extract the response content
    const reply = response.data.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No response content received from AI');
    }

    // Return the response
    res.json({
      reply,
      timestamp: new Date().toISOString(),
      model: 'google/gemini-2.0-flash-exp:free'
    });

  } catch (error) {
    console.error('Chat API error:', error.message);
    
    // Handle specific error types
    if (error.response) {
      // OpenRouter API error
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return res.status(500).json({
          error: 'Chat service authentication failed'
        });
      } else if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.'
        });
      } else if (status >= 500) {
        return res.status(500).json({
          error: 'AI service temporarily unavailable'
        });
      } else {
        return res.status(500).json({
          error: 'Chat service error',
          details: data?.error?.message || 'Unknown error'
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Request timeout. Please try again.'
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Chat service unavailable'
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router; 