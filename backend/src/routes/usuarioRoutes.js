import express from 'express';

import { criar, listar, buscarPorId } from '../controllers/usuarioController.js';

const router = express.Router();

router.post('/', criar);
router.get('/', listar);
router.get('/id', buscarPorId);

export default router;