require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3-flash' });

async function generateQuestion(position, level = 'junior') {
  const angles = [
    'praktickú skúsenosť a konkrétny príklad z minulosti',
    'riešenie problému alebo náročnej situácie',
    'odborné znalosti potrebné pre túto prácu',
    'prácu v tíme alebo komunikáciu s kolegami',
    'motiváciu a prístup k práci',
    'zvládanie stresu alebo tlaku',
    'organizáciu práce a prioritizáciu úloh'
  ];
  const randomAngle = angles[Math.floor(Math.random() * angles.length)];
  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `Si skúsený personalista/interviewer, ktorý pripravuje pohovory pre RÔZNE profesie naprieč všetkými odvetviami 

  Pozícia, na ktorú sa vedie pohovor: "${position}"
  Úroveň skúseností: "${level}"

  Vygeneruj JEDNU otázku, ktorá sa zameriava na: ${randomAngle}.
  Otázka má byť taká, aká by na reálnom pohovore na túto pozíciu naozaj odznela.

  DÔLEŽITÉ: Vyhni sa otázkam o "veľkom množstve zákazníkov/klientov" alebo zvládaní vysokého objemu zákazníckeho kontaktu 

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
  const prompt = `Si skúsený, ale ĽUDSKÝ a PODPORUJÚCI personalista/kouč, ktorý pomáha kandidátovi TRÉNOVAŤ sa na pohovor pre pozíciu "${position}" (úroveň: ${level}). Toto NIE JE ostrý pohovor s vysokými sadzbami - je to bezpečný tréningový priestor, kde sa človek učí a zlepšuje.

Otázka: "${question}"
Odpoveď kandidáta: "${answer}"

Hodnoť primerane a spravodlivo, nie prísne. Pamätaj, že ide o hovorenú/písanú odpoveď v reálnom čase, nie o dokonale vyladený text. 
Drobné nedostatky v štýle nie sú dôvod na nízke skóre, ak je obsah odpovede v poriadku.
Nedavaj návrhy na zlepšenia mimo obsahu otázky, napr. ako zabezpečiť spokojnosť zákazníka, ak sa na to otázka nepýta.
Ak je odpoveď super, nehľadaj zlepšenia a daj skóre 10.

Škála skóre:
- 10: odpoveď je výborná
- 8-9: odpoveď je vecná, kandidát vie o čom hovorí
- 5-7: odpoveď je v poriadku, ale dá sa doplniť alebo spresniť
- 1-4: odpoveď obchádza otázku, je prázdna, irelevantná alebo slabá

Vráť VÝHRADNE JSON objekt v tomto presnom formáte, bez akéhokoľvek iného textu, bez markdown bločkov:
{
  "score": <číslo 1-10>,
  "strengths": "<čo bolo v odpovedi dobré, 1-2 vety, konkrétne a povzbudivo>",
  "improvements": "<konkrétny návrh na zlepšenie, 1-2 vety, konštruktívne>"
}

Ak je skóre 10, pole improvements nech nemá návrh, ale povzbudivý text`;

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