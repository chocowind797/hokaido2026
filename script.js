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

// --- 手風琴效果 (Accordion) ---
// 功能：當打開一個折疊區塊時，自動關閉其他已打開的區塊

const allDetails = document.querySelectorAll('details');

allDetails.forEach(targetDetail => {
    // 監聽每一個 details 的展開/縮起事件
    targetDetail.addEventListener('toggle', () => {
        // 只有當這個區塊是「被打開 (open)」的時候才執行
        if (targetDetail.open) {
            // 檢查頁面上所有其他的 details
            allDetails.forEach(detail => {
                // 如果這個 detail 不是目前剛被點開的那一個，而且它目前是開著的
                if (detail !== targetDetail && detail.open) {
                    // 就把它關掉
                    detail.removeAttribute('open');
                }
            });
        }
    });
});