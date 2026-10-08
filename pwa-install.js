(() => {
  "use strict";

  let deferredPrompt = null;
  let installDialog = null;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://");

  const isIOS = () =>
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isArabic = () =>
    (document.documentElement.lang || "ar").toLowerCase().startsWith("ar");

  function getCopy() {
    if (isArabic()) {
      return {
        title: "تثبيت تطبيق FXTM",
        installed: "التطبيق مثبت بالفعل. افتحه من الشاشة الرئيسية.",
        ios: "في Safari، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وبعدها اضغط «إضافة».",
        android: "افتح قائمة المتصفح ⋮ واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»، ثم أكّد.",
        other: "افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
        close: "إغلاق",
      };
    }
    return {
      title: "Install FXTM",
      installed: "The app is already installed. Open it from your home screen.",
      ios: "In Safari, tap Share, choose “Add to Home Screen,” then tap “Add.”",
      android: "Open the browser menu ⋮, choose “Install app” or “Add to Home screen,” and confirm.",
      other: "Open the browser menu and choose “Install app” or “Add to Home screen.”",
      close: "Close",
    };
  }

  function showInstallGuide(message) {
    const copy = getCopy();
    if (!installDialog) {
      const style = document.createElement("style");
      style.textContent = `
        .fxtm-pwa-dialog {
          width: min(420px, calc(100vw - 32px));
          max-width: none;
          padding: 24px;
          border: 1px solid rgba(230, 167, 255, .48);
          border-radius: 24px;
          background: linear-gradient(145deg, #311345, #10091e 78%);
          color: #fff;
          box-shadow: 0 18px 70px rgba(0, 0, 0, .6), 0 0 32px rgba(203, 90, 255, .25);
          font: inherit;
          text-align: start;
        }
        .fxtm-pwa-dialog::backdrop {
          background: rgba(8, 4, 16, .72);
          backdrop-filter: blur(7px);
        }
        .fxtm-pwa-dialog h2 { margin: 0 0 12px; font-size: 20px; }
        .fxtm-pwa-dialog p { margin: 0 0 22px; color: rgba(255, 255, 255, .86); line-height: 1.8; }
        .fxtm-pwa-dialog button {
          min-height: 44px;
          padding: 0 20px;
          border: 1px solid rgba(255, 255, 255, .35);
          border-radius: 14px;
          background: linear-gradient(110deg, #a84cff, #f044c5);
          color: #fff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .fxtm-brand-icon > img {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          object-fit: contain;
        }
      `;
      document.head.append(style);

      installDialog = document.createElement("dialog");
      installDialog.className = "fxtm-pwa-dialog";
      installDialog.setAttribute("aria-labelledby", "fxtm-pwa-dialog-title");
      installDialog.innerHTML =
        '<h2 id="fxtm-pwa-dialog-title"></h2><p></p><button type="button"></button>';
      installDialog.querySelector("button").addEventListener("click", () => {
        installDialog.close();
      });
      installDialog.addEventListener("click", (event) => {
        if (event.target === installDialog) installDialog.close();
      });
      document.body.append(installDialog);
    }

    installDialog.querySelector("h2").textContent = copy.title;
    installDialog.querySelector("p").textContent =
      message ||
      (isStandalone()
        ? copy.installed
        : isIOS()
          ? copy.ios
          : /Android/i.test(navigator.userAgent)
            ? copy.android
            : copy.other);
    const closeButton = installDialog.querySelector("button");
    closeButton.textContent = copy.close;
    if (typeof installDialog.showModal === "function") installDialog.showModal();
    else installDialog.setAttribute("open", "");
    closeButton.focus();
  }

  async function installOrExplain() {
    if (isStandalone()) {
      showInstallGuide();
      return;
    }

    const promptEvent = deferredPrompt;
    if (!promptEvent) {
      showInstallGuide();
      return;
    }

    deferredPrompt = null;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome !== "accepted") showInstallGuide();
    } catch {
      showInstallGuide();
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest(
        "#downloadAppButton, button[data-action='download'], button[data-account-action='download']",
      );
      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      installOrExplain();
    },
    true,
  );

  function showBrandImages() {
    document.querySelectorAll(".fxtm-brand-icon").forEach((icon) => {
      if (icon.dataset.fxtmImageReady === "true") return;

      const image = document.createElement("img");
      image.src = new URL("./fxtm-app-icon-512.png", document.baseURI).href;
      image.alt = "";
      image.width = 512;
      image.height = 512;
      image.decoding = "async";
      image.style.display = "block";
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.borderRadius = "inherit";
      image.style.objectFit = "contain";
      icon.dataset.fxtmImageReady = "true";
      icon.append(image);
    });
  }

  showBrandImages();
  new MutationObserver(showBrandImages).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
