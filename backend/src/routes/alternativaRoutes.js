import express from 'express';

import { criar, listarPorPergunta, buscarPorId, atualizar, excluir } from '../controllers/alternativaController.js';
import { autenticar } from '../middleware/authMiddleware.js'
import { exigirRole } from '../middleware/roleMiddleware.js'

const router = express.Router();

router.post('/', autenticar, exigirRole('admin'), criar);
router.get('/pergunta/:perguntaId', autenticar, listarPorPergunta);
router.get('/:id', autenticar, buscarPorId);
router.put('/:id', autenticar, exigirRole, atualizar);
router.delete('/:id', autenticar, exigirRole, excluir);

export default router;