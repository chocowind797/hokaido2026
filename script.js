// --- 導覽列點擊效果 (保留原本的) ---
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// --- 懸浮視窗控制邏輯 (保留原本的) ---
function showModal(title, text) {
    document.getElementById('modalText').innerText = text;
    document.getElementById('modelTitle').innerText = title;
    document.getElementById('noteModal').style.display = 'flex';
}

function closeModal(e) {
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('noteModal').style.display = 'none';
    }
}

// 全域手風琴：文件內任何地方，只要 class 一樣，就會互相連動
function setupAccordion(container = document) {
    // 1. 抓出所有的 details
    const allDetails = document.querySelectorAll('details');

    allDetails.forEach(details => {
        const summary = details.querySelector('summary');
        if (!summary) return;

        summary.addEventListener('click', function(e) {
            e.preventDefault(); // 接管預設行為

            const isOpen = details.hasAttribute('open');
            // 取得自己的 class 字串 (例如 "train-info")
            const myClass = details.getAttribute('class');

            // 邏輯：如果你準備要「打開」，且你有設定 class
            if (!isOpen && myClass) {
                // 2. 搜尋整份文件 (Global Search)
                // 這裡不用 container，而是直接用 document，確保跨區塊也能搜尋
                const allOtherDetails = document.querySelectorAll('details');

                allOtherDetails.forEach(other => {
                    // 條件：
                    // 不是自己
                    // 目前是開著的
                    // 🔥 關鍵：Class 名稱必須完全一樣
                    if (other !== details && 
                        other.hasAttribute('open') && 
                        other.getAttribute('class') === myClass) {
                        
                        other.removeAttribute('open');
                    }
                });
            }

            // 3. 切換自己的狀態
            if (!isOpen) {
                details.setAttribute('open', '');
            } else {
                details.removeAttribute('open');
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

// --- 自動同步標題功能 (修正版：保留日期) ---
function syncSectionTitles() {
    const navLinks = document.querySelectorAll('.nav-item');

    navLinks.forEach(link => {
        const targetId = link.getAttribute('href');
        
        // 取得我們藏在 data-title 裡的完整標題
        const fullTitle = link.getAttribute('data-title');

        if (targetId && targetId.startsWith('#day')) {
            const targetDiv = document.querySelector(targetId);
            
            if (targetDiv && fullTitle) {
                // 1. ⚠️ 先檢查裡面有沒有日期小標籤 (.date-label)，有的話先存起來
                const dateLabel = targetDiv.querySelector('.date-label');
                
                // 2. 更新標題文字 (這一步會把內容清空)
                targetDiv.innerText = fullTitle;
                
                // 3. ⚠️ 如果剛剛有找到日期標籤，把它「黏回去」
                if (dateLabel) {
                    targetDiv.appendChild(dateLabel);
                }
            }
        }
    });
}

// 執行同步
syncSectionTitles();

// --- 美食頁面與 CSV 讀取功能 (參數化版) ---

let foodData = [];
let currentSort = { column: null, direction: 'asc' };

// 1. 開啟美食頁面 (接收城市名稱，例如 '小樽', '函館')
function openFoodPage(city) {
    // 顯示全螢幕頁面
    document.getElementById('food-page-overlay').style.display = 'flex';

    // ⚠️ 修改這裡：同時鎖定 html 和 body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // 🔥 動態修改標題：讓標題變成 "小樽美食推薦" 或 "函館美食推薦"
    const titleElement = document.querySelector('#food-page-overlay h2');
    if (titleElement) {
        titleElement.innerText = `${city}美食推薦`;
    }

    // 呼叫讀取函式，並把城市傳進去
    loadCSVData(city);
}

// 2. 關閉頁面 (維持不變)
function closeFoodPage() {
    document.getElementById('food-page-overlay').style.display = 'none';

    // ⚠️ 修改這裡：同時解除鎖定
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
}

// 3. 讀取 CSV 並篩選 (接收城市參數)
function loadCSVData(city) {
    const tbody = document.getElementById('food-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">載入中...</td></tr>';

    fetch('asset/recommend.csv')
        .then(response => {
            if (!response.ok) throw new Error("找不到 CSV 檔案");
            return response.text();
        })
        .then(text => {
            const allData = csvToJSON(text);

            // 🔥 關鍵修改：使用傳進來的 city 變數進行篩選
            foodData = allData.filter(item => item.location.includes(city));

            renderTable(foodData);
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">讀取失敗</td></tr>';
        });
}

// 4. 將 CSV 文字轉換為 JSON 陣列的工具函式
function csvToJSON(csvText) {
    // 依換行符號切割每一行
    const lines = csvText.trim().split('\n');
    const result = [];
    
    // CSV 的標題對照表 (將中文標題轉為英文 Key，方便程式操作)
    // CSV標題: 程式變數
    const headersMap = {
        '餐廳名稱': 'name',
        '營業時間': 'hours',
        '營業備註': 'note',
        '種類': 'type',
        '地點': 'location',
        '價格': 'price',
        '星等': 'rating',
        '網址': 'url'
    };

    // 取得第一行標題，並去除多餘空白
    const headers = lines[0].split(',').map(h => h.trim());

    // 從第二行開始跑迴圈 (略過標題)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 跳過空行

        const currentLine = lines[i].split(',');
        let obj = {};

        headers.forEach((header, index) => {
            // 取得對應的英文 Key (如果對照表沒有，就用原始中文)
            const key = headersMap[header] || header;
            let value = currentLine[index] ? currentLine[index].trim() : '';

            // 針對數字欄位進行轉換，這樣排序才會正確
            if (key === 'price') value = parseInt(value) || 0;
            if (key === 'rating') value = parseFloat(value) || 0;

            obj[key] = value;
        });

        result.push(obj);
    }
    return result;
}

// 5. 渲染表格 (包含網址點擊功能)
function renderTable(data) {
    const tbody = document.getElementById('food-table-body');
    tbody.innerHTML = ""; 

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">沒有找到符合的資料</td></tr>';
        return;
    }

    data.forEach(item => {
        // 1. 處理備註 (維持原本邏輯)
        const hoursDisplay = item.note 
            ? `${item.hours}<br><span style="font-size:0.8rem; color:#888;">(${item.note})</span>` 
            : item.hours;

        // ============================================
        // ⬇️ 修改開始：處理名稱截斷與連結 ⬇️
        // ============================================
        
        let displayName = "";
        let weight = 0;
        const limit = 20; // 總權重限制 (20單位)

        for (let char of item.name) {
            // 判斷權重：字元編碼大於 255 (通常是中文/全形) 算 2，否則算 1
            let charWeight = char.charCodeAt(0) > 255 ? 2 : 1;
            
            // 如果加上這個字會超過限制，就加上 "..." 並停止
            if (weight + charWeight > limit) {
                displayName += "...";
                break; 
            }
            
            displayName += char;
            weight += charWeight;
        }

        // oncontextmenu="return false" 是為了防止手機長按跳出系統選單
        const longPressEvents = `
            data-fullname="${item.name}" 
            ontouchstart="startLongPress(this)" 
            ontouchend="cancelLongPress()" 
            onmousedown="startLongPress(this)" 
            onmouseup="cancelLongPress()"
            oncontextmenu="return false;" 
        `;

        const nameDisplay = item.url && item.url.startsWith('http')
            ? `<a href="${item.url}" target="_blank" class="clean-link" title="${item.name}" ${longPressEvents}>${displayName}</a>`
            : `<span style="font-weight:bold; color:var(--primary);" title="${item.name}" ${longPressEvents}>${displayName}</span>`;

        // ============================================
        // ⬆️ 修改結束 ⬆️
        // ============================================

        const row = `
            <tr>
                <td>${nameDisplay}</td>
                <td>${item.type}</td>
                <td>${hoursDisplay}</td>
                <td>¥${item.price.toLocaleString()}</td>
                <td style="color:#f39c12; font-weight:bold;">⭐ ${item.rating}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// 6. 排序功能 (完全沿用，因為我們的 key name 已經對應好了)
// ============================================
// ⬇️ 修改：營業時間智慧排序邏輯 ⬇️
// ============================================

// 工具函式：解析營業時間字串
// 回傳格式：{ open: 數值, close: 數值 } (例如 08:00 -> 800)
function parseBusinessHours(timeStr) {
    if (!timeStr) return { open: 9999, close: 0 }; // 空值防呆

    // 處理 "24小時"
    if (timeStr.includes('24') && (timeStr.includes('H') || timeStr.includes('小時'))) {
        return { open: 0, close: 2400 }; // 0點開，24點關
    }

    // 處理標準格式 "08:00-17:00"
    // 先移除備註 (括號後的內容)，只留時間部分
    const pureTime = timeStr.split('(')[0].trim(); 
    const parts = pureTime.split('~');

    if (parts.length >= 2) {
        // 移除冒號並轉為數字 (例 "08:00" -> 800)
        let openVal = parseInt(parts[0].replace(':', '')) || 9999;
        let closeVal = parseInt(parts[1].replace(':', '')) || 0;

        // 處理跨夜時間 (例如 18:00-02:00)，關門時間加 2400 讓排序正確
        if (closeVal < openVal) {
            closeVal += 2400;
        }
        
        return { open: openVal, close: closeVal };
    }

    return { open: 9999, close: 0 }; // 格式不符放最後
}

// 修改後的排序功能
function sortFoodTable(column) {
    const ths = document.querySelectorAll('#food-table th');
    
    // 切換排序方向
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // 更新箭頭樣式
    ths.forEach(th => {
        th.classList.remove('asc', 'desc');
        // 注意：這裡增加了對 'type' 參數的相容性檢查
        if (th.getAttribute('onclick') && th.getAttribute('onclick').includes(`'${column}'`)) {
            th.classList.add(currentSort.direction);
        }
    });

    const sortedData = [...foodData].sort((a, b) => {
        // ⏰ 特殊處理：如果是排序「營業時間」
        if (column === 'hours') {
            const timeA = parseBusinessHours(a.hours);
            const timeB = parseBusinessHours(b.hours);

            if (currentSort.direction === 'asc') {
                // 升序：比較「開門時間」 (越早開的在上面)
                return timeA.open - timeB.open;
            } else {
                // 降序：比較「關門時間」 (越晚關的在上面)
                // 注意：這裡是 B - A，讓晚關的排前面
                return timeB.close - timeA.close;
            }
        }

        // 📄 一般文字/數字排序 (維持原樣)
        let valA = a[column];
        let valB = b[column];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(sortedData);
    
    // 如果目前有開啟篩選視窗，長按功能重新綁定不會受影響
}

// --- 自動將所有表格變成可左右滑動 ---
function autoMakeTablesScrollable() {
    // 1. 找到所有位於 timeline-box 裡面的表格
    const tables = document.querySelectorAll('.timeline-box table');

    tables.forEach(table => {
        // 2. 檢查這個表格是否已經有捲動外框了？
        const parent = table.parentElement;
        if (parent.classList.contains('table-scroll-wrapper')) {
            return; // 如果已經有了，就跳過
        }

        // 3. 如果沒有，就建立一個新的 div
        const wrapper = document.createElement('div');
        wrapper.classList.add('table-scroll-wrapper');

        // 4. 把表格搬進這個 div 裡面
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        
        // 5. 確保表格寬度足夠觸發滑動 (針對非凍結首欄的一般表格)
        if (!table.classList.contains('res-table')) {
            table.style.minWidth = "400px"; // 強制最小寬度，確保手機上會出現卷軸
        }
    });
}

// 網頁載入後執行
autoMakeTablesScrollable();

// --- 長按顯示 Toast 功能 ---

let pressTimer; // 計時器變數

// 1. 開始按壓 (手指碰到螢幕 或 滑鼠按下)
function startLongPress(element) {
    // 取得完整名稱
    const fullName = element.getAttribute('data-fullname');
    
    // 設定計時器：如果按住超過 600 毫秒，就顯示 Toast
    pressTimer = setTimeout(() => {
        showToast(fullName);
    }, 600);
}

// 2. 結束按壓 (手指離開 或 滑鼠放開 或 滑動手指)
function cancelLongPress() {
    clearTimeout(pressTimer); // 清除計時器，避免短按也觸發
}

// 3. 顯示 Toast 的核心函式
function showToast(message) {
    const toast = document.getElementById("toast-box");
    if (!message) return;

    toast.innerText = message;
    toast.className = "show"; // 加上 class 顯示

    // 3秒後自動消失
    setTimeout(function() { 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}

const scrollBtn = document.getElementById("scrollTopBtn");

// 監聽網頁捲動事件
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    // 為了保險起見，加入 null 檢查，避免按鈕還沒生成就報錯
    if (!scrollBtn) return;

    // 當捲動超過 300px 時顯示按鈕
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.classList.add("show");
    } else {
        scrollBtn.classList.remove("show");
    }
}

// 點擊按鈕執行的動作
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ============================================
// ⬇️ 種類篩選功能 (Long Press Filter) ⬇️
// ============================================

let typePressTimer;
let isTypeLongPress = false;
let currentActiveFilters = []; // 儲存目前勾選的種類

// 1. 開始按壓 (Header)
function startTypeLongPress() {
    isTypeLongPress = false;
    typePressTimer = setTimeout(() => {
        isTypeLongPress = true; // 標記為長按觸發
        openFilterModal();      // 開啟篩選視窗
    }, 600); // 0.6秒視為長按
}

// 2. 結束按壓
function cancelTypeLongPress() {
    clearTimeout(typePressTimer);
}

// 3. 處理點擊 (如果是長按觸發過的，就不執行排序)
function handleTypeHeaderClick(column) {
    if (isTypeLongPress) {
        // 如果是長按剛結束，什麼都不做 (已經開視窗了)
        isTypeLongPress = false; 
    } else {
        // 如果是短按，執行原本的排序功能，並把 'type' 傳進去
        sortFoodTable(column);
    }
}

// 4. 開啟篩選視窗
function openFilterModal() {
    const modal = document.getElementById('filter-modal');
    const listDiv = document.getElementById('filter-options');
    
    // 取得目前所有不重複的種類
    // 注意：這裡使用 foodData (當前城市的原始資料)
    const allTypes = [...new Set(foodData.map(item => item.type))];
    
    listDiv.innerHTML = ""; // 清空舊選項

    // 建立 Checkbox
    allTypes.forEach(type => {
        const isChecked = currentActiveFilters.length === 0 || currentActiveFilters.includes(type);
        
        const div = document.createElement('div');
        div.className = 'filter-item';
        div.innerHTML = `
            <label style="width:100%; cursor:pointer; display:flex; align-items:center;">
                <input type="checkbox" value="${type}" ${isChecked ? 'checked' : ''}>
                ${type}
            </label>
        `;
        listDiv.appendChild(div);
    });

    modal.style.display = 'flex'; // 顯示視窗
}

// 5. 確認篩選 (Apply)
function applyFilter() {
    const checkboxes = document.querySelectorAll('#filter-options input[type="checkbox"]');
    currentActiveFilters = [];

    // 收集所有被勾選的 value
    checkboxes.forEach(box => {
        if (box.checked) {
            currentActiveFilters.push(box.value);
        }
    });

    // 如果全部都勾，或者全部都沒勾，視為「全選」 (清空過濾器)
    if (currentActiveFilters.length === 0 || currentActiveFilters.length === checkboxes.length) {
        currentActiveFilters = []; // 空陣列代表不篩選
    }

    // 執行篩選並更新表格
    executeFilterRender();
    
    // 關閉視窗
    document.getElementById('filter-modal').style.display = 'none';
}

// 6. 清除篩選 (Clear)
function clearFilter() {
    currentActiveFilters = []; // 清空條件
    executeFilterRender();
    document.getElementById('filter-modal').style.display = 'none';
    
    // 顯示提示
    showToast("已顯示所有種類");
}

// 7. 核心篩選與渲染函式
function executeFilterRender() {
    // 從「原始資料 (foodData)」中篩選
    let filteredData = foodData;

    // 如果有設定篩選條件，就進行過濾
    if (currentActiveFilters.length > 0) {
        filteredData = foodData.filter(item => currentActiveFilters.includes(item.type));
    }

    // 呼叫原本的渲染函式
    renderTable(filteredData);
}