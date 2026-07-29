const express = require('express');
const router = express.Router();
const { generateQuestion, evaluateAnswer } = require('../services/aiService');

const positions = ['frontend', 'backend', 'fullstack'];

router.get('/positions', (req, res) => {
  res.json({ positions });
});

router.get('/questions/:position', async (req, res) => {
  const { position } = req.params;
  const { level } = req.query; // napr. ?level=medior

  if (!positions.includes(position)) {
    return res.status(404).json({ error: 'Pozícia neexistuje' });
  }

  try {
    const question = await generateQuestion(position, level);
    res.json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nepodarilo sa vygenerovať otázku' });
  }
});

router.post('/answer', async (req, res) => {
  const { question, answer, position, level } = req.body;

  if (!answer || answer.trim().length === 0) {
    return res.status(400).json({ error: 'Odpoveď nesmie byť prázdna' });
  }

  try {
    const feedback = await evaluateAnswer(question, answer, position, level);
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nepodarilo sa vyhodnotiť odpoveď' });
  }
});

module.exports = router;