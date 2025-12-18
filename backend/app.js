const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config({ path: './.env' });
const pool = require('./config/db'); // importa a pool de ligações

// Middlewares
app.use(cors());
app.use(express.json()); // para aceitar JSON nos requests

// Importar as rotas
const authRoutes = require('./routes/authRoutes');
const environmentRoutes = require('./routes/environmentRoutes');
const userEnvironmentRoutes = require('./routes/userEnvironmentRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Usar as rotas
app.use('/api/auth', authRoutes);
app.use('/api/preferencias', preferencesRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/user-environment', userEnvironmentRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/admin', adminRoutes);
// Exportar a aplicação sem iniciar o servidor para os testes
module.exports = app;

// Iniciar o servidor, mas apenas quando for executado no ambiente real
if (require.main === module) {
  const PORT = process.env.PORT || 3001;

  (async () => {
    try {
      const connection = await pool.getConnection();
      await connection.ping(); // Testar a ligação à BD
      console.log('✅ Ligação à base de dados estabelecida com sucesso!');
      connection.release();

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor a correr na porta ${PORT}`);
      });
    } catch (err) {
      console.error('❌ Erro ao ligar à base de dados:', err.message);
      process.exit(1); // Termina se falhar a ligação
    }
  })();
}
