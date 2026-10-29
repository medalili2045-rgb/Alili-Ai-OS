window.API = {
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
            
            // رد JSON (صورة أو فيديو أو خطأ)
            if (contentType.includes('application/json')) {
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                if (data.type === 'image') { onMedia(data.text || '', 'image', data.image); return; }
                if (data.type === 'video') { onMedia(data.text || '', 'video', data.video); return; }
                if (data.type === 'error') { throw new Error(data.text || 'خطأ'); }
                return;
            }
            
            // رد Stream (نص)
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
        } catch(e) {
            clearTimeout(timer);
            throw e;
        }
    }
};
