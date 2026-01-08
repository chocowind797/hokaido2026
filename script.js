// --- 導覽列點擊效果 (保留原本的) ---
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// --- 懸浮視窗控制邏輯 (保留原本的) ---
function showModal(text) {
    document.getElementById('modalText').innerText = text;
    document.getElementById('noteModal').style.display = 'flex';
}

function closeModal(e) {
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('noteModal').style.display = 'none';
    }
}

// --- 超級強制手風琴效果 (手動控制版) ---
document.querySelectorAll('summary').forEach(summary => {
    summary.addEventListener('click', function(e) {
        // 1. 阻止瀏覽器原本的開關行為 (這一步最關鍵！)
        e.preventDefault();

        // 2. 取得這個標題所屬的 details 區塊
        const currentDetails = this.parentElement;
        
        // 3. 記錄它現在是不是開著的
        const isOpen = currentDetails.hasAttribute('open');

        // 4. 先無情地把網頁上「所有」的 details 全部關掉
        document.querySelectorAll('details').forEach(det => {
            det.removeAttribute('open');
        });

        // 5. 如果原本是關著的，現在就把它打開
        // (如果原本是開著的，因為步驟4已經關了，這裡就不動作，達成「關閉」的效果)
        if (!isOpen) {
            currentDetails.setAttribute('open', '');
        }
    });
});