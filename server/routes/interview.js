const express = require('express');
const router = express.Router();
const questions = require('../data/questions');

// Vráti zoznam dostupných pozícií
router.get('/positions', (req, res) => {
    const positions = Object.keys(questions);
    res.json({ positions });
});

// Vráti náhodnú otázku pre danú pozíciu
router.get('/questions/:position', (req, res) => {
    const { position } = req.params;
    const pool = questions[position];

    if (!pool) {
        return res.status(404).json({ error: 'Pozícia neexistuje' });
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    res.json({ question: pool[randomIndex] });
});

// Zatiaľ fake vyhodnotenie odpovede (len pre demonštráciu)
router.post('/answer', (req,res) => {
    const { question, answer } = req.body;

    if (!answer || answer.trim().length === 0) {
        return res.status(400).json ({ error: 'Odpoveď nemôže byť prázdna' });
    }

    // Placeholder logika na vyhodnotenie odpovede pomocou LLM
    const fakeFeedback = {
        score: Math.floor(Math.random() * 5) + 1, // 1-5 hodnotenie
        strengths: "Odpoveď obsahuje správne kľúčové body.",
        improvements: "Skús rozviť odpoveď s konkrétnymi príkladmi."
    };
    
    res.json(fakeFeedback);
});

module.exports = router;