const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { sendDietEmail } = require('../services/emailService');

const router = express.Router();

// 결과 저장
router.post('/', optionalAuth, async (req, res) => {
  console.log('=== RESULTS API CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('========================');
  
  try {
    let requestData = req.body;
    
    // text/plain으로 온 경우 JSON 파싱 시도
    if (req.headers['content-type'] === 'text/plain;charset=UTF-8') {
      try {
        requestData = JSON.parse(req.body);
        console.log('Parsed JSON from text/plain:', requestData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(400).json({
          success: false,
          message: 'JSON 파싱 오류가 발생했습니다.'
        });
      }
    }
    
    const { petInfo, answers, constitution } = requestData;
    const userId = req.user ? req.user.userId : null;

    // 입력값 검증
    if (!petInfo || !answers || !constitution) {
      console.log('Missing data:', { petInfo, answers, constitution });
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.',
        debug: {
          hasPetInfo: !!petInfo,
          hasAnswers: !!answers,
          hasConstitution: !!constitution
        }
      });
    }

    // 결과 저장
    const result = await db.query(
      `INSERT INTO results (user_id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        userId,
        petInfo.name || null,
        petInfo.age || null,
        petInfo.weight || null,
        petInfo.symptoms || null,
        JSON.stringify(answers),
        constitution
      ]
    );

    console.log('Result saved successfully with ID:', result.rows[0].id);
    res.status(201).json({ 
      success: true, 
      message: '결과가 성공적으로 저장되었습니다.',
      data: {
        resultId: result.rows[0].id
      }
    });

  } catch (error) {
    console.error('Server error in /api/results POST:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 사용자별 결과 목록 조회
router.get('/my-results', authenticateToken, async (req, res) => {
  console.log('=== GET MY RESULTS ===');
  console.log('User:', req.user);
  
  try {
    const result = await db.query(
      `SELECT id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution, created_at
       FROM results 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    console.log('Fetched user results:', result.rows.length);
    console.log('User results data:', JSON.stringify(result.rows, null, 2));
    res.json({ 
      success: true, 
      data: { results: result.rows }
    });

  } catch (error) {
    console.error('Server error in /api/results/my-results GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 결과 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(
      `SELECT id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution, created_at
       FROM results 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '결과를 찾을 수 없습니다.'
      });
    }

    res.json({ 
      success: true, 
      data: { result: result.rows[0] }
    });

  } catch (error) {
    console.error('Server error in /api/results/:id GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 이메일로 식단 전송
router.post('/send-email', authenticateToken, async (req, res) => {
  try {
    console.log('=== EMAIL SEND BACKEND DEBUG ===');
    console.log('Raw body:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    
    let requestData = req.body;
    
    // Content-Type이 text/plain인 경우 JSON 파싱
    if (req.get('Content-Type') === 'text/plain;charset=UTF-8') {
      try {
        requestData = JSON.parse(req.body);
        console.log('Parsed JSON from text/plain:', requestData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(400).json({
          success: false,
          message: 'JSON 파싱 오류가 발생했습니다.'
        });
      }
    }
    
    const { resultId, email } = requestData;
    
    console.log('Received resultId:', resultId, 'type:', typeof resultId);
    console.log('Received email:', email);
    
    if (!resultId || !email) {
      console.log('Missing data - resultId:', !!resultId, 'email:', !!email);
      return res.status(400).json({
        success: false,
        message: '결과 ID와 이메일이 필요합니다.'
      });
    }
    
    // resultId를 숫자로 변환
    const numericResultId = parseInt(resultId);
    if (isNaN(numericResultId)) {
      console.log('Invalid resultId:', resultId);
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 결과 ID입니다.'
      });
    }
    
    // 결과 조회
    console.log('Querying with numericResultId:', numericResultId, 'userId:', req.user.userId);
    const result = await db.query(
      'SELECT * FROM results WHERE id = $1 AND user_id = $2',
      [numericResultId, req.user.userId]
    );
    
    console.log('Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '결과를 찾을 수 없습니다.'
      });
    }
    
    const resultData = result.rows[0];
    console.log('Result data:', resultData);
    
    // 안전한 JSON 파싱
    let petInfo, answers;
    try {
      petInfo = resultData.pet_info ? JSON.parse(resultData.pet_info) : {};
      console.log('Parsed petInfo:', petInfo);
    } catch (e) {
      console.error('Error parsing pet_info:', e);
      petInfo = {};
    }
    
    try {
      if (resultData.answers) {
        // 이미 배열인 경우
        if (Array.isArray(resultData.answers)) {
          answers = resultData.answers;
        } 
        // 문자열인 경우
        else if (typeof resultData.answers === 'string') {
          // JSON인지 확인
          if (resultData.answers.startsWith('[') || resultData.answers.startsWith('{')) {
            answers = JSON.parse(resultData.answers);
          } else {
            // 쉼표로 구분된 문자열인 경우
            answers = resultData.answers.split(',').map(item => item.trim());
          }
        }
        // 다른 타입인 경우
        else {
          answers = [];
        }
      } else {
        answers = [];
      }
      console.log('Parsed answers:', answers);
    } catch (e) {
      console.error('Error parsing answers:', e);
      answers = [];
    }
    
    const constitution = resultData.constitution;
    console.log('Constitution:', constitution);
    
    // 이메일 전송
    const emailResult = await sendDietEmail(email, petInfo, constitution, answers);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: '이메일이 성공적으로 전송되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: emailResult.message
      });
    }
    
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '이메일 전송 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
