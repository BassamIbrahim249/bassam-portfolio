// api/gemini.js (نسخة مُعدّلة للاختبار)
export default async function handler(req, res) {
  // إعدادات CORS للسماح بالطلبات من أي مصدر أثناء الاختبار
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // التعامل مع طلبات OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, context } = req.body;

    // التحقق من وجود المفتاح
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'مفتاح Gemini API غير مضبوط في الخادم.' });
    }

    const systemInstruction = "أنت مساعد ذكي لموقع المهندس بسام إبراهيم. أجب عن سؤال المستخدم بناءً على 'السياق' المقدم فقط. إذا لم يكن السياق كافياً، فقل 'لا أملك معلومات كافية في مقالاتي لهذا السؤال' ولا تخمن. أجب بالعربية.";
    
    const prompt = context 
      ? `السياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : question;

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

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'حدث خطأ داخلي في الخادم.' });
  }
}