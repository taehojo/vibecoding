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
    isAnswered: false,
    consecutiveCorrect: 0,
    currentGameMode: 'full',
    questionStartTime: 0,
    timeSpent: 0,
    hintUsed: false,
    timerInterval: null,
    totalQuestions: 40
};

// 점수 관리 클래스
class ScoreManager {
    calculateScore(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
        let score = 0;
        if (isCorrect) {
            score += 10;
            if (timeSpent < 5) score += 5;
            else if (timeSpent < 10) score += 3;
            if (!hintUsed) score += 2;
            score += this.getConsecutiveBonus(consecutiveCorrect);
        }
        return score;
    }

    getConsecutiveBonus(consecutive) {
        if (consecutive >= 10) return 5;
        if (consecutive >= 7) return 3;
        if (consecutive >= 5) return 2;
        if (consecutive >= 3) return 1;
        return 0;
    }

    getScoreBreakdown(isCorrect, timeSpent, consecutiveCorrect, hintUsed) {
        const breakdown = [];
        if (isCorrect) {
            breakdown.push({ label: '정답', points: 10 });
            if (timeSpent < 5) {
                breakdown.push({ label: '빠른 응답', points: 5 });
            } else if (timeSpent < 10) {
                breakdown.push({ label: '시간 보너스', points: 3 });
            }
            if (!hintUsed) {
                breakdown.push({ label: '노힌트', points: 2 });
            }
            const consecutiveBonus = this.getConsecutiveBonus(consecutiveCorrect);
            if (consecutiveBonus > 0) {
                breakdown.push({ label: `연속 ${consecutiveCorrect}문제`, points: consecutiveBonus });
            }
        }
        return breakdown;
    }
}

const scoreManager = new ScoreManager();

// 게임 모드 설정
const gameModes = {
    full: { 
        name: '전체 도전',
        questions: 40, 
        timeLimit: null,
        description: '모든 카테고리 40문제',
        categories: ['한국사', '세계지리', '과학', '예술과 문화']
    },
    category: { 
        name: '카테고리별',
        questions: 10, 
        timeLimit: null,
        description: '선택 카테고리 10문제',
        categories: null
    },
    speed: { 
        name: '스피드 퀴즈',
        questions: 20, 
        timeLimit: 15,
        description: '문제당 15초 제한',
        categories: ['한국사', '세계지리', '과학', '예술과 문화']
    }
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
function initGame(mode = 'full', category = null) {
    const selectedMode = gameModes[mode];
    
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
        isAnswered: false,
        consecutiveCorrect: 0,
        currentGameMode: mode,
        questionStartTime: 0,
        timeSpent: 0,
        hintUsed: false,
        timerInterval: null,
        totalQuestions: selectedMode.questions,
        selectedCategory: category,
        timeLimit: selectedMode.timeLimit
    };
    
    // 문제 선택
    selectQuestions(mode, category);
    
    // 화면 전환
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    resultScreen.classList.remove('active');
    feedbackModal.classList.remove('show');
    
    // 첫 문제 로드
    loadQuestion();
}

// 문제 선택
function selectQuestions(mode, category) {
    let availableQuestions = [...quizQuestions];
    
    // 카테고리 필터링
    if (mode === 'category' && category) {
        availableQuestions = availableQuestions.filter(q => q.category === category);
    }
    
    // 문제 섞기
    availableQuestions.sort(() => Math.random() - 0.5);
    
    // 필요한 개수만큼 선택
    gameState.selectedQuestions = availableQuestions.slice(0, gameState.totalQuestions);
}

// 문제 로드 및 표시
function loadQuestion() {
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    
    // 시간 초기화
    gameState.questionStartTime = Date.now();
    gameState.hintUsed = false;
    
    // 스피드 모드 타이머 시작
    if (gameState.currentGameMode === 'speed') {
        startTimer();
    }
    
    // 진행률 업데이트
    updateProgress();
    
    // 카테고리 배지 업데이트
    document.getElementById('categoryBadge').textContent = question.category;
    
    // 문제 텍스트 표시
    document.getElementById('questionText').textContent = question.question;
    
    // 선택지 생성
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => handleAnswer(index);
        optionsContainer.appendChild(button);
    });
    
    // 상태 초기화
    gameState.isAnswered = false;
}

// 타이머 시작
function startTimer() {
    clearInterval(gameState.timerInterval);
    let timeRemaining = gameState.timeLimit;
    
    updateTimerDisplay(timeRemaining);
    
    gameState.timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay(timeRemaining);
        
        if (timeRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            handleAnswer(-1); // 시간 초과
        }
    }, 1000);
}

