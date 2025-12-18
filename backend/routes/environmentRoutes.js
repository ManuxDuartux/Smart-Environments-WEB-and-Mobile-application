const express = require('express');
const router = express.Router();
const { createEnvironment, getEnvironments, getEnvironmentById } = require('../controllers/environmentController');
const verificarToken = require('../middleware/verificarToken');

// PROTEGIDA
router.post('/create', verificarToken, createEnvironment);

// SE FOR PARA LISTAR AMBIENTES DO UTILIZADOR LOGADO
router.get('/list', verificarToken, getEnvironments);

router.get('/:id', verificarToken, getEnvironmentById);

module.exports = router;
