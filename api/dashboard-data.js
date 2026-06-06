import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // KPIs
    const [pageViews, articleOpens, bookDownloads, shares, chatStarts] = await Promise.all([
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'page_view').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'article_open').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'book_download').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).in('event_name', ['share_whatsapp', 'share_facebook', 'share_twitter', 'share_telegram', 'share_copy', 'share_native']).gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'chat_start').gte('created_at', today)
    ]);

    // أفضل المقالات
    const { data: articles } = await supabase.from('site_events').select('event_data').eq('event_name', 'article_open');
    const articleCounts = {};
    (articles || []).forEach(r => {
      const title = r.event_data?.article_title || '';
      if (title) articleCounts[title] = (articleCounts[title] || 0) + 1;
    });
    const topArticles = Object.entries(articleCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // أفضل الكتب
    const { data: books } = await supabase.from('site_events').select('event_data').eq('event_name', 'book_download');
    const bookCounts = {};
    (books || []).forEach(r => {
      const title = r.event_data?.book_title || '';
      if (title) bookCounts[title] = (bookCounts[title] || 0) + 1;
    });
    const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // الزوار اليومي
    const { data: daily } = await supabase.from('site_events').select('created_at').eq('event_name', 'page_view').gte('created_at', weekAgo);
    const dailyMap = {};
    (daily || []).forEach(r => {
      const day = r.created_at.slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyArray = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyArray.push({ date: key, count: dailyMap[key] || 0 });
    }

    res.status(200).json({
      kpis: {
        pageViews: pageViews.count || 0,
        articleOpens: articleOpens.count || 0,
        bookDownloads: bookDownloads.count || 0,
        shares: shares.count || 0,
        chatStarts: chatStarts.count || 0
      },
      topArticles,
      topBooks,
      dailyVisitors: dailyArray
    });

  } catch (err) {
    console.error('Dashboard API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
