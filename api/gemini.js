// api/gemini.js (v3.7 - إصدار متطابق تمامًا مع الجدول الجديد)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ reply: 'حقل السؤال (question) مطلوب.' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ reply: 'مفتاح Gemini API غير مضبوط في الخادم.' });

    // [1] فحص الذاكرة المخبأة - اسم العمود question (حساس لحالة الأحرف)
    const { data: cachedData } = await supabase
      .from('bot_cache')
      .select('reply')
      .eq('question', question.trim())
      .maybeSingle();

    if (cachedData) {
      console.log('⚡ تم جلب الإجابة من السحابة مجاناً (استهلاك Gemini = 0)');
      return res.status(200).json({ reply: cachedData.reply });
    }

    // [2] سؤال Gemini
    const systemPrompt = `أنت مساعد ذكي ومفيد في منصة "بسام إبراهيم". مهمتك هي تلخيص المقالات المقدمة لك والإجابة عن أسئلة الزوار بناءً عليها. قاعدة ذهبية: إذا كان هناك أي سياق متاح، يجب عليك تقديم أفضل تلخيص ممكن بناءً عليه. لا تعتذر أبداً. لا تقل "لا أملك معلومات كافية". قدم دائماً ما هو موجود. أجب بالعربية الفصحى السلسة.`;

    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من المقالات:\n${context}\n\nسؤال الزائر: ${question}\n\nقدم أفضل تلخيص ممكن بناءً على السياق أعلاه. لا تعتذر.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
        })
      }
    );

    const data = await aiResponse.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة حالياً.';

    // [3] حفظ الإجابة الجديدة - اسم العمود question و reply (حساس لحالة الأحرف)
    if (reply && reply !== 'عذراً، لم أستطع الإجابة حالياً.') {
      const { error: insertError } = await supabase
        .from('bot_cache')
        .insert([{ question: question.trim(), reply: reply }]);

      if (insertError) {
        console.error('❌ Supabase insert error:', insertError);
        return res.status(200).json({ reply: `⚠️ فشل الحفظ في السحابة: ${insertError.message}` });
      }
      console.log('💾 تم حفظ الإجابة الجديدة في السحابة.');
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'حدث خطأ داخلي في الخادم.' });
  }
}