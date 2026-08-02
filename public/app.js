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
const micBtn = document.getElementById('micBtn');
const recordingStatus = document.getElementById('recordingStatus');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');

const MAX_POSITION_WORDS = 10;
let currentPosition = null;
let currentQuestion = null;
let recognition = null;
let isRecording = false;
let finalTranscript = '';

function stopRecording() {
  isRecording = false;
  if (recognition) recognition.stop();
  micBtn.textContent = '🎤 Nahrávať';
  recordingStatus.classList.add('hidden');
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.disabled = true;
    micBtn.textContent = '🎤 Nepodporované v tomto prehliadači';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'sk-SK';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    answerInput.value = (finalTranscript + interimTranscript).trim();
  });

  recognition.addEventListener('error', (event) => {
    console.error('Chyba rozpoznávania reči:', event.error);
    stopRecording();
  });

  recognition.addEventListener('end', () => {
    if (isRecording) {
      stopRecording();
    }
  });

  function startRecording() {
    finalTranscript = answerInput.value ? answerInput.value + ' ' : '';
    isRecording = true;
    recognition.start();
    micBtn.textContent = '⏹ Zastaviť nahrávanie';
    recordingStatus.classList.remove('hidden');
  }

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

setupSpeechRecognition();

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

backBtn.addEventListener('click', () => {
  interviewDiv.classList.add('hidden');
  setupDiv.classList.remove('hidden');
  positionInput.value = '';
  currentPosition = null;
  currentQuestion = null;

  // Ak práve prebieha nahrávanie, zastav ho
  if (isRecording) {
    stopRecording();
  }
});

skipBtn.addEventListener('click', () => {
  // Ak práve prebieha nahrávanie, zastav ho pred načítaním novej otázky
  if (isRecording) {
    stopRecording();
  }
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