const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
let translations = { ru: {}, en: {} };
let currentLang = 'ru';

// 1. Определение языка из URL или браузера
function detectBrowserLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'ru' || langParam === 'en')) {
        return langParam;
    }
    const browserLang = (navigator.language || 'ru').substring(0, 2);
    return browserLang === 'en' ? 'en' : 'ru';
}

// 2. Загрузка данных из облака с защитой от зависания
async function loadDataFromCloud() {
    const initialLang = detectBrowserLanguage();
    currentLang = initialLang;

    try {
        console.log("Запрос данных из Google Таблицы...");
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.text();
        const rows = data.replace(/\r\n/g, '\n').split('\n');
        
        if (rows.length < 2) throw new Error("Таблица пуста или имеет неверный формат");

        const headers = rows[0].split('\t').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        const ruIndex = headers.indexOf('RU');
        const enIndex = headers.indexOf('EN');
        
        if (ruIndex === -1 || enIndex === -1) {
            console.error("Не найдены колонки RU или EN в заголовках:", headers);
        }

        for (let i = 1; i < rows.length; i++) {
            const rowText = rows[i];
            if (!rowText.trim()) continue;

            const cols = rowText.split('\t');
            const key = cols[0] ? cols[0].trim().replace(/^"(.*)"$/, '$1') : '';
            
            if (key) {
                translations.ru[key] = (cols[ruIndex] !== undefined) ? cols[ruIndex].trim().replace(/^"(.*)"$/, '$1') : '';
                translations.en[key] = (cols[enIndex] !== undefined) ? cols[enIndex].trim().replace(/^"(.*)"$/, '$1') : '';
            }
        }
        console.log("Словарь успешно загружен:", translations);

    } catch (error) {
        console.error('Ошибка связи с облаком:', error);
    } finally {
        // Гарантированно отрисовываем интерфейс в любом случае (успех или ошибка)
        setLanguage(initialLang);
    }
}

// 3. Переключение языка и обновление текстов на странице
function setLanguage(lang) {
    currentLang = lang;
    
    const btnRu = document.getElementById('btn-ru');
    const btnEn = document.getElementById('btn-en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    // Берем данные из словаря или подставляем надежный фолбэк, если таблица еще недоступна
    const dict = translations[lang] || {};
    
    const windowTitle = dict['window-title'] || (lang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф");
    document.title = (lang === 'en' ? "Home - " : "Стартовая страница - ") + windowTitle;

    const sloganEl = document.getElementById('t-slogan');
    if (sloganEl) {
        sloganEl.innerHTML = dict['slogan'] || (lang === 'en' ? "Peace of mind,<br>even if tomorrow never comes." : "Спокойствие,<br>даже если завтра не наступит.");
    }

    const findPlanEl = document.getElementById('t-find-plan');
    if (findPlanEl) {
        findPlanEl.innerText = dict['find plan'] || (lang === 'en' ? "Find your plan" : "Выберите ваш план");
    }
}

function goToForm() {
    window.location.href = `form.html?lang=${currentLang}`;
}

// Старт загрузки при открытии страницы
loadDataFromCloud();
