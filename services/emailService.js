const sgMail = require('@sendgrid/mail');

// SendGrid API 키 설정
const apiKey = process.env.SENDGRID_API_KEY;
console.log('SendGrid API Key exists:', !!apiKey);
console.log('SendGrid API Key length:', apiKey ? apiKey.length : 0);

if (!apiKey) {
  console.error('SENDGRID_API_KEY is not set!');
  throw new Error('SENDGRID_API_KEY environment variable is required');
}

sgMail.setApiKey(apiKey);

// 이메일 전송 함수
const sendDietEmail = async (to, petInfo, constitution, answers) => {
  try {
    // 체질별 식단 정보
    const dietInfo = getDietByConstitution(constitution);
    
    // 이메일 템플릿
    const emailContent = createEmailTemplate(petInfo, constitution, dietInfo, answers);
    
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
    console.log('From email:', fromEmail);
    
    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: 'Pet Constitution'
      },
      subject: `🐾 ${petInfo.pet_name}님의 맞춤 식단 가이드`,
      html: emailContent,
    };
    
    console.log('Email message:', {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    await sgMail.send(msg);
    console.log('이메일 전송 성공:', to);
    return { success: true, message: '이메일이 성공적으로 전송되었습니다.' };
    
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, message: `이메일 전송에 실패했습니다: ${error.message}` };
  }
};

// 체질별 식단 정보
const getDietByConstitution = (constitution) => {
  const dietData = {
    '태양인': {
      title: '태양인 체질',
      description: '활발하고 에너지가 넘치는 체질',
      foods: [
        '닭고기, 오리고기 (차가운 성질)',
        '오이, 토마토, 상추 (시원한 채소)',
        '수박, 참외, 배 (차가운 과일)',
        '녹차, 민들레차 (차가운 음료)'
      ],
      avoid: [
        '소고기, 돼지고기 (따뜻한 성질)',
        '고추, 마늘, 생강 (열성 식품)',
        '술, 커피 (열성 음료)'
      ],
      tips: '시원하고 차가운 성질의 음식을 주로 먹되, 과도하지 않게 균형을 맞추세요.'
    },
    '태음인': {
      title: '태음인 체질',
      description: '안정적이고 보수적인 체질',
      foods: [
        '소고기, 돼지고기 (따뜻한 성질)',
        '당근, 호박, 고구마 (따뜻한 채소)',
        '사과, 복숭아, 자두 (따뜻한 과일)',
        '생강차, 인삼차 (따뜻한 음료)'
      ],
      avoid: [
        '닭고기, 오리고기 (차가운 성질)',
        '오이, 토마토 (차가운 채소)',
        '수박, 참외 (차가운 과일)'
      ],
      tips: '따뜻하고 보양이 되는 음식을 주로 먹되, 과식하지 않도록 주의하세요.'
    },
    '소양인': {
      title: '소양인 체질',
      description: '민감하고 예민한 체질',
      foods: [
        '생선, 해산물 (중성 성질)',
        '브로콜리, 시금치 (중성 채소)',
        '포도, 딸기 (중성 과일)',
        '보리차, 옥수수차 (중성 음료)'
      ],
      avoid: [
        '매운 음식, 자극적인 음식',
        '과도한 양념, 인스턴트 식품',
        '술, 담배, 카페인'
      ],
      tips: '자극적이지 않은 중성적인 음식을 골고루 먹되, 규칙적인 식사를 하세요.'
    },
    '소음인': {
      title: '소음인 체질',
      description: '조용하고 내성적인 체질',
      foods: [
        '닭고기, 오리고기 (차가운 성질)',
        '오이, 토마토, 상추 (시원한 채소)',
        '수박, 참외, 배 (차가운 과일)',
        '녹차, 민들레차 (차가운 음료)'
      ],
      avoid: [
        '소고기, 돼지고기 (따뜻한 성질)',
        '고추, 마늘, 생강 (열성 식품)',
        '술, 커피 (열성 음료)'
      ],
      tips: '시원하고 차가운 성질의 음식을 주로 먹되, 영양 균형을 맞추세요.'
    }
  };
  
  return dietData[constitution] || dietData['소양인'];
};

// 이메일 템플릿 생성
const createEmailTemplate = (petInfo, constitution, dietInfo, answers) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${petInfo.pet_name}님의 맞춤 식단 가이드</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .pet-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .diet-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .food-list { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .avoid-list { background: #ffe8e8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .tips { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #667eea; margin-top: 0; }
        h3 { color: #333; margin-bottom: 10px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 ${petInfo.pet_name}님의 맞춤 식단 가이드</h1>
          <p>체질 진단 결과를 바탕으로 한 개인 맞춤 식단입니다</p>
        </div>
        
        <div class="content">
          <div class="pet-info">
            <h2>📋 반려동물 정보</h2>
            <p><strong>이름:</strong> ${petInfo.pet_name}</p>
            <p><strong>나이:</strong> ${petInfo.pet_age}세</p>
            <p><strong>체중:</strong> ${petInfo.pet_weight}kg</p>
            <p><strong>주요 증상:</strong> ${petInfo.pet_symptoms}</p>
          </div>
          
          <div class="diet-section">
            <h2>🔍 진단 결과: ${dietInfo.title}</h2>
            <p>${dietInfo.description}</p>
            
            <h3>✅ 추천 음식</h3>
            <div class="food-list">
              <ul>
                ${dietInfo.foods.map(food => `<li>${food}</li>`).join('')}
              </ul>
            </div>
            
            <h3>❌ 피해야 할 음식</h3>
            <div class="avoid-list">
              <ul>
                ${dietInfo.avoid.map(food => `<li>${food}</li>`).join('')}
              </ul>
            </div>
            
            <div class="tips">
              <h3>💡 식단 관리 팁</h3>
              <p>${dietInfo.tips}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>이 식단 가이드는 참고용입니다. 반려동물의 건강 상태에 따라 수의사와 상담하시기 바랍니다.</p>
            <p>© 2024 Pet Constitution. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendDietEmail
};
