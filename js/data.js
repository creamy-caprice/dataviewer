// Основные KML-файлы
window.kmlFiles = [
    { name: "03.09.23", path: "kml/ControlZones/Control_23_09_03.kml" },
    { name: "06.10.23", path: "kml/ControlZones/Control_23_10_06.kml" },
    { name: "01.11.23", path: "kml/ControlZones/Control_23_11_01.kml" },
    { name: "01.12.23", path: "kml/ControlZones/Control_23_12_01.kml" },

    { name: "01.01.24", path: "kml/ControlZones/Control_24_01_01.kml" },
    { name: "01.02.24", path: "kml/ControlZones/Control_24_02_01.kml" },
    { name: "01.03.24", path: "kml/ControlZones/Control_24_03_01.kml" },
    { name: "01.04.24", path: "kml/ControlZones/Control_24_04_01.kml" },
    { name: "01.05.24", path: "kml/ControlZones/Control_24_05_01.kml" },
    { name: "01.06.24", path: "kml/ControlZones/Control_24_06_01.kml" },
    { name: "01.07.24", path: "kml/ControlZones/Control_24_07_01.kml" },
    { name: "01.08.24", path: "kml/ControlZones/Control_24_08_01.kml" },
    { name: "01.09.24", path: "kml/ControlZones/Control_24_09_01.kml" },
    { name: "01.10.24", path: "kml/ControlZones/Control_24_10_01.kml" },
    { name: "01.11.24", path: "kml/ControlZones/Control_24_11_01.kml" },
    { name: "01.12.24", path: "kml/ControlZones/Control_24_12_01.kml" },

    { name: "01.01.25", path: "kml/ControlZones/Control_25_01_01.kml" },    
    { name: "01.02.25", path: "kml/ControlZones/Control_25_02_01.kml" },
    { name: "01.03.25", path: "kml/ControlZones/Control_25_03_01.kml" },
    { name: "01.04.25", path: "kml/ControlZones/Control_25_04_01.kml" },
    
    { name: "01.05.25", path: "kml/ControlZones/Control_25_05_01.kml" },
    { name: "02.05.25", path: "kml/ControlZones/Control_25_05_02.kml" },
    { name: "06.05.25", path: "kml/ControlZones/Control_25_05_06.kml" },
    { name: "10.05.25", path: "kml/ControlZones/Control_25_05_10.kml" },
    { name: "14.05.25", path: "kml/ControlZones/Control_25_05_14.kml" },
    { name: "18.05.25", path: "kml/ControlZones/Control_25_05_18.kml" },
    { name: "22.05.25", path: "kml/ControlZones/Control_25_05_22.kml" },
    { name: "26.05.25", path: "kml/ControlZones/Control_25_05_26.kml" },
    { name: "30.05.25", path: "kml/ControlZones/Control_25_05_30.kml" },
    { name: "01.06.25", path: "kml/ControlZones/Control_25_06_01.kml" },
    { name: "03.06.25", path: "kml/ControlZones/Control_25_06_03.kml" },
    { name: "07.06.25", path: "kml/ControlZones/Control_25_06_07.kml" },
    { name: "11.06.25", path: "kml/ControlZones/Control_25_06_11.kml" },
    { name: "15.06.25", path: "kml/ControlZones/Control_25_06_15.kml" },
    { name: "19.06.25", path: "kml/ControlZones/Control_25_06_19.kml" },
    { name: "23.06.25", path: "kml/ControlZones/Control_25_06_23.kml" },
    { name: "27.06.25", path: "kml/ControlZones/Control_25_06_27.kml" },
    { name: "01.07.25", path: "kml/ControlZones/Control_25_07_01.kml" },
    { name: "05.07.25", path: "kml/ControlZones/Control_25_07_05.kml" },
    { name: "09.07.25", path: "kml/ControlZones/Control_25_07_09.kml" },
    { name: "13.07.25", path: "kml/ControlZones/Control_25_07_13.kml" },
    { name: "17.07.25", path: "kml/ControlZones/Control_25_07_17.kml" },
    { name: "21.07.25", path: "kml/ControlZones/Control_25_07_21.kml" },
    { name: "25.07.25", path: "kml/ControlZones/Control_25_07_25.kml" },
    { name: "29.07.25", path: "kml/ControlZones/Control_25_07_29.kml" },
    { name: "02.08.25", path: "kml/ControlZones/Control_25_08_02.kml" },
    { name: "06.08.25", path: "kml/ControlZones/Control_25_08_06.kml" },
    { name: "10.08.25", path: "kml/ControlZones/Control_25_08_10.kml" },
    { name: "14.08.25", path: "kml/ControlZones/Control_25_08_14.kml" },
    { name: "18.08.25", path: "kml/ControlZones/Control_25_08_18.kml" },
    { name: "22.08.25", path: "kml/ControlZones/Control_25_08_22.kml" }
];

// Постоянные слои
window.permanentLayers = [
    // { name: "LDPR", path: "kml/PermanentObjects/LDPR.kml" },
    // граница ЛДНР без ростовской области
    { name: "LDPR",                   path: "kml/PermanentObjects/LDPR_line3.kml" },
    //конституционная граница РФ
    //{ name: "RuUaBorder",             path: "kml/PermanentObjects/RuUaBorder.kml" },
    { name: "RuUaBorder",             path: "kml/PermanentObjects/5.kml" },
    // { name: "Offensive_23_10_10", path: "kml/PermanentObjects/FrontLine_23_10_06.kml" },
    // Текущая ЛБС
    { name: "Current_frontline",      path: "kml/FrontLine/FrontLine_25_08_18.kml" },
    // Составная линия на 10.10.23
    //{ name: "Offensive_23_10_10",     path: "kml/PermanentObjects/тест2-101023.kml" },
    //{ name: "Offensive_23_10_10_add", path: "kml/PermanentObjects/тест3_101023_add.kml" },
    //Единая линия на 10.10.23
    { name: "Offensive_23_10_10",     path: "kml/PermanentObjects/OffensiveLine_2023_10_10.kml" },
    //Линия максимального продвижения ВСУ в Курской области.
    { name: "AFU_advance_Kursk2024",  path: "kml/PermanentObjects/AFU_advance_Kursk2024.kml" }
];

// Список городов с координатами
window.cities = [
    { name: { ru: "Суджа",     en: "Sudzha"     }, lat: 51.19055,  lng: 35.27082   },
    { name: { ru: "Волчанск",  en: "Volchansk"  }, lat: 50.288107, lng: 36.946217  },
    { name: { ru: "Купянск",   en: "Kupyansk"   }, lat: 49.706396, lng: 37.616586  },
    { name: { ru: "Боровая",   en: "Borovaya"   }, lat: 49.38417,  lng: 37.62086   },
    { name: { ru: "Северск",   en: "Seversk"    }, lat: 48.868709, lng: 38.106425  },
    { name: { ru: "Часов Яр",  en: "Chasov Yar" }, lat: 48.591656, lng: 37.820354  },
    { name: { ru: "Дзержинск", en: "Dzerzhinsk" }, lat: 48.398329, lng: 37.836634  },
    { name: { ru: "Красноармейск", en: "Krasnoarmeisk" }, lat: 48.28566, lng:  37.17605 },
    { name: { ru: "Великая Новосёлка", en: "Velikaya Novoselka" }, lat: 47.83857, lng:  36.83697 },
    { name: { ru: "Гуляйполе", en: "Gulyaypole" }, lat: 47.66336,  lng:  36.2587   },
    { name: { ru: "Орехов",    en: "Orekhov"    }, lat: 47.5675,   lng:  35.78845  },
];












