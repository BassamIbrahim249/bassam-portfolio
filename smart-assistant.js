(function() {
  const btn = document.createElement('button');
  btn.textContent = '💬';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:blue;color:white;font-size:24px;z-index:1000;border:none;';
  document.body.appendChild(btn);
  btn.addEventListener('click', function() {
    alert('الزر يعمل!');
  });
})();