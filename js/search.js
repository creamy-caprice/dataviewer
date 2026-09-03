// Поиск населённых пунктов через Nominatim (OSM) — минимальная версия
let searchLayer = null;
let lastSearchRequestTs = 0;
const REQUEST_DELAY_MS = 1000;
const CONTACT_EMAIL = "your-email@example.com"; // Замените на ваш email
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Разрешённые типы объектов (город/село/район и т.п.)
const ALLOWED_PLACE_TYPES = new Set([
  "city", "town", "village", "suburb", "hamlet",
  "neighbourhood", "neighborhood", "locality",
  "isolated_dwelling", "allotments", "quarter"
]);

const ALLOWED_ADDRESS_TYPES = new Set([
  "city", "town", "village", "hamlet", "municipality",
  "locality", "suburb", "neighbourhood", "administrative"
]);

// Нормализация ввода: разделители , . _ → пробелы
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

// Ограничение частоты запросов (политика Nominatim — 1 req/s)
async function throttledFetch(url, options = {}) {
  const now = Date.now();
  const elapsed = now - lastSearchRequestTs;
  if (elapsed > 0 && elapsed < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastSearchRequestTs = Date.now();
  return fetch(url, options);
}

// Основной запрос поиска
async function searchPlaces(query, options = {}) {
  if (!query || typeof query !== "string") {
    throw new TypeError("searchPlaces ожидает непустую строку запроса.");
  }

  const params = new URLSearchParams({
    format: "json",
    limit: "50",
    addressdetails: "1",
    "accept-language": "ru,uk",
    countrycodes: "ua", // Поиск по Украине
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

  // Фильтруем: только населённые пункты
  return data
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
      type: candidate.type || candidate.addresstype || "unknown"
    }))
    .sort((a, b) => b.importance - a.importance); // Сначала важные
}

// Экранирование HTML (имя результата приходит из внешнего API)
function escapeHtml(text) {
  const A = String.fromCharCode(38); // &
  return String(text)
    .replace(/&/g, A + 'amp;')
    .replace(/</g, A + 'lt;')
    .replace(/>/g, A + 'gt;')
    .replace(/"/g, A + 'quot;')
    .replace(/'/g, A + '#39;');
}

// Отображение результатов: маркеры + авто-приближение карты
function displaySearchResults(results) {
  // Удаляем предыдущие маркеры
  if (searchLayer) {
    map.removeLayer(searchLayer);
    searchLayer = null;
  }

  if (!results || results.length === 0) return;

  searchLayer = L.layerGroup().addTo(map);
  const boundsArray = [];

  results.forEach(result => {
    const marker = L.marker([result.lat, result.lon], {
      icon: L.icon({
        iconUrl: 'img/search-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 24]
      })
    }).addTo(searchLayer);

    marker.bindPopup(`<strong>${escapeHtml(result.name)}</strong>`);
    boundsArray.push([result.lat, result.lon]);
  });
  if (boundsArray.length > 1) {
    // Отодвигаем карту, чтобы были видны все найденные точки
    map.fitBounds(L.latLngBounds(boundsArray), { padding: [50, 50] })
  } else {
    map.setView([results[0].lat, results[0].lon], 10);
  }
  
}

// Точка входа: поиск по строке из поля координат
async function performPlaceSearch(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (query.length < 2) return;

  try {
    const results = await searchPlaces(query);
    displaySearchResults(results);
  } catch (error) {
    console.error("Ошибка при поиске:", error);
  }
}
window.performPlaceSearch = performPlaceSearch;

// Очистка маркеров поиска
function clearSearchMarkers() {
  if (searchLayer) {
    map.removeLayer(searchLayer);
    searchLayer = null;
  }
}
window.clearSearchMarkers = clearSearchMarkers;

// Совместимость: вызывается из script.js
function initSearchFunctionality() {
  // Поиск привязан к Enter в поле #coords-input (обработчик в script.js)
}
