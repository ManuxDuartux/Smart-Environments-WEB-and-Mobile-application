const express = require('express');
const router = express.Router();
const { createSimulation, getSimulationHistory } = require('../controllers/simulationController');
const verificarToken = require('../middleware/verificarToken');

// Rota para criar simulação
router.post('/start', verificarToken, createSimulation);


router.get('/history/:id_ambiente', verificarToken, getSimulationHistory);

module.exports = router;
