// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Основные KML-файлы
const kmlFiles = [
    { name: "22.02.24", path: "kml/Line_22_02_24.kml" },
    { name: "01.07.24", path: "kml/Line_24_07_01.kml" },
    { name: "01.08.24", path: "kml/Line_24_08_01.kml" },
    { name: "01.09.24", path: "kml/Line_24_09_01.kml" },
    { name: "01.10.24", path: "kml/Line_24_10_01.kml" },
    { name: "01.11.24", path: "kml/Line_24_11_01.kml" },
    { name: "01.12.24", path: "kml/Line_24_12_01.kml" },
    { name: "01.01.25", path: "kml/Line_25_01_01.kml" }, 
    { name: "01.02.25", path: "kml/Line_25_02_01.kml" },
    { name: "01.03.25", path: "kml/Line_25_03_01.kml" },
    { name: "03.04.25", path: "kml/Line_25_04_03.kml" }
    
];

// Постоянный слой
const permanentLayerData = {
    name: "24.02.22", path: "kml/Line_start_LDNR.kml"
};

// Список городов с координатами
const cities = [
    { name: { ru: "Суджа",     en: "Sudzha"     }, lat: 51.19055,  lng: 35.27082   },
    { name: { ru: "Волчанск",  en: "Volchansk"  }, lat: 50.288107, lng: 36.946217  },
    { name: { ru: "Купянск",   en: "Kupyansk"   }, lat: 49.706396, lng: 37.616586  },
    { name: { ru: "Боровая",   en: "Borovaya"   }, lat: 49.38417,  lng: 37.62086   },
    { name: { ru: "Северск",   en: "Seversk"    }, lat: 48.868709, lng: 38.106425  },
    { name: { ru: "Часов Яр",  en: "Chasov Yar" }, lat: 48.591656, lng: 37.820354  },
    { name: { ru: "Дзержинск", en: "Dzerzhinsk" }, lat: 48.398329, lng: 37.836634  },
    { name: { ru: "Красноармейск", en: "Krasnoarmeisk" }, lat: 48.26194,  lng: 37.18388 },
    { name: { ru: "Великая Новосёлка", en: "Velikaya Novoselka" }, lat: 47.85361,  lng: 36.82555 },
    { name: { ru: "Гуляйполе", en: "Gulyaypole" }, lat: 47.65277,  lng: 36.27777   },
    { name: { ru: "Орехов",    en: "Orekhov"    }, lat: 47.55333,  lng: 35.78555   },
    { name: { ru: "Алёшки",    en: "Aleshki"    }, lat: 46.62166,  lng: 32.72527   }
];

let currentLayer = null;
let permanentLayer = null;
let currentIndex = kmlFiles.length - 1;
let preserveZoom = false;

let lastSelectedCity = null;
const citiesDropdown = document.getElementById('cities-dropdown');
const coordsInput = document.getElementById('coords-input');
let currentCenterCoordsElement = document.getElementById('current-center-coords');
let copyCoordsBtn = document.getElementById('copy-coords-btn');

// Получаем массив доступных дат из kmlFiles
const availableDates = kmlFiles.map(file => file.name);

// Функция для преобразования даты из формата DD.MM.YY в объект Date
function parseCustomDate(dateStr) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(2000 + year, month - 1, day);
}

// Инициализация календаря с ограничением доступных дат
let datePicker;
function initDatePicker() {
    datePicker = flatpickr("#date-picker", {
		locale: currentLang === 'ru' ? 'ru' : 'default',
        dateFormat: "d.m.y",
        allowInput: true,
        locale: currentLang, // Используем текущий язык
        defaultDate: kmlFiles[kmlFiles.length - 1].name,
        enable: [
            function(date) {
                const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
                return availableDates.includes(dateStr);
            }
        ],
        onChange: function(selectedDates, dateStr) {
            const index = kmlFiles.findIndex(file => file.name === dateStr);
            if (index !== -1) {
                navigateTo(index);
            }
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const today = new Date();
            const isToday = dayElem.dateObj.getDate() === today.getDate() && 
                           dayElem.dateObj.getMonth() === today.getMonth() && 
                           dayElem.dateObj.getFullYear() === today.getFullYear();
            
            if (isToday) {
                dayElem.classList.add('today');
            }
            
            const dateStr = `${dayElem.dateObj.getDate().toString().padStart(2, '0')}.${(dayElem.dateObj.getMonth()+1).toString().padStart(2, '0')}.${dayElem.dateObj.getFullYear().toString().slice(-2)}`;
            
            if (availableDates.includes(dateStr)) {
                dayElem.classList.add('available');
                
                if (dateStr === kmlFiles[currentIndex].name) {
                    dayElem.classList.add('selected');
                }
            }
        }
    });
}

