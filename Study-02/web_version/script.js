/**
 * My Tasks - PC Version
 * Advanced Todo Management Application
 * Version: 2.0.0
 */

// ==================== Global Variables ====================
let tasks = [];
let currentFilter = 'all';
let currentSort = 'newest';
let editingTaskId = null;
let deletedTasksHistory = [];
let sortableInstance = null;

// ==================== DOM Elements ====================
const elements = {
    todoInput: null,
    addBtn: null,
    todoList: null,
    categorySelect: null,
    searchInput: null,
    sortSelect: null,
    themeToggle: null,
    clearCompleted: null,
    exportData: null,
    importData: null,
    importFile: null,
    quoteText: null,
    emptyState: null,
    todoCount: null,
    listTitle: null,
    categorySuggestion: null
};

// Progress Elements
const progressElements = {
    overall: { bar: null, percent: null },
    work: { bar: null, percent: null },
    personal: { bar: null, percent: null },
    study: { bar: null, percent: null }
};

// Category Counts
const countElements = {
    all: null,
    work: null,
    personal: null,
    study: null
};

// ==================== Categories Configuration ====================
const categories = {
    work: { name: '업무', color: '#f56565', icon: '💼' },
    personal: { name: '개인', color: '#48bb78', icon: '🏠' },
    study: { name: '공부', color: '#4299e1', icon: '📚' }
};

// ==================== Auto-categorization Keywords ====================
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

let customKeywords = {};

// ==================== Motivational Quotes ====================
const quotes = [
    "작은 일을 완성하는 것이 위대한 일의 시작입니다.",
    "오늘의 작은 노력이 내일의 큰 성과를 만듭니다.",
    "완벽한 계획보다 실행이 더 중요합니다.",
    "한 걸음씩 나아가면 목표에 도달할 수 있습니다.",
    "포기하지 않는 사람이 결국 성공합니다.",
    "오늘 할 일을 내일로 미루지 마세요.",
    "성공은 매일의 작은 노력의 합입니다.",
    "시작이 반입니다. 지금 시작하세요!",
    "당신은 생각보다 더 강합니다.",
    "매 순간이 새로운 시작입니다."
];

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadTasks();
    loadTheme();
    loadCustomKeywords();
    setupEventListeners();
    updateUI();
    displayQuote();
    initializeSortable();
    
    // Set initial focus
    if (elements.todoInput) {
        elements.todoInput.focus();
    }
});

function initializeElements() {
    // Main elements
    elements.todoInput = document.getElementById('todoInput');
    elements.addBtn = document.getElementById('addBtn');
    elements.todoList = document.getElementById('todoList');
    elements.categorySelect = document.getElementById('categorySelect');
    elements.searchInput = document.getElementById('searchInput');
    elements.sortSelect = document.getElementById('sortSelect');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.clearCompleted = document.getElementById('clearCompleted');
    elements.exportData = document.getElementById('exportData');
    elements.importData = document.getElementById('importData');
    elements.importFile = document.getElementById('importFile');
    elements.quoteText = document.getElementById('quoteText');
    elements.emptyState = document.getElementById('emptyState');
    elements.todoCount = document.getElementById('todoCount');
    elements.listTitle = document.getElementById('listTitle');
    elements.categorySuggestion = document.getElementById('categorySuggestion');
    
    // Progress elements
    progressElements.overall.bar = document.getElementById('overallProgress');
    progressElements.overall.percent = document.getElementById('overallPercent');
    progressElements.work.bar = document.getElementById('workProgress');
    progressElements.work.percent = document.getElementById('workPercent');
    progressElements.personal.bar = document.getElementById('personalProgress');
    progressElements.personal.percent = document.getElementById('personalPercent');
    progressElements.study.bar = document.getElementById('studyProgress');
    progressElements.study.percent = document.getElementById('studyPercent');
    
    // Count elements
    countElements.all = document.getElementById('countAll');
    countElements.work = document.getElementById('countWork');
    countElements.personal = document.getElementById('countPersonal');
    countElements.study = document.getElementById('countStudy');
}

