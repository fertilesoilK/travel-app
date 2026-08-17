let todoData = [];

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-todo-form');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('todo-form-wrapper');
            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block'; toggleBtn.innerText = '－ 入力フォームを閉じる';
            } else {
                wrapper.style.display = 'none'; toggleBtn.innerText = '＋ 項目を追加';
            }
        });
    }

    const todoType = document.getElementById('todo-type'); const todoCategoryArea = document.getElementById('todo-category-area');
    if (todoType && todoCategoryArea) {
        todoType.addEventListener('change', (e) => { todoCategoryArea.style.display = e.target.value === '持ち物' ? 'block' : 'none'; });
    }
});

async function loadTodo(forceFetch = false) {
    if (!APP_CONFIG.gasUrl) return;
    const listDiv = document.getElementById('todo-list');
    const cached = localStorage.getItem('cache_todo');
    if (cached) { todoData = JSON.parse(cached); renderTodoList(); if (!forceFetch) return;
    } else { listDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">読み込み中...</p>'; }

    try {
        const response = await fetch(APP_CONFIG.gasUrl + "?sheet=準備");
        const data = await response.json();
        if (data.error) { if (!cached) listDiv.innerHTML = `<p style="color: var(--warn-text);">エラー: ${data.error}</p>`; return; }
        todoData = data; localStorage.setItem('cache_todo', JSON.stringify(data)); renderTodoList();
    } catch (error) { if (!cached) listDiv.innerHTML = `<p style="color: var(--warn-text);">通信エラーが発生しました．</p>`; }
}

function renderTodoList() {
    const listDiv = document.getElementById('todo-list');
    if (todoData.length === 0) { listDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">準備リストはまだありません．</p>'; return; }

    let html = '';
    const categories = [
        { key: '共有ToDo', icon: '👥', color: '#dc3545' }, { key: '個人ToDo', icon: '👤', color: '#0d6efd' }, { key: '持ち物', icon: '👜', color: '#198754' }
    ];

    categories.forEach(cat => {
        const items = todoData.filter(item => item['種類'] === cat.key);
        if (items.length === 0) return;

        let catHtml = `<div style="margin-bottom: 25px;">
            <h3 style="border-bottom: 2px solid ${cat.color}; padding-bottom: 5px; color: ${cat.color}; margin-bottom: 10px; font-size: 1.1em;">${cat.icon} ${cat.key}</h3>`;

        if (cat.key === '持ち物') {
            const subCats = ['貴重品', '衣類', '衛生・身だしなみ品', '電子機器類', '飲食物', 'その他'];
            const subCatItems = {}; subCats.forEach(sc => subCatItems[sc] = []); const otherItems = [];

            items.forEach(row => {
                const match = row['内容'].match(/^\[(.*?)\]\s*(.*)$/);
                if (match && subCats.includes(match[1])) subCatItems[match[1]].push({ ...row, parsedContent: match[2] });
                else otherItems.push({ ...row, parsedContent: row['内容'] });
            });

            subCats.forEach(sc => {
                if (subCatItems[sc].length > 0) {
                    catHtml += `<h4 style="margin: 15px 0 5px 0; font-size: 0.95em; color: var(--text-muted); border-left: 4px solid #198754; padding-left: 8px;">${sc}</h4>`;
                    subCatItems[sc].forEach(row => { catHtml += buildTodoRow(row, cat.key); });
                }
            });
            if (otherItems.length > 0) {
                if (items.length !== otherItems.length) catHtml += `<h4 style="margin: 15px 0 5px 0; font-size: 0.95em; color: var(--text-muted); border-left: 4px solid #198754; padding-left: 8px;">分類なし</h4>`;
                otherItems.forEach(row => { catHtml += buildTodoRow(row, cat.key); });
            }
        } else {
            items.forEach(row => { row.parsedContent = row['内容']; catHtml += buildTodoRow(row, cat.key); });
        }
        catHtml += `</div>`; html += catHtml;
    });

    listDiv.innerHTML = html;
}

function buildTodoRow(row, typeKey) {
    const id = row['ID']; const content = row.parsedContent; const doneData = row['チェック済メンバー'] || '';
    let isChecked = false; let statusText = '';

    if (typeKey === '共有ToDo') {
        isChecked = (doneData === 'done');
        statusText = isChecked ? '<span style="font-size:0.75em; color:var(--success-text); margin-left:8px;">(完了)</span>' : '';
    } else {
        const doneMembers = doneData ? doneData.split(',') : [];
        isChecked = APP_CONFIG.mySelf ? doneMembers.includes(APP_CONFIG.mySelf) : false;
        if (doneMembers.length > 0) statusText = `<div style="font-size: 0.7em; color: var(--text-light); margin-top: 2px;">完了済: ${doneMembers.join(', ')}</div>`;
    }

    return `
        <div class="swipe-container" style="border-bottom: 1px solid var(--border-color);">
            <div class="swipe-content" style="background: var(--card-bg); padding: 12px 5px; display: flex; align-items: flex-start; position: relative; z-index: 2;">
                <input type="checkbox" onchange="toggleTodo('${id}')" ${isChecked ? 'checked' : ''} style="transform: scale(1.5); margin-top: 4px; margin-right: 15px; cursor: pointer;">
                <div style="flex: 1;">
                    <div style="${isChecked ? 'text-decoration: line-through; color: var(--text-light);' : 'color: var(--text-main);'}; font-size: 1.05em; font-weight: bold; cursor: pointer;" onclick="toggleTodo('${id}')">${content} ${statusText}</div>
                    ${typeKey !== '共有ToDo' ? statusText : ''}
                </div>
            </div>
            <div class="swipe-actions">
                <button onclick="deleteTodo('${id}')" style="background-color: #dc3545; border: none; color: white; cursor: pointer; padding: 0 20px; font-size: 1.2em;">🗑️</button>
            </div>
        </div>
    `;
}

window.toggleTodo = function(id) {
    const target = todoData.find(item => item['ID'] === id);
    if (!target) return;

    if (target['種類'] === '共有ToDo') {
        const isDone = target['チェック済メンバー'] === 'done'; target['チェック済メンバー'] = isDone ? '' : 'done';
    } else {
        const myName = APP_CONFIG.mySelf;
        if (!myName) { alert('チェック機能を使用するには、設定タブで「自分の名前」を登録してください。'); renderTodoList(); return; }
        let doneMembers = target['チェック済メンバー'] ? target['チェック済メンバー'].split(',') : [];
        const index = doneMembers.indexOf(myName);
        if (index === -1) doneMembers.push(myName); else doneMembers.splice(index, 1);
        target['チェック済メンバー'] = doneMembers.join(',');
    }

    localStorage.setItem('cache_todo', JSON.stringify(todoData)); renderTodoList();
    const rowData = [target['ID'], target['種類'], target['内容'], target['チェック済メンバー']];
    window.safeFetch({ sheet: '準備', action: 'update', data: rowData });
};

window.deleteTodo = function(id) {
    if (!confirm('この項目を削除してもよろしいですか？')) return;
    todoData = todoData.filter(item => item['ID'] !== id); localStorage.setItem('cache_todo', JSON.stringify(todoData));
    renderTodoList(); window.safeFetch({ sheet: '準備', action: 'delete', id: id });
};

const tForm = document.getElementById('todo-form');
if (tForm) {
    tForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!APP_CONFIG.gasUrl) { alert("設定タブからURLを登録してください．"); return; }

        const btn = document.getElementById('btn-submit-todo'); btn.disabled = true;
        const type = document.getElementById('todo-type').value; let content = document.getElementById('todo-content').value.trim();
        if (type === '持ち物') { const category = document.getElementById('todo-category').value; content = `[${category}] ${content}`; }
        
        const newId = 'todo_' + new Date().getTime();
        const newItem = { 'ID': newId, '種類': type, '内容': content, 'チェック済メンバー': '' };
        
        todoData.push(newItem); localStorage.setItem('cache_todo', JSON.stringify(todoData)); renderTodoList();

        document.getElementById('todo-form').reset();
        const categoryArea = document.getElementById('todo-category-area'); if (categoryArea) categoryArea.style.display = 'none';
        
        if (window.innerWidth <= 767) {
            document.getElementById('todo-form-wrapper').style.display = 'none';
            const tBtn = document.getElementById('toggle-todo-form'); if (tBtn) tBtn.innerText = '＋ 項目を追加';
        }
        btn.disabled = false;
        const rowData = [newId, type, content, ''];
        window.safeFetch({ sheet: '準備', action: 'insert', data: rowData });
    });
}