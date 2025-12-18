const pool = require('../config/db');

const getEnvironments = async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.execute(
      `SELECT a.*
       FROM ambiente a
       JOIN assocutilizadorambiente aua ON a.id_ambiente = aua.id_ambiente
       WHERE aua.id_utilizador = ?`,
      [userId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Erro ao listar ambientes:', err);
    res.status(500).json({ message: 'Erro ao listar ambientes', error: err.message });
  }
};

const getEnvironmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [rows] = await pool.execute(
      `SELECT a.*
       FROM ambiente a
       JOIN assocutilizadorambiente aua ON a.id_ambiente = aua.id_ambiente
       WHERE a.id_ambiente = ? AND aua.id_utilizador = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ambiente não encontrado' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar ambiente por ID:', err);
    res.status(500).json({ message: 'Erro ao buscar ambiente', error: err.message });
  }
};

const createEnvironment = async (req, res) => {
  try {
    const { nome, id_tipo } = req.body;
    const userId = req.userId;

    console.log("Recebendo dados:", nome, id_tipo); 

    if (!nome) {
      return res.status(400).json({ message: 'Nome do ambiente é obrigatório' });
    }

    if (!id_tipo) {
      return res.status(400).json({ message: 'Tipo de ambiente é obrigatório' });
    }

    // Verifica duplicação
    const [existing] = await pool.execute(
      `SELECT a.*
       FROM ambiente a
       JOIN assocutilizadorambiente aua ON a.id_ambiente = aua.id_ambiente
       WHERE a.nome = ? AND aua.id_utilizador = ?`,
      [nome, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ambiente com esse nome já existe' });
    }

    // Verifica se o tipo de ambiente existe
    const [tipoRows] = await pool.execute(
      'SELECT * FROM tipo_ambiente WHERE id_tipo = ?',
      [id_tipo]
    );

    if (tipoRows.length === 0) {
      return res.status(400).json({ message: 'Tipo de ambiente inválido' });
    }

    // Cria o ambiente com id_utilizador_criador
const [result] = await pool.execute(
  'INSERT INTO ambiente (nome, id_tipo, id_utilizador_criador) VALUES (?, ?, ?)',
  [nome, id_tipo, userId]
);

const ambienteId = result.insertId;

// Associa o criador como "owner" e define percentagem inicial
await pool.execute(
  'INSERT INTO assocutilizadorambiente (id_utilizador, id_ambiente, funcao, percentagem_inc) VALUES (?, ?, ?, ?)',
  [userId, ambienteId, 'owner', 30]
);

    res.status(201).json({
      id_ambiente: ambienteId, 
      nome,
      id_tipo,
    });
  } catch (err) {
    console.error('Erro ao criar ambiente:', err);
    res.status(500).json({ message: 'Erro ao criar ambiente', error: err.message });
  }
};

// Exporta todas as funções necessárias
module.exports = { createEnvironment, getEnvironments, getEnvironmentById };
