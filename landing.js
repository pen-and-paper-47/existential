const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
let translations = {};
let currentLang = 'ru';

// 1. Определение языка из URL или браузера
function detectBrowserLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'ru' || langParam === 'en')) {
        return langParam;
    }

    const browserLang = (navigator.language || navigator.userLanguage || 'ru').substring(0, 2);
    return browserLang === 'en' ? 'en' : 'ru';
}

// 2. Моментальное выставление состояния загрузки до ответа Google Таблицы
function applyInitialLoadingState(lang) {
    currentLang = lang;
    const loadingText = lang === 'en' ? 'Loading...' : 'Загрузка...';
    
    document.title = lang === 'en' ? 'Home - Form 404-Aleph' : 'Стартовая страница - Форма 404-Алеф';
    
    const sloganEl = document.getElementById('t-slogan');
if (sloganEl) sloganEl.innerHTML = dict['slogan'] || (lang === 'en' ? "Peace of mind, <br> even if tomorrow never comes." : "Спокойствие, даже <br> если завтра не наступит.");

    const findPlanBtn = document.getElementById('t-find-plan');
    if (findPlanBtn) findPlanBtn.innerText = loadingText;

    const btnRu = document.getElementById('btn-ru');
    const btnEn = document.getElementById('btn-en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
}

// 3. Загрузка данных из облака
async function loadDataFromCloud() {
    const initialLang = detectBrowserLanguage();
    applyInitialLoadingState(initialLang);

    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        const rows = data.split('\n');
        if (rows.length < 2) throw new Error("Пустая таблица");

        const headers = rows[0].split('\t').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        
        const keyIndex = 0;
        const ruIndex = headers.indexOf('RU');
        const enIndex = headers.indexOf('EN');
        
        translations = { ru: {}, en: {} };

        for (let i = 1; i < rows.length; i++) {
            const rowText = rows[i].trim();
            if (!rowText) continue;

            const cols = rowText.split('\t');
            const key = cols[keyIndex] ? cols[keyIndex].trim().replace(/^"(.*)"$/, '$1') : '';
            
            if (key) {
                translations.ru[key] = (cols[ruIndex] !== undefined) ? cols[ruIndex].trim().replace(/^"(.*)"$/, '$1') : '';
                translations.en[key] = (cols[enIndex] !== undefined) ? cols[enIndex].trim().replace(/^"(.*)"$/, '$1') : '';
            }
        }

        setLanguage(initialLang);

    } catch (error) {
        console.error('Ошибка связи с облаком:', error);
        document.getElementById('t-slogan').innerText = initialLang === 'en' ? "Peace of mind, even if tomorrow never comes." : "Спокойствие, даже если завтра не наступит.";
        document.getElementById('t-find-plan').innerText = initialLang === 'en' ? "Find your plan" : "Выберете ваш план";
        
        const videoPlaceholder = document.getElementById('t-video-placeholder');
        if (videoPlaceholder) {
            videoPlaceholder.innerText = initialLang === 'en' ? "[ A generated video of happy Israelis will be placed here ]" : "[ Здесь будет сгенерированное видео со счастливыми израильтянами ]";
        }
    }
}

// 4. Переключение языка и обновление текстов
function setLanguage(lang) {
    currentLang = lang;
    
    const btnRu = document.getElementById('btn-ru');
    const btnEn = document.getElementById('btn-en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    
    const dict = translations[lang];
    if (dict) {
        const windowTitle = dict['window-title'] || (lang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф");
        document.title = (lang === 'en' ? "Home - " : "Стартовая страница - ") + windowTitle;

        const sloganEl = document.getElementById('t-slogan');
        if (sloganEl) sloganEl.innerText = dict['slogan'] || (lang === 'en' ? "Peace of mind, even if tomorrow never comes." : "Спокойствие, даже если завтра не наступит.");

        const findPlanEl = document.getElementById('t-find-plan');
        if (findPlanEl) findPlanEl.innerText = dict['find plan'] || (lang === 'en' ? "Find your plan" : "Выберете ваш план");
        
        const videoPlaceholder = document.getElementById('t-video-placeholder');
        if (videoPlaceholder) {
            videoPlaceholder.innerText = dict['video-placeholder'] || (lang === 'en' ? "[ A generated video of happy Israelis will be placed here ]" : "[ Здесь будет сгенерированное видео со счастливыми израильтянами ]");
        }
    }
}

function goToForm() {
    window.location.href = `form.html?lang=${currentLang}`;
}

loadDataFromCloud();
