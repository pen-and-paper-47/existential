const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeKQogEEDNWY626wZDamnMfGNimCIMFqwP9_spwPc-qotu_yQq7jKMzF1YeFzfBSrFAbCCO8UNvMwZ/pub?output=tsv'; 
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz7Jhxo2oqUMv0ujXOXyGE7Uj7JwMCvKwhkAFU_AKzaudXnR9EzpN00GOG90dmjqGmfHA/exec';

let translations = {};
let currentLang = 'ru';
let thankYouTimerInterval;
let inactivityTimer;
let countdownInterval;
let timeLeft = 15;

// Читаем язык из URL или браузера
const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang');
if (langParam && (langParam === 'ru' || langParam === 'en')) {
    currentLang = langParam;
} else {
    const browserLang = (navigator.language || 'ru').substring(0, 2);
    currentLang = browserLang === 'en' ? 'en' : 'ru';
}

// 1. Моментальный перевод слова "Загрузка..." до скачивания таблицы
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

function applyLanguage() {
    const dict = translations[currentLang];
    if (!dict) return;
    
    const windowTitle = document.getElementById('t-window-title');
    if (windowTitle) windowTitle.innerText = dict['window-title'] || "Форма 404-Алеф";

    const textElements = {
        't-window-title': 'window-title',
        't-warning': 'warning',
        't-name': 'name',
        't-anxiety': 'anxiety',
        't-wear': 'wear',
        't-wear-desc': 'wear-desc',
        't-news': 'news',
        't-consent-text': 'consent-text',
        't-next-btn': 'next-btn',
        't-risks-title': 'risks-title',
        't-pay-btn': 'pay-btn',
        't-back-1': 'back-1',
        't-pay-title': 'pay-title',
        't-pay-1': 'pay-1',
        't-pay-2': 'pay-2',
        't-pay-3': 'pay-3',
        't-pay-4': 'pay-4',
        't-finish-btn': 'finish-btn',
        't-back-2': 'back-2',
        't-disclaimer': 'disclaimer',
        't-email-disclaimer': 'email-disclaimer',
        't-thanks-title': 'thanks-title',
        't-dob-label': 'dob-label',
        'pdf-cost-label': 'pdf-cost',
        'btn-continue': 'timeout-continue',
        'btn-abort': 'timeout-abort',
        't-email-label': 'email-label',
        't-info-nerves': 'info-nerves',
        't-info-sleep': 'info-sleep',
        't-info-oblivion': 'info-oblivion'
    };

    for (const [id, key] of Object.entries(textElements)) {
        const el = document.getElementById(id);
        if (el && dict[key]) el.innerHTML = dict[key];
    }

    const placeholders = {
        't-name-placeholder': 'name-placeholder',
        'userEmail': 'email-placeholder'
    };
    for (const [id, key] of Object.entries(placeholders)) {
        const el = document.getElementById(id);
        if (el && dict[key]) el.placeholder = dict[key];
    }

    const backMainBtn = document.getElementById('t-back-main');
    if (backMainBtn) backMainBtn.innerText = (dict['back-main'] || "Возврат на главную страницу") + " (15)";
    
    const thanksSlogan = document.getElementById('t-thanks-slogan');
    if (thanksSlogan) thanksSlogan.innerText = dict['slogan'] || "";

    const risksContainer = document.getElementById('risks-container');
    if (risksContainer) {
        risksContainer.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            if (dict[`risk${i}`]) {
                risksContainer.innerHTML += `<label class="risk-card"><input type="checkbox" name="risks" value="risk${i}"><span>${dict[`risk${i}`]}</span></label>`;
            }
        }
    }

    const anxietySlider = document.getElementById('anxietySlider');
    if (anxietySlider) enforceMinAnxiety(anxietySlider);
    
    populateConflictSelect(currentLang);
    updateNewsSlider();
    calculatePremiums();
}

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

function goToStep1() {
    document.getElementById('block2').classList.remove('active');
    document.getElementById('block3').classList.remove('active');
    document.getElementById('block1').classList.add('active');
}

function goToStep2() {
    if (!document.getElementById('consentCheck').checked) {
        alert(translations[currentLang]?.alertConsent || "Подтвердите согласие!");
        return;
    }
    document.getElementById('block1').classList.remove('active');
    document.getElementById('block3').classList.remove('active');
    document.getElementById('block2').classList.add('active');
    
    // Плавная прокрутка в самый верх экрана
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep3() {
    document.getElementById('block1').classList.remove('active');
    document.getElementById('block2').classList.remove('active');
    document.getElementById('block3').classList.add('active');
    
    // Плавная прокрутка в самый верх экрана
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = `${prefix}${end.toFixed(1)} ${unit}`;
        }
    };
    window.requestAnimationFrame(step);
}

