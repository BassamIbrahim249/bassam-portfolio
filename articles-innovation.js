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
              
              if (text.trim().startsWith('{')) {
                try {
                  const article = JSON.parse(text);
                  // تحويل sections إلى الشكل الصحيح إذا كان مصفوفة نصوص
                  if (article.sections && Array.isArray(article.sections)) {
                    article.sections = article.sections.map(sec => {
                      if (typeof sec === 'string') {
                        return { heading: sec, text: [] };
                      }
                      return sec;
                    });
                  }
                  return article;
                } catch (e) {}
              }
              
              const lines = text.split('\n').filter(line => line.trim() !== '');
              const titleLine = lines.find(line => line.trim().startsWith('# '));
              const title = titleLine ? titleLine.trim().replace(/^#\s*/, '') : 'مقال بدون عنوان';
              return {
                title: title,
                paragraphs: [],
                sections: [{ heading: 'المحتوى', text: lines }],
                tags: [],
                headerImage: null
              };
            });
        })
      );
    })
    .then(articles => articles.filter(a => a !== null).reverse());
}
