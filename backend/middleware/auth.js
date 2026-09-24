import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-dev-troque-em-producao';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

export function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erro: 'Token nao fornecido' });
  const token = header.replace('Bearer ', '');
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token invalido ou expirado' });
  }
}

export function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (!req.usuario || !papeis.includes(req.usuario.papel)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil' });
    }
    next();
  };
}
