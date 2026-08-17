const customStyle = document.createElement('style');
customStyle.innerHTML = `
    .schedule-columns-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    .schedule-column {
        flex: 1;
        min-width: 0;
    }
    @media (min-width: 768px) {
        body { max-width: 1600px !important; }
        
        .two-column-layout {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        .form-column {
            flex: 0 0 320px !important;
            max-width: 320px !important;
        }
        .list-column {
            flex: 1 !important;
            min-width: 0 !important;
        }

        .schedule-columns-container {
            flex-direction: row;
            align-items: flex-start;
        }
    }
`;
document.head.appendChild(customStyle);

let scheduleData = [];

const TEMPLATES = {
    "観光": `
        <div style="margin-bottom: 10px;">
            <label style="display: block; font-size: 0.9em; margin-bottom: 3px;">時間</label>
            <div style="display: flex; gap: 10px;">
                <select id="dyn-time-type" style="padding: 8px; box-sizing: border-box;">
                    <option value="none">指定なし</option>
                    <option value="exact">時刻指定</option>
                    <option value="終日">終日</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
                <input type="time" id="dyn-time" style="flex: 1; padding: 8px; box-sizing: border-box; display: none;">
            </div>
        </div>
        <div style="margin-bottom: 10px;">
            <label style="display: block; font-size: 0.9em; margin-bottom: 3px;">観光する都市</label>
            <select id="dyn-tour-city" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </select>
        </div>
        <div id="dyn-daytrip-area" style="display: none; margin-bottom: 10px;">
            <label style="display: block; font-size: 0.9em; margin-bottom: 3px;">日帰り先の都市名</label>
            <input type="text" id="dyn-daytrip-city" placeholder="例：ヴェネツィア" style="width: 100%; padding: 8px; box-sizing: border-box;">
        </div>
    `,
    "交通": `
        <div style="margin-bottom: 10px; display: flex; gap: 10px;">
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.8em; margin-bottom: 3px;">出発時間 (任意)</label>
                <input type="time" id="dyn-dep-time" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.8em; margin-bottom: 3px;">出発地 (任意)</label>
                <input type="text" id="dyn-dep-loc" placeholder="例：ミラノ" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
        </div>
        <div style="margin-bottom: 10px; display: flex; gap: 10px;">
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.8em; margin-bottom: 3px;">到着時間 (任意)</label>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="time" id="dyn-arr-time" style="width: 100%; padding: 8px; box-sizing: border-box;">
                    <label style="font-size: 0.8em; white-space: nowrap; cursor: pointer;">
                        <input type="checkbox" id="dyn-arr-nextday">翌日
                    </label>
                </div>
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.8em; margin-bottom: 3px;">到着地 (任意)</label>
                <input type="text" id="dyn-arr-loc" placeholder="例：パレルモ" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
        </div>
        <div>
            <label style="display: block; font-size: 0.9em; margin-bottom: 3px;">移動手段</label>
            <div style="display: flex; gap: 10px;">
                <select id="dyn-method" style="flex: 1; padding: 8px; box-sizing: border-box;">
                    <option value="飛行機">✈️ 飛行機</option>
                    <option value="鉄道">🚆 鉄道</option>
                    <option value="バス">🚌 バス</option>
                    <option value="レンタカー">🚗 レンタカー</option>
                    <option value="フェリー">⛴️ フェリー</option>
                    <option value="徒歩">🚶 徒歩</option>
                    <option value="その他">その他</option>
                </select>
                <input type="text" id="dyn-method-detail" placeholder="便名や会社名(任意)" style="flex: 1; padding: 8px; box-sizing: border-box;">
            </div>
        </div>
    `,
    "宿泊": `
        <div>
            <label style="display: block; font-size: 0.9em; margin-bottom: 3px;">宿泊都市</label>
            <select id="dyn-hotel" style="width: 100%; padding: 8px; box-sizing: border-box;"></select>
        </div>
    `
};

