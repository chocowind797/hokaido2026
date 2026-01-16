let typePressTimer;
let isTypeLongPress = false;
let currentSubFilters = []; // 儲存被勾選的「細項」

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
// 工具函式：將 CSV 文字轉為 JSON 物件陣列
function csvToJSON(csvText) {
    const lines = csvText.split('\n');
    const result = [];

    // 從第 1 行開始 (跳過第 0 行標題)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');

        if (cols.length < 2) continue;

        // 依照您提供的順序對應欄位 (Index 從 0 開始)
        // 0:名稱, 1:時間, 2:備註, 3:種類, 4:細項, 5:地點, 6:星等, 7:網址
        const obj = {
            name: cols[0]?.trim(),
            
            hours: cols[1]?.trim(), // 營業時間
            
            // cols[2] 是營業備註，目前前端沒用到，若未來需要可加回來
            
            type: cols[3]?.trim(),  // 主種類 (用於篩選樹狀圖的父層)
            
            subType: cols[4]?.trim() || "", // 細項 (用於顯示 & 篩選子層)
            
            location: cols[5]?.trim() || "", // 地點 (用於 loadCSVData 篩選城市)
            
            rating: cols[6]?.trim(), // 星等
            
            map: cols[7]?.trim() || '#' // 網址
        };

        result.push(obj);
    }

    return result;
}

