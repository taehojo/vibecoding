/**
 * My Tasks - 고급 할 일 관리 애플리케이션
 * 작성자: Claude
 * 버전: 2.0.0
 * 
 * 주요 기능:
 * - 할 일 CRUD 작업
 * - 카테고리별 분류 및 필터링
 * - 진행률 대시보드
 * - 다크 모드
 * - 데이터 가져오기/내보내기
 * - 드래그 앤 드롭 정렬
 * - 실행 취소 기능
 * - 접근성 지원
 */

// ==================== 전역 변수 ====================
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let editingTaskId = null;
let deletedTasksHistory = []; // 실행 취소를 위한 삭제 기록
let sortableInstance = null; // Sortable.js 인스턴스

// ==================== DOM 요소 참조 ====================
const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskContainer = document.getElementById('taskContainer');
const categorySelect = document.getElementById('categorySelect');
const filterButtons = document.querySelectorAll('.filter-button');
const searchInput = document.getElementById('searchInput');
const clearCompletedBtn = document.getElementById('clearCompleted');
const completedBadge = document.getElementById('completedBadge');
const themeToggle = document.getElementById('themeToggle');
const sortSelect = document.getElementById('sortSelect');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const undoBtn = document.getElementById('undoBtn');
const quoteText = document.getElementById('quoteText');
const motivationMessage = document.getElementById('motivationMessage');

// 진행률 관련 DOM 요소
const progressCompleted = document.getElementById('progressCompleted');
const progressTotal = document.getElementById('progressTotal');
const progressPercent = document.getElementById('progressPercent');
const mainProgressBar = document.getElementById('mainProgressBar');
const todayCount = document.getElementById('todayCount');

// 카테고리별 진행률 DOM 요소
const categoryProgressElements = {
    work: {
        completed: document.getElementById('workCompleted'),
        total: document.getElementById('workTotal'),
        bar: document.getElementById('workProgress')
    },
    personal: {
        completed: document.getElementById('personalCompleted'),
        total: document.getElementById('personalTotal'),
        bar: document.getElementById('personalProgress')
    },
    study: {
        completed: document.getElementById('studyCompleted'),
        total: document.getElementById('studyTotal'),
        bar: document.getElementById('studyProgress')
    }
};

// ==================== 카테고리 설정 ====================
const categories = {
    work: { name: '업무', color: '#4A90E2', icon: '💼' },
    personal: { name: '개인', color: '#27AE60', icon: '🏠' },
    study: { name: '공부', color: '#8E44AD', icon: '📚' }
};

// ==================== 자동 카테고리 분류 키워드 ====================
const categoryKeywords = {
    work: {
        keywords: ['회의', '미팅', '보고서', '프레젠테이션', '프로젝트', '업무', '회사', '출근', '퇴근', 
                  '클라이언트', '고객', '계약', '제안서', '기획', '마감', '데드라인', '팀', '부서', 
                  '이메일', '결재', '승인', '검토', '협업', '회계', '예산', '매출', '실적', '목표'],
        patterns: [/^\[업무\]/, /^\[회사\]/, /meeting/i, /project/i, /deadline/i, /client/i]
    },
    personal: {
        keywords: ['운동', '헬스', '요가', '산책', '청소', '빨래', '장보기', '요리', '가족', '친구', 
                   '약속', '생일', '기념일', '병원', '약국', '은행', '쇼핑', '영화', '독서', '취미',
                   '휴식', '산책', '카페', '맛집', '여행', '데이트', '파티', '모임', '선물', '집'],
        patterns: [/^\[개인\]/, /^\[일상\]/, /exercise/i, /family/i, /friend/i, /birthday/i]
    },
    study: {
        keywords: ['공부', '학습', '강의', '수업', '과제', '숙제', '시험', '퀴즈', '발표', '논문',
                   '책', '독서', '복습', '예습', '문제', '풀이', '암기', '정리', '노트', '필기',
                   '토익', '토플', '자격증', '인강', '온라인', '도서관', '스터디', '학원', '튜터링', '멘토링'],
        patterns: [/^\[공부\]/, /^\[학습\]/, /study/i, /learn/i, /exam/i, /test/i, /homework/i]
    }
};

