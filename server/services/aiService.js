require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3-flash' });

async function generateQuestion(position, level = 'junior') {
  const angles = [
    'praktickú skúsenosť a konkrétny príklad z minulosti',
    'riešenie problému alebo náročnej situácie',
    'odborné znalosti potrebné pre túto prácu',
    'prácu v tíme alebo komunikáciu s ľuďmi',
    'motiváciu a prístup k práci',
    'zvládanie stresu alebo tlaku',
    'organizáciu práce a prioritizáciu úloh'
  ];
  const randomAngle = angles[Math.floor(Math.random() * angles.length)];
  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `Si skúsený personalista/interviewer, ktorý pripravuje pohovory pre RÔZNE profesie naprieč všetkými odvetviami (nielen IT – môže ísť o remeslo, gastro, administratívu, zdravotníctvo, obchod, manažment atď.).

Pozícia, na ktorú sa vedie pohovor: "${position}"
Úroveň skúseností: "${level}"

Vygeneruj JEDNU otázku, ktorá sa zameriava na: ${randomAngle}.
Otázka má byť taká, aká by na reálnom pohovore na túto pozíciu naozaj odznela.

[seed: ${randomSeed}]

Odpovedz IBA samotnou otázkou, bez úvodu, bez úvodzoviek, bez čísla.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 1.2,
      topP: 0.95
    }
  });

  return result.response.text().trim();
}

async function evaluateAnswer(question, answer, position, level = 'junior') {
  const prompt = `Si skúsený, ale ĽUDSKÝ a PODPORUJÚCI personalista/kouč, ktorý pomáha kandidátovi TRÉNOVAŤ sa na pohovor pre pozíciu "${position}" (úroveň: ${level}). Toto NIE JE ostrý pohovor s vysokými sadzbami – je to bezpečný tréningový priestor, kde sa človek učí a zlepšuje.

Otázka: "${question}"
Odpoveď kandidáta: "${answer}"

Hodnoť primerane a spravodlivo, nie prehnane prísne. Pamätaj, že ide o hovorenú/písanú odpoveď v reálnom čase, nie o dokonale vyladený text. Drobné nedostatky v štýle nie sú dôvod na nízke skóre, ak je obsah odpovede v poriadku.

Škála skóre:
- 8-10: odpoveď je vecná, relevantná a ukazuje, že kandidát vie o čom hovorí
- 5-7: odpoveď je v poriadku, ale dá sa doplniť alebo spresniť
- 1-4: odpoveď úplne obchádza otázku, je prázdna alebo irelevantná

Vráť VÝHRADNE JSON objekt v tomto presnom formáte, bez akéhokoľvek iného textu, bez markdown bločkov:
{
  "score": <číslo 1-10>,
  "strengths": "<čo bolo v odpovedi dobré, 1-2 vety, konkrétne a povzbudivo>",
  "improvements": "<konkrétny návrh na zlepšenie, 1-2 vety, konštruktívne>"
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7
    }
  });

  let rawText = result.response.text().trim();
  rawText = rawText.replace(/```json\s*|\s*```/g, '').trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('Chyba pri parsovaní AI odpovede:', rawText);
    throw new Error('AI vrátilo neplatný formát odpovede');
  }
}

module.exports = { generateQuestion, evaluateAnswer };