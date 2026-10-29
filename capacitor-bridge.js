(function() {
    'use strict';
    const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    
    window.AliliNative = {
        isNative,
        ready: false,
        plugins: {},
        
        async init() {
            if (!isNative) { this.ready = true; return; }
            await this.waitForCapacitor();
            this.plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
            this.setupBackButton();
            this.setupStatusBar();
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
        
        async haptic(type = 'light') {
            if (!isNative || !this.plugins.Haptics) return;
            try {
                if (type === 'light') await this.plugins.Haptics.impact({ style: 'Light' });
                else if (type === 'success') await this.plugins.Haptics.notification({ type: 'Success' });
                else if (type === 'error') await this.plugins.Haptics.notification({ type: 'Error' });
            } catch(e) {}
        }
    };
})();
