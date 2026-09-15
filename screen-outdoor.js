// Каждый слайд — полностью на одном языке (языки строго чередуются RU/EN),
// плюс закреплённый момент фонового видео и позиция текста (top/bottom),
// подобранные так, чтобы текст не перекрывал лица в кадре.
const SLIDES = [
    {
        lang: 'ru', videoTime: 0.3, textPos: 'bottom',
        headline: 'ЗАВТРА МОЖЕТ<br>НЕ НАСТУПИТЬ',
        slogan: 'Страхование от экзистенциальных угроз.<br>Спокойствие, даже если завтра не наступит.',
        eyebrow: 'Бюрократический хеппенинг',
        seal: 'ВЕЧНЫЙ<br>АРХИВ',
        ctaMain: 'ВОЙДИТЕ И ОФОРМИТЕ ПОЛИС',
        ctaSub: '5 минут · Официальный сертификат · Бесплатная оценка тревожности'
    },
    {
        lang: 'en', videoTime: 5.3, textPos: 'bottom',
        headline: 'TOMORROW MIGHT<br>NOT COME',
        slogan: 'Existential threat insurance.<br>Peace of mind, even if tomorrow never comes.',
        eyebrow: 'Bureaucratic Happening',
        seal: 'ETERNAL<br>ARCHIVE',
        ctaMain: 'STEP IN AND GET COVERED',
        ctaSub: '5 minutes · Official certificate · Free anxiety assessment'
    },
    {
        lang: 'ru', videoTime: 10.0, textPos: 'top',
        headline: 'МЫ УЖЕ<br>ПОЗАБОТИЛИСЬ ОБ ЭТОМ',
        slogan: 'Страхование от экзистенциальных угроз.<br>Спокойствие, даже если завтра не наступит.',
        eyebrow: 'Бюрократический хеппенинг',
        seal: 'ВЕЧНЫЙ<br>АРХИВ',
        ctaMain: 'ВОЙДИТЕ И ОФОРМИТЕ ПОЛИС',
        ctaSub: '5 минут · Официальный сертификат · Бесплатная оценка тревожности'
    },
    {
        lang: 'en', videoTime: 14.9, textPos: 'bottom',
        headline: "WE'VE ALREADY<br>TAKEN CARE OF IT",
        slogan: 'Existential threat insurance.<br>Peace of mind, even if tomorrow never comes.',
        eyebrow: 'Bureaucratic Happening',
        seal: 'ETERNAL<br>ARCHIVE',
        ctaMain: 'STEP IN AND GET COVERED',
        ctaSub: '5 minutes · Official certificate · Free anxiety assessment'
    },
    {
        lang: 'ru', videoTime: 0.6, textPos: 'bottom',
        headline: 'СТРАХОВКА ОТ<br>КОНЦА СВЕТА УЖЕ ЗДЕСЬ',
        slogan: 'Страхование от экзистенциальных угроз.<br>Спокойствие, даже если завтра не наступит.',
        eyebrow: 'Бюрократический хеппенинг',
        seal: 'ВЕЧНЫЙ<br>АРХИВ',
        ctaMain: 'ВОЙДИТЕ И ОФОРМИТЕ ПОЛИС',
        ctaSub: '5 минут · Официальный сертификат · Бесплатная оценка тревожности'
    },
    {
        lang: 'en', videoTime: 15.2, textPos: 'bottom',
        headline: 'INSURANCE AGAINST<br>THE END OF THE WORLD IS HERE',
        slogan: 'Existential threat insurance.<br>Peace of mind, even if tomorrow never comes.',
        eyebrow: 'Bureaucratic Happening',
        seal: 'ETERNAL<br>ARCHIVE',
        ctaMain: 'STEP IN AND GET COVERED',
        ctaSub: '5 minutes · Official certificate · Free anxiety assessment'
    }
];

const SLIDE_INTERVAL_MS = 4500;
const FADE_MS = 450;

function seekVideoTo(video, t) {
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            video.removeEventListener('seeked', finish);
            resolve();
        };
        video.addEventListener('seeked', finish);
        video.currentTime = t;
        setTimeout(finish, 800);
    });
}

async function applySlide(slide) {
    document.getElementById('headlineText').innerHTML = slide.headline;
    document.getElementById('sloganText').innerHTML = slide.slogan;
    document.getElementById('eyebrowText').innerText = slide.eyebrow;
    document.getElementById('sealText').innerHTML = slide.seal;
    document.getElementById('ctaMainText').innerText = slide.ctaMain;
    document.getElementById('ctaSubText').innerText = slide.ctaSub;

    const center = document.getElementById('outdoorCenter');
    center.classList.remove('pos-top', 'pos-bottom');
    center.classList.add(slide.textPos === 'top' ? 'pos-top' : 'pos-bottom');

    const video = document.querySelector('.video-bg video');
    if (video) {
        video.pause();
        await seekVideoTo(video, slide.videoTime);
    }
}

window.__slideTimers = { interval: null, timeout: null };
window.stopSlideCycle = function () {
    clearInterval(window.__slideTimers.interval);
    clearTimeout(window.__slideTimers.timeout);
};

async function cycleSlides() {
    const wrap = document.getElementById('outdoorContent');
    let current = 0;
    await applySlide(SLIDES[current]);

    window.__slideTimers.interval = setInterval(() => {
        wrap.classList.add('fading');
        window.__slideTimers.timeout = setTimeout(async () => {
            current = (current + 1) % SLIDES.length;
            await applySlide(SLIDES[current]);
            wrap.classList.remove('fading');
        }, FADE_MS);
    }, SLIDE_INTERVAL_MS);
}

cycleSlides();
