// Основные KML-файлы - автоматически генерируются из dateList

// Функция для преобразования даты из формата "DD.MM.YY" в "YY_MM_DD"
function formatDateForFilename(dateStr) {
    const [day, month, year] = dateStr.split('.');
    return `${year}_${month}_${day}`;
}

// Функция для определения типов файлов, доступных для каждой даты
function getFileTypesForDate(dateStr) {
    const date = new Date(2000 + parseInt(dateStr.split('.')[2]), 
                         parseInt(dateStr.split('.')[1]) - 1, 
                         parseInt(dateStr.split('.')[0]));
    
    const startDate = new Date(2023, 8, 3); // 03.09.2023
    const frontLineStart = new Date(2025, 1, 1); // 01.02.2025
    const ruafafuStart = new Date(2025, 9, 17); // 17.10.2025
    const ruafafuEnd = new Date(2026, 0, 25); // 25.01.2026
    const combinedProgressStart = new Date(2025, 9, 9); // 09.10.2025
    
    const types = [];
    
    // ControlZones доступен для всех дат
    types.push("ControlZones");
    
    // FrontLine доступен с 01.02.2025
    if (date >= frontLineStart) {
        types.push("FrontLine");
    }
    
    // ProgressRuAF и ProgressAFU доступны с 17.10.2025 до 25.01.2026
    if (date >= ruafafuStart && date <= ruafafuEnd) {
        types.push("ProgressRuAF");
        types.push("ProgressAFU");
    }
    
    // Progress доступен с 09.10.2025
    if (date >= combinedProgressStart) {
        types.push("Progress");
    }
    
    return types;
}

// Генерация window.kmlFiles на основе dateList
window.kmlFiles = (window.dateList || []).map(dateStr => {
    const formattedDate = formatDateForFilename(dateStr);
    const types = getFileTypesForDate(dateStr);
    
    const paths = types.map(type => {
        switch(type) {
            case "ControlZones":
                return `kml/ControlZones/Control_${formattedDate}.kml`;
            case "FrontLine":
                return `kml/FrontLine/FrontLine_${formattedDate}.kml`;
            //case "ProgressRuAF":
            //    return `kml/Progress/RuAF/ProgressRuAF_${formattedDate}.kml`;
            //case "ProgressAFU":
            //    return `kml/Progress/AFU/ProgressAFU_${formattedDate}.kml`;
            case "Progress":
                return `kml/Progress/Progress_${formattedDate}.kml`;
            default:
                return null;
        }
    }).filter(path => path !== null);
    
    return {
        name: dateStr,
        paths: paths
    };
});



///////////////////////////////////////////////////////////////



// Постоянные слои
window.permanentLayers = [
    // Текущая ЛБС
    { name: "Current_frontline",      path: "kml/FrontLine/FrontLine_26_02_18.kml" },
      // Граница ЛДНР без Ростовской области
    { name: "LDPR",                   path: "kml/PermanentObjects/LDPR_Border.kml" },
    //Конституционная граница РФ
    { name: "RuUaBorder",             path: "kml/PermanentObjects/RuUaBorder.kml" },
        //Единая линия на 10.10.23
    { name: "Offensive_23_10_10",     path: "kml/PermanentObjects/OffensiveLine_2023_10_10.kml" },
    //Линия максимального продвижения ВСУ в Курской области.
    { name: "AFU_advance_Kursk2024",  path: "kml/PermanentObjects/AFU_advance_Kursk2024.kml" },
    // Контур максимального продвижения в Доброполье
    { name: "Добропольский прорыв",  path: "kml/PermanentObjects/Доброполье.kml" },
	{ name: "Мультиполигон",         path: "kml/PermanentObjects/CitiesBorders.kml" }

];

// Список городов с координатами
window.cities = [
    { name: { ru: "Суджа",      en: "Sudzha"     }, lat: 51.19055,  lng: 35.27082   },
    { name: { ru: "Волчанск",   en: "Volchansk"  }, lat: 50.288107, lng: 36.946217  },
    { name: { ru: "Купянск",    en: "Kupyansk"   }, lat: 49.706396, lng: 37.616586  },
    { name: { ru: "Боровая",    en: "Borovaya"   }, lat: 49.38417,  lng: 37.62086   },
    { name: { ru: "Северск",    en: "Seversk"    }, lat: 48.868709, lng: 38.106425  },
    //{ name: { ru: "Часов Яр",   en: "Chasov Yar" }, lat: 48.591656, lng: 37.820354  },
    { name: { ru: "Константиновка", en: "Konstantinovka" }, lat: 48.521389, lng: 37.714722 },
    { name: { ru: "Красноармейск", en: "Krasnoarmeisk" }, lat: 48.28566, lng:  37.17605 },
    { name: { ru: "Покровское", en: "Pokrovskoe" }, lat: 47.982166, lng:  36.232438 },
    { name: { ru: "Гуляйполе",  en: "Gulyaypole" }, lat: 47.66336,  lng:  36.2587   },
    { name: { ru: "Орехов",     en: "Orekhov"    }, lat: 47.5675,   lng:  35.78845  },
    { name: { ru: "Степногорск", en: "Stepnogorsk" }, lat: 47.588488,   lng:  35.362448 },
];


// Управление точками
// Путь к файлу с точками
 window.pointsKmlPaths = ["kml/Geolocations/2026 год январь.kml",
						  "kml/Geolocations/2023-2025.kml"];
 window.pointLayers = [];
 window.pointsDateRange = {
    start: null,
    end: null
 };

window.milequipKmlPaths = ["kml/Geolocations/Military_equipment.kml"];
window.milequipLayers = [];


window.attacksOnUaKmlPaths = ["kml/Geolocations/osint_alarm_2022.kml",
							  "kml/Geolocations/osint_alarm_2023.kml",
							  "kml/Geolocations/osint_alarm_2024.kml",
							  "kml/Geolocations/osint_alarm_2025.kml",
                              "kml/Geolocations/osint_alarm_2026.kml"];
window.attacksOnUaLayers = [];


window.fortificationKmlPaths = ["kml/Fortifications/Trenches_Pokrovsk.kml",
								"kml/Fortifications/Trenches_ Mezhevaya.kml",
								"kml/Fortifications/Trenches_Kramatorsk.kml",
								"kml/Fortifications/Ditches.kml",
								"kml/Fortifications/Barbed_wire.kml",
                                "kml/Fortifications/Dragons_teeth.kml"];
window.fortificationLayers = [];



















































































