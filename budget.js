const budgetStyle = document.createElement('style');
budgetStyle.innerHTML = `
    @media (min-width: 768px) {
        .form-column {
            flex: 0 0 380px !important;
            max-width: 380px !important;
        }
    }
`;
document.head.appendChild(budgetStyle);

let budgetData = [];

document.addEventListener('DOMContentLoaded', () => {
    const bgTargetDaysInput = document.getElementById('bg-target-days');
    const bgType = document.getElementById('bg-type');
    const bgDaysArea = document.getElementById('bg-days-area');
    
    if (bgType && bgDaysArea && bgTargetDaysInput) {
        bgType.addEventListener('change', (e) => {
            if (e.target.value === '日額') {
                bgDaysArea.style.display = 'block';
                bgTargetDaysInput.value = APP_CONFIG.baseDays || 15;
            } else {
                bgDaysArea.style.display = 'none';
            }
        });
    }

    const btnMinusDay = document.getElementById('btn-minus-bg-day');
    const btnPlusDay = document.getElementById('btn-plus-bg-day');
    if (btnMinusDay) {
        btnMinusDay.addEventListener('click', () => {
            let val = parseFloat(bgTargetDaysInput.value) || 0;
            if (val > 1) bgTargetDaysInput.value = val - 1;
        });
    }
    if (btnPlusDay) {
        btnPlusDay.addEventListener('click', () => {
            let val = parseFloat(bgTargetDaysInput.value) || 0;
            bgTargetDaysInput.value = val + 1;
        });
    }

    const bgCategory = document.getElementById('bg-category');
    const bgDetail = document.getElementById('bg-detail');
    const bgDetailLabel = document.getElementById('bg-detail-label');

    function updateDetailRequirement() {
        if (!bgCategory || !bgDetail || !bgDetailLabel) return;
        const cat = bgCategory.value;
        if (cat === '観光費' || cat === '宿泊費' || cat === '食費') {
            bgDetail.required = false;
            bgDetailLabel.innerText = '用途・詳細 (任意)';
        } else {
            bgDetail.required = true;
            bgDetailLabel.innerText = '用途・詳細 (必須)';
        }
    }
    if(bgCategory) {
        bgCategory.addEventListener('change', updateDetailRequirement);
        updateDetailRequirement();
    }

    const toggleBtn = document.getElementById('toggle-budget-form');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('budget-form-wrapper');
            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block';
                toggleBtn.innerText = '－ 入力フォームを閉じる';
            } else {
                wrapper.style.display = 'none';
                toggleBtn.innerText = '＋ 予算項目を追加';
                document.getElementById('edit-budget-id').value = '';
                document.getElementById('btn-submit-bg').innerText = '予算を追加';
                document.getElementById('budget-form').reset();
                updateDetailRequirement();
                if(bgDaysArea) bgDaysArea.style.display = 'none';
            }
        });
    }
});

