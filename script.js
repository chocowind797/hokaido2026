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

// script.js 最下方加入

// --- 函館山即時天氣功能 (Open-Meteo API) ---
async function fetchHakodateWeather() {
    const weatherSpan = document.getElementById('hakodate-weather');
    if (!weatherSpan) return; // 如果找不到格子就不執行

    try {
        // 1. 呼叫 API (座標設為函館山: 41.76, 140.70)
        // 使用 Open-Meteo 免費 API，抓取溫度和天氣代碼
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.76&longitude=140.70&current=temperature_2m,weather_code&timezone=Asia%2FTokyo');
        const data = await response.json();

        // 2. 解析資料
        const temp = data.current.temperature_2m; // 溫度
        const code = data.current.weather_code;   // 天氣代碼 (0=晴, 1-3=多雲, etc.)
        
        // 3. 將代碼翻譯成中文圖示
        let weatherDesc = "多雲";
        if (code === 0) weatherDesc = "☀️ 晴天";
        else if (code >= 1 && code <= 3) weatherDesc = "☁️ 多雲";
        else if (code >= 45 && code <= 48) weatherDesc = "🌫️ 起霧";
        else if (code >= 51 && code <= 67) weatherDesc = "🌧️ 下雨";
        else if (code >= 71 && code <= 77) weatherDesc = "❄️ 下雪";
        else if (code >= 80) weatherDesc = "⛈️ 雷雨";

        // 4. 更新網頁上的文字
        weatherSpan.innerText = `${temp}°C / ${weatherDesc}`;
        
    } catch (error) {
        console.error("天氣讀取失敗:", error);
        weatherSpan.innerText = "暫時無法讀取 (點擊查詢)";
        // 如果失敗，讓文字變成可點擊的連結，連去 Google
        weatherSpan.onclick = function() {
            window.open('https://www.google.com/search?q=函館山+天氣');
        };
        weatherSpan.style.cursor = 'pointer';
        weatherSpan.style.textDecoration = 'underline';
    }
}

// 執行天氣抓取函式
fetchHakodateWeather();