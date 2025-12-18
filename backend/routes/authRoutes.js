const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const pool = require('../config/db');
const passport = require('passport');

require('../auth/googleAuth'); // <- caminho para o ficheiro acima

router.post('/register', register);
router.post('/login', login);
router.get('/all-users', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id_utilizador, nome, email FROM utilizador');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar utilizadores' });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: req.user.id_utilizador, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/login?token=${token}&nome=${encodeURIComponent(req.user.nome)}`);
  });



module.exports = router;