// ==================== Event Listeners ====================
function setupEventListeners() {
    // Add task
    elements.addBtn.addEventListener('click', addTask);
    elements.todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTask();
        }
    });
    
    // Auto-categorization on input
    elements.todoInput.addEventListener('input', debounce(() => {
        suggestCategory(elements.todoInput.value);
    }, 300));
    
    // Category filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.category;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateListTitle();
            updateUI();
        });
    });
    
    // Search
    elements.searchInput.addEventListener('input', debounce(() => {
        updateUI();
    }, 300));
    
    // Sort
    elements.sortSelect.addEventListener('change', () => {
        currentSort = elements.sortSelect.value;
        updateUI();
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Clear completed
    elements.clearCompleted.addEventListener('click', clearCompletedTasks);
    
    // Export/Import
    elements.exportData.addEventListener('click', exportTasks);
    elements.importData.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importTasks);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Category suggestion handlers
    const suggestionApply = document.querySelector('.suggestion-apply');
    const suggestionDismiss = document.querySelector('.suggestion-dismiss');
    
    if (suggestionApply) {
        suggestionApply.addEventListener('click', applySuggestedCategory);
    }
    
    if (suggestionDismiss) {
        suggestionDismiss.addEventListener('click', dismissSuggestion);
    }
    
    // Keyword modal
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            openKeywordModal();
        }
    });
}

// ==================== Task Management ====================
function addTask() {
    const text = elements.todoInput.value.trim();
    if (!text) return;
    
    // Check for duplicates
    if (tasks.some(task => task.text.toLowerCase() === text.toLowerCase())) {
        showNotification('이미 존재하는 할 일입니다!', 'warning');
        elements.todoInput.classList.add('shake');
        setTimeout(() => elements.todoInput.classList.remove('shake'), 500);
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        category: elements.categorySelect.value,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    tasks.unshift(task);
    saveTasks();
    updateUI();
    
    elements.todoInput.value = '';
    elements.categorySuggestion.style.display = 'none';
    
    showNotification('할 일이 추가되었습니다!', 'success');
}

function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        const deletedTask = tasks.splice(taskIndex, 1)[0];
        deletedTasksHistory.push({ task: deletedTask, timestamp: Date.now() });
        
        // Keep only last 10 deleted tasks
        if (deletedTasksHistory.length > 10) {
            deletedTasksHistory.shift();
        }
        
        saveTasks();
        updateUI();
        showNotification('할 일이 삭제되었습니다. (Ctrl+Z로 복구)', 'info');
    }
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        // Move completed tasks to bottom
        if (task.completed) {
            tasks = tasks.filter(t => t.id !== id);
            tasks.push(task);
        }
        
        saveTasks();
        updateUI();
        
        if (task.completed) {
            showMotivationalMessage();
        }
    }
}

function editTask(id) {
    if (editingTaskId === id) return;
    
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const textElement = taskElement.querySelector('.todo-text');
    const currentText = textElement.textContent;
    
    editingTaskId = id;
    textElement.contentEditable = true;
    textElement.classList.add('editing');
    textElement.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(textElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const saveEdit = () => {
        const newText = textElement.textContent.trim();
        if (newText && newText !== currentText) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.text = newText;
                saveTasks();
                showNotification('할 일이 수정되었습니다!', 'success');
            }
        } else if (!newText) {
            textElement.textContent = currentText;
        }
        
        textElement.contentEditable = false;
        textElement.classList.remove('editing');
        editingTaskId = null;
    };
    
    textElement.addEventListener('blur', saveEdit, { once: true });
    textElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textElement.blur();
        } else if (e.key === 'Escape') {
            textElement.textContent = currentText;
            textElement.blur();
        }
    });
}

