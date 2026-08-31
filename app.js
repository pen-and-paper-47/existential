const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz7Jhxo2oqUMv0ujXOXyGE7Uj7JwMCvKwhkAFU_AKzaudXnR9EzpN00GOG90dmjqGmfHA/exec';

let translations = {};
let currentLang = 'ru';
let inactivityTimer;
let countdownInterval;
let timeLeft = 15;
let loaderInterval; // Объявляем таймер только один раз!
let finalCountdownInterval;

// 1. Читаем язык из URL или браузера
const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang');
if (langParam && (langParam === 'ru' || langParam === 'en')) {
    currentLang = langParam;
} else {
    const browserLang = (navigator.language || 'ru').substring(0, 2);
    currentLang = browserLang === 'en' ? 'en' : 'ru';
}

// Моментальный перевод слова "Загрузка..." до скачивания таблицы
document.getElementById('t-window-title').innerText = currentLang === 'en' ? "Loading..." : "Загрузка...";

async function loadDataFromCloud() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        const rows = data.split('\n');
        if (rows.length < 2) throw new Error("Empty TSV");

        const headers = rows[0].split('\t').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        const ruIndex = headers.indexOf('RU');
        const enIndex = headers.indexOf('EN');
        
        translations = { ru: {}, en: {} };

        for (let i = 1; i < rows.length; i++) {
            const line = rows[i].trim();
            if (!line) continue;
            const cols = line.split('\t');
            const key = cols[0] ? cols[0].trim().replace(/^"(.*)"$/, '$1') : '';
            if (key) {
                translations.ru[key] = cols[ruIndex] !== undefined ? cols[ruIndex].trim().replace(/^"(.*)"$/, '$1') : '';
                translations.en[key] = cols[enIndex] !== undefined ? cols[enIndex].trim().replace(/^"(.*)"$/, '$1') : '';
            }
        }
        applyLanguage();
    } catch (error) {
        console.error('Loading error:', error);
        document.getElementById('t-window-title').innerText = currentLang === 'en' ? "Form 404-Aleph" : "Форма 404-Алеф";
    }
}

// ==========================================
// ФУНКЦИИ-ПРЕДОХРАНИТЕЛИ И СЛОВАРЬ
// ==========================================
function setElText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.innerHTML = text; 
}

function setElPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.placeholder = text;
}

