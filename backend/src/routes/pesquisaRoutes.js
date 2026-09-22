import express from 'express';

import {
    criar,
    listar,
    buscarMaisRecente,
    listarPorCargo,
    buscarPorId,
    atualizar,
    alterarStatus,
    encerrar
} from '../controllers/pesquisaController.js';

const router = express.Router();

router.post('/', criar);
router.get('/', listar);
router.get('/recente', buscarMaisRecente);
router.get('/cargo/:cargo', listarPorCargo);
router.get('/:id', buscarPorId);
router.put('/:id', atualizar);
router.patch('/:id/status', alterarStatus);
router.patch('/:id/encerrar', encerrar);

export default router;
