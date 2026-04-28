// filters.js
// ============================================
// Категории техники
const equipmentCategories = [
    { tag: 'Авиация',                   labelRu: 'Авиация',     labelEn: 'Aircraft' },
    { tag: 'Артиллерия',                labelRu: 'Артиллерия',  labelEn: 'Artillery' },
    { tag: 'БПЛА',                      labelRu: 'БПЛА',        labelEn: 'UAV' },
    { tag: 'Бронированный транспорт',   labelRu: 'Бронемашины', labelEn: 'AFV' },
    { tag: 'ПВО',                       labelRu: 'ПВО',         labelEn: 'GBAD' },
    { tag: 'Танк',                      labelRu: 'Танки',       labelEn: 'Tanks' },
    { tag: 'Небронированный транспорт', labelRu: 'Транспорт',   labelEn: 'Vehicles' },
    { tag: 'Другое',                    labelRu: 'Другое',      labelEn: 'Other' },
    { tag: 'Другое/Нет данных',         labelRu: 'Нет данных',  labelEn: 'No data' }
];

// Категории атак (полностью аналогично)
const attackCategories = [
    { tag: 'Объект неустановленного назначения',               labelRu: 'Объект неустановленного назначения', labelEn: 'Unidentified facility' },
    { tag: 'Предприятие ВПК',                                  labelRu: 'Предприятие ВПК',                    labelEn: 'Defense industry facility' },
    { tag: 'ЖД инфраструктура',                                labelRu: 'ЖД инфраструктура',                  labelEn: 'Railway infrastructure' },
    { tag: 'Аэродром',                                         labelRu: 'Аэродром',                           labelEn: 'Airfield' },
    { tag: 'Предприятие гражданского или двойного назначения', labelRu: 'Предприятие гражданского или двойного назначения', labelEn: 'Civil or dual-use facility' },
    { tag: 'ПВО, РЛС и ракетное вооружение',                   labelRu: 'ПВО, РЛС и ракетное вооружение',     labelEn: 'Air defense, radar, missile weapons' },
    { tag: 'Подстанция',                                       labelRu: 'Подстанция',                         labelEn: 'Substation' },
    { tag: 'Склад',                                            labelRu: 'Склад',                              labelEn: 'Warehouse' },
    { tag: 'Склад ГСМ',                                        labelRu: 'Склад ГСМ',                          labelEn: 'Fuel depot' },
    { tag: 'Энергогенерация',                                  labelRu: 'Энергогенерация',                    labelEn: 'Power generation' },
    { tag: 'Тяговая подстанция',                               labelRu: 'Тяговая подстанция',                 labelEn: 'Traction substation' },
    { tag: 'Мост',                                             labelRu: 'Мост',                               labelEn: 'Bridge' },
    { tag: 'Газовая инфраструктура',                           labelRu: 'Газовая инфраструктура',             labelEn: 'Gas infrastructure' },
    { tag: 'Судно',                                            labelRu: 'Судно',                              labelEn: 'Ship' },
    { tag: 'Склад боеприпасов',                                labelRu: 'Склад боеприпасов',                  labelEn: 'Ammunition depot' },
    { tag: 'Стоянка грузового транспорта',                     labelRu: 'Стоянка грузового транспорта',       labelEn: 'Truck parking' },
    { tag: 'ППД',                                              labelRu: 'ППД',                                labelEn: 'Permanent deployment point' },
    { tag: 'Поезда и локомотивы',                              labelRu: 'Поезда и локомотивы',                labelEn: 'Trains and locomotives' }
];

