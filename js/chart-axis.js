/*
 * Подписи оси категорий.
 *
 * Chart.js прореживает подписи, отсчитывая шаг от левого края: при 38 месяцах
 * и лимите 14 остаются индексы 0, 3, 6 … 36, и последняя точка (актуальный
 * месяц) остаётся без подписи. Здесь шаг тот же, но отсчёт идёт от конца.
 * Работает и в браузере (window.ChartAxis), и в Node (module.exports).
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ChartAxis = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    /**
     * Пересобирает уже прореженные тики с конца.
     * ticks — [{value, label}], maxValue — номер последней точки,
     * labels — chart.data.labels (необязательно).
     */
    function anchoredTicks(ticks, maxValue, labels) {
        if (!Array.isArray(ticks) || ticks.length < 2) return ticks;
        if (!Number.isFinite(maxValue)) return ticks;
        var last = ticks[ticks.length - 1];
        if (last.value === maxValue) return ticks;
        var step = 0;
        for (var i = 1; i < ticks.length; i++) {
            var diff = ticks[i].value - ticks[i - 1].value;
            if (diff > 0 && (!step || diff < step)) step = diff;
        }
        if (!(step > 0)) return ticks;
        var result = [];
        for (var value = maxValue; value >= ticks[0].value; value -= step) {
            var label = labels && labels[value] != null ? labels[value] : String(value);
            result.unshift({ value: value, label: label });
        }
        return result.length ? result : ticks;
    }

    /** Плагин Chart.js: после обновления подписывает последнюю точку оси X. */
    var anchorLastTick = {
        id: 'anchorLastTick',
        afterUpdate: function (chart) {
            var scale = chart && chart.scales ? chart.scales.x : null;
            if (!scale || !Array.isArray(scale.ticks)) return;
            var ticks = anchoredTicks(scale.ticks, scale.max, chart.data ? chart.data.labels : null);
            if (ticks === scale.ticks) return;
            scale.ticks = ticks;
            scale._labelSizes = null;
            scale._labelItems = null;
            scale._gridLineItems = null;
        }
    };

    return { anchoredTicks: anchoredTicks, anchorLastTick: anchorLastTick };
});
