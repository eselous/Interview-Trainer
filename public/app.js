const positionInput = document.getElementById('position');
const positionError = document.getElementById('positionError');
const startBtn = document.getElementById('startBtn');
const setupDiv = document.getElementById('setup');
const interviewDiv = document.getElementById('interview');
const feedbackDiv = document.getElementById('feedback');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');

const MAX_POSITION_WORDS = 10;
let currentPosition = null;
let currentQuestion = null;

function isValidPosition(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return trimmed.split(/\s+/).length <= MAX_POSITION_WORDS;
}

async function loadQuestion() {
  const res = await fetch('/api/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position: currentPosition })
  });

  if (!res.ok) {
    alert('Nepodarilo sa načítať otázku');
    return;
  }

  const data = await res.json();
  currentQuestion = data.question;
  questionText.textContent = currentQuestion;
  answerInput.value = '';
}

startBtn.addEventListener('click', () => {
  const position = positionInput.value;

  if (!isValidPosition(position)) {
    positionError.textContent = `Zadaj pozíciu (max ${MAX_POSITION_WORDS} slov)`;
    positionError.classList.remove('hidden');
    return;
  }

  positionError.classList.add('hidden');
  currentPosition = position.trim();
  setupDiv.classList.add('hidden');
  interviewDiv.classList.remove('hidden');
  loadQuestion();
});

submitBtn.addEventListener('click', async () => {
  const answer = answerInput.value;

  const res = await fetch('/api/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: currentQuestion,
      answer,
      position: currentPosition
    })
  });

  if (!res.ok) {
    alert('Chyba pri odosielaní odpovede');
    return;
  }

  const data = await res.json();
  document.getElementById('scoreValue').textContent = data.score;
  document.getElementById('strengthsText').textContent = data.strengths;
  document.getElementById('improvementsText').textContent = data.improvements;

  interviewDiv.classList.add('hidden');
  feedbackDiv.classList.remove('hidden');
});

nextBtn.addEventListener('click', () => {
  feedbackDiv.classList.add('hidden');
  interviewDiv.classList.remove('hidden');
  loadQuestion();
});