// Группы атак – каждая группа содержит несколько категорий
const attackGroups = [
    {
        tag: 'group1',
        labelRu: 'Аэродромы',
        labelEn: 'Air Bases',
        categories: [
            'Аэродром'
        ]
    },
    {
        tag: 'group2',
        labelRu: 'Военные базы',
        labelEn: 'Military sites',
        categories: [
            'ППД',
            'Склад боеприпасов'
            
         ]
        
    },
    {
        tag: 'group3',
        labelRu: 'ГТС',
        labelEn: 'GTS',
        categories: [
            'Газовая инфраструктура'
            
         ]
        
    },
    {
        tag: 'group4',
        labelRu: 'ЖД объекты',
        labelEn: 'Railways',
        categories: [
            'ЖД инфраструктура',
            'Тяговая подстанция',
        ]
    },
    {
        tag: 'group5',
        labelRu: 'Логистика',
        labelEn: 'Logistics',
        categories: [
            'Стоянка грузового транспорта',
            'Мост'
        ]
    },
    {
        tag: 'group6',
        labelRu: 'ПВО/РВ',
        labelEn: 'AD/GMW',
        categories: [
            'ПВО, РЛС и ракетное вооружение'
        ]
    },
    {
        tag: 'group7',
        labelRu: 'Производство',
        labelEn: 'Factories',
        categories: [
            'Предприятие ВПК',
            'Предприятие гражданского или двойного назначения'
        ]
    },
    
    {
        tag: 'group8',
        labelRu: 'Склады',
        labelEn: 'Warehouses',
        categories: [
            'Склад',
            'Склад ГСМ'
        ]
    },
        
    {
        tag: 'group9',
        labelRu: 'Транспорт',
        labelEn: 'Transport',
        categories: [
            'Судно',
            'Поезда и локомотивы'            
        ]
    },
    {
        tag: 'group10',
        labelRu: 'Энергетика',
        labelEn: 'Energy',
        categories: [
            'Энергогенерация',
            'Подстанция',
                   
        ]
    },
    {
        tag: 'group11',
        labelRu: 'Не определено',
        labelEn: 'Undefined',
        categories: [
            'Объект неустановленного назначения',
                       
        ]
    }
];

// Отображение категории -> группа (для быстрой проверки)
const categoryToGroupTag = {};
attackGroups.forEach(group => {
    group.categories.forEach(cat => {
        categoryToGroupTag[cat] = group.tag;
    });
});


// Глобальные переменные для фильтров
window.allEquipmentMarkers = [];     // { marker, category }
// начальное состояние – ничего не выбрано (пустой массив)
window.selectedEquipmentCategories = [];  // null = все, иначе массив
window.isMilEquipVisible = false;

window.allAttacksMarkers = [];
// начальное состояние – ничего не выбрано (пустой массив)
window.selectedAttacksCategories = []; // хранит массив tag групп (или null)
window.isAttacksVisible = false;

// Вспомогательный флаг для предотвращения рекурсии
let isUpdatingFilter = false;

// ========== ОБЩИЕ УТИЛИТЫ ==========
function syncSelectAllState(selectAllId, checkboxClass) {
    const selectAll = document.getElementById(selectAllId);
    if (!selectAll) return;
    const catCheckboxes = document.querySelectorAll(`.${checkboxClass}`);
    const allChecked = Array.from(catCheckboxes).every(cb => cb.checked);
    selectAll.checked = allChecked;
}

// ========== ФИЛЬТР ТЕХНИКИ ==========
function initEquipmentFilter() {
    const container = document.getElementById('equip-category-list');
    if (!container) return;
    container.innerHTML = '';
    equipmentCategories.forEach(cat => {
        const label = currentLang === 'ru' ? cat.labelRu : cat.labelEn;
        const div = document.createElement('div');
        div.innerHTML = `<label><input type="checkbox" class="equip-cat-checkbox" value="${cat.tag}"> ${label}</label>`;
        container.appendChild(div);
    });
    
    const selectAll = document.getElementById('equip-select-all');
    const catCheckboxes = document.querySelectorAll('.equip-cat-checkbox');
    
    // Восстановление состояния – пустой массив означает ничего не выбрано
    if (window.selectedEquipmentCategories === null) {
        // null означает «все», но при инициализации такого быть не должно
        selectAll.checked = true;
        catCheckboxes.forEach(cb => cb.checked = true);
    } else if (window.selectedEquipmentCategories.length === 0) {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => cb.checked = false);
    } else {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => {
            cb.checked = window.selectedEquipmentCategories.includes(cb.value);
        });
    }
    
    selectAll.addEventListener('change', () => {
        const isChecked = selectAll.checked;
        catCheckboxes.forEach(cb => cb.checked = isChecked);
        updateEquipmentFilter();
    });
    
    catCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            syncSelectAllState('equip-select-all', 'equip-cat-checkbox');
            updateEquipmentFilter();
        });
    });
    
    // Применяем начальное состояние фильтра (скрываем всё)
    updateEquipmentFilter();
}