document.addEventListener('change', function(e) {
    if (e.target.name === 'payment') {
        const dataBlock = document.getElementById('data-payment-fields');
        dataBlock.style.display = e.target.value === 'data' ? 'block' : 'none';
    }
});

document.getElementById('t-name-placeholder').addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        document.getElementById('field-anxiety').style.display = 'block';
    }
});
document.getElementById('anxietySlider').addEventListener('change', function() {
    document.getElementById('field-wear').style.display = 'block';
});
document.getElementById('conflictSelect').addEventListener('change', function() {
    document.getElementById('field-news').style.display = 'block';
});

function collectFinalData() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    const email = document.getElementById('userEmail').value;
    const dict = translations[currentLang] || {};
    
    if (!selectedPayment) {
        alephAlert(dict['alertConsent'] || "Выберите метод списания!");
        return;
    }
    if (!email) {
        alephAlert(dict['alert-email'] || (currentLang === 'ru' ? "Цифровой след (Email) обязателен!" : "Email is required!"));
        return;
    }
    if (selectedPayment.value === 'data') {
        const dob = document.getElementById('userDob').value;
        if (!dob) {
            alephAlert(dict['alert-dob'] || (currentLang === 'ru' ? "Укажите дату рождения для калибровки цифрового следа." : "Date of birth is required."));
            return;
        }
    }

    const finishBtn = document.getElementById('t-finish-btn');
    finishBtn.innerText = dict['generating-doc'] || "Формирование документа...";
    finishBtn.disabled = true;

    document.getElementById('pdf-title-text').innerText = dict['window-title'];
    document.getElementById('pdf-slogan').innerText = dict['slogan'];
    document.getElementById('pdf-name').innerText = document.getElementById('t-name-placeholder').value || "Аноним";
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
            if (data.status === 'success') {
                window.open(data.url, '_blank');
                
                emailjs.send('service_kluawpl', 'template_34kowi9', {
                    email_to: email,
                    pdf_link: data.url,
                    email_subject: dict['email-sub'] || "Форма 404-Алеф: Ваш План Защиты",
                    email_greeting: (dict['email-greet'] || "Идентификатор субъекта:") + " " + (document.getElementById('t-name-placeholder').value || "Аноним"),
                    email_message: dict['email-msg'] || "Ваша экзистенциальная фиксация успешно завершена. Цифровой след учтен, а документ помещен в Вечный Архив.",
                    email_btn: dict['email-btn'] || "Открыть Сертификат"
                }).then(() => {
                    showThankYouScreen(email);
                });
            } else {
                throw new Error("Drive error");
            }
        })
        .catch(err => {
            alephAlert(dict['error-archive'] || "Ошибка Вечного Архива. Бюрократическая сингулярность.");
            finishBtn.innerText = dict['finish-btn'] || "Получить План Защиты (PDF)";
            finishBtn.disabled = false;
        });
    });
}

function showThankYouScreen(email) {
    document.getElementById('block3').classList.remove('active');
    document.getElementById('block4').classList.add('active');
    
    const headerEl = document.querySelector('.header');
    if (headerEl) headerEl.style.display = 'none';
    const disclaimerEl = document.getElementById('t-disclaimer');
    if (disclaimerEl) disclaimerEl.style.display = 'none';
    
    const msgElement = document.getElementById('thank-you-message');
    if (email) {
        msgElement.innerText = currentLang === 'ru' 
            ? `Вам отправлено письмо с Планом Защиты на указанный адрес: ${email}`
            : `An email with your Protection Plan has been sent to: ${email}`;
    }

    let timeLeft = 15;
    const btn = document.getElementById('t-back-main');
    const baseText = translations[currentLang]?.['back-main'] || "Возврат на главную страницу";
    btn.innerText = `${baseText} (${timeLeft})`;
    
    clearInterval(thankYouTimerInterval);
    thankYouTimerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            btn.innerText = `${baseText} (${timeLeft})`;
        } else {
            clearInterval(thankYouTimerInterval);
            resetToMain();
        }
    }, 1000);
}

function alephAlert(msg) {
    const dict = translations[currentLang] || {};
    document.querySelector('#aleph-alert-modal .modal-title').innerText = dict['modal-title'] || "АЛЕФ 404 says:";
    document.getElementById('aleph-alert-msg').innerText = msg;
    document.getElementById('aleph-alert-modal').style.display = 'flex';
}

