let parsedConfig = JSON.parse(localStorage.getItem('trip_app_config')) || {};
let APP_CONFIG = {
    gasUrl: parsedConfig.gasUrl || "",
    tripTitle: parsedConfig.tripTitle || "",
    startDate: parsedConfig.startDate || "",
    defaultYear: parsedConfig.defaultYear || new Date().getFullYear(),
    month1: parsedConfig.month1 || new Date().getMonth() + 1,
    month2: parsedConfig.month2 || "",
    travelers: parsedConfig.travelers || [],
    stayCities: parsedConfig.stayCities || [],
    curr1Name: parsedConfig.curr1Name !== undefined ? parsedConfig.curr1Name : "EUR",
    curr1Rate: parsedConfig.curr1Rate !== undefined ? parsedConfig.curr1Rate : (parsedConfig.rateEur || 165),
    curr2Name: parsedConfig.curr2Name !== undefined ? parsedConfig.curr2Name : "MAD",
    curr2Rate: parsedConfig.curr2Rate !== undefined ? parsedConfig.curr2Rate : (parsedConfig.rateMad || 17.13),
    baseDays: parsedConfig.baseDays !== undefined ? parsedConfig.baseDays : 15,
    mySelf: parsedConfig.mySelf || ""
};

function switchTab(tabId, title) {
    const contents = document.querySelectorAll('.content-area');
    contents.forEach(content => content.classList.remove('active'));
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    document.getElementById('tab-' + tabId).classList.add('active');
    
    const activeNav = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    const headerTitle = APP_CONFIG.tripTitle ? APP_CONFIG.tripTitle + ' - ' + title : title;
    document.getElementById('app-header').innerText = headerTitle;
}

const membersContainer = document.getElementById('member-inputs-container');
const btnAddMember = document.getElementById('btn-add-member');

function updateMySelfOptions() {
    const mySelfSelect = document.getElementById('set-myself');
    if (!mySelfSelect) return;
    const currentVal = mySelfSelect.value || APP_CONFIG.mySelf;
    mySelfSelect.innerHTML = '<option value="">未設定</option>';
    const memberInputs = document.querySelectorAll('.member-input');
    memberInputs.forEach(input => {
        const val = input.value.trim();
        if (val !== "") {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            mySelfSelect.appendChild(opt);
        }
    });
    if (currentVal) mySelfSelect.value = currentVal;
}

function createMemberInput(value = "") {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '5px';
    row.style.marginBottom = '5px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'member-input';
    input.value = value;
    input.placeholder = '例：太郎';
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.boxSizing = 'border-box';
    input.addEventListener('input', updateMySelfOptions);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✖';
    removeBtn.style.padding = '8px 12px';
    removeBtn.style.backgroundColor = '#dc3545';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '5px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.addEventListener('click', () => { row.remove(); updateMySelfOptions(); });

    row.appendChild(input);
    row.appendChild(removeBtn);
    if (membersContainer) membersContainer.appendChild(row);
    updateMySelfOptions();
}
if (btnAddMember) btnAddMember.addEventListener('click', () => { createMemberInput(); });

const citiesContainer = document.getElementById('city-inputs-container');
const btnAddCity = document.getElementById('btn-add-city');

function createCityInput(value = "") {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '5px';
    row.style.marginBottom = '5px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'city-input';
    input.value = value;
    input.placeholder = '例：ミラノ';
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.boxSizing = 'border-box';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✖';
    removeBtn.style.padding = '8px 12px';
    removeBtn.style.backgroundColor = '#dc3545';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '5px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.addEventListener('click', () => { row.remove(); });

    row.appendChild(input);
    row.appendChild(removeBtn);
    if (citiesContainer) citiesContainer.appendChild(row);
}
if (btnAddCity) btnAddCity.addEventListener('click', () => { createCityInput(); });

