import express from 'express';
import { upload } from '../../middlewares/upload.js';
import { compressPdf } from './pdf.controller.js';

const router = express.Router();

// Matches the fetch call from the frontend: POST /api/pdf/compress
router.post('/compress', upload.single('pdf'), compressPdf);

export default router;