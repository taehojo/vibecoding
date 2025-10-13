/**
 * 공감 AI 다이어리 백엔드
 * OpenRouter API를 통해 DeepSeek V3.1 모델을 사용하여 감정 분석 및 공감 메시지 생성
 */

class EmpathyDiaryBackend {
    constructor() {
        // 환경변수에서 API 키 가져오기 (보안상 중요)
        this.apiKey = this.getApiKey();
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'google/gemma-3-27b-it:free';

        // CORS 프록시 옵션들 (필요시 사용)
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?'
        ];

        this.currentProxyIndex = -1; // -1은 직접 호출을 의미
    }

    /**
     * API 키를 안전하게 가져오기
     */
    getApiKey() {
        // 1. 환경변수에서 먼저 시도
        if (typeof process !== 'undefined' && process.env && process.env.OPENROUTER_API_KEY) {
            return process.env.OPENROUTER_API_KEY;
        }

        // 2. localStorage에서 시도 (사용자가 설정한 경우)
        if (typeof localStorage !== 'undefined') {
            const storedKey = localStorage.getItem('openrouter_api_key');
            if (storedKey) {
                return storedKey;
            }
        }

        // 3. 기본값 (데모용) - 실제 배포시에는 제거해야 함
        console.warn('API 키가 설정되지 않았습니다. 데모 모드로 실행합니다.');
        return '[OpenRouter API 키]'; // 데모용
    }

    /**
     * 사용자가 API 키를 설정할 수 있는 함수
     */
    setApiKey(apiKey) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('openrouter_api_key', apiKey);
            this.apiKey = apiKey;
            console.log('API 키가 설정되었습니다.');
        } else {
            console.warn('localStorage를 사용할 수 없습니다.');
        }
    }

    /**
     * DeepSeek 모델을 위한 감정 분석 프롬프트 생성
     */
    createEmotionAnalysisPrompt(diaryText) {
        return `당신은 따뜻하고 공감적인 AI 상담사입니다. 다음 일기 내용을 읽고 감정을 분석한 후, 공감적인 메시지를 작성해주세요.

일기 내용:
"${diaryText}"

다음 형식으로 정확히 응답해주세요:

감정: [기쁨/슬픔/분노/두려움/놀람/평온/혼재] 중 하나
감정강도: [1-10 사이의 숫자]
공감메시지: [따뜻하고 공감적인 메시지 2-3문장]

응답 규칙:
1. 감정은 반드시 위의 7가지 중 하나만 선택
2. 감정강도는 1(매우 약함)부터 10(매우 강함)까지의 숫자
3. 공감메시지는 판단하지 말고 공감하며, 따뜻한 톤으로 작성
4. 메시지는 "~네요", "~하셨군요" 등 존댓말 사용
5. 구체적인 조언보다는 감정 공감에 집중

예시:
감정: 슬픔
감정강도: 7
공감메시지: 힘든 하루를 보내셨군요. 그런 감정을 느끼시는 것이 자연스러우며, 지금 이 순간도 충분히 소중하다는 것을 기억해주세요.`;
    }

    /**
     * API 응답 파싱
     */
    parseApiResponse(responseText) {
        try {
            // 정규식을 사용하여 응답에서 필요한 정보 추출
            const emotionMatch = responseText.match(/감정:\s*([가-힣]+)/);
            const intensityMatch = responseText.match(/감정강도:\s*(\d+)/);
            const messageMatch = responseText.match(/공감메시지:\s*(.+?)(?=\n\n|\n감정|\n감정강도|$)/s);

            if (!emotionMatch || !intensityMatch || !messageMatch) {
                throw new Error('응답 형식이 올바르지 않습니다.');
            }

            const emotion = emotionMatch[1].trim();
            const emotionScore = parseInt(intensityMatch[1]);
            const empathyMessage = messageMatch[1].trim();

            // 감정을 영어로 매핑 (필요시)
            const emotionMapping = {
                '기쁨': 'joy',
                '슬픔': 'sadness',
                '분노': 'anger',
                '두려움': 'fear',
                '놀람': 'surprise',
                '평온': 'calm',
                '혼재': 'mixed'
            };

            return {
                emotion: emotionMapping[emotion] || emotion,
                emotionKorean: emotion,
                empathyMessage: empathyMessage,
                emotionScore: emotionScore
            };
        } catch (error) {
            console.error('응답 파싱 오류:', error);
            // 파싱 실패시 기본값 반환
            return {
                emotion: 'mixed',
                emotionKorean: '혼재',
                empathyMessage: '소중한 일기를 공유해주셔서 감사합니다. 당신의 감정과 경험을 이해하며, 항상 응원하고 있습니다.',
                emotionScore: 5
            };
        }
    }

    /**
     * OpenRouter API 호출
     */
    async callOpenRouterAPI(prompt, useProxy = false, proxyIndex = 0) {
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Empathy Diary App'
            },
            body: JSON.stringify(requestBody)
        };

        let url = `${this.baseUrl}/chat/completions`;

        if (useProxy) {
            url = this.corsProxies[proxyIndex] + encodeURIComponent(url);
            // 프록시 사용시 Authorization 헤더를 URL 파라미터로 이동
            if (this.corsProxies[proxyIndex].includes('allorigins.win')) {
                requestOptions.headers = {
                    'Content-Type': 'application/json'
                };
                url += `&headers=${encodeURIComponent(JSON.stringify({
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }))}`;
            }
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 일기 감정 분석 메인 함수
     */
    async analyzeDiaryEntry(diaryText) {
        if (!diaryText || diaryText.trim().length === 0) {
            throw new Error('일기 내용을 입력해주세요.');
        }

        // 텍스트 길이 검증 (너무 길면 자르기)
        const maxLength = 2000;
        if (diaryText.length > maxLength) {
            diaryText = diaryText.substring(0, maxLength) + '...';
            console.warn(`텍스트가 너무 길어 ${maxLength}자로 제한되었습니다.`);
        }

        // 먼저 Vercel 서버리스 API 시도 (배포 환경)
        try {
            console.log('Vercel 서버리스 API 호출 시도 중...');
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ diaryText })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('감정 분석 완료 (서버리스):', data);
                    return {
                        emotion: data.emotion,
                        emotionKorean: data.emotionKorean,
                        empathyMessage: data.empathyMessage,
                        emotionScore: data.emotionScore
                    };
                }
            } else {
                console.warn('서버리스 API 호출 실패:', response.status);
            }
        } catch (error) {
            console.warn('서버리스 API 호출 오류:', error.message);
        }

        // 로컬 개발 환경: 직접 OpenRouter API 호출
        const prompt = this.createEmotionAnalysisPrompt(diaryText);

        // 직접 호출 시도
        try {
            console.log('직접 API 호출 시도 중...');
            const response = await this.callOpenRouterAPI(prompt, false);

            if (response.choices && response.choices[0] && response.choices[0].message) {
                const result = this.parseApiResponse(response.choices[0].message.content);
                console.log('감정 분석 완료:', result);
                return result;
            }
        } catch (error) {
            console.warn('직접 호출 실패:', error.message);
            console.log('CORS 프록시를 통한 호출 시도 중...');
        }

        // CORS 프록시를 통한 호출 시도
        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                console.log(`프록시 ${i + 1} 시도 중: ${this.corsProxies[i]}`);
                const response = await this.callOpenRouterAPI(prompt, true, i);

                if (response.choices && response.choices[0] && response.choices[0].message) {
                    const result = this.parseApiResponse(response.choices[0].message.content);
                    console.log('감정 분석 완료 (프록시 사용):', result);
                    this.currentProxyIndex = i; // 성공한 프록시 저장
                    return result;
                }
            } catch (error) {
                console.warn(`프록시 ${i + 1} 실패:`, error.message);
                continue;
            }
        }

        // 모든 시도가 실패한 경우 대체 로직
        console.error('모든 API 호출 방법이 실패했습니다. 로컬 분석 사용.');
        return this.fallbackAnalysis(diaryText);
    }

    /**
     * API 호출 실패시 대체 감정 분석 (로컬 키워드 기반)
     */
    fallbackAnalysis(diaryText) {
        const text = diaryText.toLowerCase();

        // 감정 키워드 매핑
        const emotionKeywords = {
            joy: ['기쁨', '행복', '즐거', '좋', '웃', '사랑', '성공', '축하', '감사'],
            sadness: ['슬픔', '우울', '눈물', '힘들', '아프', '그리워', '외로', '실망'],
            anger: ['화', '짜증', '분노', '열받', '빡쳐', '억울', '답답'],
            fear: ['무서', '두려', '걱정', '불안', '떨려', '긴장'],
            surprise: ['놀라', '신기', '깜짝', '예상밖', '뜻밖'],
            calm: ['평온', '고요', '차분', '안정', '편안']
        };

        let maxScore = 0;
        let detectedEmotion = 'mixed';

        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (text.includes(keyword) ? 1 : 0);
            }, 0);

            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emotion;
            }
        }

        const emotionKoreanMap = {
            joy: '기쁨',
            sadness: '슬픔',
            anger: '분노',
            fear: '두려움',
            surprise: '놀람',
            calm: '평온',
            mixed: '혼재'
        };

        const empathyMessages = {
            joy: '기쁜 순간을 일기에 담아주셔서 감사합니다. 이런 행복한 감정이 오래도록 지속되기를 바랍니다.',
            sadness: '힘든 시간을 겪고 계시는군요. 슬픈 감정도 소중한 경험의 일부입니다. 천천히 회복하시길 바랍니다.',
            anger: '화가 나는 상황이셨군요. 그런 감정을 느끼는 것은 자연스러운 일입니다. 마음이 진정되기를 바랍니다.',
            fear: '불안하고 두려운 마음이 드시는군요. 그런 감정을 인정하고 받아들이는 것이 중요합니다.',
            surprise: '놀라운 경험을 하셨군요. 예상치 못한 일들이 때로는 새로운 기회가 되기도 합니다.',
            calm: '평온한 하루를 보내셨군요. 이런 안정적인 순간들이 소중합니다.',
            mixed: '다양한 감정이 교차하는 하루였군요. 복잡한 감정도 당신의 소중한 경험입니다.'
        };

        return {
            emotion: detectedEmotion,
            emotionKorean: emotionKoreanMap[detectedEmotion],
            empathyMessage: empathyMessages[detectedEmotion],
            emotionScore: Math.min(maxScore + 3, 10) // 3-10 범위로 조정
        };
    }

    /**
     * 연결 테스트
     */
    async testConnection() {
        try {
            const testResult = await this.analyzeDiaryEntry('오늘은 평범한 하루였습니다.');
            console.log('연결 테스트 성공:', testResult);
            return true;
        } catch (error) {
            console.error('연결 테스트 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
const empathyDiary = new EmpathyDiaryBackend();

// 메인 분석 함수 (외부에서 호출 가능)
async function analyzeDiaryEntry(diaryText) {
    return await empathyDiary.analyzeDiaryEntry(diaryText);
}

// 모듈 내보내기 (Node.js 환경에서 사용시)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmpathyDiaryBackend,
        analyzeDiaryEntry
    };
}

// 브라우저 환경에서 전역 함수로 노출
if (typeof window !== 'undefined') {
    window.EmpathyDiaryBackend = EmpathyDiaryBackend;
    window.analyzeDiaryEntry = analyzeDiaryEntry;
    window.empathyDiary = empathyDiary;
}

// 사용 예시
console.log('공감 AI 다이어리 백엔드가 로드되었습니다.');
console.log('사용법: analyzeDiaryEntry("일기 내용").then(result => console.log(result))');