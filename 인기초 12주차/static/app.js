const todoInput = document.getElementById('todoInput');
const memoInput = document.getElementById('memoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

const API_URL = '/api/todos';

// 초기 로딩
async function loadTodos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('DB 연결 확인 필요');
        const todos = await res.json();
        todoList.innerHTML = '';
        todos.forEach(todo => renderTodo(todo));
    } catch (err) {
        console.error(err);
        todoList.innerHTML = '<p style="color:#ef4444; text-align:center;">.env에 올바른 API Key와 URL을 기입했는지 확인해주세요.</p>';
    }
}

// 렌더링
function renderTodo(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.is_complete ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    // 체크박스 커스텀 래퍼
    const label = document.createElement('label');
    label.className = 'checkbox-wrapper';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.is_complete;
    checkbox.addEventListener('change', () => toggleTodo(todo.id, checkbox.checked, li));

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';

    label.appendChild(checkbox);
    label.appendChild(checkmark);

    const div = document.createElement('div');
    div.className = 'task-content';

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = todo.task;
    div.appendChild(span);

    if (todo.memo) {
        const memoSpan = document.createElement('span');
        memoSpan.className = 'memo-text';
        memoSpan.textContent = todo.memo;
        div.appendChild(memoSpan);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id, li));

    li.appendChild(label);
    li.appendChild(div);
    li.appendChild(deleteBtn);

    todoList.appendChild(li);
}

// 추가
async function addTodo() {
    const task = todoInput.value.trim();
    const memo = memoInput.value.trim();
    if (!task) return;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, memo })
        });
        if (!res.ok) {
            alert('데이터 저장 실패! (혹시 Supabase 데이터베이스 TodoTable에 memo 열을 추가하셨나요?)');
            return;
        }
        const newTodo = await res.json();
        renderTodo(newTodo);
        todoInput.value = '';
        memoInput.value = '';
    } catch (err) {
        console.error(err);
    }
}

// 업데이트
async function toggleTodo(id, is_complete, liElement) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_complete })
        });
        if (!res.ok) throw new Error('Update failed');

        if (is_complete) liElement.classList.add('completed');
        else liElement.classList.remove('completed');
    } catch (err) {
        console.error(err);
        const cb = liElement.querySelector('input[type="checkbox"]');
        cb.checked = !is_complete; // revert
    }
}

// 삭제
async function deleteTodo(id, liElement) {
    try {
        liElement.style.opacity = '0'; // fade out
        liElement.style.transform = 'translateY(10px)';
        setTimeout(async () => {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) liElement.remove();
            else liElement.style.opacity = '1'; // revert if fail
        }, 300);
    } catch (err) {
        console.error(err);
    }
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

loadTodos();
