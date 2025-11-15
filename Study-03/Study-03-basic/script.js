// 게임 상태 관리
let gameState = {
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    answers: [],
    categoryScores: {
        "한국사": { correct: 0, total: 0 },
        "세계지리": { correct: 0, total: 0 },
        "과학": { correct: 0, total: 0 },
        "예술과 문화": { correct: 0, total: 0 }
    },
    isAnswered: false
};

// DOM 요소들
const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const feedbackModal = document.getElementById('feedbackModal');

// 게임 초기화
function initGame() {
    gameState = {
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        answers: [],
        categoryScores: {
            "한국사": { correct: 0, total: 0 },
            "세계지리": { correct: 0, total: 0 },
            "과학": { correct: 0, total: 0 },
            "예술과 문화": { correct: 0, total: 0 }
        },
        isAnswered: false
    };

    // 화면 전환
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultScreen.classList.remove('active');
    feedbackModal.classList.remove('show');

    // 첫 문제 로드
    loadQuestion();
}

// 문제 로드 및 표시
function loadQuestion() {
    const question = quizQuestions[gameState.currentQuestionIndex];

    // 진행률 업데이트
    updateProgress();

    // 카테고리 배지 업데이트
    const categoryBadge = document.getElementById('categoryBadge');
    if (categoryBadge) {
        categoryBadge.textContent = question.category;
    }

    // 문제 텍스트 표시
    const questionText = document.getElementById('questionText');
    if (questionText) {
        questionText.textContent = question.question;
    }

    // 선택지 생성
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => handleAnswer(index);
            optionsContainer.appendChild(button);
        });
    }

    // 상태 초기화
    gameState.isAnswered = false;
}

// 답변 처리
function handleAnswer(selectedIndex) {
    if (gameState.isAnswered) return;

    gameState.isAnswered = true;

    const question = quizQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    // 카테고리별 점수 업데이트
    gameState.categoryScores[question.category].total++;

    // 정답/오답 처리
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += 10;
        gameState.categoryScores[question.category].correct++;
    }

    // 답변 저장
    gameState.answers.push({
        questionId: question.id,
        selected: selectedIndex,
        correct: question.correctAnswer,
        isCorrect: isCorrect
    });

    // UI 피드백
    showAnswerFeedback(selectedIndex, question.correctAnswer, isCorrect);

    // 피드백 모달 표시
    setTimeout(() => {
        showFeedback(isCorrect, question.explanation);
    }, 1000);
}

// 답변 피드백 UI
function showAnswerFeedback(selectedIndex, correctIndex, isCorrect) {
    const buttons = document.querySelectorAll('.option-btn');

    // 모든 버튼 비활성화
    buttons.forEach(btn => btn.classList.add('disabled'));

    // 선택한 답변 표시
    if (isCorrect) {
        buttons[selectedIndex].classList.add('correct');
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[correctIndex].classList.add('correct');
    }
}

// 피드백 모달 표시
function showFeedback(isCorrect, explanation) {
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackExplanation = document.getElementById('feedbackExplanation');

    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackTitle.textContent = isCorrect ? '정답입니다!' : '틀렸습니다';
    feedbackExplanation.textContent = explanation;

    feedbackModal.classList.add('show');
}

// 다음 문제로 이동
function nextQuestion() {
    feedbackModal.classList.remove('show');
    gameState.currentQuestionIndex++;

    if (gameState.currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

// 게임 종료
function endGame() {
    // 화면 전환
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');

    // 결과 표시
    displayResults();
}

// 결과 표시
function displayResults() {
    // 최종 점수
    document.getElementById('finalScore').textContent = gameState.score;

    // 정답 개수
    document.getElementById('correctCount').textContent =
        `${gameState.correctAnswers} / ${quizQuestions.length}`;

    // 정답률
    const accuracy = Math.round((gameState.correctAnswers / quizQuestions.length) * 100);
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;

    // 카테고리별 결과
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';

    for (const [category, scores] of Object.entries(gameState.categoryScores)) {
        if (scores.total === 0) continue;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-result';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category;

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'category-score';
        scoreSpan.textContent = `${scores.correct} / ${scores.total}`;

        categoryDiv.appendChild(nameSpan);
        categoryDiv.appendChild(scoreSpan);
        categoryResults.appendChild(categoryDiv);
    }
}

// 진행률 업데이트
function updateProgress() {
    const current = gameState.currentQuestionIndex + 1;
    const total = quizQuestions.length;

    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const currentScoreEl = document.getElementById('currentScore');

    if (currentQuestionEl) currentQuestionEl.textContent = current;
    if (totalQuestionsEl) totalQuestionsEl.textContent = total;
    if (currentScoreEl) currentScoreEl.textContent = gameState.score;

    // 진행률 바 업데이트
    const progressFillEl = document.getElementById('progressFill');
    if (progressFillEl) {
        const progressPercent = (current / total) * 100;
        progressFillEl.style.width = `${progressPercent}%`;
    }
}

// 게임 재시작
function restartGame() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// 이벤트 리스너
startBtn.addEventListener('click', () => {
    initGame();
});

nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartGame);

// 키보드 단축키 지원
document.addEventListener('keydown', (e) => {
    if (quizScreen.classList.contains('active') && !gameState.isAnswered) {
        // 1-4 숫자키로 답변 선택
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            const buttons = document.querySelectorAll('.option-btn');
            if (buttons[index]) {
                handleAnswer(index);
            }
        }
    } else if (feedbackModal.classList.contains('show')) {
        // Enter 키로 다음 문제
        if (e.key === 'Enter') {
            nextQuestion();
        }
    }
});
