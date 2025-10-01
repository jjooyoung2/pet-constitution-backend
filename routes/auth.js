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
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다.'
      });
    }

    // 비밀번호 해시화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const result = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, name || null]
    );

    const userId = result.rows[0].id;

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId, email },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        token,
        user: {
          id: userId,
          email,
          name: name || null
        }
      }
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.'
      });
    }

    // 사용자 조회
    const result = await db.query(
      'SELECT id, email, password, name, is_admin FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = result.rows[0];

    // 비밀번호 확인
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
      message: '로그인이 완료되었습니다.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin
        }
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, is_admin, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 관리자 계정 생성 (개발용)
router.post('/create-admin', async (req, res) => {
  try {
    const { email = 'admin@onsol.com', password = 'admin123!', name = '관리자' } = req.body;
    
    // 기존 사용자 확인
    const existingUser = await db.query('SELECT id, is_admin FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_admin) {
        return res.json({
          success: true,
          message: '관리자 계정이 이미 존재합니다.',
          admin: { email, is_admin: true }
        });
      } else {
        // 기존 사용자를 관리자로 승격
        await db.query('UPDATE users SET is_admin = true WHERE email = $1', [email]);
        return res.json({
          success: true,
          message: '기존 사용자가 관리자로 승격되었습니다.',
          admin: { email, is_admin: true }
        });
      }
    }

    // 비밀번호 해시화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 관리자 계정 생성
    await db.query(
      'INSERT INTO users (email, password, name, is_admin) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, name, true]
    );

    res.json({
      success: true,
      message: '관리자 계정이 성공적으로 생성되었습니다!',
      admin: { email, is_admin: true }
    });
    
  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '관리자 계정 생성 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
