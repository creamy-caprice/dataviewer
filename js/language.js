const translations = {
    ru: {
        title: "Сливочный каприз dataviewer",
        //logoAlt: "dataviewer - просмотр данных",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Координаты",
        // selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
		invalidCoords: "Неверный формат координат",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
        copiedText: "✓",
        copyFallback: "Скопируйте координаты вручную",
        copyError: "Ошибка копирования",
        
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Сегодня",
        		
        // Переводы для выпадающего списка диапазонов
        rangeWeek: "1 неделя",
        rangeMonth: "1 месяц",
        range3Months: "3 месяца",
        range6Months: "6 месяцев",
        rangeYear: "1 год",
		
        showEquipment: 'Показать технику',
        hideEquipment: 'Скрыть технику',
        
        selectAll: "Все",
        
        showAttacksOnUa: 'Показать удары по территории Украины',
        hideAttacksOnUa: 'Скрыть удары по территории Украины',
		
        showFortifications: 'Показать фортификации (Playfra map) Зеленый - Рвы, Белый - Надолбы, Голубой - Колючая проволока',
        hideFortifications: 'Скрыть фортификации (Playfra map) Зеленый - Рвы, Белый - Надолбы, Голубой - Колючая проволока',
        
        ruBtnTitle: "Текущий язык: Русский",
        enBtnTitle: "Переключить на Английский",
        
        layersToggleTitle: "Слои карты",
        
        rulerToggleTitle: "Измерить расстояние",
        measureControlTitleOn: "Включить линейку",
        measureControlTitleOff: "Выключить линейку",
        clearControlTitle: "Очистить измерения",
        unitControlTitle: { // Title texts to show on the Unit Control
            text: 'Изменить единицы',
            kilometres: 'километры',
            landmiles: "мили",
            nauticalmiles: 'морские мили'
        },
        units: {
            meters: "Метры",
            kilometres: "Километры",
            landmiles: "Мили",
            nauticalmiles: "Морские мили",
            feet: "Футы"
        },
        
        viewSwitchMap: "Карта",
        viewSwitchSt1: "Статистика",
        viewSwitchSt2: "Потери ВСУ",
        
        viewSwitchTlg:  "Гугл-карта",
        viewSwitchDon:  "Сбор на СВО",
        viewSwitchInfo: "Инфо"
    },
    en: {
        title: "Creamy caprice dataviewer",
        //logoAlt: "dataviewer - data visualization",
        centerLabel: "Center on:",
        coordsPlaceholder: "Coordinates",
        // selectCity: "Select city",
        currentCenter: "Current center: ",
		invalidCoords: "Invalid coordinate format",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        copiedText: "✓",
        copyFallback: "Copy coordinates manually",
        copyError: "Copy error",
        
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Today",
        
		rangeWeek: "1 week",
        rangeMonth: "1 month",
        range3Months: "3 months",
        range6Months: "6 months",
        rangeYear: "1 year",
		
        showEquipment: 'Show equipment',
        hideEquipment: 'Hide equipment',
        
        selectAll: "All",
        
        showAttacksOnUa: 'Show attacks on Ukraine',
        hideAttacksOnUa: 'Hide attacks on Ukraine',		
		
        showFortifications: 'Show fortifications (Playfra map) Green - Ditches, White - Dragons teeth, Blue - Barbed wire',
        hideFortifications: 'Hide fortifications (Playfra map) Green - Ditches, White - Dragons teeth, Blue - Barbed wire',
        
        ruBtnTitle: "Switch to Russian",
        enBtnTitle: "Current language: English",
        
        layersToggleTitle: "Map layers",
        
        rulerToggleTitle: "Measure distance",
        measureControlTitleOn: "Turn on measuring tool",
        measureControlTitleOff: "Turn off measuring tool",
        clearControlTitle: "Clear measurements",
        unitControlTitle: { // Title texts to show on the Unit Control
            text: 'Change Units',
            kilometres: 'kilometres',
            landmiles: "miles",
            nauticalmiles: 'nautical miles'
        },
        units: {
            meters: "Meters",
            kilometres: "Kilometres",
            landmiles: "Miles",
            nauticalmiles: "Nautical miles",
            feet: "Feet"
        },
        
        viewSwitchMap: "Map",
        viewSwitchSt1: "Statistics",
        viewSwitchSt2: "UA Losses",
        
        viewSwitchTlg:  "Google-map",
        viewSwitchDon:  "Donate",
        viewSwitchInfo: "Info"
    }
};

let currentLang = localStorage.getItem('preferredLang') || 'ru'; // По умолчанию русский