function updateEquipmentFilter() {
    if (isUpdatingFilter) return;
    isUpdatingFilter = true;
    
    const selectAll = document.getElementById('equip-select-all');
    const catCheckboxes = document.querySelectorAll('.equip-cat-checkbox');
    const milEquipBtn = document.getElementById('mil-equip-btn');
    
    if (selectAll.checked) {
        window.selectedEquipmentCategories = null;
        window.isMilEquipVisible = true;
        milEquipBtn.classList.add('active');
        applyEquipmentFilter();
    } else {
        const selected = Array.from(catCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        window.selectedEquipmentCategories = selected;
        if (selected.length === 0) {
            window.isMilEquipVisible = false;
            milEquipBtn.classList.remove('active');
            hideAllEquipmentMarkers();
        } else {
            window.isMilEquipVisible = true;
            milEquipBtn.classList.add('active');
            applyEquipmentFilter();
        }
    }
    isUpdatingFilter = false;
}

function applyEquipmentFilter() {
    if (!window.isMilEquipVisible) {
        hideAllEquipmentMarkers();
        return;
    }
    window.allEquipmentMarkers.forEach(item => {
        const shouldShow = (window.selectedEquipmentCategories === null) ||
                           window.selectedEquipmentCategories.includes(item.category);
        if (shouldShow) {
            if (!map.hasLayer(item.marker)) item.marker.addTo(map);
        } else {
            if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
        }
    });
}

function hideAllEquipmentMarkers() {
    window.allEquipmentMarkers.forEach(item => {
        if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
    });
}

function toggleEquipmentMenu() {
    const menu = document.getElementById('equipment-filter-menu');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    if (!isVisible) {
        const btn = document.getElementById('mil-equip-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + window.scrollY) + 'px';
        menu.style.left = (rect.left + window.scrollX) + 'px';
        menu.style.display = 'block';
        if (window.allEquipmentMarkers.length === 0 && window.milequipKmlPaths) {
            initMilequipLayer(window.milequipKmlPaths).then(() => applyEquipmentFilter());
        } else {
            applyEquipmentFilter();
        }
    } else {
        menu.style.display = 'none';
    }
}

// Функция для обновления заголовка кнопки техники
function updateMilEquipButtonTitle() {
    const btn = document.getElementById('mil-equip-btn');
    if (btn) {
        const t = translations[currentLang];
        btn.title = window.isMilEquipVisible ? (t.hideEquipment || 'Скрыть технику') : (t.showEquipment || 'Показать технику');
    }
}

// ========== ФИЛЬТР АТАК ==========
function initAttacksFilter() {
    const container = document.getElementById('attacks-category-list');
    if (!container) return;
    container.innerHTML = '';
    
    // Строим чекбоксы для групп
    attackGroups.forEach(group => {
        const label = currentLang === 'ru' ? group.labelRu : group.labelEn;
        const div = document.createElement('div');
        div.innerHTML = `<label><input type="checkbox" class="attacks-cat-checkbox" value="${group.tag}"> ${label}</label>`;
        container.appendChild(div);
    });
    
    const selectAll = document.getElementById('attacks-select-all');
    const catCheckboxes = document.querySelectorAll('.attacks-cat-checkbox');
    
    if (window.selectedAttacksCategories === null) {
        selectAll.checked = true;
        catCheckboxes.forEach(cb => cb.checked = true);
    } else if (window.selectedAttacksCategories.length === 0) {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => cb.checked = false);
    } else {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => {
            cb.checked = window.selectedAttacksCategories.includes(cb.value);
        });
    }
    
    selectAll.addEventListener('change', () => {
        const isChecked = selectAll.checked;
        catCheckboxes.forEach(cb => cb.checked = isChecked);
        updateAttacksFilter();
    });
    
    catCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            syncSelectAllState('attacks-select-all', 'attacks-cat-checkbox');
            updateAttacksFilter();
        });
    });
    
    updateAttacksFilter();
}

