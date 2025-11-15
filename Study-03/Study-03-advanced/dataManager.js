// Local Data Manager for Quiz Application
class LocalDataManager {
    constructor() {
        this.storageKeys = {
            gameHistory: 'quizGameHistory',
            userProfile: 'quizUserProfile',
            leaderboard: 'quizLeaderboard',
            statistics: 'quizStatistics',
            preferences: 'quizPreferences'
        };
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize storage if empty
        Object.values(this.storageKeys).forEach(key => {
            if (!localStorage.getItem(key)) {
                if (key === this.storageKeys.gameHistory || key === this.storageKeys.leaderboard) {
                    localStorage.setItem(key, JSON.stringify([]));
                } else if (key === this.storageKeys.statistics) {
                    localStorage.setItem(key, JSON.stringify(this.getDefaultStatistics()));
                } else if (key === this.storageKeys.preferences) {
                    localStorage.setItem(key, JSON.stringify(this.getDefaultPreferences()));
                } else if (key === this.storageKeys.userProfile) {
                    localStorage.setItem(key, JSON.stringify(this.getDefaultUserProfile()));
                }
            }
        });
    }

    getDefaultStatistics() {
        return {
            totalGamesPlayed: 0,
            totalScore: 0,
            totalCorrectAnswers: 0,
            totalQuestions: 0,
            categoryStats: {},
            difficultyStats: {
                easy: { played: 0, correct: 0 },
                medium: { played: 0, correct: 0 },
                hard: { played: 0, correct: 0 }
            },
            streaks: {
                current: 0,
                best: 0
            },
            lastPlayed: null
        };
    }

    getDefaultPreferences() {
        return {
            darkMode: false,
            soundEnabled: false,
            animationSpeed: 'normal',
            questionTimer: true,
            showExplanations: true
        };
    }

    getDefaultUserProfile() {
        return {
            username: 'Player',
            avatar: '🎮',
            joinDate: new Date().toISOString(),
            achievements: [],
            level: 1,
            experience: 0
        };
    }

    // Save game result
    saveGameResult(result) {
        const history = this.getGameHistory();
        const gameRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            score: result.score,
            totalQuestions: result.totalQuestions,
            correctAnswers: result.correctAnswers,
            category: result.category || 'mixed',
            difficulty: result.difficulty || 'mixed',
            timeSpent: result.timeSpent || 0,
            questionsDetail: result.questionsDetail || []
        };
        
        history.push(gameRecord);
        
        // Keep only last 100 games
        if (history.length > 100) {
            history.shift();
        }
        
        localStorage.setItem(this.storageKeys.gameHistory, JSON.stringify(history));
        
        // Update statistics
        this.updateStatistics(gameRecord);
        
        // Update leaderboard
        this.updateLeaderboard(gameRecord);
        
