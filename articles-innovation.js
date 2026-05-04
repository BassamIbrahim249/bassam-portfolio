// دالة لجلب المقالات من GitHub API
function fetchInnovationArticles() {
  return fetch("https://api.github.com/repos/bassamibrahim249/bassam-portfolio/contents/content/articles")
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل المقالات");
      return response.json();
    })
    .then(files => {
      const jsonFiles = files.filter(f => f.name.endsWith(".json"));
      return Promise.all(
        jsonFiles.map(f =>
          fetch(f.download_url)
            .then(res => (res.ok ? res.json() : null))
        )
      );
    })
    .then(articles => articles.filter(a => a !== null).reverse());
}