function configureDateInputs() {
    const year = APP_CONFIG.defaultYear;
    const m1 = parseInt(APP_CONFIG.month1);
    const m2 = APP_CONFIG.month2 ? parseInt(APP_CONFIG.month2) : null;
    
    let minMonth = m1;
    let maxMonth = m1;
    if (m2) {
        minMonth = Math.min(m1, m2);
        maxMonth = Math.max(m1, m2);
    }

    const minDate = `${year}-${String(minMonth).padStart(2, '0')}-01`;
    const maxDays = new Date(year, maxMonth, 0).getDate();
    const maxDate = `${year}-${String(maxMonth).padStart(2, '0')}-${String(maxDays).padStart(2, '0')}`;

    const schedDateInput = document.getElementById('sched-date');
    const expDateInput = document.getElementById('exp-date');
    
    if (schedDateInput) {
        schedDateInput.min = minDate;
        schedDateInput.max = maxDate;
    }
    if (expDateInput) {
        expDateInput.min = minDate;
        expDateInput.max = maxDate;
    }
    
    const lastSchedDate = localStorage.getItem('lastSchedDate');
    if (lastSchedDate && schedDateInput) schedDateInput.value = lastSchedDate;
    else if (schedDateInput) schedDateInput.value = minDate;
    
    const lastExpDate = localStorage.getItem('lastExpDate');
    if (lastExpDate && expDateInput) expDateInput.value = lastExpDate;
    else if (expDateInput) expDateInput.value = minDate;
}

function updateCurrencyDropdowns() {
    const bgCur = document.getElementById('bg-currency');
    const expCur = document.getElementById('exp-currency');
    let html = '';
    
    if (APP_CONFIG.curr1Name) {
        html += '<option value="' + APP_CONFIG.curr1Name + '">' + APP_CONFIG.curr1Name + '</option>';
    }
    
    html += '<option value="円">日本円 (¥)</option>';
    
    if (APP_CONFIG.curr2Name) {
        html += '<option value="' + APP_CONFIG.curr2Name + '">' + APP_CONFIG.curr2Name + '</option>';
    }
    
    if (bgCur) bgCur.innerHTML = html;
    if (expCur) expCur.innerHTML = html;
}

const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tripTitle = document.getElementById('set-trip-title').value.trim();
        const url = document.getElementById('set-url').value;
        const startDate = document.getElementById('set-start-date').value;
        const year = document.getElementById('set-year').value;
        const m1 = document.getElementById('set-month1').value;
        const m2 = document.getElementById('set-month2').value;
        
        const curr1Name = document.getElementById('set-curr1-name').value.trim();
        const rateCurr1 = document.getElementById('set-rate-curr1').value;
        const curr2Name = document.getElementById('set-curr2-name').value.trim();
        const rateCurr2 = document.getElementById('set-rate-curr2').value;
        const baseDays = document.getElementById('set-days').value;
        
        const mySelf = document.getElementById('set-myself').value;
        
        const memberInputs = document.querySelectorAll('.member-input');
        const membersArray = [];
        memberInputs.forEach(input => {
            const val = input.value.trim();
            if (val !== "") membersArray.push(val);
        });

        const cityInputs = document.querySelectorAll('.city-input');
        const citiesArray = [];
        cityInputs.forEach(input => {
            const val = input.value.trim();
            if (val !== "") citiesArray.push(val);
        });

        if (membersArray.length === 0) {
            alert("最低1人はメンバーを登録してください．");
            return;
        }
        
        APP_CONFIG = {
            gasUrl: url,
            tripTitle: tripTitle,
            startDate: startDate,
            defaultYear: parseInt(year),
            month1: parseInt(m1),
            month2: m2 ? parseInt(m2) : "",
            travelers: membersArray,
            stayCities: citiesArray,
            curr1Name: curr1Name,
            curr1Rate: parseFloat(rateCurr1),
            curr2Name: curr2Name,
            curr2Rate: parseFloat(rateCurr2) || 0,
            baseDays: parseFloat(baseDays),
            mySelf: mySelf
        };
        
        localStorage.setItem('trip_app_config', JSON.stringify(APP_CONFIG));
        
        localStorage.removeItem('cache_schedule');
        localStorage.removeItem('cache_budget');
        localStorage.removeItem('cache_expense');
        
        alert('設定を保存しました！画面を更新します．');
        location.reload();
    });
}

