const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/preferencias
router.post('/', async (req, res) => {
  const { id_utilizador, preferencias, id_ambiente } = req.body;

  if (!id_utilizador || !Array.isArray(preferencias) || !id_ambiente) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  const connection = await pool.getConnection();

  try {
  await connection.beginTransaction();

  for (const pref of preferencias) {
    const { id_tipo_preferencia, valor } = pref;

    if (!id_utilizador || !id_tipo_preferencia || valor == null || !id_ambiente) {
      throw new Error('Dados em falta no loop: ' + JSON.stringify({ id_utilizador, id_tipo_preferencia, valor, id_ambiente }));
    }

    const [result] = await connection.query(
      `
      INSERT INTO cartao_preferencias (id_utilizador, id_tipo_preferencia, valor, id_ambiente)
      VALUES (?, ?, ?, ?)
      `,
      [id_utilizador, id_tipo_preferencia, valor, id_ambiente]
    );

    const id_preferencia = result.insertId;

    await connection.query(
      `
      INSERT IGNORE INTO definepreferencias (id_utilizador, id_preferencia)
      VALUES (?, ?)
      `,
      [id_utilizador, id_preferencia]
    );
  }

  await connection.commit();
  res.status(200).json({ message: 'Preferências guardadas com sucesso.' });
} catch (error) {
  await connection.rollback();
  console.error('❌ ERRO DETALHADO AO GUARDAR:', error);
  res.status(500).json({ message: 'Erro interno ao guardar preferências.', erro: error.message });
}
 finally {
    connection.release();
  }
});

// GET /api/preferencias/tipos → retorna todos os tipos de preferência existentes
router.get('/tipos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_preferencia');
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Erro ao buscar tipos de preferência:', err);
    res.status(500).json({ message: 'Erro interno ao buscar tipos de preferência.' });
  }
});

// GET /api/preferencias/ultimas?userId=1&ambienteId=2
router.get('/ultimas', async (req, res) => {
  const { userId, ambienteId } = req.query;

  if (!userId || !ambienteId) {
    return res.status(400).json({ message: 'Parâmetros ausentes.' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT cp.id_tipo_preferencia, cp.valor
      FROM cartao_preferencias cp
      INNER JOIN (
        SELECT id_utilizador, id_tipo_preferencia, MAX(id_preferencia) AS max_id
        FROM cartao_preferencias
        WHERE id_utilizador = ? AND id_ambiente = ?
        GROUP BY id_tipo_preferencia
      ) ultimos ON cp.id_preferencia = ultimos.max_id
    `, [userId, ambienteId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar últimas preferências:', error);
    res.status(500).json({ message: 'Erro ao buscar últimas preferências.' });
  }
});


module.exports = router;