// 타이머 표시 업데이트
function updateTimerDisplay(seconds) {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${seconds}초`;
        if (seconds <= 5) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }
}

// 답변 처리
function handleAnswer(selectedIndex) {
    if (gameState.isAnswered) return;
    
    gameState.isAnswered = true;
    clearInterval(gameState.timerInterval);
    
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;
    
    // 시간 계산
    gameState.timeSpent = (Date.now() - gameState.questionStartTime) / 1000;
    
    // 카테고리별 점수 업데이트
    gameState.categoryScores[question.category].total++;
    
    // 정답/오답 처리
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.consecutiveCorrect++;
        const earnedScore = scoreManager.calculateScore(
            true, 
            gameState.timeSpent, 
            gameState.consecutiveCorrect, 
            gameState.hintUsed
        );
        gameState.score += earnedScore;
        gameState.categoryScores[question.category].correct++;
    } else {
        gameState.consecutiveCorrect = 0;
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
    const scoreBreakdown = document.getElementById('scoreBreakdown');
    
    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackTitle.textContent = isCorrect ? '정답입니다!' : '틀렸습니다';
    feedbackExplanation.textContent = explanation;
    
    // 점수 브레이크다운 표시
    if (scoreBreakdown) {
        scoreBreakdown.innerHTML = '';
        if (isCorrect) {
            const breakdown = scoreManager.getScoreBreakdown(
                true,
                gameState.timeSpent,
                gameState.consecutiveCorrect,
                gameState.hintUsed
            );
            breakdown.forEach(item => {
                const div = document.createElement('div');
                div.className = 'score-item';
                div.textContent = `${item.label}: +${item.points}점`;
                scoreBreakdown.appendChild(div);
            });
        }
    }
    
    feedbackModal.classList.add('show');
}

// 다음 문제로 이동
function nextQuestion() {
    feedbackModal.classList.remove('show');
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameState.selectedQuestions.length) {
        loadQuestion();
    } else {
        endGame();
    }
}

// 게임 종료
function endGame() {
    // 데이터 저장
    saveGameResult();
    
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
        `${gameState.correctAnswers} / ${gameState.selectedQuestions.length}`;
    
    // 정답률
    const accuracy = Math.round((gameState.correctAnswers / gameState.selectedQuestions.length) * 100);
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;
    
    // 카테고리별 결과
    const categoryResults = document.getElementById('categoryResults');
    categoryResults.innerHTML = '';
    
    for (const [category, scores] of Object.entries(gameState.categoryScores)) {
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
    const total = gameState.selectedQuestions.length;
    
    document.getElementById('currentQuestion').textContent = current;
    document.getElementById('totalQuestions').textContent = total;
    document.getElementById('currentScore').textContent = gameState.score;
    
    // 진행률 바 업데이트
    const progressPercent = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    
    // 연속 정답 표시
    const streakElement = document.getElementById('streak');
    if (gameState.consecutiveCorrect >= 3) {
        streakElement.style.display = 'inline-block';
        document.getElementById('streakCount').textContent = gameState.consecutiveCorrect;
    } else {
        streakElement.style.display = 'none';
    }
    
    // 스피드 모드 타이머 표시
    const timerElement = document.getElementById('timer');
    if (gameState.currentGameMode === 'speed') {
        timerElement.style.display = 'inline-block';
    } else {
        timerElement.style.display = 'none';
    }
}

// 힌트 사용
function useHint() {
    if (gameState.isAnswered || gameState.hintUsed) return;
    
    gameState.hintUsed = true;
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    
    // 2개의 오답 숨기기
    const buttons = document.querySelectorAll('.option-btn');
    let hiddenCount = 0;
    buttons.forEach((btn, index) => {
        if (index !== question.correctAnswer && hiddenCount < 2) {
            btn.classList.add('hint-hidden');
            btn.disabled = true;
            hiddenCount++;
        }
    });
}

// 게임 재시작
function restartGame() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}

// 이벤트 리스너
startBtn.addEventListener('click', () => {
    showModeSelection();
});

// 모드 선택 화면 표시
function showModeSelection() {
    const modeSelectionHTML = `
        <div class="mode-selection">
            <h2>게임 모드 선택</h2>
            <div class="mode-buttons">
                <button onclick="startGameWithMode('full')" class="mode-btn">
                    <h3>${gameModes.full.name}</h3>
                    <p>${gameModes.full.description}</p>
                </button>
                <button onclick="startGameWithMode('category')" class="mode-btn">
                    <h3>${gameModes.category.name}</h3>
                    <p>${gameModes.category.description}</p>
                </button>
                <button onclick="startGameWithMode('speed')" class="mode-btn">
                    <h3>${gameModes.speed.name}</h3>
                    <p>${gameModes.speed.description}</p>
                </button>
            </div>
        </div>
    `;
    
    startScreen.innerHTML = modeSelectionHTML;
}

// 선택한 모드로 게임 시작
function startGameWithMode(mode) {
    if (mode === 'category') {
        showCategorySelection();
    } else {
        initGame(mode);
    }
}

// 카테고리 선택 화면
function showCategorySelection() {
    const categories = ['한국사', '세계지리', '과학', '예술과 문화'];
    const categoryHTML = `
        <div class="category-selection">
            <h2>카테고리 선택</h2>
            <div class="category-buttons">
                ${categories.map(cat => `
                    <button onclick="initGame('category', '${cat}')" class="category-btn">
                        ${cat}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    startScreen.innerHTML = categoryHTML;
}
// 게임 결과 저장
function saveGameResult() {
    const result = {
        score: gameState.score,
        totalQuestions: gameState.selectedQuestions.length,
        correctAnswers: gameState.correctAnswers,
        category: gameState.selectedCategory || 'mixed',
        difficulty: 'mixed',
        timeSpent: (Date.now() - gameState.questionStartTime) / 1000,
        questionsDetail: gameState.answers
    };
    
    // DataManager를 통해 저장
    if (typeof dataManager !== 'undefined') {
        dataManager.saveGameResult(result);
        
        // 경험치 추가
        const expPoints = Math.floor(gameState.score / 10);
        dataManager.addExperience(expPoints);
        
        // 업적 체크
        const newAchievements = dataManager.checkAchievements();
        if (newAchievements.length > 0) {
            showAchievementNotification(newAchievements);
        }
    }
}

// 업적 알림 표시
function showAchievementNotification(achievements) {
    achievements.forEach(ach => {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <h4>업적 달성!</h4>
                <p>${ach.name}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    });
}

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