// 定義長按計時器變數
let cellPressTimer;

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
            ? `<a href="${item.url}" target="_blank" class="clean-link" title="${item.name}" ${longPressEvents}>${item.name}</a>`
            : `<span style="font-weight:bold; color:var(--primary);" title="${item.name}" ${longPressEvents}>${item.name}</span>`;

        // ============================================
        // ⬆️ 修改結束 ⬆️
        // ============================================

        // 1. 處理細項顯示邏輯
        // 先確保有資料，並依分號切割
        const rawSubType = item.subType || item.type;
        const subArray = rawSubType.split(/;|；/).map(s => s.trim()).filter(s => s);
        
        // 預設顯示第一項
        let displayText = subArray[0];            

        // 如果目前有正在篩選的關鍵字 (currentSubFilters 在全域變數中)
        if (typeof currentSubFilters !== 'undefined' && currentSubFilters.length > 0) {
            // 在這間店的細項清單中，尋找是否有「符合目前篩選條件」的項目
            const match = subArray.find(sub => currentSubFilters.includes(sub));
            
            // 如果有找到 (例如店裡賣 [拉麵, 餃子]，使用者篩選 [餃子])
            if (match) {
                displayText = match; // 強制將顯示文字改成 "餃子"
            }
        }
        if (subArray.length > 1) {
            // 如果超過 1 項：顯示第一項 + "..."
            displayText += `...`;
        }

        const row = `
            <tr>
                <td class="food-name">${nameDisplay}</td>
                <td style="text-align: center; cursor: pointer;" 
                data-name="${item.name}"
                    data-full="${rawSubType}"
                    onmousedown="startCellLongPress(this)" 
                    onmouseup="cancelCellLongPress()" 
                    ontouchstart="startCellLongPress(this)" 
                    ontouchend="cancelCellLongPress()"
                    ontouchmove="cancelCellLongPress()"
                    >
                    ${displayText}
                </td>
                <td style="text-align: center;">${hoursDisplay}</td>
                <td style="color:#f39c12; font-weight:bold; text-align: center;">⭐ ${item.rating}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ============================================
// ⬇️ 細項長按顯示完整資訊功能 ⬇️
// ============================================

// 1. 開始按壓 (儲存格)
function startCellLongPress(element) {
    cancelCellLongPress(); // 先清除舊的，避免重複

    cellPressTimer = setTimeout(() => {
        // 取得藏在 data attribute 裡的資料
        const name = element.getAttribute('data-name');
        const fullType = element.getAttribute('data-full');
        
        // 呼叫顯示視窗
        showDetailModal(name, fullType);
        
        // (選用) 手機震動一下回饋
        if (navigator.vibrate) navigator.vibrate(50);
        
    }, 500); // 設定 0.5 秒為長按
}

// 2. 取消按壓 (手指放開或移動時)
function cancelCellLongPress() {
    if (cellPressTimer) {
        clearTimeout(cellPressTimer);
        cellPressTimer = null;
    }
}

// 3. 顯示詳細視窗
function showDetailModal(name, fullType) {
    const modal = document.getElementById('sub-detail-modal');
    const titleEl = document.getElementById('detail-title');
    const contentEl = document.getElementById('detail-content');

    titleEl.innerText = name;

    // 將分號轉為換行或是頓號，這裡示範用「標籤式」顯示，看起來更清楚
    if (fullType) {
        const list = fullType.split(/;|；/).map(s => s.trim()).filter(s => s);
        // 將每個項目變成一個小標籤樣式
        contentEl.innerHTML = list.map(item => 
            `<span style="display:inline-block; background:#f0f0f0; padding:5px 10px; margin:5px; border-radius:15px; border:1px solid #ddd;">${item}</span>`
        ).join('');
    } else {
        contentEl.innerText = "無詳細資料";
    }

    modal.style.display = 'flex';
}

// 4. 關閉詳細視窗
function closeDetailModal() {
    document.getElementById('sub-detail-modal').style.display = 'none';
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
// ⬇️ 樹狀種類篩選功能 (Tree Filter) ⬇️
// ============================================

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

// 4. 開啟篩選視窗 (生成樹狀圖)
function openFilterModal() {
    const modal = document.getElementById('filter-modal');
    const listDiv = document.getElementById('filter-options');
    listDiv.innerHTML = ""; // 清空

    // --- 建構樹狀資料結構 ---
    // 格式: { "日式": Set("拉麵", "壽司"), "美式": Set("漢堡") }
    const tree = {};

    foodData.forEach(item => {
        const mainType = item.type; // 主種類

        // ⚠️ 修正這裡：加上 || "" (如果 subType 是 undefined，就用空字串代替)
        const rawSubType = item.subType || "";
        
        // 分割細項 (例如 "拉麵, 沾麵" -> ["拉麵", "沾麵"])
        const subs = rawSubType.split(/;|；/).map(s => s.trim()).filter(s => s);

        if (!tree[mainType]) {
            tree[mainType] = new Set();
        }
        subs.forEach(sub => tree[mainType].add(sub));
    });

    // --- 生成 HTML ---
    Object.keys(tree).forEach(mainType => {
        // 1. 建立主分類 (Parent)
        // ⚠️ 修改重點：將 Checkbox 和 文字 分開
        // Checkbox: 負責勾選
        // span.parent-label-click: 負責展開收合 (onclick="toggleSubMenu(...)")
        
        const parentDiv = document.createElement('div');
        // 為了方便找兄弟元素，我們給 parentDiv 一個 class 標記
        parentDiv.className = 'filter-group-wrapper'; 
        
        parentDiv.innerHTML = `
            <div class="filter-parent-item">
                <input type="checkbox" class="parent-check" data-parent="${mainType}">
                
                <span class="parent-label-click" onclick="toggleSubMenu(this)">
                    ${mainType} 
                    <span class="arrow-icon">▼</span>
                </span>
            </div>
        `;
        listDiv.appendChild(parentDiv);

        // 2. 建立子分類容器 (Children)
        const subListDiv = document.createElement('div');
        subListDiv.className = 'filter-sub-list'; // CSS 預設 display: none
        
        // 3. 放入細項 Checkbox
        tree[mainType].forEach(subItem => {
            const isChecked = currentSubFilters.includes(subItem);
            
            const subDiv = document.createElement('div');
            subDiv.className = 'filter-sub-item';
            subDiv.innerHTML = `
                <label style="display:flex; align-items:center; width:100%; cursor:pointer;">
                    <input type="checkbox" class="child-check" value="${subItem}" data-parent="${mainType}" ${isChecked ? 'checked' : ''}>
                    ${subItem}
                </label>
            `;
            subListDiv.appendChild(subDiv);
        });
        
        listDiv.appendChild(subListDiv);
    });

    // --- 綁定連動事件 (全選邏輯) ---
    bindTreeCheckboxEvents();

    Object.keys(tree).forEach(mainType => {
        updateParentCheckboxState(mainType);
    });

    modal.style.display = 'flex';
}

// 切換細項清單的顯示/隱藏
function toggleSubMenu(element) {
    // element 是我們點擊的 <span class="parent-label-click">
    
    // 1. 找到這一列的外層容器 (.filter-parent-item)
    const parentItem = element.closest('.filter-parent-item');
    
    // 2. 找到這一列的「Wrapper」 (.filter-group-wrapper)
    const wrapper = element.closest('.filter-group-wrapper');
    
    // 3. 找到「下一個兄弟元素」，也就是 .filter-sub-list
    const subList = wrapper.nextElementSibling;

    if (subList && subList.classList.contains('filter-sub-list')) {
        // 切換 class 來顯示或隱藏
        subList.classList.toggle('open');
        
        // 切換 active class 讓箭頭旋轉
        parentItem.classList.toggle('active');
    }
}

// 2. Checkbox 連動邏輯
function bindTreeCheckboxEvents() {
    // A. 點擊主分類 (Parent) -> 全選/取消全選 子分類
    document.querySelectorAll('.parent-check').forEach(parentBox => {
        parentBox.addEventListener('change', function() {
            const parentName = this.dataset.parent;
            const children = document.querySelectorAll(`.child-check[data-parent="${parentName}"]`);
            
            // 父層變動時，強制讓子層跟隨 (同時清除未定狀態)
            children.forEach(child => {
                child.checked = this.checked;
            });
            this.indeterminate = false;
        });
    });

    // B. ⚠️ 修改這裡：點擊子分類 -> 檢查並更新父層狀態
    document.querySelectorAll('.child-check').forEach(childBox => {
        childBox.addEventListener('change', function() {
            const parentName = this.dataset.parent;
            updateParentCheckboxState(parentName); // 呼叫剛剛寫的函式
        });
    });
}

// 3. 確認篩選
function applyFilter() {
    const childBoxes = document.querySelectorAll('.child-check');
    currentSubFilters = [];

    // 收集所有被勾選的「細項」
    childBoxes.forEach(box => {
        if (box.checked) {
            currentSubFilters.push(box.value);
        }
    });

    // 如果一個都沒勾，或是全勾了 -> 視為顯示全部
    // (這裡邏輯看您需求，目前設定：沒勾=顯示全部)
    if (currentSubFilters.length === 0) {
        // 清空暫存，視為無過濾
        showToast("顯示所有種類");
    }

    executeFilterRender();
    document.getElementById('filter-modal').style.display = 'none';
}

// 4. 全選/全取消 切換功能 (不關閉視窗)
function toggleSelectAll() {
    const allChildBoxes = document.querySelectorAll('.child-check');
    const allParentBoxes = document.querySelectorAll('.parent-check');
    
    // 檢查目前是否全部都勾了
    const isAllChecked = Array.from(allChildBoxes).every(box => box.checked);
    const targetState = !isAllChecked;

    // 1. 更新所有子項目
    allChildBoxes.forEach(box => {
        box.checked = targetState;
    });

    // 2. 更新所有父項目
    allParentBoxes.forEach(box => {
        box.checked = targetState;
        box.indeterminate = false; // ⚠️ 強制取消半選狀態 (全選或全不選都很明確)
    });
}

// 5. 執行篩選 (核心比對邏輯)
function executeFilterRender() {
    let filteredData = foodData;

    if (currentSubFilters.length > 0) {
        filteredData = foodData.filter(item => {
            // 比對邏輯：該餐廳的「細項字串」中，是否包含「任何一個」使用者勾選的關鍵字
            // 例如：餐廳是「壽司, 海鮮」，使用者勾了「壽司」，這樣算符合。
            return currentSubFilters.some(filterTag => item.subType.includes(filterTag));
        });
    }

    renderTable(filteredData);
}

// 更新父層 Checkbox 的狀態 (全選 / 未選 / 半選)
function updateParentCheckboxState(parentName) {
    // 1. 找到該分類的父層 Checkbox
    const parentBox = document.querySelector(`.parent-check[data-parent="${parentName}"]`);
    if (!parentBox) return;

    // 2. 找到該分類下所有的子層 Checkbox
    const children = document.querySelectorAll(`.child-check[data-parent="${parentName}"]`);
    const totalCount = children.length;
    
    // 3. 計算被勾選的子層數量
    const checkedCount = Array.from(children).filter(c => c.checked).length;

    // 4. 設定狀態
    if (checkedCount === 0) {
        // A. 完全沒選
        parentBox.checked = false;
        parentBox.indeterminate = false;
    } else if (checkedCount === totalCount) {
        // B. 全選
        parentBox.checked = true;
        parentBox.indeterminate = false;
    } else {
        // C. 部分選擇 (半選樣式) 🔥
        parentBox.checked = false; // 這裡設 true 或 false 都可以，重點是下面那行
        parentBox.indeterminate = true; // 瀏覽器會自動顯示為 ➖
    }
}