const btnShareSettings = document.getElementById('btn-share-settings');
if (btnShareSettings) {
    btnShareSettings.addEventListener('click', () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('setup_title', APP_CONFIG.tripTitle);
        shareUrl.searchParams.set('setup_gas', APP_CONFIG.gasUrl);
        shareUrl.searchParams.set('s_sd_date', APP_CONFIG.startDate);
        shareUrl.searchParams.set('setup_year', APP_CONFIG.defaultYear);
        shareUrl.searchParams.set('setup_m1', APP_CONFIG.month1);
        if (APP_CONFIG.month2) shareUrl.searchParams.set('setup_m2', APP_CONFIG.month2);
        shareUrl.searchParams.set('setup_members', APP_CONFIG.travelers.join(','));
        shareUrl.searchParams.set('setup_cities', APP_CONFIG.stayCities.join(','));
        
        shareUrl.searchParams.set('s_c1n', APP_CONFIG.curr1Name);
        shareUrl.searchParams.set('s_c1r', APP_CONFIG.curr1Rate);
        shareUrl.searchParams.set('s_c2n', APP_CONFIG.curr2Name);
        shareUrl.searchParams.set('s_c2r', APP_CONFIG.curr2Rate);
        shareUrl.searchParams.set('s_d', APP_CONFIG.baseDays);
        
        navigator.clipboard.writeText(shareUrl.toString()).then(() => {
            alert('共有用URLをコピーしました！LINE等でメンバーに送ってください．');
        }).catch(err => {
            alert('コピーに失敗しました．手動でURLをコピーしてください．\n' + shareUrl.toString());
        });
    });
}

// --- オフライン自動同期システム ---
window.syncQueue = JSON.parse(localStorage.getItem('offline_sync_queue')) || [];

window.updateSyncBadge = function() {
    const badge = document.getElementById('sync-badge');
    if (badge) {
        if (window.syncQueue.length > 0) {
            badge.style.display = 'inline-block';
            badge.style.backgroundColor = '#ffc107';
            badge.style.color = '#000';
            badge.innerText = `未送信: ${window.syncQueue.length}件`;
        } else {
            badge.style.display = 'none';
        }
    }
};

window.enqueueSync = function(payload) {
    window.syncQueue.push(payload);
    localStorage.setItem('offline_sync_queue', JSON.stringify(window.syncQueue));
    window.updateSyncBadge();
};

