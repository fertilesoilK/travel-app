let expenseData = [];

document.addEventListener('DOMContentLoaded', () => {
    const payerSelect = document.getElementById('exp-payer');
    const targetContainer = document.getElementById('exp-target-container');
    
    if (APP_CONFIG.travelers && APP_CONFIG.travelers.length > 0) {
        APP_CONFIG.travelers.forEach(name => {
            const option1 = document.createElement('option');
            option1.value = name;
            option1.textContent = name;
            if(payerSelect) payerSelect.appendChild(option1);
        });
    }

    if (targetContainer && APP_CONFIG.travelers && APP_CONFIG.travelers.length > 0) {
        targetContainer.innerHTML = '';
        
        const allLabel = document.createElement('label');
        allLabel.style.cssText = 'display: flex; align-items: center; gap: 5px; background: #f8f9fa; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; cursor: pointer; border: 1px solid #ccc; font-weight: bold; color: #666; transition: 0.2s;';
        const allCb = document.createElement('input');
        allCb.type = 'checkbox';
        allCb.value = '全員';
        allCb.checked = false;
        allCb.style.display = 'none';
        allLabel.appendChild(allCb);
        allLabel.appendChild(document.createTextNode('全員'));
        targetContainer.appendChild(allLabel);

        const memberCbs = [];
        
        APP_CONFIG.travelers.forEach(name => {
            const lbl = document.createElement('label');
            lbl.style.cssText = 'display: flex; align-items: center; gap: 5px; background: #f8f9fa; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; cursor: pointer; border: 1px solid #ccc; font-weight: bold; color: #666; transition: 0.2s;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = name;
            cb.className = 'target-member';
            cb.checked = false;
            cb.style.display = 'none';
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(name));
            targetContainer.appendChild(lbl);
            memberCbs.push({cb, lbl});
            
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    lbl.style.backgroundColor = '#e6f7ff';
                    lbl.style.borderColor = '#0056b3';
                    lbl.style.color = '#0056b3';
                    if (memberCbs.every(m => m.cb.checked)) {
                        allCb.checked = true;
                        allLabel.style.backgroundColor = '#e6f7ff';
                        allLabel.style.borderColor = '#0056b3';
                        allLabel.style.color = '#0056b3';
                    }
                } else {
                    lbl.style.backgroundColor = '#f8f9fa';
                    lbl.style.borderColor = '#ccc';
                    lbl.style.color = '#666';
                    allCb.checked = false;
                    allLabel.style.backgroundColor = '#f8f9fa';
                    allLabel.style.borderColor = '#ccc';
                    allLabel.style.color = '#666';
                }
            });
        });

        allCb.addEventListener('change', () => {
            const isChecked = allCb.checked;
            allLabel.style.backgroundColor = isChecked ? '#e6f7ff' : '#f8f9fa';
            allLabel.style.borderColor = isChecked ? '#0056b3' : '#ccc';
            allLabel.style.color = isChecked ? '#0056b3' : '#666';
            
            memberCbs.forEach(m => {
                m.cb.checked = isChecked;
                m.lbl.style.backgroundColor = isChecked ? '#e6f7ff' : '#f8f9fa';
                m.lbl.style.borderColor = isChecked ? '#0056b3' : '#ccc';
                m.lbl.style.color = isChecked ? '#0056b3' : '#666';
            });
        });
    }

    const toggleBtn = document.getElementById('toggle-exp-form');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('exp-form-wrapper');
            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block';
                toggleBtn.innerText = '－ 入力フォームを閉じる';
            } else {
                wrapper.style.display = 'none';
                toggleBtn.innerText = '＋ 支出を追加';
            }
        });
    }
});

async function loadExpenses() {
    if (!APP_CONFIG.gasUrl) return;
    const listDiv = document.getElementById('expense-list');
    const settleDiv = document.getElementById('settlement-result');

    const cached = localStorage.getItem('cache_expense');
    if (cached) {
        expenseData = JSON.parse(cached);
        renderExpenseList();
    } else {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">読み込み中...</p>';
        settleDiv.innerHTML = '<p style="text-align: center; color: #666;">計算中...</p>';
    }

    try {
        const response = await fetch(APP_CONFIG.gasUrl + "?sheet=支出");
        const data = await response.json();

        if (data.error) {
            if (!cached) {
                listDiv.innerHTML = `<p style="color: red;">エラー: ${data.error}</p>`;
                settleDiv.innerHTML = '-';
            }
            return;
        }

        expenseData = data;
        localStorage.setItem('cache_expense', JSON.stringify(data));
        renderExpenseList();

    } catch (error) {
        if (!cached) {
            listDiv.innerHTML = `<p style="color: red;">通信エラーが発生しました．</p>`;
            settleDiv.innerHTML = `<p style="color: red;">エラー</p>`;
        }
    }
}

