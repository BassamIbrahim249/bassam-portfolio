function fetchInnovationArticles() {
  return fetch("https://api.github.com/repos/bassamibrahim249/bassam-portfolio/contents/content/articles")
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل المقالات");
      return response.json();
    })
    .then(files => {
      const supportedFiles = files.filter(f => f.name.endsWith('.json') || f.name.endsWith('.md'));
      return Promise.all(
        supportedFiles.map(f => {
          return fetch(f.download_url)
            .then(res => res.ok ? res.text() : null)
            .then(text => {
              if (!text) return null;
              
              // المحاولة الأولى: هل الملف JSON (يبدأ بـ {)؟
              if (text.trim().startsWith('{')) {
                try {
                  return JSON.parse(text);
                } catch (e) {
                  // إذا فشل JSON، نكمل كـ Markdown
                }
              }
              
              // المحاولة الثانية: معالجة كـ Markdown عادي
              const lines = text.split('\n').filter(line => line.trim() !== '');
              const titleLine = lines.find(line => line.trim().startsWith('# '));
              const title = titleLine ? titleLine.trim().replace(/^#\s*/, '') : 'مقال بدون عنوان';
              const content = lines.slice(lines.indexOf(titleLine || lines[0]) + 1).join('\n').trim();
              return {
                title: title,
                paragraphs: content ? [content] : [],
                sections: [],
                tags: [],
                headerImage: null
              };
            });
        })
      );
    })
    .then(articles => articles.filter(a => a !== null).reverse());
}
