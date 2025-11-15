/**
 * Vercel Serverless Function for PDF Summarization
 * Uses OpenRouter API to summarize PDF text content
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
        const { text, fileName, summaryMode = 'normal' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'PDF 텍스트를 입력해주세요.' });
        }

        // Get API key from environment
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
        }

        // Limit text length
        const maxLength = 8000;
        let processedText = text;
        if (processedText.length > maxLength) {
            processedText = processedText.substring(0, maxLength) + '...';
        }

        // 요약 모드에 따른 프롬프트 설정
        const modeInstructions = {
            brief: '다음 텍스트를 3-5줄로 아주 간단하게 요약해주세요. 핵심만 간단명료하게 정리하고, 핵심포인트는 3개만 작성해주세요.',
            normal: '다음 텍스트를 적당한 길이로 요약해주세요. 주요 내용을 빠짐없이 포함하되 간결하게 정리하고, 핵심포인트는 5개 작성해주세요.',
            detailed: '다음 텍스트를 상세하게 요약해주세요. 중요한 세부사항과 맥락을 포함하여 충분히 설명하고, 핵심포인트는 7개 이상 작성해주세요.'
        };

        const modeInstruction = modeInstructions[summaryMode] || modeInstructions.normal;

        // Create summarization prompt
        const prompt = `당신은 전문적인 문서 요약 AI입니다. ${modeInstruction}

문서 제목: ${fileName || '제목 없음'}

문서 내용:
"${processedText}"

다음 형식으로 정확히 응답해주세요:

주요내용: [요약 내용]
핵심포인트:
- [핵심 포인트 1]
- [핵심 포인트 2]
- [핵심 포인트 3]
${summaryMode === 'detailed' ? '- [핵심 포인트 4]\n- [핵심 포인트 5]\n- [핵심 포인트 6]\n- [핵심 포인트 7]' : summaryMode === 'normal' ? '- [핵심 포인트 4]\n- [핵심 포인트 5]' : ''}

응답 규칙:
1. 주요내용은 문서의 가장 중요한 정보를 ${summaryMode === 'brief' ? '아주 간단하게' : summaryMode === 'detailed' ? '상세하게' : '간결하게'} 요약
2. 명확하고 이해하기 쉬운 한국어로 작성
3. 원문의 의미를 왜곡하지 말 것
4. 객관적이고 사실적인 톤 유지`;

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'https://vibecoding-ch07.vercel.app',
                'X-Title': 'PDF Summarizer App'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
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
 * Parse API response to extract summary and key points
 */
function parseApiResponse(responseText) {
    try {
        // Extract main content and key points
        const mainContentMatch = responseText.match(/주요내용:\s*(.+?)(?=\n핵심포인트:|\n\n|$)/s);
        const keyPointsMatch = responseText.match(/핵심포인트:\s*([\s\S]+?)(?=\n\n|$)/);

        let mainContent = '요약 정보를 추출할 수 없습니다.';
        let keyPoints = [];

        if (mainContentMatch) {
            mainContent = mainContentMatch[1].trim();
        }

        if (keyPointsMatch) {
            const pointsText = keyPointsMatch[1];
            // Extract bullet points
            const points = pointsText.match(/[-•]\s*(.+?)(?=\n-|\n•|$)/g);
            if (points) {
                keyPoints = points.map(p => p.replace(/^[-•]\s*/, '').trim());
            }
        }

        return {
            mainContent,
            keyPoints,
            fullResponse: responseText
        };
    } catch (error) {
        console.error('Response parsing error:', error);
        // Return default response on parsing failure
        return {
            mainContent: '문서 요약 중 오류가 발생했습니다.',
            keyPoints: ['요약 정보를 추출할 수 없습니다.'],
            fullResponse: responseText
        };
    }
}
