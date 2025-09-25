const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'pet_constitution.db');

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
  }
});

// user_id 컬럼 추가
db.run(`
  ALTER TABLE consultations 
  ADD COLUMN user_id INTEGER
`, (err) => {
  if (err) {
    console.error('컬럼 추가 오류:', err.message);
  } else {
    console.log('user_id 컬럼이 성공적으로 추가되었습니다.');
  }
  
  // 외래키 제약조건 추가
  db.run(`
    CREATE TABLE IF NOT EXISTS consultations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('새 테이블 생성 오류:', err.message);
    } else {
      console.log('새 consultations 테이블이 생성되었습니다.');
      
      // 기존 데이터 복사
      db.run(`
        INSERT INTO consultations_new (id, name, phone, preferred_date, content, status, created_at, updated_at)
        SELECT id, name, phone, preferred_date, content, status, created_at, updated_at
        FROM consultations
      `, (err) => {
        if (err) {
          console.error('데이터 복사 오류:', err.message);
        } else {
          console.log('기존 데이터가 복사되었습니다.');
          
          // 기존 테이블 삭제
          db.run(`DROP TABLE consultations`, (err) => {
            if (err) {
              console.error('기존 테이블 삭제 오류:', err.message);
            } else {
              console.log('기존 테이블이 삭제되었습니다.');
              
              // 새 테이블 이름 변경
              db.run(`ALTER TABLE consultations_new RENAME TO consultations`, (err) => {
                if (err) {
                  console.error('테이블 이름 변경 오류:', err.message);
                } else {
                  console.log('마이그레이션이 완료되었습니다!');
                }
                
                db.close();
              });
            }
          });
        }
      });
    }
  });
});


