const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
let translations = { ru: {}, en: {} };
let currentLang = 'ru';

function detectBrowserLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'ru' || langParam === 'en')) {
        return langParam;
    }
    const browserLang = (navigator.language || 'ru').substring(0, 2);
    return browserLang === 'en' ? 'en' : 'ru';
}

async function loadDataFromCloud() {
    const initialLang = detectBrowserLanguage();
    currentLang = initialLang;
    
    // Сразу показываем тексты по умолчанию
    applyInitialLoadingState(initialLang);

    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.text();
        const rows = data.replace(/\r\n/g, '\n').split('\n');
        
        if (rows.length < 2) throw new Error("Таблица пуста");

        const headers = rows[0].split('\t').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        const ruIndex = headers.indexOf('RU');
        const enIndex = headers.indexOf('EN');
        
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
    } catch (error) {
        console.error('Ошибка связи с облаком:', error);
    } finally {
        // Применяем скачанные тексты
        applyInitialLoadingState(currentLang);
    }
}

function applyInitialLoadingState(lang) {
    currentLang = lang;
    const dict = translations[lang] || {};
    
    // 1. ПЕРЕВОД ЗАГОЛОВКА СЛЕВА
    const titleEl = document.getElementById('t-window-title');
    if (titleEl) {
        titleEl.innerText = dict['window-title'] || (lang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф");
    }

    document.title = (lang === 'en' ? "Home - " : "Стартовая страница - ") + (dict['window-title'] || "Форма 404-Алеф");
    
    // 2. ПЕРЕВОД СЛОГАНА И КНОПКИ
    const sloganEl = document.getElementById('t-slogan');
    if (sloganEl) {
        sloganEl.innerHTML = dict['slogan'] || (lang === 'en' ? "Peace of mind,<br>even if tomorrow never comes." : "Спокойствие,<br>даже если завтра не наступит.");
    }

    const findPlanBtn = document.getElementById('t-find-plan');
    if (findPlanBtn) {
        findPlanBtn.innerText = dict['find plan'] || (lang === 'en' ? "Find your plan" : "Выберите ваш план");
    }

    // 3. ВИЗУАЛЬНЫЙ ОТКЛИК КНОПОК
    const btnRuDesk = document.getElementById('btn-ru-desk');
    const btnEnDesk = document.getElementById('btn-en-desk');
    
    if (btnRuDesk) {
        if (lang === 'ru') btnRuDesk.classList.add('active');
        else btnRuDesk.classList.remove('active');
    }
    
    if (btnEnDesk) {
        if (lang === 'en') btnEnDesk.classList.add('active');
        else btnEnDesk.classList.remove('active');
    }

    // 4. ДРОПДАУН ДЛЯ МОБИЛЬНЫХ
    const langLabel = document.getElementById('current-lang-label');
    if (langLabel) {
        langLabel.innerText = lang === 'en' ? 'EN' : 'RU';
    }

    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('show');
}

// Вызывается при клике на кнопки языков в HTML
function setLanguage(lang) {
    applyInitialLoadingState(lang);
}

// Открытие/закрытие мобильного дропдауна
function toggleLangDropdown() {
    const menu = document.getElementById('langMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Закрытие дропдауна при клике мимо
window.addEventListener('click', function(e) {
    if (!e.target.closest('.lang-dropdown-mobile')) {
        const menu = document.getElementById('langMenu');
        if (menu && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    }
});

// Переход на вторую страницу
function goToForm() {
    window.location.href = `form.html?lang=${currentLang}`;
}

// Запуск при открытии
loadDataFromCloud();
