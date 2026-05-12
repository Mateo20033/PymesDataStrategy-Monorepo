const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el JWT enviado en el header Authorization.
 * O permite peticiones server-to-server usando x-api-key.
 * Si el token es válido adjunta el payload decodificado en req.user.
 */
const authMiddleware = (req, res, next) => {
  // S2S API Key bypass for internal microservice communication
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === (process.env.INTERNAL_API_KEY || 'pymes-internal-s2s-secret')) {
    req.user = { id: 1, email: 'system@pymes.internal', rol: 'admin', s2s: true }; // Dummy user for S2S
    return next();
  }

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, email, rol, iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token expirado'
        : 'Token inválido';

    return res.status(401).json({ success: false, message });
  }
};

module.exports = authMiddleware;
