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

// script.js

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

// --- 手機版強力手風琴效果 (修改版) ---
// 改為監聽 click 事件，手機支援度更好
document.querySelectorAll('summary').forEach(summary => {
    summary.addEventListener('click', function() {
        const thisDetails = this.parentElement; // 取得這個標題所屬的 details 區塊

        // 判斷：如果目前它是關著的 (代表使用者準備要打開它)
        if (!thisDetails.hasAttribute('open')) {
            // 就去找所有其他的 details
            document.querySelectorAll('details').forEach(det => {
                // 如果找到的不是自己，就把它關掉
                if (det !== thisDetails) {
                    det.removeAttribute('open');
                }
            });
        }
    });
});