// Конфигурация - ЗАМЕНИТЕ НА ВАШ НОВЫЙ URL!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyPU8465f_lF1ZJd3JYTae4if7_EesGTOSzIJlZw3OmC4gZiVhemgqPkp3EKcA82M_3/exec';

// Данные
let tickets = JSON.parse(localStorage.getItem('gsk98_tickets')) || [];
let selectedConcert = null;

// Выбор концерта
function selectConcert(number) {
    document.querySelectorAll('.concert-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    const concerts = [
        { date: "27.05.2026", type: "medium", name: "27 МАЯ - СРЕДНИЙ" },
        { date: "28.05.2026", type: "low", name: "28 МАЯ - НИЗКИЙ" },
        { date: "29.05.2026", type: "high", name: "29 МАЯ - ВЫСОКИЙ" }
    ];
    
    selectedConcert = concerts[number - 1];
    document.getElementById('getTicketBtn').disabled = false;
}

// Получение билета
async function getTicket() {
    if (!selectedConcert) {
        alert('Сначала выберите концерт!');
        return;
    }
    
    const name = prompt("Введите ваше ФИО:");
    if (!name || name.trim().length < 2) {
        alert('Имя обязательно! (минимум 2 символа)');
        return;
    }
    
    const phone = prompt("Введите ваш телефон:");
    if (!phone || phone.replace(/\D/g, '').length < 10) {
        alert('Телефон обязателен!');
        return;
    }
    
    const email = prompt("Введите ваш email (необязательно):");
    
    const code = generateTicketCode();
    showLoading(true);
    
    try {
        // Пытаемся сохранить в Google Sheets
        const saved = await saveToGoogleSheets({
            code: code,
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.trim() : 'не указан',
            concertName: selectedConcert.name,
            concertDate: selectedConcert.date
        });
        
        // Сохраняем локально в любом случае
        const ticket = {
            id: Date.now(),
            code: code,
            concert: selectedConcert,
            user: {
                name: name.trim(),
                phone: phone.trim(),
                email: email ? email.trim() : '-',
                date: new Date().toLocaleString('ru-RU')
            },
            savedToGoogle: saved.success
        };
        
        tickets.push(ticket);
        localStorage.setItem('gsk98_tickets', JSON.stringify(tickets));
        
        // Показываем результат
        showTicketResult(ticket);
        
        if (saved.success) {
            alert('✅ Билет успешно создан и сохранен в Google Sheets!');
        } else {
            alert('⚠️ Билет создан локально. Данные в Google Sheets НЕ сохранены.\nОшибка: ' + saved.message);
        }
        
    } catch (error) {
        // Если ошибка, все равно сохраняем локально
        const ticket = {
            id: Date.now(),
            code: code,
            concert: selectedConcert,
            user: {
                name: name.trim(),
                phone: phone.trim(),
                email: email ? email.trim() : '-',
                date: new Date().toLocaleString('ru-RU')
            },
            savedToGoogle: false
        };
        
        tickets.push(ticket);
        localStorage.setItem('gsk98_tickets', JSON.stringify(tickets));
        
        showTicketResult(ticket);
        alert('⚠️ Билет создан только локально. Google Sheets недоступен.');
        
    } finally {
        showLoading(false);
    }
}

// Сохранение в Google Sheets
async function saveToGoogleSheets(data) {
    try {
        // Вариант 1: Обычный fetch
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            return { success: false, message: 'HTTP ошибка: ' + response.status };
        }
        
    } catch (error) {
        // Вариант 2: JSONP для обхода CORS
        try {
            const jsonpResult = await saveViaJSONP(data);
            return jsonpResult;
        } catch (jsonpError) {
            return { success: false, message: 'Ошибка сети: ' + error.message };
        }
    }
}

// Альтернативный метод через JSONP (обход CORS)
function saveViaJSONP(data) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Date.now();
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        const script = document.createElement('script');
        const url = GOOGLE_SCRIPT_URL + '?callback=' + callbackName + '&data=' + encodeURIComponent(JSON.stringify(data));
        script.src = url;
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP failed'));
        };
        
        document.body.appendChild(script);
        
        // Таймаут
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Timeout'));
            }
        }, 10000);
    });
}

// Генерация кода
function generateTicketCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    
    for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * 26)];
    for (let i = 0; i < 5; i++) code += numbers[Math.floor(Math.random() * 10)];
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * 26)];
    
    return code;
}

