/* GitHub -> GAS Bridge (iframe form POST, avoids CORS and large-URL limits). */
(function () {
  'use strict';
  const URL = String(window.VIBE_BRIDGE_URL || '').trim();
  function callBridge(method, args) {
    return new Promise(function (resolve, reject) {
      if (!/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/)?(?:macros\/)?s\/[\w-]+\/exec(?:\?.*)?$/.test(URL)) {
        reject(new Error('config.js에 올바른 GAS 웹앱 /exec 주소를 입력해 주세요.'));
        return;
      }
      const nonce = 'vibe_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
      const iframe = document.createElement('iframe');
      iframe.name = 'bridge_' + nonce;
      iframe.style.display = 'none';
      iframe.setAttribute('title', 'GAS 데이터 연결');
      const form = document.createElement('form');
      form.action = URL;
      form.method = 'POST';
      form.target = iframe.name;
      form.style.display = 'none';
      form.acceptCharset = 'UTF-8';
      const field = document.createElement('textarea');
      field.name = 'payload';
      field.value = JSON.stringify({ method: method, args: args, nonce: nonce });
      form.appendChild(field);
      let done = false;
      function cleanup() {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        form.remove();
        iframe.remove();
      }
      function onMessage(event) {
        if (event.source !== iframe.contentWindow || !event.data || event.data.nonce !== nonce || done) return;
        done = true;
        cleanup();
        if (event.data.ok) resolve(event.data.value);
        else reject(new Error(event.data.error || '서버에서 요청을 처리하지 못했습니다.'));
      }
      const timer = setTimeout(function () {
        if (!done) { done = true; cleanup(); reject(new Error('연결 시간이 초과되었습니다. GAS 배포 접근 권한과 실행 주소를 확인해 주세요.')); }
      }, 120000);
      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }
  window.VibeBridge = { call: callBridge };
})();
