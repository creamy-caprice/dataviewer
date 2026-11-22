/*
 * Публичная страница статистики.
 * Только читает stats/stats.json и рисует сводку, графики и таблицы.
 * Никакой геометрии здесь нет — она считается отдельно.
 */
(function () {
    'use strict';

    var LANG_KEY = 'preferredLang';
    var lang = 'ru';
    var MONTHS = {
        ru: {
            short: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
            full: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        },
        en: {
            short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            full: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
        }
    };
    var MONTHS_SHORT = MONTHS.ru.short;
    var MONTHS_FULL = MONTHS.ru.full;
    var numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
    var shareFormat = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var charts = { main: null, total: null, direction: null, groups: null, region: null };
    var state = { data: null, range: 'all', directions: null, regions: null, detail: false, granularity: 'month' };
    var GROUP_FALLBACK = 'Без группы';
    var GROUP_COLORS = ['#c81e0f', '#2f63b8', '#1f8a4c', '#b8860b', '#7a4fb3', '#6c757d'];
    var DIRECTION_COLORS = ['#c81e0f', '#2f63b8', '#1f8a4c', '#b8860b', '#7a4fb3', '#0f8b8d',
        '#d1495b', '#3d5a80', '#8a5a44', '#5c8001', '#9c6644', '#6c757d', '#bc6c25'];
    // Порядок и подписи строк таблицы направлений. Id, которых нет в KML,
    // остаются в таблице с прочерками — геометрию для них ещё нужно нарезать.
    var DIRECTION_ROWS = [
        { id: 'chernihiv', ru: 'Черниговская зона безопасности', en: 'Chernihiv security zone' },
        { id: 'sumy', ru: 'Сумская зона безопасности', en: 'Sumy security zone' },
        { id: 'kursk', ru: 'Курская область', en: 'Kursk region' },
        { id: 'kharkiv', ru: 'Харьковская зона безопасности', en: 'Kharkiv security zone' },
        { id: 'kupyansk', ru: 'Купянское направление', en: 'Kupyansk direction' },
        { id: 'borovaya', ru: 'Сватово-Боровая', en: 'Svatovo–Borovaya' },
        { id: 'krasnolimansk', ru: 'Краснолиманское направление', en: 'Krasny Liman direction' },
        { id: 'slavyansk', ru: 'Славянское направление', en: 'Slavyansk direction' },
        { id: 'krasnoarmeysk', ru: 'Красноармейское направление', en: 'Krasnoarmeysk direction' },
        { id: 'donetsk_zaporizhzhia', ru: 'Южнодонецко-Запорожское направление', en: 'South Donetsk–Zaporizhzhia direction' },
        { id: 'dnipropetrovsk', ru: 'Днепропетровская зона безопасности', en: 'Dnipropetrovsk security zone' },
        { id: 'orekhiv', ru: 'Днепровско-Запорожское направление', en: 'Dnipro–Zaporizhzhia direction' },
        { id: 'herson', ru: 'Херсонское направление', en: 'Kherson direction' }
    ];
    var DIRECTION_LABELS = {};
    DIRECTION_ROWS.forEach(function (row) { DIRECTION_LABELS[row.id] = row; });
    // Подписи строк таблицы областей. kherson показываем справочно
    // (вода, дельта Днепра) и в сравнение не пускаем.
    var REGION_ROWS = [
        { id: 'chernihiv', ru: 'Черниговская область', en: 'Chernihiv oblast' },
        { id: 'sumy', ru: 'Сумская область', en: 'Sumy oblast' },
        { id: 'kharkiv', ru: 'Харьковская область', en: 'Kharkiv oblast' },
        { id: 'lnr', ru: 'ЛНР', en: 'LPR' },
        { id: 'dnr', ru: 'ДНР', en: 'DPR' },
        { id: 'dnipropetrovsk', ru: 'Днепропетровская область', en: 'Dnipropetrovsk oblast' },
        { id: 'zaporizhzhia', ru: 'Запорожская область', en: 'Zaporizhzhia oblast' },
        { id: 'kherson', ru: 'Херсонская область', en: 'Kherson oblast', inactive: true }
    ];
    var REGION_LABELS = {};
    REGION_ROWS.forEach(function (row) { REGION_LABELS[row.id] = row; });
    var REGION_COLORS = ['#6c757d', '#2f63b8', '#1f8a4c', '#c81e0f', '#b8860b', '#7a4fb3', '#0f8b8d', '#8a5a44'];
    var GROUP_EN = {
        'Север': 'North',
        'Запад': 'West',
        'Центр': 'Center',
        'Восток': 'East',
        'Днепр': 'Dnipro',
        'Юг': 'South',
        'Без группы': 'No group',
        'Тест': 'Test'
    };

    function isEn() {
        return lang === 'en';
    }

    function tr(ru, en) {
        return isEn() ? en : ru;
    }

    function applyLanguageGlobals() {
        MONTHS_SHORT = MONTHS[lang].short;
        MONTHS_FULL = MONTHS[lang].full;
        numberFormat = new Intl.NumberFormat(isEn() ? 'en-US' : 'ru-RU', { maximumFractionDigits: 1 });
        shareFormat = new Intl.NumberFormat(isEn() ? 'en-US' : 'ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function directionDisplayName(direction) {
        if (!direction) return '';
        var label = DIRECTION_LABELS[direction.id];
        if (label) return isEn() ? label.en : label.ru;
        return direction.name || '';
    }

    function directionColor(direction) {
        var index = -1;
        for (var i = 0; i < DIRECTION_ROWS.length; i++) {
            if (DIRECTION_ROWS[i].id === direction.id) { index = i; break; }
        }
        if (index < 0 && state.data && Array.isArray(state.data.directions)) {
            index = state.data.directions.indexOf(direction);
        }
        if (index < 0) index = 0;
        return DIRECTION_COLORS[index % DIRECTION_COLORS.length];
    }

    function hexToRgba(hex, alpha) {
        var value = parseInt(String(hex).slice(1), 16);
        return 'rgba(' + ((value >> 16) & 255) + ', ' + ((value >> 8) & 255) + ', ' + (value & 255) + ', ' + alpha + ')';
    }

    function groupDisplayName(name) {
        if (isEn() && GROUP_EN[name]) return GROUP_EN[name];
        return name;
    }

    function unitDays(days) {
        return formatNumber(days) + (isEn() ? ' d' : ' дн.');
    }

    function unitKm2() {
        return isEn() ? 'km²' : 'км²';
    }

    function unitRate() {
        return isEn() ? 'km²/day' : 'км²/день';
    }

    function unitPp() {
        return isEn() ? 'pp' : 'п.п.';
    }

    function applyStaticLanguage() {
        document.documentElement.lang = lang;
        document.title = tr('Статистика территорий — Creamy caprice', 'Territory statistics — Creamy caprice');
        var description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute('content', tr(
            'Продвижение и отход контроля территорий по месячным срезам. Плюс — продвижение ВС РФ.',
            'Territory control advance and withdrawal by monthly snapshots. Positive values show Russian advance.'
        ));
        document.querySelectorAll('[data-ru][data-en]').forEach(function (element) {
            element.textContent = isEn() ? element.getAttribute('data-en') : element.getAttribute('data-ru');
        });
        document.querySelectorAll('[data-title-ru][data-title-en]').forEach(function (element) {
            element.title = isEn() ? element.getAttribute('data-title-en') : element.getAttribute('data-title-ru');
        });
        document.querySelectorAll('[data-aria-ru][data-aria-en]').forEach(function (element) {
            element.setAttribute('aria-label', isEn() ? element.getAttribute('data-aria-en') : element.getAttribute('data-aria-ru'));
        });
        var button = document.getElementById('stats-lang-toggle');
        if (button) {
            button.classList.toggle('show-en', !isEn());
            button.classList.toggle('show-ru', isEn());
            var title = isEn() ? 'Switch to Russian' : 'Переключить на английский';
            button.title = title;
            button.setAttribute('aria-label', title);
        }
    }

    function setLanguage(next) {
        lang = next === 'en' ? 'en' : 'ru';
        try { localStorage.setItem(LANG_KEY, lang); } catch (error) { /* storage may be unavailable */ }
        applyLanguageGlobals();
        applyStaticLanguage();
        if (state.data) renderAll();
    }

    function initLanguage() {
        var saved = null;
        try { saved = localStorage.getItem(LANG_KEY); } catch (error) { /* ignore */ }
        lang = saved === 'en' ? 'en' : 'ru';
        applyLanguageGlobals();
        applyStaticLanguage();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatNumber(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        return numberFormat.format(number);
    }

    function signed(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        if (number > 0) return '+' + numberFormat.format(number);
        if (number < 0) return '−' + numberFormat.format(Math.abs(number));
        return numberFormat.format(0);
    }

    // Значения таблицы областей — всегда два знака после запятой.
    function formatShare(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        return shareFormat.format(number);
    }

    function signedShare(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        if (Math.abs(number) < 0.005) return shareFormat.format(0);
        return (number > 0 ? '+' : '−') + shareFormat.format(Math.abs(number));
    }

    function formatDate(iso) {
        var match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return '—';
        if (isEn()) return match[2] + '/' + match[3] + '/' + match[1].slice(2);
        return match[3] + '.' + match[2] + '.' + match[1].slice(2);
    }

    function formatDateTime(iso) {
        var date = new Date(iso);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleString(isEn() ? 'en-US' : 'ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function shortMonth(month) {
        var parts = String(month || '').split('-');
        var index = Number(parts[1]) - 1;
        if (!MONTHS_SHORT[index]) return String(month || '');
        return MONTHS_SHORT[index] + ' ' + String(parts[0] || '').slice(2);
    }

    function valueClass(value) {
        var number = Number(value);
        if (number > 0) return 'gain';
        if (number < 0) return 'loss';
        return 'neutral';
    }

    function cardClass(value) {
        var number = Number(value);
        if (number > 0) return 'is-gain';
        if (number < 0) return 'is-loss';
        return 'is-total';
    }

    function cardLine(label, value, cls) {
        return '<span class="stats-card-line">'
            + '<span class="stats-card-line-label">' + escapeHtml(label) + '</span>'
            + '<span class="stats-card-line-value ' + (cls || 'neutral') + '">' + escapeHtml(value) + '</span>'
            + '</span>';
    }

    function card(label, value, context, lines, displayValue) {
        var missing = displayValue === '—';
        var cls = missing ? 'neutral' : valueClass(value);
        var display = displayValue != null ? displayValue : signed(value);
        return '<article class="stats-card ' + (missing ? 'is-total' : cardClass(value)) + '">'
            + '<span class="stats-card-label">' + escapeHtml(label) + '</span>'
            + '<span class="stats-card-value ' + cls + '">' + escapeHtml(display) + '</span>'
            + (context ? '<span class="stats-card-context">' + escapeHtml(context) + '</span>' : '')
            + '<span class="stats-card-lines">' + (lines || []).join('') + '</span>'
            + '</article>';
    }

    function shortMonthYear(month) {
        var parts = String(month || '').split('-');
        var index = Number(parts[1]) - 1;
        if (!MONTHS_FULL[index]) return String(month || '');
        return MONTHS_FULL[index] + ' ' + String(parts[0] || '').slice(2);
    }

    function periodName(periods) {
        if (/^\d{4}$/.test(String(state.range || ''))) return String(state.range);
        if (!periods || !periods.length) return tr('Нет данных', 'No data');
        var first = periods[0];
        var last = periods[periods.length - 1];
        var firstYear = String(first.month || '').slice(0, 4);
        var lastYear = String(last.month || '').slice(0, 4);
        if (firstYear === lastYear) {
            var firstMonth = Number(String(first.month || '').slice(5, 7));
            var lastMonth = Number(String(last.month || '').slice(5, 7));
            if (firstMonth === 1 && lastMonth === 12) return firstYear;
            if (firstMonth === lastMonth) return fullMonthLabel(first.month);
            return MONTHS_FULL[firstMonth - 1] + ' — ' + MONTHS_FULL[lastMonth - 1] + ' ' + firstYear;
        }
        return firstYear + '–' + lastYear;
    }

    function findPeriodByMonth(periods, month) {
        for (var i = 0; i < periods.length; i++) {
            if (periods[i].month === month) return periods[i];
        }
        return null;
    }

    function shiftMonth(month, delta) {
        var parts = String(month || '').split('-');
        var year = Number(parts[0]);
        var mon = Number(parts[1]);
        if (!year || !mon) return '';
        var total = year * 12 + (mon - 1) + delta;
        var nextYear = Math.floor(total / 12);
        var nextMon = (total % 12 + 12) % 12 + 1;
        return nextYear + '-' + String(nextMon).padStart(2, '0');
    }

    function previousCalendarPeriod(data) {
        var periods = data && data.periods ? data.periods : [];
        var latest = latestPeriod(data);
        if (!latest) return null;
        for (var i = periods.length - 1; i >= 0; i--) {
            if (periods[i].month < latest.month) return periods[i];
        }
        return null;
    }

    function previousYearTotals(periods, allPeriods) {
        var priorPeriods = [];
        for (var i = 0; i < periods.length; i++) {
            var prior = findPeriodByMonth(allPeriods, shiftMonth(periods[i].month, -12));
            if (!prior) return null;
            priorPeriods.push(prior);
        }
        if (!priorPeriods.length) return null;
        return { periods: priorPeriods, totals: summarize(priorPeriods) };
    }

    function daysSuffix(days, compareDays) {
        return Number(days) !== Number(compareDays) ? ' (' + unitDays(days) + ')' : '';
    }

    function capitalize(value) {
        var text = String(value || '');
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
    }

    function findDirection(data, id) {
        var directions = data && data.directions ? data.directions : [];
        for (var i = 0; i < directions.length; i++) {
            if (directions[i].id === id) return directions[i];
        }
        return null;
    }

    function directionGroup(direction) {
        return direction && direction.group ? direction.group : GROUP_FALLBACK;
    }

    function findRegion(data, id) {
        var regions = data && data.regions ? data.regions : [];
        for (var i = 0; i < regions.length; i++) {
            if (regions[i].id === id) return regions[i];
        }
        return null;
    }

    function regionLabel(id) {
        var row = REGION_LABELS[id];
        if (row) return isEn() ? row.en : row.ru;
        var region = findRegion(state.data, id);
        return region ? region.name : id;
    }

    function regionDisplayName(region) {
        return region ? regionLabel(region.id) : '';
    }

    // Группы областей приходят из stats.json (REGION_GROUPS в build-stats.mjs).
    function regionGroupsList(data) {
        return data && Array.isArray(data.regionGroups) ? data.regionGroups : [];
    }

    function regionGroupOf(id) {
        var groups = regionGroupsList(state.data);
        for (var i = 0; i < groups.length; i++) {
            if ((groups[i].regions || []).indexOf(id) !== -1) return groups[i];
        }
        return null;
    }

    function regionGroupName(group) {
        if (!group) return '';
        return isEn() ? (group.nameEn || group.name) : group.name;
    }

    function regionColor(region) {
        var group = regionGroupOf(region.id);
        if (group && Array.isArray(group.colors) && group.colors.length) {
            var index = (group.regions || []).indexOf(region.id);
            return group.colors[(index < 0 ? 0 : index) % group.colors.length];
        }
        var fallback = -1;
        for (var i = 0; i < REGION_ROWS.length; i++) {
            if (REGION_ROWS[i].id === region.id) { fallback = i; break; }
        }
        if (fallback < 0) fallback = 0;
        return REGION_COLORS[fallback % REGION_COLORS.length];
    }

    function regionShareTotals(region, periods) {
        var byMonth = {};
        (region && region.periods ? region.periods : []).forEach(function (item) { byMonth[item.month] = item; });
        var first = null;
        var last = null;
        periods.forEach(function (period) {
            var item = byMonth[period.month];
            if (!item || !Number.isFinite(Number(item.share))) return;
            if (first == null) first = Number(item.share);
            last = Number(item.share);
        });
        return { first: first, last: last };
    }

    // Шкала Y по значениям выбранных линий: диапазон + запас, кратный 5.
    function regionShareScale(regions, periods) {
        var months = {};
        periods.forEach(function (period) { months[period.month] = true; });
        var min = null;
        var max = null;
        regions.forEach(function (region) {
            (region.periods || []).forEach(function (item) {
                if (!months[item.month]) return;
                var value = Number(item.share);
                if (!Number.isFinite(value)) return;
                if (min == null || value < min) min = value;
                if (max == null || value > max) max = value;
            });
        });
        if (min == null || max == null) return { min: 0, max: 100 };
        var pad = Math.max(2, Math.ceil((max - min) * 0.15));
        var lo = Math.floor((min - pad) / 5) * 5;
        var hi = Math.ceil((max + pad) / 5) * 5;
        return {
            min: Math.max(0, Math.min(100, lo)),
            max: Math.max(0, Math.min(100, hi))
        };
    }

    function isYearRange(range) {
        return /^\d{4}$/.test(String(range || ''));
    }

    function isMonthRange(range) {
        return /^\d{4}-\d{2}$/.test(String(range || ''));
    }

    function fullMonthLabel(month) {
        var parts = String(month || '').split('-');
        var index = Number(parts[1]) - 1;
        if (!MONTHS_FULL[index]) return String(month || '');
        return MONTHS_FULL[index] + ' ' + parts[0];
    }

    function filterPeriods(periods, range) {
        var list = Array.isArray(periods) ? periods : [];
        var value = String(range || 'all');
        if (value === 'all') return list.slice();
        if (value === 'current') {
            return list.length ? [list[list.length - 1]] : [];
        }
        if (isYearRange(value)) {
            return list.filter(function (period) {
                return String(period.month || '').slice(0, 4) === value;
            });
        }
        if (isMonthRange(value)) {
            return list.filter(function (period) {
                return String(period.month || '') === value;
            });
        }
        var count = Number(value);
        if (Number.isFinite(count) && count > 0) {
            return list.slice(-count);
        }
        return list.slice();
    }

    function rangeLabel(range) {
        var value = String(range || 'all');
        if (value === 'all') return tr('всё время', 'all time');
        if (value === 'current') return tr('текущий месяц', 'current month');
        if (isYearRange(value)) return isEn() ? value : value + ' год';
        if (isMonthRange(value)) return fullMonthLabel(value);
        return tr('последние ' + value + ' мес.', 'last ' + value + ' months');
    }

    function fullPeriods(periods) {
        return (Array.isArray(periods) ? periods : []).filter(function (period) {
            return !period.partial;
        });
    }

    function totalsPeriods(periods, range) {
        return filterPeriods(periods, range);
    }

    function periodsCaption(periods) {
        var total = Array.isArray(periods) ? periods.length : 0;
        var full = fullPeriods(periods).length;
        var partial = total - full;
        if (!partial) return full + tr(' полн. мес.', ' full mo.');
        if (!full) return partial + tr(' неполн. мес.', ' partial mo.');
        return full + tr(' полн. + ', ' full + ') + partial + tr(' неполн.', ' partial');
    }

    function emptyTotals() {
        return { gain: 0, loss: 0, net: 0, days: 0, count: 0 };
    }

    function summarize(periods) {
        var totals = emptyTotals();
        for (var i = 0; i < periods.length; i++) {
            var period = periods[i];
            totals.gain += Number(period.gain) || 0;
            totals.loss += Number(period.loss) || 0;
            totals.net += Number(period.net) || 0;
            totals.days += Number(period.days) || 0;
            totals.count += 1;
        }
        return totals;
    }

    function directNet(periods) {
        var list = Array.isArray(periods) ? periods : [];
        if (!list.length) return 0;
        var first = list[0];
        var last = list[list.length - 1];
        if (first.areaFrom != null && last.areaTo != null) {
            return Math.round((Number(last.areaTo) - Number(first.areaFrom)) * 100) / 100;
        }
        return summarize(list).net;
    }

    function latestPeriod(data) {
        var periods = data && data.periods ? data.periods : [];
        return periods.length ? periods[periods.length - 1] : null;
    }

    function latestFullPeriod(data) {
        var full = fullPeriods(data && data.periods ? data.periods : []);
        return full.length ? full[full.length - 1] : null;
    }

    function directionTotals(direction, range) {
        var periods = totalsPeriods(direction && direction.periods ? direction.periods : [], range);
        return summarize(periods);
    }

    function unassignedTotals(data, range) {
        var periods = totalsPeriods(data && data.periods ? data.periods : [], range);
        var totals = emptyTotals();
        for (var i = 0; i < periods.length; i++) {
            var item = periods[i].unassigned;
            if (!item) continue;
            totals.gain += Number(item.gain) || 0;
            totals.loss += Number(item.loss) || 0;
            totals.net += Number(item.net) || 0;
            totals.count += 1;
        }
        return totals;
    }

    function renderCards(data) {
        var allPeriods = data.periods || [];
        var current = latestPeriod(data);
        var previous = previousCalendarPeriod(data);
        if (!current) return;
        var currentYear = String(current.month || '').slice(0, 4);
        var yearPeriods = allPeriods.filter(function (period) {
            return String(period.month || '').slice(0, 4) === currentYear;
        });
        var yearTotals = summarize(yearPeriods);
        var yearNet = directNet(yearPeriods);
        var yearPrior = previousYearTotals(yearPeriods, allPeriods);
        var allTotals = summarize(allPeriods);
        var allNet = directNet(allPeriods);
        var allRate = allTotals.days > 0 ? allNet / allTotals.days : 0;
        var cards = [];

        var currentPrior = findPeriodByMonth(allPeriods, shiftMonth(current.month, -12));
        cards.push(card(
            shortMonthYear(current.month),
            current.net,
            formatDate(current.from) + ' — ' + formatDate(current.to) + ' · ' + unitDays(current.days),
            [
                cardLine(tr('Продвижение', 'Advance'), '+' + formatNumber(current.gain), 'gain'),
                cardLine(tr('Отход', 'Withdrawal'), '−' + formatNumber(current.loss), 'loss'),
                currentPrior
                    ? cardLine(fullMonthLabel(currentPrior.month), signed(currentPrior.net) + daysSuffix(currentPrior.days, current.days), valueClass(currentPrior.net))
                    : cardLine(tr('Год назад', 'Year ago'), '—', 'neutral')
            ]
        ));

        if (previous) {
            var previousPrior = findPeriodByMonth(allPeriods, shiftMonth(previous.month, -12));
            cards.push(card(
                shortMonthYear(previous.month),
                previous.net,
                formatDate(previous.from) + ' — ' + formatDate(previous.to) + ' · ' + unitDays(previous.days),
                [
                    cardLine(tr('Продвижение', 'Advance'), '+' + formatNumber(previous.gain), 'gain'),
                    cardLine(tr('Отход', 'Withdrawal'), '−' + formatNumber(previous.loss), 'loss'),
                    previousPrior
                        ? cardLine(fullMonthLabel(previousPrior.month), signed(previousPrior.net) + daysSuffix(previousPrior.days, previous.days), valueClass(previousPrior.net))
                        : cardLine(tr('Год назад', 'Year ago'), '—', 'neutral')
                ]
            ));
        }

        cards.push(card(
            currentYear,
            yearNet,
            yearPeriods.length
                ? formatDate(yearPeriods[0].from) + ' — ' + formatDate(yearPeriods[yearPeriods.length - 1].to) + ' · ' + unitDays(yearTotals.days)
                : tr('Нет данных', 'No data'),
            [
                cardLine(tr('Продвижение', 'Advance'), yearPeriods.length ? '+' + formatNumber(yearTotals.gain) : '—', yearPeriods.length ? 'gain' : 'neutral'),
                cardLine(tr('Отход', 'Withdrawal'), yearPeriods.length ? '−' + formatNumber(yearTotals.loss) : '—', yearPeriods.length ? 'loss' : 'neutral'),
                yearPrior
                    ? cardLine(tr('Год назад', 'Year ago'), signed(yearPrior.totals.net) + daysSuffix(yearPrior.totals.days, yearTotals.days), valueClass(yearPrior.totals.net))
                    : cardLine(tr('Год назад', 'Year ago'), '—', 'neutral')
            ],
            yearPeriods.length ? null : '—'
        ));

        var fullCount = fullPeriods(allPeriods).length;
        var partialCount = allPeriods.length - fullCount;
        cards.push(card(
            tr('Всего с начала наступления', 'Total since the start'),
            allNet,
            allPeriods.length
                ? formatDate(allPeriods[0].from) + ' — ' + formatDate(allPeriods[allPeriods.length - 1].to) + ' · ' + unitDays(allTotals.days)
                : tr('Нет данных', 'No data'),
            [
                cardLine(tr('Продвижение', 'Advance'), allPeriods.length ? '+' + formatNumber(allTotals.gain) : '—', allPeriods.length ? 'gain' : 'neutral'),
                cardLine(tr('Отход', 'Withdrawal'), allPeriods.length ? '−' + formatNumber(allTotals.loss) : '—', allPeriods.length ? 'loss' : 'neutral'),
                cardLine(tr('Месяцев', 'Months'), allPeriods.length + (partialCount ? ' (' + fullCount + tr(' полных', ' full') + ')' : ''), 'neutral'),
                cardLine(tr('Темп', 'Rate'), allPeriods.length ? signed(allRate) + ' ' + unitRate() : '—', 'neutral')
            ],
            allPeriods.length ? null : '—'
        ));

        document.getElementById('stats-cards').innerHTML = cards.join('');
    }

    function renderTable(periods) {
        var reversed = periods.slice().reverse();
        var body = document.getElementById('stats-table-body');
        var rows = reversed.map(function (period) {
            var gain = Number(period.gain) || 0;
            var loss = Number(period.loss) || 0;
            var net = Number(period.net) || 0;
            var badge = period.partial ? '<span class="stats-badge">' + tr('текущий', 'current') + '</span>' : '';
            var netClass = net > 0 ? 'net-pos' : net < 0 ? 'net-neg' : 'muted';
            var selected = state.range === period.month;
            return '<tr class="is-clickable' + (period.partial ? ' is-partial' : '')
                + (selected ? ' is-selected' : '') + '" data-month="' + escapeHtml(period.month)
                + '" tabindex="0">'
                + '<td class="month-cell">' + escapeHtml(fullMonthLabel(period.month)) + badge + '</td>'
                + '<td class="muted">' + formatDate(period.from) + ' — ' + formatDate(period.to) + '</td>'
                + '<td class="num">' + escapeHtml(String(period.days)) + '</td>'
                + '<td class="num gain">' + (gain > 0 ? '+' + formatNumber(gain) : '0') + '</td>'
                + '<td class="num loss">' + (loss > 0 ? '−' + formatNumber(loss) : '0') + '</td>'
                + '<td class="num ' + netClass + '">' + escapeHtml(signed(net)) + '</td>'
                + '<td class="num">' + escapeHtml(signed(period.rate)) + '</td>'
                + '</tr>';
        });
        body.innerHTML = rows.join('');

        var microGain = 0;
        var microLoss = 0;
        for (var i = 0; i < periods.length; i++) {
            var micro = periods[i].micro || {};
            microGain += Number(micro.gain) || 0;
            microLoss += Number(micro.loss) || 0;
        }
        var note = document.getElementById('stats-table-note');
        if (note) {
            var threshold = state.data && state.data.source && state.data.source.thresholdKm2 != null
                ? Number(state.data.source.thresholdKm2)
                : 0;
            if (!periods.length) {
                note.textContent = tr('За выбранный период данных нет.', 'No data for the selected period.');
            } else if (threshold > 0) {
                note.textContent = tr(
                    'Показано ' + periods.length + ' периодов. Не вошли микрополигоны меньше '
                        + formatNumber(threshold) + ' км²: продвижение +' + formatNumber(microGain)
                        + ', отход −' + formatNumber(microLoss) + ' км².',
                    'Showing ' + periods.length + ' periods. Micro-polygons smaller than '
                        + formatNumber(threshold) + ' km² are excluded: advance +' + formatNumber(microGain)
                        + ', withdrawal −' + formatNumber(microLoss) + ' km².'
                );
            } else {
                note.textContent = tr(
                    'Показано ' + periods.length + ' периодов. Учитываются все компоненты разности, включая мелкие.',
                    'Showing ' + periods.length + ' periods. All difference components are included, including small ones.'
                );
            }
        }
        var sub = document.getElementById('stats-table-sub');
        if (sub) {
            sub.textContent = tr(
                'Фактические даты срезов, между которыми посчитана дельта. Показано '
                    + periods.length + ' периодов. Нажмите на строку, чтобы показать только этот месяц.',
                'Actual snapshot dates between which the delta is calculated. Showing '
                    + periods.length + ' periods. Click a row to show that month only.'
            );
        }
    }

    function renderCurrentDirections(data) {
        var section = document.getElementById('stats-current');
        var body = document.getElementById('stats-current-body');
        var period = latestPeriod(data);
        if (!section || !body || !period || !period.directions || !period.directions.length) {
            if (section) section.classList.add('hidden');
            return;
        }

        var rows = period.directions.map(function (direction) {
            var net = Number(direction.net) || 0;
            return '<tr>'
                + '<td>' + escapeHtml(directionDisplayName(direction)) + '</td>'
                + '<td class="num gain">' + ((Number(direction.gain) || 0) > 0 ? '+' + formatNumber(direction.gain) : '0') + '</td>'
                + '<td class="num loss">' + ((Number(direction.loss) || 0) > 0 ? '−' + formatNumber(direction.loss) : '0') + '</td>'
                + '<td class="num ' + (net > 0 ? 'net-pos' : net < 0 ? 'net-neg' : 'muted') + '">' + signed(net) + '</td>'
                + '</tr>';
        });

        if (period.unassigned) {
            rows.push('<tr class="is-unassigned">'
                + '<td>' + tr('Вне направлений', 'Unassigned') + '</td>'
                + '<td class="num gain">' + (period.unassigned.gain > 0 ? '+' + formatNumber(period.unassigned.gain) : '0') + '</td>'
                + '<td class="num loss">' + (period.unassigned.loss > 0 ? '−' + formatNumber(period.unassigned.loss) : '0') + '</td>'
                + '<td class="num">' + signed(period.unassigned.net) + '</td>'
                + '</tr>');
        }

        rows.push('<tr class="is-total">'
            + '<td>' + tr('Итого', 'Total') + '</td>'
            + '<td class="num gain">+' + formatNumber(period.gain) + '</td>'
            + '<td class="num loss">−' + formatNumber(period.loss) + '</td>'
            + '<td class="num">' + signed(period.net) + '</td>'
            + '</tr>');

        body.innerHTML = rows.join('');
        var sub = document.getElementById('stats-current-sub');
        if (sub) {
            sub.textContent = formatDate(period.from) + ' — ' + formatDate(period.to)
                + ' · ' + unitDays(period.days) + '.';
        }
        var note = document.getElementById('stats-current-note');
        if (note) {
            note.textContent = tr(
                'Текущий период: ' + fullMonthLabel(period.month) + '. Значения по направлениям и «вне направлений» в сумме дают итог периода.',
                'Current period: ' + fullMonthLabel(period.month) + '. Direction and unassigned values add up to the period total.'
            );
        }
        section.classList.remove('hidden');
    }

    function destroyChart(key) {
        if (charts[key]) {
            charts[key].destroy();
            charts[key] = null;
        }
    }

    function chartUnavailable(wrap, fallback) {
        if (wrap) wrap.classList.add('hidden');
        if (fallback) fallback.classList.remove('hidden');
    }

    function chartAvailable(wrap, fallback) {
        if (wrap) wrap.classList.remove('hidden');
        if (fallback) fallback.classList.add('hidden');
    }

    var MAIN_GAIN = '#e01b0b';
    var MAIN_LOSS = '#2f63b8';
    var MAIN_GAIN_LINE = 'rgba(224, 27, 11, 0.78)';
    var MAIN_LOSS_LINE = 'rgba(47, 99, 184, 0.78)';

    var directionZonesPlugin = {
        id: 'directionZones',
        beforeDraw: function (chart) {
            var opts = chart.options.plugins.directionZones;
            if (!opts || !opts.enabled) return;
            var area = chart.chartArea;
            var scale = chart.scales && chart.scales.y;
            if (!area || !scale) return;
            var zero = scale.getPixelForValue(0);
            if (!isFinite(zero)) return;
            zero = Math.max(area.top, Math.min(area.bottom, zero));
            var ctx = chart.ctx;
            ctx.save();
            if (zero > area.top) {
                ctx.fillStyle = 'rgba(224, 27, 11, 0.08)';
                ctx.fillRect(area.left, area.top, area.right - area.left, zero - area.top);
            }
            if (zero < area.bottom) {
                ctx.fillStyle = 'rgba(47, 99, 184, 0.10)';
                ctx.fillRect(area.left, zero, area.right - area.left, area.bottom - zero);
            }
            ctx.restore();
        }
    };

    var currentLevelPlugin = {
        id: 'currentLevel',
        afterDatasetsDraw: function (chart) {
            var opts = chart.options.plugins.currentLevel;
            if (!opts || !isFinite(opts.value)) return;
            var area = chart.chartArea;
            var y = chart.scales.y.getPixelForValue(opts.value);
            if (!area || !isFinite(y) || y < area.top || y > area.bottom) return;
            var ctx = chart.ctx;
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(31, 35, 40, 0.55)';
            ctx.beginPath();
            ctx.moveTo(area.left, y);
            ctx.lineTo(area.right, y);
            ctx.stroke();
            ctx.restore();
        }
    };

    var yearSeparatorsPlugin = {
        id: 'yearSeparators',
        afterDatasetsDraw: function (chart) {
            var opts = chart.options.plugins.yearSeparators;
            if (!opts || !opts.periods || opts.periods.length < 2) return;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || meta.data.length < 2) return;
            var periods = opts.periods;
            var area = chart.chartArea;
            var ctx = chart.ctx;
            var yearOf = function (period) { return String(period.month || '').slice(0, 4); };
            var drawYear = function (x, year) {
                ctx.save();
                ctx.font = '600 12px Roboto, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.strokeText(year, x, area.top + 12);
                ctx.fillStyle = 'rgba(31, 35, 40, 0.72)';
                ctx.fillText(year, x, area.top + 12);
                ctx.restore();
            };

            var firstBoundaryX = null;
            ctx.save();
            ctx.setLineDash([4, 3]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(31, 35, 40, 0.55)';
            for (var i = 1; i < periods.length; i++) {
                if (yearOf(periods[i]) === yearOf(periods[i - 1])) continue;
                var x = (meta.data[i - 1].x + meta.data[i].x) / 2;
                if (firstBoundaryX === null) firstBoundaryX = x;
                ctx.beginPath();
                ctx.moveTo(x, area.top);
                ctx.lineTo(x, area.bottom);
                ctx.stroke();
                drawYear(x, yearOf(periods[i]));
            }
            ctx.restore();

            var firstX = Math.max(area.left + 18, meta.data[0].x);
            if (firstBoundaryX === null || firstBoundaryX - firstX >= 28) {
                drawYear(firstX, yearOf(periods[0]));
            }
        }
    };

    var detailLabelsPlugin = {
        id: 'detailLabels',
        afterDatasetsDraw: function (chart) {
            var opts = chart.options.plugins.detailLabels;
            if (!opts || !opts.enabled) return;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;
            var values = chart.data.datasets[0].data;
            var area = chart.chartArea;
            var ctx = chart.ctx;
            var compact = area && area.width < 500;
            ctx.save();
            ctx.font = (compact ? '8px' : '9px') + ' Roboto, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.fillStyle = 'rgba(31, 35, 40, 0.82)';
            for (var i = 0; i < meta.data.length; i++) {
                var point = meta.data[i];
                var value = Number(values[i]);
                if (!point || !isFinite(point.x) || !isFinite(point.y) || !isFinite(value)) continue;
                var offset = (i % 2 === 0 ? 9 : 19) * (compact ? 0.85 : 1);
                var labelY = value >= 0 ? point.y - offset : point.y + offset;
                if (labelY < area.top + 7) labelY = point.y + offset;
                if (labelY > area.bottom - 5) labelY = point.y - offset;
                var labelX = Math.min(area.right - 4, Math.max(area.left + 4, point.x));
                ctx.strokeText(signed(value), labelX, labelY);
                ctx.fillText(signed(value), labelX, labelY);
            }
            ctx.restore();
        }
    };

    var totalLabelsPlugin = {
        id: 'totalLabels',
        afterDatasetsDraw: function (chart) {
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;
            var area = chart.chartArea;
            if (!area) return;
            var values = chart.data.datasets[0].data;
            var spacing = meta.data.length > 1
                ? Math.abs(meta.data[1].x - meta.data[0].x)
                : area.width;
            var step = Math.max(1, Math.ceil(11 / Math.max(1, spacing)));
            var compact = area.width < 520;
            var ctx = chart.ctx;
            ctx.save();
            ctx.font = (compact ? 8 : 9) + 'px Roboto, Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.fillStyle = 'rgba(31, 35, 40, 0.82)';
            for (var i = 0; i < meta.data.length; i++) {
                if (i % step !== 0 && i !== meta.data.length - 1) continue;
                var point = meta.data[i];
                var value = Number(values[i]);
                if (!point || !isFinite(point.x) || !isFinite(point.y) || !isFinite(value)) continue;
                ctx.save();
                ctx.translate(point.x, Math.max(area.top + 26, point.y - 4));
                ctx.rotate(-Math.PI / 2);
                ctx.strokeText(formatNumber(value), 0, 0);
                ctx.fillText(formatNumber(value), 0, 0);
                ctx.restore();
            }
            ctx.restore();
        }
    };

    function aggregateYears(periods) {
        var order = [];
        var byYear = {};
        for (var i = 0; i < periods.length; i++) {
            var period = periods[i];
            var year = String(period.month || '').slice(0, 4);
            if (!year) continue;
            var item = byYear[year];
            if (!item) {
                item = {
                    month: year,
                    label: year,
                    from: period.from,
                    to: period.to,
                    days: 0,
                    gain: 0,
                    loss: 0,
                    net: 0,
                    rate: 0,
                    partial: false,
                    count: 0
                };
                byYear[year] = item;
                order.push(item);
            }
            item.to = period.to;
            item.days += Number(period.days) || 0;
            item.gain += Number(period.gain) || 0;
            item.loss += Number(period.loss) || 0;
            item.net += Number(period.net) || 0;
            item.partial = item.partial || !!period.partial;
            item.count += 1;
        }
        for (var j = 0; j < order.length; j++) {
            order[j].rate = order[j].days > 0 ? order[j].net / order[j].days : 0;
        }
        return order;
    }

    function yearWord(value) {
        var number = Math.abs(Number(value) || 0);
        var mod10 = number % 10;
        var mod100 = number % 100;
        if (mod10 === 1 && mod100 !== 11) return 'год';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
        return 'лет';
    }

    function ensureChartTooltip(canvas) {
        var wrap = canvas.closest('.stats-chart-wrap');
        if (!wrap) return null;
        var tooltip = wrap.querySelector('.stats-chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'stats-chart-tooltip hidden';
            wrap.appendChild(tooltip);
        }
        return tooltip;
    }

    function renderMainTooltip(context, periods, yearly) {
        var tooltip = context.tooltip;
        var element = ensureChartTooltip(context.chart.canvas);
        if (!element) return;
        if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints || !tooltip.dataPoints.length) {
            element.classList.add('hidden');
            return;
        }
        var period = periods[tooltip.dataPoints[0].dataIndex];
        if (!period) {
            element.classList.add('hidden');
            return;
        }
        var totalClass = valueClass(period.net);
        var title = yearly
            ? period.month + (period.partial ? '*' : '')
            : fullMonthLabel(period.month) + (period.partial ? '*' : '');
        var months = yearly && period.count > 1
            ? '<div class="stats-chart-tooltip-row"><span>' + tr('Месяцев', 'Months') + '</span><b>' + period.count + '</b></div>'
            : '';
        element.innerHTML = '<div class="stats-chart-tooltip-title">' + escapeHtml(title) + '</div>'
            + '<div class="stats-chart-tooltip-total ' + totalClass + '">'
            + '<span>' + tr('ВСЕГО', 'TOTAL') + '</span>'
            + '<strong>' + signed(period.net) + ' ' + unitKm2() + '</strong>'
            + '</div>'
            + '<div class="stats-chart-tooltip-row"><span>' + tr('Продвижение', 'Advance') + '</span>'
            + '<b class="gain">+' + formatNumber(period.gain) + '</b></div>'
            + '<div class="stats-chart-tooltip-row"><span>' + tr('Отход', 'Withdrawal') + '</span>'
            + '<b class="loss">−' + formatNumber(period.loss) + '</b></div>'
            + months
            + '<div class="stats-chart-tooltip-meta">' + formatDate(period.from) + ' — ' + formatDate(period.to)
            + ' · ' + unitDays(period.days) + '<br>' + tr('Темп: ', 'Rate: ') + signed(period.rate) + ' ' + unitRate() + '</div>';
        element.classList.remove('hidden');
        var wrap = context.chart.canvas.closest('.stats-chart-wrap');
        var width = element.offsetWidth;
        var height = element.offsetHeight;
        var left = Math.max(width / 2 + 8, Math.min(wrap.clientWidth - width / 2 - 8, tooltip.caretX));
        var top = tooltip.caretY;
        element.classList.toggle('is-below', top < height + 24);
        element.style.left = left + 'px';
        element.style.top = top + 'px';
    }

    function renderMainChart(periods) {
        var canvas = document.getElementById('monthly-chart');
        if (!canvas) return;
        var wrap = canvas.closest('.stats-chart-wrap');
        var fallback = document.getElementById('stats-chart-fallback');
        if (typeof Chart === 'undefined') {
            chartUnavailable(wrap, fallback);
            return;
        }
        if (!periods.length) {
            if (fallback) fallback.textContent = tr('За выбранный период данных нет.', 'No data for the selected period.');
            chartUnavailable(wrap, fallback);
            return;
        }
        if (fallback) fallback.textContent = tr('График недоступен: не загрузилась библиотека Chart.js. Таблица ниже работает.', 'Chart unavailable: Chart.js failed to load. The table below still works.');
        chartAvailable(wrap, fallback);

        var yearly = state.granularity === 'year';
        var chartPeriods = yearly ? aggregateYears(periods) : periods;
        if (!chartPeriods.length) {
            if (fallback) fallback.textContent = tr('За выбранный период данных нет.', 'No data for the selected period.');
            chartUnavailable(wrap, fallback);
            return;
        }
        var labels = chartPeriods.map(function (period) {
            return (yearly ? period.month : shortMonth(period.month)) + (period.partial ? '*' : '');
        });
        var gains = chartPeriods.map(function (period) { return Number(period.gain) || 0; });
        var losses = chartPeriods.map(function (period) { return -(Number(period.loss) || 0); });
        var nets = chartPeriods.map(function (period) { return Number(period.net) || 0; });
        var gainColors = chartPeriods.map(function (period) {
            return period.partial ? 'rgba(224, 27, 11, 0.24)' : 'rgba(224, 27, 11, 0.45)';
        });
        var lossColors = chartPeriods.map(function (period) {
            return period.partial ? 'rgba(47, 99, 184, 0.20)' : 'rgba(47, 99, 184, 0.35)';
        });
        var lastPeriod = chartPeriods[chartPeriods.length - 1];
        var lastNet = nets[nets.length - 1];

        var sub = document.getElementById('stats-chart-sub');
        if (sub) {
            var shown = yearly
                ? tr('Показано ' + chartPeriods.length + ' ' + yearWord(chartPeriods.length) + '.', 'Showing ' + chartPeriods.length + ' yearly totals.')
                : tr('Показано ' + chartPeriods.length + ' периодов.', 'Showing ' + chartPeriods.length + ' periods.');
            sub.textContent = yearly
                ? tr('Продвижение — выше нуля, отход — ниже нуля, линия — всего. * — неполный год. Пунктир — уровень последнего года. ',
                    'Advance — above zero, withdrawal — below zero, line — total. * — incomplete year. Dashed line — last year level. ') + shown
                : tr('Продвижение — выше нуля, отход — ниже нуля, линия — всего. * — неполный месяц. Пунктир — уровень последнего периода, вертикальные линии — годы. ',
                    'Advance — above zero, withdrawal — below zero, line — total. * — incomplete month. Dashed line — last period level, vertical lines — years. ') + shown;
        }
        var currentNote = document.getElementById('stats-chart-level-note');
        if (currentNote) {
            var levelWord = yearly ? tr('последнего года', 'last year') : tr('последнего периода', 'last period');
            currentNote.textContent = tr(
                'Пунктир — уровень ' + levelWord + ': ' + signed(lastNet) + ' ' + unitKm2() + '.',
                'Dashed line — ' + levelWord + ' level: ' + signed(lastNet) + ' ' + unitKm2() + '.'
            );
        }

        var existingTooltip = ensureChartTooltip(canvas);
        if (existingTooltip) existingTooltip.classList.add('hidden');
        destroyChart('main');
        charts.main = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            plugins: [currentLevelPlugin, yearSeparatorsPlugin, detailLabelsPlugin],
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: tr('Всего', 'Total'),
                        data: nets,
                        fill: 'origin',
                        borderColor: MAIN_GAIN,
                        backgroundColor: function (context) {
                            var chart = context.chart;
                            var area = chart.chartArea;
                            if (!area) return 'rgba(224, 27, 11, 0.10)';
                            var zero = chart.scales.y.getPixelForValue(0);
                            var ratio = (zero - area.top) / (area.bottom - area.top);
                            ratio = Math.min(1, Math.max(0, ratio));
                            var gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                            gradient.addColorStop(0, 'rgba(224, 27, 11, 0.10)');
                            gradient.addColorStop(ratio, 'rgba(224, 27, 11, 0.10)');
                            gradient.addColorStop(Math.min(1, ratio + 0.0001), 'rgba(47, 99, 184, 0.10)');
                            gradient.addColorStop(1, 'rgba(47, 99, 184, 0.10)');
                            return gradient;
                        },
                        borderWidth: 2.5,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBorderWidth: 0,
                        pointBackgroundColor: function (context) {
                            return context.parsed.y >= 0 ? MAIN_GAIN : MAIN_LOSS;
                        },
                        pointHoverBackgroundColor: function (context) {
                            return context.parsed.y >= 0 ? MAIN_GAIN : MAIN_LOSS;
                        },
                        tension: 0.25,
                        order: 2,
                        segment: {
                            borderColor: function (context) {
                                var value = (context.p0.parsed.y + context.p1.parsed.y) / 2;
                                return value >= 0 ? MAIN_GAIN_LINE : MAIN_LOSS_LINE;
                            }
                        }
                    },
                    {
                        type: 'bar',
                        label: tr('Продвижение', 'Advance'),
                        data: gains,
                        backgroundColor: gainColors,
                        borderRadius: 2,
                        maxBarThickness: yearly ? 56 : 24,
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: tr('Отход', 'Withdrawal'),
                        data: losses,
                        backgroundColor: lossColors,
                        borderRadius: 2,
                        maxBarThickness: yearly ? 56 : 24,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                animation: false,
                plugins: {
                    legend: { display: false },
                    currentLevel: { value: lastNet },
                    yearSeparators: { periods: yearly ? [] : chartPeriods },
                    detailLabels: { enabled: state.detail },
                    tooltip: {
                        enabled: false,
                        external: function (context) {
                            renderMainTooltip(context, chartPeriods, yearly);
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6c757d',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 14,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.07)' },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) { return numberFormat.format(value); },
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        },
                        title: {
                            display: true,
                            text: unitKm2(),
                            color: '#6c757d',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Накопленный итог с начала наступления по каждой точке периода.
     * База — площадь контроля на первом срезе, то есть та же величина,
     * что в четвёртой карточке («Всего с начала наступления»).
     */
    function cumulativeControlSeries(data, periods) {
        var all = data && data.periods ? data.periods : [];
        var base = all.length && all[0].areaFrom != null ? Number(all[0].areaFrom) : null;
        var running = 0;
        var byMonth = {};
        for (var i = 0; i < all.length; i++) {
            running += Number(all[i].net) || 0;
            byMonth[all[i].month] = running;
        }
        return periods.map(function (period) {
            if (base != null && period.areaTo != null) {
                return Math.round((Number(period.areaTo) - base) * 100) / 100;
            }
            return Math.round((byMonth[period.month] || 0) * 100) / 100;
        });
    }

    function renderTotalChart(data, periods) {
        var canvas = document.getElementById('total-chart');
        if (!canvas) return;
        var wrap = canvas.closest('.stats-chart-wrap');
        var fallback = document.getElementById('total-chart-fallback');
        var note = document.getElementById('stats-total-note');
        if (typeof Chart === 'undefined') {
            chartUnavailable(wrap, fallback);
            return;
        }
        if (!periods.length) {
            if (fallback) fallback.textContent = tr('За выбранный период данных нет.', 'No data for the selected period.');
            chartUnavailable(wrap, fallback);
            if (note) note.textContent = '';
            return;
        }
        chartAvailable(wrap, fallback);

        var values = cumulativeControlSeries(data, periods);
        var labels = periods.map(function (period) {
            return shortMonth(period.month) + (period.partial ? '*' : '');
        });
        var last = values[values.length - 1];
        if (note) {
            note.textContent = tr(
                'На конец периода: ' + signed(last) + ' ' + unitKm2()
                    + ' с начала наступления. * — неполный месяц.',
                'At the end of the period: ' + signed(last) + ' ' + unitKm2()
                    + ' since the start of the offensive. * — incomplete month.'
            );
        }

        destroyChart('total');
        charts.total = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            plugins: [totalLabelsPlugin],
            data: {
                labels: labels,
                datasets: [{
                    label: tr('Всего с начала наступления', 'Total since the start'),
                    data: values,
                    backgroundColor: 'rgba(224, 27, 11, 0.55)',
                    borderColor: 'rgba(224, 27, 11, 0.85)',
                    borderWidth: 1,
                    borderRadius: 2,
                    maxBarThickness: 34
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(31, 35, 40, 0.94)',
                        titleFont: { family: 'Roboto, Arial, sans-serif', size: 13 },
                        bodyFont: { family: 'Roboto, Arial, sans-serif', size: 12 },
                        padding: 10,
                        callbacks: {
                            title: function (items) {
                                var period = periods[items[0].dataIndex];
                                return period ? fullMonthLabel(period.month) + (period.partial ? ' *' : '') : '';
                            },
                            label: function (context) {
                                return tr('С начала наступления: ', 'Since the start: ')
                                    + signed(context.parsed.y) + ' ' + unitKm2();
                            },
                            afterBody: function (items) {
                                var period = periods[items[0].dataIndex];
                                if (!period) return '';
                                return [
                                    tr('За месяц: ', 'Month: ') + signed(period.net) + ' ' + unitKm2(),
                                    tr('Продвижение: +', 'Advance: +') + formatNumber(period.gain)
                                        + ' · ' + tr('отход: −', 'withdrawal: −') + formatNumber(period.loss)
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6c757d',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 18,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grace: '10%',
                        grid: { color: 'rgba(0, 0, 0, 0.07)' },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) { return numberFormat.format(value); },
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        },
                        title: {
                            display: true,
                            text: unitKm2(),
                            color: '#6c757d',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    }
                }
            }
        });
    }

    function renderDirectionChart(directions, periods) {
        var canvas = document.getElementById('direction-chart');
        if (!canvas) return;
        var wrap = canvas.closest('.stats-chart-wrap');
        var fallback = document.getElementById('direction-chart-fallback');
        if (typeof Chart === 'undefined') {
            chartUnavailable(wrap, fallback);
            return;
        }
        if (!directions.length) {
            destroyChart('direction');
            chartUnavailable(wrap, fallback);
            if (fallback) {
                fallback.textContent = tr('Выберите направления для сравнения.', 'Select directions to compare.');
                fallback.classList.remove('hidden');
            }
            return;
        }
        if (!periods.length) {
            destroyChart('direction');
            chartUnavailable(wrap, fallback);
            if (fallback) {
                fallback.textContent = tr('За выбранный период данных по направлениям нет.', 'No direction data for the selected period.');
                fallback.classList.remove('hidden');
            }
            return;
        }
        chartAvailable(wrap, fallback);

        var labels = periods.map(function (period) {
            return shortMonth(period.month) + (period.partial ? '*' : '');
        });
        var aligned = directions.map(function (direction) {
            var byMonth = {};
            (direction.periods || []).forEach(function (period) { byMonth[period.month] = period; });
            return periods.map(function (period) { return byMonth[period.month] || null; });
        });
        var multiple = directions.length > 1;
        var datasets = directions.map(function (direction, index) {
            var color = directionColor(direction);
            return {
                label: directionDisplayName(direction),
                data: aligned[index].map(function (item) { return item ? Number(item.net) || 0 : null; }),
                borderColor: color,
                backgroundColor: multiple ? color : hexToRgba(color, 0.12),
                borderWidth: 2,
                pointRadius: 2.5,
                pointHoverRadius: 4,
                fill: !multiple,
                tension: 0.25,
                spanGaps: false
            };
        });

        destroyChart('direction');
        charts.direction = new Chart(canvas.getContext('2d'), {
            type: 'line',
            plugins: [directionZonesPlugin],
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                animation: false,
                plugins: {
                    directionZones: { enabled: multiple },
                    legend: {
                        display: multiple,
                        position: 'top',
                        labels: {
                            color: '#1f2328',
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            padding: 10,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 35, 40, 0.94)',
                        titleFont: { family: 'Roboto, Arial, sans-serif', size: 13 },
                        bodyFont: { family: 'Roboto, Arial, sans-serif', size: 12 },
                        padding: 10,
                        callbacks: {
                            title: function (items) {
                                var period = periods[items[0].dataIndex];
                                return period ? fullMonthLabel(period.month) : '';
                            },
                            label: function (context) {
                                if (multiple) {
                                    return context.dataset.label + ': ' + signed(context.parsed.y) + ' ' + unitKm2();
                                }
                                return tr('Всего: ', 'Total: ') + signed(context.parsed.y) + ' ' + unitKm2();
                            },
                            afterBody: multiple ? undefined : function (items) {
                                var item = aligned[0][items[0].dataIndex];
                                if (!item) return '';
                                return [
                                    tr('Продвижение: +', 'Advance: +') + formatNumber(item.gain),
                                    tr('Отход: −', 'Withdrawal: −') + formatNumber(item.loss),
                                    tr('Дней: ', 'Days: ') + item.days
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6c757d',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 12,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grace: '10%',
                        grid: { color: 'rgba(0, 0, 0, 0.07)' },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) { return numberFormat.format(value); },
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        },
                        title: {
                            display: true,
                            text: unitKm2(),
                            color: '#6c757d',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    }
                }
            }
        });
    }

    function buildGroupModel(data, periods) {
        var order = [];
        var map = {};
        var idToGroup = {};
        var directions = data.directions || [];
        for (var i = 0; i < directions.length; i++) {
            var group = directionGroup(directions[i]);
            if (!map[group]) {
                map[group] = { name: group, directionIds: [], totals: emptyTotals() };
                order.push(group);
            }
            map[group].directionIds.push(directions[i].id);
            idToGroup[directions[i].id] = group;
        }

        for (var g = 0; g < order.length; g++) {
            var item = map[order[g]];
            var totals = emptyTotals();
            for (var d = 0; d < item.directionIds.length; d++) {
                var direction = findDirection(data, item.directionIds[d]);
                if (!direction) continue;
                var directionSummary = directionTotals(direction, state.range);
                totals.gain += directionSummary.gain;
                totals.loss += directionSummary.loss;
                totals.net += directionSummary.net;
                totals.days += directionSummary.days;
                totals.count += directionSummary.count;
            }
            item.totals = totals;
        }

        var periodGroups = periods.map(function (period) {
            var values = {};
            for (var k = 0; k < order.length; k++) values[order[k]] = 0;
            var periodDirections = period.directions || [];
            for (var j = 0; j < periodDirections.length; j++) {
                var name = idToGroup[periodDirections[j].id];
                if (name && values[name] != null) values[name] += Number(periodDirections[j].net) || 0;
            }
            return {
                period: period,
                values: values,
                unassigned: period.unassigned ? Number(period.unassigned.net) || 0 : 0
            };
        });

        return {
            order: order,
            map: map,
            periodGroups: periodGroups,
            unassigned: unassignedTotals(data, state.range)
        };
    }

    function renderGroupChart(data, periods, model) {
        var canvas = document.getElementById('groups-chart');
        if (!canvas) return;
        var wrap = canvas.closest('.stats-chart-wrap');
        var fallback = document.getElementById('groups-chart-fallback');
        if (typeof Chart === 'undefined') {
            chartUnavailable(wrap, fallback);
            return;
        }
        if (!periods.length || !model.order.length) {
            chartUnavailable(wrap, fallback);
            return;
        }
        chartAvailable(wrap, fallback);

        var labels = periods.map(function (period) {
            return shortMonth(period.month) + (period.partial ? '*' : '');
        });
        var datasets = model.order.map(function (name, index) {
            return {
                label: groupDisplayName(name),
                data: model.periodGroups.map(function (item) { return item.values[name] || 0; }),
                backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length],
                borderRadius: 2,
                maxBarThickness: 24,
                stack: 'net'
            };
        });
        if (data.unassigned) {
            datasets.push({
                label: tr('Вне направлений', 'Unassigned'),
                data: model.periodGroups.map(function (item) { return item.unassigned; }),
                backgroundColor: '#9aa0a6',
                borderRadius: 2,
                maxBarThickness: 24,
                stack: 'net'
            });
        }

        destroyChart('groups');
        charts.groups = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                animation: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 9,
                            boxHeight: 9,
                            padding: 14,
                            color: '#495057',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 35, 40, 0.94)',
                        titleFont: { family: 'Roboto, Arial, sans-serif', size: 13 },
                        bodyFont: { family: 'Roboto, Arial, sans-serif', size: 12 },
                        padding: 10,
                        callbacks: {
                            title: function (items) {
                                var period = periods[items[0].dataIndex];
                                return period ? fullMonthLabel(period.month) : '';
                            },
                            label: function (context) {
                                return context.dataset.label + ': ' + signed(context.parsed.y) + ' ' + unitKm2();
                            },
                            afterBody: function (items) {
                                var period = periods[items[0].dataIndex];
                                if (!period) return '';
                                return [tr('Всего: ', 'Total: ') + signed(period.net) + ' ' + unitKm2()];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: {
                            color: '#6c757d',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 14,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.07)' },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) { return numberFormat.format(value); },
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        },
                        title: {
                            display: true,
                            text: unitKm2(),
                            color: '#6c757d',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    }
                }
            }
        });
    }

    function renderGroups(data, periods) {
        var section = document.getElementById('groups');
        if (!section) return;
        if (!data.directions || !data.directions.length || !periods.length) {
            section.classList.add('hidden');
            return;
        }

        var model = buildGroupModel(data, periods);
        if (!model.order.length) {
            section.classList.add('hidden');
            return;
        }

        var rows = model.order.map(function (name) {
            var totals = model.map[name].totals;
            return '<tr>'
                + '<td>' + escapeHtml(groupDisplayName(name)) + ' <span class="muted">(' + model.map[name].directionIds.length + ')</span></td>'
                + '<td class="num gain">' + (totals.gain > 0 ? '+' + formatNumber(totals.gain) : '0') + '</td>'
                + '<td class="num loss">' + (totals.loss > 0 ? '−' + formatNumber(totals.loss) : '0') + '</td>'
                + '<td class="num ' + (totals.net > 0 ? 'net-pos' : totals.net < 0 ? 'net-neg' : 'muted') + '">' + signed(totals.net) + '</td>'
                + '</tr>';
        });

        if (data.unassigned) {
            var unassigned = model.unassigned;
            rows.push('<tr class="is-unassigned">'
                + '<td>' + tr('Вне направлений', 'Unassigned') + '</td>'
                + '<td class="num gain">' + (unassigned.gain > 0 ? '+' + formatNumber(unassigned.gain) : '0') + '</td>'
                + '<td class="num loss">' + (unassigned.loss > 0 ? '−' + formatNumber(unassigned.loss) : '0') + '</td>'
                + '<td class="num">' + signed(unassigned.net) + '</td>'
                + '</tr>');
        }

        var total = summarize(totalsPeriods(periods, state.range));
        rows.push('<tr class="is-total">'
            + '<td>' + tr('Итого', 'Total') + '</td>'
            + '<td class="num gain">+' + formatNumber(total.gain) + '</td>'
            + '<td class="num loss">−' + formatNumber(total.loss) + '</td>'
            + '<td class="num">' + signed(total.net) + '</td>'
            + '</tr>');
        document.getElementById('stats-groups-body').innerHTML = rows.join('');

        var sub = document.getElementById('stats-groups-sub');
        if (sub) {
            sub.textContent = tr('Всего по группам; показано ', 'Totals by group; showing ') + periodsCaption(totalsPeriods(periods, state.range)) + tr('. * — неполный месяц.', '. * — incomplete month.');
        }
        var note = document.getElementById('stats-groups-note');
        if (note) {
            note.textContent = tr('Группы заданы в KML границ. В скобках — число направлений в группе. «Вне направлений» — компоненты, не попавшие ни в один сектор.', 'Groups are defined in the border KML. The number in parentheses is the number of directions in the group. Unassigned components do not fall into any sector.');
        }
        section.classList.remove('hidden');
        renderGroupChart(data, periods, model);
    }

    function defaultDirection(data) {
        var directions = data && data.directions ? data.directions : [];
        var best = null;
        for (var i = 0; i < directions.length; i++) {
            var net = directions[i].fullTotals ? Number(directions[i].fullTotals.net) || 0 : 0;
            if (!best || net > best.net) best = { direction: directions[i], net: net };
        }
        return best ? best.direction : (directions[0] || null);
    }

    function ensureSelectedDirections(data) {
        function fallback() {
            var initial = defaultDirection(data);
            state.directions = initial ? [initial.id] : [];
            return initial ? [initial] : [];
        }
        if (!Array.isArray(state.directions)) return fallback();
        var selected = [];
        var seen = {};
        for (var i = 0; i < state.directions.length; i++) {
            var id = state.directions[i];
            if (seen[id]) continue;
            var direction = findDirection(data, id);
            if (!direction) continue;
            seen[id] = true;
            selected.push(direction);
        }
        if (!selected.length && state.directions.length) return fallback();
        state.directions = selected.map(function (direction) { return direction.id; });
        return selected;
    }

    function renderDirectionDetail(data, selected, periods) {
        var title = document.getElementById('stats-direction-title');
        var sub = document.getElementById('stats-direction-sub');
        var totalsBox = document.getElementById('stats-direction-totals');
        if (!selected.length) {
            if (title) title.textContent = tr('Выберите направления', 'Select directions');
            if (sub) sub.textContent = tr('Отметьте строки в таблице, чтобы сравнить направления на графике.', 'Select rows in the table to compare directions on the chart.');
            if (totalsBox) totalsBox.innerHTML = '';
            renderDirectionChart([], periods);
            return;
        }
        if (selected.length > 1) {
            if (title) title.textContent = tr('Сравнение направлений', 'Directions comparison');
            if (sub) {
                sub.textContent = tr('Выбрано ', 'Selected ') + selected.length + ' · '
                    + periodsCaption(periods) + ' · ' + rangeLabel(state.range) + ' · ' + tr('* — неполный месяц.', '* — incomplete month.');
            }
            if (totalsBox) totalsBox.innerHTML = '';
            renderDirectionChart(selected, periods);
            return;
        }
        var direction = selected[0];
        var directionPeriods = filterPeriods(direction.periods, state.range);
        var totals = directionTotals(direction, state.range);
        if (title) title.textContent = directionDisplayName(direction);
        if (sub) {
            sub.textContent = groupDisplayName(directionGroup(direction)) + ' · '
                + periodsCaption(directionPeriods) + ' · ' + rangeLabel(state.range) + ' · ' + tr('* — неполный месяц.', '* — incomplete month.');
        }
        if (totalsBox) {
            totalsBox.innerHTML = '<span class="gain">+' + formatNumber(totals.gain) + '</span>'
                + '<span class="loss">−' + formatNumber(totals.loss) + '</span>'
                + '<span class="net">' + signed(totals.net) + ' ' + unitKm2() + '</span>';
        }
        renderDirectionChart(selected, periods);
    }

    function matrixValue(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        if (number < 0) return '−' + formatNumber(Math.abs(number));
        return formatNumber(number);
    }

    function directionRowLabel(id) {
        var row = DIRECTION_LABELS[id];
        if (row) return isEn() ? row.en : row.ru;
        var direction = findDirection(state.data, id);
        return direction ? directionDisplayName(direction) : id;
    }

    function matrixDirections(data) {
        var list = [];
        var seen = {};
        function add(id, direction) {
            if (seen[id]) return;
            seen[id] = true;
            list.push({
                id: id,
                direction: direction || null,
                label: direction ? directionDisplayName(direction) : directionRowLabel(id)
            });
        }
        DIRECTION_ROWS.forEach(function (row) { add(row.id, findDirection(data, row.id)); });
        (data.directions || []).forEach(function (direction) { add(direction.id, direction); });
        return list;
    }

    function matrixHead(periods, totalTitle, nameTitle) {
        var groups = [];
        for (var i = 0; i < periods.length; i++) {
            var period = periods[i];
            var year = String(period.month || '').slice(0, 4);
            var group = groups[groups.length - 1];
            if (!group || group.year !== year) {
                group = { year: year, periods: [] };
                groups.push(group);
            }
            group.periods.push(period);
        }
        var yearStarts = periods.map(function (item, index) {
            return index === 0 || String(periods[index - 1].month).slice(0, 4) !== String(item.month).slice(0, 4);
        });

        var html = '<tr>'
            + '<th rowspan="2" class="num stats-matrix-total">' + escapeHtml(totalTitle) + '</th>';
        var monthRow = '<tr>';
        groups.forEach(function (item) {
            html += '<th colspan="' + item.periods.length + '" class="stats-matrix-year">' + escapeHtml(item.year) + '</th>';
            item.periods.forEach(function (month) {
                var index = Number(String(month.month).slice(5, 7)) - 1;
                var short = MONTHS_SHORT[index] || month.month;
                monthRow += '<th class="num stats-matrix-month" title="' + escapeHtml(fullMonthLabel(month.month)) + '">'
                    + escapeHtml(short) + (month.partial ? '*' : '') + '</th>';
            });
        });
        html += '<th rowspan="2" class="stats-matrix-name">' + escapeHtml(nameTitle) + '</th>'
            + '</tr>' + monthRow + '</tr>';
        return { html: html, yearStarts: yearStarts };
    }

    function scrollMatrixToEnd(sectionSelector) {
        var section = document.querySelector(sectionSelector);
        var wrap = section ? section.querySelector('.stats-matrix-wrap') : null;
        if (!wrap || wrap.getAttribute('data-range') === String(state.range)) return;
        wrap.setAttribute('data-range', String(state.range));
        window.requestAnimationFrame(function () { wrap.scrollLeft = wrap.scrollWidth; });
    }

    function renderDirectionMatrix(data, periods, selected) {
        var head = document.getElementById('stats-matrix-head');
        var body = document.getElementById('stats-directions-body');
        var foot = document.getElementById('stats-matrix-foot');
        var sub = document.getElementById('stats-directions-sub');
        var note = document.getElementById('stats-directions-note');
        if (!head || !body || !foot) return;
        var selectedIds = selected.map(function (direction) { return direction.id; });

        var headModel = matrixHead(periods, tr('Всего', 'Total'), tr('Направление', 'Direction'));
        var yearStarts = headModel.yearStarts;
        head.innerHTML = headModel.html;

        var rows = [];
        var missing = 0;
        matrixDirections(data).forEach(function (row) {
            var direction = row.direction;
            var byMonth = {};
            if (direction && Array.isArray(direction.periods)) {
                direction.periods.forEach(function (item) { byMonth[item.month] = item; });
            }
            var total = 0;
            var cells = periods.map(function (month, index) {
                var item = direction ? byMonth[month.month] : null;
                var classes = 'num';
                if (yearStarts[index]) classes += ' is-year-start';
                if (!item) {
                    return '<td class="' + classes + ' muted">—</td>';
                }
                var net = Number(item.net) || 0;
                total += net;
                classes += net > 0 ? ' net-pos' : net < 0 ? ' net-neg' : ' is-zero';
                return '<td class="' + classes + '" title="'
                    + escapeHtml(fullMonthLabel(month.month) + ': ' + matrixValue(net) + ' ' + unitKm2()) + '">'
                    + escapeHtml(matrixValue(net)) + '</td>';
            }).join('');

            if (!direction) missing += 1;
            // ponytail: итог меньше 1 км² считаем нулевым — у Херсона −0.57.
            var inactive = !direction || Math.abs(total) < 1;
            var rowClasses = ['stats-matrix-row'];
            if (direction) rowClasses.push('is-clickable');
            if (inactive) rowClasses.push('is-inactive');
            if (direction && selectedIds.indexOf(direction.id) !== -1) rowClasses.push('is-selected');
            rows.push('<tr class="' + rowClasses.join(' ') + '"'
                + (direction ? ' data-direction="' + escapeHtml(direction.id) + '" tabindex="0"' : '')
                + '>'
                + '<td class="num stats-matrix-total ' + (total > 0 ? 'net-pos' : total < 0 ? 'net-neg' : 'is-zero') + '">'
                + escapeHtml(direction ? matrixValue(total) : '—') + '</td>'
                + cells
                + '<td class="stats-matrix-name">' + escapeHtml(row.label) + '</td></tr>');
        });
        body.innerHTML = rows.join('');

        var totalNet = summarize(periods).net;
        foot.innerHTML = '<tr class="is-total">'
            + '<td class="num stats-matrix-total">' + escapeHtml(matrixValue(totalNet)) + '</td>'
            + periods.map(function (month) {
                return '<td class="num">' + escapeHtml(matrixValue(month.net)) + '</td>';
            }).join('')
            + '<td class="stats-matrix-name">' + escapeHtml(tr('Итого', 'Total')) + '</td>'
            + '</tr>';

        if (sub) {
            sub.textContent = tr('Показано ', 'Showing ') + periodsCaption(periods)
                + ' · ' + rangeLabel(state.range) + ' · ' + tr('нетто, км²', 'net, km²') + '.';
        }
        if (note) {
            var parts = [tr('Нажмите на направления, чтобы выбрать их для сравнения (можно несколько).',
                'Click directions to include them in the comparison (multiple allowed).')];
            if (missing) {
                parts.push(tr('«—» — направление ещё не размечено в KML границ.',
                    '"—" — the direction is not mapped in the boundary KML yet.'));
            }
            parts.push(tr('Бледные строки — без изменений за период.',
                'Faded rows — no change over the period.'));
            note.textContent = parts.join(' ');
        }

        scrollMatrixToEnd('#directions');
    }

    function renderDirections(data, periods) {
        var section = document.getElementById('directions');
        var body = document.getElementById('stats-directions-body');
        if (!section || !body) return;
        var directions = data.directions || [];
        if (!directions.length || !periods.length) {
            section.classList.add('hidden');
            return;
        }

        var selected = ensureSelectedDirections(data);
        renderDirectionMatrix(data, periods, selected);

        section.classList.remove('hidden');
        renderDirectionDetail(data, selected, periods);
    }

    function defaultRegion(data) {
        var regions = data && data.regions ? data.regions : [];
        var best = null;
        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            var row = REGION_LABELS[region.id];
            if (row && row.inactive) continue;
            var net = region.fullTotals ? Number(region.fullTotals.net) || 0 : 0;
            if (!best || net > best.net) best = { region: region, net: net };
        }
        return best ? best.region : (regions[0] || null);
    }

    function ensureSelectedRegions(data) {
        function fallback() {
            var initial = defaultRegion(data);
            state.regions = initial ? [initial.id] : [];
            return initial ? [initial] : [];
        }
        if (!Array.isArray(state.regions)) return fallback();
        var selected = [];
        var seen = {};
        for (var i = 0; i < state.regions.length; i++) {
            var id = state.regions[i];
            if (seen[id]) continue;
            var region = findRegion(data, id);
            var row = REGION_LABELS[id];
            if (!region || (row && row.inactive)) continue;
            seen[id] = true;
            selected.push(region);
        }
        if (!selected.length && state.regions.length) return fallback();
        state.regions = selected.map(function (region) { return region.id; });
        return selected;
    }

    function matrixRegions(data) {
        var list = [];
        var seen = {};
        function add(id, region, group) {
            if (seen[id]) return;
            seen[id] = true;
            list.push({
                id: id,
                region: region || null,
                label: region ? regionDisplayName(region) : regionLabel(id),
                group: group || null
            });
        }
        regionGroupsList(data).forEach(function (group) {
            (group.regions || []).forEach(function (id) { add(id, findRegion(data, id), group); });
        });
        REGION_ROWS.forEach(function (row) { add(row.id, findRegion(data, row.id), null); });
        (data.regions || []).forEach(function (region) { add(region.id, region, null); });
        return list;
    }

    function regionItem(region, month) {
        var periods = region && region.periods ? region.periods : [];
        for (var i = 0; i < periods.length; i++) {
            if (periods[i].month === month) return periods[i];
        }
        return null;
    }

    function signedShareDelta(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return '—';
        return signedShare(number);
    }

    function outsideValue(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return Math.abs(number) < 0.05 ? 0 : Math.round(number * 100) / 100;
    }

    function renderRegionMatrix(data, periods, selected) {
        var head = document.getElementById('stats-regions-head');
        var body = document.getElementById('stats-regions-body');
        var foot = document.getElementById('stats-regions-foot');
        var sub = document.getElementById('stats-regions-sub');
        var note = document.getElementById('stats-regions-note');
        if (!head || !body || !foot) return;
        var selectedIds = selected.map(function (region) { return region.id; });
        var headModel = matrixHead(periods, tr('Δ, п.п.', 'Δ, pp'), tr('Область', 'Oblast'));
        head.innerHTML = headModel.html;
        var yearStarts = headModel.yearStarts;
        var groups = regionGroupsList(data);

        function groupShares(group) {
            var ids = group.regions || [];
            return periods.map(function (month) {
                var sum = 0;
                var area = 0;
                ids.forEach(function (id) {
                    var region = findRegion(data, id);
                    var item = regionItem(region, month.month);
                    if (!item || !Number.isFinite(Number(item.share))) return;
                    var regionArea = Number(region.areaKm2) || 0;
                    if (regionArea <= 0) return;
                    sum += Number(item.share) * regionArea;
                    area += regionArea;
                });
                return area ? sum / area : null;
            });
        }

        function groupTotalRow(group) {
            var shares = groupShares(group);
            var first = null;
            var last = null;
            shares.forEach(function (share) {
                if (share == null) return;
                if (first == null) first = share;
                last = share;
            });
            var cells = shares.map(function (share, index) {
                var classes = 'num';
                if (yearStarts[index]) classes += ' is-year-start';
                return '<td class="' + classes + '">' + escapeHtml(share == null ? '—' : formatShare(share)) + '</td>';
            }).join('');
            return '<tr class="is-total">'
                + '<td class="num stats-matrix-total">'
                + escapeHtml(first == null || last == null ? '—' : signedShare(last - first))
                + '</td>'
                + cells
                + '<td class="stats-matrix-name">' + escapeHtml(tr('Итого', 'Total')) + '</td>'
                + '</tr>';
        }

        var rows = [];
        var missing = 0;
        var pending = null;
        matrixRegions(data).forEach(function (row) {
            if (row.group !== pending) {
                if (pending && pending.total) rows.push(groupTotalRow(pending));
                pending = row.group;
                if (pending) {
                    rows.push('<tr class="stats-matrix-group-row">'
                        + '<td colspan="' + (periods.length + 1) + '"></td>'
                        + '<td class="stats-matrix-name">' + escapeHtml(regionGroupName(pending)) + '</td></tr>');
                }
            }
            var region = row.region;
            var known = REGION_LABELS[row.id];
            var inactive = !region || (known && known.inactive);
            if (!region) missing += 1;
            var shares = regionShareTotals(region, periods);
            var delta = shares.first != null && shares.last != null ? shares.last - shares.first : null;
            var cells = periods.map(function (month, index) {
                var classes = 'num';
                if (yearStarts[index]) classes += ' is-year-start';
                var item = region ? regionItem(region, month.month) : null;
                if (!item) return '<td class="' + classes + ' muted">—</td>';
                return '<td class="' + classes + '" title="'
                    + escapeHtml(fullMonthLabel(month.month) + ': ' + formatShare(item.share) + ' %') + '">'
                    + escapeHtml(formatShare(item.share)) + '</td>';
            }).join('');
            var rowClasses = ['stats-matrix-row'];
            if (region && !inactive) rowClasses.push('is-clickable');
            if (inactive) rowClasses.push('is-inactive');
            if (region && selectedIds.indexOf(region.id) !== -1) rowClasses.push('is-selected');
            rows.push('<tr class="' + rowClasses.join(' ') + '"'
                + (region && !inactive ? ' data-region="' + escapeHtml(region.id) + '" tabindex="0"' : '')
                + '>'
                + '<td class="num stats-matrix-total ' + (delta == null ? 'muted' : delta > 0.005 ? 'net-pos' : delta < -0.005 ? 'net-neg' : 'is-zero') + '">'
                + escapeHtml(delta == null ? '—' : signedShare(delta)) + '</td>'
                + cells
                + '<td class="stats-matrix-name">' + escapeHtml(row.label) + '</td></tr>');
        });
        if (pending && pending.total) rows.push(groupTotalRow(pending));
        body.innerHTML = rows.join('');

        var footerShares = periods.map(function (month) {
            var sum = 0;
            var area = 0;
            (data.regions || []).forEach(function (region) {
                var item = regionItem(region, month.month);
                if (!item || !Number.isFinite(Number(item.share))) return;
                var regionArea = Number(region.areaKm2) || 0;
                if (regionArea <= 0) return;
                sum += Number(item.share) * regionArea;
                area += regionArea;
            });
            return area ? sum / area : null;
        });
        var firstWeighted = null;
        var lastWeighted = null;
        footerShares.forEach(function (share) {
            if (share == null) return;
            if (firstWeighted == null) firstWeighted = share;
            lastWeighted = share;
        });
        var footerCells = periods.map(function (month, index) {
            var classes = 'num';
            if (yearStarts[index]) classes += ' is-year-start';
            var share = footerShares[index];
            return '<td class="' + classes + '">' + escapeHtml(share == null ? '—' : formatShare(share)) + '</td>';
        }).join('');
        if (groups.length) {
            foot.innerHTML = '';
        } else {
            foot.innerHTML = '<tr class="is-total">'
                + '<td class="num stats-matrix-total">'
                + escapeHtml(firstWeighted == null || lastWeighted == null ? '—' : signedShare(lastWeighted - firstWeighted))
                + '</td>'
                + footerCells
                + '<td class="stats-matrix-name">' + escapeHtml(tr('Итого', 'Total')) + '</td>'
                + '</tr>';
        }

        if (sub) {
            sub.textContent = tr('Показано ', 'Showing ') + periodsCaption(periods)
                + ' · ' + rangeLabel(state.range) + ' · '
                + tr('доля контроля, % площади суши области', 'control share, % of oblast land area') + '.';
        }
        if (note) {
            var parts = [tr('Нажмите на область, чтобы вывести её на график (можно несколько).',
                'Click an oblast to plot it (multiple allowed).')];
            if (missing) {
                parts.push(tr('«—» — область ещё не размечена в KML границ.',
                    '"—" — the oblast is not mapped in the boundary KML yet.'));
            }
            parts.push(tr('Бледные строки — справочные, в сравнении не участвуют.',
                'Faded rows are for reference and are not compared.'));
            parts.push(tr('Итого — взвешенная доля по площади областей группы с данными.',
                'Total is the area-weighted share of the group\'s oblasts with data.'));
            note.textContent = parts.join(' ');
        }

        scrollMatrixToEnd('#regions');
    }

    function renderRegionChart(regions, periods) {
        var canvas = document.getElementById('region-chart');
        if (!canvas) return;
        var wrap = canvas.closest('.stats-chart-wrap');
        var fallback = document.getElementById('region-chart-fallback');
        if (typeof Chart === 'undefined') {
            chartUnavailable(wrap, fallback);
            return;
        }
        if (!regions.length) {
            destroyChart('region');
            chartUnavailable(wrap, fallback);
            if (fallback) {
                fallback.textContent = tr('Выберите области для сравнения.', 'Select oblasts to compare.');
                fallback.classList.remove('hidden');
            }
            return;
        }
        if (!periods.length) {
            destroyChart('region');
            chartUnavailable(wrap, fallback);
            if (fallback) {
                fallback.textContent = tr('За выбранный период данных по областям нет.', 'No oblast data for the selected period.');
                fallback.classList.remove('hidden');
            }
            return;
        }
        chartAvailable(wrap, fallback);

        var labels = periods.map(function (period) {
            return shortMonth(period.month) + (period.partial ? '*' : '');
        });
        var aligned = regions.map(function (region) {
            var byMonth = {};
            (region.periods || []).forEach(function (item) { byMonth[item.month] = item; });
            return periods.map(function (period) { return byMonth[period.month] || null; });
        });
        var multiple = regions.length > 1;
        var datasets = regions.map(function (region, index) {
            var color = regionColor(region);
            return {
                label: regionDisplayName(region),
                data: aligned[index].map(function (item) { return item ? Number(item.share) : null; }),
                borderColor: color,
                backgroundColor: multiple ? color : hexToRgba(color, 0.12),
                borderWidth: 2,
                pointRadius: 2.5,
                pointHoverRadius: 4,
                fill: !multiple,
                tension: 0.25,
                spanGaps: false
            };
        });

        var yScale = regionShareScale(regions, periods);

        destroyChart('region');
        charts.region = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                animation: false,
                plugins: {
                    legend: {
                        display: multiple,
                        position: 'top',
                        labels: {
                            color: '#1f2328',
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            padding: 10,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 35, 40, 0.94)',
                        titleFont: { family: 'Roboto, Arial, sans-serif', size: 13 },
                        bodyFont: { family: 'Roboto, Arial, sans-serif', size: 12 },
                        padding: 10,
                        callbacks: {
                            title: function (items) {
                                var period = periods[items[0].dataIndex];
                                return period ? fullMonthLabel(period.month) : '';
                            },
                            label: function (context) {
                                var prefix = multiple ? context.dataset.label + ': ' : '';
                                return prefix + formatShare(context.parsed.y) + ' %';
                            },
                            afterBody: multiple ? undefined : function (items) {
                                var item = aligned[0][items[0].dataIndex];
                                if (!item) return '';
                                return [
                                    tr('Продвижение: +', 'Advance: +') + formatNumber(item.gain) + ' ' + unitKm2(),
                                    tr('Отход: −', 'Withdrawal: −') + formatNumber(item.loss) + ' ' + unitKm2(),
                                    tr('Всего: ', 'Total: ') + signed(item.net) + ' ' + unitKm2()
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6c757d',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 12,
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    },
                    y: {
                        min: yScale.min,
                        max: yScale.max,
                        beginAtZero: false,
                        grid: { color: 'rgba(0, 0, 0, 0.07)' },
                        ticks: {
                            color: '#6c757d',
                            callback: function (value) { return formatNumber(value) + ' %'; },
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        },
                        title: {
                            display: true,
                            text: tr('Доля контроля, %', 'Control share, %'),
                            color: '#6c757d',
                            font: { family: 'Roboto, Arial, sans-serif', size: 11 }
                        }
                    }
                }
            }
        });
    }

    function renderRegionDetail(data, selected, periods) {
        var title = document.getElementById('stats-region-title');
        var sub = document.getElementById('stats-region-sub');
        var totalsBox = document.getElementById('stats-region-totals');
        if (!selected.length) {
            if (title) title.textContent = tr('Выберите области', 'Select oblasts');
            if (sub) sub.textContent = tr('Отметьте строки в таблице, чтобы сравнить доли контроля на графике.',
                'Select rows in the table to compare control shares on the chart.');
            if (totalsBox) totalsBox.innerHTML = '';
            renderRegionChart([], periods);
            return;
        }
        if (selected.length > 1) {
            if (title) title.textContent = tr('Сравнение областей', 'Oblasts comparison');
            if (sub) {
                sub.textContent = tr('Выбрано ', 'Selected ') + selected.length + ' · '
                    + periodsCaption(periods) + ' · ' + rangeLabel(state.range) + ' · ' + tr('* — неполный месяц.', '* — incomplete month.');
            }
            if (totalsBox) totalsBox.innerHTML = '';
            renderRegionChart(selected, periods);
            return;
        }
        var region = selected[0];
        var shares = regionShareTotals(region, periods);
        var delta = shares.first != null && shares.last != null ? shares.last - shares.first : null;
        if (title) title.textContent = regionDisplayName(region);
        if (sub) {
            sub.textContent = tr('Доля контроля по области (без акватории)', 'Control share of the oblast (land only)') + ' · '
                + periodsCaption(periods) + ' · ' + rangeLabel(state.range) + ' · ' + tr('* — неполный месяц.', '* — incomplete month.');
        }
        if (totalsBox) {
            totalsBox.innerHTML = (shares.last == null ? '' : '<span class="net">' + formatShare(shares.last) + ' %</span>')
                + (delta == null ? '' : '<span class="' + (delta > 0.05 ? 'gain' : delta < -0.05 ? 'loss' : 'net') + '">'
                    + signedShareDelta(delta) + ' ' + unitPp() + '</span>');
        }
        renderRegionChart(selected, periods);
    }

    function renderRegions(data, periods) {
        var section = document.getElementById('regions');
        var body = document.getElementById('stats-regions-body');
        if (!section || !body) return;
        var regions = data.regions || [];
        if (!regions.length || !periods.length) {
            section.classList.add('hidden');
            return;
        }

        var selected = ensureSelectedRegions(data);
        renderRegionMatrix(data, periods, selected);

        section.classList.remove('hidden');
        renderRegionDetail(data, selected, periods);
    }

    function renderCurrentRegions(data) {
        var section = document.getElementById('stats-current-regions');
        var body = document.getElementById('stats-current-regions-body');
        var period = latestPeriod(data);
        var regions = data && data.regions ? data.regions : [];
        if (!section || !body || !period || !regions.length) {
            if (section) section.classList.add('hidden');
            return;
        }

        var sumGain = 0;
        var sumLoss = 0;
        var sumNet = 0;
        var rows = [];
        matrixRegions(data).forEach(function (row) {
            var region = row.region;
            var known = REGION_LABELS[row.id];
            var inactive = !region || (known && known.inactive);
            var item = region ? regionItem(region, period.month) : null;
            if (item) {
                sumGain += Number(item.gain) || 0;
                sumLoss += Number(item.loss) || 0;
                sumNet += Number(item.net) || 0;
            }
            var cells = item
                ? '<td class="num gain">' + ((Number(item.gain) || 0) > 0 ? '+' + formatNumber(item.gain) : '0') + '</td>'
                    + '<td class="num loss">' + ((Number(item.loss) || 0) > 0 ? '−' + formatNumber(item.loss) : '0') + '</td>'
                    + '<td class="num ' + (item.net > 0 ? 'net-pos' : item.net < 0 ? 'net-neg' : 'muted') + '">' + signed(item.net) + '</td>'
                : '<td class="num muted">—</td><td class="num muted">—</td><td class="num muted">—</td>';
            rows.push('<tr' + (inactive ? ' class="is-inactive"' : '') + '>'
                + '<td>' + escapeHtml(row.label) + '</td>' + cells + '</tr>');
        });

        var outsideGain = outsideValue(period.gain - sumGain);
        var outsideLoss = outsideValue(period.loss - sumLoss);
        var outsideNet = outsideValue(period.net - sumNet);
        rows.push('<tr class="is-unassigned">'
            + '<td>' + tr('Вне областей', 'Outside oblasts') + '</td>'
            + '<td class="num gain">' + (outsideGain > 0 ? '+' + formatNumber(outsideGain) : '0') + '</td>'
            + '<td class="num loss">' + (outsideLoss > 0 ? '−' + formatNumber(outsideLoss) : '0') + '</td>'
            + '<td class="num ' + (outsideNet > 0 ? 'net-pos' : outsideNet < 0 ? 'net-neg' : 'muted') + '">' + signed(outsideNet) + '</td>'
            + '</tr>');

        rows.push('<tr class="is-total">'
            + '<td>' + tr('Итого', 'Total') + '</td>'
            + '<td class="num gain">+' + formatNumber(period.gain) + '</td>'
            + '<td class="num loss">−' + formatNumber(period.loss) + '</td>'
            + '<td class="num">' + signed(period.net) + '</td>'
            + '</tr>');

        body.innerHTML = rows.join('');
        var sub = document.getElementById('stats-current-regions-sub');
        if (sub) {
            sub.textContent = formatDate(period.from) + ' — ' + formatDate(period.to)
                + ' · ' + unitDays(period.days) + '.';
        }
        var note = document.getElementById('stats-current-regions-note');
        if (note) {
            note.textContent = tr(
                'Текущий период: ' + fullMonthLabel(period.month) + '. Значения по областям и «вне областей» в сумме дают итог периода.',
                'Current period: ' + fullMonthLabel(period.month) + '. Oblast and outside-oblast values add up to the period total.'
            );
        }
        section.classList.remove('hidden');
    }

    function updateRangeLabel(data, periods) {
        var label = document.getElementById('stats-range-label');
        var toolbar = document.getElementById('stats-toolbar');
        var totals = summarize(periods);
        var net = directNet(periods);
        var toolbarClass = periods.length ? cardClass(net) : 'is-total';
        if (toolbar) {
            toolbar.classList.remove('is-gain', 'is-loss', 'is-total');
            toolbar.classList.add(toolbarClass);
            toolbar.title = periods.length
                ? tr('Периодов: ', 'Periods: ') + periods.length + ' · ' + rangeLabel(state.range)
                : tr('Нет данных', 'No data');
        }
        if (!label) return;
        if (!periods.length) {
            label.textContent = tr('Нет данных', 'No data');
            return;
        }
        label.innerHTML = '<span class="gain">+' + formatNumber(totals.gain) + ' ' + unitKm2() + '</span>'
            + '<span class="sep" aria-hidden="true">|</span>'
            + '<span class="loss">−' + formatNumber(totals.loss) + ' ' + unitKm2() + '</span>'
            + '<span class="sep" aria-hidden="true">|</span>'
            + '<span class="net ' + valueClass(net) + '">' + tr('Всего: ', 'Total: ') + signed(net) + ' ' + unitKm2() + '</span>';
    }

    function renderRangeOptions(data) {
        var select = document.getElementById('stats-range-select');
        if (!select) return;
        var presets = [
            { value: 'all', label: tr('Всё время', 'All time') },
            { value: '24', label: tr('Последние 24 мес.', 'Last 24 months') },
            { value: '12', label: tr('Последние 12 мес.', 'Last 12 months') },
            { value: '6', label: tr('Последние 6 мес.', 'Last 6 months') }
        ];
        var years = {};
        var months = {};
        (data.periods || []).forEach(function (period) {
            var month = String(period.month || '');
            if (!month) return;
            years[month.slice(0, 4)] = true;
            if (!months[month]) {
                months[month] = {
                    value: month,
                    label: fullMonthLabel(month) + (period.partial ? ' ' + tr('(текущий)', '(current)') : '')
                };
            }
        });
        var monthOptions = Object.keys(months).sort().reverse().map(function (month) {
            return months[month];
        });
        var yearOptions = Object.keys(years).sort().reverse().map(function (year) {
            return { value: year, label: isEn() ? year : year + ' год' };
        });
        var groups = [
            { label: tr('Периоды', 'Periods'), options: presets },
            { label: tr('Годы', 'Years'), options: yearOptions },
            { label: tr('Месяцы', 'Months'), options: monthOptions }
        ];
        var allOptions = presets.concat(yearOptions, monthOptions);
        var valid = false;
        for (var i = 0; i < allOptions.length; i++) {
            if (allOptions[i].value === state.range) valid = true;
        }
        if (!valid) state.range = 'all';
        select.innerHTML = groups.filter(function (group) { return group.options.length; }).map(function (group) {
            return '<optgroup label="' + escapeHtml(group.label) + '">'
                + group.options.map(function (option) {
                    return '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</option>';
                }).join('')
                + '</optgroup>';
        }).join('');
        select.value = state.range;
    }

    function updateRangeControls() {
        var select = document.getElementById('stats-range-select');
        if (select && select.value !== state.range) select.value = state.range;
        var reset = document.getElementById('stats-month-reset');
        if (reset) reset.classList.toggle('hidden', !isMonthRange(state.range));
        updateGranularityControls();
    }

    function renderAll() {
        var data = state.data;
        if (!data) return;
        var periods = filterPeriods(data.periods, state.range);
        renderCards(data);
        renderCurrentDirections(data);
        renderCurrentRegions(data);
        if (document.getElementById('stats-table-body')) renderTable(periods);
        renderMainChart(periods);
        renderTotalChart(data, periods);
        renderDirections(data, periods);
        renderRegions(data, periods);
        renderGroups(data, periods);
        updateRangeLabel(data, periods);
        updateRangeControls();
    }

    function syncUrl() {
        if (!window.history || typeof window.history.replaceState !== 'function') return;
        var params = new URLSearchParams(window.location.search);
        if (state.range === 'all') params.delete('range');
        else params.set('range', state.range);
        if (Array.isArray(state.directions) && state.directions.length) params.set('direction', state.directions.join(','));
        else params.delete('direction');
        if (Array.isArray(state.regions) && state.regions.length) params.set('region', state.regions.join(','));
        else params.delete('region');
        var query = params.toString();
        var next = window.location.pathname + (query ? '?' + query : '');
        window.history.replaceState(null, '', next);
    }

    function readUrlState() {
        var params = new URLSearchParams(window.location.search);
        state.range = params.get('range') || 'all';
        var rawDirection = params.get('direction');
        state.directions = rawDirection === null ? null : rawDirection.split(',').filter(Boolean);
        var rawRegion = params.get('region');
        state.regions = rawRegion === null ? null : rawRegion.split(',').filter(Boolean);
    }

    function selectMonth(month) {
        if (!state.data) return;
        state.range = month;
        renderAll();
        syncUrl();
    }

    function toggleDirection(id) {
        if (!state.data || !findDirection(state.data, id)) return;
        var list = Array.isArray(state.directions) ? state.directions.slice() : [];
        var index = list.indexOf(id);
        if (index >= 0) list.splice(index, 1);
        else list.push(id);
        state.directions = list;
        renderDirections(state.data, filterPeriods(state.data.periods, state.range));
        syncUrl();
    }

    function toggleRegion(id) {
        var row = REGION_LABELS[id];
        if (!state.data || !findRegion(state.data, id) || (row && row.inactive)) return;
        var list = Array.isArray(state.regions) ? state.regions.slice() : [];
        var index = list.indexOf(id);
        if (index >= 0) list.splice(index, 1);
        else list.push(id);
        state.regions = list;
        renderRegions(state.data, filterPeriods(state.data.periods, state.range));
        syncUrl();
    }

    function resetMonth() {
        if (!state.data) return;
        state.range = 'all';
        renderAll();
        syncUrl();
    }

    function savePngDataUrl(dataUrl, name) {
        var link = document.createElement('a');
        link.download = (name || 'territory') + '-' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function savePngCanvas(source, name) {
        var out = document.createElement('canvas');
        out.width = source.width;
        out.height = source.height;
        var ctx = out.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(source, 0, 0);
        savePngDataUrl(out.toDataURL('image/png'), name);
    }

    function pngFilter(node) {
        if (!node || !node.classList) return true;
        return !(node.classList.contains('is-inactive')
            || node.classList.contains('stats-png-btn')
            || node.classList.contains('stats-icon-btn')
            || node.classList.contains('stats-panel-actions')
            || node.classList.contains('stats-granularity')
            || node.classList.contains('stats-note'));
    }

    function downloadPanelPng(button) {
        var selector = button.getAttribute('data-shot');
        var frame = selector ? document.querySelector(selector) : null;
        if (!frame) return;
        var name = button.getAttribute('data-file') || 'territory';
        var wide = !!frame.querySelector('.stats-matrix-wrap');
        if (wide) frame.classList.add('stats-png-wide');
        function cleanup() {
            if (wide) frame.classList.remove('stats-png-wide');
        }
        function fallback() {
            var canvas = frame.querySelector('canvas');
            if (canvas) savePngCanvas(canvas, name);
        }
        var lib = window.modernScreenshot;
        if (lib && typeof lib.domToPng === 'function') {
            lib.domToPng(frame, {
                backgroundColor: '#ffffff',
                scale: 2,
                font: false,
                filter: pngFilter,
                onCloneNode: function (node) {
                    if (node.tagName === 'H2') node.style.whiteSpace = 'nowrap';
                }
            }).then(function (dataUrl) {
                savePngDataUrl(dataUrl, name);
            }).catch(function (error) {
                console.error('Не удалось сохранить PNG:', error);
                fallback();
            }).finally(cleanup);
            return;
        }
        fallback();
        cleanup();
    }

    function updateGranularityControls() {
        document.querySelectorAll('[data-granularity]').forEach(function (button) {
            var active = button.getAttribute('data-granularity') === state.granularity;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function foldBody(details) {
        return details ? details.querySelector('.stats-fold-body') : null;
    }

    function stopFoldAnimation(details) {
        var anim = details && details._foldAnim;
        if (!anim) return;
        details._foldAnim = null;
        anim.cancel();
        var body = foldBody(details);
        if (body) {
            body.style.height = '';
            body.classList.remove('is-folding');
        }
    }

    // Плавная высота: details раскрывается мгновенно (иначе контент не измерить),
    // высота обёртки анимируется от 0 до реальной и наоборот.
    function setFoldOpen(details, open) {
        if (!details || details.open === open) return;
        var body = foldBody(details);
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!body || reduced || typeof body.animate !== 'function') {
            details.open = open;
            return;
        }
        if (details._foldAnim) return;
        var start = details.open ? body.offsetHeight : 0;
        if (open) details.open = true;
        body.style.height = start + 'px';
        body.classList.add('is-folding');
        var target = 0;
        if (open) {
            body.style.height = 'auto';
            target = body.offsetHeight;
            body.style.height = start + 'px';
        }
        var anim = body.animate(
            [{ height: start + 'px' }, { height: target + 'px' }],
            { duration: 200, easing: 'ease-out' }
        );
        details._foldAnim = anim;
        anim.onfinish = function () {
            details._foldAnim = null;
            body.style.height = '';
            body.classList.remove('is-folding');
            if (!open) details.open = false;
            anim.cancel();
        };
    }

    function openMoreFor(target) {
        if (!target) return;
        var id = String(target).replace(/^#/, '');
        var element = document.getElementById(id);
        var details = element && element.closest ? element.closest('details') : null;
        if (!details) return;
        stopFoldAnimation(details);
        setFoldOpen(details, true);
    }

    function resizeCharts() {
        Object.keys(charts).forEach(function (key) {
            var chart = charts[key];
            if (chart && typeof chart.resize === 'function') chart.resize();
        });
    }

    function bindEvents() {
        var granularityButtons = document.querySelectorAll('[data-granularity]');
        granularityButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var value = button.getAttribute('data-granularity');
                if (value !== 'year') value = 'month';
                if (state.granularity === value) return;
                state.granularity = value;
                updateGranularityControls();
                if (state.data) renderMainChart(filterPeriods(state.data.periods, state.range));
            });
        });

        var rangeSelect = document.getElementById('stats-range-select');
        if (rangeSelect) {
            rangeSelect.addEventListener('change', function () {
                state.range = rangeSelect.value;
                renderAll();
                syncUrl();
            });
        }

        document.querySelectorAll('.stats-fold').forEach(function (fold) {
            var summary = fold.querySelector('summary');
            if (summary) {
                summary.addEventListener('click', function (event) {
                    event.preventDefault();
                    setFoldOpen(fold, !fold.open);
                });
            }
            fold.addEventListener('toggle', function () {
                if (fold.open) window.requestAnimationFrame(resizeCharts);
            });
        });

        document.querySelectorAll('.stats-jump a').forEach(function (link) {
            link.addEventListener('click', function () {
                openMoreFor(link.getAttribute('href'));
            });
        });

        if (window.location.hash) openMoreFor(window.location.hash);
        window.addEventListener('hashchange', function () {
            openMoreFor(window.location.hash);
        });

        var monthReset = document.getElementById('stats-month-reset');
        if (monthReset) {
            monthReset.addEventListener('click', resetMonth);
        }

        var langButton = document.getElementById('stats-lang-toggle');
        if (langButton) {
            langButton.addEventListener('click', function () {
                setLanguage(isEn() ? 'ru' : 'en');
            });
        }

        document.querySelectorAll('.stats-png-btn').forEach(function (button) {
            button.addEventListener('click', function () { downloadPanelPng(button); });
        });

        var detailButton = document.getElementById('stats-chart-detail');
        if (detailButton) {
            detailButton.addEventListener('click', function () {
                state.detail = !state.detail;
                detailButton.classList.toggle('is-active', state.detail);
                detailButton.setAttribute('aria-pressed', state.detail ? 'true' : 'false');
                if (state.data) renderMainChart(filterPeriods(state.data.periods, state.range));
            });
        }

        var tableBody = document.getElementById('stats-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', function (event) {
                var row = event.target.closest ? event.target.closest('tr[data-month]') : null;
                if (row) selectMonth(row.getAttribute('data-month'));
            });
            tableBody.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                var row = event.target.closest ? event.target.closest('tr[data-month]') : null;
                if (!row) return;
                event.preventDefault();
                selectMonth(row.getAttribute('data-month'));
            });
        }

        var directionBody = document.getElementById('stats-directions-body');
        if (directionBody) {
            directionBody.addEventListener('click', function (event) {
                var row = event.target.closest ? event.target.closest('tr[data-direction]') : null;
                if (row) toggleDirection(row.getAttribute('data-direction'));
            });
            directionBody.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                var row = event.target.closest ? event.target.closest('tr[data-direction]') : null;
                if (!row) return;
                event.preventDefault();
                toggleDirection(row.getAttribute('data-direction'));
            });
        }

        var regionBody = document.getElementById('stats-regions-body');
        if (regionBody) {
            regionBody.addEventListener('click', function (event) {
                var row = event.target.closest ? event.target.closest('tr[data-region]') : null;
                if (row) toggleRegion(row.getAttribute('data-region'));
            });
            regionBody.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                var row = event.target.closest ? event.target.closest('tr[data-region]') : null;
                if (!row) return;
                event.preventDefault();
                toggleRegion(row.getAttribute('data-region'));
            });
        }
    }

    function render(data) {
        var periods = data.periods || [];
        if (!periods.length) throw new Error('В stats.json нет периодов');

        state.data = data;
        readUrlState();
        renderRangeOptions(data);

        var updated = document.getElementById('stats-updated');
        if (updated) {
            updated.textContent = tr('Данные на ', 'Data as of ') + formatDate(data.lastSnapshot)
                + tr(' · рассчитано ', ' · calculated ') + formatDateTime(data.generatedAt);
        }

        renderAll();

        var content = document.getElementById('stats-content');
        var empty = document.getElementById('stats-empty');
        if (content) content.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');

        if (window.location.hash) {
            openMoreFor(window.location.hash);
            var target = document.getElementById(String(window.location.hash).replace(/^#/, ''));
            if (target) {
                window.requestAnimationFrame(function () {
                    target.scrollIntoView({ block: 'start' });
                });
            }
        }
    }

    function showEmpty(error) {
        var content = document.getElementById('stats-content');
        var empty = document.getElementById('stats-empty');
        var text = document.getElementById('stats-empty-text');
        if (content) content.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
        if (text) {
            var message = error && error.message ? error.message : String(error || tr('неизвестная ошибка', 'unknown error'));
            text.innerHTML = tr(
                'Не удалось загрузить <code>stats/stats.json</code>. Проверьте, что файл сгенерирован и лежит рядом со страницей.',
                'Failed to load <code>stats/stats.json</code>. Make sure the file is generated and next to the page.'
            ) + ' <span class="stats-note">' + escapeHtml(message) + '</span>';
        }
    }

    async function loadStats() {
        var response = await fetch('stats/stats.json?ts=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initLanguage();
        bindEvents();
        if (typeof Chart !== 'undefined' && window.ChartAxis) {
            Chart.register(window.ChartAxis.anchorLastTick);
            if (Chart.defaults.layout && Chart.defaults.layout.padding) {
                Chart.defaults.layout.padding.right = 20;
            }
        }
        loadStats()
            .then(function (data) { render(data); })
            .catch(function (error) {
                console.error('Не удалось загрузить статистику:', error);
                showEmpty(error);
            });
    });
})();