// Функция для обновления текстов линейки при смене языка
function updateMeasureControlLanguage(lang) {
    const t = translations[lang];
    
    // Гарантируем инициализацию контрола перед обновлением
    if (!window.measureControl && typeof initMeasureControl === 'function') {
        initMeasureControl();
    }
    
    if (window.measureControl) {
        const container = window.measureControl.getContainer();
        
        // Если контейнер не найден, добавляем контрол на карту
        if (!container) {
            window.measureControl.addTo(map);
        } else {
            // Обновление кнопки измерения
            const measureButton = container.querySelector('#polyline-measure-control');
            if (measureButton) {
                const isActive = measureButton.classList.contains('active');
                measureButton.title = isActive ? t.measureControlTitleOff : t.measureControlTitleOn;
            }
            
            // Обновление кнопки очистки
            const clearButton = container.querySelector('.polyline-measure-clearControl');
            if (clearButton) {
                clearButton.title = t.clearControlTitle;
            }
            
            // Обновление кнопки единиц измерения
            const unitButton = container.querySelector('#unitControlId');
            if (unitButton) {
                // unitButton.title = t.unitControlTitle;
                // Получаем текущую единицу измерения
                const currentUnit = window.measureControl._unit || 'kilometres';
                
                // Формируем строку вида "Текст [Единица]"
                let titleText = t.unitControlTitle.text;
                if (t.unitControlTitle[currentUnit]) {
                    titleText += ` [${t.unitControlTitle[currentUnit]}]`;
                }
                
                unitButton.title = titleText;
            }
        }
    }
    
    // Обновляем title нашей кастомной кнопки
    if (rulerToggle) {
        const link = rulerToggle.getContainer().querySelector('a');
        if (link) link.title = t.rulerToggleTitle;
    }
}

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Сохраняем текущие координаты перед обновлением текста
    const coordsElement = document.getElementById('current-center-coords');
    const currentText = coordsElement.textContent;
    const coordsRegex = /[-]?\d+\.\d+,\s*[-]?\d+\.\d+/;
    const match = currentText.match(coordsRegex);
    const savedCoords = match ? match[0] : null;
    
    // Обновляем title кнопок
    document.getElementById('lang-ru').title = 
        lang === 'ru' ? "Текущий язык: Русский" : "Переключить на Русский";
    
    document.getElementById('lang-en').title = 
        lang === 'en' ? "Current language: English" : "Switch to English";
    
    // Обновляем текст элементов
    document.getElementById('page-title').textContent = t.title;
    //document.getElementById('site-logo').alt = t.logoAlt;
    // document.getElementById('main-title').textContent = t.title;
    document.getElementById('centerOn-label').textContent = t.centerLabel;
    document.getElementById('coords-input').placeholder = t.coordsPlaceholder;
    // document.getElementById('select-city-default').textContent = t.selectCity;
    
    document.getElementById('currentCenter-label').textContent = t.currentCenter;
    // Восстанавливаем координаты после обновления префикса
    if (savedCoords) {
        coordsElement.textContent = savedCoords;
    } else {
        coordsElement.textContent = t.undefinedCoords;
    }
    
    document.getElementById('copy-coords-btn').title = t.copyTooltip;
	
    document.getElementById('map-btn'   ).textContent = t.viewSwitchMap;
    document.getElementById('stats1-btn').textContent = t.viewSwitchSt1;
    document.getElementById('stats2-btn').textContent = t.viewSwitchSt2;
    document.getElementById('tlg-btn'   ).textContent = t.viewSwitchTlg;
    document.getElementById('donate-btn').textContent = t.viewSwitchDon;
    document.getElementById('info-btn'  ).textContent = t.viewSwitchInfo;
    document.getElementById('map-btn-desktop'   ).textContent = t.viewSwitchMap;
    document.getElementById('stats1-btn-desktop').textContent = t.viewSwitchSt1;
    document.getElementById('stats2-btn-desktop').textContent = t.viewSwitchSt2;
    document.getElementById('tlg-btn-desktop'   ).textContent = t.viewSwitchTlg;
    document.getElementById('donate-btn-desktop').textContent = t.viewSwitchDon;
    document.getElementById('info-btn-desktop'  ).textContent = t.viewSwitchInfo;
    
    // Обновляем кнопки навигации
    document.getElementById('first-btn').title = t.firstBtnTitle;
    document.getElementById('prev-btn').title = t.prevBtnTitle;
    document.getElementById('next-btn').title = t.nextBtnTitle;
    document.getElementById('last-btn').title = t.lastBtnTitle;
	
	// Обновление текста в выпадающем списке диапазонов дат
    const rangeOptions = document.querySelectorAll('#date-range-dropdown .range-option');
    if (rangeOptions.length >= 5) {
        // Порядок: неделя, месяц, 3 месяца, 6 месяцев, год
        rangeOptions[0].textContent = t.rangeWeek;
        rangeOptions[1].textContent = t.rangeMonth;
        rangeOptions[2].textContent = t.range3Months;
        rangeOptions[3].textContent = t.range6Months;
        rangeOptions[4].textContent = t.rangeYear;
    }
	
	// Обновляем заголовок кнопки фильтра дат
	if (typeof updateDateRangeButtonTitle === 'function') {
		updateDateRangeButtonTitle();
	}
	
	if (typeof updateMilEquipButtonTitle === 'function') updateMilEquipButtonTitle();
	if (typeof updateAttacksOnUaButtonTitle === 'function') updateAttacksOnUaButtonTitle();
	if (typeof updateFortificationButtonTitle === 'function') updateFortificationButtonTitle();
    
    // Обновляем title кнопки переключения слоев
    const layersToggleLink = document.querySelector('.leaflet-control-layers-toggle a');
    if (layersToggleLink) {
        layersToggleLink.title = t.layersToggleTitle;
    }
    
    updateMeasureControlLanguage(lang); // Обновляем тексты линейки
    
    // Обновляем кнопки языка
    document.getElementById('lang-ru').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en').title = lang === 'en' ? "Already English" : "Switch to English";
    document.getElementById('lang-ru-desktop').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en-desktop').title = lang === 'en' ? "Already English" : "Switch to English";
        
    // Обновляем классы активности
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-ru-desktop').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en-desktop').classList.toggle('active', lang === 'en');
    
    // Обновляем список городов
    populateCitiesDropdown();
    
    // Пересоздаем календарь с новым языком
    if (datePicker) {
        datePicker.destroy();
    }
    initDatePicker(); // Передаем сохраненную дату
    
    // Если координаты не определены, обновляем текст
    if (document.getElementById('current-center-coords').textContent === 'не определен' || 
        document.getElementById('current-center-coords').textContent === 'undefined') {
        document.getElementById('current-center-coords').textContent = t.undefinedCoords;
    }
    
    // Обновляем текст чекбокса "Все" в фильтре техники
    const equipSelectAll = document.getElementById('equip-select-all');
    if (equipSelectAll) {
        // Ищем родительский label (обычно чекбокс обёрнут в <label>)
        const label = equipSelectAll.closest('label');
        if (label) {
            // Сохраняем ссылку на сам чекбокс
            const checkbox = label.querySelector('input[type="checkbox"]');
            // Обновляем текст, оставляя чекбокс нетронутым
            label.innerHTML = '';
            if (checkbox) label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + t.selectAll));
        } else {
            // Если label нет, просто меняем следующий текстовый узел
            const nextNode = equipSelectAll.nextSibling;
            if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                nextNode.textContent = ' ' + t.selectAll;
            }
        }
    }
    
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('preferredLang', lang);
    document.documentElement.lang = lang;
    
    // Инициируем событие, что язык изменён
    const event = new CustomEvent('languageChanged', { detail: lang });
    document.dispatchEvent(event);
    
    // Обновляем состояние кнопок
    // updateButtons();
}