function renderExpenseList() {
    const listDiv = document.getElementById('expense-list');
    const settleDiv = document.getElementById('settlement-result');

    if (expenseData.length === 0) {
        listDiv.innerHTML = '<p>支出はまだ記録されていません．</p>';
        settleDiv.innerHTML = '<p>精算データはありません．</p>';
        return;
    }

    expenseData.sort((a, b) => {
        const timeA = new Date(a['日付'] || '1970-01-01').getTime();
        const timeB = new Date(b['日付'] || '1970-01-01').getTime();
        return timeB - timeA;
    });

    let html = '';
    let totalAmount = 0;
    
    const balances = {};
    APP_CONFIG.travelers.forEach(person => balances[person] = 0);

    const curr1Name = APP_CONFIG.curr1Name;
    const rateCurr1 = parseFloat(APP_CONFIG.curr1Rate) || 0;
    const curr2Name = APP_CONFIG.curr2Name;
    const rateCurr2 = parseFloat(APP_CONFIG.curr2Rate) || 0;

    expenseData.forEach(row => {
        let dateStr = '';
        if (row['日付']) {
            const d = new Date(row['日付']);
            if (!isNaN(d.getTime())) {
                dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
            } else {
                dateStr = row['日付'];
            }
        }
        
        let itemJPY = parseFloat(row['金額']) || 0;
        const currency = row['通貨'] || '円';
        const originalAmount = row['外貨金額'] !== undefined && row['外貨金額'] !== '' ? parseFloat(row['外貨金額']) : itemJPY;
        
        if (currency !== '円' && currency === curr1Name && curr1Name) {
            itemJPY = Math.round(originalAmount * rateCurr1);
        } else if (currency !== '円' && currency === curr2Name && curr2Name) {
            itemJPY = Math.round(originalAmount * rateCurr2);
        } else {
            itemJPY = Math.round(itemJPY);
        }
        
        const payer = row['支払者'] || '';
        const targetStr = row['対象者'] || row['誰の分？'] || '全員';
        
        // スプレッドシートの「支払い内容」列に対応
        const contentStr = row['支払い内容'] || row['支払内容'] || '';
        const id = row['ID'] || '';
        
        let icon = "💴";
        let displayContent = contentStr;
        
        // カテゴリと詳細をきれいにタグ付けして表示する
        const match = contentStr.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
            const cat = match[1];
            const det = match[2];
            if (cat === '食費') icon = "🍔";
            else if (cat === '交通費') icon = "🚃";
            else if (cat === '宿泊費') icon = "🏨";
            else if (cat === '観光費') icon = "🎟️";
            else if (cat === 'その他') icon = "📦";
            
            displayContent = `<span style="font-size: 0.8em; background-color: #e6f7ff; color: #0056b3; border: 1px solid #99c2ff; border-radius: 4px; padding: 2px 6px; margin-right: 6px;">${cat}</span>${det}`;
        }

        totalAmount += itemJPY;
        
        let targets = [];
        if (targetStr === '全員') {
            targets = APP_CONFIG.travelers;
        } else {
            targets = targetStr.split(',').map(s => s.trim()).filter(s => s);
        }
        
        if (targets.length > 0) {
            const splitAmount = itemJPY / targets.length;
            balances[payer] = (balances[payer] || 0) + itemJPY;
            targets.forEach(t => {
                balances[t] = (balances[t] || 0) - splitAmount;
            });
        }
        
        let targetDisplay = targetStr === '全員' ? '全員' : targetStr;
        
        let currencyDisplay = '';
        if (currency !== '円') {
            currencyDisplay = `<div style="font-size: 0.8em; color: #666; margin-bottom: 2px;">(${currency} ${originalAmount.toLocaleString()})</div>`;
        }

        html += `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center; position: relative;">
                <div style="font-size: 1.5em; line-height: 1.2; padding-right: 10px;">${icon}</div>
                <div style="flex: 1; padding-right: 10px;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 3px;">${dateStr}</div>
                    <div style="font-weight: bold; margin: 4px 0;">${displayContent}</div>
                    <div style="font-size: 0.85em; color: #555; background-color: #f8f9fa; display: inline-block; padding: 2px 6px; border-radius: 4px; margin-top: 3px;">
                        支払: ${payer} ➔ 対象: ${targetDisplay}
                    </div>
                </div>
                <div style="text-align: right; margin-right: 10px;">
                    ${currencyDisplay}
                    <div style="font-weight: bold; color: #d63384; font-size: 1.1em;">
                        ¥${itemJPY.toLocaleString()}
                    </div>
                </div>
                <button onclick="deleteExpense('${id}')" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.2em; padding: 5px; flex-shrink: 0;" title="この支出を削除">🗑️</button>
            </div>
        `;
    });
    listDiv.innerHTML = html;

    let creditors = [];
    let debtors = [];

    for (const [person, amount] of Object.entries(balances)) {
        if (amount > 0.5) creditors.push({ person, amount: amount });
        if (amount < -0.5) debtors.push({ person, amount: -amount });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];

        let amount = Math.min(debtor.amount, creditor.amount);
        amount = Math.round(amount);

        if (amount > 0) {
           settlements.push({ from: debtor.person, to: creditor.person, amount: amount });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.5) i++;
        if (creditor.amount < 0.5) j++;
    }

    let settleHtml = `<div style="margin-bottom: 15px; font-size: 0.95em; color: #666;">これまでの総支出: ¥${totalAmount.toLocaleString()}</div>`;
    
    if (settlements.length === 0) {
        settleHtml += `<div style="text-align: center; color: #28a745; font-weight: bold; padding: 15px; background: #e8f5e9; border-radius: 8px;">貸し借りはありません🎉</div>`;
    } else {
        settlements.forEach(s => {
            settleHtml += `
                <div style="display: flex; align-items: center; justify-content: space-between; background-color: #fff9e6; border: 1px solid #ffd54f; padding: 10px 15px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333;">${s.from}</div>
                    <div style="color: #666; font-size: 0.9em; display: flex; align-items: center; gap: 5px;">
                        <span>支払い ➔</span>
                    </div>
                    <div style="font-weight: bold; color: #0056b3;">${s.to}</div>
                    <div style="font-weight: bold; color: #d63384; font-size: 1.1em; margin-left: auto;">¥${s.amount.toLocaleString()}</div>
                </div>
            `;
        });
    }
    
    settleDiv.innerHTML = settleHtml;
}