function updateDynamicForm() {
    const category = document.getElementById('sched-category').value;
    const dynamicArea = document.getElementById('sched-dynamic-area');
    dynamicArea.innerHTML = TEMPLATES[category];

    if (category === "観光") {
        const typeSelect = document.getElementById('dyn-time-type');
        const timeInput = document.getElementById('dyn-time');
        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'exact') {
                timeInput.style.display = 'block';
            } else {
                timeInput.style.display = 'none';
            }
        });

        const citySelect = document.getElementById('dyn-tour-city');
        if (APP_CONFIG.stayCities && APP_CONFIG.stayCities.length > 0) {
            APP_CONFIG.stayCities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
        }
        const dayTripOpt = document.createElement('option');
        dayTripOpt.value = "日帰り";
        dayTripOpt.textContent = "日帰り旅行";
        citySelect.appendChild(dayTripOpt);

        const dayTripArea = document.getElementById('dyn-daytrip-area');
        citySelect.addEventListener('change', (e) => {
            if (e.target.value === '日帰り') {
                dayTripArea.style.display = 'block';
            } else {
                dayTripArea.style.display = 'none';
            }
        });

    } else if (category === "宿泊") {
        const hotelSelect = document.getElementById('dyn-hotel');
        if (APP_CONFIG.stayCities && APP_CONFIG.stayCities.length > 0) {
            APP_CONFIG.stayCities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                hotelSelect.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = "未設定";
            opt.textContent = "設定タブで滞在都市を追加してください";
            hotelSelect.appendChild(opt);
        }
    }
}

function shiftDate(days) {
    const dateInput = document.getElementById('sched-date');
    if (!dateInput.value) return;
    const parts = dateInput.value.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${day}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('sched-category');
    if(categorySelect) {
        categorySelect.addEventListener('change', updateDynamicForm);
        updateDynamicForm();
    }

    const btnPrevDay = document.getElementById('btn-prev-day');
    if (btnPrevDay) btnPrevDay.addEventListener('click', () => shiftDate(-1));
    const btnNextDay = document.getElementById('btn-next-day');
    if (btnNextDay) btnNextDay.addEventListener('click', () => shiftDate(1));

    const toggleBtn = document.getElementById('toggle-sched-form');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('sched-form-wrapper');
            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block';
                toggleBtn.innerText = '－ 入力フォームを閉じる';
            } else {
                wrapper.style.display = 'none';
                toggleBtn.innerText = '＋ 新しい予定を追加';
                
                document.getElementById('edit-schedule-id').value = '';
                document.getElementById('btn-submit-sched').innerText = '予定を追加';
                document.getElementById('schedule-form').reset();
                updateDynamicForm();
            }
        });
    }
});

async function loadSchedule() {
    if (!APP_CONFIG.gasUrl) return;
    const listDiv = document.getElementById('schedule-list');

    // キャッシュを読み込んで瞬時に描画
    const cached = localStorage.getItem('cache_schedule');
    if (cached) {
        scheduleData = JSON.parse(cached);
        renderScheduleList();
    } else {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">読み込み中...</p>';
    }

    // 裏側で最新データを取得
    try {
        const response = await fetch(APP_CONFIG.gasUrl + "?sheet=旅程");
        const data = await response.json();

        if (data.error) {
            if (!cached) listDiv.innerHTML = `<p style="color: red;">エラー: ${data.error}</p>`;
            return;
        }

        scheduleData = data;
        localStorage.setItem('cache_schedule', JSON.stringify(data));
        renderScheduleList(); 
    } catch (error) {
        if (!cached) listDiv.innerHTML = `<p style="color: red;">通信エラーが発生しました．</p>`;
    }
}

