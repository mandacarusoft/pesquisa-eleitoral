import express from 'express';
import { criar, buscarPorId, listarPorPergunta, excluir } from '../controllers/respostaController';

import { autenticar } from '../middleware/authMiddleware.js';
import { exigirRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', autenticar, exigirRole, criar);
router.get('/pergunta/:perguntaId', autenticar, exigirRole, listarPorPergunta);
router.get('/:id', autenticar, exigirRole, buscarPorId);
router.delete('/:id', autenticar, exigirRole, excluir);

export default router;