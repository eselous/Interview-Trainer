const positionSelect = document.getElementById('position');
const startBtn = document.getElementById('startBtn');
const setupDiv = document.getElementById('setup');
const interviewDiv = document.getElementById('interview');
const feedbackDiv = document.getElementById('feedback');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');

let currentPosition = null;
let currentQuestion = null;

// Načítanie dostupných pozícií pri štarte
async function loadPositions() {
    const res = await fetch('/api/positions');
    const data = await res.json();

    data.positions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos;
        option.textContent = pos;
        positionSelect.appendChild(option);
    });
}

// Načítanie novej otázky pre zvolenú pozíciu
async function loadQuestion(){
    const res = await fetch(`/api/questions/${currentPosition}`);
    const data = await res.json();
    currentQuestion = data.question;
    questionText.textContent = currentQuestion;
    answerInput.value = '';
}

startBtn.addEventListener('click', () => {
    currentPosition = positionSelect.value;
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

loadPositions();