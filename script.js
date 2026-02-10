// ===== DOM Elements =====
const todoInput = document.getElementById('todoInput');
const addButton = document.getElementById('addButton');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');

// ===== State =====
let todos = [];

// ===== Initialize App =====
function init() {
    loadTodos();
    renderTodos();
    updateStats();

    // Event listeners
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
}

// ===== Local Storage Functions =====
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    }
}

// ===== Add Todo =====
function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        // Add shake animation to input
        todoInput.style.animation = 'shake 0.3s ease';
        setTimeout(() => {
            todoInput.style.animation = '';
        }, 300);
        return;
    }

    // Secret code detection
    if (text === '0026123') {
        todoInput.value = '';
        activateSecretChat();
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    todos.unshift(todo); // Add to beginning
    todoInput.value = '';

    saveTodos();
    renderTodos();
    updateStats();

    // Focus back on input
    todoInput.focus();
}

// ===== Render Todos =====
function renderTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    todos.forEach(todo => {
        const li = createTodoElement(todo);
        todoList.appendChild(li);
    });
}

// ===== Create Todo Element =====
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox wrapper
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'checkbox-wrapper';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    checkboxWrapper.appendChild(checkbox);

    // Text
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(checkboxWrapper);
    li.appendChild(text);
    li.appendChild(deleteBtn);

    return li;
}

// ===== Toggle Todo =====
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

// ===== Delete Todo =====
function deleteTodo(id) {
    const todoElement = document.querySelector(`[data-id="${id}"]`);

    if (todoElement) {
        // Add removing animation
        todoElement.classList.add('removing');

        // Wait for animation to complete
        setTimeout(() => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
            updateStats();
        }, 300);
    }
}

// ===== Update Stats =====
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;

    totalCount.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    completedCount.textContent = `${completed} completed`;
}

// ===== Shake Animation (for empty input) =====
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ===== CHAT FUNCTIONALITY =====

// Chat DOM Elements
let chatContainer, todoContainer, backToTodoBtn;
let roomSelection, chatView, roomsContainer;
let createRoomBtn, joinRoomBtn, createRoomModal, joinRoomModal;
let newRoomName, newRoomPassword, joinRoomName, joinRoomPassword;
let messageInput, sendMessageBtn, messagesList, leaveRoomBtn;
let currentRoomName, currentRoomBadge;

// Chat State
let chatRooms = [];
let currentRoom = null;

