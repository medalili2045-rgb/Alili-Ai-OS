window.UI = {
    state: {
        allChats: {},
        currentChatId: null,
        pendingChatId: null,
        attachedPdfText: null
    },
    
    renderHistory(filter = '') {
        const list = document.getElementById('chatHistory');
        if (!list) return;
        list.innerHTML = '';
        
        let chats = Object.values(this.state.allChats).sort((a, b) => b.ts - a.ts);
        if (filter) chats = chats.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()));
        
        if (!chats.length) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mut);font-size:13px">لا محادثات</div>';
            return;
        }
        
        chats.forEach(c => {
            const d = document.createElement('div');
            d.className = 'chat-item' + (c.id === this.state.currentChatId ? ' active' : '');
            d.innerHTML = `<span class="title">${escapeHtml(c.title)}</span><button class="del" onclick="event.stopPropagation();UI.deleteChat('${c.id}')">🗑️</button>`;
            d.onclick = () => this.switchChat(c.id);
            list.appendChild(d);
        });
    },
    
    renderChat() {
        const box = document.getElementById('chatBox');
        if (!box) return;
        box.innerHTML = '';
        const msgs = this.state.allChats[this.state.currentChatId]?.messages || [];
        document.getElementById('welcome')?.classList.toggle('hide', msgs.length > 0);
        msgs.forEach((m, i) => this.renderMessage(m, i));
        this.scrollBottom();
    },
    
    renderMessage(m, idx) {
        const box = document.getElementById('chatBox');
        const w = document.createElement('div');
        w.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');
        
        const av = document.createElement('div');
        av.className = 'avatar';
        av.textContent = m.role === 'user' ? '👤' : '✨';
        
        const b = document.createElement('div');
        b.className = 'bubble ' + (m.role === 'ai' ? 'md' : '');
        
        let content = m.role === 'ai' ? mdParse(m.content || '') : escapeHtml(m.content || '');
        
        if (m.image) content = `<img src="${m.image}" class="msg-media" onclick="window.open('${m.image}')">` + content;
        if (m.video) content = `<video src="${m.video}" class="msg-media" controls></video>` + content;
        
        b.innerHTML = content;
        
        if (m.role === 'ai' && m.content) {
            const acts = document.createElement('div');
            acts.className = 'msg-actions';
            acts.innerHTML = `
                <button class="act-btn" onclick="UI.copyMsg(this)">📋 نسخ</button>
                <button class="act-btn" onclick="UI.speakMsg(this)">🔊</button>
                <button class="act-btn" onclick="UI.regenMsg(${idx})">🔄</button>
            `;
            b.appendChild(acts);
        }
        
        w.appendChild(av);
        w.appendChild(b);
        box.appendChild(w);
        return w;
    },
    
    copyMsg(btn) {
        navigator.clipboard.writeText(btn.closest('.bubble').innerText)
            .then(() => toast('✅ تم النسخ', 'success'));
    },
    
    speakMsg(btn) {
        if (!('speechSynthesis' in window)) return toast('غير مدعوم', 'error');
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(btn.closest('.bubble').innerText);
        u.lang = 'ar-SA';
        window.speechSynthesis.speak(u);
    },
    
    regenMsg(idx) {
        const msgs = this.state.allChats[this.state.currentChatId].messages;
        msgs.splice(idx);
        DB.saveChats(this.state.allChats);
        this.renderChat();
        Chat.send();
    },
    
    newChat() {
        const id = Date.now().toString();
        this.state.allChats[id] = { id, title: 'محادثة جديدة', ts: Date.now(), messages: [] };
        this.state.currentChatId = id;
        DB.saveChats(this.state.allChats);
        this.renderHistory();
        this.renderChat();
        toggleSidebar(false);
    },
    
    switchChat(id) {
        this.state.currentChatId = id;
        this.renderHistory();
        this.renderChat();
        toggleSidebar(false);
    },
    
    deleteChat(id) {
        if (!confirm('حذف المحادثة؟')) return;
        delete this.state.allChats[id];
        DB.saveChats(this.state.allChats);
        if (this.state.currentChatId === id) this.newChat();
        else this.renderHistory();
    },
    
    searchChats(q) { this.renderHistory(q); },
    
    scrollBottom() {
        const m = document.getElementById('main');
        if (m) m.scrollTop = m.scrollHeight;
    }
};
