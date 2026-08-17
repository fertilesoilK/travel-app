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
        alert('To use the dashboard, please set your name in the settings.');
        return;
    }

    const catMap = {
        '食費': 'Food',
        '交通費': 'Transport',
        '宿泊費': 'Accommodation',
        '観光費': 'Sightseeing',
        'その他': 'Others'
    };

    const budgetCatTotals = { 'Food': 0, 'Transport': 0, 'Accommodation': 0, 'Sightseeing': 0, 'Others': 0 };
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
            const catEN = catMap[catJP] || 'Others';
            budgetCatTotals[catEN] += jpyAmount;
        });
    }

    const expenseCatTotals = { 'Food': 0, 'Transport': 0, 'Accommodation': 0, 'Sightseeing': 0, 'Others': 0 };
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
                if (match && catMap[match[1]] !== undefined) {
                    catJP = match[1];
                }
                expenseCatTotals[catMap[catJP] || 'Others'] += myShare;
            }
        });
    }

    Chart.defaults.font.family = 'Ariel';
    Chart.defaults.font.size = 18;

    const maxVal = Math.max(totalBudget, totalExpense);
    const axisMax = Math.ceil((maxVal || 1) * 1.2);

    const categories = ['Food', 'Transport', 'Accommodation', 'Sightseeing', 'Others'];
    const colors = {
        'Food': '#ffc107',
        'Transport': '#17a2b8',
        'Accommodation': '#6f42c1',
        'Sightseeing': '#fd7e14',
        'Others': '#6c757d'
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
            labels: ['Budget', 'Expense'],
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
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                xTop: {
                    type: 'linear',
                    stacked: true,
                    position: 'top',
                    min: 0,
                    max: axisMax,
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                y: {
                    stacked: true,
                    position: 'left',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                yRight: {
                    type: 'category',
                    labels: ['Budget', 'Expense'],
                    stacked: true,
                    position: 'right',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                }
            }
        }
    });

    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const pieLabels = [];
    const pieData = [];
    const pieColors = [];

    categories.forEach(cat => {
        pieLabels.push(cat);
        pieData.push(expenseCatTotals[cat]);
        pieColors.push(colors[cat]);
    });

    categoryChartInstance = new Chart(ctxCategory, {
        type: 'bar',
        data: {
            labels: pieLabels,
            datasets: [{
                label: 'Expense Amount',
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
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                xTop: {
                    type: 'category',
                    labels: pieLabels,
                    position: 'top',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                y: {
                    position: 'left',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                },
                yRight: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    border: { display: true, color: 'grey', width: 2 },
                    ticks: { display: true, color: 'black', minor: { display: true } }
                }
            }
        }
    });

    let remain = totalBudget - totalExpense;
    let remainText = remain >= 0 ? `Remaining: ¥${remain.toLocaleString()}` : `Over: ¥${(-remain).toLocaleString()}`;
    document.getElementById('dashboard-budget-text').innerText = `Total Budget: ¥${totalBudget.toLocaleString()} / Total Expense: ¥${totalExpense.toLocaleString()} (${remainText})`;
}