// Функция для проверки валидности координат
function isValidCoordinate(value, isLatitude) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (isLatitude) return num >= -90 && num <= 90;
    return num >= -180 && num <= 180;
}

// Функция обновления отображения текущего центра
function updateCurrentCenterDisplay() {
    const center = map.getCenter();
    currentCenterCoordsElement.textContent = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
}

// Обработчик кнопки копирования координат
copyCoordsBtn.addEventListener('click', function() {
    const coords = currentCenterCoordsElement.textContent;
    if (coords && coords !== 'не определен') {
        navigator.clipboard.writeText(coords)
            .then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка копирования: ', err);
            });
    }
});

// функция заполнения списка городов
function populateCitiesDropdown() {
    // Очищаем список, кроме первого элемента
    while (citiesDropdown.options.length > 1) {
        citiesDropdown.remove(1);
    }
    
    // Добавляем города на текущем языке
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name.ru; // Сохраняем русское название как значение
        option.textContent = city.name[currentLang];
        citiesDropdown.appendChild(option);
    });
}

// Функция центрирования карты по координатам
function centerMap(lat, lng) {
    const currentZoom = map.getZoom();
    map.setView([lat, lng], currentZoom);
    
    // Обновляем поле ввода, если координаты изменились
    if (coordsInput.value !== `${lat}, ${lng}`) {
        coordsInput.value = `${lat}, ${lng}`;
    }
}

// Загрузка постоянного KML-слоя
function loadPermanentKml() {
    permanentLayer = omnivore.kml(permanentLayerData.path)
        .on('ready', function() {
            permanentLayer.eachLayer(function(layer) {
                if (layer.setStyle) {
                    layer.setStyle(window.permanentLayerStyle);
                }
            });
        })
        .addTo(map);
}

// Функция загрузки KML (сохраняет текущий масштаб)
function loadKmlFile(file) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    // Сохраняем текущий центр и зум перед загрузкой
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    currentLayer = omnivore.kml(file.path)
        .on('ready', () => {
            if (!preserveZoom) {
                map.fitBounds(currentLayer.getBounds());
            } else {
                // Восстанавливаем предыдущий центр и зум
                map.setView(currentCenter, currentZoom);
            }
            preserveZoom = true; // После первой загрузки сохраняем масштаб
        })
        .addTo(map);
}

// Навигация к определенному индексу
function navigateTo(index) {
    if (index < 0 || index >= kmlFiles.length) return;
    
    currentIndex = index;
    const file = kmlFiles[currentIndex];
    
    // Обновляем календарь
    datePicker.setDate(file.name, false);
    
    // Загружаем файл
    loadKmlFile(file);
    
    // Обновляем состояние кнопок
    updateButtons();
}

// Обновление состояния кнопок
function updateButtons() {
    document.getElementById('first-btn').disabled = currentIndex === 0;
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').disabled = currentIndex === kmlFiles.length - 1;
    document.getElementById('last-btn').disabled = currentIndex === kmlFiles.length - 1;
}

// Обработчики кнопок
document.getElementById('first-btn').addEventListener('click', () => {
    navigateTo(0);
});

document.getElementById('prev-btn').addEventListener('click', () => {
    navigateTo(currentIndex - 1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    navigateTo(currentIndex + 1);
});

document.getElementById('last-btn').addEventListener('click', () => {
    navigateTo(kmlFiles.length - 1);
});


// Обработчик ввода координат
coordsInput.addEventListener('change', function() {
    const coords = this.value.split(',').map(coord => coord.trim());
    
    if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            centerMap(lat, lng);
        }
    }
});