function renderScheduleList() {
    const listDiv = document.getElementById('schedule-list');

    if (scheduleData.length === 0) {
        listDiv.innerHTML = '<p>予定はまだ登録されていません．</p>';
        return;
    }

    let displayItems = [];

    scheduleData.forEach(row => {
        let normalizedDateStr = row['日付'];
        const baseDate = new Date(row['日付']);
        if (!isNaN(baseDate.getTime())) {
            normalizedDateStr = `${baseDate.getFullYear()}/${String(baseDate.getMonth() + 1).padStart(2, '0')}/${String(baseDate.getDate()).padStart(2, '0')}`;
        }

        const timeStr = row['時間'] || '';
        const category = row['カテゴリ'];
        
        if (category === '交通' && timeStr.includes('- 翌')) {
            const times = timeStr.split(' - 翌');
            const depTime = times[0].trim(); 
            const arrTime = times[1].trim(); 
            const fullTime = `${depTime} - 翌${arrTime}`;
            
            displayItems.push({
                ...row,
                '表示用日付': normalizedDateStr, 
                '表示用時間': fullTime,
                '表示タイプ': 'departure_only',
                '時間ソート用': depTime
            });
            
            if(!isNaN(baseDate.getTime())) {
                const nextDate = new Date(baseDate.getTime());
                nextDate.setDate(nextDate.getDate() + 1);
                const nextDateStr = `${nextDate.getFullYear()}/${String(nextDate.getMonth() + 1).padStart(2, '0')}/${String(nextDate.getDate()).padStart(2, '0')}`;
                
                displayItems.push({
                    ...row,
                    '表示用日付': nextDateStr,
                    '表示用時間': fullTime,
                    '表示タイプ': 'arrival_only',
                    '時間ソート用': '00:00'
                });
            }
        } else {
            let sortTime = '23:58';
            if (!timeStr || timeStr === '未定' || timeStr === '指定なし') sortTime = '23:58';
            else if (timeStr.includes('終日')) sortTime = '08:00';
            else if (timeStr.includes('AM')) sortTime = '10:00';
            else if (timeStr.includes('PM')) sortTime = '14:00';
            else if (timeStr.includes('宿泊')) sortTime = '23:59';
            else {
                const m = timeStr.match(/\d{2}:\d{2}/);
                if (m) sortTime = m[0];
            }

            displayItems.push({
                ...row,
                '表示用日付': normalizedDateStr,
                '表示用時間': timeStr,
                '表示タイプ': 'normal',
                '時間ソート用': sortTime
            });
        }
    });

    displayItems.sort((a, b) => {
        let dateA = new Date(`${a['表示用日付']} ${a['時間ソート用']}`).getTime();
        if (isNaN(dateA)) dateA = 0;
        let dateB = new Date(`${b['表示用日付']} ${b['時間ソート用']}`).getTime();
        if (isNaN(dateB)) dateB = 0;
        return dateA - dateB;
    });

    const CITY_COLORS = [
        '#fff9e6', '#e1f5fe', '#e8f5e9', '#ffebee', '#f3e5f5', 
        '#fff3e0', '#e0f7fa', '#fbe9e7', '#f0f4c3', '#ede7f6'
    ];
    
    const cityColorMap = {};
    if (APP_CONFIG.stayCities) {
        APP_CONFIG.stayCities.forEach((city, index) => {
            cityColorMap[city] = CITY_COLORS[index % CITY_COLORS.length];
        });
    }

    let currentBaseCity = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateBlocks = [];
    let currentBlock = null;

    displayItems.forEach(row => {
        let dateStr = '';
        let rowDate = new Date();
        
        if (row['表示用日付']) {
            const d = new Date(row['表示用日付']);
            if (!isNaN(d.getTime())) {
                dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                rowDate = d;
            } else {
                dateStr = row['表示用日付'];
            }
        }
        
        if (!currentBlock || currentBlock.dateStr !== dateStr) {
            rowDate.setHours(0, 0, 0, 0);
            currentBlock = {
                dateStr: dateStr,
                isOpen: rowDate >= today ? 'open' : '',
                itemsHtml: ''
            };
            dateBlocks.push(currentBlock);
        }

        const category = row['カテゴリ'];
        let icon = "📍";
        let mainContent = row['場所・内容'] || '';
        let timeDisplay = row['表示用時間'] || '';
        
        let bgColor = '#ffffff';

        if (category === "宿泊") {
            currentBaseCity = row['場所・内容'].replace(/泊$/, '').trim();
            bgColor = '#ffffff'; 
        } else if (category === "交通") {
            const arrLoc = row['到着地'];
            if (arrLoc && cityColorMap[arrLoc.trim()]) {
                currentBaseCity = arrLoc.trim();
            }
            bgColor = '#e9ecef'; 
        } else if (category === "観光") {
            const baseCity = row['出発地']; 
            if (baseCity && baseCity !== "日帰り" && baseCity !== "") {
                currentBaseCity = baseCity;
            }
            bgColor = cityColorMap[currentBaseCity] || '#fff9e6'; 
        }
        
        let wrapperStyle = `background-color: ${bgColor}; border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px; margin: 4px 0; display: flex; gap: 6px; position: relative;`;

        if (category === "交通") {
            const methodStr = row['移動手段'] || 'その他';
            if (methodStr.includes('飛行機')) icon = '✈️';
            else if (methodStr.includes('鉄道')) icon = '🚆';
            else if (methodStr.includes('バス')) icon = '🚌';
            else if (methodStr.includes('レンタカー')) icon = '🚗';
            else if (methodStr.includes('フェリー')) icon = '⛴️';
            else if (methodStr.includes('徒歩')) icon = '🚶';
            else icon = '🧳';
            
            let displayMethod = methodStr;
            const match = methodStr.match(/\((.*?)\)/);
            if (match) {
                displayMethod = match[1];
            }

            const depLoc = row['出発地'] || '';
            const arrLoc = row['到着地'] || '';

            if (row['表示タイプ'] === 'departure_only') {
                mainContent = `${depLoc}発 <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                wrapperStyle = `background-color: ${bgColor}; border: 2px solid #ccc; border-bottom: 2px dashed #ccc; border-radius: 8px 8px 0 0; padding: 6px; margin-top: 4px; display: flex; gap: 6px; position: relative;`;
            } else if (row['表示タイプ'] === 'arrival_only') {
                mainContent = `➔ ${arrLoc}着 <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                wrapperStyle = `background-color: ${bgColor}; border: 2px solid #ccc; border-top: none; border-radius: 0 0 8px 8px; padding: 6px; margin-bottom: 4px; display: flex; gap: 6px; position: relative;`;
            } else {
                if (depLoc && arrLoc) {
                    mainContent = `${depLoc} ➔ ${arrLoc} <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                } else if (depLoc) {
                    mainContent = `${depLoc}発 <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                } else if (arrLoc) {
                    mainContent = `${arrLoc}着 <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                } else {
                    mainContent = `移動 <span style="font-size: 0.8em; color: #0056b3; margin-left: 4px; font-weight: normal;">[${displayMethod}]</span>`;
                }
            }
        } else if (category === "宿泊") {
            icon = "🏨";
        } else if (category === "観光") {
            icon = "🚩";
        }

        const urlRaw = row['参考URL'];
        const urlName = row['URL名'] && row['URL名'].trim() !== '' ? row['URL名'] : 'リンク';
        const urlHtml = urlRaw ? `<a href="${urlRaw}" target="_blank" style="color: #0056b3; font-size: 0.75em; display: block; margin-top: 2px;">🔗 ${urlName}</a>` : '';
        
        let editBtnHtml = `<button onclick="editSchedule('${row['ID']}')" style="position: absolute; right: 30px; top: 6px; background: none; border: none; color: #0056b3; cursor: pointer; font-size: 1.0em; padding: 2px;" title="この予定を編集">✏️</button>`;
        let deleteBtnHtml = `<button onclick="deleteSchedule('${row['ID']}')" style="position: absolute; right: 4px; top: 6px; background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.0em; padding: 2px;" title="この予定を削除">🗑️</button>`;

        currentBlock.itemsHtml += `
            <div style="${wrapperStyle}">
                <div style="font-size: 1.1em; line-height: 1.2; padding-top: 2px;">${icon}</div>
                <div style="flex: 1; padding-right: 50px;">
                    <div style="font-size: 0.7em; color: #666; font-weight: bold;">${timeDisplay}</div>
                    <div style="font-weight: bold; font-size: 0.85em; margin: 2px 0;">${mainContent}</div>
                    ${row['メモ'] ? `<div style="font-size: 0.75em; color: #555;">📝 ${row['メモ']}</div>` : ''}
                    ${urlHtml}
                </div>
                ${editBtnHtml}
                ${deleteBtnHtml}
            </div>
        `;
    });

    function renderBlocksHtml(blocks) {
        return blocks.map(b => `
            <details ${b.isOpen} style="margin-bottom: 8px;">
                <summary style="background-color: #0056b3; color: white; padding: 4px 8px; font-weight: bold; font-size: 0.85em; cursor: pointer; border-radius: 4px; outline: none; list-style-position: inside;">
                    ${b.dateStr}
                </summary>
                <div style="padding: 2px 0;">
                    ${b.itemsHtml}
                </div>
            </details>
        `).join('');
    }

    let columnsHtml = '';
    for (let i = 0; i < dateBlocks.length; i += 6) {
        const chunk = dateBlocks.slice(i, i + 6);
        columnsHtml += `<div class="schedule-column">${renderBlocksHtml(chunk)}</div>`;
    }

    let finalHtml = '<div class="schedule-columns-container">' + columnsHtml + '</div>';
    listDiv.innerHTML = finalHtml;
}

window.editSchedule = function(id) {
    const target = scheduleData.find(item => item['ID'] === id);
    if (!target) return;

    document.getElementById('edit-schedule-id').value = id;
    document.getElementById('btn-submit-sched').innerText = "予定を更新";

    let dateStr = target['日付'];
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        document.getElementById('sched-date').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    document.getElementById('sched-category').value = target['カテゴリ'];
    updateDynamicForm();

    document.getElementById('sched-url').value = target['参考URL'] || '';
    document.getElementById('sched-url-name').value = target['URL名'] || '';
    document.getElementById('sched-memo').value = target['メモ'] || '';

    const timeStr = target['時間'] || '';
    const content = target['場所・内容'] || '';
    const depLoc = target['出発地'] || '';
    const arrLoc = target['到着地'] || '';
    const methodStr = target['移動手段'] || '';

    if (target['カテゴリ'] === '観光') {
        if (timeStr === 'AM' || timeStr === 'PM' || timeStr === '終日') {
            document.getElementById('dyn-time-type').value = timeStr;
            document.getElementById('dyn-time').style.display = 'none';
        } else if (timeStr && timeStr !== '未定' && timeStr !== '指定なし') {
            document.getElementById('dyn-time-type').value = 'exact';
            document.getElementById('dyn-time').style.display = 'block';
            document.getElementById('dyn-time').value = timeStr;
        } else {
            document.getElementById('dyn-time-type').value = 'none';
            document.getElementById('dyn-time').style.display = 'none';
        }

        if (depLoc === '日帰り') {
            document.getElementById('dyn-tour-city').value = '日帰り';
            document.getElementById('dyn-daytrip-area').style.display = 'block';
            document.getElementById('dyn-daytrip-city').value = content;
        } else {
            document.getElementById('dyn-tour-city').value = depLoc || content;
            document.getElementById('dyn-daytrip-area').style.display = 'none';
        }
    } else if (target['カテゴリ'] === '交通') {
        const times = timeStr.split(' - ');
        let depTime = times[0] === '未定' ? '' : times[0];
        let arrTimeRaw = times[1] ? times[1] : '';
        
        let isNextDay = false;
        let arrTime = arrTimeRaw;
        if (arrTimeRaw.startsWith('翌')) {
            isNextDay = true;
            arrTime = arrTimeRaw.replace('翌', '');
        } else if (arrTimeRaw === '未定') {
            arrTime = '';
        }

        document.getElementById('dyn-dep-time').value = depTime || '';
        document.getElementById('dyn-arr-time').value = arrTime || '';
        const chkNextDay = document.getElementById('dyn-arr-nextday');
        if (chkNextDay) chkNextDay.checked = isNextDay;
        
        document.getElementById('dyn-dep-loc').value = depLoc;
        document.getElementById('dyn-arr-loc').value = arrLoc;

        let baseMethod = methodStr;
        let detailMethod = '';
        const match = methodStr.match(/\((.*?)\)/);
        if (match) {
            detailMethod = match[1];
            baseMethod = methodStr.replace(` (${detailMethod})`, '').replace(`(${detailMethod})`, '').trim();
        }
        
        const methodSelect = document.getElementById('dyn-method');
        let hasOption = Array.from(methodSelect.options).some(opt => opt.value === baseMethod);
        methodSelect.value = hasOption ? baseMethod : 'その他';
        document.getElementById('dyn-method-detail').value = detailMethod;

    } else if (target['カテゴリ'] === '宿泊') {
        const city = content.replace(/泊$/, '');
        document.getElementById('dyn-hotel').value = city;
    }

    if (window.innerWidth <= 767) {
        document.getElementById('sched-form-wrapper').style.display = 'block';
        const tBtn = document.getElementById('toggle-sched-form');
        if (tBtn) tBtn.innerText = '－ 入力フォームを閉じる';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function deleteSchedule(id) {
    if (!confirm('この予定を削除してもよろしいですか？\n（日跨ぎの予定の場合、出発・到着の両方が連動して削除されます）')) return;
    
    scheduleData = scheduleData.filter(item => item['ID'] !== id);
    localStorage.setItem('cache_schedule', JSON.stringify(scheduleData));
    renderScheduleList();

    if (!APP_CONFIG.gasUrl) return;
    fetch(APP_CONFIG.gasUrl, {
        method: 'POST',
        body: JSON.stringify({
            sheet: '旅程',
            action: 'delete',
            id: id
        })
    }).catch(error => {
        alert('通信エラーが発生しました．データを再読み込みします．');
        loadSchedule(); 
    });
}

const schedForm = document.getElementById('schedule-form');
if (schedForm) {
    schedForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        if (!APP_CONFIG.gasUrl) {
            alert("設定タブからURLを登録してください．");
            return;
        }

        const btn = document.getElementById('btn-submit-sched');
        btn.disabled = true;

        const category = document.getElementById('sched-category').value;
        let finalTime = '';
        let finalContent = '';
        let depLoc = '';
        let arrLoc = '';
        let method = '';

        if (category === "観光") {
            const timeType = document.getElementById('dyn-time-type').value;
            if (timeType === 'exact') {
                finalTime = document.getElementById('dyn-time').value || '';
            } else if (timeType === 'AM' || timeType === 'PM' || timeType === '終日') {
                finalTime = timeType;
            } else {
                finalTime = ''; 
            }
            
            const tourCity = document.getElementById('dyn-tour-city').value;
            if (tourCity === '日帰り') {
                depLoc = '日帰り'; 
                finalContent = document.getElementById('dyn-daytrip-city').value;
                if(!finalContent) {
                    alert("日帰り先の都市名を入力してください．");
                    btn.disabled = false;
                    return;
                }
            } else {
                depLoc = tourCity; 
                finalContent = tourCity;
            }
        } 
        else if (category === "交通") {
            const depTime = document.getElementById('dyn-dep-time').value || '未定';
            const arrTimeBase = document.getElementById('dyn-arr-time').value || '未定';
            const chkNextDay = document.getElementById('dyn-arr-nextday');
            const isNextDay = chkNextDay ? chkNextDay.checked : false;

            let arrTime = arrTimeBase;
            if (isNextDay && arrTimeBase !== '未定') {
                arrTime = `翌${arrTimeBase}`;
            }

            if (depTime === '未定' && arrTime === '未定') {
                finalTime = '';
            } else {
                finalTime = `${depTime} - ${arrTime}`;
            }
            
            depLoc = document.getElementById('dyn-dep-loc').value || '';
            arrLoc = document.getElementById('dyn-arr-loc').value || '';
            
            const baseMethod = document.getElementById('dyn-method').value;
            const detailMethod = document.getElementById('dyn-method-detail').value.trim();
            method = detailMethod ? `${baseMethod} (${detailMethod})` : baseMethod;
        } 
        else if (category === "宿泊") {
            finalTime = '宿泊'; 
            const city = document.getElementById('dyn-hotel').value;
            finalContent = city.endsWith('泊') ? city : city + '泊';
        }

        const inputDate = document.getElementById('sched-date').value;
        localStorage.setItem('lastSchedDate', inputDate); 

        const editId = document.getElementById('edit-schedule-id').value;
        const newId = editId ? editId : 'sched_' + new Date().getTime();
        const inputUrl = document.getElementById('sched-url').value;
        const inputMemo = document.getElementById('sched-memo').value;
        const inputUrlName = document.getElementById('sched-url-name').value;
        
        const newItem = {
            'ID': newId,
            '日付': inputDate,
            'カテゴリ': category,
            '時間': finalTime,
            '場所・内容': finalContent,
            '出発地': depLoc,
            '到着地': arrLoc,
            '移動手段': method,
            '参考URL': inputUrl,
            'メモ': inputMemo,
            'URL名': inputUrlName
        };
        
        if (editId) {
            const index = scheduleData.findIndex(item => item['ID'] === editId);
            if (index !== -1) scheduleData[index] = newItem;
        } else {
            scheduleData.push(newItem);
        }
        
        localStorage.setItem('cache_schedule', JSON.stringify(scheduleData));
        renderScheduleList();

        document.getElementById('schedule-form').reset();
        document.getElementById('edit-schedule-id').value = '';
        document.getElementById('btn-submit-sched').innerText = '予定を追加';
        updateDynamicForm();
        document.getElementById('sched-date').value = localStorage.getItem('lastSchedDate');
        
        if (window.innerWidth <= 767) {
            document.getElementById('sched-form-wrapper').style.display = 'none';
            const tBtn = document.getElementById('toggle-sched-form');
            if (tBtn) tBtn.innerText = '＋ 新しい予定を追加';
        }
        btn.disabled = false;

        const rowData = [
            newId,
            inputDate,
            category,
            finalTime,
            finalContent,
            depLoc,
            arrLoc,
            method,
            inputUrl,
            inputMemo,
            inputUrlName
        ];

        const action = editId ? 'update' : 'insert';

        fetch(APP_CONFIG.gasUrl, {
            method: 'POST',
            body: JSON.stringify({
                sheet: '旅程',
                action: action,
                data: rowData
            })
        }).catch(error => {
            alert('通信エラーが発生しました．データを再読み込みします．');
            loadSchedule(); 
        });
    });
}