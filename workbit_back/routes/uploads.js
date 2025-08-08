const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB

// POST /api/uploads/report-image - upload a single image to Supabase Storage (reports bucket)
router.post('/report-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Storage not configured' });
    }

    const userId = req.user.id;
    const reservationId = req.body.reservation_id || 'general';
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const path = `${userId}/${reservationId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage.from('reports').upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ success: false, error: 'Failed to upload image' });
    }

    // Return the storage path; client will send it to /api/reports
    res.json({ success: true, data: { file_url: path, content_type: req.file.mimetype, size: req.file.size, storage_provider: 'supabase' } });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

module.exports = router;