function applyLanguage() {
    const dict = translations[currentLang] || {};
    
    // --- ГЛОБАЛЬНЫЕ ЭЛЕМЕНТЫ ---
    setElText('t-window-title', dict['window-title']);
    setElText('t-warning', dict['warning']);

    // --- БЛОК 1 ---
    setElText('t-name', dict['name']);
    setElPlaceholder('t-name-placeholder', dict['name-placeholder']);
    setElText('t-anxiety', dict['anxiety']);
    setElText('t-wear', dict['wear']);
    setElText('t-wear-desc', dict['wear-desc']);
    setElText('t-news', dict['news']);
    setElText('t-news-1', dict['news-1'] || (currentLang === 'ru' ? "Менее 15 минут" : "Less than 15 min"));
    setElText('t-news-2', dict['news-2'] || (currentLang === 'ru' ? "Более 15 минут" : "More than 15 min"));
    setElText('t-consent-text', dict['consent-text']);
    setElText('t-next-btn', dict['next-btn']);
    
    // --- БЛОК 2 ---
    setElText('t-risks-title', dict['risks-title']);
    setElText('t-pay-btn', dict['pay-btn']);
    setElText('t-back-1', dict['back-1']);
    
    const risksContainer = document.getElementById('risks-container');
    if (risksContainer) {
        risksContainer.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            if (dict[`risk${i}`]) {
                risksContainer.innerHTML += `
                    <label class="risk-card">
                        <input type="checkbox" name="risks" value="risk${i}">
                        <span>${dict[`risk${i}`]}</span>
                    </label>
                `;
            }
        }
    }

    // --- БЛОК 3 ---
    setElText('t-pay-title', dict['pay-title']);
    setElText('t-pay-1', dict['pay-1']);
    setElText('t-pay-2', dict['pay-2']);
    setElText('t-pay-3', dict['pay-3']);
    setElText('t-pay-4', dict['pay-4']); 
    
    setElText('t-info-nerves', dict['info-nerves']);
    setElText('t-info-sleep', dict['info-sleep']);
    setElText('t-info-oblivion', dict['info-oblivion']);

    setElText('t-email-label', dict['email-label']);
    setElText('t-email-disclaimer', dict['email-disclaimer']);
    setElText('t-dob-label', dict['dob-label']);

    setElText('t-finish-btn', dict['finish-btn']);
    setElText('t-back-2', dict['back-2']);
    setElText('t-disclaimer', dict['disclaimer']);
    setElPlaceholder('userEmail', dict['email-placeholder'] || (currentLang === 'ru' ? "ваша@почта.com" : "your@email.com"));
    
    // --- МОДАЛЬНЫЕ ОКНА ---
    setElText('t-dob-modal-title', dict['dob-modal-title']);
    setElText('t-dob-confirm', dict['dob-confirm']);
    setElText('t-dob-cancel', dict['dob-cancel']);
    
    // --- БЛОК 4 И PDF ---
    setElText('t-thanks-title', dict['thanks-title'] || (currentLang === 'ru' ? "Спасибо за доверие" : "Thank you for your trust"));
    setElText('t-back-main', dict['back-main'] || (currentLang === 'ru' ? "Возврат на главную страницу" : "Return to main page"));
    setElText('pdf-signature-label', dict['pdf-signature-label'] || (currentLang === 'ru' ? "Подпись художника" : "Artist's signature"));
    setElText('t-thanks-disclaimer', dict['disclaimer']);

    // Обновление логических блоков
    const anxietySlider = document.getElementById('anxietySlider');
    if (anxietySlider) enforceMinAnxiety(anxietySlider);
    
    populateConflictSelect(currentLang);
    updateNewsSlider();
    calculatePremiums();
}

// ==========================================
// ЛОГИКА ФОРМЫ (ПОЛЗУНКИ И РАСЧЕТЫ)
// ==========================================
function populateConflictSelect(lang) {
    const select = document.getElementById('conflictSelect');
    if (!select) return;
    const cur = select.value || "0";
    select.innerHTML = '';
    const getRuWord = (num) => {
        const n = Math.abs(num) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return 'конфликтов';
        if (n1 > 1 && n1 < 5) return 'конфликта';
        if (n1 === 1) return 'конфликт';
        return 'конфликтов';
    };
    for (let i = 0; i <= 47; i++) {
        const label = lang === 'ru' ? `${i} ${getRuWord(i)}` : `${i} ${i === 1 ? 'conflict' : 'conflicts'}`;
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = label;
        if (i.toString() === cur) opt.selected = true;
        select.appendChild(opt);
    }
}

function updateNewsSlider() {
    const slider = document.getElementById('newsSlider');
    const textElement = document.getElementById('newsValText');
    if (!slider || !textElement) return;
    const val = slider.value; 
    const dict = translations[currentLang] || {};
    const key = `news-val-${val}`;
    textElement.classList.add('updating');
    setTimeout(() => {
        textElement.innerText = dict[key] || val;
        textElement.classList.remove('updating');
    }, 50);
}

function enforceMinAnxiety(slider) {
    if (slider.value < 4) slider.value = 4;
    const dict = translations[currentLang] || {};
    const key = `anxiety-val-${slider.value}`;
    const labelText = dict[key] || `${slider.value}`;
    const valEl = document.getElementById('anxietyVal');
    if (valEl) {
        valEl.classList.add('updating');
        setTimeout(() => {
            valEl.innerText = labelText;
            valEl.classList.remove('updating');
        }, 50);
    }
}

