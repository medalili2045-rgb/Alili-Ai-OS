// ═══════════════════════════════════════
// 🚀 الإعدادات
// ═══════════════════════════════════════
const CONFIG = {
    WORKER_URL: "https://alili-ai-pro.medalili2045.workers.dev",
    MAX_CONTEXT: 10,
    TIMEOUT_MS: 60000
};

if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function mdParse(text) { return typeof marked !== 'undefined' ? marked.parse(text || '') : escapeHtml(text); }
function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.className = 'show ' + type;
    setTimeout(() => t.className = '', 3000);
}

// ═══════════════════════════════════════
// 💾 قاعدة البيانات
// ═══════════════════════════════════════
let store;
try { store = localforage.createInstance({ name: 'AliliAI' }); } catch(e) {
    store = {
        getItem: async (k) => JSON.parse(localStorage.getItem(k)),
        setItem: async (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        clear: async () => localStorage.clear()
    };
}

// ═══════════════════════════════════════
// 🌐 الاتصال بالخادم
// ═══════════════════════════════════════
const API = {
    async sendMessage(messages, onChunk, onMedia, signal) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), CONFIG.TIMEOUT_MS);
        if (signal) signal.addEventListener('abort', () => ctrl.abort());
        
        try {
            const res = await fetch(CONFIG.WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
                signal: ctrl.signal
            });
            clearTimeout(timer);
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'فشل الاتصال');
            }
            
            const contentType = res.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (data.type === 'image') { onMedia(data.text || '', 'image', data.image); return; }
                if (data.type === 'video') { onMedia(data.text || '', 'video', data.video); return; }
                if (data.type === 'error') { throw new Error(data.text || 'خطأ'); }
                return;
            }
            
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let buffer = '', fullText = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += dec.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        try {
                            const d = JSON.parse(line.substring(6));
                            const t = d.choices?.[0]?.delta?.content || '';
                            if (t) { fullText += t; onChunk(fullText); }
                        } catch(e) {}
                    }
                }
            }
            return fullText;
        } catch(e) { clearTimeout(timer); throw e; }
    }
};

// ═══════════════════════════════════════
// 🎨 واجهة المستخدم (UI)
// ═══════════════════════════════════════
const state = { allChats: {}, currentChatId: null, pendingChatId: null, attachedPdfText: null };
let abortController = null;

function renderHistory(filter = '') {
    const list = document.getElementById('chatHistory');
    if (!list) return; list.innerHTML = '';
    let chats = Object.values(state.allChats).sort((a, b) => b.ts - a.ts);
    if (filter) chats = chats.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()));
    if (!chats.length) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mut);font-size:13px">لا محادثات</div>'; return; }
    chats.forEach(c => {
        const d = document.createElement('div');
        d.className = 'chat-item' + (c.id === state.currentChatId ? ' active' : '');
        d.innerHTML = `<span class="title">${escapeHtml(c.title)}</span><button class="del" onclick="event.stopPropagation();deleteChat('${c.id}')">🗑️</button>`;
        d.onclick = () => switchChat(c.id);
        list.appendChild(d);
    });
}

function renderChat() {
    const box = document.getElementById('chatBox');
    if (!box) return; box.innerHTML = '';
    const msgs = state.allChats[state.currentChatId]?.messages || [];
    document.getElementById('welcome')?.classList.toggle('hide', msgs.length > 0);
    msgs.forEach((m, i) => renderMessage(m, i));
    scrollBottom();
}

function renderMessage(m, idx) {
    const box = document.getElementById('chatBox');
    const w = document.createElement('div'); w.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');
    const av = document.createElement('div'); av.className = 'avatar'; av.textContent = m.role === 'user' ? '👤' : '✨';
    const b = document.createElement('div'); b.className = 'bubble ' + (m.role === 'ai' ? 'md' : '');
    
    let content = m.role === 'ai' ? mdParse(m.content || '') : escapeHtml(m.content || '');
    if (m.image) content = `<img src="${m.image}" class="msg-media" onclick="window.open('${m.image}')">` + content;
    if (m.video) content = `<video src="${m.video}" class="msg-media" controls></video>` + content;
    b.innerHTML = content;
    
    if (m.role === 'ai' && m.content) {
        const acts = document.createElement('div'); acts.className = 'msg-actions';
        acts.innerHTML = `
            <button class="act-btn" onclick="navigator.clipboard.writeText(this.closest('.bubble').innerText).then(()=>toast('✅ تم النسخ'))">📋 نسخ</button>
            <button class="act-btn" onclick="speakMsg(this)">🔊</button>
            <button class="act-btn" onclick="regenMsg(${idx})">🔄</button>
        `;
        b.appendChild(acts);
    }
    w.appendChild(av); w.appendChild(b); box.appendChild(w);
    return w;
}

