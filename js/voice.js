window.Voice = (function() {
    let recognition = null;
    let isRecording = false;
    
    return {
        toggle() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return toast('الإدخال الصوتي غير مدعوم', 'error');
            }
            
            if (!recognition) {
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                recognition = new SR();
                recognition.lang = 'ar-SA';
                recognition.interimResults = false;
                recognition.onstart = () => {
                    isRecording = true;
                    document.getElementById('btnMic')?.classList.add('recording');
                    toast('🎤 جاري الاستماع...');
                };
                recognition.onresult = (e) => {
                    const t = e.results[0][0].transcript;
                    const input = document.getElementById('chatInput');
                    if (input) input.value += (input.value ? ' ' : '') + t;
                };
                recognition.onerror = () => toast('فشل التعرف', 'error');
                recognition.onend = () => {
                    isRecording = false;
                    document.getElementById('btnMic')?.classList.remove('recording');
                };
            }
            
            if (isRecording) { try { recognition.stop(); } catch(e) {} }
            else { try { recognition.start(); } catch(e) {} }
        }
    };
})();
