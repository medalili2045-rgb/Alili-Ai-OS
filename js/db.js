window.DB = (function() {
    let store;
    try {
        store = localforage.createInstance({ name: 'AliliAI' });
    } catch(e) {
        store = {
            getItem: async (k) => JSON.parse(localStorage.getItem(k)),
            setItem: async (k, v) => localStorage.setItem(k, JSON.stringify(v)),
            clear: async () => localStorage.clear()
        };
    }
    
    return {
        async loadChats() {
            try { return await store.getItem('chats') || {}; } catch(e) { return {}; }
        },
        async saveChats(chats) {
            try { await store.setItem('chats', chats); } catch(e) {}
        },
        async clear() {
            try { await store.clear(); } catch(e) {}
        }
    };
})();
