import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// قائمة الأحداث المسموح بها (حماية من الإساءة)
const ALLOWED_EVENTS = [
  'page_view', 'section_view', 'article_open', 'article_read',
  'book_download', 'book_preview', 'share_whatsapp', 'share_facebook',
  'share_copy', 'share_twitter', 'share_telegram', 'share_native',
  'chat_start', 'contact_click', 'external_link', 'search_articles',
  'pwa_install', 'pwa_open', 'language_used', 'error_occurred', 'scroll_75'
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { event_name, session_id, ...extraData } = body;

    // 1. التحقق من event_name
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' });
    }

    // 2. التحقق من أن الحدث مسموح به
    if (!ALLOWED_EVENTS.includes(event_name)) {
      return res.status(400).json({ error: 'Unknown event type' });
    }

    // 3. التحقق من session_id
    if (!session_id || typeof session_id !== 'string' || session_id.length > 100) {
      return res.status(400).json({ error: 'Invalid session_id' });
    }

    // 4. جمع البيانات الإضافية في JSONB
    const country = req.headers['x-vercel-ip-country'] || null;
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || extraData.referrer || null;

    const eventData = {
      ...extraData,
      country,
      user_agent: userAgent,
      ip_country: country,
    };

    // 5. حذف البيانات الحساسة أو الكبيرة جداً
    delete eventData.timestamp; // لا نحتاجها (created_at يكفي)
    
    // تحديد حجم event_data (حماية من الإساءة)
    const eventDataStr = JSON.stringify(eventData);
    if (eventDataStr.length > 5000) {
      return res.status(400).json({ error: 'Event data too large' });
    }

    // 6. الإدراج في Supabase
    const { error } = await supabase
      .from('site_events')
      .insert({
        event_name,
        session_id,
        page_url: (extraData.page_url || '').slice(0, 500),
        referrer: (referrer || '').slice(0, 500),
        screen_width: extraData.screen_width || null,
        language: (extraData.language || 'ar').slice(0, 10),
        event_data: eventData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to log event', details: error.message });
    }

    return res.status(200).json({ success: true, event: event_name });
    
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}