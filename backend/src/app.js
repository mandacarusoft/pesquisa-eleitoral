import express from 'express';
import cors from 'cors';
import usuarioRouters from './routes/usuarioRoutes.js';
import pesquisaRouters from './routes/pesquisaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API Pesquisa Eleitoral funcionando!'
    });
});

app.use('/api/usuarios', usuarioRouters);
app.use('/api/pesquisas', pesquisaRouters);

export default app;