function updateAttacksFilter() {
    if (isUpdatingFilter) return;
    isUpdatingFilter = true;
    
    const selectAll = document.getElementById('attacks-select-all');
    const catCheckboxes = document.querySelectorAll('.attacks-cat-checkbox');
    const attacksBtn = document.getElementById('attacks-on-ua-btn');
    
    if (selectAll.checked) {
        window.selectedAttacksCategories = null;
        window.isAttacksVisible = true;
        attacksBtn.classList.add('active');
        applyAttacksFilter();
    } else {
        const selected = Array.from(catCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        window.selectedAttacksCategories = selected;
        if (selected.length === 0) {
            window.isAttacksVisible = false;
            attacksBtn.classList.remove('active');
            hideAllAttacksMarkers();
        } else {
            window.isAttacksVisible = true;
            attacksBtn.classList.add('active');
            applyAttacksFilter();
        }
    }
    isUpdatingFilter = false;
}

function applyAttacksFilter() {
    if (!window.isAttacksVisible) {
        hideAllAttacksMarkers();
        return;
    }
    
    // Если выбраны все группы (null) – показываем всё
    if (window.selectedAttacksCategories === null) {
        window.allAttacksMarkers.forEach(item => {
            if (!map.hasLayer(item.marker)) item.marker.addTo(map);
        });
        return;
    }
    
    // Иначе показываем только те маркеры, чья категория входит в выбранные группы
    const selectedGroupsSet = new Set(window.selectedAttacksCategories);
    window.allAttacksMarkers.forEach(item => {
        const groupTag = categoryToGroupTag[item.category];
        const shouldShow = groupTag && selectedGroupsSet.has(groupTag);
        if (shouldShow) {
            if (!map.hasLayer(item.marker)) item.marker.addTo(map);
        } else {
            if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
        }
    });
}

function hideAllAttacksMarkers() {
    window.allAttacksMarkers.forEach(item => {
        if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
    });
}

function toggleAttacksMenu() {
    const menu = document.getElementById('attacks-filter-menu');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    if (!isVisible) {
        const btn = document.getElementById('attacks-on-ua-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + window.scrollY) + 'px';
        menu.style.left = (rect.left + window.scrollX) + 'px';
        menu.style.display = 'block';
        if (window.allAttacksMarkers.length === 0 && window.attacksOnUaKmlPaths) {
            initAttacksOnUaLayer(window.attacksOnUaKmlPaths).then(() => applyAttacksFilter());
        } else {
            applyAttacksFilter();
        }
    } else {
        menu.style.display = 'none';
    }
}

function updateAttacksOnUaButtonTitle() {
    const btn = document.getElementById('attacks-on-ua-btn');
    if (btn) {
        const t = translations[currentLang];
        btn.title = window.isAttacksVisible ? 
            (t.hideAttacksOnUa || 'Скрыть удары по Украине') : 
            (t.showAttacksOnUa || 'Показать удары по Украине');
    }
}

// ========== ФИЛЬТР ФОРТИФИКАЦИЙ ==========
// Глобальные переменные
window.allFortificationLayers = [];    // массив { layerGroup, filePath, displayName }
window.selectedFortificationFiles = []; // пустой массив – ничего не выбрано // null = все, иначе массив выбранных путей
window.isFortificationVisible = false; // переопределим, чтобы управлять через кнопку

// Названия файлов фортификаций на разных языках
const fortificationFileNames = {
    'CK_Trenches':   { ru: 'Траншеи',      en: 'Trenches' },
    'CK_Teeth':      { ru: 'Надолбы',      en: 'Dragon\'s teeth' },
    'CK_Ditches':    { ru: 'Рвы',          en: 'Ditches' },
    'CK_Wire':       { ru: 'Колючка',      en: 'Barbed wire' }
    // 'ditches3':      { ru: 'Рвы (старые)', en: 'Ditches (old)' },
    // 'Barbed_wire':   { ru: 'Колючка (старая)', en: 'Barbed wire (old)' },
    // 'teeth':         { ru: 'Надолбы (старые)', en: 'Dragon\'s teeth (old)' }
};

// Функция для получения отображаемого имени файла
function getFortificationDisplayName(filePath, lang = currentLang) {
    let name = filePath.split('/').pop();
    name = name.replace(/\.(kml|geojson)$/i, '');
    if (fortificationFileNames[name] && fortificationFileNames[name][lang]) {
        return fortificationFileNames[name][lang];
    }
    return null; // файл не поддерживается, не показывать в меню
}

// Инициализация меню фильтра фортификаций
function initFortificationFilter() {
    const container = document.getElementById('fortif-category-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (!window.fortificationKmlPaths || !window.fortificationKmlPaths.length) {
        container.innerHTML = '<div style="color:gray;">Нет данных</div>';
        return;
    }
    
    let hasAny = false;
    window.fortificationKmlPaths.forEach(filePath => {
        const displayName = getFortificationDisplayName(filePath, currentLang);
        if (!displayName) return; // пропускаем файлы без перевода
        hasAny = true;
        const div = document.createElement('div');
        div.innerHTML = `<label><input type="checkbox" class="fortif-cat-checkbox" value="${filePath.replace(/"/g, '&quot;')}"> ${displayName}</label>`;
        container.appendChild(div);
    });
    
    if (!hasAny) {
        container.innerHTML = '<div style="color:gray;">Нет данных</div>';
        return;
    }
    
    const selectAll = document.getElementById('fortif-select-all');
    const catCheckboxes = document.querySelectorAll('.fortif-cat-checkbox');
    
    // Восстановление состояния (по умолчанию ничего не выбрано)
    if (window.selectedFortificationFiles === null) {
        selectAll.checked = true;
        catCheckboxes.forEach(cb => cb.checked = true);
    } else if (window.selectedFortificationFiles.length === 0) {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => cb.checked = false);
    } else {
        selectAll.checked = false;
        catCheckboxes.forEach(cb => {
            cb.checked = window.selectedFortificationFiles.includes(cb.value);
        });
    }
    
    selectAll.addEventListener('change', () => {
        const isChecked = selectAll.checked;
        catCheckboxes.forEach(cb => cb.checked = isChecked);
        updateFortificationFilter();
    });
    
    catCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            syncSelectAllState('fortif-select-all', 'fortif-cat-checkbox');
            updateFortificationFilter();
        });
    });
    
    // Применяем начальное состояние
    updateFortificationFilter();
}

