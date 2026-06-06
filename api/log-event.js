import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    event_name,
    session_id,
    page_url,
    section,
    article_slug,
    book_id,
    share_platform,
    search_query,
    language,
    pwa_action,
    error_message,
    referrer,
    screen_width,
    user_agent,
  } = req.body || {};

  if (!event_name) {
    return res.status(400).json({ error: 'event_name is required' });
  }

  const country = req.headers['x-vercel-ip-country'] || null;

  const { error } = await supabase
    .from('site_events')
    .insert({
      event_name,
      session_id,
      page_url,
      section,
      article_slug,
      book_id,
      share_platform,
      search_query,
      language,
      pwa_action,
      error_message,
      referrer,
      screen_width: screen_width || null,
      country,
      user_agent: user_agent || req.headers['user-agent'],
      created_at: new Date().toISOString(),
    });

  if (error) {
    return res.status(500).json({ error: 'Failed to log event' });
  }

  return res.status(200).json({ success: true });
}
