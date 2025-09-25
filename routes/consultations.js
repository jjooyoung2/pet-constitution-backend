const express = require('express');
const db = require('../database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 상담 예약 저장
router.post('/', optionalAuth, (req, res) => {
  console.log('=== CONSULTATION API CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('===============================');
  
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
    
    const { name, phone, preferredDate, content } = requestData;
    const userId = req.user ? req.user.userId : null;

    // 입력값 검증
    if (!name || !phone || !preferredDate || !content) {
      console.log('Missing data:', { name, phone, preferredDate, content });
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.',
        debug: {
          hasName: !!name,
          hasPhone: !!phone,
          hasPreferredDate: !!preferredDate,
          hasContent: !!content
        }
      });
    }

    // 전화번호 형식 검증
    const phoneRegex = /^[0-9-+\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '올바른 전화번호 형식을 입력해주세요.'
      });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(preferredDate)) {
      return res.status(400).json({
        success: false,
        message: '올바른 날짜 형식을 입력해주세요.'
      });
    }

    // 오늘 이전 날짜 체크
    const today = new Date().toISOString().split('T')[0];
    if (preferredDate < today) {
      return res.status(400).json({
        success: false,
        message: '오늘 이후 날짜를 선택해주세요.'
      });
    }

    // 상담 예약 저장
    db.run(
      `INSERT INTO consultations (user_id, name, phone, preferred_date, content, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, phone, preferredDate, content, 'pending', new Date().toISOString()],
      function(err) {
        if (err) {
          console.error('Error saving consultation:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '상담 예약 저장 중 오류가 발생했습니다.' 
          });
        }
        
        console.log('Consultation saved successfully with ID:', this.lastID);
        res.status(201).json({ 
          success: true, 
          message: '상담 예약이 성공적으로 저장되었습니다.',
          consultationId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Server error in /api/consultations POST:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 사용자별 상담 예약 목록 조회
router.get('/my-consultations', authenticateToken, (req, res) => {
  console.log('=== GET MY CONSULTATIONS ===');
  console.log('User:', req.user);
  
  try {
    db.all(
      `SELECT id, name, phone, preferred_date, content, status, created_at, updated_at
       FROM consultations 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.userId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching user consultations:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '상담 예약 목록 조회 중 오류가 발생했습니다.' 
          });
        }
        
        console.log('Fetched user consultations:', rows.length);
        res.json({ 
          success: true, 
          data: { consultations: rows }
        });
      }
    );
  } catch (error) {
    console.error('Server error in /api/consultations/my-consultations GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 상담 예약 목록 조회 (관리자용)
router.get('/', (req, res) => {
  console.log('=== GET CONSULTATIONS ===');
  
  try {
    db.all(
      `SELECT id, name, phone, preferred_date, content, status, created_at
       FROM consultations 
       ORDER BY created_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching consultations:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '상담 예약 목록 조회 중 오류가 발생했습니다.' 
          });
        }
        
        console.log('Fetched consultations:', rows.length);
        res.json({ 
          success: true, 
          data: { consultations: rows }
        });
      }
    );
  } catch (error) {
    console.error('Server error in /api/consultations GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 상담 예약 상태 업데이트 (관리자용)
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('=== UPDATE CONSULTATION STATUS ===');
  console.log('ID:', id, 'Status:', status);
  
  if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '올바른 상태값을 입력해주세요.'
    });
  }
  
  try {
    db.run(
      `UPDATE consultations SET status = ?, updated_at = ? WHERE id = ?`,
      [status, new Date().toISOString(), id],
      function(err) {
        if (err) {
          console.error('Error updating consultation status:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '상담 예약 상태 업데이트 중 오류가 발생했습니다.' 
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: '해당 상담 예약을 찾을 수 없습니다.'
          });
        }
        
        console.log('Consultation status updated successfully');
        res.json({ 
          success: true, 
          message: '상담 예약 상태가 업데이트되었습니다.'
        });
      }
    );
  } catch (error) {
    console.error('Server error in /api/consultations PUT:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;
