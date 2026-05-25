// api/gemini.js (المرشد الكامل - v2.4)
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

    // ✅ تعليمات جديدة للتلخيص العميق والجذاب
    const systemPrompt = `أنت مساعد ذكي في منصة "بسام إبراهيم". مهمتك هي تلخيص محتوى المقالات المقدمة لك في سياق السؤال.
عند التلخيص، التزم بالقواعد التالية:
1. ابدأ بجملة افتتاحية جذابة تلخص الفكرة الرئيسية في سطر واحد.
2. ثم قدم شرحاً موجزاً للنقاط الرئيسية (3-4 نقاط).
3. اختم بسؤال تحفيزي للقارئ مثل: "هل تود معرفة المزيد عن [نقطة محددة]؟"
4. إذا كان السياق لا يحتوي على معلومات كافية، فقل: "المقال لا يحتوي على تفاصيل كافية حول هذا السؤال تحديداً. أنصحك بقراءة المقال كاملاً."

أجب بالعربية الفصحى السلسلة.`;
    
    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}`;

    const requestBody = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { 
        temperature: 0.4,
        maxOutputTokens: 600 
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    console.log('Gemini Full Response:', JSON.stringify(data));

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return res.status(200).json({ reply: `خطأ من Gemini: ${data.error.message || JSON.stringify(data.error)}` });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة.';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'حدث خطأ داخلي في الخادم.' });
  }
}