// Переменные для поиска
let searchLayer = null;
let lastSearchRequestTs = 0;
const REQUEST_DELAY_MS = 1000;
const CONTACT_EMAIL = "your-email@example.com"; // Замените на ваш email
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Конфигурация поиска (из search.js)
const ALLOWED_PLACE_TYPES = new Set([
  "city", "town", "village", "suburb", "hamlet", 
  "neighbourhood", "neighborhood", "locality", 
  "isolated_dwelling", "allotments", "quarter"
]);

const ALLOWED_ADDRESS_TYPES = new Set([
  "city", "town", "village", "hamlet", "municipality", 
  "locality", "suburb", "neighbourhood", "administrative"
]);



// Функция для нормализации ввода
function parsePlacesInput(rawInput) {
  if (!rawInput) return [];
  
  return rawInput
    .replace(/[.,]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token.replace(/_/g, " ").replace(/\s+/g, " ").trim())
    .filter(display => display.length > 0);
}

// Функция для ограничения частоты запросов
async function throttledFetch(url, options = {}) {
  const now = Date.now();
  const elapsed = now - lastSearchRequestTs;
  if (elapsed > 0 && elapsed < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastSearchRequestTs = Date.now();
  return fetch(url, options);
}

// Основная функция поиска
async function searchPlaces(query, options = {}) {
  if (!query || typeof query !== "string") {
    throw new TypeError("searchPlaces ожидает непустую строку запроса.");
  }

  // Строим URL для запроса
  const params = new URLSearchParams({
    format: "json",
    limit: "50",
    addressdetails: "1",
    "accept-language": "ru,uk",
    countrycodes: "ua", // Можно изменить или убрать для поиска по всему миру
    email: CONTACT_EMAIL,
    q: query,
    bounded: "1",
    viewbox: "22.128,44.386,40.080,52.379" // Ограничение по Украине
  });

  const url = `${NOMINATIM_ENDPOINT}?${params.toString()}`;
  
  let response;
  try {
    response = await throttledFetch(url, {
      headers: {
        "Accept-Language": "ru,uk",
        "User-Agent": "CreamyCapriceMapViewer/1.0"
      }
    });
  } catch (error) {
    console.warn("Сбой запроса поиска:", error);
    return [];
  }

  if (!response.ok) {
    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS * 2));
    }
    return [];
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.warn("Не удалось распарсить ответ поиска:", error);
    return [];
  }

  // Фильтруем результаты
  const results = data
    .filter(candidate => {
      if (!candidate || candidate.lat === undefined || candidate.lon === undefined) {
        return false;
      }

      const placeClass = candidate.class ?? "";
      const placeType = candidate.type ?? "";
      const addressType = candidate.addresstype ?? "";

      const isPlaceCandidate = placeClass === "place" && ALLOWED_PLACE_TYPES.has(placeType);
      const isBoundaryCandidate = placeClass === "boundary" && ALLOWED_ADDRESS_TYPES.has(addressType);

      return isPlaceCandidate || isBoundaryCandidate;
    })
    .map(candidate => ({
      name: candidate.display_name,
      lat: Number(candidate.lat),
      lon: Number(candidate.lon),
      importance: Number(candidate.importance ?? 0),
      type: candidate.type || candidate.addresstype || "unknown",
      address: candidate.address || null
    }))
    .sort((a, b) => b.importance - a.importance); // Сортируем по важности

  return results;
}

