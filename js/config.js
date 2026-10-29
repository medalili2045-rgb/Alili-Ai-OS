window.CONFIG = {
    WORKER_URL: "https://alili-ai-pro.medalili2045.workers.dev",
    MAX_CONTEXT: 10,
    TIMEOUT_MS: 60000
};

if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

window.escapeHtml = function(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
};
window.mdParse = function(text) {
    return typeof marked !== 'undefined' ? marked.parse(text || '') : escapeHtml(text);
};
window.toast = function(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show ' + type;
    setTimeout(() => t.className = '', 3000);
};
