import express from 'express';

import { criar, listar, buscarPorId } from '../controllers/usuarioController.js';

import { autenticar } from '../middleware/authMiddleware.js';
import { exigirRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', autenticar, exigirRole('admin'), criar);
router.get('/', autenticar,exigirRole('admin'), listar);
router.get('/:id',autenticar,exigirRole('admin'), buscarPorId);

export default router;