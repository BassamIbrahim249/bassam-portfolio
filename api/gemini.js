// api/gemini.js (v3.1 - مع تشخيص الأخطاء)
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

    // [1] فحص الذاكرة
    const { data: cachedData, error: fetchError } = await supabase
      .from('bot_cache')
      .select('reply')
      .eq('question', question.trim())
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return res.status(200).json({ reply: `خطأ في قراءة الذاكرة: ${fetchError.message}` });
    }

    if (cachedData) {
      console.log('⚡ من الذاكرة (بدون توكينز)');
      return res.status(200).json({ reply: cachedData.reply });
    }

    // [2] سؤال Gemini
    const systemPrompt = "أنت مساعد ذكي لموقع المهندس بسام إبراهيم. أجب عن سؤال المستخدم بناءً على 'السياق' المقدم فقط. إذا لم يكن السياق كافياً، فقل 'لا أملك معلومات كافية في مقالاتي لهذا السؤال' ولا تخمن. أجب بالعربية.";
    const fullPrompt = context 
      ? `${systemPrompt}\n\nالسياق من مقالات الموقع:\n${context}\n\nسؤال الزائر: ${question}\n\nأجب بناءً على السياق فقط.`
      : `${systemPrompt}\n\nسؤال الزائر: ${question}`;

    const aiResponse = await fetch(
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

    const data = await aiResponse.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أستطع الإجابة حالياً.';

    // [3] حفظ الإجابة الجديدة
    if (reply && reply !== 'عذراً، لم أستطع الإجابة حالياً.') {
      const { error: insertError } = await supabase
        .from('bot_cache')
        .insert([{ question: question.trim(), reply: reply }]);

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // سنعرض الخطأ للمستخدم حتى نعرف السبب
        return res.status(200).json({ reply: `⚠️ تم إنشاء الإجابة ولكن فشل الحفظ في السحابة: ${insertError.message}. يرجى مراجعة صلاحيات الجدول.` });
      }
      console.log('💾 تم الحفظ بنجاح');
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'حدث خطأ داخلي في الخادم.' });
  }
}