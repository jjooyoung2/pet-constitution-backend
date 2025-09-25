require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

// 라우터 import
const authRoutes = require('./routes/auth');
const resultRoutes = require('./routes/results');
const consultationRoutes = require('./routes/consultations');
const userRoutes = require('./routes/users');
const emailRoutes = require('./routes/email');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: true, // 모든 도메인 허용
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 모든 요청 로그
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '반려동물 체질 진단 API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      results: {
        create: 'POST /api/results',
        getMyResults: 'GET /api/results/my-results',
        getResult: 'GET /api/results/:id',
        deleteResult: 'DELETE /api/results/:id'
      },
      consultations: {
        create: 'POST /api/consultations',
        getAll: 'GET /api/consultations',
        updateStatus: 'PUT /api/consultations/:id/status'
      },
      users: {
        getAll: 'GET /api/users',
        getUserDetail: 'GET /api/users/:id'
      },
      email: {
        sendMealPlan: 'POST /api/email/send-meal-plan'
      }
    }
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 API 문서: http://localhost:${PORT}`);
  console.log(`🔗 React 앱: http://localhost:3000`);
});