function speakMsg(btn) {
    if (!('speechSynthesis' in window)) return toast('غير مدعوم', 'error');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(btn.closest('.bubble').innerText);
    u.lang = 'ar-SA'; window.speechSynthesis.speak(u);
}

function regenMsg(idx) {
    const msgs = state.allChats[state.currentChatId].messages;
    msgs.splice(idx); saveChats(); renderChat(); sendMessage();
}

async function saveChats() { try { await store.setItem('chats', state.allChats); } catch(e) {} }
async function loadChats() { try { state.allChats = await store.getItem('chats') || {}; } catch(e) { state.allChats = {}; } }

function newChat() {
    const id = Date.now().toString();
    state.allChats[id] = { id, title: 'محادثة جديدة', ts: Date.now(), messages: [] };
    state.currentChatId = id;
    saveChats(); renderHistory(); renderChat(); toggleSidebar(false);
}

function switchChat(id) { state.currentChatId = id; renderHistory(); renderChat(); toggleSidebar(false); }
function deleteChat(id) {
    if (!confirm('حذف المحادثة؟')) return;
    delete state.allChats[id]; saveChats();
    if (state.currentChatId === id) newChat(); else renderHistory();
}
function searchChats(q) { renderHistory(q); }
function scrollBottom() { const m = document.getElementById('main'); if (m) m.scrollTop = m.scrollHeight; }

// ═══════════════════════════════════════
// 💬 المحادثة والإرسال
// ═══════════════════════════════════════
async function sendMessage() {
    if (state.pendingChatId) return toast('⏳ انتظر الرد', 'error');
    const input = document.getElementById('chatInput');
    let text = input.value.trim();
    
    if (state.attachedPdfText) {
        text = `[PDF]:\n${state.attachedPdfText.substring(0, 4000)}\n\n[سؤال]: ${text || 'لخص'}`;
        state.attachedPdfText = null;
    }
    if (!text) return;
    
    const cid = state.currentChatId;
    state.allChats[cid].messages.push({ role: 'user', content: text });
    if (state.allChats[cid].title === 'محادثة جديدة') {
        state.allChats[cid].title = text.substring(0, 25); renderHistory();
    }
    input.value = ''; renderChat();
    state.pendingChatId = cid;
    
    const box = document.getElementById('chatBox');
    const loadingW = document.createElement('div');
    loadingW.className = 'msg ai';
    loadingW.innerHTML = `<div class="avatar">✨</div><div class="bubble md"><div class="typing"><span></span><span></span><span></span></div></div>`;
    box.appendChild(loadingW); scrollBottom();
    
    const mdEl = loadingW.querySelector('.md');
    let aiFull = '';
    
    abortController = new AbortController();
    updateSendUI(true);
    
    try {
        const recent = state.allChats[cid].messages.slice(-CONFIG.MAX_CONTEXT);
        const sys = "أنت Alili AI، مساعد ذكي. أجب باللغة العربية.";
        const messages = [{ role: 'system', content: sys }, ...recent.map(m => ({ role: m.role, content: m.content }))];
        
        await API.sendMessage(
            messages,
            (txt) => { aiFull = txt; mdEl.innerHTML = mdParse(txt); scrollBottom(); },
            (text, type, media) => {
                loadingW.remove();
                let mediaHTML = type === 'image' ? `<img src="${media}" class="msg-media">` : `<video src="${media}" class="msg-media" controls></video>`;
                mdEl.innerHTML = mdParse(text) + mediaHTML;
                const assistantMsg = { role: 'assistant', content: text };
                if (type === 'image') assistantMsg.image = media;
                if (type === 'video') assistantMsg.video = media;
                state.allChats[cid].messages.push(assistantMsg);
                saveChats(); if (state.currentChatId === cid) renderChat();
            },
            abortController.signal
        );
        if (aiFull) { state.allChats[cid].messages.push({ role: 'assistant', content: aiFull }); saveChats(); }
    } catch(e) {
        if (e.name === 'AbortError') mdEl.innerHTML = '<span style="color:var(--mut)">⏹ تم الإيقاف</span>';
        else mdEl.innerHTML = `<span style="color:var(--danger)">❌ ${e.message}</span>`;
    } finally {
        state.pendingChatId = null; abortController = null; updateSendUI(false);
    }
}

