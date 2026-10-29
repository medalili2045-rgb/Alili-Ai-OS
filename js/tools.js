window.Tools = {
    async handlePdf(input) {
        if (!input.files?.length) return;
        toast('⏳ جاري قراءة PDF...');
        try {
            const pdf = await pdfjsLib.getDocument({
                data: new Uint8Array(await input.files[0].arrayBuffer())
            }).promise;
            let txt = '';
            for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
                const c = await (await pdf.getPage(i)).getTextContent();
                txt += c.items.map(x => x.str).join(' ') + '\n';
            }
            UI.state.attachedPdfText = txt;
            toast('✅ PDF جاهز، اسأل الآن', 'success');
        } catch(e) {
            toast('❌ فشل قراءة PDF', 'error');
        }
        input.value = '';
    },
    
    async exportChat() {
        const c = UI.state.allChats[UI.state.currentChatId];
        if (!c || !c.messages.length) return toast('المحادثة فارغة', 'error');
        
        const html = `
            <div style="font-family:Cairo,sans-serif;padding:20px;direction:rtl">
                <h1 style="color:#00d2ff">${escapeHtml(c.title)}</h1>
                <p style="color:#888;font-size:12px">${new Date(c.ts).toLocaleString('ar')}</p>
                <hr>
                ${c.messages.map(m => `
                    <div style="margin:15px 0;padding:10px;border-right:4px solid ${m.role === 'user' ? '#0055ff' : '#7a00ff'};background:#f9f9f9">
                        <div style="font-weight:800;color:${m.role === 'user' ? '#0055ff' : '#7a00ff'};margin-bottom:5px">
                            ${m.role === 'user' ? '👤' : '✨'}
                        </div>
                        <div>${m.role === 'ai' ? mdParse(m.content) : escapeHtml(m.content)}</div>
                        ${m.image ? `<img src="${m.image}" style="max-width:100%;border-radius:8px;margin-top:8px">` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        try {
            await html2pdf().from(html).save(`Alili_${c.id}.pdf`);
            toast('✅ تم التصدير', 'success');
        } catch(e) {
            toast('❌ فشل التصدير', 'error');
        }
    }
};
