// Хранилище данных
let tickets = JSON.parse(localStorage.getItem('gsk98_tickets')) || [];
let selectedConcert = null;

// Выбор концерта
function selectConcert(number) {
    // Убрать выделение со всех карточек
    document.querySelectorAll('.concert-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Выделить выбранную
    event.currentTarget.classList.add('selected');
    
    // Сохранить выбор
    const concerts = [
        { date: "27.05.2026", type: "medium", name: "27 МАЯ - СРЕДНИЙ" },
        { date: "28.05.2026", type: "low", name: "28 МАЯ - НИЗКИЙ" },
        { date: "29.05.2026", type: "high", name: "29 МАЯ - ВЫСОКИЙ" }
    ];
    
    selectedConcert = concerts[number - 1];
    
    // Активировать кнопку
    document.getElementById('getTicketBtn').disabled = false;
}

// Получение билета
function getTicket() {
    if (!selectedConcert) {
        alert("Сначала выберите концерт!");
        return;
    }
    
    // Запрос данных пользователя
    const name = prompt("Введите ваше ФИО:");
    if (!name) {
        alert("Имя обязательно!");
        return;
    }
    
    const phone = prompt("Введите ваш телефон:");
    if (!phone) {
        alert("Телефон обязателен!");
        return;
    }
    
    const email = prompt("Введите ваш email:");
    
    // Генерация кода билета
    const code = generateTicketCode();
    
    // Создание билета
    const ticket = {
        id: Date.now(),
        code: code,
        concert: selectedConcert,
        user: {
            name: name,
            phone: phone,
            email: email || "-",
            date: new Date().toLocaleString('ru-RU')
        },
        createdAt: new Date().toISOString()
    };
    
    // Сохранить в массив
    tickets.push(ticket);
    
    // Сохранить в localStorage
    localStorage.setItem('gsk98_tickets', JSON.stringify(tickets));
    
    // Показать результат
    showTicketResult(ticket);
}

// Генерация кода
function generateTicketCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    
    // 3 буквы
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // 5 цифр
    for (let i = 0; i < 5; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // 4 буквы
    for (let i = 0; i < 4; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    return code;
}

// Показать результат
function showTicketResult(ticket) {
    document.getElementById('ticketCode').textContent = ticket.code;
    document.getElementById('userInfo').innerHTML = `
        👤 ${ticket.user.name}<br>
        📱 ${ticket.user.phone}<br>
        📅 ${ticket.user.date}
    `;
    document.getElementById('ticketResult').style.display = 'block';
    
    // Прокрутить к результату
    document.getElementById('ticketResult').scrollIntoView({ behavior: 'smooth' });
}

// АДМИН ПАНЕЛЬ
function openAdmin() {
    document.getElementById('adminPanel').style.display = 'flex';
}

function closeAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
}

// Вход админа
function loginAdmin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    
    if (user === 'Admin226' && pass === 'adminsetps2026') {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminTools').style.display = 'block';
    } else {
        alert('Неверный логин или пароль!');
    }
}

// Проверка билета
function checkTicket() {
    const code = document.getElementById('checkCode').value.trim().toUpperCase();
    const resultDiv = document.getElementById('checkResult');
    
    if (!code) {
        alert('Введите код билета!');
        return;
    }
    
    // Найти билет
    const ticket = tickets.find(t => t.code === code);
    
    if (ticket) {
        resultDiv.innerHTML = `
            ✅ <strong>КОД НАЙДЕН</strong><br><br>
            <strong>Код:</strong> ${ticket.code}<br>
            <strong>Концерт:</strong> ${ticket.concert.name}<br>
            <strong>Дата:</strong> ${ticket.concert.date}<br><br>
            <strong>Покупатель:</strong> ${ticket.user.name}<br>
            <strong>Телефон:</strong> ${ticket.user.phone}<br>
            <strong>Email:</strong> ${ticket.user.email}<br>
            <strong>Куплен:</strong> ${ticket.user.date}
        `;
        resultDiv.className = 'check-result valid';
    } else {
        resultDiv.innerHTML = '❌ КОД НЕ НАЙДЕН';
        resultDiv.className = 'check-result invalid';
    }
    
    resultDiv.style.display = 'block';
    document.getElementById('checkCode').value = '';
}

// Экспорт данных
function exportData() {
    const data = {
        exportDate: new Date().toLocaleString('ru-RU'),
        totalTickets: tickets.length,
        tickets: tickets
    };
    
    const json = JSON.stringify(data, null, 2);
    
    // Создать файл для скачивания
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gsk98_tickets_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Экспортировано ${tickets.length} билетов`);
}

// Загрузка данных при запуске
window.onload = function() {
    // Блокируем кнопку до выбора концерта
    document.getElementById('getTicketBtn').disabled = true;
    
    // Автовыбор первого концерта
    setTimeout(() => {
        selectConcert(1);
    }, 100);
};