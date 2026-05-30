// api/gemini.js (v3.3 - إصلاح التهرب من التلخيص)
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
    // ✨ تعديل: قواعد أكثر مرونة لمنع التهرب من التلخيص
    const systemPrompt = `أنت مساعد ذكي ومفيد في منصة "بسام إبراهيم". مهمتك هي الإجابة عن أسئلة الزوار بناءً على محتوى المقالات المقدم لك في السياق.

قواعد مهمة جداً:
1. إذا كان السياق يحتوي على أي معلومات تتعلق بالسؤال، فقدم أفضل تلخيص ممكن بناءً على ما هو موجود. لا ترفض الإجابة أبداً طالما أن السياق يتعلق بالموضوع.
2. استخدم دائماً المعلومات المتاحة في السياق لتكوين إجابة مفيدة. قل أشياء مثل: "بناءً على المقال المتاح، إليك ما يمكنني إخبارك به..." ثم قدم ما وجدته.
3. استخدم أسلوباً دافئاً ومشجعاً. لا تجعل الزائر يشعر بالإحباط.
4. فقط إذا كان السؤال خارج نطاق المنصة تماماً (مثلاً عن مواضيع لا علاقة لها بمحتوى المنصة)، يمكنك الاعتذار بلطف وتوجيه الزائر إلى المجالات المتاحة.

ملاحظة عن أقسام المنصة: 
- الأكاديمية تُسمى "أكاديمية التدريب والتطوير"، وتحتوي على ثلاثة أقسام فرعية: "المشاريع والمنح"، "القيادة والإدارة"، و"التدريب التنموي".
- استخدم هذه الأسماء بالضبط عند الإشارة إلى هذه الأقسام.

أجب بالعربية الفصحى السلسة.`;

    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على القواعد أعلاه.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على القواعد أعلاه.`;

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