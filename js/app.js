function toggleSidebar(open) {
    document.getElementById('sidebar')?.classList.toggle('open', open);
    document.getElementById('overlay')?.classList.toggle('show', open);
}

function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
}

function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

function openSettings() {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const nameEl = document.getElementById('profName');
    const jobEl = document.getElementById('profJob');
    if (nameEl) nameEl.value = profile.name || '';
    if (jobEl) jobEl.value = profile.job || '';
    document.getElementById('settingsModal')?.classList.add('show');
}

function saveProfile() {
    localStorage.setItem('user_profile', JSON.stringify({
        name: document.getElementById('profName').value,
        job: document.getElementById('profJob').value
    }));
    toast('✅ تم الحفظ', 'success');
}

function toggleSwitch(id) { document.getElementById(id)?.classList.toggle('on'); }

function clearAllData() {
    if (!confirm('⚠️ حذف كل شيء؟')) return;
    if (!confirm('تأكيد أخير؟')) return;
    localStorage.clear();
    DB.clear().then(() => location.reload());
}

function newChat() { UI.newChat(); }
function searchChats(q) { UI.searchChats(q); }
function toggleVoiceInput() { Voice.toggle(); }
function handlePdf(input) { Tools.handlePdf(input); }
function exportChat() { Tools.exportChat(); }
function onEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Chat.send(); }
}
function quickAction(text) {
    document.getElementById('chatInput').value = text;
    Chat.send();
}

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 600); }
    }, 1200);
    
    if (window.AliliNative) try { await window.AliliNative.init(); } catch(e) {}
    
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeBtn').textContent = '☀️';
    }
    
    try {
        UI.state.allChats = await DB.loadChats();
        if (!Object.keys(UI.state.allChats).length) {
            UI.newChat();
        } else {
            UI.state.currentChatId = Object.keys(UI.state.allChats).sort((a, b) => UI.state.allChats[b].ts - UI.state.allChats[a].ts)[0];
            UI.renderHistory();
            UI.renderChat();
        }
    } catch(e) {
        UI.newChat();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
        toggleSidebar(false);
    }
});
