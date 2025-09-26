const pool = require('./config/database');

const initDatabase = async () => {
  try {
    console.log('🔧 데이터베이스 초기화 시작...');
    
    // 사용자 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 결과 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        pet_name VARCHAR(255) NOT NULL,
        pet_age VARCHAR(50) NOT NULL,
        pet_weight VARCHAR(50) NOT NULL,
        pet_symptoms TEXT NOT NULL,
        answers TEXT NOT NULL,
        constitution VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 상담 문의 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        preferred_date VARCHAR(100),
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ 데이터베이스 초기화 완료!');
    
    // 관리자 계정 생성
    const adminEmail = 'admin@onsol.com';
    const adminPassword = 'admin123!';
    const adminName = '관리자';
    
    // 기존 관리자 확인
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      // 새 관리자 생성
      await pool.query(
        'INSERT INTO users (email, password, name, is_admin) VALUES ($1, $2, $3, $4)',
        [adminEmail, adminPassword, adminName, true]
      );
      console.log('✅ 관리자 계정 생성 완료!');
    } else {
      // 기존 사용자를 관리자로 승격
      await pool.query(
        'UPDATE users SET is_admin = true WHERE email = $1',
        [adminEmail]
      );
      console.log('✅ 기존 사용자를 관리자로 승격 완료!');
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 오류:', error);
  }
};

module.exports = initDatabase;