// 사용자 정의 키워드 (localStorage에서 불러옴)
let customKeywords = {};

// ==================== 오늘의 격언 ====================
const quotes = [
    "오늘 할 일을 내일로 미루지 마세요.",
    "작은 성취가 모여 큰 성공을 만듭니다.",
    "시작이 반입니다.",
    "꾸준함이 성공의 열쇠입니다.",
    "매일 조금씩 나아가세요.",
    "목표를 향해 한 걸음씩 전진하세요.",
    "오늘의 노력이 내일의 성과입니다.",
    "포기하지 않는 자가 승리합니다.",
    "계획 없는 목표는 단지 꿈일 뿐입니다.",
    "지금 시작하세요, 완벽한 때는 없습니다."
];

// ==================== 디바운싱 유틸리티 ====================
/**
 * 함수 실행을 지연시키는 디바운싱 함수
 * @param {Function} func - 디바운싱할 함수
 * @param {number} wait - 대기 시간(ms)
 * @returns {Function} 디바운싱된 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== 초기화 ====================
window.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadFilter();
    loadTheme();
    loadSortPreference();
    loadCustomKeywords();
    renderTasks();
    updateDashboard();
    initFilterButtons();
    initSearch();
    initClearCompleted();
    initThemeToggle();
    initKeyboardShortcuts();
    initSorting();
    initDataManagement();
    initUndo();
    initAutoCategory();
    displayQuote();
    initDragAndDrop();
});

// ==================== 필터 기능 ====================
function initFilterButtons() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            setFilter(filter);
        });
    });
}

function setFilter(filter) {
    currentFilter = filter;
    
    // 버튼 활성화 상태 및 ARIA 속성 업데이트
    filterButtons.forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
        } else {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        }
    });
    
    saveFilter();
    renderTasks();
}

// ==================== 검색 기능 ====================
function initSearch() {
    // 디바운싱 적용된 검색 함수
    const debouncedSearch = debounce((searchTerm) => {
        searchTasks(searchTerm);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        debouncedSearch(searchTerm);
    });
}

function searchTasks(searchTerm) {
    const taskItems = document.querySelectorAll('.task-item');
    let visibleCount = 0;
    
    taskItems.forEach(item => {
        const taskText = item.querySelector('.task-text')?.textContent.toLowerCase() || '';
        const categoryTag = item.querySelector('.category-tag')?.textContent.toLowerCase() || '';
        
        if (searchTerm === '' || taskText.includes(searchTerm) || categoryTag.includes(searchTerm)) {
            item.classList.remove('hidden-by-search');
            visibleCount++;
        } else {
            item.classList.add('hidden-by-search');
        }
    });
    
    // 검색 결과가 없을 때 메시지 표시
    if (visibleCount === 0 && searchTerm !== '' && tasks.length > 0) {
        const emptyState = taskContainer.querySelector('.empty-state');
        if (!emptyState) {
            const message = document.createElement('div');
            message.className = 'empty-state';
            message.textContent = '검색 결과가 없습니다.';
            taskContainer.appendChild(message);
        }
    }
}

// ==================== 정렬 기능 ====================
function initSorting() {
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        saveSortPreference();
        renderTasks();
        
        // 수동 정렬 모드 활성화/비활성화
        if (currentSort === 'manual') {
            enableDragAndDrop();
        } else {
            disableDragAndDrop();
        }
    });
}

function sortTasks(taskList) {
    const sorted = [...taskList];
    
    switch(currentSort) {
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'category':
            return sorted.sort((a, b) => a.category.localeCompare(b.category));
        case 'status':
            return sorted.sort((a, b) => a.completed - b.completed);
        case 'manual':
            // 수동 정렬은 기존 순서 유지
            return sorted;
        default:
            return sorted;
    }
}

// ==================== 드래그 앤 드롭 ====================
function initDragAndDrop() {
    if (currentSort === 'manual') {
        enableDragAndDrop();
    }
}

function enableDragAndDrop() {
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    sortableInstance = new Sortable(taskContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.task-item',
        filter: '.empty-state',
        onEnd: function(evt) {
            // 드래그 완료 후 순서 업데이트
            const reorderedTasks = [];
            const taskElements = taskContainer.querySelectorAll('.task-item');
            
            taskElements.forEach(element => {
                const taskId = parseInt(element.dataset.taskId);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    reorderedTasks.push(task);
                }
            });
            
            // 필터링되지 않은 나머지 태스크 추가
            tasks.forEach(task => {
                if (!reorderedTasks.find(t => t.id === task.id)) {
                    reorderedTasks.push(task);
                }
            });
            
            tasks = reorderedTasks;
            saveTasks();
        }
    });
}

function disableDragAndDrop() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

// ==================== 데이터 관리 ====================
function initDataManagement() {
    // 내보내기
    exportBtn.addEventListener('click', exportData);
    
    // 가져오기
    importFile.addEventListener('change', importData);
}

function exportData() {
    const dataToExport = {
        tasks: tasks,
        filter: currentFilter,
        sort: currentSort,
        theme: localStorage.getItem('theme') || 'light',
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const date = new Date();
    const filename = `my-tasks-backup-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}.json`;
    
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showMotivation('📥 데이터가 성공적으로 내보내졌습니다!');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 현재 데이터 백업
    const currentBackup = {
        tasks: [...tasks],
        filter: currentFilter,
        sort: currentSort
    };
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            
            // 데이터 유효성 검사
            if (!imported.tasks || !Array.isArray(imported.tasks)) {
                throw new Error('유효하지 않은 파일 형식입니다.');
            }
            
            // 가져오기 확인
            const confirmImport = confirm(
                `${imported.tasks.length}개의 할 일을 가져오시겠습니까?\n` +
                '현재 데이터는 삭제되고 가져온 데이터로 대체됩니다.'
            );
            
            if (confirmImport) {
                tasks = imported.tasks;
                currentFilter = imported.filter || 'all';
                currentSort = imported.sort || 'newest';
                
                // UI 업데이트
                sortSelect.value = currentSort;
                setFilter(currentFilter);
                
                saveTasks();
                saveSortPreference();
                renderTasks();
                updateDashboard();
                
                showMotivation(`✅ ${imported.tasks.length}개의 할 일을 성공적으로 가져왔습니다!`);
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    
    // 파일 입력 초기화
    e.target.value = '';
}

// ==================== 실행 취소 기능 ====================
function initUndo() {
    undoBtn.addEventListener('click', undoLastDelete);
    updateUndoButton();
}

function addToDeleteHistory(task) {
    deletedTasksHistory.push({
        task: task,
        deletedAt: new Date()
    });
    
    // 최대 10개까지만 보관
    if (deletedTasksHistory.length > 10) {
        deletedTasksHistory.shift();
    }
    
    updateUndoButton();
}

function undoLastDelete() {
    if (deletedTasksHistory.length === 0) return;
    
    const lastDeleted = deletedTasksHistory.pop();
    tasks.push(lastDeleted.task);
    
    saveTasks();
    renderTasks();
    updateDashboard();
    updateUndoButton();
    
    showMotivation('↩️ 삭제가 취소되었습니다!');
}

function updateUndoButton() {
    undoBtn.disabled = deletedTasksHistory.length === 0;
    
    if (deletedTasksHistory.length > 0) {
        const lastTask = deletedTasksHistory[deletedTasksHistory.length - 1].task;
        undoBtn.title = `"${lastTask.text}" 복구`;
    } else {
        undoBtn.title = '실행 취소';
    }
}

// ==================== 자동 카테고리 분류 ====================
function initAutoCategory() {
    // 입력 시 실시간 카테고리 추천
    taskInput.addEventListener('input', debounce((e) => {
        const text = e.target.value.trim();
        if (text.length > 2) {
            const suggestedCategory = detectCategory(text);
            if (suggestedCategory && suggestedCategory !== categorySelect.value) {
                updateCategorySuggestion(suggestedCategory);
            }
        }
    }, 200));
}

/**
 * 텍스트를 분석하여 적절한 카테고리를 추천
 * @param {string} text - 분석할 텍스트
 * @returns {string|null} 추천 카테고리 또는 null
 */