// Обновление фильтра (вызывается при изменении чекбоксов)
function updateFortificationFilter() {
    if (isUpdatingFilter) return;
    isUpdatingFilter = true;
    
    const selectAll = document.getElementById('fortif-select-all');
    const catCheckboxes = document.querySelectorAll('.fortif-cat-checkbox');
    const fortifBtn = document.getElementById('fortification-btn');
    
    if (selectAll.checked) {
        window.selectedFortificationFiles = null;
        window.isFortificationVisible = true;
        fortifBtn.classList.add('active');
        applyFortificationFilter();
    } else {
        const selected = Array.from(catCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        window.selectedFortificationFiles = selected;
        if (selected.length === 0) {
            window.isFortificationVisible = false;
            fortifBtn.classList.remove('active');
            hideAllFortificationLayers();
        } else {
            window.isFortificationVisible = true;
            fortifBtn.classList.add('active');
            applyFortificationFilter();
        }
    }
    isUpdatingFilter = false;
}

// Применение текущего фильтра к слоям
function applyFortificationFilter() {
    if (!window.allFortificationLayers.length) return;
    
    if (!window.isFortificationVisible) {
        hideAllFortificationLayers();
        return;
    }
    
    // Если выбраны все файлы (null) – показываем все слои
    if (window.selectedFortificationFiles === null) {
        window.allFortificationLayers.forEach(item => {
            if (!map.hasLayer(item.layerGroup)) item.layerGroup.addTo(map);
        });
        return;
    }
    
    // Иначе показываем только выбранные
    const selectedSet = new Set(window.selectedFortificationFiles);
    window.allFortificationLayers.forEach(item => {
        const shouldShow = selectedSet.has(item.filePath);
        if (shouldShow) {
            if (!map.hasLayer(item.layerGroup)) item.layerGroup.addTo(map);
        } else {
            if (map.hasLayer(item.layerGroup)) map.removeLayer(item.layerGroup);
        }
    });
}

function hideAllFortificationLayers() {
    window.allFortificationLayers.forEach(item => {
        if (map.hasLayer(item.layerGroup)) map.removeLayer(item.layerGroup);
    });
}

// Переключение видимости меню фильтра фортификаций
function toggleFortificationMenu() {
    const menu = document.getElementById('fortification-filter-menu');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    if (!isVisible) {
        const btn = document.getElementById('fortification-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + window.scrollY) + 'px';
        menu.style.left = (rect.left + window.scrollX) + 'px';
        menu.style.display = 'block';
        // Если слои ещё не загружены, загружаем их
        if (window.allFortificationLayers.length === 0 && window.fortificationKmlPaths) {
            initFortificationLayerWithFilter(window.fortificationKmlPaths).then(() => applyFortificationFilter());
        } else {
            applyFortificationFilter();
        }
    } else {
        menu.style.display = 'none';
    }
}

// Обновление заголовка кнопки
function updateFortificationButtonTitle() {
    const btn = document.getElementById('fortification-btn');
    if (btn) {
        const t = translations[currentLang];
        btn.title = window.isFortificationVisible ? 
            (t.hideFortifications || 'Скрыть фортификации') : 
            (t.showFortifications || 'Показать фортификации');
    }
}

// Новая функция загрузки фортификаций с поддержкой отдельных слоёв
async function initFortificationLayerWithFilter(kmlFilePaths) {
    // Очищаем старые данные
    if (window.allFortificationLayers.length) {
        window.allFortificationLayers.forEach(item => {
            if (map.hasLayer(item.layerGroup)) map.removeLayer(item.layerGroup);
        });
        window.allFortificationLayers = [];
    }
    
    for (const path of kmlFilePaths) {
        // Проверяем, должен ли этот файл отображаться в меню
        const displayName = getFortificationDisplayName(path, currentLang);
        if (!displayName) continue; // пропускаем
    
        const layerGroup = L.layerGroup();
        const ext = path.split('.').pop().toLowerCase();
        
        try {
            if (ext === 'geojson' || ext === 'json') {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const geojsonData = await response.json();
                const geoJsonLayer = L.geoJSON(geojsonData, {
                    style: function(feature) {
                        return {
                            color: feature.properties?.stroke || '#ff0000',
                            weight: feature.properties?.['stroke-width'] || 2,
                            opacity: feature.properties?.['stroke-opacity'] || 1,
                        };
                    },
                    onEachFeature: function(feature, layer) {
                        if (feature.properties && feature.properties.name) {
                            layer.bindPopup(feature.properties.name);
                        }
                    }
                });
                geoJsonLayer.addTo(layerGroup);
            } else {
                // KML
                await loadKmlToLayer(path, layerGroup, {
                    isPermanent: false,
                    preserveZoom: true,
                    fitBounds: false
                });
            }
            window.allFortificationLayers.push({
                layerGroup: layerGroup,
                filePath: path,
                displayName: displayName
            });
            console.log(`Загружен слой фортификации: ${path}`);
        } catch (error) {
            console.error(`Ошибка загрузки фортификации ${path}:`, error);
        }
    }
    
    if (window.isFortificationVisible) applyFortificationFilter();
    else hideAllFortificationLayers();
    
    return window.allFortificationLayers;
}

// ========== СЛОЙ ПОДРАЗДЕЛЕНИЙ ВСУ ==========

// Глобальные переменные для слоя
window.unitsUaMarkers = [];          // массив маркеров
window.isUnitsUaVisible = false;     // флаг видимости
window.unitsUaLayer = null;          // групп-слой
window.unitsUaIconsMap = {};         // словарь id → { photo, title }
window.unitsUaIconsLoaded = false;   // загружен ли result.json

// Загрузка иконок и названий из result.json (поддержка photo и file_name)
async function loadUnitsUaIcons() {
    if (window.unitsUaIconsLoaded) return;

    const jsonPath = window.unitsUaJsonPath;
    if (!jsonPath) {
        console.error('Путь к UnitsUA.json не задан (window.unitsUaJsonPath)');
        return;
    }

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        for (const msg of data.messages) {
            // Пропускаем сообщения без файла (например, «Резерв»)
            if (!msg.file && !msg.file_name) continue;

            let imagePath = null;
            // Используем file (уже содержит путь относительно units/ua, например "files/8.png")
            if (msg.file && typeof msg.file === 'string') {
                imagePath = msg.file;                     // "files/8.png"
            } else if (msg.file_name && typeof msg.file_name === 'string') {
                imagePath = 'files/' + msg.file_name;    // "files/some_name.png"
            }

            if (!imagePath) continue;

            // Извлекаем полный текст сообщения (строка или массив)
            let text = '';
            if (typeof msg.text === 'string') {
                text = msg.text;
            } else if (Array.isArray(msg.text)) {
                text = msg.text.map(part => (typeof part === 'string' ? part : part.text)).join('');
            } else {
                continue;
            }

            const idMatch = text.match(/^ID\s*:\s*(\d+)/m);
            if (!idMatch) continue;

            const profileId = idMatch[1];

            // Название — первая непустая строка после ID
            const lines = text.split('\n');
            let title = '';
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('http')) {
                    title = line;
                    break;
                }
            }

            window.unitsUaIconsMap[profileId] = {
                photo: imagePath,                                    // уже относительно units/ua
                title: title || `Подразделение ID:${profileId}`
            };
        }

        window.unitsUaIconsLoaded = true;
        console.log(`Загружено ${Object.keys(window.unitsUaIconsMap).length} иконок подразделений`);

    } catch (error) {
        console.error('Ошибка загрузки UnitsUA.json:', error);
        window.unitsUaIconsLoaded = true;
    }
}