function calculatePremiums() {
    const anxiety = parseInt(document.getElementById('anxietySlider').value) || 4;
    const conflicts = parseInt(document.getElementById('conflictSelect').value) || 0;
    const news = parseInt(document.getElementById('newsSlider').value) || 0;
    const risks = document.querySelectorAll('input[name="risks"]:checked').length || 0;
    const dict = translations[currentLang] || {};

    const nervesCost = Math.floor((anxiety * 1.5 + conflicts * 0.8 + news * 2.5) * (risks * 1.2 + 1) * 1420);
    const sleepCost = Math.floor(anxiety * 12 + conflicts * 18 + news * 9 + risks * 32);
    let dataCost = ((anxiety * 0.7 + conflicts * 0.3 + news * 1.2 + risks * 2) * 10) / 10;

    const dobStr = document.getElementById('userDob').value;
    if (dobStr) {
        const birthYear = new Date(dobStr).getFullYear();
        if (birthYear > 1900 && birthYear <= 2026) {
            const age = 2026 - birthYear;
            dataCost += (age * 0.15);
        }
    }

    const totalLabel = currentLang === 'ru' ? 'Итого: ' : 'Total: ';
    document.getElementById('calc-nerves').innerText = `${totalLabel}${nervesCost.toLocaleString()} ${dict['unit-nerves'] || 'клеток'}`;
    document.getElementById('calc-sleep').innerText = `${totalLabel}${sleepCost.toLocaleString()} ${dict['unit-sleep'] || 'часов'}`;
    document.getElementById('calc-oblivion').innerText = `${totalLabel}${dict['unit-oblivion'] || '100% истории'}`;
    
    const dataBadge = document.getElementById('calc-data');
    const oldValMatch = dataBadge.innerText.match(/[\d\.]+/);
    const oldVal = oldValMatch ? parseFloat(oldValMatch[0]) : 0;
    const unitData = dict['unit-data'] || 'ТБ';

    if (dobStr && oldVal !== dataCost && document.getElementById('block3').classList.contains('active')) {
        animateValue(dataBadge, oldVal, dataCost, 1000, unitData, totalLabel);
    } else {
        dataBadge.innerText = `${totalLabel}${dataCost.toFixed(1)} ${unitData}`;
    }
}

function animateValue(obj, start, end, duration, unit, prefix) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = (start + (end - start) * progress).toFixed(1);
        obj.innerText = `${prefix}${current} ${unit}`;
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerText = `${prefix}${end.toFixed(1)} ${unit}`;
    };
    window.requestAnimationFrame(step);
}

