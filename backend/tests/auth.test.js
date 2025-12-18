const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

let token;
let testEmail;
let environmentId;
let userId;

beforeAll(async () => {
  // Verifica a conexão
  await pool.query('SELECT 1');

  // Email único
  testEmail = `testuser_${Date.now()}@example.com`;

  // Registar utilizador
  const resRegister = await request(app)
    .post('/api/auth/register')
    .send({
      nome: 'Test User',
      email: testEmail,
      password: 'password123',
    });

  // Guardar token e userId
  token = resRegister.body.token;
  userId = resRegister.body.userId;
});

afterAll(async () => {
  try {
    // Apagar todas as associações de utilizadores aos ambientes
    await pool.query('DELETE FROM assocutilizadorambiente WHERE id_utilizador = ?', [userId]);

    // Agora, excluir os ambientes relacionados (depois de desvinculá-los)
    await pool.query('DELETE FROM ambiente WHERE nome IN (?, ?)', ['Sala de Reuniões', 'Cozinha']);

    // Excluir o utilizador
    await pool.query('DELETE FROM utilizador WHERE id_utilizador = ?', [userId]);

  } catch (error) {
    console.error("Erro ao limpar os dados de teste:", error);
  } finally {
    // Fechar a conexão
    await pool.end();
  }
});



// Teste de criação de ambiente válido
it('should create a new environment with valid data', async () => {
  const validData = {
    nome: 'Sala de Reuniões',
    id_tipo: 1, // Certifica-te que este tipo existe
  };

  const response = await request(app)
    .post('/api/environment/create')
    .set('Authorization', `Bearer ${token}`)
    .send(validData);

  expect(response.status).toBe(201);
  expect(response.body.nome).toBe(validData.nome);
  expect(response.body.id_tipo).toBe(validData.id_tipo);

  environmentId = response.body.id_ambiente;
});

// Criação com nome em falta
it('should return an error when creating environment with missing name', async () => {
  const response = await request(app)
    .post('/api/environment/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_tipo: 1 });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Nome do ambiente é obrigatório');
});

// Criação com tipo inválido
it('should return an error when creating environment with invalid type', async () => {
  const response = await request(app)
    .post('/api/environment/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Cozinha', id_tipo: 9999 });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Tipo de ambiente inválido');
});

// Criação sem autenticação
it('should return an error when creating environment without authentication', async () => {
  const response = await request(app)
    .post('/api/environment/create')
    .send({ nome: 'Escritório Principal', id_tipo: 2 });

  expect(response.status).toBe(401);
  expect(response.body.message).toBe('Token de autenticação ausente ou inválido');
});

// Criação com nome duplicado
it('should return an error when creating environment with duplicate name', async () => {
  const response = await request(app)
    .post('/api/environment/create')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Sala de Reuniões', id_tipo: 1 });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Ambiente com esse nome já existe');
});

// Listar ambientes do utilizador autenticado
it('should list environments for the authenticated user', async () => {
  const response = await request(app)
    .get('/api/environment/list')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

// Detalhes de ambiente específico
it('should get details of an environment by ID', async () => {
  const response = await request(app)
    .get(`/api/environment/${environmentId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.id_ambiente).toBe(environmentId);
  expect(response.body.nome).toBe('Sala de Reuniões');
});