// Парсинг даты из CSV (формат YYYY.MM.DD)
function parseCsvDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // месяцы в JS 0-11
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

// Парсинг строки CSV
function parseUnitsCsvRow(row) {
    const parts = row.split(',');
    if (parts.length < 7) return null; // минимум до столбца "Источник"
    return {
        // id: parts[0].trim(), // больше не нужно
        profileId: parts[1].trim(),   // было parts[1] – остаётся, но индекс изменился
        date: parts[2].trim(),        // было parts[2]
        lat: parseFloat(parts[3].trim()),
        lng: parseFloat(parts[4].trim()),
        characteristic: parts[5].trim(),
        link: parts[6].trim()         // источник
        // details: parts[7] – можно добавить, но не используется
    };
}

// Функция загрузки точек с фильтром по дате (только ПВД, не более одной на ID)
async function loadUnitsUaWithDateFilter(targetDateStr) {
    if (!window.unitsUaCsvPath) {
        console.error('Путь к CSV не задан в data.js');
        return;
    }

    try {
        const response = await fetch(window.unitsUaCsvPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return;

        const dataLines = lines.slice(1); // без заголовка

        // Парсим все строки
        const allRows = [];
        for (const line of dataLines) {
            const data = parseUnitsCsvRow(line);
            if (!data) continue;
            if (isNaN(data.lat) || isNaN(data.lng)) continue;
            if (data.characteristic !== 'ПВД') continue;
            allRows.push(data);
        }

        // Группируем по profileId
        const byProfile = {};
        allRows.forEach(row => {
            if (!byProfile[row.profileId]) byProfile[row.profileId] = [];
            byProfile[row.profileId].push(row);
        });

        // Целевая дата (из календаря)
        const targetDate = parseCustomDate(targetDateStr);

        // Для каждого ID выбираем точку с датой <= targetDate и максимальной
        const selectedRows = [];

        for (const profileId in byProfile) {
            const rows = byProfile[profileId];
            // Фильтруем даты <= targetDate
            const validRows = rows.filter(row => {
                const rowDate = parseCsvDate(row.date);
                return rowDate <= targetDate;
            });

            if (validRows.length === 0) continue;

            // Находим строку с максимальной датой (ближайшая к целевой, но не позже)
            const latestRow = validRows.reduce((a, b) => {
                const dateA = parseCsvDate(a.date);
                const dateB = parseCsvDate(b.date);
                return dateA > dateB ? a : b;
            });

            selectedRows.push(latestRow);
        }

        // Загружаем иконки (если ещё не загружены)
        await loadUnitsUaIcons();

        // Очищаем слой
        if (window.unitsUaLayer) {
            window.unitsUaLayer.clearLayers();
        } else {
            window.unitsUaLayer = L.layerGroup();
        }
        window.unitsUaMarkers = [];

        // Иконка по умолчанию
        const defaultIcon = L.icon({
            iconUrl: 'img/attack types/Взрывчик.png',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, 0]
        });

        // Создаём маркеры
        for (const row of selectedRows) {
            let icon = defaultIcon;
            let unitTitle = '';
            const iconInfo = window.unitsUaIconsMap[row.profileId];
            if (iconInfo) {
                icon = L.icon({
                    iconUrl: `units/ua/${iconInfo.photo}`,
                    iconSize: [28, 32],
                    iconAnchor: [14, 16],
                    popupAnchor: [0, -16]
                });
                unitTitle = iconInfo.title;
            } else {
                unitTitle = `ID:${row.profileId}`;
            }

            const marker = L.marker([row.lat, row.lng], { icon: icon });
            const coordsString = `${row.lat.toFixed(6)}, ${row.lng.toFixed(6)}`;
            /*
            const popupContent = `
                <div style="font-size:14px;">
                    <strong>${unitTitle}</strong><br>
                    <strong>Дата:</strong> ${row.date}<br>
                    <strong>Характеристика:</strong> ${row.characteristic}<br>
                    <strong>Координаты:</strong> 
                    <span style="font-family: monospace;">${coordsString}</span>
                    <button class="copy-coords-popup-btn" data-coords="${coordsString}" 
                            style="cursor: pointer; background: #007bff; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 12px; margin-left: 8px;">
                        ⎘
                    </button><br>
                    ${row.link ? `<a href="${row.link}" target="_blank">Источник</a>` : ''}
                </div>
            `;
            */
            const popupContent = `
                <div style="font-size:14px;">
                    <strong>${unitTitle}</strong><br>
                </div>
            `;            
            
            marker.bindPopup(popupContent);
            marker.addTo(window.unitsUaLayer);
            window.unitsUaMarkers.push(marker);
        }

        console.log(`Загружено ${window.unitsUaMarkers.length} точек ПВД для даты ${targetDateStr}`);

    } catch (error) {
        console.error('Ошибка загрузки CSV подразделений ВСУ:', error);
    }
}

