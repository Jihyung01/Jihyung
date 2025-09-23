export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, mode } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // OpenAI API 사용
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured in Vercel environment variables' });
    }

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: context
              ? `컨텍스트: ${context}\n\n사용자의 질문에 한국어로 도움이 되고 정확한 답변을 해주세요. 필요시 웹 검색 결과나 최신 정보를 포함해주세요.`
              : '사용자의 질문에 한국어로 도움이 되고 정확한 답변을 해주세요.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);

      return res.status(response.status).json({
        error: 'OpenAI API request failed',
        details: errorData,
        suggestion: 'Vercel 환경변수에서 OPENAI_API_KEY를 확인해주세요.'
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Invalid response from OpenAI API' });
    }

    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({
      response: aiResponse,
      usage: data.usage,
      model: 'gpt-3.5-turbo',
      provider: 'OpenAI'
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      suggestion: 'API 키가 올바른지 Vercel 환경변수를 확인해주세요.'
    });
  }
}

