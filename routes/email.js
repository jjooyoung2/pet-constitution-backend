require('dotenv').config({ path: '../.env' });
const express = require('express');
const nodemailer = require('nodemailer');
const mealPlans = require('../data/mealPlans');

const router = express.Router();

// 이메일 발송 설정 (Gmail 사용)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'bjy9409292@gmail.com',
    pass: process.env.EMAIL_PASS || 'vnmxucionjssfwez'
  }
});

// 이메일 템플릿 생성
const createEmailTemplate = (constitution, petName, mealPlan) => {
  const { name, description, dailyMeals, tips } = mealPlan;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .day-card { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .day-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
        .meal { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .meal-title { font-weight: bold; color: #495057; }
        .tips { background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .tips-title { color: #2d5a2d; font-weight: bold; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 ${petName}님의 체질별 7일 식단 샘플</h1>
          <p>온솔 양·한방 동물병원</p>
        </div>
        
        <div class="content">
          <h2>${name} 체질 맞춤 식단</h2>
          <p>${description}</p>
          
          <div class="tips">
            <div class="tips-title">💡 식단 관리 팁</div>
            <ul>
              ${tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
          
          <h3>📅 7일 식단 계획</h3>
  `;
  
  dailyMeals.forEach(day => {
    html += `
      <div class="day-card">
        <div class="day-title">${day.day}</div>
        <div class="meal">
          <div class="meal-title">🌅 아침</div>
          <div>${day.breakfast}</div>
        </div>
        <div class="meal">
          <div class="meal-title">🌞 점심</div>
          <div>${day.lunch}</div>
        </div>
        <div class="meal">
          <div class="meal-title">🌙 저녁</div>
          <div>${day.dinner}</div>
        </div>
        <div class="meal">
          <div class="meal-title">🍎 간식</div>
          <div>${day.snack}</div>
        </div>
      </div>
    `;
  });
  
  html += `
          <div class="footer">
            <p>이 식단은 참고용 샘플입니다. 반려동물의 상태에 따라 수의사와 상담하세요.</p>
            <p>온솔 양·한방 동물병원 | 02-1234-5678 | www.onsol-vet.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// 식단 샘플 이메일 발송
router.post('/send-meal-plan', (req, res) => {
  try {
    const { email, constitution, petName } = req.body;
    
    // 입력값 검증
    if (!email || !constitution || !petName) {
      return res.status(400).json({
        success: false,
        message: '이메일, 체질, 반려동물 이름이 필요합니다.'
      });
    }
    
    // 체질에 맞는 식단 데이터 가져오기
    const mealPlan = mealPlans[constitution];
    if (!mealPlan) {
      return res.status(400).json({
        success: false,
        message: '지원하지 않는 체질입니다.'
      });
    }
    
    // 이메일 템플릿 생성
    const htmlContent = createEmailTemplate(constitution, petName, mealPlan);
    
    // 이메일 옵션 설정
    const mailOptions = {
      from: 'bjy9409292@gmail.com', // 직접 설정
      to: email,
      subject: `🐾 ${petName}님의 ${constitution} 체질 맞춤 7일 식단 샘플`,
      html: htmlContent
    };
    
    // 실제 이메일 발송
    console.log('이메일 발송 시도:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('이메일 발송 오류:', error);
        console.error('오류 코드:', error.code);
        console.error('오류 응답:', error.response);
        
        return res.status(500).json({
          success: false,
          message: '이메일 발송에 실패했습니다. Gmail 설정을 확인해주세요.',
          error: error.message
        });
      }
      
      console.log('이메일 발송 성공:', info.messageId);
      res.json({
        success: true,
        message: '7일 식단 샘플이 이메일로 발송되었습니다.'
      });
    });
    
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
