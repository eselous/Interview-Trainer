require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

async function generateQuestion(position, level = 'junior') {
  const prompt = `Si skúsený technický interviewer. Vygeneruj JEDNU interview otázku pre pozíciu "${position}" na úrovni "${level}".
Otázka má byť konkrétna, technická a primeraná danej úrovni.
Odpovedz IBA samotnou otázkou, bez úvodu, bez úvodzoviek, bez čísla.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function evaluateAnswer(question, answer, position, level = 'junior') {
  const prompt = `Si skúsený technický interviewer pre pozíciu "${position}" (úroveň: ${level}).

Otázka: "${question}"
Odpoveď kandidáta: "${answer}"

Vyhodnoť odpoveď a vráť VÝHRADNE JSON objekt v tomto presnom formáte, bez akéhokoľvek iného textu, bez markdown bločkov:
{
  "score": <číslo 1-10>,
  "strengths": "<čo bolo v odpovedi dobré, 1-2 vety>",
  "improvements": "<konkrétny návrh na zlepšenie, 1-2 vety>"
}`;

  const result = await model.generateContent(prompt);
  let rawText = result.response.text().trim();

  // Gemini niekedy zabalí JSON do ```json bloku, aj keď o to nežiadaš
  rawText = rawText.replace(/```json\s*|\s*```/g, '').trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('Chyba pri parsovaní AI odpovede:', rawText);
    throw new Error('AI vrátilo neplatný formát odpovede');
  }
}

module.exports = { generateQuestion, evaluateAnswer };