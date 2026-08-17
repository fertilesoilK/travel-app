let budgetChartInstance = null;
let categoryChartInstance = null;

function renderDashboard() {
    if (!document.getElementById('budgetChart')) return;

    const curr1Name = APP_CONFIG.curr1Name;
    const rateCurr1 = parseFloat(APP_CONFIG.curr1Rate) || 0;
    const curr2Name = APP_CONFIG.curr2Name;
    const rateCurr2 = parseFloat(APP_CONFIG.curr2Rate) || 0;
    const baseDays = parseFloat(APP_CONFIG.baseDays) || 15;
    const myName = APP_CONFIG.mySelf;

    if (!myName) {
        alert('分析機能を使用するには、設定タブで「自分の名前」を登録してください。');
        return;
    }

    const categories = ['食費', '交通費', '宿泊費', '観光費', 'その他'];
    const budgetCatTotals = { '食費': 0, '交通費': 0, '宿泊費': 0, '観光費': 0, 'その他': 0 };
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
            
            const jpyAmount = Math.round(itemJPY);
            totalBudget += jpyAmount;

            const catJP = row['カテゴリ'] || 'その他';
            if (budgetCatTotals[catJP] !== undefined) {
                budgetCatTotals[catJP] += jpyAmount;
            } else {
                budgetCatTotals['その他'] += jpyAmount;
            }
        });
    }

    const expenseCatTotals = { '食費': 0, '交通費': 0, '宿泊費': 0, '観光費': 0, 'その他': 0 };
    let totalExpense = 0;
    
    if (typeof expenseData !== 'undefined') {
        expenseData.forEach(row => {
            let itemJPY = parseFloat(row['金額']) || 0;
            const currency = row['通貨'] || '円';
            const originalAmount = row['外貨金額'] !== undefined && row['外貨金額'] !== '' ? parseFloat(row['外貨金額']) : itemJPY;
            
            if (currency !== '円' && currency === curr1Name && curr1Name) itemJPY = Math.round(originalAmount * rateCurr1);
            else if (currency !== '円' && currency === curr2Name && curr2Name) itemJPY = Math.round(originalAmount * rateCurr2);
            else itemJPY = Math.round(itemJPY);

            const targetStr = row['対象者'] || row['誰の分？'] || '全員';
            let targets = [];
            if (targetStr === '全員') {
                targets = APP_CONFIG.travelers;
            } else {
                targets = targetStr.split(',').map(s => s.trim()).filter(s => s);
            }

            if (targets.includes(myName)) {
                const myShare = Math.round(itemJPY / targets.length);
                totalExpense += myShare;

                const contentStr = row['支払い内容'] || row['支払内容'] || '';
                const match = contentStr.match(/^\[(.*?)\]/);
                let catJP = 'その他';
                if (match && expenseCatTotals[match[1]] !== undefined) {
                    catJP = match[1];
                }
                expenseCatTotals[catJP] += myShare;
            }
        });
    }

    Chart.defaults.font.family = 'Ariel';
    Chart.defaults.font.size = 14; 

    const maxVal = Math.max(totalBudget, totalExpense);
    const axisMax = Math.ceil((maxVal || 1) * 1.2);

    const colors = {
        '食費': '#ffc107',
        '交通費': '#17a2b8',
        '宿泊費': '#6f42c1',
        '観光費': '#fd7e14',
        'その他': '#6c757d'
    };

    const barDatasets = categories.map(cat => {
        return {
            label: cat,
            data: [budgetCatTotals[cat], expenseCatTotals[cat]],
            backgroundColor: colors[cat]
        };
    });

    const ctxBudget = document.getElementById('budgetChart').getContext('2d');
    if (budgetChartInstance) budgetChartInstance.destroy();

    budgetChartInstance = new Chart(ctxBudget, {
        type: 'bar',
        data: {
            labels: ['予算', '支出'],
            datasets: barDatasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: false }
            },
            scales: {
                x: {
                    stacked: true,
                    position: 'bottom',
                    min: 0,
                    max: axisMax,
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                xTop: {
                    type: 'linear',
                    stacked: true,
                    position: 'top',
                    min: 0,
                    max: axisMax,
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                y: {
                    stacked: true,
                    position: 'left',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                yRight: {
                    type: 'category',
                    labels: ['予算', '支出'],
                    stacked: true,
                    position: 'right',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                }
            }
        }
    });

    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const pieData = [];
    const pieColors = [];

    categories.forEach(cat => {
        pieData.push(expenseCatTotals[cat]);
        pieColors.push(colors[cat]);
    });

    categoryChartInstance = new Chart(ctxCategory, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: '支出額',
                data: pieData,
                backgroundColor: pieColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                x: {
                    position: 'bottom',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                xTop: {
                    type: 'category',
                    labels: categories,
                    position: 'top',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                y: {
                    position: 'left',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                },
                yRight: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black' }
                }
            }
        }
    });

    let tableHtml = `
    <div style="overflow-x: auto; margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: right;">
            <thead>
                <tr style="background-color: #0056b3; color: white;">
                    <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">カテゴリ</th>
                    <th style="padding: 8px; border: 1px solid #dee2e6;">予算 (円)</th>
                    <th style="padding: 8px; border: 1px solid #dee2e6;">支出 (円)</th>
                    <th style="padding: 8px; border: 1px solid #dee2e6;">残額 (円)</th>
                </tr>
            </thead>
            <tbody>
    `;

    categories.forEach(cat => {
        const b = budgetCatTotals[cat];
        const e = expenseCatTotals[cat];
        const diff = b - e;
        const diffColor = diff < 0 ? 'color: #dc3545; font-weight: bold;' : 'color: #28a745;';
        tableHtml += `
            <tr>
                <td style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">${cat}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${b.toLocaleString()}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6;">${e.toLocaleString()}</td>
                <td style="padding: 8px; border: 1px solid #dee2e6; ${diffColor}">${diff.toLocaleString()}</td>
            </tr>
        `;
    });

    const totalDiff = totalBudget - totalExpense;
    const totalDiffColor = totalDiff < 0 ? 'color: #dc3545; font-weight: bold;' : 'color: #28a745; font-weight: bold;';
    
    tableHtml += `
            </tbody>
            <tfoot>
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">合計</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${totalBudget.toLocaleString()}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">${totalExpense.toLocaleString()}</td>
                    <td style="padding: 8px; border: 1px solid #dee2e6; ${totalDiffColor}">${totalDiff.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    </div>
    `;

    document.getElementById('dashboard-table-container').innerHTML = tableHtml;
}