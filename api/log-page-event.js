import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // نفس المفتاح القوي الذي يعمل مع الجداول الأخرى
);

export default async function handler(req, res) {
  // السماح بالاتصال من أي مصدر
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { event_name, session_id, page_url, referrer, screen_width, language, ...extra } = req.body || {};

    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' });
    }

    // تجهيز البيانات الإضافية في حقل JSONB
    const event_data = {
      ...extra,
      country: req.headers['x-vercel-ip-country'] || null,
      user_agent: req.headers['user-agent'] || null,
    };

    // الإدخال في جدول site_events الجديد
    const { error } = await supabase
      .from('site_events')          // ✅ الجدول الصحيح
      .insert({
        event_name,
        session_id,
        page_url: page_url || '',
        referrer: referrer || '',
        screen_width: screen_width || null,
        language: language || 'ar',
        event_data,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, event: event_name });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
