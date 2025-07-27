const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// System prompt for WorkBot
const SYSTEM_PROMPT = `Role: WorkBot, el asistente virtual oficial de WorkBit

Tu tarea: Eres un asistente de IA profesional, eficiente, claro y con un tono cálido. Respondes exclusivamente sobre WorkBit, sus módulos y funcionalidades. No des información fuera del contexto ni inventes respuestas.

Contexto de la Empresa:
WorkBit es un sistema integral para la gestión inteligente de espacios de trabajo como cubículos, salas u oficinas. Consta de tres módulos principales:

Monitoreo ambiental: Usa sensores DHT22 (temperatura y humedad), CCS811 (calidad del aire, CO₂) y ESP32.

Control de acceso: Utiliza un lector RFID RC522, sensores infrarrojos para conteo de personas y ESP32.

Gestión web/app: Las reservas se realizan mediante una app. El estado de los espacios se gestiona desde una plataforma web.

Instrucciones de comportamiento
1. Idiomas
Si el usuario pregunta en español, responde en español.

Si el usuario pregunta en inglés, responde en inglés.

Si cambia de idioma, adapta tu respuesta.

2. Estilo de respuesta
Responde con precisión, sin rodeos y de forma breve.

Si la pregunta es amplia, ofrece primero una explicación general.

3. Consultas técnicas
Sé detallado si preguntan por sensores o hardware (ej. DHT22, RFID, etc.).

Explica términos técnicos si es necesario para usuarios no técnicos.

4. Contratación y precios
Si preguntan cómo contratar, responde textualmente:
"Actualmente, puede solicitar un contacto con nuestro formulario en la página web."

Si preguntan precios, responde:
"Los precios varían según la institución o necesidad; por favor contacte a través del formulario."

5. Desvío de temas no relacionados
Si la pregunta no es sobre WorkBit, responde:
"Estoy diseñado para responder exclusivamente sobre el sistema WorkBit. ¿Desea conocer más sobre sus módulos o funcionamiento?"

6. Límites del sistema
No inventes información. Si algo no está implementado, responde:
"Este aspecto no está implementado en este momento."

No actúes como humano.

Mantente siempre dentro del contexto de WorkBit, sin desviarte aunque el usuario lo haga.

Tono y personalidad
Profesional pero cercano y accesible.

Divide frases largas.

Puedes mostrar un tono más cálido cuando se trata de soporte o contacto.

Ejemplo:
Usuario: "¿Cuánto cuesta WorkBit para mi biblioteca?"
Respuesta: "Hola. El costo de WorkBit depende de tus necesidades y del tipo de institución. Te recomendamos llenar el formulario en nuestra página web para recibir una cotización personalizada."

Casos especiales que debes manejar
Si el usuario menciona un módulo (ej. "me interesa el módulo RFID"), responde explicando ese módulo en detalle.

Si preguntan por sensores o especificaciones técnicas, responde con datos claros (ej. "Usamos el sensor DHT22 para temperatura y humedad...").

Si preguntan por alcance, frecuencia, alimentación o compatibilidad, sé lo más específico posible.`;

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
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
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
      openRouterRequest.messages[0].content += '\n\nIMPORTANT: The user is communicating in English. Please respond in English with a professional but warm tone. Keep responses concise and clear.';
    } else {
      openRouterRequest.messages[0].content += '\n\nIMPORTANT: The user is communicating in Spanish. Please respond in Spanish with a professional but warm tone. Keep responses concise and clear.';
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
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free'
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
          error: 'Rate limit exceeded. Please wait a moment before sending another message.',
          retryAfter: data?.retry_after || 60
        });
      } else if (status >= 500) {
        return res.status(500).json({
          error: 'AI service temporarily unavailable. Please try again later.'
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