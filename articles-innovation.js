function fetchInnovationArticles() {
  return fetch("https://api.github.com/repos/bassamibrahim249/bassam-portfolio/contents/content/articles")
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل المقالات");
      return response.json(); // يحصل على قائمة الملفات
    })
    .then(files => {
      // اختيار ملفات JSON أو Markdown فقط
      const supportedFiles = files.filter(f => f.name.endsWith('.json') || f.name.endsWith('.md'));
      return Promise.all(
        supportedFiles.map(f => {
          if (f.name.endsWith('.json')) {
            // ملف JSON عادي → نقرأه ونحوله لكائن
            return fetch(f.download_url).then(res => res.ok ? res.json() : null);
          } else {
            // ملف Markdown → نقرأه كنص ونحوّله لمقال بسيط
            return fetch(f.download_url).then(res => res.ok ? res.text() : null).then(text => {
              if (!text) return null;
              const lines = text.split('\n').filter(line => line.trim() !== '');
              // استخراج العنوان (أول سطر يبدأ بـ #)
              const titleLine = lines.find(line => line.trim().startsWith('# '));
              const title = titleLine ? titleLine.trim().replace(/^#\s*/, '') : 'مقال بدون عنوان';
              // المحتوى هو باقي النص
              const content = lines.slice(lines.indexOf(titleLine || lines[0]) + 1).join('\n').trim();
              return {
                title: title,
                paragraphs: content ? [content] : [],
                sections: [],
                tags: [],
                headerImage: null
              };
            });
          }
        })
      );
    })
    .then(articles => articles.filter(a => a !== null).reverse());
}