// Initialize Chat Elements
function initChatElements() {
    chatContainer = document.getElementById('chatContainer');
    todoContainer = document.querySelector('.container');
    backToTodoBtn = document.getElementById('backToTodo');
    roomSelection = document.getElementById('roomSelection');
    chatView = document.getElementById('chatView');
    roomsContainer = document.getElementById('roomsContainer');
    createRoomBtn = document.getElementById('createRoomBtn');
    joinRoomBtn = document.getElementById('joinRoomBtn');
    createRoomModal = document.getElementById('createRoomModal');
    joinRoomModal = document.getElementById('joinRoomModal');
    newRoomName = document.getElementById('newRoomName');
    newRoomPassword = document.getElementById('newRoomPassword');
    joinRoomName = document.getElementById('joinRoomName');
    joinRoomPassword = document.getElementById('joinRoomPassword');
    messageInput = document.getElementById('messageInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    messagesList = document.getElementById('messagesList');
    leaveRoomBtn = document.getElementById('leaveRoomBtn');
    currentRoomName = document.getElementById('currentRoomName');
    currentRoomBadge = document.getElementById('currentRoomBadge');
}

// Activate Secret Chat
function activateSecretChat() {
    if (!chatContainer) initChatElements();

    loadChatRooms();
    renderRooms();

    // Slide out todo, slide in chat
    todoContainer.style.animation = 'slideOutLeft 0.5s ease forwards';
    setTimeout(() => {
        todoContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        chatContainer.style.animation = 'slideInRight 0.5s ease forwards';
    }, 500);

    setupChatEventListeners();
}

// Setup Chat Event Listeners
function setupChatEventListeners() {
    backToTodoBtn.addEventListener('click', deactivateSecretChat);
    createRoomBtn.addEventListener('click', () => openModal(createRoomModal));
    joinRoomBtn.addEventListener('click', () => openModal(joinRoomModal));

    document.getElementById('confirmCreateRoom').addEventListener('click', createRoom);
    document.getElementById('cancelCreateRoom').addEventListener('click', () => closeModal(createRoomModal));
    document.getElementById('confirmJoinRoom').addEventListener('click', joinRoom);
    document.getElementById('cancelJoinRoom').addEventListener('click', () => closeModal(joinRoomModal));

    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    leaveRoomBtn.addEventListener('click', () => {
        currentRoom = null;
        chatView.style.display = 'none';
        roomSelection.style.display = 'block';
    });
}

// Deactivate Secret Chat
function deactivateSecretChat() {
    chatContainer.style.animation = 'slideOutRight 0.5s ease forwards';
    setTimeout(() => {
        chatContainer.style.display = 'none';
        todoContainer.style.display = 'block';
        todoContainer.style.animation = 'slideInLeft 0.5s ease forwards';
    }, 500);
}

// Modal Functions
function openModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Local Storage for Chat
function saveChatRooms() {
    localStorage.setItem('chatRooms', JSON.stringify(chatRooms));
}

function loadChatRooms() {
    const stored = localStorage.getItem('chatRooms');
    if (stored) {
        chatRooms = JSON.parse(stored);
    }
}

// Create Room
function createRoom() {
    const name = newRoomName.value.trim();
    const password = newRoomPassword.value.trim();

    if (!name || !password) {
        alert('Please enter both room name and password');
        return;
    }

    // Check if room exists
    if (chatRooms.find(r => r.name === name)) {
        alert('Room with this name already exists');
        return;
    }

    const room = {
        name: name,
        password: password,
        messages: [],
        createdAt: new Date().toISOString()
    };

    chatRooms.push(room);
    saveChatRooms();
    renderRooms();

    newRoomName.value = '';
    newRoomPassword.value = '';
    closeModal(createRoomModal);

    // Auto-enter the room
    enterRoom(room);
}

// Join Room
function joinRoom() {
    const name = joinRoomName.value.trim();
    const password = joinRoomPassword.value.trim();

    if (!name || !password) {
        alert('Please enter both room name and password');
        return;
    }

    const room = chatRooms.find(r => r.name === name);

    if (!room) {
        alert('Room not found');
        return;
    }

    if (room.password !== password) {
        alert('Incorrect password');
        return;
    }

    joinRoomName.value = '';
    joinRoomPassword.value = '';
    closeModal(joinRoomModal);

    enterRoom(room);
}

// Enter Room
function enterRoom(room) {
    currentRoom = room;
    currentRoomName.textContent = room.name;

    roomSelection.style.display = 'none';
    chatView.style.display = 'flex';

    renderMessages();
    messageInput.focus();
}

// Render Rooms
function renderRooms() {
    if (chatRooms.length === 0) {
        roomsContainer.innerHTML = '<p class="no-rooms">No rooms yet. Create one to get started!</p>';
        return;
    }

    roomsContainer.innerHTML = '';
    chatRooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <div class="room-card-header">
                <h4>${room.name}</h4>
                <span class="room-message-count">${room.messages.length} messages</span>
            </div>
            <button class="enter-room-btn">Enter</button>
        `;

        roomCard.querySelector('.enter-room-btn').addEventListener('click', () => enterRoom(room));
        roomsContainer.appendChild(roomCard);
    });
}

// Send Message
function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !currentRoom) return;

    const message = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString(),
        sender: 'You'
    };

    currentRoom.messages.push(message);
    saveChatRooms();
    renderMessages();

    messageInput.value = '';
    messageInput.focus();
}

// Render Messages
function renderMessages() {
    if (!currentRoom) return;

    if (currentRoom.messages.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No messages yet. Start the conversation!</p>';
        return;
    }

    messagesList.innerHTML = '';
    currentRoom.messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';

        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${msg.sender}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        `;

        messagesList.appendChild(msgDiv);
    });

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

// ===== Start App =====
init();

