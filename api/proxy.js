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

    // URL 파라미터에서 path 가져오기
    const url = new URL(req.url, `https://${req.headers.host}`);
    const path = url.searchParams.get('path') || '';
    const backendUrl = `${BACKEND_URL}/api/${path}`;

    console.log(`[Proxy] ${req.method} ${req.url} -> ${backendUrl}`);
    console.log(`[Proxy] Request body:`, req.body);

    // 요청 헤더 준비 - 원본 Content-Type 보존
    const headers = {
      ...req.headers,
    };

    // 불필요한 헤더 제거
    delete headers.host;
    delete headers['content-length']; // 자동으로 계산되어야 함
    
    // Vercel이 자동으로 설정하는 헤더들 제거
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-proto'];
    delete headers['x-forwarded-host'];
    delete headers['x-vercel-id'];

    // 요청 바디 준비 - 이미 파싱된 객체인지 확인
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      // req.body가 이미 파싱된 객체인 경우
      if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body);
        // Content-Type이 없으면 설정
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else if (typeof req.body === 'string') {
        // 이미 문자열인 경우 그대로 사용
        body = req.body;
      } else {
        // 기타 경우 JSON으로 변환
        body = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      }
    }

    console.log(`[Proxy] Final headers:`, headers);
    console.log(`[Proxy] Final body:`, body);

    // 백엔드로 요청 전달
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await response.text();
    console.log(`[Proxy] Backend response status:`, response.status);
    console.log(`[Proxy] Backend response data:`, data.substring(0, 200));

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