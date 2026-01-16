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

// --- 美食頁面與排序功能 ---

// 1. 餐廳資料庫 (您可以自由新增/修改這裡的資料)
const foodData = [
    { name: "三角市場", type: "海鮮丼", hours: "07:00-17:00", price: 2000, rating: 4.5 },
    { name: "若雞時代", type: "炸雞", hours: "11:00-21:00", price: 1200, rating: 4.2 },
    { name: "LeTAO 本店", type: "甜點", hours: "09:00-18:00", price: 900, rating: 4.8 },
    { name: "政壽司", type: "壽司", hours: "11:00-21:00", price: 3500, rating: 4.6 },
    { name: "北果樓", type: "泡芙", hours: "09:00-17:00", price: 300, rating: 4.3 },
    { name: "出拔小路", type: "路邊攤", hours: "11:00-20:00", price: 800, rating: 3.9 },
    { name: "澤崎水產", type: "烤海鮮", hours: "08:00-16:00", price: 2500, rating: 4.4 }
];

// 紀錄目前的排序狀態
let currentSort = {
    column: null,
    direction: 'asc' // 'asc' (升序) 或 'desc' (降序)
};

// 開啟美食頁面
function openFoodPage() {
    document.getElementById('food-page-overlay').style.display = 'flex';
    // 第一次打開時，預設渲染原始資料
    renderTable(foodData);
}

// 關閉美食頁面
function closeFoodPage() {
    document.getElementById('food-page-overlay').style.display = 'none';
}

// 渲染表格 (將資料填入 HTML)
function renderTable(data) {
    const tbody = document.getElementById('food-table-body');
    tbody.innerHTML = ""; // 清空目前內容

    data.forEach(item => {
        // 產生星號字串 (例如 4.5 -> ⭐4.5)
        const starStr = `⭐ ${item.rating}`;

        const row = `
            <tr>
                <td style="font-weight:bold; color:var(--primary);">${item.name}</td>
                <td>${item.type}</td>
                <td>${item.hours}</td>
                <td>¥${item.price.toLocaleString()}</td>
                <td style="color:#f39c12; font-weight:bold;">${starStr}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 核心功能：排序表格
function sortFoodTable(column) {
    const ths = document.querySelectorAll('#food-table th');
    
    // 1. 判斷排序方向
    if (currentSort.column === column) {
        // 如果點擊的是同一個欄位，切換方向 (升 -> 降 -> 升)
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // 如果點擊新欄位，重置為升序
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // 2. 更新表頭箭頭顯示 (CSS class)
    ths.forEach(th => {
        th.classList.remove('asc', 'desc'); // 先移除所有箭頭
        // 找到目前被點擊的那個 th，加上對應的 class
        if (th.getAttribute('onclick').includes(column)) {
            th.classList.add(currentSort.direction);
        }
    });

    // 3. 執行資料排序
    // 複製一份新陣列以免動到原始資料 (使用 spread syntax [...])
    const sortedData = [...foodData].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // 如果是字串，轉換成小寫來比較 (避免大小寫影響)
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) {
            return currentSort.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return currentSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    // 4. 重新渲染表格
    renderTable(sortedData);
}

// --- 回到頂部按鈕功能 ---

const scrollBtn = document.getElementById("scrollTopBtn");

// 監聽網頁捲動事件
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    // 當捲動超過 300px 時顯示按鈕
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.classList.add("show");
    } else {
        scrollBtn.classList.remove("show");
    }
}

// 點擊按鈕執行的動作
function scrollToTop() {
    // 平滑捲動回最上方
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}