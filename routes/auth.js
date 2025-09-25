const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.'
      });
    }

    // 이메일 중복 확인
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (row) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 이메일입니다.'
        });
      }

      // 비밀번호 해시화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 사용자 생성
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name || null],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: '사용자 생성 중 오류가 발생했습니다.'
            });
          }

          // JWT 토큰 생성
          const token = jwt.sign(
            { userId: this.lastID, email },
            config.JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
              token,
              user: {
                id: this.lastID,
                email,
                name: name || null
              }
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.'
      });
    }

    // 사용자 조회 (is_admin 포함)
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 비밀번호 검증
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '로그인되었습니다.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            is_admin: user.is_admin === 1
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 조회
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: { 
        user: {
          ...user,
          is_admin: user.is_admin === 1
        }
      }
    });
  });
});

module.exports = router;

