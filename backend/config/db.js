require('dotenv').config({ path: './.env' }); // Caminho correto para o .env
const mysql = require('mysql2/promise');

// Verificar se as variáveis de ambiente estão sendo carregadas corretamente
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);  // Não exibir senhas em produção
console.log('DB_NAME:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',  // Usando a senha do .env ou vazio
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

module.exports = pool;
