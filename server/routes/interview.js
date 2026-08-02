const express = require('express');
const router = express.Router();
const { generateQuestion, evaluateAnswer } = require('../services/aiService');
const { saveAttempt, getHistory, getStats } = require('../db/database');

const MAX_POSITION_WORDS = 10;

function isValidPosition(position) {
  if (!position || typeof position !== 'string') return false;
  const trimmed = position.trim();
  if (trimmed.length === 0) return false;
  const wordCount = trimmed.split(/\s+/).length;
  return wordCount <= MAX_POSITION_WORDS;
}

router.post('/question', async (req, res) => {
  const { position, level } = req.body;

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: `Zadaj pozíciu (max ${MAX_POSITION_WORDS} slov)` });
  }

  try {
    const question = await generateQuestion(position.trim(), level);
    res.json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nepodarilo sa vygenerovať otázku' });
  }
});

router.post('/answer', async (req, res) => {
  const { question, answer, position, level } = req.body;

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: `Zadaj pozíciu (max ${MAX_POSITION_WORDS} slov)` });
  }

  if (!answer || answer.trim().length === 0) {
    return res.status(400).json({ error: 'Odpoveď nesmie byť prázdna' });
  }

  try {
    const feedback = await evaluateAnswer(question, answer, position.trim(), level);

    saveAttempt({
      sessionId: req.sessionId,
      position: position.trim(),
      question,
      answer,
      score: feedback.score,
      strengths: feedback.strengths,
      improvements: feedback.improvements
    });

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nepodarilo sa vyhodnotiť odpoveď' });
  }
});

router.get('/history', (req, res) => {
  try {
    const history = getHistory(req.sessionId);
    const stats = getStats(req.sessionId);
    res.json({ history, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nepodarilo sa načítať históriu' });
  }
});

module.exports = router;