// Обработчик изменения языка из script.js
document.addEventListener('languageChanged', function(event) {
    currentLang = event.detail;
    if (datePicker) {
        datePicker.destroy();
    }
        initDatePicker();
    
    populateCitiesDropdown(); // Обновляем основной список
    initDartMenu(); // Перестраиваем дартс-меню	
	
	// фильтр техники
	initEquipmentFilter();
    if (window.isMilEquipVisible) {
        applyEquipmentFilter();
    }
	
});

// Обработчики кнопок переключения языка
// мобильный
document.getElementById('lang-ru').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});

document.getElementById('lang-ru').addEventListener('click', function() {
    if (currentLang !== 'ru') {
        setLanguage('ru');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.ruBtnTitle;
    }
});

document.getElementById('lang-en').addEventListener('click', function() {
    if (currentLang !== 'en') {
        setLanguage('en');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.enBtnTitle;
    }
});
// десктопный
document.getElementById('lang-ru-desktop').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en-desktop').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});

document.getElementById('lang-ru-desktop').addEventListener('click', function() {
    if (currentLang !== 'ru') {
        setLanguage('ru');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.ruBtnTitle;
    }
});

document.getElementById('lang-en-desktop').addEventListener('click', function() {
    if (currentLang !== 'en') {
        setLanguage('en');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.enBtnTitle;
    }
});

// Инициализация языка при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLang);
    
    // Обработчики кнопок переключения языка
    document.getElementById('lang-ru').addEventListener('click', () => {
        if (currentLang !== 'ru') setLanguage('ru');
    });

    document.getElementById('lang-en').addEventListener('click', () => {
        if (currentLang !== 'en') setLanguage('en');
    });
});

