const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    const [existing] = await pool.execute('SELECT * FROM utilizador WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email já registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO utilizador (nome, email, password) VALUES (?, ?, ?)',
      [nome, email, hashedPassword]
    );

    const token = jwt.sign({ userId: result.insertId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const user = {
      id_utilizador: result.insertId,
      nome,
      email
    };

    res.status(201).json({ message: 'Utilizador registado com sucesso', token, user });
  } catch (err) {
    console.error('❌ Erro detalhado ao registar:', err);
    res.status(500).json({ message: 'Erro ao registar o utilizador', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica se é o admin
    if (email === 'admin@gmail.com' && password === 'admin') {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
      return res.status(200).json({
        message: 'Login admin bem-sucedido',
        token,
        user: {
          nome: 'Administrador',
          email,
          role: 'admin'
        }
      });
    }

    const [rows] = await pool.execute('SELECT * FROM utilizador WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }

    const token = jwt.sign({ userId: user.id_utilizador, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    delete user.password;

    res.status(200).json({ message: 'Login bem-sucedido', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login', error: err.message });
  }
};

module.exports = { register, login };