function detectCategory(text) {
    const lowerText = text.toLowerCase();
    let scores = { work: 0, personal: 0, study: 0 };
    
    // 각 카테고리별로 점수 계산
    for (const [category, data] of Object.entries(categoryKeywords)) {
        // 기본 키워드 확인
        data.keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                scores[category] += 2;
            }
        });
        
        // 패턴 매칭
        data.patterns.forEach(pattern => {
            if (pattern.test(text)) {
                scores[category] += 3;
            }
        });
        
        // 사용자 정의 키워드 확인
        if (customKeywords[category]) {
            customKeywords[category].forEach(keyword => {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[category] += 3;
                }
            });
        }
    }
    
    // 가장 높은 점수를 받은 카테고리 반환
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
        for (const [category, score] of Object.entries(scores)) {
            if (score === maxScore) {
                return category;
            }
        }
    }
    
    return null;
}

/**
 * 카테고리 추천 UI 업데이트
 * @param {string} suggestedCategory - 추천된 카테고리
 */
function updateCategorySuggestion(suggestedCategory) {
    // 이전 추천 제거
    const existingSuggestion = document.querySelector('.category-suggestion');
    if (existingSuggestion) {
        existingSuggestion.remove();
    }
    
    // 새로운 추천 표시
    const suggestion = document.createElement('div');
    suggestion.className = 'category-suggestion';
    suggestion.innerHTML = `
        <span class="suggestion-text">
            💡 추천 카테고리: <strong>${categories[suggestedCategory].icon} ${categories[suggestedCategory].name}</strong>
        </span>
        <button class="suggestion-apply" data-category="${suggestedCategory}">적용</button>
        <button class="suggestion-dismiss">✕</button>
    `;
    
    // 입력 섹션 아래에 추가
    const inputSection = document.querySelector('.input-section');
    inputSection.insertAdjacentElement('afterend', suggestion);
    
    // 이벤트 리스너
    suggestion.querySelector('.suggestion-apply').addEventListener('click', (e) => {
        categorySelect.value = e.target.dataset.category;
        suggestion.remove();
        showMotivation(`✨ 카테고리가 '${categories[suggestedCategory].name}'(으)로 자동 설정되었습니다!`);
    });
    
    suggestion.querySelector('.suggestion-dismiss').addEventListener('click', () => {
        suggestion.remove();
    });
    
    // 5초 후 자동으로 사라짐
    setTimeout(() => {
        if (suggestion.parentElement) {
            suggestion.style.opacity = '0';
            setTimeout(() => suggestion.remove(), 300);
        }
    }, 5000);
}

