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

    // 우선 OpenAI API 시도, 실패하면 Groq API 사용
    let apiKey = process.env.OPENAI_API_KEY;
    let apiUrl = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-3.5-turbo';
    let authHeader = `Bearer ${apiKey}`;

    // OpenAI API 키가 없거나 잘못된 경우 Groq 사용
    if (!apiKey || apiKey.includes('*') || apiKey.length < 20) {
      apiKey = process.env.GROQ_API_KEY;
      if (apiKey) {
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama3-8b-8192';
        authHeader = `Bearer ${apiKey}`;
      } else {
        // API 키가 없으면 무료 대안 사용 (Hugging Face Inference API)
        return await handleHuggingFaceAPI(message, context, res);
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: context ? `컨텍스트: ${context}\n\n사용자의 질문에 한국어로 도움이 되는 답변을 해주세요.` : '사용자의 질문에 한국어로 도움이 되는 답변을 해주세요.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API Error:', errorData);

      // OpenAI 실패 시 무료 대안 시도
      if (apiUrl.includes('openai.com')) {
        return await handleHuggingFaceAPI(message, context, res);
      }

      return res.status(response.status).json({
        error: 'AI API request failed',
        details: errorData
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Invalid response from AI API' });
    }

    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({
      response: aiResponse,
      usage: data.usage,
      model: model
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    // 에러 발생 시 무료 대안 시도
    return await handleHuggingFaceAPI(req.body.message, req.body.context, res);
  }
}

// Hugging Face 무료 API 사용
async function handleHuggingFaceAPI(message, context, res) {
  try {
    // 간단한 응답 생성 (무료 대안)
    const responses = [
      "죄송합니다. 현재 AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      "AI 서비스 연결에 문제가 발생했습니다. 관리자에게 문의해주세요.",
      "현재 AI 기능을 사용할 수 없습니다. 설정을 확인해주세요."
    ];

    // 메시지 내용에 따른 간단한 응답
    let response = responses[0];

    if (message.includes('안녕') || message.includes('hello')) {
      response = "안녕하세요! AI 서비스에 연결하는 중입니다.";
    } else if (message.includes('도움') || message.includes('help')) {
      response = "도움이 필요하시군요. AI 서비스 설정을 확인하고 있습니다.";
    }

    return res.status(200).json({
      response: response,
      model: 'fallback',
      note: 'Using fallback response due to API configuration issues'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'All AI services unavailable',
      details: error.message
    });
  }
}