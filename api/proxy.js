// Vercel API 프록시 - 백엔드 서버로 요청 전달
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 백엔드 서버 URL (환경변수에서 가져오거나 기본값 사용)
    const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_URL || 'https://jihyung.onrender.com';

    // 요청 경로에서 /api 제거하고 백엔드로 전달
    const path = req.url.replace('/api/', '/api/');
    const backendUrl = `${BACKEND_URL}${path}`;

    console.log(`[Proxy] ${req.method} ${req.url} -> ${backendUrl}`);

    // 요청 헤더 준비
    const headers = {
      'Content-Type': 'application/json',
      ...req.headers,
    };

    // host 헤더 제거 (백엔드 서버와 충돌 방지)
    delete headers.host;

    // 요청 바디 준비
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = JSON.stringify(req.body);
    }

    // 백엔드로 요청 전달
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await response.text();

    // 응답 상태와 헤더 설정
    res.status(response.status);

    // Content-Type 헤더 복사
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // 응답 반환
    if (contentType && contentType.includes('application/json')) {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.send(data);
      }
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('[Proxy Error]:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      details: 'API 프록시에서 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
      timestamp: new Date().toISOString()
    });
  }
}