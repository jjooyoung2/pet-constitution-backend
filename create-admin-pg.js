const bcrypt = require('bcryptjs');
const { query } = require('./database');

// 관리자 계정 생성 또는 권한 부여 스크립트 (PostgreSQL)
const createAdmin = async () => {
  console.log('🔧 create-admin-pg.js 실행 시작');
  const adminEmail = 'admin@onsol.com'; // 관리자 이메일
  const adminPassword = 'admin123!';
  const adminName = '관리자';

  try {
    // 기존 사용자 확인
    const existingUser = await query('SELECT id, is_admin FROM users WHERE email = $1', [adminEmail]);
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.is_admin) {
        console.log('관리자 계정이 이미 존재합니다.');
        console.log('이메일:', adminEmail);
        return;
      } else {
        // 기존 사용자를 관리자로 승격
        await query('UPDATE users SET is_admin = true WHERE email = $1', [adminEmail]);
        console.log('✅ 기존 사용자가 관리자로 승격되었습니다!');
        console.log('📧 이메일:', adminEmail);
        return;
      }
    }

    // 비밀번호 해시화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // 관리자 계정 생성
    await query(
      'INSERT INTO users (email, password, name, is_admin) VALUES ($1, $2, $3, $4)',
      [adminEmail, hashedPassword, adminName, true]
    );

    console.log('✅ 관리자 계정이 성공적으로 생성되었습니다!');
    console.log('📧 이메일:', adminEmail);
    console.log('🔑 비밀번호:', adminPassword);
    console.log('⚠️  보안을 위해 로그인 후 비밀번호를 변경해주세요.');
    
  } catch (error) {
    console.error('스크립트 실행 오류:', error.message);
  }
};

// 스크립트 실행
createAdmin();