/**
 * 사용자 정의 키워드 추가
 * @param {string} category - 카테고리
 * @param {string} keyword - 추가할 키워드
 */
function addCustomKeyword(category, keyword) {
    if (!customKeywords[category]) {
        customKeywords[category] = [];
    }
    
    if (!customKeywords[category].includes(keyword)) {
        customKeywords[category].push(keyword);
        saveCustomKeywords();
    }
}

/**
 * 사용자 정의 키워드 저장
 */
function saveCustomKeywords() {
    localStorage.setItem('customKeywords', JSON.stringify(customKeywords));
}

/**
 * 사용자 정의 키워드 불러오기
 */
function loadCustomKeywords() {
    const saved = localStorage.getItem('customKeywords');
    if (saved) {
        try {
            customKeywords = JSON.parse(saved);
        } catch (error) {
            console.error('사용자 정의 키워드 로드 실패:', error);
            customKeywords = {};
        }
    }
}

// ==================== 할 일 추가 ====================
addButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('할 일을 입력해주세요!');
        taskInput.focus();
        return;
    }
    
    // 자동 카테고리 감지 (사용자가 선택하지 않은 경우)
    if (categorySelect.value === 'personal') { // 기본값이 personal인 경우
        const detectedCategory = detectCategory(taskText);
        if (detectedCategory) {
            categorySelect.value = detectedCategory;
        }
    }
    
    // 중복 확인
    const isDuplicate = tasks.some(task => 
        task.text.toLowerCase() === taskText.toLowerCase() && 
        task.category === categorySelect.value
    );
    
    if (isDuplicate) {
        const confirmDuplicate = confirm(
            '동일한 할 일이 이미 존재합니다.\n그래도 추가하시겠습니까?'
        );
        if (!confirmDuplicate) {
            taskInput.focus();
            return;
        }
    }
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        category: categorySelect.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateDashboard();
    updateClearButton();
    
    // 입력창 초기화 및 포커스
    taskInput.value = '';
    taskInput.focus();
    
    // 응원 메시지 표시
    const totalCount = tasks.length;
    if (totalCount % 10 === 0) {
        showMotivation(`🎉 축하합니다! ${totalCount}개의 할 일을 등록했습니다!`);
    }
}