function clearCompletedTasks() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
        showNotification('삭제할 완료된 할 일이 없습니다.', 'info');
        return;
    }
    
    if (confirm(`${completedTasks.length}개의 완료된 할 일을 삭제하시겠습니까?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        updateUI();
        showNotification(`${completedTasks.length}개의 할 일이 삭제되었습니다.`, 'success');
    }
}

// ==================== Auto-categorization ====================
function suggestCategory(text) {
    if (!text) {
        elements.categorySuggestion.style.display = 'none';
        return;
    }
    
    const detectedCategory = detectCategory(text);
    if (detectedCategory && detectedCategory !== elements.categorySelect.value) {
        const suggestionText = elements.categorySuggestion.querySelector('.suggestion-text');
        suggestionText.textContent = `"${categories[detectedCategory].name}" 카테고리로 분류하시겠습니까?`;
        elements.categorySuggestion.dataset.suggestedCategory = detectedCategory;
        elements.categorySuggestion.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        clearTimeout(elements.categorySuggestion.hideTimeout);
        elements.categorySuggestion.hideTimeout = setTimeout(() => {
            elements.categorySuggestion.style.display = 'none';
        }, 5000);
    } else {
        elements.categorySuggestion.style.display = 'none';
    }
}

function detectCategory(text) {
    const lowerText = text.toLowerCase();
    let scores = { work: 0, personal: 0, study: 0 };
    
    for (const [category, config] of Object.entries(categoryKeywords)) {
        // Check keywords
        for (const keyword of config.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                scores[category] += 2;
            }
        }
        
        // Check patterns
        for (const pattern of config.patterns) {
            if (pattern.test(text)) {
                scores[category] += 3;
            }
        }
        
        // Check custom keywords
        if (customKeywords[category]) {
            for (const keyword of customKeywords[category]) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[category] += 3;
                }
            }
        }
    }
    
    // Return category with highest score (minimum score of 2)
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore >= 2) {
        return Object.keys(scores).find(key => scores[key] === maxScore);
    }
    
    return null;
}

function applySuggestedCategory() {
    const suggestedCategory = elements.categorySuggestion.dataset.suggestedCategory;
    if (suggestedCategory) {
        elements.categorySelect.value = suggestedCategory;
        elements.categorySuggestion.style.display = 'none';
        showNotification(`카테고리가 "${categories[suggestedCategory].name}"으로 설정되었습니다.`, 'success');
    }
}

function dismissSuggestion() {
    elements.categorySuggestion.style.display = 'none';
}

// ==================== UI Updates ====================
function updateUI() {
    renderTasks();
    updateProgress();
    updateCounts();
    updateEmptyState();
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    const sortedTasks = sortTasks(filteredTasks);
    
    elements.todoList.innerHTML = '';
    
    if (sortedTasks.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.todoList.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.todoList.style.display = 'block';
    
    const fragment = document.createDocumentFragment();
    
    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.taskId = task.id;
        if (task.completed) li.classList.add('completed');
        
        const checkbox = document.createElement('div');
        checkbox.className = 'todo-checkbox';
        if (task.completed) checkbox.classList.add('checked');
        checkbox.onclick = () => toggleTask(task.id);
        
        const content = document.createElement('div');
        content.className = 'todo-content';
        
        const text = document.createElement('div');
        text.className = 'todo-text';
        text.textContent = task.text;
        text.ondblclick = () => editTask(task.id);
        
        const meta = document.createElement('div');
        meta.className = 'todo-meta';
        
        const badge = document.createElement('span');
        badge.className = `category-badge ${task.category}`;
        badge.textContent = categories[task.category].name;
        
        const date = document.createElement('span');
        date.className = 'todo-date';
        const taskDate = new Date(task.createdAt);
        const today = new Date();
        const isToday = taskDate.toDateString() === today.toDateString();
        date.textContent = isToday ? '오늘' : formatDate(taskDate);
        
        meta.appendChild(badge);
        meta.appendChild(date);
        
        content.appendChild(text);
        content.appendChild(meta);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = () => deleteTask(task.id);
        
        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(deleteBtn);
        
        fragment.appendChild(li);
    });
    
    elements.todoList.appendChild(fragment);
    elements.todoCount.textContent = `${sortedTasks.length}개`;
}

function getFilteredTasks() {
    let filtered = tasks;
    
    // Category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.category === currentFilter);
    }
    
    // Search filter
    const searchTerm = elements.searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.text.toLowerCase().includes(searchTerm) ||
            categories[t.category].name.toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered;
}

function sortTasks(tasks) {
    const sorted = [...tasks];
    
    switch (currentSort) {
        case 'oldest':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'category':
            sorted.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'completed':
            sorted.sort((a, b) => {
                if (a.completed === b.completed) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return a.completed ? 1 : -1;
            });
            break;
        case 'newest':
        default:
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    return sorted;
}

function updateProgress() {
    // Overall progress
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    progressElements.overall.bar.style.width = `${percent}%`;
    progressElements.overall.percent.textContent = `${percent}%`;
    
    // Category progress
    ['work', 'personal', 'study'].forEach(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
        const categoryCompleted = categoryTasks.filter(t => t.completed).length;
        const categoryTotal = categoryTasks.length;
        const categoryPercent = categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 0;
        
        progressElements[category].bar.style.width = `${categoryPercent}%`;
        progressElements[category].percent.textContent = `${categoryPercent}%`;
    });
}

function updateCounts() {
    countElements.all.textContent = tasks.length;
    countElements.work.textContent = tasks.filter(t => t.category === 'work').length;
    countElements.personal.textContent = tasks.filter(t => t.category === 'personal').length;
    countElements.study.textContent = tasks.filter(t => t.category === 'study').length;
}

function updateEmptyState() {
    const hasVisibleTasks = getFilteredTasks().length > 0;
    elements.emptyState.style.display = hasVisibleTasks ? 'none' : 'block';
    elements.todoList.style.display = hasVisibleTasks ? 'block' : 'none';
}

function updateListTitle() {
    const titles = {
        all: '전체 할 일',
        work: '업무 할 일',
        personal: '개인 할 일',
        study: '공부 할 일'
    };
    elements.listTitle.textContent = titles[currentFilter];
}

// ==================== Theme Management ====================
function toggleTheme() {
    const currentTheme = document.body.dataset.theme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== Data Management ====================
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load tasks:', e);
            tasks = [];
        }
    }
}

function exportTasks() {
    const data = {
        tasks: tasks,
        customKeywords: customKeywords,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${formatDateForFilename(new Date())}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('데이터가 내보내졌습니다!', 'success');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks && Array.isArray(data.tasks)) {
                tasks = data.tasks;
                if (data.customKeywords) {
                    customKeywords = data.customKeywords;
                    saveCustomKeywords();
                }
                saveTasks();
                updateUI();
                showNotification('데이터를 성공적으로 가져왔습니다!', 'success');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            showNotification('파일을 읽을 수 없습니다.', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// ==================== Custom Keywords ====================
function loadCustomKeywords() {
    const saved = localStorage.getItem('customKeywords');
    if (saved) {
        try {
            customKeywords = JSON.parse(saved);
        } catch (e) {
            customKeywords = {};
        }
    }
}

function saveCustomKeywords() {
    localStorage.setItem('customKeywords', JSON.stringify(customKeywords));
}

function openKeywordModal() {
    const modal = document.getElementById('keywordModal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    // Load current keywords
    ['work', 'personal', 'study'].forEach(category => {
        const input = document.getElementById(`${category}Keywords`);
        const tagsContainer = document.getElementById(`${category}Tags`);
        
        if (customKeywords[category]) {
            input.value = customKeywords[category].join(', ');
            renderKeywordTags(category, customKeywords[category], tagsContainer);
        }
    });
    
    // Setup modal event handlers
    document.getElementById('saveKeywords').onclick = saveKeywords;
    document.getElementById('cancelKeywords').onclick = closeKeywordModal;
    document.getElementById('closeModal').onclick = closeKeywordModal;
}

function closeKeywordModal() {
    const modal = document.getElementById('keywordModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function saveKeywords() {
    ['work', 'personal', 'study'].forEach(category => {
        const input = document.getElementById(`${category}Keywords`);
        const keywords = input.value.split(',').map(k => k.trim()).filter(k => k);
        customKeywords[category] = keywords;
    });
    
    saveCustomKeywords();
    closeKeywordModal();
    showNotification('키워드가 저장되었습니다!', 'success');
}

function renderKeywordTags(category, keywords, container) {
    container.innerHTML = '';
    keywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
            ${keyword}
            <button onclick="removeKeywordTag('${category}', '${keyword}')">×</button>
        `;
        container.appendChild(tag);
    });
}

