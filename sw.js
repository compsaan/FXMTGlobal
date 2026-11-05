// FXMT: do not cache private account data or financial API responses.
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const FXMT_APP_SCOPE = new URL(self.registration.scope).pathname;
const FXMT_BOOTSTRAP = `<script id="fxmt-device-app-lock-bootstrap">try{if(localStorage.getItem("fxmt-device-app-lock-enabled")==="1")document.documentElement.classList.add("fxmt-app-lock-pending")}catch(e){}</script><style>html.fxmt-app-lock-pending body>*{visibility:hidden!important;pointer-events:none!important}#fxmtDeviceAppLockOverlay{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;color:#fff7ff;background:linear-gradient(150deg,#080511,#11091e 48%,#090611)}html.fxmt-app-lock-pending #fxmtDeviceAppLockOverlay{display:flex!important;visibility:visible!important}</style>`;
const FXMT_OVERLAY = `<div id="fxmtDeviceAppLockOverlay" role="dialog" aria-modal="true" aria-labelledby="fxmtDeviceAppLockTitle" aria-describedby="fxmtDeviceAppLockDescription"><div style="width:min(100%,390px);box-sizing:border-box;padding:28px 22px 22px;border:1px solid rgba(218,139,255,.34);border-radius:26px;background:linear-gradient(145deg,rgba(72,39,96,.72),rgba(29,16,47,.96));text-align:center"><div style="font-size:24px;margin-bottom:16px">🔒</div><h1 id="fxmtDeviceAppLockTitle">تطبيق FXMT مقفل</h1><p id="fxmtDeviceAppLockDescription">افتح التطبيق ببصمتك أو بوسيلة قفل الجهاز المتاحة.</p><p id="fxmtDeviceAppLockStatus" role="status" aria-live="polite"></p><button id="fxmtDeviceAppLockUnlock" type="button">فتح التطبيق</button><button id="fxmtDeviceAppLockRecovery" type="button" onclick="if(confirm('إعادة ضبط قفل التطبيق؟')){localStorage.removeItem('fxmt-device-app-lock-enabled');localStorage.removeItem('fxmt-device-app-lock-credential');location.reload()}">تعذّر الفتح؟ إعادة ضبط القفل</button></div></div>`;

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isAppPage = url.pathname === FXMT_APP_SCOPE || url.pathname === `${FXMT_APP_SCOPE}index.html` || url.pathname === FXMT_APP_SCOPE.slice(0, -1);
  if (!isAppPage) return;

  event.respondWith((async () => {
    const response = await fetch(request);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) return response;
    let html = await response.clone().text();
    if (html.includes("fxmt-device-app-lock-bootstrap")) return response;
    html = html.replace(/<\/head>/i, `${FXMT_BOOTSTRAP}</head>`);
    html = html.replace(/<body\b[^>]*>/i, (tag) => `${tag}${FXMT_OVERLAY}`);
    const scriptUrl = new URL("fxmt-device-app-lock.js?v=1", self.registration.scope).href;
    html = html.replace(/<\/body>/i, `<script src="${scriptUrl}" defer></script></body>`);
    const headers = new Headers(response.headers);
    ["content-length", "content-encoding", "accept-ranges", "etag", "last-modified"].forEach((name) => headers.delete(name));
    headers.set("cache-control", "no-cache");
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  })());
});