// ==================== 할 일 삭제 ====================
function deleteTask(id, element) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 삭제 기록에 추가
    addToDeleteHistory(task);
    
    // 페이드 아웃 애니메이션
    element.classList.add('fade-out');
    
    setTimeout(() => {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
    }, 300);
}

// ==================== 할 일 완료 토글 ====================
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
        
        // 완료율에 따른 응원 메시지
        checkCompletionMilestone();
    }
}

// ==================== 할 일 수정 ====================
function editTask(id) {
    if (editingTaskId && editingTaskId !== id) {
        cancelEdit();
    }
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingTaskId = id;
    
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (!taskElement) return;
    
    taskElement.classList.add('editing');
    
    // 기존 내용 숨기기
    const checkbox = taskElement.querySelector('.task-checkbox');
    const categoryTag = taskElement.querySelector('.category-tag');
    const taskText = taskElement.querySelector('.task-text');
    const taskDate = taskElement.querySelector('.task-date');
    const deleteButton = taskElement.querySelector('.delete-button');
    
    checkbox.style.display = 'none';
    categoryTag.style.display = 'none';
    taskText.style.display = 'none';
    taskDate.style.display = 'none';
    deleteButton.style.display = 'none';
    
    // 편집 UI 생성
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.setAttribute('aria-label', '할 일 수정');
    
    const editSelect = document.createElement('select');
    editSelect.className = 'edit-select';
    editSelect.setAttribute('aria-label', '카테고리 변경');
    
    ['work', 'personal', 'study'].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = categories[cat].name;
        if (cat === task.category) option.selected = true;
        editSelect.appendChild(option);
    });
    
    const editButtons = document.createElement('div');
    editButtons.className = 'edit-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.textContent = '저장';
    saveButton.setAttribute('aria-label', '수정 내용 저장');
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.textContent = '취소';
    cancelButton.setAttribute('aria-label', '수정 취소');
    
    editButtons.appendChild(saveButton);
    editButtons.appendChild(cancelButton);
    
    // 편집 UI 추가
    taskElement.insertBefore(editInput, taskDate);
    taskElement.insertBefore(editSelect, taskDate);
    taskElement.insertBefore(editButtons, taskDate);
    
    // 입력창에 포커스
    editInput.focus();
    editInput.select();
    
    // 이벤트 리스너
    const saveEdit = () => {
        const newText = editInput.value.trim();
        if (newText === '') {
            alert('할 일을 입력해주세요!');
            return;
        }
        
        task.text = newText;
        task.category = editSelect.value;
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
        editingTaskId = null;
    };
    
    const cancelEdit = () => {
        renderTasks();
        editingTaskId = null;
    };
    
    saveButton.addEventListener('click', saveEdit);
    cancelButton.addEventListener('click', cancelEdit);
    
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}

// ==================== 렌더링 ====================
// 디바운싱된 렌더링 함수
const debouncedRenderTasks = debounce(() => {
    renderTasksImmediate();
}, 100);

function renderTasks() {
    if (tasks.length > 100) {
        // 대량 데이터는 디바운싱 적용
        debouncedRenderTasks();
    } else {
        renderTasksImmediate();
    }
}

