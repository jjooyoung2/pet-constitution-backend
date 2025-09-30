const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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

module.exports = router;
