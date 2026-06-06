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

    const [pageViews, articleOpens, bookDownloads, shares, chatStarts] = await Promise.all([
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'page_view').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'article_open').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'book_download').gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).in('event_name', ['share_whatsapp','share_facebook','share_twitter','share_telegram','share_copy','share_native']).gte('created_at', today),
      supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_name', 'chat_start').gte('created_at', today)
    ]);

    const { data: articles } = await supabase.from('site_events').select('event_data').eq('event_name', 'article_open');
    const articleCounts = {};
    (articles || []).forEach(r => {
      const t = r.event_data?.article_title || '';
      if (t) articleCounts[t] = (articleCounts[t] || 0) + 1;
    });
    const topArticles = Object.entries(articleCounts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,count]) => ({name,count}));

    const { data: books } = await supabase.from('site_events').select('event_data').eq('event_name', 'book_download');
    const bookCounts = {};
    (books || []).forEach(r => {
      const t = r.event_data?.book_title || '';
      if (t) bookCounts[t] = (bookCounts[t] || 0) + 1;
    });
    const topBooks = Object.entries(bookCounts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,count]) => ({name,count}));

    const { data: daily } = await supabase.from('site_events').select('created_at').eq('event_name', 'page_view').gte('created_at', weekAgo);
    const dailyMap = {};
    (daily || []).forEach(r => {
      const day = r.created_at.slice(0,10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyArray = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(now.getTime() - i*86400000);
      const key = d.toISOString().slice(0,10);
      dailyArray.push({date:key, count:dailyMap[key]||0});
    }

    // قائمة تصنيف ذكية وموسّعة لتشمل نوبيان وسياسة
    const tabMap = {
      'سياس': 'سياسة', 'السودان': 'سياسة', 'كوش': 'سياسة', 'مملكة': 'سياسة',
      'تاريخ السودان': 'سياسة', 'تحليل': 'سياسة', 'رؤى فكرية': 'سياسة',
      'هندس': 'هندسة', 'الخرسانة': 'هندسة', 'المواد': 'هندسة', 'البناء': 'هندسة',
      'علوم المواد': 'هندسة', 'ابتكار إنشائي': 'هندسة', 'مختبر': 'هندسة',
      'نوبي': 'نوبيان', 'مروي': 'نوبيان', 'آثار': 'نوبيان', 'هوية': 'نوبيان',
      'تاريخ': 'نوبيان', 'كوش': 'نوبيان', 'حضارة': 'نوبيان',
      'أكاديمية': 'أكاديمية', 'المشاريع': 'أكاديمية', 'القيادة': 'أكاديمية',
      'تدريب': 'أكاديمية', 'تطوير': 'أكاديمية', 'التربية': 'أكاديمية',
      'الشباب': 'أكاديمية', 'الفشل': 'أكاديمية', 'شخصية': 'أكاديمية',
      'صحة': 'نمط الحياة', 'تغذية': 'نمط الحياة', 'بدني': 'نمط الحياة',
      'العادات': 'نمط الحياة', 'حيات': 'نمط الحياة'
    };
    const tabCounts = {};
    topArticles.forEach(a => {
      let tab = 'أخرى';
      for (const k in tabMap) { if (a.name.includes(k)) { tab = tabMap[k]; break; } }
      tabCounts[tab] = (tabCounts[tab] || 0) + a.count;
    });
    const tabsArray = Object.entries(tabCounts).map(([name,count]) => ({name,count}));

    const { data: shareEvents } = await supabase.from('site_events').select('event_data').in('event_name', ['share_whatsapp','share_facebook','share_twitter','share_telegram','share_copy','share_native']);
    const shareCounts = {};
    (shareEvents || []).forEach(r => {
      const t = r.event_data?.article_title || '';
      if (t) shareCounts[t] = (shareCounts[t] || 0) + 1;
    });
    const topShared = Object.entries(shareCounts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,count]) => ({name,count}));

    const { data: platformEvents } = await supabase.from('site_events').select('event_name').in('event_name', ['share_whatsapp','share_facebook','share_twitter','share_telegram','share_copy','share_native']);
    const platformCounts = {};
    (platformEvents || []).forEach(r => {
      const p = r.event_name?.replace('share_','') || 'أخرى';
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    });
    const platformsArray = Object.entries(platformCounts).map(([name,count]) => ({name,count}));

    const { count: pwaInstalls } = await supabase.from('site_events').select('*', { count:'exact', head:true }).eq('event_name','pwa_install');
    const { count: pwaOpens } = await supabase.from('site_events').select('*', { count:'exact', head:true }).eq('event_name','pwa_open');

    const { data: langEvents } = await supabase.from('site_events').select('language').not('language','is',null);
    const langCounts = {};
    (langEvents || []).forEach(r => { const l = r.language || 'ar'; langCounts[l] = (langCounts[l] || 0) + 1; });
    const langsArray = Object.entries(langCounts).map(([name,count]) => ({name,count}));

    const { count: chatCount } = await supabase.from('site_events').select('*', { count:'exact', head:true }).eq('event_name','chat_start').gte('created_at', weekAgo);

    res.status(200).json({
      kpis: {
        pageViews: pageViews.count || 0,
        articleOpens: articleOpens.count || 0,
        bookDownloads: bookDownloads.count || 0,
        shares: shares.count || 0,
        chatStarts: chatStarts.count || 0
      },
      topArticles, topBooks,
      dailyVisitors: dailyArray,
      tabs: tabsArray,
      topShared,
      platforms: platformsArray,
      pwa: { installs: pwaInstalls || 0, opens: pwaOpens || 0 },
      languages: langsArray,
      chatSummary: { total: chatCount || 0, dailyAverage: Math.round((chatCount || 0) / 7) }
    });

  } catch (err) {
    console.error('Dashboard API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
