import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // ✅ CORS headers في كل رد
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { event_name, session_id, ...extraData } = body;

    if (!event_name) {
      return res.status(400).json({ error: 'event_name required' });
    }
    if (!session_id) {
      return res.status(400).json({ error: 'session_id required' });
    }

    const eventData = {
      ...extraData,
      country: req.headers['x-vercel-ip-country'] || null,
      user_agent: req.headers['user-agent'] || null,
    };

    const { error } = await supabase
      .from('site_events')
      .insert({
        event_name,
        session_id,
        page_url: (extraData.page_url || '').slice(0, 500),
        referrer: (extraData.referrer || '').slice(0, 500),
        screen_width: extraData.screen_width || null,
        language: (extraData.language || 'ar').slice(0, 10),
        event_data: eventData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: error.message,
        code: error.code,
        details: error.details 
      });
    }

    return res.status(200).json({ 
      success: true, 
      event: event_name,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Exception:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
}