function resetInactivity() {
    if (document.getElementById('timeout-modal').style.display === 'flex') return;
    clearTimeout(inactivityTimer);
    clearInterval(countdownInterval);
    document.getElementById('timeout-modal').style.display = 'none';
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

document.addEventListener('mousemove', resetInactivity);
document.addEventListener('keypress', resetInactivity);
document.addEventListener('touchstart', resetInactivity);
document.addEventListener('scroll', resetInactivity);
resetInactivity();

function resetToMain() {
    window.location.href = `index.html?lang=${currentLang}`;
}

document.addEventListener('click', function(e) {
    const icon = e.target.closest('.info-icon');
    if (icon) {
        e.preventDefault();
        e.stopPropagation(); // Предотвращает срабатывание выбора радиокнопки
        const isActive = icon.classList.contains('active');
        document.querySelectorAll('.info-icon').forEach(el => el.classList.remove('active'));
        if (!isActive) icon.classList.add('active');
        return;
    }
    // Клик вне иконки закрывает открытый тултип
    document.querySelectorAll('.info-icon').forEach(el => el.classList.remove('active'));
});

let selectedDobYear = 1990;
let selectedDobMonth = 0; // 0 - Январь
let selectedDobDay = 1;

const monthNames = {
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

const weekdayNames = {
    ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
};

// Ручной ввод с клавиатуры
function handleDobManualInput(val) {
    const trimmed = val.trim();
    const match = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (match) {
        const y = parseInt(match[1]);
        const m = parseInt(match[2]) - 1;
        const d = parseInt(match[3]);
        if (y >= 1900 && y <= 2026 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
            selectedDobYear = y;
            selectedDobMonth = m;
            selectedDobDay = d;
        }
    }
    calculatePremiums();
}

function openDobModal() {
    const currentVal = document.getElementById('userDob').value.trim();
    const parts = currentVal.split(/[-/.]/);
    if (parts.length === 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const d = parseInt(parts[2]);
        if (y >= 1900 && y <= 2026 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
            selectedDobYear = y;
            selectedDobMonth = m;
            selectedDobDay = d;
        }
    }

    initDobDropdowns();
    renderDobCalendar();
    document.getElementById('dob-modal').style.display = 'flex';
}

function closeDobModal() {
    document.getElementById('dob-modal').style.display = 'none';
}

function initDobDropdowns() {
    const lang = currentLang === 'en' ? 'en' : 'ru';
    const dict = translations[currentLang] || {};
    
    // Перевод заголовка и кнопок модального окна календаря
    document.getElementById('t-dob-modal-title').innerText = dict['dob-modal-title'] || 'Калибровка цифрового следа';
    document.getElementById('t-dob-confirm').innerText = dict['dob-confirm'] || 'Выбрать дату';
    document.getElementById('t-dob-cancel').innerText = dict['dob-cancel'] || 'Отмена';
    
    // Заполнение месяцев
    const monthSelect = document.getElementById('dob-select-month');
    monthSelect.innerHTML = '';
    monthNames[lang].forEach((name, idx) => {
        const opt = document.option ? document.createElement('option') : document.createElement('option');
        opt.value = idx;
        opt.innerText = name;
        if (idx === selectedDobMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    });

    // Заполнение годов (от 2026 до 1900)
    const yearSelect = document.getElementById('dob-select-year');
    yearSelect.innerHTML = '';
    for (let y = 2026; y >= 1900; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.innerText = y;
        if (y === selectedDobYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    // Дни недели
    const weekdaysBox = document.getElementById('dob-weekdays');
    weekdaysBox.innerHTML = '';
    weekdayNames[lang].forEach(day => {
        const span = document.createElement('span');
        span.innerText = day;
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
        dayBtn.type = 'button';
        dayBtn.className = 'dob-day-btn';
        dayBtn.innerText = day;
        if (day === selectedDobDay) {
            dayBtn.classList.add('selected');
        }
        dayBtn.onclick = function() {
            document.querySelectorAll('.dob-day-btn').forEach(btn => btn.classList.remove('selected'));
            dayBtn.classList.add('selected');
            selectedDobDay = day;
        };
        grid.appendChild(dayBtn);
    }
}

function confirmDobSelection() {
    const formattedMonth = String(selectedDobMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDobDay).padStart(2, '0');
    const dateStr = `${selectedDobYear}-${formattedMonth}-${formattedDay}`;

    document.getElementById('userDob').value = dateStr;
    calculatePremiums();
    closeDobModal();
}

// 1. Скрытие клавиатуры по нажатию "Enter" (Return) на любом поле
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur(); // Сбрасываем фокус, и клавиатура уезжает вниз
        }
    }
});

// 2. Жесткое снятие фокуса со слайдеров и дропдаунов после касания
document.querySelectorAll('input[type="range"], select').forEach(el => {
    // Используем 'pointerup' и 'touchend', чтобы отловить момент отпускания пальца
    const removeFocus = function() {
        this.blur();
    };
    el.addEventListener('pointerup', removeFocus);
    el.addEventListener('touchend', removeFocus);
    el.addEventListener('change', removeFocus);
});

loadDataFromCloud();
