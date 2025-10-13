/**
 * 냉장고를 부탁해 프론트엔드
 */

class FridgeRecipeApp {
    constructor() {
        this.currentImage = null;
        this.currentRecipe = null;
        this.savedRecipes = [];
        this.init();
    }

    init() {
        this.loadSavedRecipes();
        this.initSettingsModal();
        this.initImageUpload();
        this.initRecipeGeneration();
        this.initSavedRecipes();
        this.updateUI();
    }

    /**
     * 설정 모달 초기화
     */
    initSettingsModal() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKeyStatus = document.getElementById('apiKeyStatus');
        const modalBackdrop = settingsModal?.querySelector('.modal-backdrop');

        // 저장된 API 키 불러오기
        const savedApiKey = localStorage.getItem('openrouter_api_key');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }

        const openModal = () => {
            settingsModal?.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const closeModal = () => {
            settingsModal?.classList.add('hidden');
            document.body.style.overflow = '';
            apiKeyStatus?.classList.add('hidden');
        };

        settingsBtn?.addEventListener('click', openModal);
        closeSettingsBtn?.addEventListener('click', closeModal);
        cancelSettingsBtn?.addEventListener('click', closeModal);
        modalBackdrop?.addEventListener('click', closeModal);

        saveApiKeyBtn?.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();

            if (!apiKey) {
                apiKeyStatus.textContent = '❌ API 키를 입력해주세요.';
                apiKeyStatus.style.color = '#ef4444';
                apiKeyStatus.classList.remove('hidden');
                return;
            }

            if (!apiKey.startsWith('sk-or-v1-')) {
                apiKeyStatus.textContent = '❌ 올바른 OpenRouter API 키 형식이 아닙니다.';
                apiKeyStatus.style.color = '#ef4444';
                apiKeyStatus.classList.remove('hidden');
                return;
            }

            window.fridgeRecipeBackend.setApiKey(apiKey);
            apiKeyStatus.textContent = '✅ API 키가 저장되었습니다!';
            apiKeyStatus.style.color = '#10b981';
            apiKeyStatus.classList.remove('hidden');

            setTimeout(() => {
                closeModal();
            }, 1500);
        });

        apiKeyInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveApiKeyBtn?.click();
            }
        });
    }

    /**
     * 이미지 업로드 초기화
     */
    initImageUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const selectImageBtn = document.getElementById('selectImageBtn');
        const imagePreview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        const removeImageBtn = document.getElementById('removeImageBtn');
        const ingredientsText = document.getElementById('ingredientsText');
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');

        // 파일 선택 버튼
        selectImageBtn?.addEventListener('click', () => {
            imageInput?.click();
        });

        // 파일 선택 시
        imageInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });

        // 드래그 앤 드롭
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ff6b35';
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ddd';
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });

        // 이미지 제거
        removeImageBtn?.addEventListener('click', () => {
            this.currentImage = null;
            imageInput.value = '';
            document.querySelector('.upload-placeholder')?.classList.remove('hidden');
            imagePreview?.classList.add('hidden');
            this.updateGenerateButton();
        });

        // 재료 입력 시
        ingredientsText?.addEventListener('input', () => {
            this.updateGenerateButton();
        });
    }

    /**
     * 이미지 파일 처리
     */
    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            const previewImage = document.getElementById('previewImage');
            previewImage.src = this.currentImage;
            document.querySelector('.upload-placeholder')?.classList.add('hidden');
            document.getElementById('imagePreview')?.classList.remove('hidden');

            // 이미지가 업로드되면 재료 입력에 힌트 추가
            const ingredientsText = document.getElementById('ingredientsText');
            if (ingredientsText.value.trim() === '') {
                ingredientsText.placeholder = '이미지를 업로드했습니다! 추가 재료가 있다면 입력하세요. 또는 바로 레시피를 생성하세요.';
            }

            this.updateGenerateButton();
        };
        reader.readAsDataURL(file);
    }

    /**
     * 레시피 생성 버튼 상태 업데이트
     */
    updateGenerateButton() {
        const ingredientsText = document.getElementById('ingredientsText');
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');

        const hasImage = this.currentImage !== null;
        const hasText = ingredientsText?.value.trim().length > 0;

        generateRecipeBtn.disabled = !(hasImage || hasText);
    }

    /**
     * 레시피 생성 초기화
     */
    initRecipeGeneration() {
        const generateRecipeBtn = document.getElementById('generateRecipeBtn');
        const newSearchBtn = document.getElementById('newSearchBtn');
        const saveRecipeBtn = document.getElementById('saveRecipeBtn');

        generateRecipeBtn?.addEventListener('click', () => {
            this.generateRecipe();
        });

        newSearchBtn?.addEventListener('click', () => {
            this.resetSearch();
        });

        saveRecipeBtn?.addEventListener('click', () => {
            this.saveCurrentRecipe();
        });
    }

    /**
     * 레시피 생성
     */
    async generateRecipe() {
        const ingredientsText = document.getElementById('ingredientsText');
        const ingredients = ingredientsText?.value.trim() || '';

        // UI 업데이트
        document.getElementById('loadingSection')?.classList.remove('hidden');
        document.getElementById('recipeResult')?.classList.add('hidden');

        try {
            // 이미지가 있으면 이미지와 함께 전송
            const recipe = await window.fridgeRecipeBackend.generateRecipe(
                ingredients,
                this.currentImage
            );
            this.currentRecipe = {
                ...recipe,
                ingredients: ingredientsText?.value.trim() || '냉장고 재료',
                timestamp: new Date().toISOString()
            };
            this.displayRecipe(this.currentRecipe);
        } catch (error) {
            console.error('레시피 생성 오류:', error);

            // API 키 오류인 경우
            if (error.message.includes('API 키')) {
                this.showToast('⚠️ API 키를 설정해주세요. 설정 버튼을 클릭하세요.', 'warning');
                // 대체 레시피 표시
                const fallbackRecipe = window.fridgeRecipeBackend.getFallbackRecipe(ingredients || '냉장고 재료');
                this.currentRecipe = {
                    ...fallbackRecipe,
                    ingredients: ingredients || '냉장고 재료',
                    timestamp: new Date().toISOString()
                };
                this.displayRecipe(this.currentRecipe);
            } else {
                this.showToast('레시피 생성에 실패했습니다. 다시 시도해주세요.', 'error');
            }
        } finally {
            document.getElementById('loadingSection')?.classList.add('hidden');
        }
    }

    /**
     * 레시피 표시
     */
    displayRecipe(recipe) {
        const recipeContent = document.getElementById('recipeContent');
        const recipeResult = document.getElementById('recipeResult');

        // ingredients와 steps를 배열로 변환
        const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : [recipe.ingredients];

        const steps = Array.isArray(recipe.steps)
            ? recipe.steps
            : [recipe.steps];

        const html = `
            <div class="recipe-header">
                <h3 class="recipe-dish-name">${recipe.dishName}</h3>
                <div class="recipe-meta">
                    <span class="recipe-badge">⏱️ ${recipe.cookingTime}</span>
                    <span class="recipe-badge">📊 ${recipe.difficulty}</span>
                </div>
            </div>

            <div class="recipe-section">
                <h4 class="recipe-section-title">
                    <span>🥬</span> 재료
                </h4>
                <ul class="recipe-ingredients-list">
                    ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>

            <div class="recipe-section">
                <h4 class="recipe-section-title">
                    <span>👨‍🍳</span> 조리법
                </h4>
                <ol class="recipe-steps-list">
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>

            <div class="recipe-tip">
                <strong>💡 Tip:</strong> ${recipe.tip}
            </div>
        `;

        recipeContent.innerHTML = html;
        recipeResult?.classList.remove('hidden');

        // 결과로 스크롤
        recipeResult?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * 검색 초기화
     */
    resetSearch() {
        this.currentImage = null;
        this.currentRecipe = null;

        document.getElementById('imageInput').value = '';
        document.getElementById('ingredientsText').value = '';
        document.querySelector('.upload-placeholder')?.classList.remove('hidden');
        document.getElementById('imagePreview')?.classList.add('hidden');
        document.getElementById('recipeResult')?.classList.add('hidden');

        this.updateGenerateButton();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 현재 레시피 저장
     */
    saveCurrentRecipe() {
        if (!this.currentRecipe) return;

        this.savedRecipes.unshift(this.currentRecipe);

        // localStorage에 저장 (최대 10개)
        const recipesToSave = this.savedRecipes.slice(0, 10);
        localStorage.setItem('fridge_saved_recipes', JSON.stringify(recipesToSave));

        this.updateSavedRecipesList();
        this.showToast('레시피가 저장되었습니다!');
    }

    /**
     * 저장된 레시피 불러오기
     */
    loadSavedRecipes() {
        try {
            const saved = localStorage.getItem('fridge_saved_recipes');
            if (saved) {
                this.savedRecipes = JSON.parse(saved);
            }
        } catch (error) {
            console.error('레시피 불러오기 오류:', error);
            this.savedRecipes = [];
        }
    }

    /**
     * 저장된 레시피 섹션 초기화
     */
    initSavedRecipes() {
        const toggleSavedBtn = document.getElementById('toggleSavedBtn');
        const savedRecipesList = document.getElementById('savedRecipesList');

        toggleSavedBtn?.addEventListener('click', () => {
            const isHidden = savedRecipesList?.classList.contains('hidden');

            if (isHidden) {
                savedRecipesList?.classList.remove('hidden');
                document.getElementById('toggleSavedIcon').textContent = '📕';
                document.getElementById('toggleSavedText').textContent = '접기';
            } else {
                savedRecipesList?.classList.add('hidden');
                document.getElementById('toggleSavedIcon').textContent = '📖';
                document.getElementById('toggleSavedText').textContent = '펼치기';
            }
        });

        this.updateSavedRecipesList();
    }

    /**
     * 저장된 레시피 목록 업데이트
     */
    updateSavedRecipesList() {
        const savedRecipesContent = document.getElementById('savedRecipesContent');
        const emptySavedState = document.getElementById('emptySavedState');

        if (this.savedRecipes.length === 0) {
            savedRecipesContent.innerHTML = '';
            emptySavedState?.classList.remove('hidden');
            return;
        }

        emptySavedState?.classList.add('hidden');

        const html = this.savedRecipes.map((recipe, index) => `
            <div class="saved-recipe-card">
                <div class="saved-recipe-header">
                    <h4 class="saved-recipe-title">${recipe.dishName}</h4>
                    <button class="btn-remove-saved" data-index="${index}" aria-label="삭제">🗑️</button>
                </div>
                <div class="saved-recipe-meta">
                    <span class="recipe-badge">⏱️ ${recipe.cookingTime}</span>
                    <span class="recipe-badge">📊 ${recipe.difficulty}</span>
                </div>
                <p class="saved-recipe-date">${new Date(recipe.timestamp).toLocaleDateString('ko-KR')}</p>
                <button class="btn btn-secondary btn-view-recipe" data-index="${index}">
                    레시피 보기
                </button>
            </div>
        `).join('');

        savedRecipesContent.innerHTML = html;

        // 이벤트 리스너 추가
        document.querySelectorAll('.btn-remove-saved').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteSavedRecipe(index);
            });
        });

        document.querySelectorAll('.btn-view-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.viewSavedRecipe(index);
            });
        });
    }

    /**
     * 저장된 레시피 삭제
     */
    deleteSavedRecipe(index) {
        if (confirm('정말로 이 레시피를 삭제하시겠습니까?')) {
            this.savedRecipes.splice(index, 1);
            localStorage.setItem('fridge_saved_recipes', JSON.stringify(this.savedRecipes));
            this.updateSavedRecipesList();
            this.showToast('레시피가 삭제되었습니다.');
        }
    }

    /**
     * 저장된 레시피 보기
     */
    viewSavedRecipe(index) {
        const recipe = this.savedRecipes[index];
        this.currentRecipe = recipe;
        this.displayRecipe(recipe);
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        this.updateGenerateButton();
        this.updateSavedRecipesList();
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = toast?.querySelector('.toast-message');

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        toast?.classList.remove('hidden');

        setTimeout(() => {
            toast?.classList.add('hidden');
        }, 3000);
    }
}

// 앱 초기화
let fridgeRecipeApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        fridgeRecipeApp = new FridgeRecipeApp();
        window.fridgeRecipeApp = fridgeRecipeApp;
    });
} else {
    fridgeRecipeApp = new FridgeRecipeApp();
    window.fridgeRecipeApp = fridgeRecipeApp;
}

console.log('냉장고를 부탁해 앱이 로드되었습니다.');
