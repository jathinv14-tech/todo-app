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

    // Admin command to clear database
    if (text === 'CLEAR_ALL_ROOMS') {
        if (confirm('⚠️ WARNING: This will delete ALL chat rooms and messages forever. Continue?')) {
            window.firebaseDB.ref('rooms').remove()
                .then(() => alert('All chat rooms have been deleted.'))
                .catch(err => alert('Error: ' + err.message));
        }
        todoInput.value = '';
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
let usernameModal, usernameInput, confirmUsernameBtn;

// Chat State
let chatRooms = {}; // Changed to object for Firebase
let currentRoom = null;
let currentRoomId = null;
let username = '';
let roomsListener = null;
let messagesListener = null;
let chatEventListenersSetup = false; // Prevent duplicate event listeners

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
    usernameModal = document.getElementById('usernameModal');
    usernameInput = document.getElementById('usernameInput');
    confirmUsernameBtn = document.getElementById('confirmUsername');
}

// Activate Secret Chat
function activateSecretChat() {
    if (!chatContainer) initChatElements();

    // Check if username exists in session
    username = sessionStorage.getItem('chatUsername');

    if (!username) {
        // Show username modal
        openModal(usernameModal);
        confirmUsernameBtn.addEventListener('click', () => {
            const name = usernameInput.value.trim();
            if (name) {
                username = name;
                sessionStorage.setItem('chatUsername', username);
                closeModal(usernameModal);
                proceedToChat();
            } else {
                usernameInput.style.animation = 'shake 0.3s ease';
                setTimeout(() => usernameInput.style.animation = '', 300);
            }
        });
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') confirmUsernameBtn.click();
        });
    } else {
        proceedToChat();
    }
}

function proceedToChat() {
    loadChatRooms();

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
    // Only set up listeners once to prevent duplicates
    if (chatEventListenersSetup) return;
    chatEventListenersSetup = true;

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
        // Remove message listener
        if (messagesListener && currentRoomId) {
            window.firebaseDB.ref(`rooms/${currentRoomId}/messages`).off('value', messagesListener);
        }
        currentRoom = null;
        currentRoomId = null;
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

// Firebase Real-time Database for Chat
function loadChatRooms() {
    // Remove old listener if exists
    if (roomsListener) {
        window.firebaseDB.ref('rooms').off('value', roomsListener);
    }

    // Listen for real-time updates to rooms
    roomsListener = window.firebaseDB.ref('rooms').on('value', (snapshot) => {
        chatRooms = snapshot.val() || {};
        renderRooms();
    });
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
    const roomExists = Object.values(chatRooms).some(r => r.name === name);
    if (roomExists) {
        alert('Room with this name already exists');
        return;
    }

    // Create new room in Firebase
    const newRoomRef = window.firebaseDB.ref('rooms').push();
    const roomId = newRoomRef.key;

    const room = {
        name: name,
        password: password,
        createdAt: new Date().toISOString()
    };

    newRoomRef.set(room).then(() => {
        newRoomName.value = '';
        newRoomPassword.value = '';
        closeModal(createRoomModal);

        // Auto-enter the room
        enterRoom(roomId, room);
    }).catch((error) => {
        alert('Error creating room: ' + error.message);
    });
}

// Join Room
function joinRoom() {
    const name = joinRoomName.value.trim();
    const password = joinRoomPassword.value.trim();

    if (!name || !password) {
        alert('Please enter both room name and password');
        return;
    }

    // Find room by name
    let foundRoomId = null;
    let foundRoom = null;

    for (const [roomId, room] of Object.entries(chatRooms)) {
        if (room.name === name) {
            foundRoomId = roomId;
            foundRoom = room;
            break;
        }
    }

    if (!foundRoom) {
        alert('Room not found');
        return;
    }

    if (foundRoom.password !== password) {
        alert('Incorrect password');
        return;
    }

    joinRoomName.value = '';
    joinRoomPassword.value = '';
    closeModal(joinRoomModal);

    enterRoom(foundRoomId, foundRoom);
}

// Enter Room
function enterRoom(roomId, room) {
    currentRoomId = roomId;
    currentRoom = room;
    currentRoomName.textContent = room.name;

    roomSelection.style.display = 'none';
    chatView.style.display = 'flex';

    // Remove old message listener if exists
    if (messagesListener) {
        window.firebaseDB.ref(`rooms/${currentRoomId}/messages`).off('value', messagesListener);
    }

    // Listen for real-time messages
    messagesListener = window.firebaseDB.ref(`rooms/${roomId}/messages`).on('value', (snapshot) => {
        const messages = snapshot.val();
        renderMessages(messages);
    });

    messageInput.focus();
}

// Render Rooms
function renderRooms() {
    // Don't show any rooms - users must know room name and password to join
    roomsContainer.innerHTML = '<p class="no-rooms">Enter a room name and password to join or create a room.</p>';
}

// Send Message
function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !currentRoomId) return;

    const message = {
        text: text,
        timestamp: new Date().toISOString(),
        sender: username
    };

    // Push message to Firebase
    window.firebaseDB.ref(`rooms/${currentRoomId}/messages`).push(message)
        .then(() => {
            messageInput.value = '';
            messageInput.focus();
        })
        .catch((error) => {
            alert('Error sending message: ' + error.message);
        });
}

// Render Messages
function renderMessages(messages) {
    if (!messages) {
        messagesList.innerHTML = '<p class="no-messages">No messages yet. Start the conversation!</p>';
        return;
    }

    const messagesArray = Object.values(messages);

    if (messagesArray.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No messages yet. Start the conversation!</p>';
        return;
    }

    messagesList.innerHTML = '';
    messagesArray.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';

        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Highlight own messages
        const isOwnMessage = msg.sender === username;
        if (isOwnMessage) {
            msgDiv.classList.add('own-message');
        }

        msgDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${msg.sender}${isOwnMessage ? ' (You)' : ''}</span>
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

