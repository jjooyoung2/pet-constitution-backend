const express = require('express');
const db = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 결과 저장
router.post('/', optionalAuth, (req, res) => {
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

    // 입력값 검증
    if (!petInfo || !answers || !constitution) {
      console.log('Missing data:', { petInfo, answers, constitution });
      return res.status(400).json({
        success: false,
        message: '필수 데이터가 누락되었습니다.',
        debug: {
          hasPetInfo: !!petInfo,
          hasAnswers: !!answers,
          hasConstitution: !!constitution
        }
      });
    }

    // answers가 배열이고 비어있지 않은지 확인
    if (!Array.isArray(answers) || answers.length === 0) {
      console.log('Invalid answers:', answers);
      return res.status(400).json({
        success: false,
        message: '설문 답변이 올바르지 않습니다.'
      });
    }

    // petInfo 안전하게 추출 (기본값 설정)
    const { 
      name: petName = '이름 없음', 
      age: petAge = '', 
      weight: petWeight = '', 
      symptoms: petSymptoms = '' 
    } = petInfo;
    const userId = req.user ? req.user.userId : null;

    // 결과 저장
    db.run(
      `INSERT INTO results (user_id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, petName, petAge, petWeight, petSymptoms, JSON.stringify(answers), constitution],
      function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '결과 저장 중 오류가 발생했습니다.'
          });
        }

        res.status(201).json({
          success: true,
          message: userId ? '결과가 저장되었습니다.' : '결과가 임시 저장되었습니다.',
          data: {
            resultId: this.lastID,
            isLoggedIn: !!userId
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 사용자 결과 목록 조회 (로그인 사용자만)
router.get('/my-results', authenticateToken, (req, res) => {
  db.all(
    `SELECT id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution, created_at 
     FROM results 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [req.user.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '결과 조회 중 오류가 발생했습니다.'
        });
      }

      // answers를 JSON으로 파싱
      const formattedResults = results.map(result => ({
        ...result,
        answers: JSON.parse(result.answers)
      }));

      res.json({
        success: true,
        data: { results: formattedResults }
      });
    }
  );
});

// 특정 결과 조회
router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.userId : null;

  let query = 'SELECT * FROM results WHERE id = ?';
  let params = [id];

  // 로그인하지 않은 사용자는 자신의 결과만 조회 가능하도록 제한
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  db.get(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '결과 조회 중 오류가 발생했습니다.'
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '결과를 찾을 수 없습니다.'
      });
    }

    // answers를 JSON으로 파싱
    result.answers = JSON.parse(result.answers);

    res.json({
      success: true,
      data: { result }
    });
  });
});

// 결과 삭제 (로그인 사용자만)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM results WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '결과 삭제 중 오류가 발생했습니다.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '결과를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '결과가 삭제되었습니다.'
      });
    }
  );
});

module.exports = router;
