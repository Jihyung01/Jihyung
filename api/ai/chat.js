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

    // 무료 Hugging Face API 사용
    return await handleHuggingFaceAPI(message, context, res);

  } catch (error) {
    console.error('Chat API Error:', error);
    return await handleFallbackResponse(message, context, res);
  }
}

// Hugging Face 무료 API 사용
async function handleHuggingFaceAPI(message, context, res) {
  try {
    // 무료 Hugging Face Inference API 호출
    const models = [
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'microsoft/DialoGPT-medium'
    ];

    for (const model of models) {
      try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: message,
            parameters: {
              max_length: 150,
              temperature: 0.7,
              do_sample: true
            }
          })
        });

        if (response.ok) {
          const data = await response.json();

          let aiResponse = '';
          if (Array.isArray(data) && data[0]?.generated_text) {
            aiResponse = data[0].generated_text.replace(message, '').trim();
          } else if (data?.generated_text) {
            aiResponse = data.generated_text.replace(message, '').trim();
          }

          if (aiResponse && aiResponse.length > 10) {
            return res.status(200).json({
              response: aiResponse,
              model: model,
              provider: 'HuggingFace (Free)'
            });
          }
        }
      } catch (modelError) {
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }

    // 모든 모델이 실패하면 스마트한 패턴 매칭 응답 사용
    return await handleSmartResponse(message, context, res);

  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return await handleSmartResponse(message, context, res);
  }
}

// 스마트한 패턴 매칭 기반 응답
async function handleSmartResponse(message, context, res) {
  try {
    const msg = message.toLowerCase();
    let response = '';

    // 인사말 처리
    if (msg.includes('안녕') || msg.includes('hello') || msg.includes('hi')) {
      const greetings = [
        "안녕하세요! 무엇을 도와드릴까요?",
        "반갑습니다! 어떤 질문이 있으신가요?",
        "안녕하세요! 오늘 하루는 어떠세요?"
      ];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 도움 요청 처리
    else if (msg.includes('도움') || msg.includes('help') || msg.includes('알려줘')) {
      response = "무엇을 도와드릴까요? 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.";
    }

    // 검색 요청 처리
    else if (msg.includes('찾아줘') || msg.includes('검색') || msg.includes('링크')) {
      if (msg.includes('교보문고') || msg.includes('책')) {
        response = "교보문고에서 책을 찾아드리고 싶지만, 현재는 직접 검색 기능을 제공하지 못합니다. 교보문고 웹사이트(www.kyobobook.co.kr)에서 직접 검색해보시기 바랍니다.";
      } else {
        response = "죄송하지만 현재 웹 검색 기능은 지원하지 않습니다. 관련 웹사이트를 직접 방문하시거나 검색엔진을 이용해보세요.";
      }
    }

    // 일반적인 질문들
    else if (msg.includes('시간') || msg.includes('날짜')) {
      const now = new Date();
      response = `현재 시간은 ${now.toLocaleString('ko-KR')}입니다.`;
    }

    else if (msg.includes('날씨')) {
      response = "죄송하지만 실시간 날씨 정보는 제공하지 못합니다. 날씨 앱이나 포털 사이트에서 확인해보세요.";
    }

    else if (msg.includes('고마워') || msg.includes('감사')) {
      response = "천만에요! 더 도움이 필요하시면 언제든 말씀해주세요.";
    }

    // 기본 응답
    else {
      const defaultResponses = [
        "흥미로운 질문이네요. 더 구체적으로 설명해주시면 더 도움이 될 것 같습니다.",
        "그에 대해 생각해볼 점이 많네요. 어떤 관점에서 접근하고 싶으신가요?",
        "좋은 주제입니다. 관련해서 더 알고 싶은 특정한 부분이 있나요?",
        "말씀하신 내용에 대해 더 자세히 알려주시면 더 구체적인 답변을 드릴 수 있을 것 같습니다."
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    return res.status(200).json({
      response: response,
      model: 'smart-pattern-matching',
      provider: 'Built-in (Free)',
      note: 'AI 서비스 무료 버전 사용 중'
    });

  } catch (error) {
    return await handleFallbackResponse(message, context, res);
  }
}

// 최종 대안 응답
async function handleFallbackResponse(message, context, res) {
  return res.status(200).json({
    response: "죄송합니다. 현재 AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
    model: 'fallback',
    provider: 'Emergency Response'
  });
}