// Заполнение выпадающего списка городов
document.getElementById('cities-dropdown').addEventListener('change', function() {
    const selectedCityName = this.value;
    if (!selectedCityName) return;
    
    // Ищем город по русскому названию (которое в value)
    const city = cities.find(c => c.name.ru === selectedCityName);
    if (city) {
        document.getElementById('coords-input').value = `${city.lat}, ${city.lng}`;
        centerMap(city.lat, city.lng);
        this.value = "";
    }
});

// Обработчик выбора города

citiesDropdown.addEventListener('change', function() {
    const selectedCityName = this.value;
    if (!selectedCityName) return;
    
    const city = cities.find(c => c.name === selectedCityName);
    if (city) {
        // Заполняем поле координат
        coordsInput.value = `${city.lat}, ${city.lng}`;
        centerMap(city.lat, city.lng);
        
        // Сбрасываем выбор
        this.value = "";
    }
});

// Обработчик кнопки копирования координат
copyCoordsBtn.addEventListener('click', function() {
    const coords = currentCenterCoordsElement.textContent;
    if (coords && coords !== 'не определен') {
        navigator.clipboard.writeText(coords)
            .then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка копирования: ', err);
            });
    }
});

// обработчик перемещения карты
map.on('moveend', function() {
    updateCurrentCenterDisplay();
});


//////////////////////// язык

// Добавьте объект с переводами
const translations = {
    ru: {
        title: "Сливочный каприз dataviewer",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Широта, Долгота (например: 55.7558, 37.6173)",
        selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Последний"
    },
    en: {
        title: "Creamy caprice dataviewer",
        centerLabel: "Center on:",
        coordsPlaceholder: "Latitude, Longitude (e.g.: 55.7558, 37.6173)",
        selectCity: "Select city",
        currentCenter: "Current center: ",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Last"
    }
};

let currentLang = 'ru'; // По умолчанию русский

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Обновляем текст элементов
    document.getElementById('page-title').textContent = t.title;
    // document.getElementById('main-title').textContent = t.title;
    document.getElementById('center-label').textContent = t.centerLabel;
    document.getElementById('coords-input').placeholder = t.coordsPlaceholder;
    document.getElementById('select-city-default').textContent = t.selectCity;
    document.getElementById('current-center-label').textContent = t.currentCenter;
    document.getElementById('copy-coords-btn').title = t.copyTooltip;
    
    // Обновляем кнопки навигации
    document.getElementById('first-btn').title = t.firstBtnTitle;
    document.getElementById('prev-btn').title = t.prevBtnTitle;
    document.getElementById('next-btn').title = t.nextBtnTitle;
    document.getElementById('last-btn').title = t.lastBtnTitle;
    
    // Обновляем кнопки языка
    document.getElementById('lang-ru').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en').title = lang === 'en' ? "Already English" : "Switch to English";
    
    // Обновляем классы активности
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    
    // Обновляем список городов
    populateCitiesDropdown();
	    
    // Пересоздаем календарь с новым языком
    if (datePicker) {
        datePicker.destroy();
    }
    initDatePicker();
    
    // Если координаты не определены, обновляем текст
    if (document.getElementById('current-center-coords').textContent === 'не определен' || 
        document.getElementById('current-center-coords').textContent === 'undefined') {
        document.getElementById('current-center-coords').textContent = t.undefinedCoords;
    }
}

// Обработчики кнопок переключения языка
document.getElementById('lang-ru').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем постоянный слой
    loadPermanentKml();
		
    // Инициализируем календарь
    initDatePicker();
    
    // Загружаем последний файл по умолчанию
    preserveZoom = false; // true - Всегда сохранять масштаб (если нужно полностью отключить автоматическое масштабирование)
    navigateTo(kmlFiles.length - 1);
	
    // Инициализируем отображение центра
    updateCurrentCenterDisplay();    
	
	// Устанавливаем русский язык по умолчанию
    setLanguage('ru');
});
