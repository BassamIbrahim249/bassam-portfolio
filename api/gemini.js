// api/gemini.js (v3.2 - Gemini أكثر مرونة وذكاءً في الردود)
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

    // 🕵️‍♂️ [1] التحقق من الذاكرة المخبأة
    const { data: cachedData } = await supabase
      .from('bot_cache')
      .select('reply')
      .eq('question', question.trim())
      .maybeSingle();

    if (cachedData) {
      console.log('⚡ تم جلب الإجابة من السحابة مجاناً (استهلاك Gemini = 0)');
      return res.status(200).json({ reply: cachedData.reply });
    }

    // 🤖 [2] إنشاء إجابة جديدة من Gemini
    // ✨ التعديل الوحيد: تعليمات أكثر مرونة وذكاءً
    const systemPrompt = `أنت مساعد ذكي ومفيد في منصة "بسام إبراهيم". مهمتك هي الإجابة عن أسئلة الزوار بناءً على محتوى المقالات المقدم لك في السياق.

قواعد مهمة جداً:
1. إذا كان السياق يحتوي على معلومات كافية عن السؤال، قدم إجابة شاملة ومباشرة مع الاستشهاد بالمقالات.
2. إذا كان السياق يتحدث عن الموضوع بشكل عام وليس بالتفصيل المطلوب، فلا ترفض الإجابة. بدلاً من ذلك، قل: "لم أجد تفاصيل دقيقة عن [السؤال] في المقالات المتاحة، لكنها تتحدث بشكل عام عن [الموضوع]. إليك ما وجدته:" ثم قدم ما هو موجود.
3. لا تقل أبداً "لا أملك معلومات كافية" ثم تتوقف. قدم دائماً أفضل ما لديك.
4. استخدم أسلوباً دافئاً ومشجعاً. لا تجعل الزائر يشعر بالإحباط.
5. إذا كان السؤال خارج نطاق المنصة تماماً، يمكنك الاعتذار بلطف وتوجيه الزائر إلى المجالات المتاحة.

أجب بالعربية الفصحى السلسة.`;

    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على القواعد أعلاه.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على القواعد أعلاه.`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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