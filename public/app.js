const positionInput = document.getElementById('position');
const positionError = document.getElementById('positionError');
const startBtn = document.getElementById('startBtn');
const setupDiv = document.getElementById('setup');
const interviewDiv = document.getElementById('interview');
const feedbackDiv = document.getElementById('feedback');
const feedbackBackBtn = document.getElementById('feedbackBackBtn');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const micBtn = document.getElementById('micBtn');
const recordingStatus = document.getElementById('recordingStatus');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');
const historyBtn = document.getElementById('historyBtn');
const historyBackBtn = document.getElementById('historyBackBtn');
const historyView = document.getElementById('historyView');
const historyList = document.getElementById('historyList');
const statsText = document.getElementById('statsText');

let scoreChartInstance = null;

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

feedbackBackBtn.addEventListener('click', () => {
  feedbackDiv.classList.add('hidden');
  setupDiv.classList.remove('hidden');
  positionInput.value = '';
  currentPosition = null;
  currentQuestion = null;
});

async function loadHistory() {
  const res = await fetch('/api/history', { credentials: 'same-origin' });

  if (!res.ok) {
    alert('Nepodarilo sa načítať históriu');
    return;
  }

  const data = await res.json();
  renderStats(data.stats);
  renderChart(data.history);
  renderHistoryList(data.history);
}

function renderStats(stats) {
  const avg = stats.avgScore ? stats.avgScore.toFixed(1) : '—';
  statsText.textContent = `Celkový počet pokusov: ${stats.totalAttempts} | Priemerné skóre: ${avg}/10`;
}

function renderChart(history) {
  const chronological = [...history].reverse();
  const labels = chronological.map((_, i) => `#${i + 1}`);
  const scores = chronological.map(item => item.score);

  const ctx = document.getElementById('scoreChart');

  if (scoreChartInstance) {
    scoreChartInstance.destroy();
  }

  scoreChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Skóre',
        data: scores,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderHistoryList(history) {
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.textContent = 'Zatiaľ žiadne pokusy.';
    return;
  }

  history.forEach(item => {
    const entry = document.createElement('div');
    entry.className = 'historyEntry';

    const date = new Date(item.created_at).toLocaleString('sk-SK');

    entry.innerHTML = `
      <div class="historyHeader">
        <strong>${escapeHtml(item.position)}</strong>
        <span class="historyScore">${item.score}/10</span>
      </div>
      <p class="historyQuestion">${escapeHtml(item.question)}</p>
      <p class="historyDate">${date}</p>
    `;

    historyList.appendChild(entry);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

historyBtn.addEventListener('click', () => {
  setupDiv.classList.add('hidden');
  historyView.classList.remove('hidden');
  loadHistory();
});

historyBackBtn.addEventListener('click', () => {
  historyView.classList.add('hidden');
  setupDiv.classList.remove('hidden');
});

// main
setupSpeechRecognition()