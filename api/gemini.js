// api/gemini.js (الإصدار الثالث - مقترن بقاعدة بيانات Supabase)
import { createClient } from '@supabase/supabase-js';

// إعداد الاتصال الآمن بقاعدة البيانات
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // إعدادات CORS للسماح للموقع بالاتصال
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ reply: 'حقل السؤال (question) مطلوب.' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ reply: 'مفتاح Gemini API غير مضبوط في الخادم.' });

    // 🕵️‍♂️ [1] التحقق من الذاكرة المخبأة أولاً لتوفير الحصة المجانية
    const { data: cachedData } = await supabase
      .from('bot_cache')
      .select('reply')
      .eq('question', question.trim())
      .maybeSingle();

    if (cachedData) {
      console.log('⚡ تم جلب الإجابة من السحابة مجاناً (استهلاك Gemini = 0)');
      return res.status(200).json({ reply: cachedData.reply });
    }

    // 🤖 [2] إنشاء إجابة جديدة من Gemini عند الحاجة
    const systemPrompt = "أنت مساعد ذكي لموقع المهندس بسام إبراهيم. أجب عن سؤال المستخدم بناءً على 'السياق' المقدم فقط. إذا لم يكن السياق كافياً، فقل 'لا أملك معلومات كافية في مقالاتي لهذا السؤال' ولا تخمن. أجب بالعربية.";
    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة حالياً.';

    // 💾 [3] حفظ الإجابة الجديدة للاستخدام المستقبلي
    if (reply && reply !== 'عذراً، لم أستطع الإجابة حالياً.') {
      await supabase.from('bot_cache').insert([{ question: question.trim(), reply: reply }]);
      console.log('💾 تم حفظ الإجابة الجديدة في السحابة.');
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'حدث خطأ داخلي في الخادم.' });
  }
}