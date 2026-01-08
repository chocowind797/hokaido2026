// 簡單的 JS 讓導覽列點擊後變色 (UX優化)
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// --- 懸浮視窗控制邏輯 ---

// 開啟視窗：接收文字並顯示
function showModal(text) {
    document.getElementById('modalText').innerText = text; // 設定文字
    document.getElementById('noteModal').style.display = 'flex'; // 顯示視窗
}

// 關閉視窗
function closeModal(e) {
    // 判斷：如果是點擊背景(overlay)或是點擊關閉按鈕，才關閉
    // 這樣可以避免點擊白色卡片內容時誤關
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('noteModal').style.display = 'none';
    }
}