// Перезагрузка слоя с учётом текущей selectedDate
function reloadUnitsUaLayer() {
    if (window.isUnitsUaVisible) {
        // Всегда используем актуальную дату из календаря
        const currentDate = window.selectedDate;
        if (!currentDate) {
            console.warn('reloadUnitsUaLayer: selectedDate не определена, используется текущая дата');
            currentDate = getCurrentDateFormatted();
        }
        loadUnitsUaWithDateFilter(currentDate).then(() => {
            // Убедимся, что слой на карте
            if (!map.hasLayer(window.unitsUaLayer)) {
                window.unitsUaLayer.addTo(map);
            }
        });
    }
}

// Переключение видимости слоя
async function toggleUnitsUa() {
    if (!window.isUnitsUaVisible) {
        // Показать слой: загрузить данные с фильтром по текущей дате
        const currentDate = window.selectedDate || getCurrentDateFormatted();
        await loadUnitsUaWithDateFilter(currentDate);
        window.unitsUaLayer.addTo(map);
        window.isUnitsUaVisible = true;
        document.getElementById('units-ua-btn').classList.add('active');
    } else {
        // Скрыть
        if (map.hasLayer(window.unitsUaLayer)) {
            map.removeLayer(window.unitsUaLayer);
        }
        window.isUnitsUaVisible = false;
        document.getElementById('units-ua-btn').classList.remove('active');
    }

    const btn = document.getElementById('units-ua-btn');
    if (btn) {
        const t = translations[currentLang];
        btn.title = window.isUnitsUaVisible ?
            (t.hideUnitsUa || 'Скрыть подразделения ВСУ') :
            (t.showUnitsUa || 'Показать подразделения ВСУ');
    }
}

