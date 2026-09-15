const CONTENT = {
    ru: {
        title: 'Как проходит оформление',
        slogan: 'Спокойствие, даже если завтра не наступит.',
        steps: [
            { title: 'Представьтесь', desc: 'Имя и дата рождения — для калибровки цифрового следа' },
            { title: 'Оцените тревогу', desc: 'Уровень тревожности от 0 до 10 — честно, это не проверяется' },
            { title: 'Вспомните пережитое', desc: 'Число конфликтов и часы, проведённые в новостной ленте' },
            { title: 'Выберите риски', desc: 'От климата до ИИ — отметьте угрозы, которые нужно покрыть' },
            { title: 'Оплатите премию', desc: 'Нервными клетками, сном, воспоминаниями или личными данными' },
            { title: 'Получите полис', desc: 'Сертификат защиты придёт вам на почту' }
        ],
        ticker: ['ОБРАБОТКА ЗАЯВОК', 'ОЦЕНКА ЭКЗИСТЕНЦИАЛЬНЫХ РИСКОВ', 'СИНХРОНИЗАЦИЯ С ВЕЧНЫМ АРХИВОМ', 'ВЫДАЧА СЕРТИФИКАТОВ ПОКРЫТИЯ'],
        disclaimer: 'Все данные являются частью художественного бюрократического процесса и не используются вне контекста перформанса.'
    },
    en: {
        title: 'How the process works',
        slogan: 'Peace of mind, even if tomorrow never comes.',
        steps: [
            { title: 'Introduce yourself', desc: 'Name and date of birth — to calibrate your digital footprint' },
            { title: 'Rate your anxiety', desc: "Anxiety level from 0 to 10 — be honest, it isn't checked" },
            { title: "Recall what you've endured", desc: 'Number of conflicts endured and hours spent in the news feed' },
            { title: 'Choose your risks', desc: 'From climate to AI — mark the threats you want covered' },
            { title: 'Pay the premium', desc: 'With nerve cells, sleep, memories, or personal data' },
            { title: 'Receive your policy', desc: 'Your certificate of protection will arrive by email' }
        ],
        ticker: ['PROCESSING APPLICATIONS', 'ASSESSING EXISTENTIAL RISKS', 'SYNCING WITH THE ETERNAL ARCHIVE', 'ISSUING CERTIFICATES OF COVERAGE'],
        disclaimer: 'All data is part of an artistic bureaucratic process and is not used outside the context of the performance.'
    }
};

const LANG_ORDER = ['ru', 'en'];
const STEP_HOLD_MS = 2300;
const STEP_COUNT = 6;

function renderTicker(phrases) {
    const track = document.getElementById('tickerTrack');
    const doubled = phrases.concat(phrases);
    track.innerHTML = doubled.map(p => `<span>${p}</span>`).join('');
}

function applyLangText(lang) {
    const dict = CONTENT[lang];
    document.getElementById('titleText').innerText = dict.title;
    document.getElementById('sloganText').innerText = dict.slogan;
    dict.steps.forEach((step, i) => {
        document.getElementById(`title${i + 1}`).innerText = step.title;
        document.getElementById(`desc${i + 1}`).innerText = step.desc;
    });
    renderTicker(dict.ticker);
    document.getElementById('disclaimerText').innerText = dict.disclaimer;
}

// Строит линии-коннекторы между центрами карточек (порядок чтения: 1-2-3-4-5-6)
function layoutConnectors() {
    const cards = Array.from(document.querySelectorAll('.step-card'));
    const layer = document.getElementById('connectorLayer');
    layer.innerHTML = '';
    const layerRect = layer.getBoundingClientRect();

    const centers = cards.map(c => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2 - layerRect.left, y: r.top + r.height / 2 - layerRect.top };
    });

    const segments = [];
    for (let i = 0; i < centers.length - 1; i++) {
        const a = centers[i], b = centers[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const seg = document.createElement('div');
        seg.className = 'connector-seg';
        seg.style.left = a.x + 'px';
        seg.style.top = a.y + 'px';
        seg.style.width = length + 'px';
        seg.style.transformOrigin = 'left center';
        seg.style.transition = 'transform 0.55s ease';
        seg.style.transform = `rotate(${angle}deg) scaleX(0)`;
        seg.dataset.angle = angle;
        layer.appendChild(seg);
        segments.push(seg);
    }
    return segments;
}

function revealSegment(seg) {
    seg.style.transform = `rotate(${seg.dataset.angle}deg) scaleX(1)`;
}

function resetSteps(cards, segments) {
    cards.forEach(c => c.classList.remove('active', 'completed'));
    segments.forEach(s => {
        s.style.transition = 'none';
        s.style.transform = `rotate(${s.dataset.angle}deg) scaleX(0)`;
        // форсируем применение без анимации, затем возвращаем transition
        void s.offsetWidth;
        s.style.transition = 'transform 0.55s ease';
    });
}

function sleep(ms) {
    return new Promise(resolve => { window.__officeTimeout = setTimeout(resolve, ms); });
}

window.__officeCancelled = false;
window.stopLangCycle = function () {
    window.__officeCancelled = true;
    clearTimeout(window.__officeTimeout);
};

// Проигрывает последовательность подсветки шагов 1..6 для одного языка.
// stepDelayMs позволяет капчер-скрипту проходить состояния мгновенно при экспорте видео.
async function playLangSequence(lang, stepDelayMs) {
    applyLangText(lang);
    const cards = Array.from(document.querySelectorAll('.step-card'));
    const segments = layoutConnectors();
    resetSteps(cards, segments);
    await sleep(30);

    for (let i = 0; i < STEP_COUNT; i++) {
        if (window.__officeCancelled) return;
        if (i > 0) {
            cards[i - 1].classList.remove('active');
            cards[i - 1].classList.add('completed');
            revealSegment(segments[i - 1]);
        }
        cards[i].classList.add('active');
        await sleep(stepDelayMs);
        if (window.__officeCancelled) return;
    }
    cards[STEP_COUNT - 1].classList.remove('active');
    cards[STEP_COUNT - 1].classList.add('completed');
    await sleep(Math.min(stepDelayMs, 500));
}

async function cycleForever() {
    while (!window.__officeCancelled) {
        for (const lang of LANG_ORDER) {
            if (window.__officeCancelled) return;
            await playLangSequence(lang, STEP_HOLD_MS);
        }
    }
}

cycleForever();
