// api/log-analytics.js - v2.2 (آمن + مُصلح)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== 🔒 إعدادات الأمان ==========
const ALLOWED_ORIGINS = [
  'https://bassamibrahim249.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
];

const ALLOWED_INTENTS = ['engineering', 'political', 'nubian', 'academy', 'health', 'general'];
const ALLOWED_RESPONSE_TYPES = ['kb', 'articles', 'expert', 'fallback', 'greeting', 'about', 'howto', 'help', 'gratitude', 'sections', 'starthere', 'emoji'];
const ALLOWED_PLATFORMS = ['mobile', 'desktop', 'tablet', 'other'];

// ========== 🧹 دوال التنظيف ==========
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '');
}

function sanitizeNumber(num, defaultValue = 0, min = 0, max = 999999) {
  const n = parseInt(num);
  if (isNaN(n)) return defaultValue;
  return Math.max(min, Math.min(max, n));
}

// ========== 🎯 المعالج الرئيسي ==========
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = req.body || {};
    
    // ✅ تنظيف مع قيم افتراضية آمنة
    const cleanPayload = {
      session_id: sanitizeString(raw.session_id, 100) || 'unknown',
      question: sanitizeString(raw.question, 500) || 'empty',
      intent: ALLOWED_INTENTS.includes(raw.intent) ? raw.intent : 'general',
      results_count: sanitizeNumber(raw.results_count, 0, 0, 100),
      response_time_ms: sanitizeNumber(raw.response_time_ms, 0, 0, 30000),
      response_type: ALLOWED_RESPONSE_TYPES.includes(raw.response_type) ? raw.response_type : 'fallback',
      articles_found: sanitizeNumber(raw.articles_found, 0, 0, 50),
      library_files_found: sanitizeNumber(raw.library_files_found, 0, 0, 50),
      kb_match: Boolean(raw.kb_match),
      expert_used: Boolean(raw.expert_used),
      was_helpful: typeof raw.was_helpful === 'boolean' ? raw.was_helpful : null,
      platform: ALLOWED_PLATFORMS.includes(raw.platform) ? raw.platform : 'other',
      user_agent: sanitizeString(raw.user_agent, 300),
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('analytics')
      .insert([cleanPayload]);

    if (error) {
      console.error('❌ Analytics insert error:', error.code, error.message);
      return res.status(500).json({ error: 'Analytics failed' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}