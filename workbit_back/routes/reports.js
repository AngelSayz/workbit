const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { formatError } = require('../utils/helpers');
const { zonedTimeToUtc } = require('date-fns-tz');

const router = express.Router();

// Helper to check validation result
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  }
};

// POST /api/reports - Create a report for a past reservation
router.post(
  '/',
  authenticateToken,
  [
    body('reservation_id').isInt({ min: 1 }).withMessage('reservation_id is required'),
    body('title').isString().trim().isLength({ min: 3 }).withMessage('title is required'),
    body('description').isString().trim().isLength({ min: 5 }).withMessage('description is required'),
    body('attachments').optional().isArray().withMessage('attachments must be an array')
  ],
  async (req, res) => {
    try {
      const validation = checkValidation(req, res);
      if (validation) return validation;

      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Database connection failed' });
      }

      const userId = req.user.id;
      const { reservation_id, title, description, attachments = [] } = req.body;

      // Verify reservation belongs to user
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select('id, owner_id, end_time')
        .eq('id', reservation_id)
        .single();

      if (reservationError || !reservation) {
        return res.status(404).json({ success: false, error: 'Reservation not found' });
      }

      if (reservation.owner_id !== userId) {
        return res.status(403).json({ success: false, error: 'You cannot report a reservation you do not own' });
      }

      // Check reservation already ended (use Tijuana timezone consistently)
      const nowTj = zonedTimeToUtc(new Date(), 'America/Tijuana');
      const ended = new Date(reservation.end_time) <= nowTj;
      if (!ended) {
        return res.status(400).json({ success: false, error: 'Reservation has not finished yet' });
      }

      // Ensure only one report per user per reservation
      const { data: existing, error: existingError } = await supabase
        .from('reports')
        .select('id')
        .eq('user_id', userId)
        .eq('reservation_id', reservation_id)
        .maybeSingle();

      if (existingError) {
        console.error('Check existing report error:', existingError);
      }
      if (existing) {
        return res.status(409).json({ success: false, error: 'Report already exists for this reservation' });
      }

      // Insert report
      const { data: report, error: insertError } = await supabase
        .from('reports')
        .insert({ user_id: userId, reservation_id, title, description })
        .select('*')
        .single();

      if (insertError) {
        console.error('Insert report error:', insertError);
        return res.status(500).json({ success: false, error: 'Failed to create report' });
      }

      // Insert attachments if provided
      let savedAttachments = [];
      if (Array.isArray(attachments) && attachments.length > 0) {
        const rows = attachments.map((a) => ({
          report_id: report.id,
          file_url: a.file_url || a.path || a.url,
          thumbnail_url: a.thumbnail_url || null,
          content_type: a.content_type || a.mime_type || null,
          size: a.size || null,
          storage_provider: a.storage_provider || 'supabase'
        }));

        const { data: insertedAttachments, error: attError } = await supabase
          .from('report_attachments')
          .insert(rows)
          .select('*');

        if (attError) {
          console.error('Insert attachments error:', attError);
        } else {
          savedAttachments = insertedAttachments;
        }
      }

      res.json({ success: true, data: { ...report, attachments: savedAttachments } });
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json(formatError('Failed to create report'));
    }
  }
);

// GET /api/reports/my - List my reports with attachments (signed URLs)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }

    const userId = req.user.id;

    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, reservation_id, title, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch reports error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }

    // Load attachments
    const ids = reports.map(r => r.id);
    let attachmentsByReport = {};
    if (ids.length > 0) {
      const { data: attachments, error: attErr } = await supabase
        .from('report_attachments')
        .select('id, report_id, file_url, content_type, size, storage_provider, created_at, thumbnail_url')
        .in('report_id', ids);

      if (attErr) {
        console.error('Fetch attachments error:', attErr);
      } else {
        // Create signed URLs for supabase storage paths
        const results = await Promise.all(
          attachments.map(async (a) => {
            let url = a.file_url;
            if (a.storage_provider === 'supabase' && supabaseAdmin && url) {
              // Assume file_url is the path in the bucket 'reports'
              try {
                const { data: signed } = await supabaseAdmin.storage.from('reports').createSignedUrl(url, 60 * 60);
                if (signed?.signedUrl) {
                  url = signed.signedUrl;
                }
              } catch (e) {
                // ignore signing errors
              }
            }
            return { ...a, file_url: url };
          })
        );
        for (const a of results) {
          if (!attachmentsByReport[a.report_id]) attachmentsByReport[a.report_id] = [];
          attachmentsByReport[a.report_id].push(a);
        }
      }
    }

    const data = reports.map(r => ({ ...r, attachments: attachmentsByReport[r.id] || [] }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('List my reports error:', error);
    res.status(500).json(formatError('Failed to fetch reports'));
  }
});

// GET /api/reports/by-reservation/:id - Get a report for a reservation (owner/admin/technician)
router.get('/by-reservation/:id', authenticateToken, [param('id').isInt({ min: 1 })], async (req, res) => {
  try {
    const validation = checkValidation(req, res);
    if (validation) return validation;

    const reservationId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const role = req.user.roles?.name || req.user.role;

    // Find report and check ownership
    const { data: report, error } = await supabase
      .from('reports')
      .select('id, user_id, reservation_id, title, description, created_at')
      .eq('reservation_id', reservationId)
      .maybeSingle();

    if (error) {
      console.error('Fetch report error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch report' });
    }

    if (!report) {
      return res.json({ success: true, data: null });
    }

    if (!(report.user_id === userId || role === 'admin' || role === 'technician')) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Attachments
    const { data: attachments, error: attErr } = await supabase
      .from('report_attachments')
      .select('id, report_id, file_url, content_type, size, storage_provider, created_at, thumbnail_url')
      .eq('report_id', report.id);

    let signed = [];
    if (!attErr && attachments?.length) {
      signed = await Promise.all(
        attachments.map(async (a) => {
          let url = a.file_url;
          if (a.storage_provider === 'supabase' && supabaseAdmin && url) {
            try {
              const { data: signed } = await supabaseAdmin.storage.from('reports').createSignedUrl(url, 60 * 60);
              if (signed?.signedUrl) url = signed.signedUrl;
            } catch {}
          }
          return { ...a, file_url: url };
        })
      );
    }

    res.json({ success: true, data: { ...report, attachments: signed } });
  } catch (error) {
    console.error('Get by reservation error:', error);
    res.status(500).json(formatError('Failed to fetch report'));
  }
});

module.exports = router;