window.processSyncQueue = async function() {
    if (!navigator.onLine || window.syncQueue.length === 0) return;
    
    const badge = document.getElementById('sync-badge');
    if (badge) {
        badge.style.display = 'inline-block';
        badge.style.backgroundColor = '#17a2b8';
        badge.style.color = '#fff';
        badge.innerText = '同期中...';
    }

    const queueCopy = [...window.syncQueue];
    window.syncQueue = []; 
    localStorage.setItem('offline_sync_queue', JSON.stringify(window.syncQueue));

    let hasError = false;

    for (const payload of queueCopy) {
        try {
            await fetch(APP_CONFIG.gasUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch (e) {
            window.syncQueue.push(payload);
            hasError = true;
        }
    }
    
    localStorage.setItem('offline_sync_queue', JSON.stringify(window.syncQueue));
    window.updateSyncBadge();
    
    if (!hasError && badge) {
        badge.style.backgroundColor = '#28a745';
        badge.innerText = '同期完了!';
        setTimeout(() => window.updateSyncBadge(), 2500);
    }
};

window.safeFetch = function(payload) {
    if (!APP_CONFIG.gasUrl) return;
    
    if (navigator.onLine) {
        fetch(APP_CONFIG.gasUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).catch(() => {
            window.enqueueSync(payload);
        });
    } else {
        window.enqueueSync(payload);
    }
};

window.addEventListener('online', () => {
    window.processSyncQueue();
});
// ----------------------------------

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('setup_gas') && params.has('setup_year') && params.has('setup_m1') && params.has('setup_members')) {
        APP_CONFIG = {
            gasUrl: params.get('setup_gas'),
            tripTitle: params.has('setup_title') ? params.get('setup_title') : "",
            startDate: params.has('s_sd_date') ? params.get('s_sd_date') : "",
            defaultYear: parseInt(params.get('setup_year')),
            month1: parseInt(params.get('setup_m1')),
            month2: params.get('setup_m2') ? parseInt(params.get('setup_m2')) : "",
            travelers: params.get('setup_members').split(','),
            stayCities: params.has('setup_cities') ? params.get('setup_cities').split(',') : [],
            curr1Name: params.has('s_c1n') ? params.get('s_c1n') : "EUR",
            curr1Rate: params.has('s_c1r') ? parseFloat(params.get('s_c1r')) : 165,
            curr2Name: params.has('s_c2n') ? params.get('s_c2n') : "MAD",
            curr2Rate: params.has('s_c2r') ? parseFloat(params.get('s_c2r')) : 15,
            baseDays: params.has('s_d') ? parseFloat(params.get('s_d')) : 15,
            mySelf: APP_CONFIG.mySelf 
        };
        localStorage.setItem('trip_app_config', JSON.stringify(APP_CONFIG));
        
        localStorage.removeItem('cache_schedule');
        localStorage.removeItem('cache_budget');
        localStorage.removeItem('cache_expense');
        
        window.history.replaceState(null, '', window.location.pathname);
        alert('共有された設定を読み込みました！');
        location.reload();
        return;
    }

    const yearSelect = document.getElementById('set-year');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 1; y <= currentYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + "年";
            yearSelect.appendChild(opt);
        }
    }
    
    const m1Select = document.getElementById('set-month1');
    const m2Select = document.getElementById('set-month2');
    if (m1Select && m2Select) {
        for (let m = 1; m <= 12; m++) {
            const opt1 = document.createElement('option');
            opt1.value = m;
            opt1.textContent = m + "月";
            m1Select.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = m;
            opt2.textContent = m + "月";
            m2Select.appendChild(opt2);
        }
    }

    const setTripTitleEl = document.getElementById('set-trip-title');
    if (setTripTitleEl) setTripTitleEl.value = APP_CONFIG.tripTitle || "";
    
    const setUrlEl = document.getElementById('set-url');
    if (setUrlEl) setUrlEl.value = APP_CONFIG.gasUrl || "";
    
    const setStartDateEl = document.getElementById('set-start-date');
    if (setStartDateEl) setStartDateEl.value = APP_CONFIG.startDate || "";

    if (yearSelect) yearSelect.value = APP_CONFIG.defaultYear;
    if (m1Select) m1Select.value = APP_CONFIG.month1 || 1;
    if (m2Select) m2Select.value = APP_CONFIG.month2 || "";
    
    const curr1NameEl = document.getElementById('set-curr1-name');
    if (curr1NameEl) curr1NameEl.value = APP_CONFIG.curr1Name || "";
    
    const rateCurr1El = document.getElementById('set-rate-curr1');
    if (rateCurr1El) rateCurr1El.value = APP_CONFIG.curr1Rate || "";
    
    const curr2NameEl = document.getElementById('set-curr2-name');
    if (curr2NameEl) curr2NameEl.value = APP_CONFIG.curr2Name || "";
    
    const rateCurr2El = document.getElementById('set-rate-curr2');
    if (rateCurr2El) rateCurr2El.value = APP_CONFIG.curr2Rate || "";
    
    const setDaysEl = document.getElementById('set-days');
    if (setDaysEl) setDaysEl.value = APP_CONFIG.baseDays || 15;
    
    if (membersContainer) {
        membersContainer.innerHTML = '';
        if (APP_CONFIG.travelers && APP_CONFIG.travelers.length > 0) {
            APP_CONFIG.travelers.forEach(name => createMemberInput(name));
        } else {
            createMemberInput(); 
        }
    }
    
    updateMySelfOptions();

    if (citiesContainer) {
        citiesContainer.innerHTML = '';
        if (APP_CONFIG.stayCities && APP_CONFIG.stayCities.length > 0) {
            APP_CONFIG.stayCities.forEach(city => createCityInput(city));
        } else {
            createCityInput(); 
        }
    }
    
    configureDateInputs();
    updateCurrencyDropdowns();

    if (APP_CONFIG.gasUrl) {
        const shareSection = document.getElementById('share-section');
        if (shareSection) shareSection.style.display = 'block';
        
        if (typeof loadSchedule === 'function') loadSchedule();
        if (typeof loadBudget === 'function') loadBudget();
        if (typeof loadExpenses === 'function') loadExpenses();
        
        const headerTitle = APP_CONFIG.tripTitle ? APP_CONFIG.tripTitle + ' - 旅程' : '旅程';
        document.getElementById('app-header').innerText = headerTitle;
    } else {
        switchTab('settings', '設定');
    }

    window.updateSyncBadge();
    if (navigator.onLine) {
        setTimeout(window.processSyncQueue, 1500);
    }
});