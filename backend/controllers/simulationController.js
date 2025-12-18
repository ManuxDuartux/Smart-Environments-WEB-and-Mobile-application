const db = require('../config/db');

// Função para arredondar para .0 ou .5
function roundToNearestHalf(value) {
  return Math.round(value * 2) / 2;
}

// Criar simulação com cálculo ideal
const createSimulation = async (req, res) => {
  try {
    const { id_ambiente, utilizadoresSelecionados, guestPreferences = [] } = req.body;

    if (!id_ambiente || !Array.isArray(utilizadoresSelecionados)) {
      return res.status(400).json({ message: 'Dados inválidos.' });
    }

    // Inserir simulação
    const [simResult] = await db.execute(
      'INSERT INTO simulacao (id_ambiente, data) VALUES (?, NOW())',
      [id_ambiente]
    );
    const id_simulacao = simResult.insertId;

    // Obter tipos de preferência
    const [tipoPreferencias] = await db.execute('SELECT * FROM tipo_preferencia');

    const resultadosCalculados = [];
    const detalhes = [];
    const todosContribuidores = new Map();

    for (const pref of tipoPreferencias) {
      const id_tipo_preferencia = pref.id_tipo_preferencia;

      const [valoresRegistados] = utilizadoresSelecionados.length > 0
        ? await db.execute(
            `SELECT cp.valor, aua.percentagem_inc, u.nome
             FROM cartao_preferencias cp
             INNER JOIN (
               SELECT MAX(id_preferencia) AS max_id
               FROM cartao_preferencias
               WHERE id_utilizador IN (${utilizadoresSelecionados.map(() => '?').join(',')})
                 AND id_tipo_preferencia = ?
                 AND id_ambiente = ?
               GROUP BY id_utilizador
             ) latest ON cp.id_preferencia = latest.max_id
             JOIN assocutilizadorambiente aua ON cp.id_utilizador = aua.id_utilizador
             JOIN utilizador u ON u.id_utilizador = cp.id_utilizador
             WHERE cp.id_ambiente = ? AND aua.id_ambiente = ?`,
            [...utilizadoresSelecionados, id_tipo_preferencia, id_ambiente, id_ambiente, id_ambiente]
          )
        : [[]];

      const valoresGuest = Array.isArray(guestPreferences)
        ? guestPreferences.flatMap(g =>
            g.preferencias
              .filter(p => p.id_tipo_preferencia === id_tipo_preferencia)
              .map(p => ({
                nome: g.nome || 'Guest',
                valor: p.valor,
                percentagem_inc: p.percentagem_inc
              }))
          )
        : [];

      const todosValores = [
        ...valoresRegistados.map(v => ({ nome: v.nome, valor: v.valor, peso: v.percentagem_inc })),
        ...valoresGuest.map(g => ({ nome: g.nome, valor: g.valor, peso: g.percentagem_inc }))
      ];

      // Guardar contribuidores únicos
      for (const { nome, peso } of todosValores) {
        if (!todosContribuidores.has(nome)) {
          todosContribuidores.set(nome, peso);
        }
      }

      let total = 0;
      let totalPeso = 0;
      for (const { valor, peso } of todosValores) {
        total += valor * (peso / 100);
        totalPeso += (peso / 100);
      }
         //formula
      //let valor_calculado = totalPeso > 0 ? total / totalPeso : 0;
      //valor_calculado = roundToNearestHalf(valor_calculado);
      //valor_calculado = Math.min(Math.max(valor_calculado, pref.valor_minimo), pref.valor_maximo);

      //IA
      let valor_calculado = await preverComIA(todosValores, pref);
valor_calculado = roundToNearestHalf(valor_calculado);
valor_calculado = Math.min(Math.max(valor_calculado, pref.valor_minimo), pref.valor_maximo);


      await db.execute(
        'INSERT INTO simulacao_valores (id_simulacao, id_tipo_preferencia, valor_calculado) VALUES (?, ?, ?)',
        [id_simulacao, id_tipo_preferencia, valor_calculado]
      );

      const translate = {
        'Temperatura': 'Temperature',
        'Luminosidade': 'Luminosity',
        'Humidade': 'Humidity'
      };

      resultadosCalculados.push({
        nome: translate[pref.nome] || pref.nome,
        valor_calculado: parseFloat(valor_calculado.toFixed(1)),
        unidades_preferencia: pref.unidades_preferencia
      });

      const formulaComponentes = todosValores
        .filter(({ valor, peso }) => valor != null && peso != null)
        .map(({ valor, peso }) => `(${valor} × ${peso}%)`);

      const formulaStr = formulaComponentes.length > 0
        ? formulaComponentes.join(' + ') + ` ÷ ${todosValores.reduce((acc, curr) => acc + (curr.peso || 0), 0)}%`
        : 'N/A';

      detalhes.push({
        nome: translate[pref.nome] || pref.nome,
        unidade: pref.unidades_preferencia,
        contribuidores: todosValores.map(v => ({
          nome: v.nome,
          valor: v.valor,
          peso: v.peso
        })),
        formula: formulaStr
      });
    }

    // Inserir contribuidores únicos
    for (const [nome, percentagem_inc] of todosContribuidores.entries()) {
      await db.execute(
        'INSERT INTO simulacao_contribuidor (id_simulacao, nome, percentagem_inc) VALUES (?, ?, ?)',
        [id_simulacao, nome, percentagem_inc]
      );
    }

    console.log('🧠 Detalhes a enviar:', detalhes);
    res.status(201).json({
      message: 'Simulação criada com sucesso.',
      valoresCalculados: resultadosCalculados,
      detalhes
    });

  } catch (err) {
    console.error('Erro ao criar simulação:', err);
    res.status(500).json({ message: 'Erro ao criar simulação', error: err.message });
  }
};