// Показать результат
function showTicketResult(ticket) {
    document.getElementById('ticketCode').textContent = ticket.code;
    document.getElementById('userInfo').innerHTML = `
        👤 <strong>${ticket.user.name}</strong><br>
        📱 ${ticket.user.phone}<br>
        📧 ${ticket.user.email}
    `;
    document.getElementById('concertInfo').innerHTML = `
        🎵 ${ticket.concert.name}<br>
        📅 ${ticket.concert.date}<br>
        🕒 ${ticket.user.date}<br>
        ${ticket.savedToGoogle ? '✅ В Google Sheets' : '⚠️ Только локально'}
    `;
    document.getElementById('ticketResult').style.display = 'block';
    document.getElementById('ticketResult').scrollIntoView({ behavior: 'smooth' });
}

// АДМИН ПАНЕЛЬ
function openAdmin() {
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('serverUrl').textContent = GOOGLE_SCRIPT_URL;
    updateAdminStats();
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
async function checkTicket() {
    const code = document.getElementById('checkCode').value.trim().toUpperCase();
    const resultDiv = document.getElementById('checkResult');
    
    if (!code) {
        alert('Введите код билета!');
        return;
    }
    
    // 1. Проверяем локально
    const localTicket = tickets.find(t => t.code === code);
    
    if (localTicket) {
        resultDiv.innerHTML = `
            ✅ <strong>КОД НАЙДЕН ЛОКАЛЬНО</strong><br><br>
            <strong>Код:</strong> ${localTicket.code}<br>
            <strong>Концерт:</strong> ${localTicket.concert.name}<br>
            <strong>Дата:</strong> ${localTicket.concert.date}<br><br>
            <strong>Покупатель:</strong> ${localTicket.user.name}<br>
            <strong>Телефон:</strong> ${localTicket.user.phone}<br>
            <strong>Email:</strong> ${localTicket.user.email}<br>
            <strong>Куплен:</strong> ${localTicket.user.date}<br>
            <strong>Google Sheets:</strong> ${localTicket.savedToGoogle ? '✅' : '❌'}
        `;
        resultDiv.className = 'check-result valid';
        resultDiv.style.display = 'block';
        document.getElementById('checkCode').value = '';
        return;
    }
    
    // 2. Если нет локально, проверяем Google Sheets
    resultDiv.innerHTML = '🔍 Ищем в Google Sheets...';
    resultDiv.className = 'check-result';
    resultDiv.style.display = 'block';
    
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?code=${encodeURIComponent(code)}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.found) {
                resultDiv.innerHTML = `
                    ✅ <strong>КОД НАЙДЕН В GOOGLE SHEETS</strong><br><br>
                    <strong>Код:</strong> ${data.ticket.code}<br>
                    <strong>Концерт:</strong> ${data.ticket.concertName}<br>
                    <strong>Дата:</strong> ${data.ticket.concertDate}<br><br>
                    <strong>Покупатель:</strong> ${data.ticket.name}<br>
                    <strong>Телефон:</strong> ${data.ticket.phone}<br>
                    <strong>Email:</strong> ${data.ticket.email}<br>
                    <strong>Куплен:</strong> ${data.ticket.purchaseDate}<br>
                    <strong>Статус:</strong> ${data.ticket.status || 'АКТИВЕН'}
                `;
                resultDiv.className = 'check-result valid';
            } else {
                resultDiv.innerHTML = '❌ Код не найден ни в локальной базе, ни в Google Sheets';
                resultDiv.className = 'check-result invalid';
            }
        } else {
            resultDiv.innerHTML = '❌ Ошибка подключения к Google Sheets';
            resultDiv.className = 'check-result invalid';
        }
    } catch (error) {
        resultDiv.innerHTML = '❌ Google Sheets недоступен';
        resultDiv.className = 'check-result invalid';
    }
    
    document.getElementById('checkCode').value = '';
}

// Экспорт данных
function exportData() {
    const data = {
        exportDate: new Date().toLocaleString('ru-RU'),
        totalTickets: tickets.length,
        googleScriptURL: GOOGLE_SCRIPT_URL,
        tickets: tickets
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsk98_tickets_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Экспортировано ${tickets.length} локальных билетов`);
}

// Обновить статистику
function updateAdminStats() {
    const googleSheetsCount = tickets.filter(t => t.savedToGoogle).length;
    document.getElementById('totalTickets').textContent = 
        `${tickets.length} (в Google Sheets: ${googleSheetsCount})`;
}

// Показать/скрыть загрузку
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('getTicketBtn').disabled = true;
    document.getElementById('ticketResult').style.display = 'none';
    
    // Автовыбор первого концерта
    setTimeout(() => {
        if (document.querySelector('.concert-card')) {
            document.querySelector('.concert-card').click();
        }
    }, 100);
    
    // Закрытие админки по клику вне окна
    document.getElementById('adminPanel').addEventListener('click', function(e) {
        if (e.target.id === 'adminPanel') {
            closeAdmin();
        }
    });
});
