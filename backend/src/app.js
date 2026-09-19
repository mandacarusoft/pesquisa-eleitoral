import express from 'express';
import cors from 'cors';

import usuarioRouters from './routes/usuarioRoutes.js';
import authRoutes from './routes/authRoutes.js';


const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.json({
        mensagem: 'API Pesquisa Eleitoral funcionando!'
    });
});

app.use('/api/usuarios', usuarioRouters);
app.use('/api/auth', authRoutes);


export default app;