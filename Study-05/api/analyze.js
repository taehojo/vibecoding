/**
 * Vercel Serverless Function for Empathy Diary Emotion Analysis
 * Uses OpenRouter API to analyze diary entries and provide empathetic responses
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { diaryText } = req.body;

        if (!diaryText || diaryText.trim().length === 0) {
            return res.status(400).json({ error: '일기 내용을 입력해주세요.' });
        }

        // Get API key from environment
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        // Limit text length
        const maxLength = 2000;
        let processedText = diaryText;
        if (processedText.length > maxLength) {
            processedText = processedText.substring(0, maxLength) + '...';
        }

        // Create emotion analysis prompt
        const prompt = `당신은 따뜻하고 공감적인 AI 상담사입니다. 다음 일기 내용을 읽고 감정을 분석한 후, 공감적인 메시지를 작성해주세요.

일기 내용:
"${processedText}"

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

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-empathy-diary.vercel.app',
                'X-Title': 'Empathy Diary App'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `API 호출 실패: ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid API response:', data);
            return res.status(500).json({ error: '유효하지 않은 API 응답입니다.' });
        }

        // Parse the response
        const responseText = data.choices[0].message.content;
        const result = parseApiResponse(responseText);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: '서버 오류가 발생했습니다.',
            message: error.message
        });
    }
}

/**
 * Parse API response to extract emotion, intensity, and message
 */
function parseApiResponse(responseText) {
    try {
        // Extract information using regex
        const emotionMatch = responseText.match(/감정:\s*([가-힣]+)/);
        const intensityMatch = responseText.match(/감정강도:\s*(\d+)/);
        const messageMatch = responseText.match(/공감메시지:\s*(.+?)(?=\n\n|\n감정|\n감정강도|$)/s);

        if (!emotionMatch || !intensityMatch || !messageMatch) {
            throw new Error('응답 형식이 올바르지 않습니다.');
        }

        const emotion = emotionMatch[1].trim();
        const emotionScore = parseInt(intensityMatch[1]);
        const empathyMessage = messageMatch[1].trim();

        // Map Korean emotions to English
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
        console.error('Response parsing error:', error);
        // Return default response on parsing failure
        return {
            emotion: 'mixed',
            emotionKorean: '혼재',
            empathyMessage: '소중한 일기를 공유해주셔서 감사합니다. 당신의 감정과 경험을 이해하며, 항상 응원하고 있습니다.',
            emotionScore: 5
        };
    }
}
