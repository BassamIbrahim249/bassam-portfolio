// api/gemini.js (إظهار الخطأ الفعلي للمساعدة في التشخيص)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ reply: 'حقل السؤال (question) مطلوب.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'مفتاح Gemini API غير مضبوط في الخادم.' });
    }

    const systemInstruction = "أنت مساعد ذكي لموقع المهندس بسام إبراهيم. أجب عن سؤال المستخدم بناءً على 'السياق' المقدم فقط. إذا لم يكن السياق كافياً، فقل 'لا أملك معلومات كافية في مقالاتي لهذا السؤال' ولا تخمن. أجب بالعربية.";
    
    const prompt = context 
      ? `السياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : question;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: { 
        temperature: 0.3,
        maxOutputTokens: 500 
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    console.log('Gemini Full Response:', JSON.stringify(data));

    if (data.error) {
      // هيظهر الخطأ الحقيقي من Gemini قدامك في الشات
      return res.status(200).json({ reply: `خطأ من Gemini: ${data.error.message || JSON.stringify(data.error)}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة.';
    res.status(200).json({ reply });

  } catch (error) {
    return res.status(200).json({ reply: `خطأ داخلي: ${error.message}` });
  }
}