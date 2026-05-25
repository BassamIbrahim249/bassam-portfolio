// api/gemini.js
export default async function handler(req, res) {
  // 1. الأمان: نسمح فقط بالطلبات من موقعك المحدد
  const allowedOrigin = 'https://bassamibrahim249.github.io';
  const requestOrigin = req.headers.origin;
  if (requestOrigin !== allowedOrigin) {
    return res.status(403).json({ error: 'غير مسموح بهذا المصدر.' });
  }

  // 2. نسمح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, context } = req.body;

    // 3. بناء الطلب الذكي لـ Gemini
    const systemInstruction = "أنت مساعد ذكي لموقع المهندس بسام إبراهيم. أجب عن سؤال المستخدم بناءً على 'السياق' المقدم فقط. إذا لم يكن السياق كافياً، فقل 'لا أملك معلومات كافية في مقالاتي لهذا السؤال' ولا تخمن. أجب بالعربية.";
    
    const prompt = context 
      ? `السياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : question;

    // 4. استدعاء Gemini API (المفتاح من متغيرات البيئة)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة.';

    // 5. إعادة الرد للموقع
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ داخلي.' });
  }
}
