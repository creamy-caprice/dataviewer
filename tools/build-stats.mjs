#!/usr/bin/env node
/*
 * Пересчитывает статистику по ControlZones и пишет stats/stats.json.
 *
 * Запуск:
 *   node tools/build-stats.mjs
 *   node tools/build-stats.mjs --threshold 0 --min-date 2023-10-01
 *
 * Скрипт читает только месячные срезы (ближайшие к 1-му числу) и последний
 * срез для текущего месяца. Полные KML-файлы в память целиком не копятся.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const StatsEngine = require(path.join(ROOT, 'stats/stats-engine.js'));
const clip = require(path.join(ROOT, 'js/vendor/polygon-clipping.umd.min.js'));

function arg(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index === -1 || index + 1 >= process.argv.length) return fallback;
    return process.argv[index + 1];
}

const controlDir = path.join(ROOT, 'kml/ControlZones');
const outputPath = path.resolve(ROOT, arg('--out', 'stats/stats.json'));
const thresholdKm2 = Number(arg('--threshold', '0'));
const minDate = arg('--min-date', '2023-10-01');
const includePartial = !process.argv.includes('--no-partial');
const directionsPath = path.resolve(ROOT, arg('--directions', 'kml/PermanentObjects/Directions.kml'));
const regionsPath = path.resolve(ROOT, arg('--regions', 'kml/PermanentObjects/Области.kml'));
const exclusionsPath = path.resolve(ROOT, arg('--exclude', 'kml/PermanentObjects/Exclusions'));
const waterPath = path.resolve(ROOT, arg('--water', 'kml/PermanentObjects/Exclusions/Seas.kml'));

// Имена областей в KML -> устойчивые id для stats.json и страницы.
const REGION_IDS = {
    'ЛНР': 'lnr',
    'ДНР': 'dnr',
    'Запорожская область': 'zaporizhzhia',
    'Херсонская область': 'kherson',
    'Сумская область': 'sumy',
    'Харьковская область': 'kharkiv',
    'Днепропетровская область': 'dnipropetrovsk',
    'Черниговская область': 'chernihiv'
};

// Группы областей: строки таблицы областей на странице статистики и цвета
// границ на карте. Направления и группировки не делятся по группам.
// colors — оттенки границ и линий областей по порядку области в группе.
// total: true — в таблице областей выводится итоговая взвешенная доля группы.
const REGION_GROUPS = [
    {
        id: 'g1',
        name: 'Конституционные',
        nameEn: 'Constitutional',
        color: '#c81e0f',
        colors: ['#c81e0f', '#a4161a', '#e5383b', '#7f1010'],
        total: true,
        regions: ['lnr', 'dnr', 'zaporizhzhia', 'kherson']
    },
    {
        id: 'g2',
        name: 'Зоны безопасности',
        nameEn: 'Security zones',
        color: '#2f63b8',
        colors: ['#2f63b8', '#1d4e89', '#3a86ff', '#4a6fa5'],
        total: false,
        regions: ['kharkiv', 'sumy', 'dnipropetrovsk', 'chernihiv']
    }
];

function fail(message) {
    console.error('Ошибка: ' + message);
    process.exit(1);
}

// Предупреждает, если группа забыла область или id повторяется:
// такая область не попадёт в сгруппированную таблицу.
function checkGroups(stats) {
    const seen = new Map();
    for (const group of REGION_GROUPS) {
        for (const id of group.regions || []) {
            if (seen.has(id)) console.warn('Область ' + id + ' в двух группах: ' + seen.get(id) + ', ' + group.id);
            seen.set(id, group.id);
        }
    }
    for (const region of stats.regions || []) {
        if (!seen.has(region.id)) console.warn('Область ' + region.id + ' не входит ни в одну группу');
    }
    console.log('\nГруппы областей: ' + REGION_GROUPS.map(group =>
        group.id + ' (' + (group.regions || []).length + ' обл.)'
    ).join(', '));
}

if (!fs.existsSync(controlDir)) fail('не найдена папка ' + controlDir);
if (!Number.isFinite(thresholdKm2) || thresholdKm2 < 0) fail('неверный --threshold');

const snapshots = fs.readdirSync(controlDir)
    .map(StatsEngine.snapshotInfo)
    .filter(Boolean)
    .filter(snapshot => snapshot.iso >= minDate)
    .sort((a, b) => a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0);

if (!snapshots.length) fail('в ' + controlDir + ' нет срезов Control_YY_MM_DD.kml после ' + minDate);

const boundaries = StatsEngine.selectMonthlySnapshots(snapshots);
const needed = new Map();
for (const snapshot of boundaries) needed.set(snapshot.name, snapshot);
if (includePartial) needed.set(snapshots[snapshots.length - 1].name, snapshots[snapshots.length - 1]);

const rings = {};
const started = Date.now();
let loaded = 0;
for (const snapshot of needed.values()) {
    const filePath = path.join(controlDir, snapshot.name);
    if (!fs.existsSync(filePath)) {
        console.warn('Нет файла ' + snapshot.name + ' — период будет пропущен');
        continue;
    }
    const ring = StatsEngine.parseControlKml(fs.readFileSync(filePath, 'utf8'));
    if (!ring) {
        console.warn('Не удалось разобрать ' + snapshot.name);
        continue;
    }
    rings[snapshot.name] = ring;
    loaded += 1;
    process.stdout.write('\rЧитаю срезы: ' + loaded + '/' + needed.size);
}
if (loaded) process.stdout.write('\n');

let directions = [];
if (fs.existsSync(directionsPath)) {
    directions = StatsEngine.parseKmlPolygons(fs.readFileSync(directionsPath, 'utf8'));
    console.log('\nНаправлений: ' + directions.length + ' (' + path.relative(ROOT, directionsPath) + ')');
} else {
    console.warn('Нет файла границ направлений: ' + directionsPath + ' — считаю только общий итог');
}

let regions = [];
if (fs.existsSync(regionsPath)) {
    const parsed = StatsEngine.parseKmlRings(fs.readFileSync(regionsPath, 'utf8'));
    regions = parsed.map(item => {
        const id = REGION_IDS[item.name];
        if (!id) {
            console.warn('\nНеизвестная область в KML: ' + item.name + ' — пропущена');
            return null;
        }
        return { id, name: item.name, polygon: item.polygon };
    }).filter(Boolean);
    console.log('\nОбластей: ' + regions.length + ' (' + path.relative(ROOT, regionsPath) + ')');
} else {
    console.warn('\nНет файла границ областей: ' + regionsPath + ' — раздел областей не будет заполнен');
}

// Акватория (Чёрное и Азовское моря): доля области считается от площади суши,
// вода вычитается и из числителя, и из знаменателя.
let regionsWater = [];
if (fs.existsSync(waterPath)) {
    regionsWater = StatsEngine.parseKmlPolygons(fs.readFileSync(waterPath, 'utf8'))
        .map(item => item.polygon);
    const waterArea = regionsWater.reduce((sum, ring) => sum + StatsEngine.ringAreaKm2(ring), 0);
    console.log('\nАкватория в долях областей: ' + regionsWater.length + ' полигон(ов), '
        + waterArea.toFixed(0) + ' км² (' + path.relative(ROOT, waterPath) + ')');
} else {
    console.warn('\nНет файла акватории: ' + waterPath + ' — доли областей считаются с водой');
}

let excludeGeometry = [];let excludeInfo = [];
let exclusionFiles = [];
if (fs.existsSync(exclusionsPath)) {
    const stat = fs.statSync(exclusionsPath);
    if (stat.isDirectory()) {
        exclusionFiles = fs.readdirSync(exclusionsPath)
            .filter(name => name.toLowerCase().endsWith('.kml'))
            .sort()
            .map(name => path.join(exclusionsPath, name));
    } else if (stat.isFile()) {
        exclusionFiles = [exclusionsPath];
    }
}
if (exclusionFiles.length) {
    const parsed = [];
    for (const file of exclusionFiles) {
        const items = StatsEngine.parseKmlPolygons(fs.readFileSync(file, 'utf8'));
        for (const item of items) {
            parsed.push({ item, file });
        }
    }
    excludeGeometry = parsed.map(({ item }) => item.polygon);
    excludeInfo = parsed.map(({ item, file }, index) => ({
        id: item.id || ('exclusion-' + (index + 1)),
        name: item.name || path.basename(file, '.kml'),
        areaKm2: StatsEngine.round2(StatsEngine.ringAreaKm2(item.polygon))
    }));
    console.log('\nИсключено из расчёта: ' + excludeInfo.map(item => item.name + ' (' + item.areaKm2 + ' км²)').join(', '));
} else {
    console.warn('Нет файлов исключений в ' + exclusionsPath + ' — считаю без исключений');
}

const result = StatsEngine.buildStats(snapshots, rings, clip, {
    thresholdKm2,
    minDate,
    includePartial,
    directions,
    directionsVersion: '1',
    directionsNote: 'Границы направлений: области и секторы; компонент относится к направлению по центроиду.',
    regions,
    regionsVersion: '1',
    regionsNote: 'Границы областей: замкнутые контуры; доля контроля — от площади суши (акватория вычтена), изменения — пересечение дельт с областью.',
    regionsWater,
    excludeGeometry,
    excludeAreas: excludeInfo,
    generator: 'tools/build-stats.mjs',
    generatedAt: new Date().toISOString()
});

result.regionGroups = REGION_GROUPS;
checkGroups(result);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');

const fmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
console.log('');
console.log('Периодов: ' + result.periods.length + ', срезов: ' + result.snapshotCount
    + ', ' + result.firstSnapshot + ' → ' + result.lastSnapshot);
console.log('Итого: +' + fmt.format(result.totals.gain) + ' / −' + fmt.format(result.totals.loss)
    + ' = ' + (result.totals.net >= 0 ? '+' : '−') + fmt.format(Math.abs(result.totals.net)) + ' км²');
console.log('');
for (const period of result.periods.slice(-6)) {
    const tag = period.partial ? ' (текущий)' : '';
    console.log('  ' + period.month + tag + ': +' + fmt.format(period.gain)
        + ' / −' + fmt.format(period.loss) + ' = ' + (period.net >= 0 ? '+' : '−')
        + fmt.format(Math.abs(period.net)) + ' км², ' + period.days + ' дн.');
}
if (result.directions.length) {
    console.log('');
    console.log('По направлениям, полные месяцы:');
    for (const direction of result.directions) {
        const totals = direction.fullTotals;
        console.log('  ' + direction.name + ': +' + fmt.format(totals.gain)
            + ' / −' + fmt.format(totals.loss) + ' = ' + (totals.net >= 0 ? '+' : '−')
            + fmt.format(Math.abs(totals.net)) + ' км²');
    }
    if (result.unassigned) {
        const u = result.unassigned.fullTotals;
        console.log('  [вне направлений]: +' + fmt.format(u.gain)
            + ' / −' + fmt.format(u.loss) + ' = ' + (u.net >= 0 ? '+' : '−')
            + fmt.format(Math.abs(u.net)) + ' км²');
    }
}
if (result.regions.length) {
    console.log('');
    console.log('По областям (контроль на последний срез):');
    for (const region of result.regions) {
        const last = region.periods[region.periods.length - 1];
        const totals = region.fullTotals;
        console.log('  ' + region.name + ': контроль ' + (last ? last.share : '—') + '%, +'
            + fmt.format(totals.gain) + ' / −' + fmt.format(totals.loss) + ' = '
            + (totals.net >= 0 ? '+' : '−') + fmt.format(Math.abs(totals.net)) + ' км²');
    }
}
if (result.warnings.length) {
    console.log('');
    for (const warning of result.warnings) console.warn('! ' + warning);
}
console.log('');
console.log('Записано: ' + path.relative(ROOT, outputPath) + ' (' + (Date.now() - started) + ' мс)');
