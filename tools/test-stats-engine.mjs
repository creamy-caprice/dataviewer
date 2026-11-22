#!/usr/bin/env node
/*
 * Проверка движка статистики.
 * Запуск: node tools/test-stats-engine.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const StatsEngine = require(path.join(ROOT, 'stats/stats-engine.js'));
const ChartAxis = require(path.join(ROOT, 'js/chart-axis.js'));
const clip = require(path.join(ROOT, 'js/vendor/polygon-clipping.umd.min.js'));

function test(name, fn) {
    try {
        fn();
        console.log('ok  ' + name);
    } catch (error) {
        console.error('FAIL ' + name);
        throw error;
    }
}

test('snapshotInfo разбирает имя и дату', () => {
    const info = StatsEngine.snapshotInfo('Control_24_10_01.kml');
    assert.equal(info.iso, '2024-10-01');
    assert.equal(info.year, 2024);
    assert.equal(StatsEngine.snapshotInfo('control_26_10_12.KML').iso, '2026-10-12');
    assert.equal(StatsEngine.snapshotInfo('Progress_26_10_12.kml'), null);
});

test('площадь квадрата 1°×1° у экватора', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const area = StatsEngine.ringAreaKm2(ring);
    assert.ok(area > 12000 && area < 12500, 'area=' + area);
});

test('разность двух квадратов: прирост и уменьшение', () => {
    const prev = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const curr = [[5, 0], [15, 0], [15, 10], [5, 10], [5, 0]];
    const delta = StatsEngine.computeDelta(prev, curr, clip);
    assert.equal(delta.gain.length, 1);
    assert.equal(delta.loss.length, 1);
    const summary = StatsEngine.summarizeDelta(prev, curr, clip, { thresholdKm2: 0.5 });
    assert.ok(summary.gain > 0);
    assert.ok(summary.loss > 0);
    assert.ok(Math.abs(summary.raw.net) < 1e-6);
});

test('исключённая область вычитается из дельты', () => {
    const prev = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
    const curr = [[1, 0], [3, 0], [3, 2], [1, 2], [1, 0]];
    const base = StatsEngine.summarizeDelta(prev, curr, clip, { thresholdKm2: 0 });
    const water = [[2, 0], [2.5, 0], [2.5, 2], [2, 2], [2, 0]];
    const cut = StatsEngine.summarizeDelta(prev, curr, clip, {
        thresholdKm2: 0,
        excludeGeometry: [water]
    });
    assert.ok(cut.gain < base.gain, 'gain should shrink');
    assert.ok(Math.abs(cut.gain - base.gain / 2) < 1, 'cut=' + cut.gain + ' base=' + base.gain);
    assert.ok(Math.abs(cut.loss - base.loss) < 0.01, 'loss should stay');
});

test('микрокомпоненты отбрасываются, но видны в micro', () => {
    const tiny = [[0, 0], [0.005, 0], [0.005, 0.005], [0, 0.005], [0, 0]];
    const split = StatsEngine.splitComponents([[tiny]], 0.5);
    assert.equal(split.keptCount, 0);
    assert.equal(split.droppedCount, 1);
    assert.ok(split.droppedArea > 0.1 && split.droppedArea < 0.5, 'area=' + split.droppedArea);

    const summary = StatsEngine.summarizeDelta(tiny, tiny, clip, { thresholdKm2: 0.5 });
    assert.equal(summary.gain, 0);
    assert.equal(summary.loss, 0);
    assert.equal(summary.micro.gain, 0);
});

test('по умолчанию учитываются все компоненты, включая микрополигоны', () => {
    const tiny = [[0, 0], [0.005, 0], [0.005, 0.005], [0, 0.005], [0, 0]];
    const split = StatsEngine.splitComponents([[tiny]]);
    assert.equal(split.keptCount, 1);
    assert.equal(split.droppedCount, 0);
    assert.ok(split.keptArea > 0.1 && split.keptArea < 0.5, 'area=' + split.keptArea);
});

test('месячные срезы выбираются около 1-го числа', () => {
    const snapshots = [
        StatsEngine.snapshotInfo('Control_26_09_02.kml'),
        StatsEngine.snapshotInfo('Control_26_09_10.kml'),
        StatsEngine.snapshotInfo('Control_26_10_04.kml')
    ];
    const boundaries = StatsEngine.selectMonthlySnapshots(snapshots);
    assert.deepEqual(boundaries.map(x => x.iso), ['2026-09-02', '2026-10-04']);
});

test('buildStats подписывает период месяцем перед конечным срезом', () => {
    const snapshots = [StatsEngine.snapshotInfo('Control_26_09_02.kml'), StatsEngine.snapshotInfo('Control_26_10_04.kml')];
    const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    const result = StatsEngine.buildStats(snapshots, { 'Control_26_09_02.kml': ring, 'Control_26_10_04.kml': ring }, clip, {
        thresholdKm2: 0.5
    });
    assert.equal(result.periods.length, 1);
    assert.equal(result.periods[0].month, '2026-09');
    assert.equal(result.periods[0].gain, 0);
});

test('реальные срезы 01.10.2024 → 01.11.2024', () => {
    const controlDir = path.join(ROOT, 'kml/ControlZones');
    const prev = StatsEngine.parseControlKml(fs.readFileSync(path.join(controlDir, 'Control_24_10_01.kml'), 'utf8'));
    const curr = StatsEngine.parseControlKml(fs.readFileSync(path.join(controlDir, 'Control_24_11_01.kml'), 'utf8'));
    assert.ok(prev && prev.length > 20000);
    assert.ok(curr && curr.length > 20000);
    const summary = StatsEngine.summarizeDelta(prev, curr, clip, { thresholdKm2: 0.5 });
    assert.ok(summary.gain > 1020 && summary.gain < 1030, 'gain=' + summary.gain);
    assert.ok(summary.loss > 205 && summary.loss < 211, 'loss=' + summary.loss);
    assert.ok(summary.net > 812 && summary.net < 818, 'net=' + summary.net);

    const all = StatsEngine.summarizeDelta(prev, curr, clip, { thresholdKm2: 0 });
    assert.ok(all.gain > summary.gain, 'gain без порога должен быть больше');
    assert.ok(all.loss > summary.loss, 'loss без порога должен быть больше');
    assert.equal(all.micro.gain, 0);
    assert.equal(all.micro.loss, 0);
});

test('KML направлений: 13 полигонов с id', () => {
    const text = fs.readFileSync(path.join(ROOT, 'kml/PermanentObjects/Directions.kml'), 'utf8');
    const directions = StatsEngine.parseKmlPolygons(text);
    assert.equal(directions.length, 13);
    assert.equal(directions[0].id, 'sumy');
    assert.equal(directions[0].name, 'Сумское');
    assert.equal(directions[0].group, 'Север');
    assert.ok(directions.some(direction => direction.id === 'kharkiv'));
    assert.ok(directions.some(direction => direction.id === 'dnipropetrovsk'));
    assert.ok(directions.some(direction => direction.id === 'herson'));
    assert.equal(directions.find(direction => direction.id === 'orekhiv').group, 'Днепр');
    assert.ok(directions.some(direction => direction.id === 'chernihiv'));
    const kursk = directions.find(direction => direction.id === 'kursk');
    assert.equal(kursk.name, 'Курская область');
    assert.equal(kursk.group, 'Север');
    assert.ok(kursk.polygon.length > 1000);
    assert.ok(!directions.some(direction => direction.id === 'krasny_liman'));
    assert.ok(directions.some(direction => direction.id === 'krasnolimansk'));
    assert.ok(directions.every(direction => direction.polygon.length >= 5));
    assert.ok(directions.find(direction => direction.id === 'dnipropetrovsk').polygon.length > 1000);
    assert.ok(!fs.existsSync(path.join(ROOT, 'kml/PermanentObjects/Directions_fragments.kml')));
});

test('KML направлений: Сумское и Курская область не пересекаются', () => {
    const text = fs.readFileSync(path.join(ROOT, 'kml/PermanentObjects/Directions.kml'), 'utf8');
    const directions = StatsEngine.parseKmlPolygons(text);
    const sumy = directions.find(direction => direction.id === 'sumy');
    const kursk = directions.find(direction => direction.id === 'kursk');
    const overlap = clip.intersection([sumy.polygon], [kursk.polygon]);
    const area = overlap.reduce((sum, polygon) => sum + StatsEngine.multiPolygonAreaKm2([polygon]), 0);
    assert.ok(area < 0.01, 'пересечение ' + area.toFixed(3) + ' км²');
});

test('KML направлений: Славянское разделено на Славянское и Краснолиманское', () => {
    const text = fs.readFileSync(path.join(ROOT, 'kml/PermanentObjects/Directions.kml'), 'utf8');
    const directions = StatsEngine.parseKmlPolygons(text);
    const slavyansk = directions.find(direction => direction.id === 'slavyansk');
    const krasnolimansk = directions.find(direction => direction.id === 'krasnolimansk');
    assert.equal(slavyansk.name, 'Славянское');
    assert.equal(slavyansk.group, 'Запад');
    assert.equal(krasnolimansk.name, 'Краснолиманское');
    assert.equal(krasnolimansk.group, 'Запад');
    assert.ok(StatsEngine.pointInRing([37.6056, 48.8531], slavyansk.polygon), 'Славянск должен быть в Славянском');
    assert.ok(StatsEngine.pointInRing([37.8028, 48.9791], krasnolimansk.polygon), 'Лиман должен быть в Краснолиманском');
    const overlap = clip.intersection([slavyansk.polygon], [krasnolimansk.polygon]);
    const area = overlap.reduce((sum, polygon) => sum + StatsEngine.multiPolygonAreaKm2([polygon]), 0);
    assert.ok(area < 0.01, 'пересечение ' + area.toFixed(3) + ' км²');
    const sum = StatsEngine.ringAreaKm2(slavyansk.polygon) + StatsEngine.ringAreaKm2(krasnolimansk.polygon);
    assert.ok(Math.abs(sum - 12365.08) < 0.1, 'суммарная площадь ' + sum.toFixed(2) + ' км²');
});

test('LineString не считается полигоном направления', () => {
    const line = '<Placemark><name>Линия</name><LineString><coordinates>30,45,0 31,46,0</coordinates></LineString></Placemark>';
    assert.equal(StatsEngine.parseKmlPolygons(line).length, 0);
});

test('направления: сумма направлений + unassigned = итог', () => {
    const snapshots = [
        StatsEngine.snapshotInfo('Control_26_09_02.kml'),
        StatsEngine.snapshotInfo('Control_26_10_04.kml')
    ];
    const prev = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const curr = [[5, 0], [15, 0], [15, 10], [5, 10], [5, 0]];
    const east = {
        id: 'east',
        name: 'Восток',
        group: 'Тест',
        polygon: [[10, 0], [20, 0], [20, 10], [10, 10], [10, 0]]
    };
    const result = StatsEngine.buildStats(snapshots, {
        'Control_26_09_02.kml': prev,
        'Control_26_10_04.kml': curr
    }, clip, {
        thresholdKm2: 0.5,
        includePartial: false,
        directions: [east]
    });
    assert.equal(result.directions.length, 1);
    assert.equal(result.directions[0].name, 'Восток');
    assert.equal(result.directions[0].group, 'Тест');
    assert.ok(result.directions[0].fullTotals.gain > 6000, 'gain=' + result.directions[0].fullTotals.gain);
    assert.equal(result.directions[0].fullTotals.loss, 0);
    assert.ok(result.unassigned.fullTotals.loss > 6000, 'loss=' + result.unassigned.fullTotals.loss);
    const assignedGain = result.directions.reduce((sum, direction) => sum + direction.fullTotals.gain, 0);
    const assignedLoss = result.directions.reduce((sum, direction) => sum + direction.fullTotals.loss, 0);
    assert.ok(Math.abs(assignedGain + result.unassigned.fullTotals.gain - result.fullTotals.gain) < 0.02,
        'gain invariant');
    assert.ok(Math.abs(assignedLoss + result.unassigned.fullTotals.loss - result.fullTotals.loss) < 0.02,
        'loss invariant');
});

test('KML контуров областей: только замкнутые кольца', () => {
    const text = '<Placemark><name>Замкнутая</name><LineString><coordinates>'
        + '30,45,0 31,45,0 31,46,0 30,45,0</coordinates></LineString></Placemark>'
        + '<Placemark><name>Незамкнутая</name><LineString><coordinates>'
        + '30,45,0 31,45,0 31,46,0</coordinates></LineString></Placemark>';
    const rings = StatsEngine.parseKmlRings(text);
    assert.equal(rings.length, 1);
    assert.equal(rings[0].name, 'Замкнутая');
    assert.equal(rings[0].id, 'region-1');
    assert.ok(rings[0].polygon.length >= 4);
});

test('Области.kml: восемь замкнутых контуров с реальными площадями', () => {
    const text = fs.readFileSync(path.join(ROOT, 'kml/PermanentObjects/Области.kml'), 'utf8');
    const regions = StatsEngine.parseKmlRings(text);
    assert.equal(regions.length, 8);
    const sumy = regions.find(region => region.name === 'Сумская область');
    assert.ok(sumy, 'нет Сумской области');
    const area = StatsEngine.ringAreaKm2(sumy.polygon);
    assert.ok(area > 23600 && area < 23900, 'площадь Сумской ' + area);
    const chernihiv = regions.find(region => region.name === 'Черниговская область');
    assert.ok(chernihiv, 'нет Черниговской области');
    const chernihivArea = StatsEngine.ringAreaKm2(chernihiv.polygon);
    assert.ok(chernihivArea > 31700 && chernihivArea < 31900, 'площадь Черниговской ' + chernihivArea);
    assert.ok(regions.every(region => region.polygon[0][0] === region.polygon[region.polygon.length - 1][0]));
});

test('buildStats: доля контроля и месячные изменения по области', () => {
    const snapshots = ['Control_26_01_01.kml', 'Control_26_02_01.kml', 'Control_26_03_01.kml']
        .map(name => StatsEngine.snapshotInfo(name));
    const jan = [[0, 0], [5, 0], [5, 10], [0, 10], [0, 0]];
    const feb = [[0, 0], [7, 0], [7, 10], [0, 10], [0, 0]];
    const region = {
        id: 'test',
        name: 'Тестовая область',
        polygon: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
    };
    const result = StatsEngine.buildStats(snapshots, {
        'Control_26_01_01.kml': jan,
        'Control_26_02_01.kml': feb,
        'Control_26_03_01.kml': feb
    }, clip, { thresholdKm2: 0, includePartial: false, regions: [region] });

    assert.equal(result.regions.length, 1);
    const stats = result.regions[0];
    assert.equal(stats.id, 'test');
    assert.equal(stats.periods.length, 2);
    assert.ok(Math.abs(stats.periods[0].share - 70) < 0.5, 'доля ' + stats.periods[0].share);
    assert.ok(stats.periods[0].gain > 6000, 'прирост ' + stats.periods[0].gain);
    assert.equal(stats.periods[0].loss, 0);
    assert.ok(Math.abs(stats.periods[1].share - 70) < 0.5, 'доля ' + stats.periods[1].share);
    assert.ok(Math.abs(stats.periods[1].gain) < 0.01);
    assert.ok(Math.abs(stats.fullTotals.gain - result.periods[0].gain) < 0.02, 'область покрывает весь контроль');
    assert.equal(stats.fullTotals.loss, 0);
});

test('buildStats: области делят контроль без пересечений', () => {
    const snapshots = ['Control_26_01_01.kml', 'Control_26_02_01.kml'].map(name => StatsEngine.snapshotInfo(name));
    const prev = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const curr = [[0, 0], [20, 0], [20, 10], [0, 10], [0, 0]];
    const west = { id: 'west', name: 'Запад', polygon: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]] };
    const east = { id: 'east', name: 'Восток', polygon: [[10, 0], [20, 0], [20, 10], [10, 10], [10, 0]] };
    const result = StatsEngine.buildStats(snapshots, {
        'Control_26_01_01.kml': prev,
        'Control_26_02_01.kml': curr
    }, clip, { thresholdKm2: 0, includePartial: false, regions: [west, east] });
    const sum = result.regions.reduce((total, region) => total + region.fullTotals.gain, 0);
    assert.ok(Math.abs(sum - result.fullTotals.gain) < 0.02, 'сумма по областям ' + sum + ' != ' + result.fullTotals.gain);
});

test('buildStats: акватория не входит в площадь области', () => {
    const snapshots = ['Control_26_01_01.kml', 'Control_26_02_01.kml'].map(name => StatsEngine.snapshotInfo(name));
    const prev = [[0, 0], [3, 0], [3, 10], [0, 10], [0, 0]];
    const curr = [[0, 0], [7, 0], [7, 10], [0, 10], [0, 0]];
    const region = {
        id: 'test',
        name: 'Тестовая область',
        polygon: [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
    };
    const water = [[[0, 0], [5, 0], [5, 10], [0, 10], [0, 0]]];
    const snapshotsArea = {
        'Control_26_01_01.kml': prev,
        'Control_26_02_01.kml': curr
    };
    const withWater = StatsEngine.buildStats(snapshots, snapshotsArea, clip,
        { thresholdKm2: 0, includePartial: false, regions: [region], regionsWater: water });
    const plain = StatsEngine.buildStats(snapshots, snapshotsArea, clip,
        { thresholdKm2: 0, includePartial: false, regions: [region] });

    assert.equal(withWater.source.regions.waterExcluded, true);
    assert.equal(plain.source.regions.waterExcluded, false);
    const land = withWater.regions[0];
    const full = plain.regions[0];
    assert.ok(Math.abs(land.areaKm2 - full.areaKm2 / 2) < 1,
        'площадь суши ' + land.areaKm2 + ' при полной ' + full.areaKm2);
    // Вода занимает x < 5; контроль покрывает x < 7, значит на суше 5..7 из 5..10.
    assert.ok(Math.abs(land.periods[0].share - 40) < 0.5, 'доля суши ' + land.periods[0].share);
    assert.ok(Math.abs(full.periods[0].share - 70) < 0.5, 'доля с водой ' + full.periods[0].share);
    // Прирост 3..7: половина (3..5) в воде и не считается.
    assert.ok(Math.abs(land.periods[0].gain - full.periods[0].gain / 2) < 1,
        'прирост по суше ' + land.periods[0].gain + ' при полном ' + full.periods[0].gain);
});

test('stats.json: области с устойчивыми id и долями', () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'stats/stats.json'), 'utf8'));
    assert.deepEqual(data.regions.map(region => region.id).sort(), [
        'chernihiv', 'dnipropetrovsk', 'dnr', 'kharkiv', 'kherson', 'lnr', 'sumy', 'zaporizhzhia'
    ]);
    const byId = {};
    data.regions.forEach(region => { byId[region.id] = region; });
    assert.ok(byId.lnr.periods.at(-1).share > 98, 'ЛНР ' + byId.lnr.periods.at(-1).share);
    assert.ok(byId.dnr.periods.at(-1).share > 80 && byId.dnr.periods.at(-1).share < 90);
    assert.ok(byId.sumy.periods.at(-1).share < 10);
    assert.equal(data.source.regions.count, 8);
    assert.ok(byId.lnr.areaKm2 > 26000 && byId.lnr.areaKm2 < 27000);
    assert.ok(byId.chernihiv.areaKm2 > 31700 && byId.chernihiv.areaKm2 < 31900);
    for (const period of data.periods) {
        assert.equal(period.regions.length, 8, 'period ' + period.month);
        const regionGain = period.regions.reduce((sum, region) => sum + region.gain, 0);
        const regionLoss = period.regions.reduce((sum, region) => sum + region.loss, 0);
        assert.ok(regionGain <= period.gain + 0.05, 'gain ' + period.month);
        assert.ok(regionLoss <= period.loss + 0.05, 'loss ' + period.month);
    }
});

test('stats.json: группы областей покрывают области', () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'stats/stats.json'), 'utf8'));
    const groups = data.regionGroups || [];
    assert.equal(groups.length, 2, 'ожидаются две группы');
    const groupedRegions = groups.flatMap(group => group.regions).sort();
    assert.deepEqual(groupedRegions, data.regions.map(region => region.id).sort(),
        'каждая область ровно в одной группе');
    assert.equal(groups.filter(group => group.total).length, 1, 'итог в процентах только у одной группы');
    groups.forEach(group => {
        assert.ok(Array.isArray(group.colors) && group.colors.length >= group.regions.length,
            'у группы ' + group.id + ' хватает цветов');
        assert.equal(group.colors[0], group.color, 'цвет группы совпадает с базовым оттенком');
    });
});

test('ось времени: шаг сохраняется, последняя точка подписана', () => {
    const labels = [];
    for (let i = 0; i < 38; i++) labels.push('м' + i);
    labels[37] = 'ноя 26';
    const ticks = [];
    for (let i = 0; i <= 36; i += 3) ticks.push({ value: i, label: labels[i] });
    const anchored = ChartAxis.anchoredTicks(ticks, 37, labels);
    assert.equal(anchored.length, ticks.length);
    assert.equal(anchored.at(-1).value, 37);
    assert.equal(anchored.at(-1).label, 'ноя 26');
    for (let i = 1; i < anchored.length; i++) assert.equal(anchored[i].value - anchored[i - 1].value, 3);
    assert.equal(ChartAxis.anchoredTicks(ticks, 36, labels), ticks);
    assert.equal(ChartAxis.anchoredTicks([{ value: 0 }], 3, labels).length, 1);
    assert.equal(ChartAxis.anchoredTicks(ticks, 37, null).at(-1).label, '37');
});

test('stats.json начинается с октября 2023', () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'stats/stats.json'), 'utf8'));
    assert.equal(data.source.minDate, '2023-10-01');
    assert.equal(data.periods[0].month, '2023-10');
    assert.ok(data.periods.every(period => period.month >= '2023-10'));
});

console.log('\nВсе проверки пройдены.');
