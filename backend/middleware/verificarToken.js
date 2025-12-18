const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token de autenticação ausente ou inválido' });
  }
  
  const token = authHeader.split(' ')[1]; // "Bearer <token>"

  try {
    //console.log("JWT_SECRET:", process.env.JWT_SECRET);  // Verificação do segredo JWT

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // opcional: guardar o ID do utilizador no request
    next(); // continuar para o controller
  } catch (error) {
    return res.status(401).json({ message: 'Token de autenticação ausente ou inválido' });
  }
};

module.exports = verificarToken;
