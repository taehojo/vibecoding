/**
 * Vercel 서버리스 함수 - 레시피 생성
 * API 키를 서버 측에서 관리
 */

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, imageBase64, type } = req.body;

        // 환경변수에서 API 키 가져오기
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Server configuration error: API key not set'
            });
        }

        // 이미지 크기 체크 (Base64 문자열 길이로 대략적인 크기 추정)
        if (imageBase64) {
            const imageSizeKB = (imageBase64.length * 0.75) / 1024; // Base64는 원본의 약 133%
            console.log(`이미지 크기 (추정): ${imageSizeKB.toFixed(2)} KB`);

            // 5MB 제한 (OpenRouter/Gemma의 일반적인 제한)
            if (imageSizeKB > 5120) {
                return res.status(400).json({
                    error: '이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 사용해주세요.',
                    size: `${imageSizeKB.toFixed(2)} KB`
                });
            }
        }

        // OpenRouter API 호출
        const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

        // content 구성
        let content;
        if (imageBase64) {
            content = [
                {
                    type: "text",
                    text: prompt
                },
                {
                    type: "image_url",
                    image_url: {
                        url: imageBase64
                    }
                }
            ];
        } else {
            content = prompt;
        }

        const requestBody = {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 2000,  // 토큰 증가
            temperature: 0.7,
            top_p: 0.9,  // 응답 다양성 증가
            frequency_penalty: 0.0,
            presence_penalty: 0.0
        };

        console.log('이미지 포함:', !!imageBase64);

        const response = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-fridge.vercel.app',
                'X-Title': 'Fridge Recipe App'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            return res.status(response.status).json({
                error: `AI API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('OpenRouter 응답:', JSON.stringify(data, null, 2));

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content || '';

            // 빈 응답 체크
            if (!content || content.trim() === '') {
                console.warn('AI가 빈 응답을 반환했습니다.');
                return res.status(200).json({
                    success: false,
                    error: 'AI가 이미지를 처리하지 못했습니다.',
                    content: ''
                });
            }

            return res.status(200).json({
                success: true,
                content: content
            });
        } else {
            console.error('잘못된 응답 구조:', data);
            return res.status(500).json({
                error: 'Invalid response from AI API',
                responseData: data
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