function updateSendUI(isLoading) {
    const btn = document.getElementById('btnSend'), iconSend = document.getElementById('iconSend'), iconStop = document.getElementById('iconStop');
    if (!btn) return; btn.classList.toggle('stop', isLoading);
    iconSend.style.display = isLoading ? 'none' : 'block';
    iconStop.style.display = isLoading ? 'block' : 'none';
}

function handleSendClick() { if (state.pendingChatId) { if(abortController) abortController.abort(); } else sendMessage(); }
function onEnter(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function quickAction(text) { document.getElementById('chatInput').value = text; sendMessage(); }

// ═══════════════════════════════════════
// 🛠️ الأدوات (PDF، تصدير)
// ═══════════════════════════════════════
async function handlePdf(input) {
    if (!input.files?.length) return; toast('⏳ جاري القراءة...');
    try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await input.files[0].arrayBuffer()) }).promise;
        let txt = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
            const c = await (await pdf.getPage(i)).getTextContent();
            txt += c.items.map(x => x.str).join(' ') + '\n';
        }
        state.attachedPdfText = txt; toast('✅ PDF جاهز', 'success');
    } catch(e) { toast('❌ فشل قراءة PDF', 'error'); }
    input.value = '';
}

async function exportChat() {
    const c = state.allChats[state.currentChatId];
    if (!c || !c.messages.length) return toast('المحادثة فارغة', 'error');
    const html = `<div style="font-family:Cairo,sans-serif;padding:20px;direction:rtl"><h1>${escapeHtml(c.title)}</h1>${c.messages.map(m => `<div style="margin:15px 0;padding:10px;border-right:4px solid ${m.role === 'user' ? '#0055ff' : '#7a00ff'};background:#f9f9f9"><b>${m.role === 'user' ? '👤' : '✨'}</b><div>${m.role === 'ai' ? mdParse(m.content) : escapeHtml(m.content)}</div></div>`).join('')}</div>`;
    try { await html2pdf().from(html).save(`Alili_${c.id}.pdf`); toast('✅ تم التصدير', 'success'); } catch(e) { toast('❌ فشل التصدير', 'error'); }
}

// ═══════════════════════════════════════
// 🎤 الصوت والإعدادات
// ═══════════════════════════════════════
let recognition = null, isRecording = false;
function toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return toast('غير مدعوم', 'error');
    if (!recognition) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR(); recognition.lang = 'ar-SA'; recognition.interimResults = false;
        recognition.onstart = () => { isRecording = true; document.getElementById('btnMic')?.classList.add('recording'); toast('🎤 جاري الاستماع...'); };
        recognition.onresult = (e) => { const t = e.results[0][0].transcript; const i = document.getElementById('chatInput'); i.value += (i.value ? ' ' : '') + t; };
        recognition.onend = () => { isRecording = false; document.getElementById('btnMic')?.classList.remove('recording'); };
    }
    if (isRecording) { try { recognition.stop(); } catch(e) {} } else { try { recognition.start(); } catch(e) {} }
}

function toggleSidebar(open) { document.getElementById('sidebar')?.classList.toggle('open', open); document.getElementById('overlay')?.classList.toggle('show', open); }
function toggleTheme() { document.body.classList.toggle('light'); const l = document.body.classList.contains('light'); localStorage.setItem('theme', l ? 'light' : 'dark'); document.getElementById('themeBtn').textContent = l ? '☀️' : '🌙'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function openSettings() {
    const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
    document.getElementById('profName').value = p.name || ''; document.getElementById('profJob').value = p.job || '';
    document.getElementById('settingsModal')?.classList.add('show');
}
function saveProfile() { localStorage.setItem('user_profile', JSON.stringify({ name: document.getElementById('profName').value, job: document.getElementById('profJob').value })); toast('✅ تم الحفظ', 'success'); }
function clearAllData() { if (!confirm('⚠️ حذف كل شيء؟')) return; localStorage.clear(); store.clear().then(() => location.reload()); }

// ═══════════════════════════════════════
// 🚀 التهيئة
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => { const s = document.getElementById('splash'); if (s) { s.style.opacity = '0'; setTimeout(() => s.remove(), 600); } }, 1200);
    if (window.AliliNative) try { await window.AliliNative.init(); } catch(e) {}
    
    if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light'); document.getElementById('themeBtn').textContent = '☀️'; }
    
    await loadChats();
    if (!Object.keys(state.allChats).length) newChat();
    else {
        state.currentChatId = Object.keys(state.allChats).sort((a, b) => state.allChats[b].ts - state.allChats[a].ts)[0];
        renderHistory(); renderChat();
    }
});
