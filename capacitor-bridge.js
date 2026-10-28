(function() {
  'use strict';

  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  const AliliNative = {
    isNative,
    ready: false,
    plugins: {},

    async init() {
      if (!isNative) { this.ready = true; return; }
      await this.waitForCapacitor();
      this.plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
      this.setupBackButton();
      this.setupStatusBar();
      await this.requestPermissions();
      this.ready = true;
    },

    waitForCapacitor() {
      return new Promise((resolve) => {
        if (window.Capacitor && window.Capacitor.Plugins) return resolve();
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((window.Capacitor && window.Capacitor.Plugins) || attempts > 50) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    },

    setupBackButton() {
      const App = this.plugins.App;
      if (!App) return;
      App.addListener('backButton', () => {
        const openModal = document.querySelector('.modal.show');
        if (openModal) { openModal.classList.remove('show'); return; }
        const regenMenu = document.querySelector('.regen-menu.show');
        if (regenMenu) { regenMenu.remove(); return; }
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
          if (window.toggleSidebar) window.toggleSidebar(false);
          return;
        }
        if (App.exitApp) App.exitApp();
      });
    },

    async setupStatusBar() {
      const SB = this.plugins.StatusBar;
      if (!SB) return;
      try {
        if (SB.setStyle) await SB.setStyle({ style: 'DARK' });
        if (SB.setBackgroundColor) await SB.setBackgroundColor({ color: '#050A15' });
      } catch(e) {}
    },

    async requestPermissions() {
      const LN = this.plugins.LocalNotifications;
      if (LN && LN.requestPermissions) {
        try { await LN.requestPermissions(); } catch(e) {}
      }
    },

    async haptic(type = 'light') {
      if (!isNative || !this.plugins.Haptics) return;
      try {
        if (type === 'light') await this.plugins.Haptics.impact({ style: 'Light' });
        else if (type === 'medium') await this.plugins.Haptics.impact({ style: 'Medium' });
        else if (type === 'heavy') await this.plugins.Haptics.impact({ style: 'Heavy' });
        else if (type === 'success') await this.plugins.Haptics.notification({ type: 'Success' });
        else if (type === 'error') await this.plugins.Haptics.notification({ type: 'Error' });
      } catch(e) {}
    },

    async notify(title, body) {
      if (!isNative) {
        try {
          if (Notification.permission === 'granted') new Notification(title, { body });
        } catch(e) {}
        return;
      }
      const LN = this.plugins.LocalNotifications;
      if (!LN) return;
      try {
        await LN.schedule({
          notifications: [{
            id: Math.floor(Date.now() % 2147483647),
            title, body,
            schedule: { at: new Date(Date.now() + 100) }
          }]
        });
      } catch(e) {}
    },

    async saveFile(filename, base64Data) {
      if (!isNative) {
        try {
          const a = document.createElement('a');
          a.href = base64Data;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return true;
        } catch(e) { return false; }
      }
      const FS = this.plugins.Filesystem, SH = this.plugins.Share;
      if (!FS || !SH) return false;
      try {
        const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const res = await FS.writeFile({
          path: filename,
          data: clean,
          directory: 'DOCUMENTS',
          recursive: true
        });
        await SH.share({ title: filename, url: res.uri, dialogTitle: 'حفظ / مشاركة' });
        return true;
      } catch(e) { return false; }
    }
  };

  window.AliliNative = AliliNative;
})();