window.deleteExpense = function(id) {
    if (!confirm('この支出記録を削除してもよろしいですか？')) return;
    
    expenseData = expenseData.filter(item => item['ID'] !== id);
    localStorage.setItem('cache_expense', JSON.stringify(expenseData));
    renderExpenseList();

    if (!APP_CONFIG.gasUrl) return;
    fetch(APP_CONFIG.gasUrl, {
        method: 'POST',
        body: JSON.stringify({
            sheet: '支出',
            action: 'delete',
            id: id
        })
    }).catch(error => {
        alert('通信エラーが発生しました。データを再読み込みします。');
        loadExpenses(); 
    });
}

document.getElementById('expense-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!APP_CONFIG.gasUrl) {
        alert("設定タブからURLを登録してください．");
        return;
    }

    const checkboxes = document.querySelectorAll('.target-member:checked');
    if (checkboxes.length === 0) {
        alert("「対象者」を少なくとも1人選択してください．");
        return;
    }

    const btn = document.getElementById('btn-submit-exp');
    btn.disabled = true;

    const inputDate = document.getElementById('exp-date').value;
    localStorage.setItem('lastExpDate', inputDate);

    const category = document.getElementById('exp-category').value;
    const detail = document.getElementById('exp-detail').value;
    const fullContent = `[${category}] ${detail}`;
    
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    const currency = document.getElementById('exp-currency').value;
    
    let itemJPY = amount;
    const curr1Name = APP_CONFIG.curr1Name;
    const rateCurr1 = parseFloat(APP_CONFIG.curr1Rate) || 0;
    const curr2Name = APP_CONFIG.curr2Name;
    const rateCurr2 = parseFloat(APP_CONFIG.curr2Rate) || 0;
    
    if (currency !== '円' && currency === curr1Name && curr1Name) {
        itemJPY = amount * rateCurr1;
    } else if (currency !== '円' && currency === curr2Name && curr2Name) {
        itemJPY = amount * rateCurr2;
    }
    itemJPY = Math.round(itemJPY);
    
    const payer = document.getElementById('exp-payer').value;

    let targetStr = '';
    if (checkboxes.length === APP_CONFIG.travelers.length) {
        targetStr = '全員';
    } else {
        const selectedNames = Array.from(checkboxes).map(cb => cb.value);
        targetStr = selectedNames.join(',');
    }

    const newId = 'exp_' + new Date().getTime();
    
    const newItem = {
        'ID': newId,
        '日付': inputDate,
        '支払い内容': fullContent, 
        '金額': itemJPY,
        '支払者': payer,
        '対象者': targetStr, 
        '通貨': currency,
        '外貨金額': amount
    };
    
    expenseData.push(newItem);
    localStorage.setItem('cache_expense', JSON.stringify(expenseData));
    renderExpenseList();

    document.getElementById('expense-form').reset();
    document.getElementById('exp-date').value = localStorage.getItem('lastExpDate');
    
    // リセット時に未選択状態に戻す
    const allCb = document.querySelector('input[value="全員"]');
    if (allCb) {
        allCb.checked = false;
        allCb.dispatchEvent(new Event('change'));
    }
    
    if (window.innerWidth <= 767) {
        document.getElementById('exp-form-wrapper').style.display = 'none';
        const tBtn = document.getElementById('toggle-exp-form');
        if (tBtn) tBtn.innerText = '＋ 支出を追加';
    }
    btn.disabled = false;

    const rowData = [
        newId,
        inputDate,
        fullContent,
        itemJPY,
        payer,
        targetStr,
        currency,
        amount
    ];

    fetch(APP_CONFIG.gasUrl, {
        method: 'POST',
        body: JSON.stringify({
            sheet: '支出',
            action: 'insert',
            data: rowData
        })
    }).catch(error => {
        alert('通信エラーが発生しました。データを再読み込みします。');
        loadExpenses();
    });
});