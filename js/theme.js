// ============================================================
// Дизайн-токены для JS. Зеркало css/variables.css.
// Подключается ПЕРВЫМ из всех скриптов.
// ============================================================

window.THEME = {
    // Брейкпоинты (px). Должны совпадать с @media в css/*.css
    breakpoints: {
        mobile:  480,   // ≤ 480px  — очень узкие экраны
        tablet:  768,   // ≤ 768px  — мобильные / планшеты
        compact: 901,   // ≤ 901px  — планшеты, узкие десктопы
        desktop: 1201   // ≥ 1201px — десктоп (полная панель навигации)
    },

    // Цвета (значения = токены из css/variables.css)
    colors: {
        // Слои карты
        layerDefault: '#3388ff',
        layerRuAF:    '#ff0000',
        layerAFU:     '#0000ff',
        layerCity:    '#999999',
        layerMG:      '#ffffff',

        // Семантические
        primary:      '#007bff',
        primaryDark:  '#2563eb',
        primaryLight: '#e6f2ff',
        success:      '#4caf50',
        successLight: '#81c784',
        danger:       '#dc3545',
        dangerSolid:  '#ff0000',
        warning:      '#ffc107',
        neutral:      '#6c757d',

        // Подсветка при наведении на слои
        hoverHighlight: '#ff0000',

        // Линейка (PolylineMeasure)
        rulerBg:      '#f8f8f8',
        rulerLine:    '#ff00ff'
    }
};

// Хелперы определения типа вьюпорта (замещают разрозненные
// проверки window.innerWidth <= N по всему коду)
window.isMobileViewport  = function () { return window.innerWidth <= THEME.breakpoints.tablet;  }; // ≤ 768
window.isCompactViewport = function () { return window.innerWidth <= THEME.breakpoints.compact;  }; // ≤ 901
window.isDesktopViewport = function () { return window.innerWidth >= THEME.breakpoints.desktop; }; // ≥ 1201
