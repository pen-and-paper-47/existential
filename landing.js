const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
let translations = { ru: {}, en: {} };
let currentLang = 'ru';

function applyInitialLoadingState(lang) {
    currentLang = lang;
    const dict = translations[lang] || {}; // Объявляем dict для текущего языка
    
    document.title = (lang === 'en' ? "Home - " : "Стартовая страница - ") + (dict['window-title'] || "Форма 404-Алеф");
    
    const sloganEl = document.getElementById('t-slogan');
    if (sloganEl) {
        sloganEl.innerHTML = dict['slogan'] || (lang === 'en' ? "Peace of mind,<br>even if tomorrow never comes." : "Спокойствие,<br>даже если завтра не наступит.");
    }

    const findPlanBtn = document.getElementById('t-find-plan');
    if (findPlanBtn) {
        findPlanBtn.innerText = dict['find plan'] || (lang === 'en' ? "Find your plan" : "Выберите ваш план");
    }

    // В файле landing.js в функции applyInitialLoadingState добавьте обновление заголовка:
    const titleEl = document.getElementById('t-window-title');
    if (titleEl) {
        titleEl.innerText = dict['window-title'] || (lang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф");
    }
    
    const btnRu = document.getElementById('btn-ru');
    const btnEn = document.getElementById('btn-en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
}

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
// Открытие/закрытие мобильного дропдауна языков
function toggleLangDropdown() {
    const menu = document.getElementById('langMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Закрытие дропдауна при клике вне его
window.addEventListener('click', function(e) {
    if (!e.target.closest('.lang-dropdown-mobile')) {
        const menu = document.getElementById('langMenu');
        if (menu && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    }
});

// Обновление текстов (включая заголовок слева) при смене языка
function applyInitialLoadingState(lang) {
    currentLang = lang;
    const dict = translations[lang] || {};
    
    // Перевод заголовка слева
    const titleEl = document.getElementById('t-window-title');
    if (titleEl) {
        titleEl.innerText = dict['window-title'] || (lang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф");
    }

    document.title = (lang === 'en' ? "Home - " : "Стартовая страница - ") + (dict['window-title'] || "Форма 404-Алеф");
    
    const sloganEl = document.getElementById('t-slogan');
    if (sloganEl) {
        sloganEl.innerHTML = dict['slogan'] || (lang === 'en' ? "Peace of mind,<br>even if tomorrow never comes." : "Спокойствие,<br>даже если завтра не наступит.");
    }

    const findPlanBtn = document.getElementById('t-find-plan');
    if (findPlanBtn) {
        findPlanBtn.innerText = dict['find plan'] || (lang === 'en' ? "Find your plan" : "Выберите ваш план");
    }

    // Обновление активных состояний десктопных кнопок
    const btnRuDesk = document.getElementById('btn-ru-desk');
    const btnEnDesk = document.getElementById('btn-en-desk');
    if (btnRuDesk) btnRuDesk.classList.toggle('active', lang === 'ru');
    if (btnEnDesk) btnEnDesk.classList.toggle('active', lang === 'en');

    // Обновление метки в мобильном дропдауне
    const langLabel = document.getElementById('current-lang-label');
    if (langLabel) {
        langLabel.innerText = lang === 'en' ? 'EN' : 'RU';
    }

    // Закрываем меню при смене языка
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('show');
}
// Старт загрузки при открытии страницы
loadDataFromCloud();
