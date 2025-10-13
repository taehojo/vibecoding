/**
 * 공감 AI 다이어리 프론트엔드 애플리케이션
 * 사용자 인터페이스 로직 및 localStorage 관리
 */

class EmpathyDiaryApp {
    constructor() {
        this.currentAnalysis = null;
        this.diaryEntries = [];
        this.isListVisible = false;
        this.deleteTargetId = null;

        // 감정별 설정
        this.emotionConfig = {
            joy: {
                icon: '😊',
                color: '#ffd700',
                lightColor: '#fff8dc',
                korean: '기쁨'
            },
            sadness: {
                icon: '😢',
                color: '#87ceeb',
                lightColor: '#e6f3ff',
                korean: '슬픔'
            },
            anger: {
                icon: '😠',
                color: '#ff6b6b',
                lightColor: '#ffe0e0',
                korean: '분노'
            },
            fear: {
                icon: '😨',
                color: '#dda0dd',
                lightColor: '#f3e5f3',
                korean: '두려움'
            },
            surprise: {
                icon: '😮',
                color: '#ffb6c1',
                lightColor: '#ffe4e7',
                korean: '놀람'
            },
            calm: {
                icon: '😌',
                color: '#98fb98',
                lightColor: '#f0fff0',
                korean: '평온'
            },
            mixed: {
                icon: '🤔',
                color: '#d3d3d3',
                lightColor: '#f5f5f5',
                korean: '혼재'
            }
        };

        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    init() {
        this.initElements();
        this.bindEvents();
        this.loadDiaryEntries();
        this.updateTodayDate();
        this.updateDiaryList();

        console.log('공감 AI 다이어리 프론트엔드가 초기화되었습니다.');
    }

    /**
     * DOM 요소 초기화
     */
    initElements() {
        // 메인 요소들
        this.elements = {
            todayDate: document.getElementById('todayDate'),
            diaryInput: document.getElementById('diaryInput'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            loadingSection: document.getElementById('loadingSection'),
            analysisResult: document.getElementById('analysisResult'),
            emotionIcon: document.getElementById('emotionIcon'),
            emotionName: document.getElementById('emotionName'),
            intensityFill: document.getElementById('intensityFill'),
            intensityValue: document.getElementById('intensityValue'),
            empathyMessage: document.getElementById('empathyMessage'),
            saveBtn: document.getElementById('saveBtn'),

            // 일기 목록 관련
            toggleListBtn: document.getElementById('toggleListBtn'),
            toggleIcon: document.getElementById('toggleIcon'),
            toggleText: document.getElementById('toggleText'),
            diaryList: document.getElementById('diaryList'),
            diaryListContent: document.getElementById('diaryListContent'),
            emptyState: document.getElementById('emptyState'),

            // 모달 및 토스트
            confirmModal: document.getElementById('confirmModal'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            successToast: document.getElementById('successToast')
        };
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 감정 분석 버튼
        this.elements.analyzeBtn.addEventListener('click', () => this.handleAnalyze());

        // 일기 저장 버튼
        this.elements.saveBtn.addEventListener('click', () => this.handleSave());

        // 일기 목록 토글
        this.elements.toggleListBtn.addEventListener('click', () => this.toggleDiaryList());

        // 모달 이벤트
        this.elements.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        this.elements.cancelDeleteBtn.addEventListener('click', () => this.hideModal());
        this.elements.confirmModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hideModal();
            }
        });

        // 입력 필드 엔터키 처리 (Ctrl+Enter로 분석)
        this.elements.diaryInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleAnalyze();
            }
        });

        // 입력 필드 자동 크기 조정
        this.elements.diaryInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // ESC 키로 모달 닫기 및 기타 키보드 접근성
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // 모달 포커스 트래핑
        this.elements.confirmModal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.trapFocus(e);
            }
        });
    }

    /**
     * 오늘 날짜 업데이트
     */
    updateTodayDate() {
        const today = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        const dateString = today.toLocaleDateString('ko-KR', options);
        this.elements.todayDate.textContent = dateString;
    }

    /**
     * 텍스트영역 자동 크기 조정
     */
    autoResizeTextarea() {
        const textarea = this.elements.diaryInput;
        textarea.style.height = 'auto';
        // 최대 높이를 300px로 제한하여 UI 안정성 확보
        const maxHeight = 300;
        const newHeight = Math.min(Math.max(120, textarea.scrollHeight), maxHeight);
        textarea.style.height = newHeight + 'px';

        // 최대 높이에 도달하면 스크롤바 표시
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    /**
     * 감정 분석 처리
     */
    async handleAnalyze() {
        const diaryText = this.elements.diaryInput.value.trim();

        if (!diaryText) {
            this.showToast('일기 내용을 입력해주세요.', 'warning');
            this.elements.diaryInput.focus();
            return;
        }

        try {
            this.showLoading();
            this.hideAnalysisResult();

            // backend.js의 analyzeDiaryEntry 함수 호출
            const result = await analyzeDiaryEntry(diaryText);

            this.currentAnalysis = {
                text: diaryText,
                timestamp: new Date().toISOString(),
                ...result
            };

            this.hideLoading();
            this.showAnalysisResult(this.currentAnalysis);

        } catch (error) {
            console.error('감정 분석 오류:', error);
            this.hideLoading();
            this.showToast('감정 분석 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        }
    }

    /**
     * 일기 저장 처리
     */
    handleSave() {
        if (!this.currentAnalysis) {
            this.showToast('저장할 분석 결과가 없습니다.', 'warning');
            return;
        }

        try {
            const entry = {
                id: this.generateId(),
                text: this.currentAnalysis.text,
                emotion: this.currentAnalysis.emotion,
                emotionKorean: this.currentAnalysis.emotionKorean,
                emotionScore: this.currentAnalysis.emotionScore,
                empathyMessage: this.currentAnalysis.empathyMessage,
                timestamp: this.currentAnalysis.timestamp,
                savedAt: new Date().toISOString()
            };

            this.diaryEntries.unshift(entry); // 최신 순으로 추가
            this.saveDiaryEntries();
            this.updateDiaryList();

            // UI 초기화
            this.elements.diaryInput.value = '';
            this.autoResizeTextarea();
            this.hideAnalysisResult();
            this.currentAnalysis = null;

            this.showToast('일기가 성공적으로 저장되었습니다!', 'success');

            // 일기 목록이 닫혀있다면 자동으로 열기
            if (!this.isListVisible && this.diaryEntries.length === 1) {
                setTimeout(() => this.toggleDiaryList(), 500);
            }

        } catch (error) {
            console.error('일기 저장 오류:', error);
            this.showToast('일기 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 로딩 표시
     */
    showLoading() {
        this.elements.loadingSection.classList.remove('hidden');
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.textContent = '분석 중...';
    }

    /**
     * 로딩 숨김
     */
    hideLoading() {
        this.elements.loadingSection.classList.add('hidden');
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span>감정 분석하기';
    }

    /**
     * 분석 결과 표시
     */
    showAnalysisResult(analysis) {
        const config = this.emotionConfig[analysis.emotion] || this.emotionConfig.mixed;

        // 감정 아이콘 및 이름
        this.elements.emotionIcon.textContent = config.icon;
        this.elements.emotionName.textContent = analysis.emotionKorean || config.korean;
        this.elements.emotionName.style.color = config.color;

        // 감정 강도
        const intensityPercent = (analysis.emotionScore / 10) * 100;
        this.elements.intensityFill.style.width = intensityPercent + '%';
        this.elements.intensityFill.style.backgroundColor = config.color;
        this.elements.intensityValue.textContent = `${analysis.emotionScore}/10`;

        // 공감 메시지
        this.elements.empathyMessage.textContent = analysis.empathyMessage;

        // 감정별 배경색 적용
        const emotionDisplay = document.querySelector('.emotion-display');
        emotionDisplay.style.backgroundColor = config.lightColor;

        this.elements.analysisResult.classList.remove('hidden');

        // 스크롤을 결과로 이동
        setTimeout(() => {
            this.elements.analysisResult.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }

    /**
     * 분석 결과 숨김
     */
    hideAnalysisResult() {
        this.elements.analysisResult.classList.add('hidden');
    }

    /**
     * 일기 목록 토글
     */
    toggleDiaryList() {
        this.isListVisible = !this.isListVisible;

        if (this.isListVisible) {
            this.elements.diaryList.classList.remove('hidden');
            this.elements.toggleIcon.textContent = '📕';
            this.elements.toggleText.textContent = '접기';
            this.elements.toggleListBtn.setAttribute('aria-expanded', 'true');
        } else {
            this.elements.diaryList.classList.add('hidden');
            this.elements.toggleIcon.textContent = '📖';
            this.elements.toggleText.textContent = '펼치기';
            this.elements.toggleListBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * 일기 목록 업데이트
     */
    updateDiaryList() {
        if (this.diaryEntries.length === 0) {
            this.elements.diaryListContent.innerHTML = '';
            this.elements.emptyState.classList.remove('hidden');
            return;
        }

        this.elements.emptyState.classList.add('hidden');

        const listHTML = this.diaryEntries.map(entry => this.createDiaryEntryHTML(entry)).join('');
        this.elements.diaryListContent.innerHTML = listHTML;
    }

    /**
     * 일기 항목 HTML 생성
     */
    createDiaryEntryHTML(entry) {
        const config = this.emotionConfig[entry.emotion] || this.emotionConfig.mixed;
        const date = new Date(entry.timestamp);
        const dateString = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="diary-entry" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <div class="entry-date">${dateString}</div>
                    <div class="entry-actions">
                        <button class="btn btn-danger btn-small delete-btn" data-entry-id="${entry.id}">
                            <span class="btn-icon">🗑️</span>
                            삭제
                        </button>
                    </div>
                </div>
                <div class="entry-content">${this.escapeHtml(entry.text)}</div>
                <div class="entry-emotion">
                    <span class="entry-emotion-icon">${config.icon}</span>
                    <span class="entry-emotion-text">${entry.emotionKorean} (${entry.emotionScore}/10)</span>
                </div>
            </div>
        `;
    }

    /**
     * 삭제 버튼 이벤트 바인딩 (이벤트 위임 사용)
     */
    bindDeleteEvents() {
        // 기존 리스너 제거 후 새로운 이벤트 위임 리스너 추가
        this.elements.diaryListContent.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                e.stopPropagation();
                const button = e.target.closest('.delete-btn');
                this.lastFocusedElement = button; // 포커스 복원용
                const entryId = button.dataset.entryId;
                this.showDeleteConfirm(entryId);
            }
        });
    }


    /**
     * 삭제 확인
     */
    confirmDelete() {
        if (!this.deleteTargetId) return;

        const entryIndex = this.diaryEntries.findIndex(entry => entry.id === this.deleteTargetId);
        if (entryIndex !== -1) {
            this.diaryEntries.splice(entryIndex, 1);
            this.saveDiaryEntries();
            this.updateDiaryList();
            this.showToast('일기가 삭제되었습니다.', 'success');
        }

        this.hideModal();
    }

    /**
     * localStorage에서 일기 불러오기
     */
    loadDiaryEntries() {
        try {
            const stored = localStorage.getItem('empathy_diary_entries');
            this.diaryEntries = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('일기 불러오기 오류:', error);
            this.diaryEntries = [];
        }
    }

    /**
     * localStorage에 일기 저장
     */
    saveDiaryEntries() {
        try {
            const dataToSave = JSON.stringify(this.diaryEntries);

            // 저장 용량 확인 (대략적인 체크)
            if (dataToSave.length > 4.5 * 1024 * 1024) { // 4.5MB 제한 (localStorage는 보통 5MB)
                console.warn('저장 용량이 거의 가득참. 오래된 데이터 정리 권장.');
                this.showToast('저장 공간이 부족합니다. 오래된 일기를 삭제해주세요.', 'warning');

                // 오래된 일기 자동 삭제 (100개 초과시)
                if (this.diaryEntries.length > 100) {
                    this.diaryEntries = this.diaryEntries.slice(0, 100);
                    this.showToast('저장 공간 확보를 위해 오래된 일기가 자동 삭제되었습니다.', 'warning');
                }
            }

            localStorage.setItem('empathy_diary_entries', JSON.stringify(this.diaryEntries));
        } catch (error) {
            console.error('일기 저장 오류:', error);

            if (error.name === 'QuotaExceededError') {
                this.showToast('저장 공간이 부족합니다. 일부 일기를 삭제해주세요.', 'error');
            } else {
                this.showToast('일기 저장 중 오류가 발생했습니다.', 'error');
            }
            throw error;
        }
    }

    /**
     * 고유 ID 생성
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'success') {
        const toast = this.elements.successToast;
        const messageElement = toast.querySelector('.toast-message');
        const iconElement = toast.querySelector('.toast-icon');

        messageElement.textContent = message;

        // 타입별 아이콘 및 색상 설정
        switch (type) {
            case 'success':
                iconElement.textContent = '✅';
                toast.style.backgroundColor = '#a8d5a8';
                break;
            case 'warning':
                iconElement.textContent = '⚠️';
                toast.style.backgroundColor = '#f0ad4e';
                break;
            case 'error':
                iconElement.textContent = '❌';
                toast.style.backgroundColor = '#e08080';
                break;
            default:
                iconElement.textContent = 'ℹ️';
                toast.style.backgroundColor = '#5bc0de';
        }

        toast.classList.remove('hidden');

        // 3초 후 자동 숨김
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * 데이터 내보내기 (백업용)
     */
    exportData() {
        const data = {
            entries: this.diaryEntries,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diary_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('일기 데이터가 내보내졌습니다.', 'success');
    }

    /**
     * 데이터 가져오기 (복원용)
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.entries && Array.isArray(data.entries)) {
                        this.diaryEntries = data.entries;
                        this.saveDiaryEntries();
                        this.updateDiaryList();
                        this.showToast('일기 데이터를 성공적으로 가져왔습니다.', 'success');
                        resolve();
                    } else {
                        throw new Error('잘못된 파일 형식입니다.');
                    }
                } catch (error) {
                    this.showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    /**
     * 통계 정보 가져오기
     */
    getStatistics() {
        if (this.diaryEntries.length === 0) {
            return {
                totalEntries: 0,
                emotions: {},
                averageIntensity: 0,
                dateRange: null
            };
        }

        const emotions = {};
        let totalIntensity = 0;

        this.diaryEntries.forEach(entry => {
            const emotion = entry.emotion;
            emotions[emotion] = (emotions[emotion] || 0) + 1;
            totalIntensity += entry.emotionScore;
        });

        const dates = this.diaryEntries.map(entry => new Date(entry.timestamp));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        return {
            totalEntries: this.diaryEntries.length,
            emotions,
            averageIntensity: (totalIntensity / this.diaryEntries.length).toFixed(1),
            dateRange: {
                start: minDate.toLocaleDateString('ko-KR'),
                end: maxDate.toLocaleDateString('ko-KR')
            }
        };
    }

    /**
     * 모달 포커스 트래핑 (접근성)
     */
    trapFocus(e) {
        const modal = this.elements.confirmModal;
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * 모달 열기시 포커스 관리
     */
    showDeleteConfirm(entryId) {
        this.deleteTargetId = entryId;
        this.elements.confirmModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 포커스를 첫 번째 버튼으로 이동
        setTimeout(() => {
            this.elements.confirmDeleteBtn.focus();
        }, 100);
    }

    /**
     * 모달 닫기시 포커스 복원
     */
    hideModal() {
        this.elements.confirmModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.deleteTargetId = null;

        // 포커스를 마지막으로 활성화된 요소로 복원 (일반적으로 삭제 버튼)
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }
}

// DOM 로드 완료 후 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.empathyDiaryApp = new EmpathyDiaryApp();
});

// 개발자 도구용 유틸리티 함수들
if (typeof window !== 'undefined') {
    window.exportDiaryData = () => window.empathyDiaryApp?.exportData();
    window.getDiaryStatistics = () => window.empathyDiaryApp?.getStatistics();
    window.clearAllDiaries = () => {
        if (confirm('정말로 모든 일기를 삭제하시겠습니까?')) {
            localStorage.removeItem('empathy_diary_entries');
            window.empathyDiaryApp?.loadDiaryEntries();
            window.empathyDiaryApp?.updateDiaryList();
            console.log('모든 일기가 삭제되었습니다.');
        }
    };

    // API 키 설정 함수
    window.setApiKey = (apiKey) => {
        if (window.empathyDiary) {
            window.empathyDiary.setApiKey(apiKey);
            console.log('API 키가 설정되었습니다. 이제 AI 감정 분석을 사용할 수 있습니다.');
        } else {
            console.error('백엔드가 로드되지 않았습니다.');
        }
    };

    // 성능 모니터링
    window.getPerformanceInfo = () => {
        if (window.performance) {
            return {
                loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
                memoryUsage: window.performance.memory ? {
                    used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
                } : 'Not available'
            };
        }
        return 'Performance API not available';
    };
}

console.log('공감 AI 다이어리 프론트엔드가 로드되었습니다.');
console.log('개발자 도구 명령어:');
console.log('- exportDiaryData(): 일기 데이터 내보내기');
console.log('- getDiaryStatistics(): 통계 정보 보기');
console.log('- clearAllDiaries(): 모든 일기 삭제');
console.log('- setApiKey("your-api-key"): API 키 설정');
console.log('- getPerformanceInfo(): 성능 정보 확인');