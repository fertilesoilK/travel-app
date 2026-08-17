let todoData = [];

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-todo-form');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const wrapper = document.getElementById('todo-form-wrapper');
            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block';
                toggleBtn.innerText = '－ 入力フォームを閉じる';
            } else {
                wrapper.style.display = 'none';
                toggleBtn.innerText = '＋ 項目を追加';
            }
        });
    }
});

async function loadTodo(forceFetch = false) {
    if (!APP_CONFIG.gasUrl) return;
    const listDiv = document.getElementById('todo-list');

    const cached = localStorage.getItem('cache_todo');
    if (cached) {
        todoData = JSON.parse(cached);
        renderTodoList();
        if (!forceFetch) return;
    } else {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">読み込み中...</p>';
    }

    try {
        const response = await fetch(APP_CONFIG.gasUrl + "?sheet=準備");
        const data = await response.json();

        if (data.error) {
            if (!cached) listDiv.innerHTML = `<p style="color: red;">エラー: ${data.error}</p>`;
            return;
        }

        todoData = data;
        localStorage.setItem('cache_todo', JSON.stringify(data));
        renderTodoList();
    } catch (error) {
        if (!cached) listDiv.innerHTML = `<p style="color: red;">通信エラーが発生しました．</p>`;
    }
}

function renderTodoList() {
    const listDiv = document.getElementById('todo-list');

    if (todoData.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; color: #666;">準備リストはまだありません．</p>';
        return;
    }

    let html = '';
    const categories = [
        { key: '共有ToDo', icon: '👥', color: '#dc3545' },
        { key: '個人ToDo', icon: '👤', color: '#0d6efd' },
        { key: '持ち物', icon: '👜', color: '#198754' }
    ];

    categories.forEach(cat => {
        const items = todoData.filter(item => item['種類'] === cat.key);
        if (items.length === 0) return;

        let catHtml = `<div style="margin-bottom: 25px;">
            <h3 style="border-bottom: 2px solid ${cat.color}; padding-bottom: 5px; color: ${cat.color}; margin-bottom: 10px; font-size: 1.1em;">${cat.icon} ${cat.key}</h3>`;

        items.forEach(row => {
            const id = row['ID'];
            const content = row['内容'];
            const doneData = row['チェック済メンバー'] || '';
            
            let isChecked = false;
            let statusText = '';

            if (cat.key === '共有ToDo') {
                isChecked = (doneData === 'done');
                statusText = isChecked ? '<span style="font-size:0.75em; color:#28a745; margin-left:8px;">(完了)</span>' : '';
            } else {
                const doneMembers = doneData ? doneData.split(',') : [];
                isChecked = APP_CONFIG.mySelf ? doneMembers.includes(APP_CONFIG.mySelf) : false;
                
                if (doneMembers.length > 0) {
                    statusText = `<div style="font-size: 0.7em; color: #888; margin-top: 2px;">完了済: ${doneMembers.join(', ')}</div>`;
                }
            }

            catHtml += `
                <div style="display: flex; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #eee;">
                    <input type="checkbox" onchange="toggleTodo('${id}')" ${isChecked ? 'checked' : ''} style="transform: scale(1.5); margin-top: 4px; margin-right: 15px; cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="${isChecked ? 'text-decoration: line-through; color: #999;' : ''}; font-size: 1.05em; font-weight: bold; cursor: pointer;" onclick="toggleTodo('${id}')">${content} ${statusText}</div>
                        ${cat.key !== '共有ToDo' ? statusText : ''}
                    </div>
                    <button onclick="deleteTodo('${id}')" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.2em; padding: 5px;">🗑️</button>
                </div>
            `;
        });

        catHtml += `</div>`;
        html += catHtml;
    });

    listDiv.innerHTML = html;
}

window.toggleTodo = function(id) {
    const target = todoData.find(item => item['ID'] === id);
    if (!target) return;

    if (target['種類'] === '共有ToDo') {
        const isDone = target['チェック済メンバー'] === 'done';
        target['チェック済メンバー'] = isDone ? '' : 'done';
    } else {
        const myName = APP_CONFIG.mySelf;
        if (!myName) {
            alert('チェック機能を使用するには、設定タブで「自分の名前」を登録してください。');
            renderTodoList(); // チェック状態を元に戻すために再描画
            return;
        }
        let doneMembers = target['チェック済メンバー'] ? target['チェック済メンバー'].split(',') : [];
        const index = doneMembers.indexOf(myName);
        
        if (index === -1) {
            doneMembers.push(myName);
        } else {
            doneMembers.splice(index, 1);
        }
        target['チェック済メンバー'] = doneMembers.join(',');
    }

    localStorage.setItem('cache_todo', JSON.stringify(todoData));
    renderTodoList();

    const rowData = [
        target['ID'],
        target['種類'],
        target['内容'],
        target['チェック済メンバー']
    ];

    window.safeFetch({
        sheet: '準備',
        action: 'update',
        data: rowData
    });
};

window.deleteTodo = function(id) {
    if (!confirm('この項目を削除してもよろしいですか？')) return;
    
    todoData = todoData.filter(item => item['ID'] !== id);
    localStorage.setItem('cache_todo', JSON.stringify(todoData));
    renderTodoList();

    window.safeFetch({
        sheet: '準備',
        action: 'delete',
        id: id
    });
};

const tForm = document.getElementById('todo-form');
if (tForm) {
    tForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!APP_CONFIG.gasUrl) {
            alert("設定タブからURLを登録してください．");
            return;
        }

        const btn = document.getElementById('btn-submit-todo');
        btn.disabled = true;

        const type = document.getElementById('todo-type').value;
        const content = document.getElementById('todo-content').value.trim();
        const newId = 'todo_' + new Date().getTime();
        
        const newItem = {
            'ID': newId,
            '種類': type,
            '内容': content,
            'チェック済メンバー': ''
        };
        
        todoData.push(newItem);
        localStorage.setItem('cache_todo', JSON.stringify(todoData));
        renderTodoList();

        document.getElementById('todo-form').reset();
        
        if (window.innerWidth <= 767) {
            document.getElementById('todo-form-wrapper').style.display = 'none';
            const tBtn = document.getElementById('toggle-todo-form');
            if (tBtn) tBtn.innerText = '＋ 項目を追加';
        }
        btn.disabled = false;

        const rowData = [
            newId,
            type,
            content,
            ''
        ];

        window.safeFetch({
            sheet: '準備',
            action: 'insert',
            data: rowData
        });
    });
}