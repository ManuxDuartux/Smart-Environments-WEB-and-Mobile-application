const express = require('express');
const router = express.Router();
const { 
  getUsersWithIncidenceByEnvironment,
  associateUserToEnvironment, // Renomeado para corresponder ao controlador correto
  getUserEnvironments, // Renomeado para corresponder ao controlador correto
  updateUserIncidence, 
  assignUserProfile,
  getEnvironmentsByUserId
} = require('../controllers/userEnvironmentController');
const verificarToken = require('../middleware/verificarToken');

// Rota para adicionar um utilizador ao ambiente
router.post('/add', verificarToken, associateUserToEnvironment); // Função corrigida para adicionar utilizador

// Rota para listar utilizadores em um ambiente
router.get('/:environmentId/users', verificarToken, getUserEnvironments); // Função corrigida para obter ambientes

router.get('/users/:id_ambiente', verificarToken, getUsersWithIncidenceByEnvironment);


// Rota para atualizar a percentagem de incidência de um utilizador em um ambiente
router.put('/update-incidence', verificarToken, updateUserIncidence);

// Rota para atribuir um perfil a um utilizador em um ambiente
router.put('/assign-profile', verificarToken, assignUserProfile);

router.get('/by-user/:userId', verificarToken, getEnvironmentsByUserId);

module.exports = router;
