let budgetChartInstance = null;
let categoryChartInstance = null;

function renderDashboard() {
    if (!document.getElementById('budgetChart')) return;

    const curr1Name = APP_CONFIG.curr1Name;
    const rateCurr1 = parseFloat(APP_CONFIG.curr1Rate) || 0;
    const curr2Name = APP_CONFIG.curr2Name;
    const rateCurr2 = parseFloat(APP_CONFIG.curr2Rate) || 0;
    const baseDays = parseFloat(APP_CONFIG.baseDays) || 15;

    // --- 1. 総予算の計算 ---
    let totalBudget = 0;
    if (typeof budgetData !== 'undefined') {
        budgetData.forEach(row => {
            const amount = parseFloat(row['金額']) || 0;
            const currency = row['通貨'];
            const isDaily = row['計算方法'] === '日額';
            const targetDays = (isDaily && row['掛ける日数']) ? parseFloat(row['掛ける日数']) : baseDays;
            
            let itemJPY = amount;
            if (currency !== '円' && currency === curr1Name && curr1Name) itemJPY *= rateCurr1;
            else if (currency !== '円' && currency === curr2Name && curr2Name) itemJPY *= rateCurr2;
            
            if (isDaily) itemJPY *= targetDays;
            totalBudget += Math.round(itemJPY);
        });
    }

    // --- 2. 支出の計算（カテゴリ別） ---
    let totalExpense = 0;
    const catTotals = { '食費': 0, '交通費': 0, '宿泊費': 0, '観光費': 0, 'その他': 0 };
    
    if (typeof expenseData !== 'undefined') {
        expenseData.forEach(row => {
            let itemJPY = parseFloat(row['金額']) || 0;
            const currency = row['通貨'] || '円';
            const originalAmount = row['外貨金額'] !== undefined && row['外貨金額'] !== '' ? parseFloat(row['外貨金額']) : itemJPY;
            
            if (currency !== '円' && currency === curr1Name && curr1Name) itemJPY = Math.round(originalAmount * rateCurr1);
            else if (currency !== '円' && currency === curr2Name && curr2Name) itemJPY = Math.round(originalAmount * rateCurr2);
            else itemJPY = Math.round(itemJPY);

            totalExpense += itemJPY;

            const contentStr = row['支払い内容'] || row['支払内容'] || '';
            const match = contentStr.match(/^\[(.*?)\]/);
            let cat = 'その他';
            if (match && catTotals[match[1]] !== undefined) {
                cat = match[1];
            }
            catTotals[cat] += itemJPY;
        });
    }

    // --- 3. 予算 vs 支出 のバーグラフ描画 ---
    const ctxBudget = document.getElementById('budgetChart').getContext('2d');
    if (budgetChartInstance) budgetChartInstance.destroy();

    budgetChartInstance = new Chart(ctxBudget, {
        type: 'bar',
        data: {
            labels: ['金額 (円)'],
            datasets: [
                { label: '総予算', data: [totalBudget], backgroundColor: '#0056b3' },
                { label: '総支出', data: [totalExpense], backgroundColor: '#dc3545' }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    let remain = totalBudget - totalExpense;
    let remainText = remain >= 0 ? `残りの予算: ¥${remain.toLocaleString()}` : `予算オーバー: ¥${(-remain).toLocaleString()}`;
    document.getElementById('dashboard-budget-text').innerText = `総予算: ¥${totalBudget.toLocaleString()} / 総支出: ¥${totalExpense.toLocaleString()} (${remainText})`;

    // --- 4. カテゴリ別支出のドーナツグラフ描画 ---
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const labels = [];
    const dataValues = [];
    const bgColors = [];
    const colors = { '食費': '#ffc107', '交通費': '#17a2b8', '宿泊費': '#6f42c1', '観光費': '#fd7e14', 'その他': '#6c757d' };

    for (const [key, val] of Object.entries(catTotals)) {
        if (val > 0) {
            labels.push(key);
            dataValues.push(val);
            bgColors.push(colors[key]);
        }
    }

    categoryChartInstance = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}