// Функция для отображения результатов поиска на карте
function displaySearchResults(results) {
  // Удаляем старые результаты
  if (searchLayer) {
    map.removeLayer(searchLayer);
  }
  
  // Создаём новый слой для результатов
  searchLayer = L.layerGroup().addTo(map);
  
  if (results.length === 0) {
    updateSearchStatus("Ничего не найдено", "error");
    return;
  }
  
  // Создаём массив для границ
  const boundsArray = [];
  
  // Добавляем маркеры для каждого результата
  results.forEach((result, index) => {
    const marker = L.marker([result.lat, result.lon], {
      icon: L.icon({
        iconUrl: 'img/search-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    }).addTo(searchLayer);
    
    // Создаём всплывающее окно
    const popupContent = `
      <div class="search-popup">
        <strong>${result.name}</strong><br>
        <small>Тип: ${result.type}</small><br>
        <small>Координаты: ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}</small><br>
        <button class="center-btn" data-lat="${result.lat}" data-lon="${result.lon}">
          Центрировать здесь
        </button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    boundsArray.push([result.lat, result.lon]);
    
    // Обработчик для кнопки центрирования
    marker.on('popupopen', function() {
      document.querySelector('.center-btn').addEventListener('click', function(e) {
        const lat = parseFloat(this.dataset.lat);
        const lon = parseFloat(this.dataset.lon);
        centerMap(lat, lon, 12);
      });
    });
  });
  
  // Центрируем карту на результатах
  if (boundsArray.length > 0) {
    const bounds = L.latLngBounds(boundsArray);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  
  // Обновляем статус
  updateSearchStatus(`Найдено ${results.length} результатов`, "success");
  
  // Обновляем список результатов в интерфейсе
  updateResultsList(results);
}

// Функция для обновления статуса поиска
function updateSearchStatus(message, type = "info") {
  const statusElement = document.getElementById('search-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `search-status ${type}`;
  }
}

// Функция для обновления списка результатов
function updateResultsList(results) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = '';
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">Ничего не найдено</div>';
    return;
  }
  
  const list = document.createElement('ul');
  list.className = 'results-list';
  
  results.slice(0, 10).forEach((result, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';
    listItem.innerHTML = `
      <div class="result-name">${result.name}</div>
      <div class="result-coords">${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}</div>
      <button class="result-action" data-lat="${result.lat}" data-lon="${result.lon}">
        Показать
      </button>
    `;
    
    listItem.querySelector('.result-action').addEventListener('click', function() {
      const lat = parseFloat(this.dataset.lat);
      const lon = parseFloat(this.dataset.lon);
      centerMap(lat, lon, 14);
      
      // Открываем попап соответствующего маркера
      searchLayer.eachLayer(layer => {
        if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lon) {
          layer.openPopup();
        }
      });
    });
    
    list.appendChild(listItem);
  });
  
  if (results.length > 10) {
    const moreItem = document.createElement('li');
    moreItem.className = 'result-more';
    moreItem.textContent = `... и ещё ${results.length - 10} результатов`;
    list.appendChild(moreItem);
  }
  
  resultsContainer.appendChild(list);
}

// Функция для очистки результатов поиска
function clearSearchResults() {
  if (searchLayer) {
    map.removeLayer(searchLayer);
    searchLayer = null;
  }
  
  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
  
  const statusElement = document.getElementById('search-status');
  if (statusElement) {
    statusElement.textContent = '';
    statusElement.className = 'search-status';
  }
  
  const searchInput = document.getElementById('place-search-input');
  if (searchInput) {
    searchInput.value = '';
  }
}

// Основная функция обработки поиска
async function performSearch() {
  const searchInput = document.getElementById('place-search-input');
  if (!searchInput) return;
  
  const query = searchInput.value.trim();
  if (!query) {
    updateSearchStatus("Введите название для поиска", "error");
    return;
  }
  
  // Проверяем минимальную длину запроса
  if (query.length < 2) {
    updateSearchStatus("Введите хотя бы 2 символа", "error");
    return;
  }
  
  // Очищаем предыдущие результаты
  clearSearchResults();
  
  // Показываем статус поиска
  updateSearchStatus("Идёт поиск...", "loading");
  
  try {
    const results = await searchPlaces(query);
    displaySearchResults(results);
  } catch (error) {
    console.error("Ошибка при поиске:", error);
    updateSearchStatus("Ошибка при выполнении поиска", "error");
  }
}







// Функция инициализации поиска
function initSearchFunctionality() {
  const searchInput = document.getElementById('place-search-input');
  const searchBtn = document.getElementById('place-search-btn');
  const clearBtn = document.getElementById('clear-search-btn');
  
  if (!searchInput || !searchBtn || !clearBtn) {
    console.warn("Элементы поиска не найдены");
    return;
  }
  
  // Обработчик кнопки поиска
  searchBtn.addEventListener('click', performSearch);
  
  // Обработчик Enter в поле ввода
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Обработчик кнопки очистки
  clearBtn.addEventListener('click', clearSearchResults);
  
  // Показывать/скрывать кнопку очистки
  searchInput.addEventListener('input', function() {
    clearBtn.style.display = this.value.trim() ? 'inline-flex' : 'none';
  });
  
  // Инициализация видимости кнопки очистки
  clearBtn.style.display = searchInput.value.trim() ? 'inline-flex' : 'none';
  
  // Добавляем подсказку при фокусе
  searchInput.addEventListener('focus', function() {
    if (!this.dataset.placeholderSet) {
      this.dataset.placeholderSet = true;
      this.placeholder = "Например: Киев, Львов, Одесса...";
    }
  });
  
  searchInput.addEventListener('blur', function() {
    if (!this.value) {
      this.placeholder = "Введите название...";
    }
  });
}