// ==================== Keyboard Shortcuts ====================
function handleKeyboardShortcuts(e) {
    // Ctrl + Enter: Add task
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
    
    // Ctrl + /: Focus search
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Ctrl + Z: Undo delete
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoDelete();
    }
    
    // Ctrl + D: Toggle dark mode
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
}

function undoDelete() {
    if (deletedTasksHistory.length > 0) {
        const { task } = deletedTasksHistory.pop();
        tasks.unshift(task);
        saveTasks();
        updateUI();
        showNotification('삭제가 취소되었습니다.', 'success');
    }
}

// ==================== Drag and Drop ====================
function initializeSortable() {
    if (typeof Sortable !== 'undefined' && elements.todoList) {
        sortableInstance = new Sortable(elements.todoList, {
            animation: 150,
            ghostClass: 'dragging',
            onEnd: function(evt) {
                const taskId = parseInt(evt.item.dataset.taskId);
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                
                if (oldIndex !== newIndex) {
                    const movedTask = tasks.splice(oldIndex, 1)[0];
                    tasks.splice(newIndex, 0, movedTask);
                    saveTasks();
                    showNotification('순서가 변경되었습니다.', 'info');
                }
            }
        });
    }
}

// ==================== Utility Functions ====================
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForFilename(date) {
    return formatDate(date).replace(/-/g, '');
}

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

function displayQuote() {
    if (elements.quoteText) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        elements.quoteText.textContent = randomQuote;
    }
}

function showMotivationalMessage() {
    const messages = [
        "훌륭해요! 계속 이렇게 하세요! 🎉",
        "잘하고 있어요! 👏",
        "완료! 다음 할 일도 화이팅! 💪",
        "멋져요! 하나씩 해결하고 있네요! ⭐",
        "대단해요! 목표에 가까워지고 있어요! 🚀"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    showNotification(message, 'success', 3000);
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : type === 'warning' ? '#ed8936' : '#4299e1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
    
    .shake {
        animation: shake 0.5s ease;
    }
    
    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        75% {
            transform: translateX(5px);
        }
    }
`;
document.head.appendChild(style);