function renderTasksImmediate() {
    taskContainer.innerHTML = '';
    
    // 필터링된 할 일 목록 가져오기
    let filteredTasks = getFilteredTasks();
    
    // 정렬 적용
    filteredTasks = sortTasks(filteredTasks);
    
    // 완료된 항목을 하단으로 이동
    if (currentSort !== 'status') {
        filteredTasks = sortTasksByCompletion(filteredTasks);
    }
    
    if (filteredTasks.length === 0) {
        const emptyMessage = currentFilter === 'all' 
            ? '할 일이 없습니다. 새로운 할 일을 추가해보세요!'
            : `${categories[currentFilter]?.name || '이'} 카테고리에 할 일이 없습니다.`;
            
        taskContainer.innerHTML = `
            <div class="empty-state">
                ${emptyMessage}
            </div>
        `;
        return;
    }
    
    // DocumentFragment 사용으로 성능 최적화
    const fragment = document.createDocumentFragment();
    
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        fragment.appendChild(taskElement);
    });
    
    taskContainer.appendChild(fragment);
}

// 필터링된 할 일 목록 반환
function getFilteredTasks() {
    if (currentFilter === 'all') {
        return tasks;
    }
    return tasks.filter(task => task.category === currentFilter);
}

// 완료 상태별 정렬
function sortTasksByCompletion(taskList) {
    const incomplete = taskList.filter(task => !task.completed);
    const complete = taskList.filter(task => task.completed);
    return [...incomplete, ...complete];
}