async function loadBudget(forceFetch = false) {
    if (typeof forceFetch !== 'boolean') forceFetch = false;

    // 旅行開始前なら強制的に最新データを取得する処理
    if (APP_CONFIG.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(APP_CONFIG.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (today < startDate) {
            forceFetch = true;
        }
    }

    if (!APP_CONFIG.gasUrl) return;
    const listDiv = document.getElementById('budget-list');

    const cached = localStorage.getItem('cache_budget');
    if (cached) {
        budgetData = JSON.parse(cached);
        renderBudgetList();
        if (!forceFetch) return; 
    } else {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">読み込み中...</p>';
    }

    try {
        const response = await fetch(APP_CONFIG.gasUrl + "?sheet=予算");
        const data = await response.json();

        if (data.error) {
            if (!cached) listDiv.innerHTML = `<p style="color: red;">エラー: ${data.error}</p>`;
            return;
        }

        budgetData = data; 
        localStorage.setItem('cache_budget', JSON.stringify(data));
        renderBudgetList(); 
    } catch (error) {
        if (!cached) listDiv.innerHTML = `<p style="color: red;">通信エラーが発生しました．</p>`;
    }
}

function renderBudgetList() {
    const listDiv = document.getElementById('budget-list');
    const totalDiv = document.getElementById('budget-total');

    if (budgetData.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">予算データはまだありません．</p>';
        totalDiv.innerText = '¥ 0';
        return;
    }

    const curr1Name = APP_CONFIG.curr1Name;
    const rateCurr1 = parseFloat(APP_CONFIG.curr1Rate) || 0;
    const curr2Name = APP_CONFIG.curr2Name;
    const rateCurr2 = parseFloat(APP_CONFIG.curr2Rate) || 0;
    const baseDays = parseFloat(APP_CONFIG.baseDays) || 15;

    let html = '';
    let totalJPY = 0;

    const categories = ['交通費', '宿泊費', '観光費', '食費', 'その他'];
    
    categories.forEach(cat => {
        const items = budgetData.filter(item => item['カテゴリ'] === cat);
        if (items.length === 0) return;

        let catTotal = 0;
        let catHtml = `<div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 2px solid #0056b3; padding-bottom: 5px; color: #0056b3; margin-bottom: 10px; font-size: 1.1em;">${cat}</h3>`;

        items.forEach(row => {
            const amount = parseFloat(row['金額']) || 0;
            const currency = row['通貨'];
            const isDaily = row['計算方法'] === '日額';
            
            const targetDays = (isDaily && row['掛ける日数']) ? parseFloat(row['掛ける日数']) : baseDays;
            
            let itemJPY = amount;
            let calcDetail = '';

            if (currency !== '円' && currency === curr1Name && curr1Name) {
                itemJPY *= rateCurr1;
                if (isDaily) {
                    calcDetail = '(' + curr1Name + ' ' + amount.toLocaleString() + ' × ' + targetDays + '日 × ' + rateCurr1 + '円)';
                    itemJPY *= targetDays;
                } else {
                    calcDetail = '(' + curr1Name + ' ' + amount.toLocaleString() + ' × ' + rateCurr1 + '円)';
                }
            } else if (currency !== '円' && currency === curr2Name && curr2Name) {
                itemJPY *= rateCurr2;
                if (isDaily) {
                    calcDetail = '(' + curr2Name + ' ' + amount.toLocaleString() + ' × ' + targetDays + '日 × ' + rateCurr2 + '円)';
                    itemJPY *= targetDays;
                } else {
                    calcDetail = '(' + curr2Name + ' ' + amount.toLocaleString() + ' × ' + rateCurr2 + '円)';
                }
            } else {
                if (isDaily) {
                    calcDetail = '(¥' + amount.toLocaleString() + ' × ' + targetDays + '日)';
                    itemJPY *= targetDays;
                }
            }
            
            catTotal += itemJPY;

            catHtml += `
                <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 8px 0;">
                    <div style="flex: 1; padding-right: 10px;">
                        <div style="font-weight: bold; font-size: 0.95em;">${row['用途']}</div>
                        <div style="font-size: 0.8em; color: #666;">
                            ${isDaily ? '📅 ' + targetDays + '日分' : '📌 固定'} | ${currency !== '円' ? currency : '円'} ${amount.toLocaleString()}
                            ${calcDetail ? '<span style="color: #999; margin-left: 5px;">' + calcDetail + '</span>' : ''}
                        </div>
                    </div>
                    <div style="font-weight: bold; font-size: 1.1em; margin-right: 10px; text-align: right;">
                        ¥ ${Math.round(itemJPY).toLocaleString()}
                    </div>
                    <button onclick="deleteBudget('${row['ID']}')" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.1em; padding: 5px; flex-shrink: 0;" title="この予算項目を削除">🗑️</button>
                </div>
            `;
        });

        catHtml += `<div style="text-align: right; font-weight: bold; margin-top: 8px; color: #555; font-size: 0.95em;">${cat} 小計: ¥ ${Math.round(catTotal).toLocaleString()}</div>`;
        catHtml += `</div>`;
        
        html += catHtml;
        totalJPY += catTotal;
    });

    listDiv.innerHTML = html;
    totalDiv.innerText = `¥ ${Math.round(totalJPY).toLocaleString()}`;
}

window.deleteBudget = function(id) {
    if (!confirm('この予算項目を削除してもよろしいですか？')) return;
    
    budgetData = budgetData.filter(item => item['ID'] !== id);
    localStorage.setItem('cache_budget', JSON.stringify(budgetData));
    renderBudgetList();

    window.safeFetch({
        sheet: '予算',
        action: 'delete',
        id: id
    });
}

const bForm = document.getElementById('budget-form');
if (bForm) {
    bForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        if (!APP_CONFIG.gasUrl) {
            alert("設定タブからURLを登録してください．");
            return;
        }

        const btn = document.getElementById('btn-submit-bg');
        btn.disabled = true;

        const category = document.getElementById('bg-category').value;
        let detail = document.getElementById('bg-detail').value.trim();
        const type = document.getElementById('bg-type').value;
        const currency = document.getElementById('bg-currency').value;
        const amount = document.getElementById('bg-amount').value;
        
        const targetDays = type === '日額' ? document.getElementById('bg-target-days').value : '';

        if (!detail) {
            detail = category;
        }

        const newId = 'bg_' + new Date().getTime();
        
        const newItem = {
            'ID': newId,
            'カテゴリ': category,
            '用途': detail,
            '計算方法': type,
            '通貨': currency,
            '金額': amount,
            '掛ける日数': targetDays
        };
        
        budgetData.push(newItem);
        localStorage.setItem('cache_budget', JSON.stringify(budgetData));
        renderBudgetList();

        document.getElementById('budget-form').reset();
        
        if (window.innerWidth <= 767) {
            document.getElementById('budget-form-wrapper').style.display = 'none';
            const tBtn = document.getElementById('toggle-budget-form');
            if (tBtn) tBtn.innerText = '＋ 予算項目を追加';
        }
        btn.disabled = false;

        const bgCategory = document.getElementById('bg-category');
        const bgDetailLabel = document.getElementById('bg-detail-label');
        const bgDetail = document.getElementById('bg-detail');
        if (bgCategory && bgDetailLabel && bgDetail) {
            if (bgCategory.value === '観光費' || bgCategory.value === '宿泊費' || bgCategory.value === '食費') {
                bgDetail.required = false;
                bgDetailLabel.innerText = '用途・詳細 (任意)';
            } else {
                bgDetail.required = true;
                bgDetailLabel.innerText = '用途・詳細 (必須)';
            }
        }
        const bgDaysArea = document.getElementById('bg-days-area');
        if(bgDaysArea) bgDaysArea.style.display = 'none';

        const rowData = [
            newId,
            category,
            detail,
            type,
            currency,
            amount,
            targetDays
        ];

        window.safeFetch({
            sheet: '予算',
            action: 'insert',
            data: rowData
        });
    });
}