        return gameRecord;
    }

    // Get game history
    getGameHistory() {
        const history = localStorage.getItem(this.storageKeys.gameHistory);
        return history ? JSON.parse(history) : [];
    }

    // Update statistics
    updateStatistics(gameRecord) {
        const stats = this.getStatistics();
        
        stats.totalGamesPlayed++;
        stats.totalScore += gameRecord.score;
        stats.totalCorrectAnswers += gameRecord.correctAnswers;
        stats.totalQuestions += gameRecord.totalQuestions;
        stats.lastPlayed = gameRecord.timestamp;
        
        // Update category stats
        if (!stats.categoryStats[gameRecord.category]) {
            stats.categoryStats[gameRecord.category] = {
                played: 0,
                correct: 0,
                total: 0,
                bestScore: 0
            };
        }
        
        const catStat = stats.categoryStats[gameRecord.category];
        catStat.played++;
        catStat.correct += gameRecord.correctAnswers;
        catStat.total += gameRecord.totalQuestions;
        catStat.bestScore = Math.max(catStat.bestScore, gameRecord.score);
        
        // Update difficulty stats
        if (gameRecord.difficulty && stats.difficultyStats[gameRecord.difficulty]) {
            stats.difficultyStats[gameRecord.difficulty].played += gameRecord.totalQuestions;
            stats.difficultyStats[gameRecord.difficulty].correct += gameRecord.correctAnswers;
        }
        
        localStorage.setItem(this.storageKeys.statistics, JSON.stringify(stats));
    }

    // Get statistics
    getStatistics() {
        const stats = localStorage.getItem(this.storageKeys.statistics);
        return stats ? JSON.parse(stats) : this.getDefaultStatistics();
    }

    // Update leaderboard
    updateLeaderboard(gameRecord) {
        const leaderboard = this.getLeaderboard();
        const profile = this.getUserProfile();
        
        const entry = {
            username: profile.username,
            avatar: profile.avatar,
            score: gameRecord.score,
            accuracy: Math.round((gameRecord.correctAnswers / gameRecord.totalQuestions) * 100),
            timestamp: gameRecord.timestamp,
            category: gameRecord.category
        };
        
        leaderboard.push(entry);
        
        // Sort by score (descending) and keep top 50
        leaderboard.sort((a, b) => b.score - a.score);
        if (leaderboard.length > 50) {
            leaderboard.length = 50;
        }
        
        localStorage.setItem(this.storageKeys.leaderboard, JSON.stringify(leaderboard));
    }

    // Get leaderboard
    getLeaderboard(filter = {}) {
        const leaderboard = localStorage.getItem(this.storageKeys.leaderboard);
        let entries = leaderboard ? JSON.parse(leaderboard) : [];
        
        // Apply filters
        if (filter.category) {
            entries = entries.filter(e => e.category === filter.category);
        }
        
        if (filter.period) {
            const now = new Date();
            const periodStart = new Date();
            
            switch (filter.period) {
                case 'daily':
                    periodStart.setDate(now.getDate() - 1);
                    break;
                case 'weekly':
                    periodStart.setDate(now.getDate() - 7);
                    break;
                case 'monthly':
                    periodStart.setMonth(now.getMonth() - 1);
                    break;
            }
            
            entries = entries.filter(e => new Date(e.timestamp) >= periodStart);
        }
        
        return entries;
    }

    // Get best score
    getBestScore(category = null) {
        const history = this.getGameHistory();
        let games = history;
        
        if (category) {
            games = games.filter(g => g.category === category);
        }
        
        if (games.length === 0) return 0;
        
        return Math.max(...games.map(g => g.score));
    }

    // Get user profile
    getUserProfile() {
        const profile = localStorage.getItem(this.storageKeys.userProfile);
        return profile ? JSON.parse(profile) : this.getDefaultUserProfile();
    }

    // Update user profile
    updateUserProfile(updates) {
        const profile = this.getUserProfile();
        Object.assign(profile, updates);
        localStorage.setItem(this.storageKeys.userProfile, JSON.stringify(profile));
        return profile;
    }

    // Get preferences
    getPreferences() {
        const prefs = localStorage.getItem(this.storageKeys.preferences);
        return prefs ? JSON.parse(prefs) : this.getDefaultPreferences();
    }

    // Update preferences
    updatePreferences(updates) {
        const prefs = this.getPreferences();
        Object.assign(prefs, updates);
        localStorage.setItem(this.storageKeys.preferences, JSON.stringify(prefs));
        return prefs;
    }

    // Calculate level from experience
    calculateLevel(experience) {
        return Math.floor(Math.sqrt(experience / 100)) + 1;
    }

    // Add experience points
    addExperience(points) {
        const profile = this.getUserProfile();
        profile.experience += points;
        profile.level = this.calculateLevel(profile.experience);
        this.updateUserProfile(profile);
        return profile;
    }

    // Check and award achievements
    checkAchievements() {
        const profile = this.getUserProfile();
        const stats = this.getStatistics();
        const achievements = [];
        
        // First game achievement
        if (stats.totalGamesPlayed === 1 && !profile.achievements.includes('first_game')) {
            achievements.push({
                id: 'first_game',
                name: '첫 도전',
                description: '첫 퀴즈 게임 완료',
                icon: '🎯'
            });
        }
        
        // Perfect score achievement
        const history = this.getGameHistory();
        const hasPerfectGame = history.some(g => g.correctAnswers === g.totalQuestions && g.totalQuestions >= 10);
        if (hasPerfectGame && !profile.achievements.includes('perfect_score')) {
            achievements.push({
                id: 'perfect_score',
                name: '완벽한 점수',
                description: '10문제 이상 모두 정답',
                icon: '⭐'
            });
        }
        
        // Update profile with new achievements
        achievements.forEach(ach => {
            if (!profile.achievements.includes(ach.id)) {
                profile.achievements.push(ach.id);
            }
        });
        
        if (achievements.length > 0) {
            this.updateUserProfile(profile);
        }
        
        return achievements;
    }

    // Export data (for backup)
    exportData() {
        const data = {};
        Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
            data[key] = localStorage.getItem(storageKey);
        });
        return JSON.stringify(data);
    }

    // Import data (restore backup)
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
                if (data[key]) {
                    localStorage.setItem(storageKey, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeStorage();
    }
}

// Export for use in other files
const dataManager = new LocalDataManager();