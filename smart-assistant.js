(function() {
  const btn = document.createElement('button');
  btn.id = 'smart-assistant-btn';
  btn.textContent = '💬';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B9EFF,#60CFFF);color:white;font-size:24px;z-index:1000;border:none;cursor:pointer;';
  document.body.appendChild(btn);
  
  const box = document.createElement('div');
  box.id = 'smart-chat-box';
  box.innerHTML = '<div style="padding:20px;color:white;font-family:Cairo;background:#080c12;border-radius:16px;position:fixed;bottom:90px;right:24px;width:300px;height:400px;z-index:1000;display:none;"><h3>🤖 مساعد BassamIbrahim</h3><p>أهلاً بك! اكتب سؤالك...</p></div>';
  document.body.appendChild(box);
  const chatBox = box.firstElementChild;
  
  btn.addEventListener('click', function() {
    if (chatBox.style.display === 'none') {
      chatBox.style.display = 'block';
    } else {
      chatBox.style.display = 'none';
    }
  });
})();