// ==========================================
// НАВИГАЦИЯ И ГЕНЕРАЦИЯ
// ==========================================
function goToStep1() {
    document.getElementById('block2')?.classList.remove('active');
    document.getElementById('block3')?.classList.remove('active');
    document.getElementById('block1')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2() {
    const consentCheck = document.getElementById('consentCheck');
    const dict = translations[currentLang] || {};
    
    if (consentCheck && !consentCheck.checked) {
        alert(dict['alertConsent'] || (currentLang === 'ru' ? "Подтвердите согласие!" : "Please confirm your consent!"));
        return;
    }
    document.getElementById('block1')?.classList.remove('active');
    document.getElementById('block3')?.classList.remove('active');
    document.getElementById('block2')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep3() {
    document.getElementById('block1')?.classList.remove('active');
    document.getElementById('block2')?.classList.remove('active');
    document.getElementById('block3')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function collectFinalData() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    const email = document.getElementById('userEmail').value;
    const dict = translations[currentLang] || {};
    
    if (!selectedPayment) {
        alert(dict['alertConsent'] || (currentLang === 'ru' ? "Выберите метод списания!" : "Select payment method!"));
        return;
    }
    if (!email) {
        alert(dict['alert-email'] || (currentLang === 'ru' ? "Цифровой след (Email) обязателен!" : "Email is required!"));
        return;
    }

    const loader = document.getElementById('generation-loader');
    const loaderSubtext = document.getElementById('loader-subtext');
    const loaderTitle = document.getElementById('loader-title');
    
    if (loaderTitle) loaderTitle.innerText = currentLang === 'ru' ? "АЛЕФ-404" : "ALEPH-404";
    loader.style.display = 'flex';
    
    const phrasesRu = [
        "Инициализация ядра...",
        "Шифрование цифрового следа...", 
        "Оценка экзистенциальных рисков...", 
        "Синхронизация с Вечным Архивом...", 
        "Выдача Сертификата покрытия..."
    ];
    const phrasesEn = [
        "Initializing core...",
        "Encrypting digital footprint...", 
        "Evaluating existential risks...", 
        "Syncing with Eternal Archive...", 
        "Issuing Certificate of Coverage..."
    ];
    
    const phrases = currentLang === 'ru' ? phrasesRu : phrasesEn;
    let pIdx = 0;
    loaderSubtext.innerText = phrases[pIdx];
    
    loaderInterval = setInterval(() => {
        pIdx = (pIdx + 1) % phrases.length;
        loaderSubtext.innerText = phrases[pIdx];
    }, 1500);

    const finishBtn = document.getElementById('t-finish-btn');
    finishBtn.innerText = currentLang === 'ru' ? "Формирование документа..." : "Generating document...";
    finishBtn.disabled = true;

    const rawSlogan = dict['slogan'] || (currentLang === 'en' ? "Peace of mind,<br>even if tomorrow never comes." : "Спокойствие,<br>даже если завтра не наступит.");
    const cleanSlogan = rawSlogan.replace(/<br\s*\/?>/gi, ' ');

    document.getElementById('pdf-title-text').innerText = dict['window-title'] || (currentLang === 'ru' ? "СЕРТИФИКАТ ПОКРЫТИЯ" : "CERTIFICATE OF COVERAGE");
    document.getElementById('pdf-slogan').innerText = cleanSlogan; 
    
    const thanksSloganEl = document.getElementById('t-thanks-slogan');
    if (thanksSloganEl) thanksSloganEl.innerHTML = rawSlogan; // Тут с брейком строк!

    document.getElementById('pdf-name').innerText = document.getElementById('t-name-placeholder').value || (currentLang === 'ru' ? "Аноним" : "Anonymous");
    document.getElementById('pdf-anxiety').innerText = document.getElementById('anxietySlider').value;
    document.getElementById('pdf-payment').innerText = selectedPayment.nextElementSibling.innerText;

    let finalCost = "";
    if (selectedPayment.value === 'nerves') finalCost = document.getElementById('calc-nerves').innerText;
    else if (selectedPayment.value === 'sleep') finalCost = document.getElementById('calc-sleep').innerText;
    else if (selectedPayment.value === 'oblivion') finalCost = document.getElementById('calc-oblivion').innerText;
    else if (selectedPayment.value === 'data') finalCost = document.getElementById('calc-data').innerText;
    
    const costValueElement = document.getElementById('pdf-cost-value');
    if (costValueElement) {
        costValueElement.innerText = finalCost.replace(/Итого:\s*|Total:\s*/i, '');
    }

    const risksList = document.getElementById('pdf-risks-list');
    risksList.innerHTML = '';
    document.querySelectorAll('input[name="risks"]:checked').forEach(cb => {
        risksList.innerHTML += `<li>${cb.nextElementSibling.innerText}</li>`;
    });

    const pdfElement = document.getElementById('pdf-template');

    const opt = { 
        margin: 0, 
        filename: 'Form_404_Aleph.pdf', 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };

    html2pdf().set(opt).from(pdfElement).outputPdf('datauristring').then(function(pdfBase64) {
        const base64Data = pdfBase64.split(',')[1];
        
        fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ base64: base64Data, filename: 'Form_404_Aleph.pdf' }),
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        })
        .then(res => res.json())
        .then(data => {
            loader.style.display = 'none';
            clearInterval(loaderInterval);

            if (data.status === 'success') {
                window.open(data.url, '_blank');
                
               emailjs.send('service_kluawpl', 'template_34kowi9', {
                    email_to: email,
                    pdf_link: data.url,
                    email_subject: dict['email-sub'] || (currentLang === 'ru' ? "Форма 404-Алеф: Ваш План Защиты" : "Form 404-Aleph: Your Protection Plan"),
                    email_greeting: (dict['email-greet'] || (currentLang === 'ru' ? "Идентификатор субъекта:" : "Subject Identifier:")) + " " + (document.getElementById('t-name-placeholder').value || "Аноним"),
                    email_message: dict['email-msg'] || (currentLang === 'ru' ? "Ваша экзистенциальная фиксация успешно завершена." : "Your existential fixation is completed."),
                    email_btn: dict['email-btn'] || (currentLang === 'ru' ? "Открыть Сертификат" : "Open Certificate"),
                    
                    // НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ ПЕРЕВОДА ШАБЛОНА EMAILJS:
                    email_header: dict['window-title'] || (currentLang === 'ru' ? "ФОРМА 404-АЛЕФ" : "FORM 404-ALEPH"),
                    email_direct_link_text: dict['email-direct-link'] || (currentLang === 'ru' ? "Если кнопка не открывается, перейдите по прямой ссылке:" : "If the button doesn't work, use this direct link:"),
                    email_footer: dict['email-footer'] || (currentLang === 'ru' ? "Данное уведомление сформировано в рамках симуляции художественного бюрократического процесса. Настоящий документ не гарантирует устойчивость к энтропии мироздания." : "This notification is generated within the simulation of an artistic bureaucratic process. This document does not guarantee resistance to the entropy of the universe.")
                }).then(() => {
                    showThankYouScreen(email);
                });
            } else {
                throw new Error("Drive error");
            }
        })
        .catch(err => {
            loader.style.display = 'none';
            clearInterval(loaderInterval);
            
            alephAlert(dict['error-archive'] || "Ошибка Вечного Архива. Бюрократическая сингулярность.");
            finishBtn.innerText = dict['finish-btn'] || "Получить План Защиты";
            finishBtn.disabled = false;
        });
    });
}

