// Novo ficheiro: routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Middleware opcional para verificar se o utilizador é admin (a partir do token, se quiseres)

// ---- UTILIZADORES ----
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id_utilizador, nome, email FROM utilizador');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar utilizadores' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Apagar da definepreferencias (preferências definidas pelo utilizador)
    await connection.execute(`
      DELETE FROM definepreferencias
      WHERE id_preferencia IN (
        SELECT id_preferencia FROM cartao_preferencias WHERE id_utilizador = ?
      )
    `, [id]);

    // Apagar de cartao_preferencias
    await connection.execute('DELETE FROM cartao_preferencias WHERE id_utilizador = ?', [id]);

    // Apagar de utilizador_ambiente_perfil
    await connection.execute('DELETE FROM utilizador_ambiente_perfil WHERE id_utilizador = ?', [id]);

   await connection.execute('DELETE FROM hierarquia_perfil WHERE id_perfil = ?', [id]);


    // Apagar associações do utilizador a ambientes
    await connection.execute('DELETE FROM assocutilizadorambiente WHERE id_utilizador = ?', [id]);

    // Apagar simulações em que participou (se aplicável)
    const [simIds] = await connection.execute(`
      SELECT id_simulacao FROM simulacao
      WHERE id_ambiente IN (
        SELECT id_ambiente FROM ambiente
        WHERE id_ambiente IN (
          SELECT id_ambiente FROM assocutilizadorambiente WHERE id_utilizador = ?
        )
      )
    `, [id]);

    const ids = simIds.map(row => row.id_simulacao);
    if (ids.length > 0) {
      await connection.execute(
        `DELETE FROM simulacao_valores WHERE id_simulacao IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      await connection.execute(
        `DELETE FROM simulacao WHERE id_simulacao IN (${ids.map(() => '?').join(',')})`,
        ids
      );
    }

    // Apagar o utilizador
    await connection.execute('DELETE FROM utilizador WHERE id_utilizador = ?', [id]);

    await connection.commit();
    res.json({ message: 'Utilizador e todas as dependências eliminadas com sucesso.' });
  } catch (err) {
    await connection.rollback();
    console.error('Erro ao remover utilizador e dependências:', err);
    res.status(500).json({ message: 'Erro ao remover utilizador e dependências.' });
  } finally {
    connection.release();
  }
});


router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;
    await pool.execute('UPDATE utilizador SET nome = ?, email = ? WHERE id_utilizador = ?', [nome, email, id]);
    res.json({ message: 'Utilizador atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar utilizador.' });
  }
});

// ---- PREFERENCIAS ----
router.get('/preferencias', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tipo_preferencia');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar preferências.' });
  }
});

router.post('/preferencias', async (req, res) => {
  try {
    const { nome, unidades_preferencia, valor_minimo, valor_maximo } = req.body;

    if (
      !nome ||
      !unidades_preferencia ||
      typeof valor_minimo !== 'number' ||
      typeof valor_maximo !== 'number'
    ) {
      return res.status(400).json({ message: 'Dados inválidos ou incompletos.' });
    }

    await pool.execute(
      'INSERT INTO tipo_preferencia (nome, unidades_preferencia, valor_minimo, valor_maximo) VALUES (?, ?, ?, ?)',
      [nome, unidades_preferencia, valor_minimo, valor_maximo]
    );

    res.status(201).json({ message: 'Preferência criada com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar preferência:', err);
    res.status(500).json({ message: 'Erro ao criar preferência.' });
  }
});


router.put('/preferencias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidades_preferencia, valor_minimo, valor_maximo } = req.body;

    await pool.execute(
      'UPDATE tipo_preferencia SET nome = ?, unidades_preferencia = ?, valor_minimo = ?, valor_maximo = ? WHERE id_tipo_preferencia = ?',
      [nome, unidades_preferencia, valor_minimo, valor_maximo, id]
    );

    res.json({ message: 'Preferência atualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar preferência.' });
  }
});


router.delete('/preferencias/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Apagar valores de simulações com esta preferência
    await pool.execute('DELETE FROM simulacao_valores WHERE id_tipo_preferencia = ?', [id]);

    // Apagar cartões de preferência
    await pool.execute('DELETE FROM cartao_preferencias WHERE id_tipo_preferencia = ?', [id]);

    // Apagar a preferência em si
    await pool.execute('DELETE FROM tipo_preferencia WHERE id_tipo_preferencia = ?', [id]);

    res.json({ message: 'Preferência e dependências eliminadas.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao remover preferência.' });
  }
});


// ---- AMBIENTES ----
router.get('/ambientes', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.id_ambiente, a.nome, a.id_tipo, u.id_utilizador AS id_dono, u.email AS nome_dono
      FROM ambiente a
      LEFT JOIN assocutilizadorambiente aua ON a.id_ambiente = aua.id_ambiente
      LEFT JOIN utilizador u ON u.id_utilizador = aua.id_utilizador
      GROUP BY a.id_ambiente
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar ambientes.' });
  }
});

router.delete('/ambientes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar todas as dependências na ordem correta
    await pool.execute('DELETE FROM utilizador_ambiente_perfil WHERE id_ambiente = ?', [id]);

    await pool.execute(`
      DELETE FROM simulacao_valores
      WHERE id_simulacao IN (
        SELECT id_simulacao FROM simulacao WHERE id_ambiente = ?
      )
    `, [id]);

    await pool.execute('DELETE FROM simulacao WHERE id_ambiente = ?', [id]);

    await pool.execute('DELETE FROM assocutilizadorambiente WHERE id_ambiente = ?', [id]);

    await pool.execute('DELETE FROM hierarquia_perfil WHERE id_ambiente = ?', [id]);

    // Por fim, apagar o ambiente
    await pool.execute('DELETE FROM ambiente WHERE id_ambiente = ?', [id]);

    res.json({ message: 'Ambiente e todas as dependências foram apagadas com sucesso.' });
  } catch (err) {
    console.error('Erro ao apagar ambiente e dependências:', err);
    res.status(500).json({ message: 'Erro ao apagar ambiente.', error: err.message });
  }
});

router.put('/ambientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, id_tipo, id_utilizador } = req.body;

    // Atualizar nome e tipo
    await pool.execute('UPDATE ambiente SET nome = ?, id_tipo = ? WHERE id_ambiente = ?', [nome, id_tipo, id]);

    // Atualizar dono
    await pool.execute('DELETE FROM assocutilizadorambiente WHERE id_ambiente = ?', [id]);
    await pool.execute('INSERT INTO assocutilizadorambiente (id_utilizador, id_ambiente) VALUES (?, ?)', [id_utilizador, id]);

    res.json({ message: 'Ambiente atualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar ambiente.' });
  }
});


// GET preferências mais recentes de um utilizador num ambiente
router.get('/preferencias/ultimas/:userId/:ambienteId', async (req, res) => {
  const { userId, ambienteId } = req.params;

  try {
    const [rows] = await pool.execute(`
      SELECT cp.id_tipo_preferencia, cp.valor, tp.nome, tp.unidades_preferencia, tp.valor_minimo, tp.valor_maximo
      FROM cartao_preferencias cp
      JOIN tipo_preferencia tp ON cp.id_tipo_preferencia = tp.id_tipo_preferencia
      INNER JOIN (
        SELECT id_tipo_preferencia, MAX(id_preferencia) AS max_id
        FROM cartao_preferencias
        WHERE id_utilizador = ? AND id_ambiente = ?
        GROUP BY id_tipo_preferencia
      ) ult ON cp.id_preferencia = ult.max_id
    `, [userId, ambienteId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar últimas preferências.' });
  }
});

// POST definir novas preferências (cartão) via admin
router.post('/preferencias/admin', async (req, res) => {
  const { id_utilizador, id_ambiente, preferencias } = req.body;

  if (!id_utilizador || !id_ambiente || !Array.isArray(preferencias)) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const pref of preferencias) {
      const [result] = await conn.query(`
        INSERT INTO cartao_preferencias (id_utilizador, id_tipo_preferencia, valor, id_ambiente)
        VALUES (?, ?, ?, ?)
      `, [id_utilizador, pref.id_tipo_preferencia, pref.valor, id_ambiente]);

      await conn.query(`
        INSERT IGNORE INTO definepreferencias (id_utilizador, id_preferencia)
        VALUES (?, ?)
      `, [id_utilizador, result.insertId]);
    }

    await conn.commit();
    res.status(200).json({ message: 'Preferências atualizadas.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erro ao guardar preferências.' });
  } finally {
    conn.release();
  }
});


module.exports = router;
