window.Chat = (function() {
    let abortController = null;
    
    return {
        async send() {
            const S = UI.state;
            if (S.pendingChatId) return toast('⏳ انتظر الرد', 'error');
            
            const input = document.getElementById('chatInput');
            let text = input.value.trim();
            
            if (S.attachedPdfText) {
                text = `[PDF]:\n${S.attachedPdfText.substring(0, 4000)}\n\n[سؤال]: ${text || 'لخص'}`;
                S.attachedPdfText = null;
            }
            
            if (!text) return;
            
            const cid = S.currentChatId;
            S.allChats[cid].messages.push({ role: 'user', content: text });
            
            if (S.allChats[cid].title === 'محادثة جديدة') {
                S.allChats[cid].title = text.substring(0, 25);
                UI.renderHistory();
            }
            
            input.value = '';
            UI.renderChat();
            S.pendingChatId = cid;
            
            const box = document.getElementById('chatBox');
            const loadingW = document.createElement('div');
            loadingW.className = 'msg ai';
            loadingW.innerHTML = `<div class="avatar">✨</div><div class="bubble md"><div class="typing"><span></span><span></span><span></span></div></div>`;
            box.appendChild(loadingW);
            UI.scrollBottom();
            
            const mdEl = loadingW.querySelector('.md');
            let aiFull = '';
            
            abortController = new AbortController();
            updateSendUI(true);
            
            try {
                const recent = S.allChats[cid].messages.slice(-CONFIG.MAX_CONTEXT);
                const sys = "أنت Alili AI، مساعد ذكي. أجب باللغة العربية.";
                const messages = [
                    { role: 'system', content: sys },
                    ...recent.map(m => ({ role: m.role, content: m.content }))
                ];
                
                await API.sendMessage(
                    messages,
                    (txt) => {
                        aiFull = txt;
                        mdEl.innerHTML = mdParse(txt);
                        UI.scrollBottom();
                    },
                    (text, type, media) => {
                        loadingW.remove();
                        let mediaHTML = '';
                        if (type === 'image') mediaHTML = `<img src="${media}" class="msg-media">`;
                        if (type === 'video') mediaHTML = `<video src="${media}" class="msg-media" controls></video>`;
                        mdEl.innerHTML = mdParse(text) + mediaHTML;
                        
                        const assistantMsg = { role: 'assistant', content: text };
                        if (type === 'image') assistantMsg.image = media;
                        if (type === 'video') assistantMsg.video = media;
                        S.allChats[cid].messages.push(assistantMsg);
                        DB.saveChats(S.allChats);
                        if (S.currentChatId === cid) UI.renderChat();
                    },
                    abortController.signal
                );
                
                if (aiFull) {
                    S.allChats[cid].messages.push({ role: 'assistant', content: aiFull });
                    DB.saveChats(S.allChats);
                }
            } catch(e) {
                if (e.name === 'AbortError') {
                    mdEl.innerHTML = '<span style="color:var(--mut)">⏹ تم الإيقاف</span>';
                } else {
                    mdEl.innerHTML = `<span style="color:var(--danger)">❌ ${e.message}</span>`;
                }
            } finally {
                S.pendingChatId = null;
                abortController = null;
                updateSendUI(false);
            }
        },
        
        stop() {
            if (abortController) { abortController.abort(); abortController = null; }
        }
    };
})();

function updateSendUI(isLoading) {
    const btn = document.getElementById('btnSend');
    const iconSend = document.getElementById('iconSend');
    const iconStop = document.getElementById('iconStop');
    if (!btn) return;
    btn.classList.toggle('stop', isLoading);
    if (iconSend) iconSend.style.display = isLoading ? 'none' : 'block';
    if (iconStop) iconStop.style.display = isLoading ? 'block' : 'none';
}

function handleSendClick() {
    if (UI.state.pendingChatId) Chat.stop();
    else Chat.send();
}
