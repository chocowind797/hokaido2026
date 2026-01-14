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

// 巢狀手風琴
function setupAccordion(container = document) {
    const detailsList = container.querySelectorAll('details');

    detailsList.forEach(details => {
        const summary = details.querySelector('summary');
        if (!summary) return;

        summary.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止原本 toggle

            const isOpen = details.hasAttribute('open');
            const parent = details.parentElement;

            // 只關閉同層其他的 details
            Array.from(parent.children).forEach(sibling => {
                if (sibling.tagName === 'DETAILS' && sibling !== details) {
                    sibling.removeAttribute('open');
                }
            });

            // 切換自己
            if (!isOpen) {
                details.setAttribute('open', '');
            } else {
                details.removeAttribute('open'); // 點已開啟就收回
            }
        });
    });
}

// 初始化手風琴
setupAccordion();


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

// --- 自動同步標題功能 (data-title 版) ---
function syncSectionTitles() {
    const navLinks = document.querySelectorAll('.nav-item');

    navLinks.forEach(link => {
        const targetId = link.getAttribute('href');
        
        // 取得我們藏在 data-title 裡的完整標題
        const fullTitle = link.getAttribute('data-title');

        if (targetId && targetId.startsWith('#day')) {
            const targetDiv = document.querySelector(targetId);
            
            // 如果 div 存在，且導覽列有設定 data-title
            if (targetDiv && fullTitle) {
                // 就把下方的標題換成完整的 data-title
                targetDiv.innerText = fullTitle;
            }
        }
    });
}

// 執行同步
syncSectionTitles();