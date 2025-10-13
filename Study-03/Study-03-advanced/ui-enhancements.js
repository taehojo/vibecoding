// UI Enhancements - Dark Mode, Animations, and Additional Features

// Initialize UI enhancements on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadUserPreferences();
    updateStartScreenStats();
});

// Initialize UI components
function initializeUI() {
    // Check for saved preferences
    const prefs = dataManager.getPreferences();
    
    // Apply dark mode if saved
    if (prefs.darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
    }
    
    // Apply animation speed
    document.documentElement.style.setProperty('--animation-speed', 
        prefs.animationSpeed === 'fast' ? '0.2s' : 
        prefs.animationSpeed === 'slow' ? '0.6s' : '0.3s'
    );
}

// Load user preferences
function loadUserPreferences() {
    const profile = dataManager.getUserProfile();
    const prefs = dataManager.getPreferences();
    
    // Update profile display if exists
    if (profile.username !== 'Player') {
        updateProfileDisplay(profile);
    }
}

// Update start screen statistics
function updateStartScreenStats() {
    const stats = dataManager.getStatistics();
    const bestScore = dataManager.getBestScore();
    const profile = dataManager.getUserProfile();
    
    // Update displays
    const totalGamesElement = document.getElementById('totalGamesPlayed');
    const bestScoreElement = document.getElementById('bestScoreDisplay');
    const levelElement = document.getElementById('userLevel');
    
    if (totalGamesElement) totalGamesElement.textContent = stats.totalGamesPlayed;
    if (bestScoreElement) bestScoreElement.textContent = bestScore;
    if (levelElement) levelElement.textContent = `Lv.${profile.level}`;
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    dataManager.updatePreferences({ darkMode: isDarkMode });
    updateDarkModeButton(isDarkMode);
    
    // Show notification
    showNotification(isDarkMode ? '다크 모드 활성화' : '라이트 모드 활성화', 'info');
}

// Update dark mode button
function updateDarkModeButton(isDarkMode) {
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// Show user profile
function showProfile() {
    const profile = dataManager.getUserProfile();
    const stats = dataManager.getStatistics();
    
    const profileHTML = `
        <div id="profileModal" class="modal">
            <div class="modal-content profile-content">
                <span class="close-btn" onclick="closeProfile()">&times;</span>
                <h2>👤 프로필</h2>
                
                <div class="profile-header">
                    <div class="profile-avatar">${profile.avatar}</div>
                    <div class="profile-info">
                        <input type="text" id="usernameInput" value="${profile.username}" 
                               class="username-input" placeholder="닉네임 입력">
                        <div class="profile-level">레벨 ${profile.level} (${profile.experience} XP)</div>
                        <div class="profile-joined">가입일: ${new Date(profile.joinDate).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="avatar-selection">
                    <h3>아바타 선택</h3>
                    <div class="avatar-grid">
                        ${['🎮', '🎯', '🏆', '⭐', '🚀', '🎨', '🎭', '🎪', '🎲', '🃏'].map(avatar => 
                            `<button class="avatar-option ${profile.avatar === avatar ? 'selected' : ''}" 
                                     onclick="selectAvatar('${avatar}')">${avatar}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="profile-stats">
                    <h3>게임 통계</h3>
                    <div class="stats-summary">
                        <div>총 게임: ${stats.totalGamesPlayed}회</div>
                        <div>총 점수: ${stats.totalScore}점</div>
                        <div>정답률: ${stats.totalQuestions > 0 ? 
                            Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) : 0}%</div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button onclick="saveProfile()" class="btn btn-primary">저장</button>
                    <button onclick="exportData()" class="btn btn-secondary">데이터 백업</button>
                    <button onclick="importData()" class="btn btn-secondary">데이터 복원</button>
                    <button onclick="confirmReset()" class="btn btn-danger">초기화</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', profileHTML);
    document.getElementById('profileModal').style.display = 'block';
}

// Close profile
function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

// Select avatar
function selectAvatar(avatar) {
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Save profile
function saveProfile() {
    const username = document.getElementById('usernameInput').value.trim();
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    
    if (username && selectedAvatar) {
        dataManager.updateUserProfile({
            username: username,
            avatar: selectedAvatar.textContent
        });
        
        showNotification('프로필이 저장되었습니다', 'success');
        closeProfile();
        updateStartScreenStats();
    }
}

// Share result
function shareResult() {
    const result = {
        score: gameState.score,
        correct: gameState.correctAnswers,
        total: gameState.selectedQuestions.length,
        accuracy: Math.round((gameState.correctAnswers / gameState.selectedQuestions.length) * 100)
    };
    
    const shareText = `🎯 퀴즈 게임 결과\n` +
                     `점수: ${result.score}점\n` +
                     `정답: ${result.correct}/${result.total} (${result.accuracy}%)\n` +
                     `#퀴즈게임 #지식도전`;
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('결과가 클립보드에 복사되었습니다!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('결과가 클립보드에 복사되었습니다!', 'success');
    }
}

// Export data
function exportData() {
    const data = dataManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-backup-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('데이터가 백업되었습니다', 'success');
}

// Import data
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (dataManager.importData(event.target.result)) {
                    showNotification('데이터가 복원되었습니다', 'success');
                    location.reload();
                } else {
                    showNotification('데이터 복원 실패', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Confirm reset
function confirmReset() {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        dataManager.clearAllData();
        showNotification('데이터가 초기화되었습니다', 'info');
        location.reload();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + D for dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
    
    // Ctrl/Cmd + L for leaderboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        leaderboardUI.show();
    }
    
    // Ctrl/Cmd + S for statistics
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        statisticsDashboard.show();
    }
    
    // ESC to close modals
    if (e.key === 'Escape') {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Add page visibility API to pause timers
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    } else if (!document.hidden && gameState.currentGameMode === 'speed' && gameState.isAnswered === false) {
        // Resume timer if needed
        startTimer();
    }
});

// Add confetti animation for high scores
function showConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Check for new best score
function checkNewBestScore(score) {
    const previousBest = dataManager.getBestScore();
    if (score > previousBest) {
        showConfetti();
        showNotification('🎉 새로운 최고 기록!', 'success');
    }
}

// Update profile display
function updateProfileDisplay(profile) {
    // Update any profile displays in the UI
    const profileElements = document.querySelectorAll('.user-profile-display');
    profileElements.forEach(elem => {
        elem.textContent = `${profile.avatar} ${profile.username}`;
    });
}

// Smooth scroll for mobile
function smoothScroll(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Add touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe right - could be used for navigation
        } else {
            // Swipe left - could be used for navigation
        }
    }
}