function showThankYouScreen(email) {
    document.getElementById('block3')?.classList.remove('active');
    document.getElementById('block4')?.classList.add('active');
    
    const warningBanner = document.getElementById('t-warning');
    if (warningBanner) warningBanner.style.display = 'none';
    
    const msgElement = document.getElementById('thank-you-message');
    const dict = translations[currentLang] || {};
    const sentText = dict['thanks-msg-sent'] || (currentLang === 'ru' 
        ? "План защиты успешно сгенерирован и отправлен на ваш адрес:" 
        : "Protection Plan successfully generated and sent to:");

    if (email && msgElement) {
        msgElement.innerHTML = `
            <div style="background: #f1f8e9; border: 2px solid var(--growth-green); padding: 25px 20px; border-radius: 16px; box-shadow: 0 12px 30px rgba(76, 175, 80, 0.15); margin: 0 auto 30px; max-width: 450px;">
                <div style="font-size: 32px; margin-bottom: 12px;">📩</div>
                <span style="font-size: 15px; color: var(--text-main); display: block; margin-bottom: 12px; font-weight: 500;">${sentText}</span>
                <strong style="font-size: 18px; color: var(--growth-green); word-break: break-all;">${email}</strong>
            </div>`;
    }
    
    // --- Логика таймера на кнопке возврата ---
    const backBtn = document.getElementById('t-back-main');
    const backBtnText = dict['back-main'] || (currentLang === 'ru' ? "Возврат на главную страницу" : "Return to main page");
    let secondsLeft = 15;
    
    if (backBtn) {
        backBtn.innerText = `${backBtnText} (${secondsLeft})`;
        clearInterval(finalCountdownInterval);
        
        finalCountdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(finalCountdownInterval);
                resetToMain();
            } else {
                backBtn.innerText = `${backBtnText} (${secondsLeft})`;
            }
        }, 1000);
    }
    
    // Прокрутка экрана ровно к кнопке возврата
    setTimeout(() => {
        backBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
}

// ==========================================
// СИСТЕМНЫЕ ФУНКЦИИ И СЛУШАТЕЛИ
// ==========================================
function alephAlert(msg) {
    const dict = translations[currentLang] || {};
    document.querySelector('#aleph-alert-modal .modal-title').innerText = dict['modal-title'] || "АЛЕФ 404 says:";
    document.getElementById('aleph-alert-msg').innerText = msg;
    document.getElementById('aleph-alert-modal').style.display = 'flex';
}

function resetInactivity() {
    const timeoutModal = document.getElementById('timeout-modal');
    if (timeoutModal && timeoutModal.style.display === 'flex') return;
    clearTimeout(inactivityTimer);
    clearInterval(countdownInterval);
    if (timeoutModal) timeoutModal.style.display = 'none';
    inactivityTimer = setTimeout(showTimeoutModal, 45000); 
}

function showTimeoutModal() {
    const dict = translations[currentLang] || {};
    document.getElementById('timeout-modal').style.display = 'flex';
    timeLeft = 15;
    document.getElementById('countdown-timer').innerText = timeLeft;
    
    document.querySelector('#timeout-modal .modal-title').innerText = dict['modal-title'] || "АЛЕФ 404 says:";
    document.getElementById('timeout-msg').innerText = dict['timeout-msg'] || "Продолжаем фиксацию или прерываемся?";
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('countdown-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            resetToMain();
        }
    }, 1000);
}

