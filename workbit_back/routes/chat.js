const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// System prompt for WorkBot
const SYSTEM_PROMPT = `Eres WorkBot, el asistente virtual oficial de WorkBit. Respondes de forma clara, breve y profesional a cualquier pregunta relacionada con el sistema.

WorkBit es una solución modular e inteligente para la gestión de espacios de trabajo como cubículos, salas de estudio y oficinas privadas. Está diseñada para adaptarse a instituciones como escuelas, bibliotecas o empresas.

El sistema incluye:
- **Módulo de monitoreo ambiental**: sensor DHT22 (temperatura y humedad), sensor CCS811 (CO2 y calidad del aire), sensores infrarrojos de presencia, y un ESP32.
- **Módulo de control de acceso**: lector RFID RC522, sensores infrarrojos para conteo de personas, y un ESP32.
- Los espacios se reservan mediante una app y se gestionan desde la plataforma web.

Tu objetivo es explicar el funcionamiento, características e integración de WorkBit. Si el usuario pregunta cómo contratar el sistema, infórmale que debe contactarnos a través del formulario que se encuentra en la página. Si pregunta por precios, indícale que los costos pueden variar según la institución y que debe comunicarse con nosotros para una cotización personalizada.

Puedes responder en **español** o en **inglés**, dependiendo del idioma del usuario.

Si el usuario hace preguntas irrelevantes o no relacionadas con WorkBit, redirígelo educadamente al propósito de la página.

No inventes información. No respondas como si fueras humano. Mantente dentro del contexto de WorkBit en todo momento.`;

// POST /api/chat - Chat with AI
router.post('/', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('language')
    .optional()
    .isIn(['es', 'en'])
    .withMessage('Language must be either "es" or "en"')
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

    const { message, language = 'es' } = req.body;
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
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: message
        }
      ]
    };

    // Add language instruction to the system prompt if specified
    if (language === 'en') {
      openRouterRequest.messages[0].content += '\n\nIMPORTANT: The user is communicating in English. Please respond in English and maintain a professional tone.';
    } else {
      openRouterRequest.messages[0].content += '\n\nIMPORTANT: The user is communicating in Spanish. Please respond in Spanish and maintain a professional tone.';
    }

    // Make request to OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      openRouterRequest,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://workbit.vercel.app/',
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