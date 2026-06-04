// api/log-analytics.js - v2.0 (آمن ومحمي)
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
const ALLOWED_RESPONSE_TYPES = ['kb', 'articles', 'expert', 'fallback'];
const ALLOWED_PLATFORMS = ['mobile', 'desktop', 'tablet', 'other'];

// ========== 🛡️ Rate Limiting (بسيط وفعّال) ==========
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  record.count++;
  rateLimitMap.set(ip, record);
  
  return record.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, 10 * 60 * 1000);

// ========== 🧹 دوال التنظيف ==========
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '');
}

function sanitizeNumber(num, min = 0, max = 999999) {
  const n = parseInt(num);
  if (isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

// ========== 🎯 المعالج الرئيسي ==========
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.socket?.remoteAddress || 
                   'unknown';
  
  if (!checkRateLimit(clientIp)) {
    console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const raw = req.body || {};
    
    const cleanPayload = {
      session_id: sanitizeString(raw.session_id, 100),
      question: sanitizeString(raw.question, 500),
      intent: ALLOWED_INTENTS.includes(raw.intent) ? raw.intent : 'general',
      results_count: sanitizeNumber(raw.results_count, 0, 100),
      response_time_ms: sanitizeNumber(raw.response_time_ms, 0, 30000),
      response_type: ALLOWED_RESPONSE_TYPES.includes(raw.response_type) ? raw.response_type : 'fallback',
      articles_found: sanitizeNumber(raw.articles_found, 0, 50),
      library_files_found: sanitizeNumber(raw.library_files_found, 0, 50),
      kb_match: Boolean(raw.kb_match),
      expert_used: Boolean(raw.expert_used),
      was_helpful: typeof raw.was_helpful === 'boolean' ? raw.was_helpful : null,
      platform: ALLOWED_PLATFORMS.includes(raw.platform) ? raw.platform : 'other',
      user_agent: sanitizeString(raw.user_agent, 300),
      source_ip_hash: Buffer.from(clientIp).toString('base64').slice(0, 32),
      created_at: new Date().toISOString()
    };
    
    if (!cleanPayload.session_id || !cleanPayload.question) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

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