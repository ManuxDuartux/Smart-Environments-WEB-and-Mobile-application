const db = require('../config/db');

// Obter ambientes associados a um utilizador
const getUserEnvironments = async (req, res) => {
  try {
    const { environmentId } = req.params; // Atualizei para refletir o parâmetro na rota

    const [rows] = await db.execute(
      `SELECT a.* 
       FROM ambiente a
       JOIN assocutilizadorambiente aua ON aua.id_ambiente = a.id_ambiente
       WHERE aua.id_ambiente = ?`,
      [environmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum ambiente encontrado para o id fornecido.' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ambientes do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// Associar utilizador a um ambiente
const associateUserToEnvironment = async (req, res) => {
  try {
    const { id_utilizador, id_ambiente, funcao } = req.body;

    if (!id_utilizador || !id_ambiente) {
      return res.status(400).json({ message: 'id_utilizador e id_ambiente são obrigatórios.' });
    }

    // Verifica se já existe associação
    const [exists] = await db.execute(
      'SELECT * FROM assocutilizadorambiente WHERE id_utilizador = ? AND id_ambiente = ?',
      [id_utilizador, id_ambiente]
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: 'Associação já existente.' });
    }

    // Criar nova associação
    await db.execute(
      'INSERT INTO assocutilizadorambiente (id_utilizador, id_ambiente, funcao) VALUES (?, ?, ?)',
      [id_utilizador, id_ambiente, funcao || null]
    );

    res.status(201).json({ message: 'Utilizador associado ao ambiente com sucesso.' });
  } catch (error) {
    console.error('Erro ao associar utilizador ao ambiente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// Atualizar incidência de utilizador em ambiente
const updateUserIncidence = async (req, res) => {
  try {
    const { id_utilizador, id_ambiente, percentagem_inc } = req.body;

    if (!id_utilizador || !id_ambiente || !percentagem_inc) {
      return res.status(400).json({ message: 'id_utilizador, id_ambiente e percentagem_inc são obrigatórios.' });
    }

    // Atualiza a percentagem de incidência
    await db.execute(
      'UPDATE assocutilizadorambiente SET percentagem_inc = ? WHERE id_utilizador = ? AND id_ambiente = ?',
      [percentagem_inc, id_utilizador, id_ambiente]
    );

    res.status(200).json({ message: 'Percentagem de incidência atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar percentagem de incidência:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// Atribuir perfil ao utilizador em ambiente
const assignUserProfile = async (req, res) => {
  try {
    const { id_utilizador, id_ambiente, perfil } = req.body;

    if (!id_utilizador || !id_ambiente || !perfil) {
      return res.status(400).json({ message: 'id_utilizador, id_ambiente e perfil são obrigatórios.' });
    }

    // Atribui o perfil ao utilizador no ambiente
    await db.execute(
      'UPDATE assocutilizadorambiente SET funcao = ? WHERE id_utilizador = ? AND id_ambiente = ?',
      [perfil, id_utilizador, id_ambiente]
    );

    res.status(200).json({ message: 'Função atribuída com sucesso ao utilizador no ambiente.' });
  } catch (error) {
    console.error('Erro ao atribuir perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

const getUsersWithIncidenceByEnvironment = async (req, res) => {
  try {
    const { id_ambiente } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        u.id_utilizador, 
        u.nome, 
        u.email, 
        aua.percentagem_inc AS percentagem,
        aua.funcao,
        CASE 
          WHEN a.id_utilizador_criador = u.id_utilizador THEN 1
          ELSE 0
        END AS isOwner
      FROM utilizador u
      INNER JOIN assocutilizadorambiente aua ON aua.id_utilizador = u.id_utilizador
      INNER JOIN ambiente a ON a.id_ambiente = aua.id_ambiente
      WHERE aua.id_ambiente = ?
    `, [id_ambiente]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar utilizadores do ambiente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// Obter ambientes por utilizador
const getEnvironmentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.execute(
      `SELECT a.*
       FROM ambiente a
       INNER JOIN assocutilizadorambiente aua ON a.id_ambiente = aua.id_ambiente
       WHERE aua.id_utilizador = ?`,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ambientes do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


module.exports = {
  getUserEnvironments,
  associateUserToEnvironment,
  updateUserIncidence,
  assignUserProfile,
  getUsersWithIncidenceByEnvironment,
  getEnvironmentsByUserId
};