// 할 일 요소 생성 함수
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.category}`;
    taskItem.dataset.taskId = task.id;
    taskItem.setAttribute('role', 'listitem');
    
    if (task.completed) {
        taskItem.classList.add('completed');
    }
    
    // 체크박스 생성
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `${task.text} 완료 상태 변경`);
    checkbox.addEventListener('change', () => toggleTask(task.id));
    
    // 카테고리 태그 생성
    const categoryTag = document.createElement('span');
    categoryTag.className = `category-tag ${task.category}`;
    categoryTag.textContent = categories[task.category].name;
    
    // 할 일 텍스트 생성
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    if (task.completed) {
        taskText.classList.add('completed');
    }
    taskText.textContent = task.text;
    
    // 더블클릭으로 편집 모드 진입
    taskText.addEventListener('dblclick', () => {
        if (!task.completed) {
            editTask(task.id);
        }
    });
    
    // 상대 시간 표시
    const taskDate = document.createElement('span');
    taskDate.className = 'task-date';
    taskDate.textContent = getRelativeTime(task.createdAt);
    
    // 삭제 버튼 생성
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `${task.text} 삭제`);
    deleteButton.addEventListener('click', () => deleteTask(task.id, taskItem));
    
    // 요소들을 task-item에 추가
    taskItem.appendChild(checkbox);
    taskItem.appendChild(categoryTag);
    taskItem.appendChild(taskText);
    taskItem.appendChild(taskDate);
    taskItem.appendChild(deleteButton);
    
    return taskItem;
}

// ==================== 유틸리티 함수 ====================
// 상대 시간 계산 함수
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return '방금 전';
    } else if (diffMin < 60) {
        return `${diffMin}분 전`;
    } else if (diffHour < 24) {
        return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
        return `${diffDay}일 전`;
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// ==================== 대시보드 업데이트 ====================
function updateDashboard() {
    // 전체 진행률 계산
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    progressCompleted.textContent = completed;
    progressTotal.textContent = total;
    progressPercent.textContent = percent;
    mainProgressBar.style.width = `${percent}%`;
    
    // 카테고리별 진행률 계산
    ['work', 'personal', 'study'].forEach(category => {
        const categoryTasks = tasks.filter(task => task.category === category);
        const categoryTotal = categoryTasks.length;
        const categoryCompleted = categoryTasks.filter(task => task.completed).length;
        const categoryPercent = categoryTotal > 0 ? (categoryCompleted / categoryTotal) * 100 : 0;
        
        const elements = categoryProgressElements[category];
        elements.completed.textContent = categoryCompleted;
        elements.total.textContent = categoryTotal;
        elements.bar.style.width = `${categoryPercent}%`;
    });
    
    // 오늘 추가된 할 일 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });
    
    todayCount.textContent = todayTasks.length;
    
    // 완료 항목 배지 업데이트
    updateClearButton();
}

// ==================== 완료 항목 관리 ====================
function initClearCompleted() {
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    updateClearButton();
}

function clearCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    const completedCount = completedTasks.length;
    
    if (completedCount === 0) {
        alert('삭제할 완료된 항목이 없습니다.');
        return;
    }
    
    if (confirm(`${completedCount}개의 완료된 항목을 모두 삭제하시겠습니까?`)) {
        // 삭제 기록에 추가
        completedTasks.forEach(task => addToDeleteHistory(task));
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateDashboard();
        updateClearButton();
        
        showMotivation(`🗑️ ${completedCount}개의 완료된 항목이 삭제되었습니다!`);
    }
}

function updateClearButton() {
    const completedCount = tasks.filter(task => task.completed).length;
    completedBadge.textContent = completedCount;
    clearCompletedBtn.disabled = completedCount === 0;
}

// ==================== 테마 관리 ====================
function initThemeToggle() {
    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.checked = true;
    }
}

// ==================== 키보드 단축키 ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + N: 새 할 일 입력창 포커스
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            taskInput.focus();
            taskInput.select();
        }
        
        // Alt + 1~4: 필터 전환
        if (e.altKey && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const filterIndex = parseInt(e.key) - 1;
            const filters = ['all', 'work', 'personal', 'study'];
            if (filterIndex < filters.length) {
                setFilter(filters[filterIndex]);
            }
        }
        
        // Alt + D: 다크 모드 토글
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            themeToggle.checked = !themeToggle.checked;
            themeToggle.dispatchEvent(new Event('change'));
        }
        
        // Alt + S: 검색창 포커스
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        
        // Alt + Z: 실행 취소
        if (e.altKey && e.key === 'z') {
            e.preventDefault();
            undoLastDelete();
        }
        
        // Alt + E: 데이터 내보내기
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            exportData();
        }
        
        // Alt + K: 키워드 설정 다이얼로그
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            showKeywordSettings();
        }
    });
}

// ==================== 키워드 설정 다이얼로그 ====================
function showKeywordSettings() {
    // 기존 다이얼로그 제거
    const existing = document.querySelector('.keyword-dialog');
    if (existing) existing.remove();
    
    // 다이얼로그 생성
    const dialog = document.createElement('div');
    dialog.className = 'keyword-dialog';
    dialog.innerHTML = `
        <div class="dialog-backdrop"></div>
        <div class="dialog-content">
            <h2>🔤 자동 분류 키워드 설정</h2>
            <div class="keyword-sections">
                ${Object.entries(categories).map(([key, cat]) => `
                    <div class="keyword-section">
                        <h3>${cat.icon} ${cat.name}</h3>
                        <div class="keyword-list">
                            <div class="default-keywords">
                                <strong>기본 키워드:</strong>
                                <span class="keywords-display">${categoryKeywords[key].keywords.slice(0, 5).join(', ')}...</span>
                            </div>
                            <div class="custom-keywords">
                                <strong>사용자 키워드:</strong>
                                <div class="custom-keyword-tags" data-category="${key}">
                                    ${(customKeywords[key] || []).map(kw => 
                                        `<span class="keyword-tag">
                                            ${kw}
                                            <button class="remove-keyword" data-keyword="${kw}" data-category="${key}">×</button>
                                        </span>`
                                    ).join('')}
                                </div>
                                <div class="add-keyword-form">
                                    <input type="text" class="keyword-input" data-category="${key}" placeholder="키워드 추가">
                                    <button class="add-keyword-btn" data-category="${key}">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="dialog-footer">
                <button class="dialog-close">닫기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 이벤트 리스너 설정
    dialog.querySelector('.dialog-backdrop').addEventListener('click', () => dialog.remove());
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.remove());
    
    // 키워드 추가
    dialog.querySelectorAll('.add-keyword-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            const input = dialog.querySelector(`.keyword-input[data-category="${category}"]`);
            const keyword = input.value.trim();
            
            if (keyword) {
                addCustomKeyword(category, keyword);
                input.value = '';
                showKeywordSettings(); // 다이얼로그 새로고침
                showMotivation(`✅ '${keyword}' 키워드가 추가되었습니다!`);
            }
        });
    });
    
    // Enter 키로 추가
    dialog.querySelectorAll('.keyword-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const btn = input.nextElementSibling;
                btn.click();
            }
        });
    });
    
    // 키워드 삭제
    dialog.querySelectorAll('.remove-keyword').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            const keyword = e.target.dataset.keyword;
            
            if (customKeywords[category]) {
                customKeywords[category] = customKeywords[category].filter(kw => kw !== keyword);
                saveCustomKeywords();
                showKeywordSettings(); // 다이얼로그 새로고침
            }
        });
    });
}

// ==================== 격언 및 응원 메시지 ====================
function displayQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = randomQuote;
}

function showMotivation(message) {
    motivationMessage.textContent = message;
    motivationMessage.style.display = 'block';
    
    setTimeout(() => {
        motivationMessage.style.display = 'none';
    }, 3000);
}

function checkCompletionMilestone() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (percent === 100 && total > 0) {
        showMotivation('🏆 대단해요! 모든 할 일을 완료했습니다!');
    } else if (percent >= 75 && percent < 100) {
        showMotivation('💪 거의 다 왔어요! 조금만 더 힘내세요!');
    } else if (percent === 50) {
        showMotivation('✨ 절반을 완료했습니다! 계속 화이팅!');
    }
}

// ==================== 데이터 저장 및 불러오기 ====================
// 디바운싱된 저장 함수
const debouncedSaveTasks = debounce(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}, 500);

function saveTasks() {
    if (tasks.length > 100) {
        debouncedSaveTasks();
    } else {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            // 이전 버전 호환성: category가 없는 기존 데이터 처리
            tasks = tasks.map(task => {
                if (!task.category) {
                    task.category = 'personal';
                }
                return task;
            });
            saveTasks();
        } catch (error) {
            console.error('할 일 목록을 불러오는 중 오류가 발생했습니다:', error);
            tasks = [];
        }
    }
}

function saveFilter() {
    localStorage.setItem('currentFilter', currentFilter);
}

function loadFilter() {
    const savedFilter = localStorage.getItem('currentFilter');
    if (savedFilter && ['all', 'work', 'personal', 'study'].includes(savedFilter)) {
        currentFilter = savedFilter;
        // 저장된 필터에 맞게 버튼 활성화
        filterButtons.forEach(button => {
            if (button.dataset.filter === savedFilter) {
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-selected', 'false');
            }
        });
    }
}

function saveSortPreference() {
    localStorage.setItem('sortPreference', currentSort);
}

function loadSortPreference() {
    const savedSort = localStorage.getItem('sortPreference');
    if (savedSort && ['newest', 'oldest', 'category', 'status', 'manual'].includes(savedSort)) {
        currentSort = savedSort;
        sortSelect.value = savedSort;
    }
}

// ==================== 주기적 업데이트 ====================
// 1분마다 시간 업데이트
setInterval(() => {
    const dateElements = document.querySelectorAll('.task-date');
    if (dateElements.length > 0) {
        renderTasks();
    }
}, 60000);

// 하루에 한 번 격언 변경
setInterval(() => {
    displayQuote();
}, 86400000); // 24시간

// ==================== 에러 핸들링 ====================
window.addEventListener('error', (e) => {
    console.error('애플리케이션 오류:', e.error);
    // 사용자에게 친화적인 에러 메시지 표시
    if (e.error && e.error.message) {
        console.log('오류가 발생했습니다. 페이지를 새로고침해주세요.');
    }
});

// ==================== 성능 모니터링 ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`페이지 로드 시간: ${pageLoadTime}ms`);
    });
}