const preverComIA = async (valores, tipoPreferencia) => {
  // Exemplo mock: IA prevê com base em média ponderada (para já)
  let total = 0;
  let totalPeso = 0;
  for (const { valor, peso } of valores) {
    total += valor * (peso / 100);
    totalPeso += peso / 100;
  }
  return totalPeso > 0 ? total / totalPeso : 0;
};


// Histórico de simulações
const getSimulationHistory = async (req, res) => {
  const { id_ambiente } = req.params;

  try {
    const [simulacoes] = await db.execute(`
      SELECT s.id_simulacao, s.data,
             sv.id_tipo_preferencia, sv.valor_calculado,
             tp.nome AS nome_preferencia, tp.unidades_preferencia
      FROM simulacao s
      JOIN simulacao_valores sv ON s.id_simulacao = sv.id_simulacao
      JOIN tipo_preferencia tp ON sv.id_tipo_preferencia = tp.id_tipo_preferencia
      WHERE s.id_ambiente = ?
      ORDER BY s.data DESC
    `, [id_ambiente]);

    const [contribuidores] = await db.execute(`
      SELECT id_simulacao, nome, percentagem_inc
      FROM simulacao_contribuidor
      WHERE id_simulacao IN (
        SELECT id_simulacao FROM simulacao WHERE id_ambiente = ?
      )
    `, [id_ambiente]);

    const grouped = simulacoes.reduce((acc, sim) => {
      if (!acc[sim.id_simulacao]) {
        acc[sim.id_simulacao] = {
          id_simulacao: sim.id_simulacao,
          data: sim.data,
          preferencias: [],
          contribuidores: []
        };
      }
      acc[sim.id_simulacao].preferencias.push({
        nome: sim.nome_preferencia,
        valor: sim.valor_calculado,
        unidade: sim.unidades_preferencia
      });
      return acc;
    }, {});

    for (const c of contribuidores) {
      if (grouped[c.id_simulacao]) {
        grouped[c.id_simulacao].contribuidores.push({
          nome: c.nome,
          percentagem: c.percentagem_inc
        });
      }
    }

    res.status(200).json(Object.values(grouped));
  } catch (err) {
    console.error('Erro ao recuperar histórico:', err);
    res.status(500).json({ message: 'Erro ao recuperar histórico.' });
  }
};

module.exports = { createSimulation, getSimulationHistory };
