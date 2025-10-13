// Leaderboard Component
class LeaderboardUI {
    constructor() {
        this.currentFilter = {
            period: 'allTime',
            category: null
        };
    }

    // Create leaderboard HTML
    createLeaderboardHTML() {
        return `
            <div id="leaderboardModal" class="modal">
                <div class="modal-content leaderboard-content">
                    <span class="close-btn" onclick="leaderboardUI.close()">&times;</span>
                    <h2>🏆 순위표</h2>
                    
                    <div class="leaderboard-filters">
                        <div class="filter-group">
                            <label>기간:</label>
                            <select id="periodFilter" onchange="leaderboardUI.filterChanged()">
                                <option value="allTime">전체</option>
                                <option value="daily">오늘</option>
                                <option value="weekly">이번 주</option>
                                <option value="monthly">이번 달</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>카테고리:</label>
                            <select id="categoryFilter" onchange="leaderboardUI.filterChanged()">
                                <option value="">전체</option>
                                <option value="한국사">한국사</option>
                                <option value="세계지리">세계지리</option>
                                <option value="과학">과학</option>
                                <option value="예술과 문화">예술과 문화</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="leaderboard-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>순위</th>
                                    <th>플레이어</th>
                                    <th>점수</th>
                                    <th>정답률</th>
                                    <th>날짜</th>
                                </tr>
                            </thead>
                            <tbody id="leaderboardBody">
                                <!-- 동적으로 생성 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="personal-best">
                        <h3>🎯 개인 최고 기록</h3>
                        <div id="personalBestInfo"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show leaderboard
    show() {
        // Create modal if not exists
        if (!document.getElementById('leaderboardModal')) {
            document.body.insertAdjacentHTML('beforeend', this.createLeaderboardHTML());
        }
        
        document.getElementById('leaderboardModal').style.display = 'block';
        this.updateLeaderboard();
    }

    // Close leaderboard
    close() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Filter changed
    filterChanged() {
        const periodFilter = document.getElementById('periodFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        
        this.currentFilter.period = periodFilter.value;
        this.currentFilter.category = categoryFilter.value || null;
        
        this.updateLeaderboard();
    }

    // Update leaderboard display
    updateLeaderboard() {
        if (typeof dataManager === 'undefined') return;
        
        const leaderboard = dataManager.getLeaderboard(this.currentFilter);
        const tbody = document.getElementById('leaderboardBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (leaderboard.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">아직 기록이 없습니다</td></tr>';
            return;
        }
        
        // Display top 10
        leaderboard.slice(0, 10).forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Add medal for top 3
            let rankDisplay = index + 1;
            if (index === 0) rankDisplay = '🥇';
            else if (index === 1) rankDisplay = '🥈';
            else if (index === 2) rankDisplay = '🥉';
            
            const date = new Date(entry.timestamp);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            
            row.innerHTML = `
                <td class="rank">${rankDisplay}</td>
                <td class="player">
                    <span class="avatar">${entry.avatar}</span>
                    <span class="username">${entry.username}</span>
                </td>
                <td class="score">${entry.score}</td>
                <td class="accuracy">${entry.accuracy}%</td>
                <td class="date">${dateStr}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Update personal best
        this.updatePersonalBest();
    }

    // Update personal best display
    updatePersonalBest() {
        if (typeof dataManager === 'undefined') return;
        
        const bestScore = dataManager.getBestScore(this.currentFilter.category);
        const stats = dataManager.getStatistics();
        const profile = dataManager.getUserProfile();
        
        const personalBestInfo = document.getElementById('personalBestInfo');
        if (!personalBestInfo) return;
        
        personalBestInfo.innerHTML = `
            <div class="best-stats">
                <div class="stat-item">
                    <span class="stat-label">최고 점수:</span>
                    <span class="stat-value">${bestScore}점</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">총 게임:</span>
                    <span class="stat-value">${stats.totalGamesPlayed}회</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">평균 정답률:</span>
                    <span class="stat-value">${stats.totalQuestions > 0 ? 
                        Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) : 0}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">레벨:</span>
                    <span class="stat-value">Lv.${profile.level}</span>
                </div>
            </div>
        `;
    }
}

