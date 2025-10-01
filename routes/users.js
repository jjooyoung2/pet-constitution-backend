const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 사용자 목록 조회 (관리자용)
router.get('/', async (req, res) => {
  console.log('=== GET USERS ===');
  
  try {
    const result = await db.query(
      `SELECT id, email, name, phone, is_admin, created_at
       FROM users 
       ORDER BY created_at DESC`
    );

    console.log('Fetched users:', result.rows.length);
    res.json({ 
      success: true, 
      data: { users: result.rows }
    });

  } catch (error) {
    console.error('Server error in /api/users GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 사용자 상세 조회 (관리자용)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log('=== GET USER DETAIL ===');
  console.log('User ID:', id);
  
  try {
    // 사용자 정보 조회
    const userResult = await db.query(
      `SELECT id, email, name, phone, is_admin, created_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = userResult.rows[0];

    // 사용자의 진단 결과 조회
    const resultsResult = await db.query(
      `SELECT id, pet_name, pet_age, pet_weight, constitution, created_at
       FROM results 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // 사용자의 상담 예약 조회
    const consultationsResult = await db.query(
      `SELECT id, name, phone, preferred_date, content, status, created_at
       FROM consultations 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    console.log('Fetched user detail:', {
      user: user.email,
      resultsCount: resultsResult.rows.length,
      consultationsCount: consultationsResult.rows.length
    });

    res.json({ 
      success: true, 
      data: {
        user,
        results: resultsResult.rows,
        consultations: consultationsResult.rows
      }
    });

  } catch (error) {
    console.error('Server error in /api/users/:id GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;
