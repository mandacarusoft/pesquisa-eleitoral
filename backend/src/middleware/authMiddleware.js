import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            mensagem: 'Token de autenticação não informado.'
        });
    }

    const partes = authorization.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({
            mensagem: 'Formato do token inválido'
        });
    }
    const token = partes[1];

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.usuario = payload;

        next();
    } catch (error) {
        return res.status(401).json({
            mensagem: 'Token inválidos ou expirado.'
        });
    }
}