// Create global instance
const leaderboardUI = new LeaderboardUI();

// Statistics Dashboard
class StatisticsDashboard {
    constructor() {
        this.chartColors = {
            primary: '#4f46e5',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        };
    }

    // Create statistics HTML
    createStatisticsHTML() {
        return `
            <div id="statisticsModal" class="modal">
                <div class="modal-content statistics-content">
                    <span class="close-btn" onclick="statisticsDashboard.close()">&times;</span>
                    <h2>📊 통계 대시보드</h2>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>전체 성과</h3>
                            <div id="overallStats"></div>
                        </div>
                        
                        <div class="stat-card">
                            <h3>카테고리별 성과</h3>
                            <div id="categoryStats"></div>
                        </div>
                        
                        <div class="stat-card">
                            <h3>난이도별 정답률</h3>
                            <div id="difficultyStats"></div>
                        </div>
                        
                        <div class="stat-card">
                            <h3>최근 10게임 추이</h3>
                            <div id="recentTrend"></div>
                        </div>
                    </div>
                    
                    <div class="achievements-section">
                        <h3>🏅 획득한 업적</h3>
                        <div id="achievementsList"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show statistics
    show() {
        if (!document.getElementById('statisticsModal')) {
            document.body.insertAdjacentHTML('beforeend', this.createStatisticsHTML());
        }
        
        document.getElementById('statisticsModal').style.display = 'block';
        this.updateStatistics();
    }

    // Close statistics
    close() {
        const modal = document.getElementById('statisticsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Update statistics display
    updateStatistics() {
        if (typeof dataManager === 'undefined') return;
        
        const stats = dataManager.getStatistics();
        const profile = dataManager.getUserProfile();
        const history = dataManager.getGameHistory();
        
        // Overall stats
        this.updateOverallStats(stats, profile);
        
        // Category stats
        this.updateCategoryStats(stats.categoryStats);
        
        // Difficulty stats
        this.updateDifficultyStats(stats.difficultyStats);
        
        // Recent trend
        this.updateRecentTrend(history.slice(-10));
        
        // Achievements
        this.updateAchievements(profile.achievements);
    }

    // Update overall stats
    updateOverallStats(stats, profile) {
        const overallStats = document.getElementById('overallStats');
        if (!overallStats) return;
        
        const avgScore = stats.totalGamesPlayed > 0 ? 
            Math.round(stats.totalScore / stats.totalGamesPlayed) : 0;
        const avgAccuracy = stats.totalQuestions > 0 ? 
            Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) : 0;
        
        overallStats.innerHTML = `
            <div class="stat-row">
                <span>총 게임 수:</span>
                <strong>${stats.totalGamesPlayed}</strong>
            </div>
            <div class="stat-row">
                <span>총 점수:</span>
                <strong>${stats.totalScore}</strong>
            </div>
            <div class="stat-row">
                <span>평균 점수:</span>
                <strong>${avgScore}</strong>
            </div>
            <div class="stat-row">
                <span>총 문제 수:</span>
                <strong>${stats.totalQuestions}</strong>
            </div>
            <div class="stat-row">
                <span>정답 수:</span>
                <strong>${stats.totalCorrectAnswers}</strong>
            </div>
            <div class="stat-row">
                <span>평균 정답률:</span>
                <strong>${avgAccuracy}%</strong>
            </div>
            <div class="stat-row">
                <span>현재 레벨:</span>
                <strong>Lv.${profile.level}</strong>
            </div>
            <div class="stat-row">
                <span>경험치:</span>
                <strong>${profile.experience} XP</strong>
            </div>
        `;
    }

    // Update category stats
    updateCategoryStats(categoryStats) {
        const container = document.getElementById('categoryStats');
        if (!container) return;
        
        container.innerHTML = '';
        
        const categories = ['한국사', '세계지리', '과학', '예술과 문화'];
        
        categories.forEach(category => {
            const stat = categoryStats[category] || { played: 0, correct: 0, total: 0 };
            const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            
            const bar = document.createElement('div');
            bar.className = 'stat-bar';
            bar.innerHTML = `
                <div class="bar-label">
                    <span>${category}</span>
                    <span>${accuracy}%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${accuracy}%"></div>
                </div>
                <div class="bar-info">${stat.correct}/${stat.total}</div>
            `;
            
            container.appendChild(bar);
        });
    }

    // Update difficulty stats
    updateDifficultyStats(difficultyStats) {
        const container = document.getElementById('difficultyStats');
        if (!container) return;
        
        container.innerHTML = '';
        
        ['easy', 'medium', 'hard'].forEach(level => {
            const stat = difficultyStats[level];
            const accuracy = stat.played > 0 ? Math.round((stat.correct / stat.played) * 100) : 0;
            const label = level === 'easy' ? '쉬움' : level === 'medium' ? '보통' : '어려움';
            
            const bar = document.createElement('div');
            bar.className = 'stat-bar';
            bar.innerHTML = `
                <div class="bar-label">
                    <span>${label}</span>
                    <span>${accuracy}%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill ${level}" style="width: ${accuracy}%"></div>
                </div>
                <div class="bar-info">${stat.correct}/${stat.played}</div>
            `;
            
            container.appendChild(bar);
        });
    }

    // Update recent trend
    updateRecentTrend(recentGames) {
        const container = document.getElementById('recentTrend');
        if (!container) return;
        
        if (recentGames.length === 0) {
            container.innerHTML = '<p class="no-data">아직 게임 기록이 없습니다</p>';
            return;
        }
        
        container.innerHTML = '<div class="trend-chart"></div>';
        const chart = container.querySelector('.trend-chart');
        
        const maxScore = Math.max(...recentGames.map(g => g.score));
        
        recentGames.forEach((game, index) => {
            const barHeight = maxScore > 0 ? (game.score / maxScore) * 100 : 0;
            const accuracy = Math.round((game.correctAnswers / game.totalQuestions) * 100);
            
            const bar = document.createElement('div');
            bar.className = 'trend-bar';
            bar.innerHTML = `
                <div class="bar-value" style="height: ${barHeight}%">
                    <span class="tooltip">${game.score}점 (${accuracy}%)</span>
                </div>
                <div class="bar-index">${index + 1}</div>
            `;
            
            chart.appendChild(bar);
        });
    }

    // Update achievements
    updateAchievements(achievementIds) {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        const allAchievements = {
            'first_game': { name: '첫 도전', description: '첫 퀴즈 게임 완료', icon: '🎯' },
            'perfect_score': { name: '완벽한 점수', description: '10문제 이상 모두 정답', icon: '⭐' },
            'streak_master': { name: '연속 정답 마스터', description: '10문제 연속 정답', icon: '🔥' },
            'quiz_veteran': { name: '퀴즈 베테랑', description: '50게임 플레이', icon: '🎖️' },
            'knowledge_seeker': { name: '지식 탐구자', description: '모든 카테고리 플레이', icon: '📚' }
        };
        
        container.innerHTML = '';
        
        if (achievementIds.length === 0) {
            container.innerHTML = '<p class="no-data">아직 획득한 업적이 없습니다</p>';
            return;
        }
        
        achievementIds.forEach(id => {
            const achievement = allAchievements[id];
            if (achievement) {
                const elem = document.createElement('div');
                elem.className = 'achievement-item';
                elem.innerHTML = `
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-details">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                    </div>
                `;
                container.appendChild(elem);
            }
        });
    }
}

// Create global instance
const statisticsDashboard = new StatisticsDashboard();