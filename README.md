# 반려동물 체질 진단 백엔드 API

Node.js + Express + SQLite를 사용한 백엔드 API 서버입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
cd pet-constitution-backend
npm install
```

### 2. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

### 3. 서버 확인
- API 서버: http://localhost:5000
- React 앱: http://localhost:3000

## API 엔드포인트

### 인증 (Authentication)

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자명" (선택사항)
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 사용자 정보 조회
```
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

### 결과 (Results)

#### 결과 저장
```
POST /api/results
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN> (선택사항)

{
  "petInfo": {
    "name": "멍멍이",
    "age": "24",
    "weight": "5.2",
    "symptoms": "가끔 설사"
  },
  "answers": ["목", "화", "토", "금", "수"],
  "constitution": "목"
}
```

#### 내 결과 목록 조회 (로그인 사용자만)
```
GET /api/results/my-results
Authorization: Bearer <JWT_TOKEN>
```

#### 특정 결과 조회
```
GET /api/results/:id
Authorization: Bearer <JWT_TOKEN> (선택사항)
```

#### 결과 삭제 (로그인 사용자만)
```
DELETE /api/results/:id
Authorization: Bearer <JWT_TOKEN>
```

## 데이터베이스

SQLite 데이터베이스가 자동으로 생성됩니다:
- `pet_constitution.db` 파일이 프로젝트 루트에 생성됩니다.

### 테이블 구조

#### users 테이블
- id: 사용자 ID (Primary Key)
- email: 이메일 (Unique)
- password: 해시된 비밀번호
- name: 사용자명
- created_at: 생성일시
- updated_at: 수정일시

#### results 테이블
- id: 결과 ID (Primary Key)
- user_id: 사용자 ID (Foreign Key, NULL 가능)
- pet_name: 반려동물 이름
- pet_age: 반려동물 나이
- pet_weight: 반려동물 체중
- pet_symptoms: 주요 증상
- answers: 설문 답변 (JSON)
- constitution: 체질 결과
- created_at: 생성일시

## 보안

- JWT 토큰 기반 인증
- bcrypt를 사용한 비밀번호 해시화
- CORS 설정으로 React 앱과 연동
- 입력값 검증 및 에러 핸들링

## 개발 환경

- Node.js 14+
- Express 4.18+
- SQLite3 5.1+
- JWT 9.0+
- bcryptjs 2.4+




