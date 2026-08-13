// Canvas-слой точек (миграция с L.marker). Подключается ПОСЛЕ js/map.js, ДО js/filters.js и js/script.js.
// Источник данных: window.pointsModel = { points, equipment, attacks }.
// Каждая точка — модель без DOM: { id, layerType, category, iconKey, lat, lng, date, name,
//   formattedName, coordsString, popupHtml, extendedData, visible }
(function () {
    'use strict';

    // Кэш иконок: каждая иконка рисуется в offscreen canvas один раз
    const IconSpriteCache = {
        cache: {},        // iconKey -> { canvas, w, h }
        loading: {},      // защита от дублей загрузки
        _listeners: [],

        get(iconKey) {
            return this.cache[iconKey] || null;
        },

        onChange(fn) {
            this._listeners.push(fn);
        },

        _notify() {
            for (let i = 0; i < this._listeners.length; i++) {
                try { this._listeners[i](); } catch (e) { /* ignore */ }
            }
        },

        _store(key, img, w, h) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            if (img) {
                ctx.drawImage(img, 0, 0, w, h);
            }
            this.cache[key] = { canvas: c, w, h };
            this._notify();
        },

        preload(entries) {
            if (!entries || !entries.length) return;
            for (let i = 0; i < entries.length; i++) {
                const { key, url, w, h } = entries[i];
                if (this.cache[key] || this.loading[key]) continue;
                this.loading[key] = true;
                const img = new Image();
                img.onload = () => { this._store(key, img, w, h); };
                img.onerror = () => { this._store(key, null, w, h); };
                img.src = url;
            }
        }
    };

    // Точное соответствие CSS-переходу Leaflet: cubic-bezier(0, 0, 0.25, 1)
    function easeZoom(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        // x(t) = 0.75t^2 + 0.25t^3, y(t) = 3t^2 - 2t^3 (контр. точки 0,0 / 0,0 / 0.25,1 / 1,1)
        let u = t;
        for (let i = 0; i < 8; i++) {
            const x = 0.75 * u * u + 0.25 * u * u * u;
            const dx = 1.5 * u + 0.75 * u * u;
            const err = x - t;
            if (Math.abs(err) < 1e-6) break;
            u -= err / dx;
        }
        return 3 * u * u - 2 * u * u * u;
    }

    // Сборка списка иконок из window.ICON_MAPS (js/data.js)
    function collectIconEntries() {
        const entries = [];
        const maps = window.ICON_MAPS || {};
        const sizes = window.ICON_SIZES || {};
        const types = ['points', 'equipment', 'attacks'];
        for (let t = 0; t < types.length; t++) {
            const type = types[t];
            const map = maps[type] || {};
            const size = sizes[type] || [28, 28];
            for (const key in map) {
                entries.push({ key, url: map[key], w: size[0], h: size[1] });
            }
        }
        return entries;
    }

    const CanvasPointsLayer = L.Layer.extend({
        options: {
            pane: 'pointsPane',
            hitRadius: 10,
            maxDrawPoints: 20000,
            minDrawZoom: 1,
            margin: 24
        },

        initialize(options) {
            L.Util.setOptions(this, options);
            this._dirty = false;
            this._rafId = null;
            this._canvas = null;
            this._ctx = null;
            this._pointsOn = true;
            this._drawingActive = false;
            this._highlightId = null;
            this._center = null; // вид на момент последней полной отрисовки (для zoom-анимации)
            this._zoom = null;
            this._zoomAnim = null; // состояние по-кадровой zoom-анимации
        },

        onAdd(map) {
            this._map = map;

            let pane = map.getPane(this.options.pane);
            if (!pane) {
                pane = map.createPane(this.options.pane);
                pane.style.zIndex = '500'; // над overlayPane(400), под markerPane(600)
            }

            this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-points');
            this._canvas.style.pointerEvents = 'none'; // клики обрабатываем на карте
            pane.appendChild(this._canvas);
            this._ctx = this._canvas.getContext('2d');

            this._center = map.getCenter();
            this._zoom = map.getZoom();

            // Канвас прижат к вьюпорту (_positionCanvas компенсирует трансляцию панели),
            // точки рисуем в container-координатах (latLngToContainerPoint), перерисовка
            // на move/zoom — точки следуют за картой, без обрезки по границе канваса.
            // zoomanim: по-кадровая перерисовка с интерполяцией zoom/центра (плавный размер и позиции).
            this._handlers = {
                move: () => this._scheduleRedraw(),
                moveend: () => this._redraw(),
                zoom: () => this._scheduleRedraw(),
                zoomanim: (e) => this._onZoomAnim(e),
                zoomend: () => this._redraw(),
                viewreset: () => this._redraw(),
                resize: () => this._redraw()
            };
            for (const ev in this._handlers) {
                map.on(ev, this._handlers[ev], this);
            }

            map.on('click', this._onMapClick, this);

            IconSpriteCache.onChange(() => this._scheduleRedraw());
            IconSpriteCache.preload(collectIconEntries());

            this._redraw();
        },

        onRemove(map) {
            for (const ev in this._handlers) {
                map.off(ev, this._handlers[ev], this);
            }
            map.off('click', this._onMapClick, this);
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
            if (this._zoomAnim && this._zoomAnim.rafId) {
                cancelAnimationFrame(this._zoomAnim.rafId);
                this._zoomAnim = null;
            }
            if (this._canvas) {
                L.DomUtil.remove(this._canvas);
                this._canvas = null;
            }
            this._map = null;
        },

        // ===== API =====

        addPoints(points, layerType) {
            if (!Array.isArray(points)) return this;
            if (!window.pointsModel[layerType]) window.pointsModel[layerType] = [];
            window.pointsModel[layerType].push.apply(window.pointsModel[layerType], points);
            this.applyFilter();
            return this;
        },

        setLayerTypeVisible(layerType, visible) {
            if (layerType === 'equipment') {
                window.isMilEquipVisible = visible;
            } else if (layerType === 'attacks') {
                window.isAttacksVisible = visible;
            } else {
                this._pointsOn = visible;
            }
            this.applyFilter();
            return this;
        },

        setDateRange(start, end) {
            window.pointsDateRange = window.pointsDateRange || { start: null, end: null };
            window.pointsDateRange.start = start;
            window.pointsDateRange.end = end;
            this.applyFilter();
            return this;
        },

        // Пересчёт visible по текущему глобальному состоянию фильтров
        applyFilter() {
            const eqSel = window.selectedEquipmentCategories;
            const atkSel = window.selectedAttacksCategories;
            const groupMap = (typeof window.categoryToGroupTag !== 'undefined') ? window.categoryToGroupTag : null;

            const types = ['points', 'equipment', 'attacks'];
            for (let t = 0; t < types.length; t++) {
                const type = types[t];
                const arr = window.pointsModel[type] || [];
                const layerOn = type === 'points' ? this._pointsOn
                             : type === 'equipment' ? !!window.isMilEquipVisible
                             : !!window.isAttacksVisible;

                for (let i = 0; i < arr.length; i++) {
                    const p = arr[i];
                    if (!layerOn) {
                        p.visible = false;
                        continue;
                    }
                    if (type === 'equipment') {
                        p.visible = (eqSel === null || eqSel === undefined) || eqSel.indexOf(p.category) !== -1;
                    } else if (type === 'attacks') {
                        if (atkSel === null || atkSel === undefined) {
                            p.visible = true;
                        } else {
                            const groupTag = groupMap ? groupMap[p.category] : null;
                            p.visible = !!groupTag && atkSel.indexOf(groupTag) !== -1;
                        }
                    } else {
                        p.visible = this._dateAllowed(p);
                    }
                }
            }
            this._scheduleRedraw();
            return this;
        },

        invalidate() {
            this._scheduleRedraw();
            return this;
        },

        highlightPoint(id) {
            this._highlightId = id || null;
            this._scheduleRedraw();
            return this;
        },

        getVisibleCount() {
            let count = 0;
            const types = ['points', 'equipment', 'attacks'];
            for (let t = 0; t < types.length; t++) {
                const arr = window.pointsModel[types[t]] || [];
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].visible) count++;
                }
            }
            return count;
        },

        findPointByName(query) {
            if (!query) return null;
            const q = String(query).toLowerCase();
            const types = ['points', 'equipment', 'attacks'];
            for (let t = 0; t < types.length; t++) {
                const arr = window.pointsModel[types[t]] || [];
                for (let i = 0; i < arr.length; i++) {
                    const p = arr[i];
                    if (p.name && String(p.name).toLowerCase().indexOf(q) !== -1) return p;
                }
            }
            return null;
        },

        // Hit-test в container-координатах (совпадает с отрисовкой); возвращает модель или null
        getPointAt(containerPoint) {
            const map = this._map;
            if (!map) return null;
            const r = this.options.hitRadius;
            // Обратный порядок: точки рисуются последними (сверху) -> приоритет
            const types = ['points', 'equipment', 'attacks'];
            for (let t = 0; t < types.length; t++) {
                const arr = window.pointsModel[types[t]] || [];
                for (let i = arr.length - 1; i >= 0; i--) {
                    const p = arr[i];
                    if (!p.visible) continue;
                    const pt = map.latLngToContainerPoint([p.lat, p.lng]);
                    if (Math.abs(pt.x - containerPoint.x) <= r && Math.abs(pt.y - containerPoint.y) <= r) {
                        return p;
                    }
                }
            }
            return null;
        },

        // ===== Реализация =====

        _dateAllowed(p) {
            if (!p.date) return true;
            const r = window.pointsDateRange;
            if (!r || !r.start || !r.end) return true;
            if (typeof isDateInRange !== 'function') return true;
            return isDateInRange(p.date, r.start, r.end);
        },

        _scheduleRedraw() {
            if (this._rafId) return;
            this._rafId = requestAnimationFrame(() => {
                this._rafId = null;
                this._redraw();
            });
        },

        _redraw() {
            const map = this._map;
            if (!map || !this._canvas || !this._ctx) return;
            // Во время zoom-анимации кадр масштабируется transform'ом (_onZoomAnim),
            // полная перерисовка только на zoomend/viewreset
            if (map._animatingZoom) return;

            const size = map.getSize();
            const dpr = window.devicePixelRatio || 1;
            const w = Math.max(1, Math.round(size.x * dpr));
            const h = Math.max(1, Math.round(size.y * dpr));
            if (this._canvas.width !== w || this._canvas.height !== h) {
                this._canvas.width = w;
                this._canvas.height = h;
            }
            // CSS-размер в пикселях карты (без dpr), чтобы canvas не растягивался
            this._canvas.style.width = size.x + 'px';
            this._canvas.style.height = size.y + 'px';

            // Прижимаем канвас к вьюпорту: компенсируем трансляцию панели (panePos),
            // чтобы рисуемые container-координаты не обрезались границей канваса
            this._positionCanvas();

            const ctx = this._ctx;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size.x, size.y);

            this._drawFrame(ctx, size);

            if (this._highlightId) {
                this._drawHighlight(ctx, size);
            }

            this._center = map.getCenter();
            this._zoom = map.getZoom();
        },

        _positionCanvas() {
            const map = this._map;
            if (!map || !this._canvas) return;
            // Позиция канваса = сдвиг, обратный трансляции панели:
            // containerPointToLayerPoint([0,0]) = -panePos, канвас сеткой оказывается у (0,0) контейнера
            L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]));
        },

        // Zoom-анимация (по-кадровая): интерполируем zoom/центр и перерисовываем
        // каждый кадр в container-координатах с постоянным размером иконок —
        // плавно меняются и позиции, и размер (без скачка после zoomend).
        _onZoomAnim(e) {
            const map = this._map;
            if (!map || !this._canvas) return;
            if (this._zoom === null) {
                this._center = map.getCenter();
                this._zoom = map.getZoom();
            }
            const za = this._zoomAnim;
            if (za && za.rafId) cancelAnimationFrame(za.rafId);
            if (za) {
                // пинч: обновляем цель, не перезапуская тайминг
                za.z1 = e.zoom;
                za.c1p = map.project(e.center, e.zoom);
            } else {
                this._zoomAnim = {
                    z0: this._zoom,
                    c0p: map.project(this._center, this._zoom),
                    z1: e.zoom,
                    c1p: map.project(e.center, e.zoom),
                    startTs: performance.now(),
                    rafId: null
                };
            }
            this._zoomAnimStep();
        },

        // Воспроизводим ровно тот же аффинный переход, что Leaflet применяет к тайлам:
        // p' = (1-e)*p + e*(s*p + offset) — scale интерполируется ЛИНЕЙНО по e.
        // Позиция точки = factor*project(L,z0) + base,
        // factor = 1-e+e*s, base = viewHalf - (1-e)*project(c0,z0) - e*project(c1,z1).
        _zoomAnimStep() {
            const za = this._zoomAnim;
            const map = this._map;
            if (!za || !map || !this._canvas) { this._zoomAnim = null; return; }
            const duration = (map.options.zoomAnimationDuration || 0.25) * 1000;
            const t = Math.min(1, (performance.now() - za.startTs) / duration);
            const e = easeZoom(t);
            const s = map.getZoomScale(za.z1, za.z0);
            const factor = 1 - e + e * s;
            this._drawAnimFrame({
                z0: za.z0,
                c0p: za.c0p,
                c1p: za.c1p,
                e: e,
                factor: factor,
                invFactor: 1 / factor
            });
            if (t < 1 && map._animatingZoom) {
                za.rafId = requestAnimationFrame(() => this._zoomAnimStep());
            } else {
                this._zoomAnim = null;
                this._redraw();
            }
        },

        // Отрисовка кадра zoom-анимации в container-координатах (канвас прижат к вьюпорту)
        _drawAnimFrame(view) {
            const map = this._map;
            if (!map || !this._canvas || !this._ctx) return;
            const size = map.getSize();
            const dpr = window.devicePixelRatio || 1;
            const w = Math.max(1, Math.round(size.x * dpr));
            const h = Math.max(1, Math.round(size.y * dpr));
            if (this._canvas.width !== w || this._canvas.height !== h) {
                this._canvas.width = w;
                this._canvas.height = h;
            }
            this._canvas.style.width = size.x + 'px';
            this._canvas.style.height = size.y + 'px';
            this._positionCanvas();
            const ctx = this._ctx;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size.x, size.y);
            this._drawFrame(ctx, size, view);
        },

        _drawFrame(ctx, size, view) {
            const map = this._map;
            if (!map) return;
            if ((view ? view.zoom : map.getZoom()) < this.options.minDrawZoom) return;

            const M = this.options.margin;
            let drawn = 0;

            // Гео-границы и проекция точки: обычный кадр — по текущему виду карты,
            // при zoom-анимации — по интерполированным zoom/центру
            let bounds, toPt;
            if (view) {
                const viewHalf = size.multiplyBy(0.5);
                const base = viewHalf.subtract(view.c0p.multiplyBy(1 - view.e)).subtract(view.c1p.multiplyBy(view.e));
                bounds = L.latLngBounds([
                    map.unproject(base.multiplyBy(-view.invFactor), view.z0),
                    map.unproject(size.subtract(base).multiplyBy(view.invFactor), view.z0)
                ]);
                toPt = (p) => map.project([p.lat, p.lng], view.z0).multiplyBy(view.factor).add(base);
            } else {
                bounds = map.getBounds().pad(0.15);
                toPt = (p) => map.latLngToContainerPoint([p.lat, p.lng]);
            }

            // Порядок: attacks -> equipment -> points (точки сверху)
            const types = ['attacks', 'equipment', 'points'];
            for (let t = 0; t < types.length; t++) {
                const arr = window.pointsModel[types[t]] || [];
                for (let i = 0; i < arr.length; i++) {
                    const p = arr[i];
                    if (!p.visible) continue;

                    // Culling по гео-границам
                    if (p.lat < bounds.getSouth() || p.lat > bounds.getNorth() ||
                        p.lng < bounds.getWest() || p.lng > bounds.getEast()) {
                        continue;
                    }
                    // Рисуем в container-координатах (канвас прижат к вьюпорту)
                    const pt = toPt(p);
                    if (pt.x < -M || pt.y < -M || pt.x > size.x + M || pt.y > size.y + M) continue;

                    const icon = IconSpriteCache.get(p.iconKey);
                    if (!icon) continue;

                    ctx.drawImage(icon.canvas, pt.x - icon.w / 2, pt.y - icon.h / 2, icon.w, icon.h);

                    if (++drawn >= this.options.maxDrawPoints) return;
                }
            }
        },

        _drawHighlight(ctx, size) {
            const map = this._map;
            const p = this._findById(this._highlightId);
            if (!p) return;
            const pt = map.latLngToContainerPoint([p.lat, p.lng]);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        },

        _findById(id) {
            const types = ['points', 'equipment', 'attacks'];
            for (let t = 0; t < types.length; t++) {
                const arr = window.pointsModel[types[t]] || [];
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === id) return arr[i];
                }
            }
            return null;
        },

        _onMapClick(e) {
            if (this._drawingActive) return;

            // Рисование/ластик активны — точки не перехватывают клик
            const dp = window.drawPanel;
            if (dp && (dp.isDrawing || dp.currentTool === 'icon' || dp.isEraserActive)) return;

            const containerPoint = e.containerPoint || (this._map && this._map.latLngToContainerPoint(e.latlng));
            if (!containerPoint) return;
            const p = this.getPointAt(containerPoint);
            if (!p) return;

            L.popup()
                .setLatLng([p.lat, p.lng])
                .setContent(p.popupHtml || '')
                .openOn(this._map);
        }
    });

    window.CanvasPointsLayer = CanvasPointsLayer;
    window.IconSpriteCache = IconSpriteCache;
})();
