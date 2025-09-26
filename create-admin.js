const bcrypt = require('bcryptjs');
const db = require('./database');

// 관리자 계정 생성 또는 권한 부여 스크립트
const createAdmin = async () => {
  const adminEmail = 'admin@onsol.com';
  const adminPassword = 'admin123!';
  const adminName = '관리자';

  try {
    // 기존 사용자 확인
    db.get('SELECT id, is_admin FROM users WHERE email = ?', [adminEmail], async (err, existingUser) => {
      if (err) {
        console.error('데이터베이스 오류:', err.message);
        return;
      }

      if (existingUser) {
        if (existingUser.is_admin) {
          console.log('관리자 계정이 이미 존재합니다.');
          console.log('이메일:', adminEmail);
          return;
        } else {
          // 기존 사용자를 관리자로 승격
          db.run(
            'UPDATE users SET is_admin = 1 WHERE email = ?',
            [adminEmail],
            function(err) {
              if (err) {
                console.error('관리자 권한 부여 오류:', err.message);
                return;
              }
              console.log('✅ 기존 사용자가 관리자로 승격되었습니다!');
              console.log('📧 이메일:', adminEmail);
              db.close();
            }
          );
          return;
        }
      }

      // 비밀번호 해시화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // 관리자 계정 생성
      db.run(
        'INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, ?)',
        [adminEmail, hashedPassword, adminName, 1],
        function(err) {
          if (err) {
            console.error('관리자 계정 생성 오류:', err.message);
            return;
          }

          console.log('✅ 관리자 계정이 성공적으로 생성되었습니다!');
          console.log('📧 이메일:', adminEmail);
          console.log('🔑 비밀번호:', adminPassword);
          console.log('⚠️  보안을 위해 로그인 후 비밀번호를 변경해주세요.');
          
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('스크립트 실행 오류:', error.message);
  }
};

// 스크립트 실행
createAdmin();