// Инициализация кнопки
function initUnitsUaButton() {
    const btn = document.getElementById('units-ua-btn');
    if (!btn) return;
    btn.addEventListener('click', toggleUnitsUa);
    window.isUnitsUaVisible = false;
    btn.classList.remove('active');
    const t = translations[currentLang];
    btn.title = t.showUnitsUa || 'Показать подразделения ВСУ';
}

// Экспортируем новые функции

// ========== ИНИЦИАЛИЗАЦИЯ ВСЕХ ФИЛЬТРОВ ==========
function initFilters() {
    initEquipmentFilter();
    initAttacksFilter();
    initFortificationFilter();
    // Обновим заголовки кнопок
    updateMilEquipButtonTitle();
    updateAttacksOnUaButtonTitle();
    updateFortificationButtonTitle();
}

// Экспортируем функции, которые будут нужны в script.js
window.initFilters = initFilters;
window.initFortificationFilter = initFortificationFilter;
window.initFortificationLayerWithFilter = initFortificationLayerWithFilter;

window.toggleEquipmentMenu = toggleEquipmentMenu;
window.toggleAttacksMenu = toggleAttacksMenu;
window.toggleFortificationMenu = toggleFortificationMenu;

window.updateMilEquipButtonTitle = updateMilEquipButtonTitle;
window.updateAttacksOnUaButtonTitle = updateAttacksOnUaButtonTitle;
window.updateFortificationButtonTitle = updateFortificationButtonTitle;

window.applyEquipmentFilter = applyEquipmentFilter;
window.applyAttacksFilter = applyAttacksFilter;
window.applyFortificationFilter = applyFortificationFilter;

window.hideAllEquipmentMarkers = hideAllEquipmentMarkers;
window.hideAllAttacksMarkers = hideAllAttacksMarkers;
window.hideAllFortificationLayers = hideAllFortificationLayers;

window.reloadUnitsUaLayer = reloadUnitsUaLayer;


//
document.addEventListener('DOMContentLoaded', function() {
    // Перемещаем меню техники в body
    const equipMenu = document.getElementById('equipment-filter-menu');
    if (equipMenu && equipMenu.parentNode !== document.body) {
        document.body.appendChild(equipMenu);
    }
    
    // Перемещаем меню атак в body
    const attacksMenu = document.getElementById('attacks-filter-menu');
    if (attacksMenu && attacksMenu.parentNode !== document.body) {
        document.body.appendChild(attacksMenu);
    }
    
    // Перемещаем меню фортификаций в body
    const fortificationMenu = document.getElementById('fortification-filter-menu');
    if (fortificationMenu && fortificationMenu.parentNode !== document.body) {
        document.body.appendChild(fortificationMenu);
    }
});
