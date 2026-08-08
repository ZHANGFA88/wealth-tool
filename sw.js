/* =====================================================================
 * sw.js — Service Worker：离线缓存 + 系统通知（第十六阶段 PWA）
 * 缓存策略：预缓存静态壳（首屏秒开 + 离线可用）；运行时 Network-First
 * 带 cache 兜底（保住最新数据展示），文件永不主动删除旧缓存异常。
 * ===================================================================== */

var CACHE = 'wealth-cache-v1';
var PRECACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Promise.allSettled 兜底：单文件失败不阻塞整体安装
      return Promise.all(PRECACHE.map(function (u) {
        return cache.add(u).catch(function () {});
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* 请求策略：
 * - 跨域（外部 CDN/字体/抓取）一律只走网络，不缓存
 * - 页面/静态壳（navigate 或 GET 的 html/js/css/ico/svg/json 等自身资源）：
 *   Network-first，网络失败回退到缓存（离线可开壳）
 * - 其余 GET（如无——本应用零外部请求）：网络直达
 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  // 导航请求（页面跳转）：Network-first → cache 兜底 → index
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // 静态资源（html/js/css/manifest/svg 类）：Network-first with cache fallback
  var path = url.pathname;
  if (/\.(html?|js|css|json|svg|ico|png|jpe?g|gif|webp|woff2?|ttf)$/.test(path) ||
      url.pathname === '/' ) {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req);
        })
    );
  }
});

/* 系统通知（预算超支 / 目标达成）——由 app.js 通过 postMessage 推送 */
self.addEventListener('message', function (e) {
  var data = e.data || {};
  if (data.type !== 'NOTIFY') return;

  e.waitUntil(showNotify(data.payload || {}));
});

function showNotify(p) {
  if (!('Notification' in self) || self.Notification.permission !== 'granted') return Promise.resolve();

  var opts = {
    body: p.body || '',
    icon: p.icon || null,
    badge: p.badge || null,
    tag: p.tag || 'wealth-notify',
    renotify: true,
    timestamp: Date.now(),
    data: p.data || {}
  };
  return self.registration.showNotification(p.title || '我的财库', opts);
}

/* 点击通知：聚焦/打开应用并携带目标 tab */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var d = e.notification.data || {};
  var url = './index.html' + (d.tab ? '?tab=' + encodeURIComponent(d.tab) : '');
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) { list[i].focus(); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