window.continueSession = function() {
    clearInterval(countdownInterval);
    clearTimeout(inactivityTimer);
    document.getElementById('timeout-modal').style.display = 'none';
    inactivityTimer = setTimeout(showTimeoutModal, 45000);
};

function resetToMain() { window.location.href = `index.html?lang=${currentLang}`; }

document.addEventListener('mousemove', resetInactivity);
document.addEventListener('keypress', resetInactivity);
document.addEventListener('touchstart', resetInactivity);
document.addEventListener('scroll', resetInactivity);

// Показ поля с датой при выборе Data
document.addEventListener('change', function(e) {
    if (e.target.name === 'payment') {
        const dataBlock = document.getElementById('data-payment-fields');
        if (dataBlock) dataBlock.style.display = e.target.value === 'data' ? 'block' : 'none';
    }
});

// Открытие следующих шагов
document.getElementById('t-name-placeholder')?.addEventListener('input', function() {
    if (this.value.trim().length > 0) document.getElementById('field-anxiety').style.display = 'block';
});
document.getElementById('anxietySlider')?.addEventListener('change', function() {
    document.getElementById('field-wear').style.display = 'block';
});
document.getElementById('conflictSelect')?.addEventListener('change', function() {
    document.getElementById('field-news').style.display = 'block';
});

// Управление тултипами (инфо-иконки)
document.addEventListener('click', function(e) {
    const icon = e.target.closest('.info-icon');
    if (icon) {
        e.preventDefault();
        e.stopPropagation();
        const isActive = icon.classList.contains('active');
        document.querySelectorAll('.info-icon').forEach(el => el.classList.remove('active'));
        if (!isActive) icon.classList.add('active');
        return;
    }
    document.querySelectorAll('.info-icon').forEach(el => el.classList.remove('active'));
});

// Скрытие клавиатуры по нажатию "Enter"
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
});

