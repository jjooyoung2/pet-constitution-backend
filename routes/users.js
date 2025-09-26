const express = require('express');
const db = require('../database');

const router = express.Router();

// 회원 목록 조회 (관리자용)
router.get('/', (req, res) => {
  console.log('=== GET USERS ===');
  
  try {
    db.all(
      `SELECT DISTINCT u.id, u.name, u.phone, u.email, u.created_at
       FROM users u
       ORDER BY u.created_at DESC`,
      [],
      (err, users) => {
        if (err) {
          console.error('Error fetching users:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '회원 목록 조회 중 오류가 발생했습니다.' 
          });
        }
        
        console.log('Fetched users:', users.length);
        res.json({ 
          success: true, 
          data: { users }
        });
      }
    );
  } catch (error) {
    console.error('Server error in /api/users GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 회원 상세 조회 (관리자용)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('=== GET USER DETAIL ===');
  console.log('User ID:', id);
  
  try {
    // 회원 기본 정보 조회
    db.get(
      `SELECT id, name, phone, email, created_at
       FROM users 
       WHERE id = ?`,
      [id],
      (err, user) => {
        if (err) {
          console.error('Error fetching user:', err.message);
          return res.status(500).json({ 
            success: false, 
            message: '회원 정보 조회 중 오류가 발생했습니다.' 
          });
        }
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: '회원을 찾을 수 없습니다.'
          });
        }
        
        // 회원의 설문 결과 조회
        db.all(
          `SELECT id, pet_name, pet_age, pet_weight, pet_symptoms, answers, constitution, created_at
           FROM results 
           WHERE user_id = ? 
           ORDER BY created_at DESC`,
          [id],
          (err, results) => {
            if (err) {
              console.error('Error fetching user results:', err.message);
              return res.status(500).json({ 
                success: false, 
                message: '회원 설문 결과 조회 중 오류가 발생했습니다.' 
              });
            }
            
            // 회원의 상담 예약 조회
            db.all(
              `SELECT id, name, phone, preferred_date, content, status, created_at, updated_at
               FROM consultations 
               WHERE user_id = ? 
               ORDER BY created_at DESC`,
              [id],
              (err, consultations) => {
                if (err) {
                  console.error('Error fetching user consultations:', err.message);
                  return res.status(500).json({ 
                    success: false, 
                    message: '회원 상담 예약 조회 중 오류가 발생했습니다.' 
                  });
                }
                
                // answers를 JSON으로 파싱
                const formattedResults = results.map(result => ({
                  ...result,
                  answers: JSON.parse(result.answers)
                }));
                
                console.log('Fetched user detail successfully');
                res.json({ 
                  success: true, 
                  data: { 
                    user,
                    results: formattedResults,
                    consultations
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Server error in /api/users/:id GET:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;



