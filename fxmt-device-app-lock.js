(() => {
  "use strict";

  const ENABLED_KEY = "fxmt-device-app-lock-enabled";
  const CREDENTIAL_KEY = "fxmt-device-app-lock-credential";
  const OVERLAY_ID = "fxmtDeviceAppLockOverlay";
  const SWITCH_ID = "accountAppLockToggle";
  let promptActive = false;
  let platformSupportPromise;

  const copy = {
    ar: {
      title: "قفل التطبيق",
      description: "تحقق ببصمة أو وسيلة قفل الجهاز عند فتح FXMT أو العودة إليه.",
      on: "مفعّل", off: "غير مفعّل", enable: "تفعيل قفل التطبيق", disable: "إيقاف قفل التطبيق",
      unsupported: "يتطلب القفل موقعًا آمنًا (HTTPS) ومتصفحًا يدعم قفل الجهاز. تأكد من تفعيل قفل الشاشة.",
      ready: "سيطلب التطبيق تأكيد الجهاز عند فتحه أو العودة إليه.",
      activate: "أكّد هويتك بقفل الجهاز لتفعيل الميزة.",
      deactivate: "أكّد هويتك بقفل الجهاز لإيقاف الميزة.",
      waiting: "بانتظار تأكيد الجهاز…", enabled: "تم تفعيل قفل التطبيق.", disabled: "تم إيقاف قفل التطبيق.",
      setupError: "تعذر إعداد المصادقة. تأكد من تفعيل قفل الشاشة ثم حاول مجددًا.",
      verifyError: "لم يكتمل التحقق. حاول مجددًا أو أعد ضبط قفل التطبيق.",
      screenTitle: "تطبيق FXMT مقفل", screenDescription: "افتح التطبيق ببصمتك أو بوسيلة قفل الجهاز المتاحة.",
      unlock: "فتح التطبيق", recovery: "تعذّر الفتح؟ إعادة ضبط القفل",
      recoveryConfirm: "إعادة ضبط قفل التطبيق على هذا الجهاز؟ سيُعطّل القفل المحلي دون حذف بيانات الحساب.",
      credentialMissing: "تعذر العثور على بيانات قفل الجهاز. أعد ضبط القفل للمتابعة."
    },
    en: {
      title: "App lock",
      description: "Verify with your fingerprint or available device lock when opening or returning to FXMT.",
      on: "On", off: "Off", enable: "Enable app lock", disable: "Disable app lock",
      unsupported: "App lock needs HTTPS and a browser that supports device authentication. Set up a screen lock.",
      ready: "Device verification will be requested when FXMT opens or resumes.",
      activate: "Confirm with your device lock to enable app lock.",
      deactivate: "Confirm with your device lock to disable app lock.",
      waiting: "Waiting for device confirmation…", enabled: "App lock enabled.", disabled: "App lock disabled.",
      setupError: "Could not set up device authentication. Set up a screen lock and try again.",
      verifyError: "Verification was not completed. Try again or reset app lock.",
      screenTitle: "FXMT is locked", screenDescription: "Unlock with your fingerprint or the device-lock method available on your phone.",
      unlock: "Unlock FXMT", recovery: "Can't unlock? Reset app lock",
      recoveryConfirm: "Reset app lock on this device? This disables the local lock without deleting account data.",
      credentialMissing: "The device credential was not found. Reset app lock to continue."
    }
  };

  const lang = () => String(document.documentElement.lang || "ar").toLowerCase().startsWith("ar") ? "ar" : "en";
  const tr = (key) => copy[lang()][key] || copy.en[key] || key;
  const enabled = () => { try { return localStorage.getItem(ENABLED_KEY) === "1"; } catch (_) { return false; } };
  const credentialId = () => { try { return localStorage.getItem(CREDENTIAL_KEY) || ""; } catch (_) { return ""; } };

  function addStyles() {
    if (document.getElementById("fxmt-device-app-lock-style")) return;
    const style = document.createElement("style");
    style.id = "fxmt-device-app-lock-style";
    style.textContent = `
      #accountSecurityView .account-security-panel--app-lock{box-sizing:border-box;min-height:68px;padding:0!important;overflow:hidden;border:1px solid rgba(218,135,255,.35)!important;border-radius:18px!important;background:linear-gradient(145deg,rgba(72,39,96,.34),rgba(29,16,47,.86))!important;box-shadow:0 16px 38px rgba(8,2,18,.38),0 0 22px rgba(182,74,255,.11),inset 0 1px rgba(255,255,255,.1)!important}
      #accountSecurityView .account-app-lock-row{box-sizing:border-box;display:flex;align-items:center;gap:9px;width:100%;min-height:68px;padding:11px 12px!important;background:transparent;color:#fff7ff;text-align:start}
      #accountSecurityView .account-security-panel--app-lock .account-security-panel-icon{box-sizing:border-box;display:grid;flex:0 0 34px;place-items:center;width:34px;height:34px;border:1px solid rgba(218,139,255,.3);border-radius:11px;background:linear-gradient(145deg,rgba(119,54,154,.35),rgba(70,31,108,.42));color:#e8c4ff}
      #accountSecurityView .account-app-lock-copy{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}
      #accountSecurityView .account-app-lock-copy strong{color:#fff7ff;font-size:13px;font-weight:700}
      #accountSecurityView .account-app-lock-copy small{color:#c6aed8;font-size:9px;line-height:1.45}
      #accountSecurityView .account-app-lock-copy .account-app-lock-message{color:#d5c0e5;font-size:8px;line-height:1.45}
      #accountSecurityView .account-app-lock-state{flex:0 0 auto;color:#c6aed8;font-size:9px;font-weight:700;white-space:nowrap}
      #accountSecurityView .account-app-lock-state.is-enabled{color:#8ce7bf}
      #accountSecurityView .account-app-lock-switch{position:relative;flex:0 0 40px;width:40px;height:24px;padding:0;border:1px solid rgba(218,139,255,.36);border-radius:999px;background:rgba(29,16,47,.94);cursor:pointer}
      #accountSecurityView .account-app-lock-switch>span{position:absolute;top:3px;inset-inline-start:3px;width:16px;height:16px;border-radius:50%;background:#d5c0e5;transition:transform .18s ease,background .18s ease}
      html[dir="rtl"] #accountSecurityView .account-app-lock-switch.is-enabled>span{transform:translateX(-16px)}
      html[dir="ltr"] #accountSecurityView .account-app-lock-switch.is-enabled>span{transform:translateX(16px)}
      #accountSecurityView .account-app-lock-switch.is-enabled{border-color:rgba(114,229,181,.56);background:rgba(66,163,123,.42)}
      #accountSecurityView .account-app-lock-switch.is-enabled>span{background:#b6ffd8}
      #accountSecurityView .account-app-lock-switch:focus-visible{outline:2px solid rgba(241,120,220,.8);outline-offset:3px}
      #accountSecurityView .account-app-lock-switch:disabled{opacity:.48;cursor:not-allowed}
      #accountSecurityView .account-app-lock-message:empty{display:none}
      #fxmtDeviceAppLockOverlay{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;box-sizing:border-box;padding:24px;color:#fff7ff;font-family:inherit;background:radial-gradient(ellipse at 16% 20%,rgba(251,73,190,.2),transparent 34%),radial-gradient(ellipse at 88% 34%,rgba(151,74,255,.2),transparent 38%),linear-gradient(150deg,#080511 0%,#11091e 48%,#090611 100%)}
      html.fxmt-app-lock-pending #fxmtDeviceAppLockOverlay{display:flex!important;visibility:visible!important}
      .fxmt-device-app-lock-card{width:min(100%,390px);box-sizing:border-box;padding:28px 22px 22px;border:1px solid rgba(218,139,255,.34);border-radius:26px;background:linear-gradient(145deg,rgba(72,39,96,.72),rgba(29,16,47,.96));box-shadow:0 22px 60px rgba(0,0,0,.5),0 0 26px rgba(182,74,255,.16),inset 0 1px rgba(255,255,255,.12);text-align:center}
      .fxmt-device-app-lock-mark{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 16px;border:1px solid rgba(218,139,255,.38);border-radius:20px;color:#f0c9ff;background:linear-gradient(145deg,rgba(119,54,154,.45),rgba(70,31,108,.56));font-size:25px}
      .fxmt-device-app-lock-card h1{margin:0 0 9px;color:#fff7ff;font-size:21px;font-weight:800}
      .fxmt-device-app-lock-card p{margin:0 0 12px;color:#d5c0e5;font-size:13px;line-height:1.7}
      .fxmt-device-app-lock-card .fxmt-device-app-lock-status{min-height:1.4em;color:#f0dfff;font-size:11px;line-height:1.55}
      .fxmt-device-app-lock-action{display:block;width:100%;min-height:50px;margin-top:9px;padding:10px 16px;border:1px solid rgba(231,179,255,.56);border-radius:999px;color:#fff;background:linear-gradient(125deg,#c76eff,#9355e8 58%,#c74db7);font:inherit;font-size:14px;font-weight:700;cursor:pointer}
      .fxmt-device-app-lock-action:disabled{opacity:.55;cursor:not-allowed}
      .fxmt-device-app-lock-recovery{display:block;margin:12px auto 0;padding:7px;border:0;color:#d5c0e5;background:transparent;font:inherit;font-size:11px;text-decoration:underline;cursor:pointer}
      @media(max-width:380px){#accountSecurityView .account-app-lock-row{gap:7px;padding-inline:9px!important}#accountSecurityView .account-app-lock-state{font-size:8px}#accountSecurityView .account-app-lock-copy strong{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "fxmtDeviceAppLockTitle");
    overlay.innerHTML = `<div class="fxmt-device-app-lock-card"><div class="fxmt-device-app-lock-mark" aria-hidden="true"><i class="fa-solid fa-fingerprint"></i></div><h1 id="fxmtDeviceAppLockTitle"></h1><p id="fxmtDeviceAppLockDescription"></p><p class="fxmt-device-app-lock-status" id="fxmtDeviceAppLockStatus" role="status" aria-live="polite"></p><button class="fxmt-device-app-lock-action" id="fxmtDeviceAppLockUnlock" type="button"></button><button class="fxmt-device-app-lock-recovery" id="fxmtDeviceAppLockRecovery" type="button"></button></div>`;
    document.body.prepend(overlay);
    return overlay;
  }

  function addSecurityCard() {
    const view = document.getElementById("accountSecurityView");
    if (!view || document.getElementById(SWITCH_ID)) return;
    const section = document.createElement("section");
    section.className = "account-security-panel account-security-panel--app-lock";
    section.setAttribute("aria-labelledby", "securityAppLockHeading");
    section.innerHTML = `<div class="account-security-panel-trigger account-app-lock-row"><span class="account-security-panel-icon" aria-hidden="true"><i class="fa-solid fa-fingerprint"></i></span><span class="account-app-lock-copy"><strong id="securityAppLockHeading"></strong><small class="account-app-lock-description"></small><small class="account-app-lock-message" id="accountAppLockMessage" role="status" aria-live="polite"></small></span><span class="account-app-lock-state" id="accountAppLockState"></span><button class="account-app-lock-switch" id="${SWITCH_ID}" type="button" role="switch"><span aria-hidden="true"></span></button></div>`;
    view.appendChild(section);
    section.querySelector("#securityAppLockHeading").textContent = tr("title");
    section.querySelector(".account-app-lock-description").textContent = tr("description");
    const toggle = section.querySelector(`#${SWITCH_ID}`);
    toggle.addEventListener("click", toggleLock);
    applyLocale();
  }

  async function platformAvailable() {
    if (!platformSupportPromise) {
      platformSupportPromise = (async () => {
        if (!window.isSecureContext || !location.hostname || !window.crypto?.getRandomValues) return false;
        if (!navigator.credentials || typeof navigator.credentials.create !== "function" || typeof navigator.credentials.get !== "function") return false;
        const pkc = window.PublicKeyCredential;
        if (!pkc || typeof pkc.isUserVerifyingPlatformAuthenticatorAvailable !== "function") return false;
        try { return Boolean(await pkc.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (_) { return false; }
      })();
    }
    return platformSupportPromise;
  }

  function randomBytes(length) { return window.crypto.getRandomValues(new Uint8Array(length)); }
  function toBase64Url(buffer) {
    let binary = "";
    new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function fromBase64Url(value) {
    const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  function updateOverlayCopy() {
    document.getElementById("fxmtDeviceAppLockTitle").textContent = tr("screenTitle");
    document.getElementById("fxmtDeviceAppLockDescription").textContent = tr("screenDescription");
    document.getElementById("fxmtDeviceAppLockUnlock").textContent = tr("unlock");
    document.getElementById("fxmtDeviceAppLockRecovery").textContent = tr("recovery");
  }
  function setOverlayStatus(key) {
    const node = document.getElementById("fxmtDeviceAppLockStatus");
    if (node) node.textContent = key ? tr(key) : "";
  }
  function updateRow(statusKey = "") {
    const toggle = document.getElementById(SWITCH_ID);
    if (!toggle) return;
    const isOn = enabled();
    const state = document.getElementById("accountAppLockState");
    const message = document.getElementById("accountAppLockMessage");
    if (state) {
      state.textContent = tr(isOn ? "on" : "off");
      state.classList.toggle("is-enabled", isOn);
    }
    toggle.setAttribute("aria-checked", String(isOn));
    toggle.setAttribute("aria-label", tr(isOn ? "disable" : "enable"));
    toggle.classList.toggle("is-enabled", isOn);
    platformAvailable().then((supported) => {
      toggle.disabled = !supported;
      if (message) message.textContent = !supported ? tr("unsupported") : statusKey ? tr(statusKey) : isOn ? tr("ready") : "";
    });
  }
  async function refreshOverlay() {
    updateOverlayCopy();
    if (!enabled()) return;
    const supported = await platformAvailable();
    const hasCredential = Boolean(credentialId());
    const unlock = document.getElementById("fxmtDeviceAppLockUnlock");
    const recovery = document.getElementById("fxmtDeviceAppLockRecovery");
    if (unlock) unlock.disabled = !supported || !hasCredential;
    if (recovery) recovery.hidden = supported && hasCredential;
    setOverlayStatus(!supported ? "unsupported" : !hasCredential ? "credentialMissing" : "");
  }
  function lockApp() {
    if (!enabled()) return;
    document.documentElement.classList.add("fxmt-app-lock-pending");
    const overlay = ensureOverlay();
    if (overlay) overlay.style.visibility = "visible";
    refreshOverlay();
  }
  function unlockOverlay() {
    document.documentElement.classList.remove("fxmt-app-lock-pending");
    setOverlayStatus("");
  }
  async function verifyDevice() {
    const id = credentialId();
    if (!id) throw new Error("missing-credential");
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: "public-key", id: fromBase64Url(id) }],
        userVerification: "required",
        timeout: 60000
      }
    });
    if (!result) throw new Error("no-assertion");
    return result;
  }
  async function toggleLock() {
    const toggle = document.getElementById(SWITCH_ID);
    const message = document.getElementById("accountAppLockMessage");
    if (!toggle) return;
    if (!await platformAvailable()) { updateRow(); return; }
    toggle.disabled = true;
    promptActive = true;
    if (message) message.textContent = tr(enabled() ? "deactivate" : "activate");
    let finalMessage = "";
    try {
      if (enabled()) {
        await verifyDevice();
        localStorage.removeItem(ENABLED_KEY);
        unlockOverlay();
        window.dispatchEvent(new CustomEvent("fxmt-device-app-lock-state", { detail: { enabled: false } }));
        if (window.showToast) window.showToast(tr("disabled"));
      } else {
        let id = credentialId();
        if (id) {
          await verifyDevice();
        } else {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: randomBytes(32),
              rp: { id: location.hostname, name: "FXMT" },
              user: { id: randomBytes(16), name: "fxmt-device-app-lock", displayName: "FXMT app lock" },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
              authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "discouraged", userVerification: "required" },
              timeout: 60000,
              attestation: "none"
            }
          });
          if (!credential) throw new Error("credential-creation-failed");
          id = toBase64Url(credential.rawId);
          localStorage.setItem(CREDENTIAL_KEY, id);
        }
        localStorage.setItem(ENABLED_KEY, "1");
        finalMessage = "ready";
        window.dispatchEvent(new CustomEvent("fxmt-device-app-lock-state", { detail: { enabled: true } }));
        if (window.showToast) window.showToast(tr("enabled"));
      }
    } catch (_) {
      finalMessage = enabled() ? "verifyError" : "setupError";
    } finally {
      promptActive = false;
      updateRow(finalMessage);
    }
  }
  async function unlockApp() {
    if (!await platformAvailable() || !credentialId()) {
      setOverlayStatus(!credentialId() ? "credentialMissing" : "unsupported");
      document.getElementById("fxmtDeviceAppLockRecovery").hidden = false;
      return;
    }
    const unlock = document.getElementById("fxmtDeviceAppLockUnlock");
    const recovery = document.getElementById("fxmtDeviceAppLockRecovery");
    if (unlock) unlock.disabled = true;
    if (recovery) recovery.hidden = true;
    setOverlayStatus("waiting");
    promptActive = true;
    try {
      await verifyDevice();
      unlockOverlay();
    } catch (_) {
      setOverlayStatus("verifyError");
      if (recovery) recovery.hidden = false;
    } finally {
      promptActive = false;
      if (unlock && enabled()) unlock.disabled = false;
    }
  }
  function recoverLock() {
    if (!confirm(tr("recoveryConfirm"))) return;
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(CREDENTIAL_KEY);
    unlockOverlay();
    updateRow();
  }

  function applyLocale() {
    const heading = document.getElementById("securityAppLockHeading");
    const description = document.querySelector("#accountSecurityView .account-app-lock-description");
    if (heading) heading.textContent = tr("title");
    if (description) description.textContent = tr("description");
    updateRow();
    updateOverlayCopy();
  }

  function initialize() {
    if (!document.body || document.getElementById(SWITCH_ID)) return;
    addStyles();
    const overlay = ensureOverlay();
    overlay.innerHTML = `<div class="fxmt-device-app-lock-card"><div class="fxmt-device-app-lock-mark" aria-hidden="true"><i class="fa-solid fa-fingerprint"></i></div><h1 id="fxmtDeviceAppLockTitle"></h1><p id="fxmtDeviceAppLockDescription"></p><p class="fxmt-device-app-lock-status" id="fxmtDeviceAppLockStatus" role="status" aria-live="polite"></p><button class="fxmt-device-app-lock-action" id="fxmtDeviceAppLockUnlock" type="button"></button><button class="fxmt-device-app-lock-recovery" id="fxmtDeviceAppLockRecovery" type="button" hidden></button></div>`;
    document.getElementById("fxmtDeviceAppLockUnlock").addEventListener("click", unlockApp);
    document.getElementById("fxmtDeviceAppLockRecovery").addEventListener("click", recoverLock);
    addSecurityCard();
    applyLocale();
    if (enabled()) {
      document.documentElement.classList.add("fxmt-app-lock-pending");
      refreshOverlay();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && !promptActive && enabled()) lockApp();
    });
    window.addEventListener("pagehide", () => { if (!promptActive && enabled()) lockApp(); });
    window.addEventListener("pageshow", (event) => { if (event.persisted && enabled()) lockApp(); });
    window.addEventListener("storage", (event) => {
      if (event.key === ENABLED_KEY) {
        if (event.newValue === "1") lockApp();
        else { unlockOverlay(); updateRow(); }
      }
    });
    new MutationObserver(applyLocale).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