// Жесткое снятие фокуса со слайдеров и дропдаунов после взаимодействия
document.querySelectorAll('input[type="range"], select').forEach(el => {
    const removeFocus = function() { this.blur(); };
    el.addEventListener('pointerup', removeFocus);
    el.addEventListener('touchend', removeFocus);
    el.addEventListener('change', removeFocus);
});

// ==========================================
// КАЛЕНДАРЬ И ДАТА РОЖДЕНИЯ
// ==========================================
let selectedDobYear = 1990, selectedDobMonth = 0, selectedDobDay = 1;
const monthNames = {
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};
const weekdayNames = {
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
};

function handleDobManualInput(val) {
    const match = val.trim().match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (match) {
        const y = parseInt(match[1]), m = parseInt(match[2]) - 1, d = parseInt(match[3]);
        if (y >= 1900 && y <= 2026 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
            selectedDobYear = y; selectedDobMonth = m; selectedDobDay = d;
        }
    }
    calculatePremiums();
}

function openDobModal() {
    const parts = document.getElementById('userDob').value.trim().split(/[-/.]/);
    if (parts.length === 3) {
        const y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
        if (y >= 1900 && y <= 2026 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
            selectedDobYear = y; selectedDobMonth = m; selectedDobDay = d;
        }
    }
    initDobDropdowns();
    renderDobCalendar();
    document.getElementById('dob-modal').style.display = 'flex';
}

function closeDobModal() { document.getElementById('dob-modal').style.display = 'none'; }

function initDobDropdowns() {
    const lang = currentLang === 'en' ? 'en' : 'ru';
    
    const monthSelect = document.getElementById('dob-select-month');
    monthSelect.innerHTML = '';
    monthNames[lang].forEach((name, idx) => {
        const opt = document.createElement('option');
        opt.value = idx; opt.innerText = name;
        if (idx === selectedDobMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    });

    const yearSelect = document.getElementById('dob-select-year');
    yearSelect.innerHTML = '';
    for (let y = 2026; y >= 1900; y--) {
        const opt = document.createElement('option');
        opt.value = y; opt.innerText = y;
        if (y === selectedDobYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    const weekdaysBox = document.getElementById('dob-weekdays');
    weekdaysBox.innerHTML = '';
    weekdayNames[lang].forEach(day => {
        const span = document.createElement('span'); span.innerText = day;
        weekdaysBox.appendChild(span);
    });
}

function renderDobCalendar() {
    const yearSelect = document.getElementById('dob-select-year');
    const monthSelect = document.getElementById('dob-select-month');
    if (yearSelect) selectedDobYear = parseInt(yearSelect.value);
    if (monthSelect) selectedDobMonth = parseInt(monthSelect.value);

    const grid = document.getElementById('dob-calendar-grid');
    grid.innerHTML = '';

    const firstDayIndex = (new Date(selectedDobYear, selectedDobMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(selectedDobYear, selectedDobMonth + 1, 0).getDate();

    if (selectedDobDay > daysInMonth) selectedDobDay = daysInMonth;

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'dob-day-btn empty';
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayBtn = document.createElement('button');
        dayBtn.type = 'button'; dayBtn.className = 'dob-day-btn'; dayBtn.innerText = day;
        if (day === selectedDobDay) dayBtn.classList.add('selected');
        dayBtn.onclick = function() {
            document.querySelectorAll('.dob-day-btn').forEach(btn => btn.classList.remove('selected'));
            dayBtn.classList.add('selected');
            selectedDobDay = day;
        };
        grid.appendChild(dayBtn);
    }
}

function confirmDobSelection() {
    const m = String(selectedDobMonth + 1).padStart(2, '0');
    const d = String(selectedDobDay).padStart(2, '0');
    document.getElementById('userDob').value = `${selectedDobYear}-${m}-${d}`;
    calculatePremiums();
    closeDobModal();
}

// Запуск при старте
resetInactivity();
loadDataFromCloud();
