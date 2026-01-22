// Сохранение в Google Sheets
async function saveToGoogleSheets(data) {
    try {
        // Прямой fetch с CORS
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return { success: false, message: 'Ошибка сети' };
    }
}
