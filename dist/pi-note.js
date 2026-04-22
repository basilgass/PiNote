import { Fragment as e, Transition as t, computed as n, createBlock as r, createCommentVNode as i, createElementBlock as a, createElementVNode as o, createVNode as s, defineComponent as c, effectScope as l, getCurrentInstance as u, getCurrentScope as d, hasInjectionContext as f, inject as p, isReactive as m, isRef as h, markRaw as g, mergeModels as _, nextTick as v, normalizeClass as y, normalizeStyle as b, onMounted as x, onScopeDispose as S, onUnmounted as C, openBlock as w, reactive as T, ref as E, renderList as D, shallowReactive as O, shallowRef as k, toDisplayString as A, toRaw as j, toRef as M, toRefs as N, unref as P, useModel as F, useTemplateRef as I, vModelText as L, vShow as R, watch as z, watchEffect as ee, withCtx as te, withDirectives as B, withKeys as ne, withModifiers as V } from "vue";
//#region src/core/Layer.ts
var re = class {
	name;
	canvas;
	ctx;
	_visible = !0;
	_opacity = 1;
	_locked = !1;
	_blendMode = "source-over";
	constructor(e, t) {
		this.name = t.name;
		let n = document.createElement("canvas");
		n.dataset.layer = this.name, n.width = e.clientWidth, n.height = e.clientHeight, n.style.position = "absolute", n.style.top = "0", n.style.left = "0", n.style.zIndex = t.zIndex.toString(), n.style.pointerEvents = "none", n.style.backgroundColor = this.name === "BACKGROUND" ? "white" : "transparent", e.appendChild(n), this.canvas = n, this.ctx = n.getContext("2d"), this.resize(e);
	}
	resize(e) {
		let t = window.devicePixelRatio || 1, n = e.offsetWidth, r = e.offsetHeight;
		this.canvas.width = n * t, this.canvas.height = r * t, this.canvas.style.width = n + "px", this.canvas.style.height = r + "px", this.ctx.scale(t, t);
	}
	set visible(e) {
		this._visible = e, this.canvas.style.display = e ? "block" : "none";
	}
	get visible() {
		return this._visible;
	}
	set opacity(e) {
		this._opacity = Math.max(0, Math.min(1, e)), this.canvas.style.opacity = this._opacity.toString();
	}
	get opacity() {
		return this._opacity;
	}
	set locked(e) {
		this._locked = e;
	}
	get locked() {
		return this._locked;
	}
	set blendMode(e) {
		this._blendMode = e, this.canvas.style.mixBlendMode = e;
	}
	get blendMode() {
		return this._blendMode;
	}
	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	exportPNG() {
		return this.canvas.toDataURL("image/png");
	}
}, ie = class {
	grid = /* @__PURE__ */ new Map();
	cellSize;
	constructor(e = 100) {
		this.cellSize = e;
	}
	cellKey(e, t) {
		return `${Math.floor(e / this.cellSize)},${Math.floor(t / this.cellSize)}`;
	}
	insertSnapPoint(e) {
		let t = this.cellKey(e.x, e.y);
		this.grid.has(t) || this.grid.set(t, {
			snapPoints: [],
			segments: [],
			circles: []
		}), this.grid.get(t).snapPoints.push(e);
	}
	insertSegment(e) {
		let t = Math.min(e.a.x, e.b.x), n = Math.max(e.a.x, e.b.x), r = Math.min(e.a.y, e.b.y), i = Math.max(e.a.y, e.b.y), a = Math.floor(t / this.cellSize), o = Math.floor(n / this.cellSize), s = Math.floor(r / this.cellSize), c = Math.floor(i / this.cellSize);
		for (let t = a; t <= o; t++) for (let n = s; n <= c; n++) {
			let r = `${t},${n}`;
			this.grid.has(r) || this.grid.set(r, {
				snapPoints: [],
				segments: [],
				circles: []
			}), this.grid.get(r).segments.push(e);
		}
	}
	insertCircle(e) {
		let t = this.cellKey(e.center.x, e.center.y);
		this.grid.has(t) || this.grid.set(t, {
			snapPoints: [],
			segments: [],
			circles: []
		}), this.grid.get(t).circles.push(e);
	}
	query(e, t) {
		let n = this.cellKey(e, t), r = this.grid.get(n);
		return {
			snapPoints: r?.snapPoints ?? [],
			segments: r?.segments ?? [],
			circles: r?.circles ?? []
		};
	}
	clear() {
		this.grid.clear();
	}
}, ae = class {
	_name = "grid";
	_enabled;
	gridSize;
	_priority;
	constructor(e) {
		this._enabled = e.enabled ?? !0, this.gridSize = e.gridSize, this._priority = e.priority ?? 10;
	}
	snap(e) {
		return this._enabled ? {
			x: Math.round(e.x / this.gridSize) * this.gridSize,
			y: Math.round(e.y / this.gridSize) * this.gridSize,
			priority: this._priority,
			type: "point"
		} : null;
	}
	get name() {
		return this._name;
	}
	get enabled() {
		return this._enabled;
	}
	set enabled(e) {
		this._enabled = e;
	}
	get priority() {
		return this._priority;
	}
	set priority(e) {
		this._priority = e;
	}
}, oe = class {
	name = "midpoint";
	enabled = !0;
	priority;
	constructor(e = 5) {
		this.priority = e;
	}
	snap(e) {
		let t = e.snapRadius, n = null, r = null, { segments: i } = e.index.query(e.x, e.y);
		for (let a of i) {
			if (e.activeLayer && a.layer !== e.activeLayer) continue;
			let i = (a.a.x + a.b.x) / 2, o = (a.a.y + a.b.y) / 2, s = e.x - i, c = e.y - o, l = Math.hypot(s, c);
			l <= t && (t = l, n = i, r = o);
		}
		return n !== null && r !== null ? {
			x: n,
			y: r,
			priority: this.priority,
			type: "midpoint"
		} : null;
	}
}, se = class {
	name = "point";
	enabled = !0;
	priority;
	constructor(e = 20) {
		this.priority = e;
	}
	snap(e) {
		let { x: t, y: n, snapRadius: r, index: i, activeLayer: a } = e, o = r, s = null, c = null, { snapPoints: l } = i.query(t, n);
		for (let e of l) {
			if (a && e.layer !== a) continue;
			let r = t - e.x, i = n - e.y, l = Math.hypot(r, i);
			l <= o && (o = l, s = e.x, c = e.y);
		}
		return s !== null && c !== null ? {
			x: s,
			y: c,
			priority: this.priority,
			type: "point"
		} : null;
	}
}, ce = class {
	strategies = [];
	index = new ie(100);
	_snapRadius;
	constructor(e) {
		this._snapRadius = e?.snapRadius ?? 10, this.addStrategies([
			new ae({
				gridSize: e?.gridSize ?? 30,
				priority: 10
			}),
			new oe(),
			new se()
		]);
	}
	addStrategies(e) {
		e.forEach((e) => this.strategies.push(e)), this.strategies.sort((e, t) => t.priority - e.priority);
	}
	setStrategyEnabled(e, t) {
		let n = this.strategies.find((t) => t.name === e);
		n && (n.enabled = t);
	}
	buildIndex(e) {
		this.index.clear();
		for (let t of e) t.getSnapPoints().forEach((e) => this.index.insertSnapPoint(e)), t.getSegments().forEach((e) => this.index.insertSegment(e)), t.getCircles().forEach((e) => this.index.insertCircle(e));
	}
	get snapRadius() {
		return this._snapRadius;
	}
	set snapRadius(e) {
		this._snapRadius = e;
	}
	snap(e, t, n, r) {
		this.buildIndex(n);
		let i = {
			x: e,
			y: t,
			shapes: n,
			index: this.index,
			snapRadius: this._snapRadius,
			activeLayer: r
		}, a = null;
		for (let e of this.strategies) {
			if (!e.enabled) continue;
			let t = e.snap(i);
			t && (!a || (t.priority ?? 0) > (a.priority ?? 0)) && (a = t);
		}
		return a;
	}
	clear() {
		this.strategies = [], this.index.clear();
	}
	setGridSize(e) {
		let t = this.strategies.find((e) => e.name === "grid");
		t && (t.gridSize = e);
	}
};
//#endregion
//#region src/snap/snap.worker.ts?worker
function le(e) {
	return new Worker("/assets/snap.worker-DmTDuzap.js", { name: e?.name });
}
//#endregion
//#region src/snap/SnapWorkerClient.ts
var ue = class {
	worker;
	_latestId = -1;
	_nextId = 0;
	_onResult = null;
	constructor() {
		this.worker = new le(), this.worker.onmessage = ({ data: e }) => {
			e.id === this._latestId && this._onResult?.(e.result);
		};
	}
	request(e, t, n, r, i) {
		let a = this._nextId++;
		this._latestId = a, this._onResult = i, this.worker.postMessage({
			id: a,
			x: e,
			y: t,
			...r,
			...n
		});
	}
	static buildGeometry(e) {
		let t = [], n = [], r = [];
		for (let i of e) i.getSnapPoints().forEach((e) => t.push(e)), i.getSegments().forEach((e) => n.push(e)), i.getCircles().forEach((e) => r.push(e));
		return {
			points: t,
			segments: n,
			circles: r
		};
	}
	destroy() {
		this.worker.terminate();
	}
}, H = class {
	id = `shape-${Math.random().toString(36).slice(2, 9)}`;
	tool;
	layer;
	color;
	width;
	hidden;
	isIncremental = !1;
	createdAt;
	arrowStart;
	arrowEnd;
	arrowStyle;
	lineStyle;
	fill;
	fillOpacity;
	canHaveArrows = !1;
	canBeFilled = !1;
	constructor(e = {}) {
		this.id = e.id ?? "shape-" + Math.random().toString(36).slice(2, 9), this.createdAt = e.createdAt ?? Date.now(), this.tool = e.tool ?? "pen", this.layer = e.layer ?? null, this.color = e.color ?? "#000000", this.width = e.width ?? 2, this.hidden = e.hidden ?? !1, this.arrowStart = e.arrowStart ?? !1, this.arrowEnd = e.arrowEnd ?? !1, this.arrowStyle = e.arrowStyle ?? "filled", this.lineStyle = e.lineStyle ?? "solid", this.fill = e.fill ?? !1, this.fillOpacity = e.fillOpacity ?? .3;
	}
	toJSON() {
		return {
			id: this.id,
			createdAt: this.createdAt,
			tool: this.tool,
			layer: this.layer,
			color: this.color,
			width: this.width,
			hidden: this.hidden,
			arrowStart: this.arrowStart,
			arrowEnd: this.arrowEnd,
			arrowStyle: this.arrowStyle,
			lineStyle: this.lineStyle,
			fill: this.fill,
			fillOpacity: this.fillOpacity
		};
	}
	static applyLineStyle(e, t, n, r) {
		if (e.setLineDash([]), t === "dashed") {
			let t = Math.max(n * 2.5, 8) / r;
			e.setLineDash([t, t * .6]);
		} else t === "dotted" && (e.lineCap = "round", e.setLineDash([.01, Math.max(n * 2.8, 9) / r]));
	}
	static drawArrowHead(e, t, n, r, i, a, o, s) {
		e.save(), e.translate(t, n), e.rotate(r), a === "filled" ? (e.beginPath(), e.moveTo(0, 0), e.lineTo(-i, -i * .38), e.lineTo(-i, i * .38), e.closePath(), e.fillStyle = o, e.fill()) : (e.beginPath(), e.moveTo(-i, -i * .38), e.lineTo(0, 0), e.lineTo(-i, i * .38), e.strokeStyle = o, e.lineWidth = s, e.lineCap = "round", e.stroke()), e.restore();
	}
	static distToSegment(e, t, n, r, i, a) {
		let o = i - n, s = a - r, c = o * o + s * s;
		if (c < 1e-10) return Math.hypot(e - n, t - r);
		let l = Math.max(0, Math.min(1, ((e - n) * o + (t - r) * s) / c));
		return Math.hypot(e - (n + l * o), t - (r + l * s));
	}
	isEmpty() {
		return !1;
	}
}, de = class extends H {
	points = [];
	bezier = !0;
	isIncremental = !0;
	canHaveArrows = !1;
	drawingMode = "drag";
	_cachedPts = null;
	_eraserSnapshot = null;
	constructor(e, t = {}) {
		super(t), this.points = e.points ?? [], this.bezier = e.bezier ?? !0;
	}
	addPoint(e) {
		this.points.push({
			...e,
			x: Math.round(e.x * 10) / 10,
			y: Math.round(e.y * 10) / 10
		}), this._cachedPts = null;
	}
	update(e, t) {
		this.addPoint({
			x: e,
			y: t,
			t: performance.now(),
			pressure: 1
		});
	}
	onDrawStart(e, t, n) {
		this.tool === "eraser" && this.layer ? this._eraserSnapshot = n.getLayerSnapshot(this.layer) : this.bezier = n.bezierEnabled;
	}
	onDrawPoint(e, t, n) {
		this.addPoint({
			x: e,
			y: t,
			t: n,
			pressure: 1
		});
	}
	onDrawMove(e, t, n) {
		if (this.tool !== "eraser") return !1;
		if (this._eraserSnapshot && this.layer) {
			n.restoreLayerSnapshot(this.layer, this._eraserSnapshot);
			let e = n.getLayer(this.layer), { x: t, y: r, scale: i } = n.viewTransform, a = e.ctx;
			a.save(), this.layer !== "BACKGROUND" && (a.translate(t, r), a.scale(i, i)), this.draw(a), a.restore();
		}
		let { x: r, y: i, scale: a } = n.viewTransform, o = n.overlayCtx;
		return o.save(), o.translate(r, i), o.scale(a, a), o.beginPath(), o.arc(e, t, this.width / 2, 0, Math.PI * 2), o.strokeStyle = "rgba(0, 0, 0, 0.6)", o.lineWidth = 1 / a, o.setLineDash([4 / a, 4 / a]), o.stroke(), o.setLineDash([]), o.restore(), !0;
	}
	onDrawEnd() {
		this._eraserSnapshot = null;
	}
	getPointsUntil(e) {
		return this.points.filter((t) => t.t <= e);
	}
	hitTest(e, t, n) {
		if (this.points.length < 2) return !1;
		let r = this.width / 2 + n;
		for (let n = 0; n < this.points.length - 1; n++) {
			let i = this.points[n], a = this.points[n + 1];
			if (H.distToSegment(e, t, i.x, i.y, a.x, a.y) <= r) return !0;
		}
		return !1;
	}
	translate(e, t) {
		for (let n of this.points) n.x += e, n.y += t;
		this._cachedPts = null;
	}
	isEmpty() {
		return this.points.length < 2;
	}
	get processedPts() {
		if (!this._cachedPts) {
			let e = this.filterMinDistance(this.points, 1.2);
			e = this.movingAverage(e, 3), this._cachedPts = e;
		}
		return this._cachedPts;
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = Math.abs(e.getTransform().a) || 1;
		e.save();
		let n = this.processedPts;
		switch (e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", e.lineJoin = "round", e.globalAlpha = 1, e.globalCompositeOperation = "source-over", this.tool) {
			case "pen": break;
			case "eraser":
				e.strokeStyle = "rgba(0,0,0,1)", e.globalCompositeOperation = "destination-out";
				break;
			case "highlighter":
				e.globalAlpha = .2;
				break;
		}
		if (H.applyLineStyle(e, this.lineStyle, this.width, t), e.beginPath(), !this.bezier || n.length < 4) {
			e.moveTo(n[0].x, n[0].y);
			for (let t = 1; t < n.length; t++) e.lineTo(n[t].x, n[t].y);
		} else {
			let t = [
				n[0],
				...n,
				n[n.length - 1]
			];
			e.moveTo(n[0].x, n[0].y);
			for (let n = 0; n < t.length - 3; n++) {
				let r = t[n], i = t[n + 1], a = t[n + 2], o = t[n + 3], s = i.x + (a.x - r.x) / 6, c = i.y + (a.y - r.y) / 6, l = a.x - (o.x - i.x) / 6, u = a.y - (o.y - i.y) / 6;
				e.bezierCurveTo(s, c, l, u, a.x, a.y);
			}
		}
		if (e.stroke(), e.setLineDash([]), this.arrowStart || this.arrowEnd) {
			let t = this.points.length, n = Math.max(this.width * 5, 14), r = Math.min(5, t - 1);
			if (this.arrowEnd) {
				let i = Math.atan2(this.points[t - 1].y - this.points[t - 1 - r].y, this.points[t - 1].x - this.points[t - 1 - r].x);
				H.drawArrowHead(e, this.points[t - 1].x, this.points[t - 1].y, i, n, this.arrowStyle, this.color, this.width);
			}
			if (this.arrowStart) {
				let t = Math.atan2(this.points[0].y - this.points[r].y, this.points[0].x - this.points[r].x);
				H.drawArrowHead(e, this.points[0].x, this.points[0].y, t, n, this.arrowStyle, this.color, this.width);
			}
		}
		e.restore();
	}
	toJSON() {
		return {
			config: {
				bezier: this.bezier,
				points: this.points
			},
			options: super.toJSON()
		};
	}
	filterMinDistance(e, t = 1.5) {
		if (!e.length) return e;
		let n = [e[0]], r = e[0];
		for (let i = 1; i < e.length; i++) {
			let a = e[i].x - r.x, o = e[i].y - r.y;
			a * a + o * o >= t * t && (n.push(e[i]), r = e[i]);
		}
		return n;
	}
	movingAverage(e, t = 3) {
		if (e.length < t) return e;
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = 0, a = 0, o = 0;
			for (let n = -Math.floor(t / 2); n <= Math.floor(t / 2); n++) {
				let t = r + n;
				t >= 0 && t < e.length && (i += e[t].x, a += e[t].y, o++);
			}
			n.push({
				x: i / o,
				y: a / o,
				t: e[r].t,
				pressure: e[r].pressure
			});
		}
		return n;
	}
	getSnapPoints() {
		if (!this.points.length) return [];
		let e = this.points[0], t = this.points[this.points.length - 1];
		return [{
			x: e.x,
			y: e.y,
			type: "endpoint",
			shapeId: this.id,
			layer: this.layer
		}, {
			x: t.x,
			y: t.y,
			type: "endpoint",
			shapeId: this.id,
			layer: this.layer
		}];
	}
	getSegments() {
		if (this.points.length < 2) return [];
		let e = [];
		for (let t = 0; t < this.points.length - 1; t++) t % 5 == 0 && e.push({
			a: this.points[t],
			b: this.points[t + 1],
			layer: this.layer
		});
		return e;
	}
	getCircles() {
		return [];
	}
	getBounds() {
		if (!this.points.length) return null;
		let e = Infinity, t = Infinity, n = -Infinity, r = -Infinity;
		for (let i of this.points) i.x < e && (e = i.x), i.y < t && (t = i.y), i.x > n && (n = i.x), i.y > r && (r = i.y);
		return {
			minX: e,
			minY: t,
			maxX: n,
			maxY: r
		};
	}
}, fe = class extends H {
	x1;
	y1;
	x2;
	y2;
	canHaveArrows = !1;
	constructor(e, t = {}) {
		super(t);
		let { x1: n, y1: r, x2: i, y2: a } = e;
		this.x1 = n, this.y1 = r, this.x2 = i, this.y2 = a;
	}
	draw(e) {
		let t = this.x2 - this.x1, n = this.y2 - this.y1;
		if (Math.abs(t) < 1e-10 && Math.abs(n) < 1e-10) return;
		let r = e.getTransform(), i = r.a;
		if (Math.abs(i) < 1e-10) return;
		let a = e.canvas.width, o = e.canvas.height, s = (0 - r.e) / i, c = (a - r.e) / i, l = (0 - r.f) / i, u = (o - r.f) / i, d = [];
		Math.abs(t) > 1e-10 && (d.push((s - this.x1) / t), d.push((c - this.x1) / t)), Math.abs(n) > 1e-10 && (d.push((l - this.y1) / n), d.push((u - this.y1) / n));
		let f = .5 / i, p = d.filter((e) => {
			let r = this.x1 + e * t, i = this.y1 + e * n;
			return r >= s - f && r <= c + f && i >= l - f && i <= u + f;
		});
		if (p.length < 2) return;
		p.sort((e, t) => e - t);
		let m = p[0], h = p[p.length - 1], g = this.x1 + m * t, _ = this.y1 + m * n, v = this.x1 + h * t, y = this.y1 + h * n, b = Math.atan2(n, t), x = Math.max(this.width * 5, 14);
		e.save(), e.beginPath(), e.moveTo(g, _), e.lineTo(v, y), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", H.applyLineStyle(e, this.lineStyle, this.width, i), e.stroke(), e.setLineDash([]), this.arrowEnd && H.drawArrowHead(e, this.x2, this.y2, b, x, this.arrowStyle, this.color, this.width), this.arrowStart && H.drawArrowHead(e, this.x1, this.y1, b + Math.PI, x, this.arrowStyle, this.color, this.width), e.restore();
	}
	update(e, t) {
		this.x2 = e, this.y2 = t;
	}
	hitTest(e, t, n) {
		let r = this.x2 - this.x1, i = this.y2 - this.y1, a = Math.hypot(r, i);
		return a < 1e-10 ? !1 : Math.abs(i * e - r * t + this.x2 * this.y1 - this.y2 * this.x1) / a <= this.width / 2 + n;
	}
	translate(e, t) {
		this.x1 += e, this.y1 += t, this.x2 += e, this.y2 += t;
	}
	isEmpty() {
		return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) < 1;
	}
	toJSON() {
		return {
			config: {
				x1: this.x1,
				y1: this.y1,
				x2: this.x2,
				y2: this.y2
			},
			options: super.toJSON()
		};
	}
	getSnapPoints() {
		return [{
			x: this.x1,
			y: this.y1,
			type: "endpoint",
			shapeId: this.id,
			layer: this.layer
		}, {
			x: this.x2,
			y: this.y2,
			type: "endpoint",
			shapeId: this.id,
			layer: this.layer
		}];
	}
	getSegments() {
		return [{
			a: {
				x: this.x1,
				y: this.y1
			},
			b: {
				x: this.x2,
				y: this.y2
			},
			layer: this.layer
		}];
	}
	getCircles() {
		return [];
	}
	getBounds() {
		return {
			minX: Math.min(this.x1, this.x2),
			minY: Math.min(this.y1, this.y2),
			maxX: Math.max(this.x1, this.x2),
			maxY: Math.max(this.y1, this.y2)
		};
	}
}, pe = class extends H {
	x1;
	y1;
	x2;
	y2;
	canHaveArrows = !0;
	constructor(e, t = {}) {
		super(t);
		let { x1: n, y1: r, x2: i, y2: a } = e;
		this.x1 = n, this.y1 = r, this.x2 = i, this.y2 = a;
	}
	draw(e) {
		let t = Math.abs(e.getTransform().a) || 1, n = this.x2 - this.x1, r = this.y2 - this.y1, i = Math.atan2(r, n), a = Math.hypot(n, r), o = Math.max(this.width * 5, 14), s = this.x1, c = this.y1, l = this.x2, u = this.y2;
		this.arrowEnd && a > o && (l = this.x2 - o * .8 * Math.cos(i), u = this.y2 - o * .8 * Math.sin(i)), this.arrowStart && a > o && (s = this.x1 + o * .8 * Math.cos(i), c = this.y1 + o * .8 * Math.sin(i)), e.save(), e.beginPath(), e.moveTo(s, c), e.lineTo(l, u), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", H.applyLineStyle(e, this.lineStyle, this.width, t), e.stroke(), e.setLineDash([]), this.arrowEnd && H.drawArrowHead(e, this.x2, this.y2, i, o, this.arrowStyle, this.color, this.width), this.arrowStart && H.drawArrowHead(e, this.x1, this.y1, i + Math.PI, o, this.arrowStyle, this.color, this.width), e.restore();
	}
	update(e, t) {
		this.x2 = e, this.y2 = t;
	}
	hitTest(e, t, n) {
		return H.distToSegment(e, t, this.x1, this.y1, this.x2, this.y2) <= this.width / 2 + n;
	}
	translate(e, t) {
		this.x1 += e, this.y1 += t, this.x2 += e, this.y2 += t;
	}
	isEmpty() {
		return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) < 1;
	}
	toJSON() {
		return {
			config: {
				x1: this.x1,
				y1: this.y1,
				x2: this.x2,
				y2: this.y2
			},
			options: super.toJSON()
		};
	}
	getSnapPoints() {
		return [
			{
				x: this.x1,
				y: this.y1,
				type: "endpoint",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: this.x2,
				y: this.y2,
				type: "endpoint",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: (this.x1 + this.x2) / 2,
				y: (this.y1 + this.y2) / 2,
				type: "midpoint",
				shapeId: this.id,
				layer: this.layer
			}
		];
	}
	getSegments() {
		return [{
			a: {
				x: this.x1,
				y: this.y1
			},
			b: {
				x: this.x2,
				y: this.y2
			},
			layer: this.layer
		}];
	}
	getCircles() {
		return [];
	}
	getBounds() {
		let e = this.arrowStart || this.arrowEnd ? Math.max(this.width * 1.5, 4) : 0;
		return {
			minX: Math.min(this.x1, this.x2) - e,
			minY: Math.min(this.y1, this.y2) - e,
			maxX: Math.max(this.x1, this.x2) + e,
			maxY: Math.max(this.y1, this.y2) + e
		};
	}
}, me = class extends H {
	cx;
	cy;
	radius;
	canBeFilled = !0;
	constructor(e, t = {}) {
		super(t);
		let { cx: n, cy: r, radius: i } = e;
		this.cx = n, this.cy = r, this.radius = i;
	}
	draw(e) {
		let t = Math.abs(e.getTransform().a) || 1;
		e.save(), e.beginPath(), e.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2), this.fill && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), e.strokeStyle = this.color, e.lineWidth = this.width, H.applyLineStyle(e, this.lineStyle, this.width, t), e.stroke(), e.setLineDash([]);
		let n = Math.max(2, this.width * 1.5) / t;
		e.beginPath(), e.arc(this.cx, this.cy, n, 0, Math.PI * 2), e.fillStyle = this.color, e.fill(), e.restore();
	}
	update(e, t) {
		let n = e - this.cx, r = t - this.cy;
		this.radius = Math.hypot(n, r);
	}
	hitTest(e, t, n) {
		return Math.abs(Math.hypot(e - this.cx, t - this.cy) - this.radius) <= this.width / 2 + n;
	}
	translate(e, t) {
		this.cx += e, this.cy += t;
	}
	isEmpty() {
		return this.radius < 1;
	}
	toJSON() {
		return {
			config: {
				cx: this.cx,
				cy: this.cy,
				radius: this.radius
			},
			options: super.toJSON()
		};
	}
	getSnapPoints() {
		return [
			{
				x: this.cx,
				y: this.cy,
				type: "center",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: this.cx + this.radius,
				y: this.cy,
				type: "circumference",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: this.cx - this.radius,
				y: this.cy,
				type: "circumference",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: this.cx,
				y: this.cy + this.radius,
				type: "circumference",
				shapeId: this.id,
				layer: this.layer
			},
			{
				x: this.cx,
				y: this.cy - this.radius,
				type: "circumference",
				shapeId: this.id,
				layer: this.layer
			}
		];
	}
	getSegments() {
		return [];
	}
	getCircles() {
		return [{
			center: {
				x: this.cx,
				y: this.cy
			},
			radius: this.radius,
			layer: this.layer
		}];
	}
	getBounds() {
		return {
			minX: this.cx - this.radius,
			minY: this.cy - this.radius,
			maxX: this.cx + this.radius,
			maxY: this.cy + this.radius
		};
	}
}, he = class extends H {
	p1;
	p2;
	w;
	cursorPos = null;
	mode;
	canBeFilled = !0;
	drawingMode;
	constructor(e, t = {}, n = "2pts") {
		super(t), this.p1 = e.p1, this.p2 = e.p2, this.w = e.w, this.mode = n, this.drawingMode = n === "3pts" ? "two-phase" : "drag";
	}
	get phase() {
		return Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y) > .01 ? 2 : 1;
	}
	setP2(e, t) {
		this.p2 = {
			x: Math.round(e * 10) / 10,
			y: Math.round(t * 10) / 10
		};
	}
	onPhaseTransition(e, t, n) {
		let r = n.snap(e, t, this.layer);
		this.setP2(r?.x ?? e, r?.y ?? t);
		let { x: i, y: a, scale: o } = n.viewTransform, s = n.overlayCtx;
		s.save(), s.translate(i, a), s.scale(o, o), this.draw(s), r && n.drawSnapIndicator(r), s.restore();
	}
	update(e, t) {
		if (this.mode === "2pts") {
			this.p2 = {
				x: Math.round(e * 10) / 10,
				y: Math.round(this.p1.y * 10) / 10
			};
			let n = e >= this.p1.x ? 1 : -1;
			this.w = Math.round((t - this.p1.y) * n * 10) / 10;
		} else if (this.phase === 1) this.cursorPos = {
			x: e,
			y: t
		};
		else {
			let n = this.p2.x - this.p1.x, r = this.p2.y - this.p1.y, i = Math.hypot(n, r);
			if (i < 1e-10) return;
			let a = -r / i, o = n / i;
			this.w = (e - this.p1.x) * a + (t - this.p1.y) * o;
		}
	}
	getCorners() {
		if (this.phase === 1) return null;
		let e = this.p2.x - this.p1.x, t = this.p2.y - this.p1.y, n = Math.hypot(e, t);
		if (n < 1e-10) return null;
		let r = -t / n * this.w, i = e / n * this.w;
		return [
			{
				x: this.p1.x,
				y: this.p1.y
			},
			{
				x: this.p2.x,
				y: this.p2.y
			},
			{
				x: this.p2.x + r,
				y: this.p2.y + i
			},
			{
				x: this.p1.x + r,
				y: this.p1.y + i
			}
		];
	}
	hitTest(e, t, n) {
		let r = this.getCorners();
		if (!r) return !1;
		let i = this.width / 2 + n;
		for (let n = 0; n < 4; n++) {
			let a = r[n], o = r[(n + 1) % 4];
			if (H.distToSegment(e, t, a.x, a.y, o.x, o.y) <= i) return !0;
		}
		return !1;
	}
	translate(e, t) {
		this.p1.x += e, this.p1.y += t, this.p2.x += e, this.p2.y += t;
	}
	isEmpty() {
		return this.phase === 1 ? !0 : Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y) < 1 || Math.abs(this.w) < 1;
	}
	draw(e) {
		let t = e.getTransform(), n = Math.abs(t.a) || 1;
		if (e.save(), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", e.lineJoin = "round", this.phase === 1) {
			if (!this.cursorPos) {
				e.restore();
				return;
			}
			e.beginPath(), e.moveTo(this.p1.x, this.p1.y), e.lineTo(this.cursorPos.x, this.cursorPos.y), e.stroke();
		} else {
			let t = this.getCorners();
			if (!t) {
				e.restore();
				return;
			}
			e.beginPath(), e.moveTo(t[0].x, t[0].y);
			for (let n = 1; n < 4; n++) e.lineTo(t[n].x, t[n].y);
			e.closePath(), this.fill && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), H.applyLineStyle(e, this.lineStyle, this.width, n), e.stroke(), e.setLineDash([]);
		}
		e.restore();
	}
	toJSON() {
		return {
			config: {
				p1: this.p1,
				p2: this.p2,
				w: this.w
			},
			options: super.toJSON()
		};
	}
	getSnapPoints() {
		let e = this.getCorners();
		if (!e) return [];
		let t = e.map((e) => ({
			x: e.x,
			y: e.y,
			type: "corner",
			shapeId: this.id,
			layer: this.layer
		}));
		return t.push({
			x: (e[0].x + e[2].x) / 2,
			y: (e[0].y + e[2].y) / 2,
			type: "center",
			shapeId: this.id,
			layer: this.layer
		}), t;
	}
	getSegments() {
		let e = this.getCorners();
		return e ? [
			{
				a: e[0],
				b: e[1],
				layer: this.layer
			},
			{
				a: e[1],
				b: e[2],
				layer: this.layer
			},
			{
				a: e[2],
				b: e[3],
				layer: this.layer
			},
			{
				a: e[3],
				b: e[0],
				layer: this.layer
			}
		] : [];
	}
	getCircles() {
		return [];
	}
	getBounds() {
		let e = this.getCorners();
		if (!e) return null;
		let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
		for (let a of e) a.x < t && (t = a.x), a.y < n && (n = a.y), a.x > r && (r = a.x), a.y > i && (i = a.y);
		return {
			minX: t,
			minY: n,
			maxX: r,
			maxY: i
		};
	}
}, ge = class extends H {
	points = [];
	closed = !1;
	cursorPos = null;
	canBeFilled = !0;
	drawingMode = "multi-click";
	doubleClickTimeout = 300;
	constructor(e, t = {}) {
		super(t), this.points = e.points ?? [], this.closed = e.closed ?? !1;
	}
	addVertex(e, t) {
		this.points.push({
			x: Math.round(e * 10) / 10,
			y: Math.round(t * 10) / 10
		});
	}
	update(e, t) {
		this.cursorPos = {
			x: e,
			y: t
		};
	}
	onDrawStart(e, t, n) {
		this.addVertex(e, t);
	}
	onDrawMove(e, t, n) {
		let { x: r, y: i, scale: a } = n.viewTransform, o = e, s = t, c = !1;
		if (this.points.length >= 3) {
			let n = this.points[0];
			Math.hypot(e - n.x, t - n.y) * a <= 15 && (o = n.x, s = n.y, c = !0);
		}
		let l = null;
		c || (l = n.snap(e, t, this.layer), l && (o = l.x, s = l.y)), this.update(o, s);
		let u = n.overlayCtx;
		if (u.save(), u.translate(r, i), u.scale(a, a), this.draw(u), c) {
			let e = this.points[0];
			u.beginPath(), u.arc(e.x, e.y, 8 / a, 0, Math.PI * 2), u.strokeStyle = this.color, u.lineWidth = 2 / a, u.stroke();
		} else l && n.drawSnapIndicator(l);
		return u.restore(), !0;
	}
	onDrawClick(e, t, n) {
		if (this.points.length >= 3) {
			let r = this.points[0];
			if (Math.hypot(e - r.x, t - r.y) * n.viewTransform.scale <= 15) return this.closed = !0, "done";
		}
		let r = n.snap(e, t, this.layer);
		return this.addVertex(r?.x ?? e, r?.y ?? t), "continue";
	}
	onDrawEnd() {
		this.closed = !0;
	}
	hitTest(e, t, n) {
		if (this.points.length < 2) return !1;
		let r = this.width / 2 + n;
		for (let n = 0; n < this.points.length - 1; n++) {
			let i = this.points[n], a = this.points[n + 1];
			if (H.distToSegment(e, t, i.x, i.y, a.x, a.y) <= r) return !0;
		}
		if (this.closed && this.points.length >= 3) {
			let n = this.points[0], i = this.points[this.points.length - 1];
			if (H.distToSegment(e, t, i.x, i.y, n.x, n.y) <= r) return !0;
		}
		return !1;
	}
	translate(e, t) {
		for (let n of this.points) n.x += e, n.y += t;
	}
	isEmpty() {
		return this.points.length < 2;
	}
	draw(e) {
		if (this.points.length < 1) return;
		let t = e.getTransform(), n = Math.abs(t.a) || 1;
		e.save(), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", e.lineJoin = "round";
		let r = !this.closed && this.cursorPos ? [...this.points, this.cursorPos] : this.points;
		e.beginPath(), e.moveTo(r[0].x, r[0].y);
		for (let t = 1; t < this.points.length; t++) e.lineTo(r[t].x, r[t].y);
		if (this.closed && e.closePath(), this.fill && this.closed && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), H.applyLineStyle(e, this.lineStyle, this.width, n), e.stroke(), e.setLineDash([]), !this.closed && this.cursorPos && r.length >= 2) {
			let t = Math.max(this.width * 2, 5) / n;
			e.setLineDash([t, t]), e.beginPath(), e.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y), e.lineTo(this.cursorPos.x, this.cursorPos.y), r.length >= 3 && e.lineTo(r[0].x, r[0].y), e.stroke(), e.setLineDash([]);
		}
		e.restore();
	}
	toJSON() {
		return {
			config: {
				points: this.points,
				closed: this.closed
			},
			options: super.toJSON()
		};
	}
	getSnapPoints() {
		let e = [];
		for (let t of this.points) e.push({
			x: t.x,
			y: t.y,
			type: "corner",
			shapeId: this.id,
			layer: this.layer
		});
		for (let t = 0; t < this.points.length - 1; t++) e.push({
			x: (this.points[t].x + this.points[t + 1].x) / 2,
			y: (this.points[t].y + this.points[t + 1].y) / 2,
			type: "midpoint",
			shapeId: this.id,
			layer: this.layer
		});
		if (this.closed && this.points.length >= 3) {
			let t = this.points[0], n = this.points[this.points.length - 1];
			e.push({
				x: (t.x + n.x) / 2,
				y: (t.y + n.y) / 2,
				type: "midpoint",
				shapeId: this.id,
				layer: this.layer
			});
		}
		return e;
	}
	getSegments() {
		if (this.points.length < 2) return [];
		let e = [];
		for (let t = 0; t < this.points.length - 1; t++) e.push({
			a: this.points[t],
			b: this.points[t + 1],
			layer: this.layer
		});
		return this.closed && this.points.length >= 3 && e.push({
			a: this.points[this.points.length - 1],
			b: this.points[0],
			layer: this.layer
		}), e;
	}
	getCircles() {
		return [];
	}
	getBounds() {
		if (!this.points.length) return null;
		let e = Infinity, t = Infinity, n = -Infinity, r = -Infinity;
		for (let i of this.points) i.x < e && (e = i.x), i.y < t && (t = i.y), i.x > n && (n = i.x), i.y > r && (r = i.y);
		return {
			minX: e,
			minY: t,
			maxX: n,
			maxY: r
		};
	}
}, _e = class e {
	static _idCounter = 0;
	static generateId() {
		return this._idCounter++, `shape-${this._idCounter}`;
	}
	static create(e, t) {
		let { x: n, y: r, color: i, width: a, layer: o, id: s, createdAt: c, tool: l } = e, u = o ?? null, d = i ?? "#000", f = a ?? 1, p = {
			id: s ?? this.generateId(),
			createdAt: c ?? Date.now(),
			tool: l,
			layer: u,
			color: d,
			width: f,
			arrowStart: e.arrowStart,
			arrowEnd: e.arrowEnd,
			arrowStyle: e.arrowStyle,
			lineStyle: e.lineStyle,
			fill: e.fill,
			fillOpacity: e.fillOpacity
		};
		switch (l) {
			case "pen":
			case "highlighter":
			case "eraser": return new de(t ?? { tool: l }, p);
			case "line": return new fe(t ?? {
				x1: n,
				y1: r,
				x2: n,
				y2: r
			}, p);
			case "segment": return new pe(t ?? {
				x1: n,
				y1: r,
				x2: n,
				y2: r
			}, p);
			case "circle": return new me(t ?? {
				cx: n,
				cy: r,
				radius: 0
			}, p);
			case "rectangle": return new he(t ?? {
				p1: {
					x: n,
					y: r
				},
				p2: {
					x: n,
					y: r
				},
				w: 0
			}, p, e.rectMode ?? "2pts");
			case "polygon": return new ge(t ?? { points: [] }, p);
			case "vector": return new pe(t ?? {
				x1: n,
				y1: r,
				x2: n,
				y2: r
			}, {
				...p,
				arrowEnd: p.arrowEnd ?? !0
			});
			default: throw Error(`Tool not supported: ${l}`);
		}
	}
	static fromJSON(t) {
		try {
			let { config: n, options: r } = t, i = {
				tool: r.tool,
				x: 0,
				y: 0,
				color: r.color,
				width: r.width,
				layer: r.layer,
				id: r.id,
				createdAt: r.createdAt,
				arrowStart: r.arrowStart,
				arrowEnd: r.arrowEnd,
				arrowStyle: r.arrowStyle,
				lineStyle: r.lineStyle,
				fill: r.fill,
				fillOpacity: r.fillOpacity
			};
			return e.create(i, n);
		} catch {
			return null;
		}
	}
};
//#endregion
//#region src/core/helper.ts
function ve(e, t, n, r) {
	let { size: i, color: a = "#ddd", lineWidth: o = 1, majorEvery: s = 0, majorColor: c = "#bbb", majorWidth: l = 1.5 } = r;
	if (!(i <= 0)) {
		e.save();
		for (let r = 0; r <= t; r += i) {
			let t = s > 0 && r / i % s === 0;
			e.strokeStyle = t ? c : a, e.lineWidth = t ? l : o;
			let u = Math.round(r) + .5;
			e.beginPath(), e.moveTo(u, 0), e.lineTo(u, n), e.stroke();
		}
		for (let r = 0; r <= n; r += i) {
			let n = s > 0 && r / i % s === 0;
			e.strokeStyle = n ? c : a, e.lineWidth = n ? l : o;
			let u = Math.round(r) + .5;
			e.beginPath(), e.moveTo(0, u), e.lineTo(t, u), e.stroke();
		}
		e.restore();
	}
}
function ye(e, t, n, r) {
	let { spacing: i, color: a = "#cfd8ff", lineWidth: o = 1, marginTop: s = 0 } = r;
	e.save(), e.strokeStyle = a, e.lineWidth = o;
	for (let r = s; r <= n; r += i) e.beginPath(), e.moveTo(0, r), e.lineTo(t, r), e.stroke();
	e.restore();
}
function be(e, t, n, r) {
	let { size: i, color: a = "#ddd", lineWidth: o = 1, orientation: s = "pointy" } = r;
	if (!(i <= 0)) {
		if (e.save(), e.strokeStyle = a, e.lineWidth = o, s === "pointy") {
			let r = Math.sqrt(3) * i, a = i * 1.5, o = Math.ceil(t / r) + 2, s = Math.ceil(n / a) + 2;
			for (let t = -1; t < s; t++) for (let n = -1; n < o; n++) xe(e, n * r + (t % 2 == 0 ? 0 : r / 2), t * a, i, Math.PI / 6);
		} else {
			let r = Math.sqrt(3) * i, a = i * 1.5, o = Math.ceil(t / a) + 2, s = Math.ceil(n / r) + 2;
			for (let t = -1; t < s; t++) for (let n = -1; n < o; n++) xe(e, n * a, t * r + (n % 2 == 0 ? 0 : r / 2), i, 0);
		}
		e.restore();
	}
}
function xe(e, t, n, r, i) {
	e.beginPath();
	for (let a = 0; a < 6; a++) {
		let o = i + a * Math.PI / 3, s = t + r * Math.cos(o), c = n + r * Math.sin(o);
		a === 0 ? e.moveTo(s, c) : e.lineTo(s, c);
	}
	e.closePath(), e.stroke();
}
//#endregion
//#region src/snap/visual/SnapRenderer.ts
var Se = class {
	ctx;
	constructor(e) {
		this.ctx = e;
	}
	updateCtx(e) {
		this.ctx = e;
	}
	draw(e) {
		let t = this.ctx;
		if (e) {
			switch (t.save(), t.strokeStyle = "#00A8FF", t.lineWidth = 1.5, e.type) {
				case "point":
					t.beginPath(), t.arc(e.x, e.y, 6, 0, Math.PI * 2), t.stroke();
					break;
				case "midpoint":
					t.beginPath(), t.moveTo(e.x - 6, e.y), t.lineTo(e.x + 6, e.y), t.moveTo(e.x, e.y - 6), t.lineTo(e.x, e.y + 6), t.stroke();
					break;
				case "grid":
					t.beginPath(), t.rect(e.x - 4, e.y - 4, 8, 8), t.stroke();
					break;
			}
			t.restore();
		}
	}
}, Ce = class e {
	bezier = !1;
	_title = "";
	static NO_SNAP_TOOLS = new Set([
		"pen",
		"highlighter",
		"eraser"
	]);
	container;
	overlay;
	_layers;
	_shapes = [];
	_currentShape = null;
	_background = { mode: "none" };
	_pageId = "default";
	_onSaveCallback;
	_snapManager = new ce({ snapRadius: 10 });
	_snapWorkerClient;
	_geometryDirty = !0;
	_cachedGeometry = {
		points: [],
		segments: [],
		circles: []
	};
	snapRenderer;
	_resizeObserver;
	_viewTransform = {
		x: 0,
		y: 0,
		scale: 1
	};
	_undoStack = [];
	_selectedShapeId = null;
	_snapGridEnabled = !1;
	_snapGridSize = 80;
	_gridPreviewTimer = null;
	constructor(e, t) {
		this.container = e, this.container.style.position = "relative", this._layers = {
			BACKGROUND: new re(this.container, {
				name: "BACKGROUND",
				zIndex: 1
			}),
			MAIN: new re(this.container, {
				name: "MAIN",
				zIndex: 2
			}),
			LAYER: new re(this.container, {
				name: "LAYER",
				zIndex: 3
			})
		}, this.overlay = new re(this.container, {
			name: "overlay",
			zIndex: 99
		}), this.snapRenderer = new Se(this.overlay.ctx), this._snapWorkerClient = new ue(), t && this._applyBackground(t), this._resizeObserver = new ResizeObserver(() => this.resize()), this._resizeObserver.observe(this.container), this._snapManager.setStrategyEnabled("grid", !1);
	}
	get snapGridEnabled() {
		return this._snapGridEnabled;
	}
	set snapGridEnabled(e) {
		this._snapGridEnabled = e, this._snapManager.setStrategyEnabled("grid", e);
	}
	get snapGridSize() {
		return this._snapGridSize;
	}
	set snapGridSize(e) {
		this._snapGridSize = e, this._snapManager.setGridSize(e);
	}
	get snapManager() {
		return this._snapManager;
	}
	get _storageKey() {
		return "pi_note_draft_" + this._pageId;
	}
	setPageId(e) {
		this._pageId = e;
	}
	set onSave(e) {
		this._onSaveCallback = e;
	}
	setViewTransform(e, t, n) {
		this._viewTransform = {
			x: e,
			y: t,
			scale: n
		};
	}
	get shapes() {
		return this._shapes;
	}
	get currentShape() {
		return this._currentShape;
	}
	get layers() {
		return Object.values(this._layers);
	}
	get mode() {
		return this._background.mode;
	}
	set mode(e) {
		this._background.mode = e;
	}
	get title() {
		return this._title;
	}
	set title(e) {
		this._title = e;
		try {
			this.saveLocal();
		} catch {}
	}
	get backgroundState() {
		return { ...this._background };
	}
	startShape(t) {
		let n = t.x, r = t.y;
		if (!e.NO_SNAP_TOOLS.has(t.tool)) {
			let e = this.snapManager.snap(t.x, t.y, this._shapes, t.layer);
			this.overlay.clear();
			let { x: i, y: a, scale: o } = this._viewTransform, s = this.overlay.ctx;
			s.save(), s.translate(i, a), s.scale(o, o), this.snapRenderer.draw(e), s.restore(), n = e?.x ?? t.x, r = e?.y ?? t.y;
		}
		let i = _e.create({
			...t,
			x: n,
			y: r
		});
		return i.onDrawStart?.(n, r, this._buildDrawingContext()), this._currentShape = i, i;
	}
	phaseTransition(e, t) {
		this._currentShape?.onPhaseTransition && (this.overlay.clear(), this._currentShape.onPhaseTransition(e, t, this._buildDrawingContext()));
	}
	handleDrawClick(e, t) {
		return this._currentShape?.onDrawClick ? this._currentShape.onDrawClick(e, t, this._buildDrawingContext()) : "continue";
	}
	updateShape(t, n) {
		if (!this._currentShape || (this.overlay.clear(), this._currentShape.onDrawMove?.(t, n, this._buildDrawingContext()))) return;
		let r = t, i = n, a = !e.NO_SNAP_TOOLS.has(this._currentShape.tool), o = a ? this.snapManager.snap(t, n, this._shapes, this._currentShape.layer) : null;
		a && o && (r = o.x, i = o.y), this._currentShape.update?.(r, i);
		let { x: s, y: c, scale: l } = this._viewTransform, u = this.overlay.ctx;
		u.save(), u.translate(s, c), u.scale(l, l), a && this.snapRenderer.draw(o), this._currentShape.draw(u), u.restore();
	}
	endShape() {
		if (!this._currentShape) return;
		let e = this._currentShape;
		if (this._currentShape = null, this.overlay.clear(), !e.isEmpty()) {
			if (e.onDrawEnd?.(), this._shapes.push(e), this._undoStack = [], this._markGeometryDirty(), e.layer !== null) {
				let t = this.getLayer(e.layer).ctx;
				if (e.layer !== "BACKGROUND") {
					let { x: n, y: r, scale: i } = this._viewTransform;
					t.save(), t.translate(n, r), t.scale(i, i), e.draw(t), t.restore();
				} else e.draw(t);
			}
			try {
				this.saveLocal();
			} catch {
				this._shapes.pop(), this.draw();
			}
		}
	}
	_buildDrawingContext() {
		let e = this;
		return {
			get overlayCtx() {
				return e.overlay.ctx;
			},
			snap: (t, n, r) => e._snapManager.snap(t, n, e._shapes, r),
			getLayer: (t) => e.getLayer(t),
			get viewTransform() {
				return e._viewTransform;
			},
			drawSnapIndicator: (t) => {
				e.snapRenderer.draw(t);
			},
			get bezierEnabled() {
				return e.bezier;
			},
			getLayerSnapshot: (t) => {
				let n = e.getLayer(t);
				return n.ctx.getImageData(0, 0, n.canvas.width, n.canvas.height);
			},
			restoreLayerSnapshot: (t, n) => {
				e.getLayer(t).ctx.putImageData(n, 0, 0);
			}
		};
	}
	getLayer(e) {
		return this._layers[e] ?? this._layers.MAIN;
	}
	setLayerVisibility(e, t) {
		let n = this.getLayer(e);
		n.visible = t, n.canvas.style.display = t ? "block" : "none";
	}
	setLayerOpacity(e, t) {
		let n = this.getLayer(e);
		n.opacity = t, n.canvas.style.opacity = t.toString();
	}
	clearLayer(e) {
		this.getLayer(e)?.clear();
	}
	clearAll() {
		for (let e of Object.values(this._layers)) e.visible && !e.locked && e.name !== "BACKGROUND" && e.clear();
	}
	draw(e) {
		this.clearAll();
		let t = /* @__PURE__ */ new Map();
		for (let n of this._shapes) {
			if (!n.layer || e && n.layer === e || n.hidden) continue;
			let r = t.get(n.layer);
			r ? r.push(n) : t.set(n.layer, [n]);
		}
		let { x: n, y: r, scale: i } = this._viewTransform;
		for (let [e, a] of t) {
			let t = this.getLayer(e).ctx;
			e !== "BACKGROUND" && (t.save(), t.translate(n, r), t.scale(i, i));
			for (let e of a) e.draw(t);
			e !== "BACKGROUND" && t.restore();
		}
		this._currentShape || this._drawSelectionOverlay();
	}
	resize() {
		for (let e of [...Object.values(this._layers), this.overlay]) e.resize(this.container);
		this.snapRenderer.updateCtx(this.overlay.ctx), this.renderBackground(this._background), this.draw();
	}
	setBackground(e) {
		this._applyBackground(e), e.mode === "grid" && e.grid?.size && (this._snapGridSize = e.grid.size, this._snapManager.setGridSize(e.grid.size)), this.draw();
		try {
			this.saveLocal();
		} catch {}
	}
	_applyBackground(e) {
		this._background = e, this.renderBackground(e);
	}
	renderBackground(e) {
		let t = this.getLayer("BACKGROUND"), n = t.ctx, r = t.canvas.width, i = t.canvas.height;
		switch (n.clearRect(0, 0, r, i), e.mode) {
			case "grid":
				ve(n, r, i, e.grid);
				break;
			case "ruled":
				ye(n, r, i, e.ruled);
				break;
			case "hex":
				be(n, r, i, e.hex);
				break;
		}
	}
	getShapeById(e) {
		return this._shapes.find((t) => t.id === e);
	}
	updateShapeProps(e, t) {
		let n = this._shapes.find((t) => t.id === e);
		if (n) {
			Object.assign(n, t), this.draw(), this._drawSelectionOverlay();
			try {
				this.saveLocal();
			} catch {}
		}
	}
	resetState() {
		this._shapes = [], this._undoStack = [], this._selectedShapeId = null, this._title = "", this._markGeometryDirty(), this.overlay.clear(), this.clearAll(), this._applyBackground({ mode: "none" });
	}
	resetAll() {
		this.resetState();
		try {
			this.saveLocal();
		} catch {}
	}
	toJSONData() {
		return {
			title: this._title,
			background: this._background,
			shapes: this._shapes.map((e) => e.toJSON())
		};
	}
	saveLocal() {
		localStorage.setItem(this._storageKey, JSON.stringify(this.toJSONData())), this._onSaveCallback?.();
	}
	loadFromJSONData(e) {
		let t = Array.isArray(e) ? e : e.shapes ?? [];
		this._title = Array.isArray(e) ? "" : e.title ?? "", !Array.isArray(e) && e.background && this._applyBackground(e.background);
		let n = 0;
		this._shapes = t.map((e) => {
			let t = _e.fromJSON(e);
			return t || n++, t;
		}).filter((e) => e !== null), n > 0 && console.warn(`[PiNote] loadFromJSONData: ${n} forme(s) ignorée(s) (données invalides ou outil inconnu)`), this._undoStack = [], this._selectedShapeId = null, this._markGeometryDirty(), this.draw();
		try {
			this.saveLocal();
		} catch {}
	}
	loadLocal() {
		let e = localStorage.getItem(this._storageKey);
		if (!e) return;
		let t;
		try {
			t = JSON.parse(e);
		} catch {
			console.warn("[PiNote] loadLocal: données localStorage invalides, ignorées");
			return;
		}
		this.loadFromJSONData(t);
	}
	exportPNG() {
		let e = this._layers.MAIN.canvas, t = document.createElement("canvas");
		t.width = e.width, t.height = e.height;
		let n = t.getContext("2d");
		n.fillStyle = "white", n.fillRect(0, 0, t.width, t.height);
		for (let e of [
			"BACKGROUND",
			"MAIN",
			"LAYER"
		]) this._layers[e].visible && n.drawImage(this._layers[e].canvas, 0, 0);
		return t.toDataURL("image/png");
	}
	exportA4(e) {
		let t = (e) => Math.round(e / 25.4 * 150), n = t(15), r = Infinity, i = Infinity, a = -Infinity, o = -Infinity;
		for (let e of this._shapes) {
			if (e.hidden || !e.layer) continue;
			let t = e.getBounds();
			t && (t.minX < r && (r = t.minX), t.minY < i && (i = t.minY), t.maxX > a && (a = t.maxX), t.maxY > o && (o = t.maxY));
		}
		if (!isFinite(r)) return this.exportPNG();
		let s = Math.max(a - r, 1), c = Math.max(o - i, 1), l = (e === "auto" ? s > c ? "landscape" : "portrait" : e) === "portrait", u = t(l ? 210 : 297), d = t(l ? 297 : 210), f = Math.min((u - 2 * n) / s, (d - 2 * n) / c), p = s * f, m = c * f, h = (u - p) / 2 - r * f, g = (d - m) / 2 - i * f, _ = document.createElement("canvas");
		_.width = u, _.height = d;
		let v = _.getContext("2d");
		if (v.fillStyle = "white", v.fillRect(0, 0, u, d), this._background.mode !== "none") switch (this._background.mode) {
			case "grid":
				ve(v, u, d, this._background.grid);
				break;
			case "ruled":
				ye(v, u, d, this._background.ruled);
				break;
			case "hex":
				be(v, u, d, this._background.hex);
				break;
		}
		v.save(), v.translate(h, g), v.scale(f, f);
		for (let e of [
			"BACKGROUND",
			"MAIN",
			"LAYER"
		]) if (this._layers[e].visible) for (let t of this._shapes) !t.hidden && t.layer === e && t.draw(v);
		return v.restore(), _.toDataURL("image/png");
	}
	cancelShape() {
		this._currentShape && (this._currentShape = null, this.overlay.clear());
	}
	get canUndo() {
		return this._shapes.length > 0;
	}
	get canRedo() {
		return this._undoStack.length > 0;
	}
	undo() {
		if (!this.canUndo) return;
		let e = this._shapes.pop();
		this._undoStack.push(e), this._markGeometryDirty(), this._selectedShapeId === e.id && (this._selectedShapeId = null), this.draw();
		try {
			this.saveLocal();
		} catch {}
	}
	redo() {
		if (this.canRedo) {
			this._shapes.push(this._undoStack.pop()), this._markGeometryDirty(), this.draw();
			try {
				this.saveLocal();
			} catch {}
		}
	}
	highlightShape(e) {
		this._selectedShapeId = e, this._drawSelectionOverlay();
	}
	clearHighlight() {
		this._selectedShapeId = null, this.overlay.clear();
	}
	_drawSelectionOverlay() {
		if (this.overlay.clear(), !this._selectedShapeId) return;
		let e = this._shapes.find((e) => e.id === this._selectedShapeId);
		if (!e) return;
		let t = e.getBounds();
		if (!t) return;
		let { x: n, y: r, scale: i } = this._viewTransform, a = this.overlay.ctx;
		a.save(), a.translate(n, r), a.scale(i, i);
		let o = 8 / i, s = t.minX - o, c = t.minY - o, l = t.maxX - t.minX + o * 2, u = t.maxY - t.minY + o * 2;
		a.strokeStyle = "#3b82f6", a.lineWidth = 1.5 / i, a.setLineDash([5 / i, 4 / i]), a.strokeRect(s, c, l, u), a.setLineDash([]);
		let d = 7 / i, f = 20 / i;
		a.fillStyle = "#3b82f6", a.beginPath(), a.arc(s, c, d, 0, Math.PI * 2), a.fill(), a.strokeStyle = "white", a.lineWidth = 1.5 / i, a.beginPath(), a.moveTo(s - 3.5 / i, c), a.lineTo(s + 3.5 / i, c), a.moveTo(s, c - 3.5 / i), a.lineTo(s, c + 3.5 / i), a.stroke();
		let p = s + f;
		a.fillStyle = "#3b82f6", a.beginPath(), a.arc(p, c, d, 0, Math.PI * 2), a.fill(), a.strokeStyle = "white", a.lineWidth = 1.2 / i;
		let m = 2.8 / i, h = 1.5 / i;
		a.strokeRect(p - m - h, c - m - h, m * 2, m * 2), a.strokeRect(p - m + h, c - m + h, m * 2, m * 2);
		let g = s + f * 2;
		a.fillStyle = "#ef4444", a.beginPath(), a.arc(g, c, d, 0, Math.PI * 2), a.fill(), a.strokeStyle = "white", a.lineWidth = 1.5 / i;
		let _ = 3.5 / i;
		a.beginPath(), a.moveTo(g - _, c - _), a.lineTo(g + _, c + _), a.moveTo(g + _, c - _), a.lineTo(g - _, c + _), a.stroke(), a.restore();
	}
	get selectedShapeId() {
		return this._selectedShapeId;
	}
	_handlePositions(e) {
		if (!e) return null;
		let { scale: t } = this._viewTransform, n = 8 / t, r = e.minX - n, i = e.minY - n, a = 20 / t;
		return {
			move: {
				x: r,
				y: i
			},
			duplicate: {
				x: r + a,
				y: i
			},
			delete: {
				x: r + a * 2,
				y: i
			}
		};
	}
	isOverMoveHandle(e, t) {
		if (!this._selectedShapeId) return !1;
		let n = this._shapes.find((e) => e.id === this._selectedShapeId);
		if (!n) return !1;
		let r = this._handlePositions(n.getBounds());
		return r ? Math.hypot(e - r.move.x, t - r.move.y) * this._viewTransform.scale <= 14 : !1;
	}
	isOverDuplicateHandle(e, t) {
		if (!this._selectedShapeId) return !1;
		let n = this._shapes.find((e) => e.id === this._selectedShapeId);
		if (!n) return !1;
		let r = this._handlePositions(n.getBounds());
		return r ? Math.hypot(e - r.duplicate.x, t - r.duplicate.y) * this._viewTransform.scale <= 14 : !1;
	}
	isOverDeleteHandle(e, t) {
		if (!this._selectedShapeId) return !1;
		let n = this._shapes.find((e) => e.id === this._selectedShapeId);
		if (!n) return !1;
		let r = this._handlePositions(n.getBounds());
		return r ? Math.hypot(e - r.delete.x, t - r.delete.y) * this._viewTransform.scale <= 14 : !1;
	}
	duplicateShape(e) {
		let t = this._shapes.find((t) => t.id === e);
		if (!t) return null;
		let n = JSON.parse(JSON.stringify(t.toJSON()));
		n.options.id = void 0, n.options.hidden = !1;
		let r = _e.fromJSON(n);
		if (!r) return null;
		r.translate(15, 15), this._shapes.push(r), this._undoStack = [], this._markGeometryDirty(), this._selectedShapeId = r.id, this.draw();
		try {
			this.saveLocal();
		} catch {}
		return r.id;
	}
	findShapeAt(e, t) {
		let n = 6 / this._viewTransform.scale;
		for (let r = this._shapes.length - 1; r >= 0; r--) {
			let i = this._shapes[r];
			if (!i.hidden && i.hitTest(e, t, n)) return i.id;
		}
		return null;
	}
	toggleVisibility(e) {
		let t = this._shapes.find((t) => t.id === e);
		if (t) {
			t.hidden = !t.hidden, this.draw();
			try {
				this.saveLocal();
			} catch {}
		}
	}
	moveShape(e, t, n) {
		let r = this._shapes.find((t) => t.id === e);
		r && (r.translate(t, n), this._markGeometryDirty(), this.draw());
	}
	destroyById(e) {
		let t = this._shapes.findIndex((t) => t.id === e);
		if (t === -1) return;
		let [n] = this._shapes.splice(t, 1);
		this._markGeometryDirty(), this.draw();
		try {
			this.saveLocal();
		} catch {
			this._shapes.splice(t, 0, n), this._markGeometryDirty(), this.draw();
		}
	}
	showGridPreview(e = 1500) {
		this._currentShape || (this._gridPreviewTimer && clearTimeout(this._gridPreviewTimer), this._renderGridPreview(), this._gridPreviewTimer = setTimeout(() => {
			this._gridPreviewTimer = null, this.overlay.clear(), this._drawSelectionOverlay();
		}, e));
	}
	_renderGridPreview() {
		this.overlay.clear();
		let e = this.overlay.ctx, t = this.overlay.canvas.width, n = this.overlay.canvas.height, { x: r, y: i, scale: a } = this._viewTransform, o = this._snapGridSize * a;
		if (o <= 0) return;
		let s = (r % o + o) % o, c = (i % o + o) % o;
		e.save(), e.strokeStyle = "#00A8FF", e.globalAlpha = .35, e.lineWidth = 1, e.setLineDash([2, 4]);
		for (let r = s; r <= t + o; r += o) e.beginPath(), e.moveTo(r, 0), e.lineTo(r, n), e.stroke();
		for (let r = c; r <= n + o; r += o) e.beginPath(), e.moveTo(0, r), e.lineTo(t, r), e.stroke();
		e.setLineDash([]), e.restore();
	}
	async syncRemote(e) {
		let t = await fetch(e, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(this.toJSONData())
		});
		if (!t.ok) throw Error(`[PiNote] syncRemote: ${t.status} ${t.statusText}`);
	}
	_getGeometry() {
		return this._geometryDirty &&= (this._cachedGeometry = ue.buildGeometry(this._shapes), !1), this._cachedGeometry;
	}
	_markGeometryDirty() {
		this._geometryDirty = !0;
	}
	static HOVER_SNAP_EXCLUDED = new Set([
		"pen",
		"highlighter",
		"eraser",
		"move",
		"select"
	]);
	hoverSnap(t, n, r) {
		if (e.HOVER_SNAP_EXCLUDED.has(r) || this._currentShape) return;
		let i = this._getGeometry();
		this._snapWorkerClient.request(t, n, i, {
			snapRadius: this._snapManager.snapRadius,
			gridEnabled: this._snapGridEnabled,
			gridSize: this._snapGridSize,
			activeLayer: null
		}, (e) => {
			if (this._currentShape || (this.overlay.clear(), !e)) return;
			let { x: t, y: n, scale: r } = this._viewTransform, i = this.overlay.ctx;
			i.save(), i.translate(t, n), i.scale(r, r), this.snapRenderer.draw(e), i.restore();
		});
	}
	clearHoverSnap() {
		this._currentShape || (this.overlay.clear(), this._drawSelectionOverlay());
	}
	destroy() {
		this._gridPreviewTimer && clearTimeout(this._gridPreviewTimer), this._resizeObserver.disconnect(), this._snapWorkerClient.destroy();
	}
}, we = Object.create, Te = Object.defineProperty, Ee = Object.getOwnPropertyDescriptor, De = Object.getOwnPropertyNames, Oe = Object.getPrototypeOf, ke = Object.prototype.hasOwnProperty, Ae = (e, t) => function() {
	return e && (t = (0, e[De(e)[0]])(e = 0)), t;
}, je = (e, t) => function() {
	return t || (0, e[De(e)[0]])((t = { exports: {} }).exports, t), t.exports;
}, Me = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (let i of De(t)) !ke.call(e, i) && i !== n && Te(e, i, {
		get: () => t[i],
		enumerable: !(r = Ee(t, i)) || r.enumerable
	});
	return e;
}, Ne = (e, t, n) => (n = e == null ? {} : we(Oe(e)), Me(t || !e || !e.__esModule ? Te(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), Pe = Ae({ "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {} }), Fe = je({ "../../node_modules/.pnpm/rfdc@1.4.1/node_modules/rfdc/index.js"(e, t) {
	Pe(), t.exports = r;
	function n(e) {
		return e instanceof Buffer ? Buffer.from(e) : new e.constructor(e.buffer.slice(), e.byteOffset, e.length);
	}
	function r(e) {
		if (e ||= {}, e.circles) return i(e);
		let t = /* @__PURE__ */ new Map();
		if (t.set(Date, (e) => new Date(e)), t.set(Map, (e, t) => new Map(a(Array.from(e), t))), t.set(Set, (e, t) => new Set(a(Array.from(e), t))), e.constructorHandlers) for (let n of e.constructorHandlers) t.set(n[0], n[1]);
		let r = null;
		return e.proto ? s : o;
		function a(e, i) {
			let a = Object.keys(e), o = Array(a.length);
			for (let s = 0; s < a.length; s++) {
				let c = a[s], l = e[c];
				typeof l != "object" || !l ? o[c] = l : l.constructor !== Object && (r = t.get(l.constructor)) ? o[c] = r(l, i) : ArrayBuffer.isView(l) ? o[c] = n(l) : o[c] = i(l);
			}
			return o;
		}
		function o(e) {
			if (typeof e != "object" || !e) return e;
			if (Array.isArray(e)) return a(e, o);
			if (e.constructor !== Object && (r = t.get(e.constructor))) return r(e, o);
			let i = {};
			for (let a in e) {
				if (Object.hasOwnProperty.call(e, a) === !1) continue;
				let s = e[a];
				typeof s != "object" || !s ? i[a] = s : s.constructor !== Object && (r = t.get(s.constructor)) ? i[a] = r(s, o) : ArrayBuffer.isView(s) ? i[a] = n(s) : i[a] = o(s);
			}
			return i;
		}
		function s(e) {
			if (typeof e != "object" || !e) return e;
			if (Array.isArray(e)) return a(e, s);
			if (e.constructor !== Object && (r = t.get(e.constructor))) return r(e, s);
			let i = {};
			for (let a in e) {
				let o = e[a];
				typeof o != "object" || !o ? i[a] = o : o.constructor !== Object && (r = t.get(o.constructor)) ? i[a] = r(o, s) : ArrayBuffer.isView(o) ? i[a] = n(o) : i[a] = s(o);
			}
			return i;
		}
	}
	function i(e) {
		let t = [], r = [], i = /* @__PURE__ */ new Map();
		if (i.set(Date, (e) => new Date(e)), i.set(Map, (e, t) => new Map(o(Array.from(e), t))), i.set(Set, (e, t) => new Set(o(Array.from(e), t))), e.constructorHandlers) for (let t of e.constructorHandlers) i.set(t[0], t[1]);
		let a = null;
		return e.proto ? c : s;
		function o(e, o) {
			let s = Object.keys(e), c = Array(s.length);
			for (let l = 0; l < s.length; l++) {
				let u = s[l], d = e[u];
				if (typeof d != "object" || !d) c[u] = d;
				else if (d.constructor !== Object && (a = i.get(d.constructor))) c[u] = a(d, o);
				else if (ArrayBuffer.isView(d)) c[u] = n(d);
				else {
					let e = t.indexOf(d);
					e === -1 ? c[u] = o(d) : c[u] = r[e];
				}
			}
			return c;
		}
		function s(e) {
			if (typeof e != "object" || !e) return e;
			if (Array.isArray(e)) return o(e, s);
			if (e.constructor !== Object && (a = i.get(e.constructor))) return a(e, s);
			let c = {};
			t.push(e), r.push(c);
			for (let o in e) {
				if (Object.hasOwnProperty.call(e, o) === !1) continue;
				let l = e[o];
				if (typeof l != "object" || !l) c[o] = l;
				else if (l.constructor !== Object && (a = i.get(l.constructor))) c[o] = a(l, s);
				else if (ArrayBuffer.isView(l)) c[o] = n(l);
				else {
					let e = t.indexOf(l);
					e === -1 ? c[o] = s(l) : c[o] = r[e];
				}
			}
			return t.pop(), r.pop(), c;
		}
		function c(e) {
			if (typeof e != "object" || !e) return e;
			if (Array.isArray(e)) return o(e, c);
			if (e.constructor !== Object && (a = i.get(e.constructor))) return a(e, c);
			let s = {};
			t.push(e), r.push(s);
			for (let o in e) {
				let l = e[o];
				if (typeof l != "object" || !l) s[o] = l;
				else if (l.constructor !== Object && (a = i.get(l.constructor))) s[o] = a(l, c);
				else if (ArrayBuffer.isView(l)) s[o] = n(l);
				else {
					let e = t.indexOf(l);
					e === -1 ? s[o] = c(l) : s[o] = r[e];
				}
			}
			return t.pop(), r.pop(), s;
		}
	}
} });
Pe(), Pe(), Pe();
var Ie = typeof navigator < "u", U = typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : typeof global < "u" ? global : {};
U.chrome !== void 0 && U.chrome.devtools, Ie && (U.self, U.top), typeof navigator < "u" && navigator.userAgent?.toLowerCase().includes("electron"), typeof window < "u" && window.__NUXT__, Pe();
var Le = Ne(Fe(), 1), Re = /(?:^|[-_/])(\w)/g;
function ze(e, t) {
	return t ? t.toUpperCase() : "";
}
function Be(e) {
	return e && `${e}`.replace(Re, ze);
}
function Ve(e, t) {
	let n = e.replace(/^[a-z]:/i, "").replace(/\\/g, "/");
	n.endsWith(`index${t}`) && (n = n.replace(`/index${t}`, t));
	let r = n.lastIndexOf("/"), i = n.substring(r + 1);
	if (t) {
		let e = i.lastIndexOf(t);
		return i.substring(0, e);
	}
	return "";
}
var He = (0, Le.default)({ circles: !0 }), Ue = { trailing: !0 };
function We(e, t = 25, n = {}) {
	if (n = {
		...Ue,
		...n
	}, !Number.isFinite(t)) throw TypeError("Expected `wait` to be a finite number");
	let r, i, a = [], o, s, c = (t, r) => (o = Ge(e, t, r), o.finally(() => {
		if (o = null, n.trailing && s && !i) {
			let e = c(t, s);
			return s = null, e;
		}
	}), o);
	return function(...e) {
		return o ? (n.trailing && (s = e), o) : new Promise((o) => {
			let s = !i && n.leading;
			clearTimeout(i), i = setTimeout(() => {
				i = null;
				let t = n.leading ? r : c(this, e);
				for (let e of a) e(t);
				a = [];
			}, t), s ? (r = c(this, e), o(r)) : a.push(o);
		});
	};
}
async function Ge(e, t, n) {
	return await e.apply(t, n);
}
//#endregion
//#region node_modules/hookable/dist/index.mjs
function Ke(e, t = {}, n) {
	for (let r in e) {
		let i = e[r], a = n ? `${n}:${r}` : r;
		typeof i == "object" && i ? Ke(i, t, a) : typeof i == "function" && (t[a] = i);
	}
	return t;
}
var qe = { run: (e) => e() }, Je = console.createTask === void 0 ? () => qe : console.createTask;
function Ye(e, t) {
	let n = Je(t.shift());
	return e.reduce((e, r) => e.then(() => n.run(() => r(...t))), Promise.resolve());
}
function Xe(e, t) {
	let n = Je(t.shift());
	return Promise.all(e.map((e) => n.run(() => e(...t))));
}
function Ze(e, t) {
	for (let n of [...e]) n(t);
}
var Qe = class {
	constructor() {
		this._hooks = {}, this._before = void 0, this._after = void 0, this._deprecatedMessages = void 0, this._deprecatedHooks = {}, this.hook = this.hook.bind(this), this.callHook = this.callHook.bind(this), this.callHookWith = this.callHookWith.bind(this);
	}
	hook(e, t, n = {}) {
		if (!e || typeof t != "function") return () => {};
		let r = e, i;
		for (; this._deprecatedHooks[e];) i = this._deprecatedHooks[e], e = i.to;
		if (i && !n.allowDeprecated) {
			let e = i.message;
			e ||= `${r} hook has been deprecated` + (i.to ? `, please use ${i.to}` : ""), this._deprecatedMessages ||= /* @__PURE__ */ new Set(), this._deprecatedMessages.has(e) || (console.warn(e), this._deprecatedMessages.add(e));
		}
		if (!t.name) try {
			Object.defineProperty(t, "name", {
				get: () => "_" + e.replace(/\W+/g, "_") + "_hook_cb",
				configurable: !0
			});
		} catch {}
		return this._hooks[e] = this._hooks[e] || [], this._hooks[e].push(t), () => {
			t &&= (this.removeHook(e, t), void 0);
		};
	}
	hookOnce(e, t) {
		let n, r = (...e) => (typeof n == "function" && n(), n = void 0, r = void 0, t(...e));
		return n = this.hook(e, r), n;
	}
	removeHook(e, t) {
		if (this._hooks[e]) {
			let n = this._hooks[e].indexOf(t);
			n !== -1 && this._hooks[e].splice(n, 1), this._hooks[e].length === 0 && delete this._hooks[e];
		}
	}
	deprecateHook(e, t) {
		this._deprecatedHooks[e] = typeof t == "string" ? { to: t } : t;
		let n = this._hooks[e] || [];
		delete this._hooks[e];
		for (let t of n) this.hook(e, t);
	}
	deprecateHooks(e) {
		Object.assign(this._deprecatedHooks, e);
		for (let t in e) this.deprecateHook(t, e[t]);
	}
	addHooks(e) {
		let t = Ke(e), n = Object.keys(t).map((e) => this.hook(e, t[e]));
		return () => {
			for (let e of n.splice(0, n.length)) e();
		};
	}
	removeHooks(e) {
		let t = Ke(e);
		for (let e in t) this.removeHook(e, t[e]);
	}
	removeAllHooks() {
		for (let e in this._hooks) delete this._hooks[e];
	}
	callHook(e, ...t) {
		return t.unshift(e), this.callHookWith(Ye, e, ...t);
	}
	callHookParallel(e, ...t) {
		return t.unshift(e), this.callHookWith(Xe, e, ...t);
	}
	callHookWith(e, t, ...n) {
		let r = this._before || this._after ? {
			name: t,
			args: n,
			context: {}
		} : void 0;
		this._before && Ze(this._before, r);
		let i = e(t in this._hooks ? [...this._hooks[t]] : [], n);
		return i instanceof Promise ? i.finally(() => {
			this._after && r && Ze(this._after, r);
		}) : (this._after && r && Ze(this._after, r), i);
	}
	beforeEach(e) {
		return this._before = this._before || [], this._before.push(e), () => {
			if (this._before !== void 0) {
				let t = this._before.indexOf(e);
				t !== -1 && this._before.splice(t, 1);
			}
		};
	}
	afterEach(e) {
		return this._after = this._after || [], this._after.push(e), () => {
			if (this._after !== void 0) {
				let t = this._after.indexOf(e);
				t !== -1 && this._after.splice(t, 1);
			}
		};
	}
};
function $e() {
	return new Qe();
}
//#endregion
//#region node_modules/@vue/devtools-kit/dist/index.js
var et = Object.create, tt = Object.defineProperty, nt = Object.getOwnPropertyDescriptor, rt = Object.getOwnPropertyNames, it = Object.getPrototypeOf, at = Object.prototype.hasOwnProperty, ot = (e, t) => function() {
	return e && (t = (0, e[rt(e)[0]])(e = 0)), t;
}, st = (e, t) => function() {
	return t || (0, e[rt(e)[0]])((t = { exports: {} }).exports, t), t.exports;
}, ct = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (let i of rt(t)) !at.call(e, i) && i !== n && tt(e, i, {
		get: () => t[i],
		enumerable: !(r = nt(t, i)) || r.enumerable
	});
	return e;
}, lt = (e, t, n) => (n = e == null ? {} : et(it(e)), ct(t || !e || !e.__esModule ? tt(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), W = ot({ "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {} }), ut = st({ "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/lib/speakingurl.js"(e, t) {
	W(), (function(e) {
		var n = {
			À: "A",
			Á: "A",
			Â: "A",
			Ã: "A",
			Ä: "Ae",
			Å: "A",
			Æ: "AE",
			Ç: "C",
			È: "E",
			É: "E",
			Ê: "E",
			Ë: "E",
			Ì: "I",
			Í: "I",
			Î: "I",
			Ï: "I",
			Ð: "D",
			Ñ: "N",
			Ò: "O",
			Ó: "O",
			Ô: "O",
			Õ: "O",
			Ö: "Oe",
			Ő: "O",
			Ø: "O",
			Ù: "U",
			Ú: "U",
			Û: "U",
			Ü: "Ue",
			Ű: "U",
			Ý: "Y",
			Þ: "TH",
			ß: "ss",
			à: "a",
			á: "a",
			â: "a",
			ã: "a",
			ä: "ae",
			å: "a",
			æ: "ae",
			ç: "c",
			è: "e",
			é: "e",
			ê: "e",
			ë: "e",
			ì: "i",
			í: "i",
			î: "i",
			ï: "i",
			ð: "d",
			ñ: "n",
			ò: "o",
			ó: "o",
			ô: "o",
			õ: "o",
			ö: "oe",
			ő: "o",
			ø: "o",
			ù: "u",
			ú: "u",
			û: "u",
			ü: "ue",
			ű: "u",
			ý: "y",
			þ: "th",
			ÿ: "y",
			ẞ: "SS",
			ا: "a",
			أ: "a",
			إ: "i",
			آ: "aa",
			ؤ: "u",
			ئ: "e",
			ء: "a",
			ب: "b",
			ت: "t",
			ث: "th",
			ج: "j",
			ح: "h",
			خ: "kh",
			د: "d",
			ذ: "th",
			ر: "r",
			ز: "z",
			س: "s",
			ش: "sh",
			ص: "s",
			ض: "dh",
			ط: "t",
			ظ: "z",
			ع: "a",
			غ: "gh",
			ف: "f",
			ق: "q",
			ك: "k",
			ل: "l",
			م: "m",
			ن: "n",
			ه: "h",
			و: "w",
			ي: "y",
			ى: "a",
			ة: "h",
			ﻻ: "la",
			ﻷ: "laa",
			ﻹ: "lai",
			ﻵ: "laa",
			گ: "g",
			چ: "ch",
			پ: "p",
			ژ: "zh",
			ک: "k",
			ی: "y",
			"َ": "a",
			"ً": "an",
			"ِ": "e",
			"ٍ": "en",
			"ُ": "u",
			"ٌ": "on",
			"ْ": "",
			"٠": "0",
			"١": "1",
			"٢": "2",
			"٣": "3",
			"٤": "4",
			"٥": "5",
			"٦": "6",
			"٧": "7",
			"٨": "8",
			"٩": "9",
			"۰": "0",
			"۱": "1",
			"۲": "2",
			"۳": "3",
			"۴": "4",
			"۵": "5",
			"۶": "6",
			"۷": "7",
			"۸": "8",
			"۹": "9",
			က: "k",
			ခ: "kh",
			ဂ: "g",
			ဃ: "ga",
			င: "ng",
			စ: "s",
			ဆ: "sa",
			ဇ: "z",
			စျ: "za",
			ည: "ny",
			ဋ: "t",
			ဌ: "ta",
			ဍ: "d",
			ဎ: "da",
			ဏ: "na",
			တ: "t",
			ထ: "ta",
			ဒ: "d",
			ဓ: "da",
			န: "n",
			ပ: "p",
			ဖ: "pa",
			ဗ: "b",
			ဘ: "ba",
			မ: "m",
			ယ: "y",
			ရ: "ya",
			လ: "l",
			ဝ: "w",
			သ: "th",
			ဟ: "h",
			ဠ: "la",
			အ: "a",
			"ြ": "y",
			"ျ": "ya",
			"ွ": "w",
			"ြွ": "yw",
			"ျွ": "ywa",
			"ှ": "h",
			ဧ: "e",
			"၏": "-e",
			ဣ: "i",
			ဤ: "-i",
			ဉ: "u",
			ဦ: "-u",
			ဩ: "aw",
			သြော: "aw",
			ဪ: "aw",
			"၀": "0",
			"၁": "1",
			"၂": "2",
			"၃": "3",
			"၄": "4",
			"၅": "5",
			"၆": "6",
			"၇": "7",
			"၈": "8",
			"၉": "9",
			"္": "",
			"့": "",
			"း": "",
			č: "c",
			ď: "d",
			ě: "e",
			ň: "n",
			ř: "r",
			š: "s",
			ť: "t",
			ů: "u",
			ž: "z",
			Č: "C",
			Ď: "D",
			Ě: "E",
			Ň: "N",
			Ř: "R",
			Š: "S",
			Ť: "T",
			Ů: "U",
			Ž: "Z",
			ހ: "h",
			ށ: "sh",
			ނ: "n",
			ރ: "r",
			ބ: "b",
			ޅ: "lh",
			ކ: "k",
			އ: "a",
			ވ: "v",
			މ: "m",
			ފ: "f",
			ދ: "dh",
			ތ: "th",
			ލ: "l",
			ގ: "g",
			ޏ: "gn",
			ސ: "s",
			ޑ: "d",
			ޒ: "z",
			ޓ: "t",
			ޔ: "y",
			ޕ: "p",
			ޖ: "j",
			ޗ: "ch",
			ޘ: "tt",
			ޙ: "hh",
			ޚ: "kh",
			ޛ: "th",
			ޜ: "z",
			ޝ: "sh",
			ޞ: "s",
			ޟ: "d",
			ޠ: "t",
			ޡ: "z",
			ޢ: "a",
			ޣ: "gh",
			ޤ: "q",
			ޥ: "w",
			"ަ": "a",
			"ާ": "aa",
			"ި": "i",
			"ީ": "ee",
			"ު": "u",
			"ޫ": "oo",
			"ެ": "e",
			"ޭ": "ey",
			"ޮ": "o",
			"ޯ": "oa",
			"ް": "",
			ა: "a",
			ბ: "b",
			გ: "g",
			დ: "d",
			ე: "e",
			ვ: "v",
			ზ: "z",
			თ: "t",
			ი: "i",
			კ: "k",
			ლ: "l",
			მ: "m",
			ნ: "n",
			ო: "o",
			პ: "p",
			ჟ: "zh",
			რ: "r",
			ს: "s",
			ტ: "t",
			უ: "u",
			ფ: "p",
			ქ: "k",
			ღ: "gh",
			ყ: "q",
			შ: "sh",
			ჩ: "ch",
			ც: "ts",
			ძ: "dz",
			წ: "ts",
			ჭ: "ch",
			ხ: "kh",
			ჯ: "j",
			ჰ: "h",
			α: "a",
			β: "v",
			γ: "g",
			δ: "d",
			ε: "e",
			ζ: "z",
			η: "i",
			θ: "th",
			ι: "i",
			κ: "k",
			λ: "l",
			μ: "m",
			ν: "n",
			ξ: "ks",
			ο: "o",
			π: "p",
			ρ: "r",
			σ: "s",
			τ: "t",
			υ: "y",
			φ: "f",
			χ: "x",
			ψ: "ps",
			ω: "o",
			ά: "a",
			έ: "e",
			ί: "i",
			ό: "o",
			ύ: "y",
			ή: "i",
			ώ: "o",
			ς: "s",
			ϊ: "i",
			ΰ: "y",
			ϋ: "y",
			ΐ: "i",
			Α: "A",
			Β: "B",
			Γ: "G",
			Δ: "D",
			Ε: "E",
			Ζ: "Z",
			Η: "I",
			Θ: "TH",
			Ι: "I",
			Κ: "K",
			Λ: "L",
			Μ: "M",
			Ν: "N",
			Ξ: "KS",
			Ο: "O",
			Π: "P",
			Ρ: "R",
			Σ: "S",
			Τ: "T",
			Υ: "Y",
			Φ: "F",
			Χ: "X",
			Ψ: "PS",
			Ω: "O",
			Ά: "A",
			Έ: "E",
			Ί: "I",
			Ό: "O",
			Ύ: "Y",
			Ή: "I",
			Ώ: "O",
			Ϊ: "I",
			Ϋ: "Y",
			ā: "a",
			ē: "e",
			ģ: "g",
			ī: "i",
			ķ: "k",
			ļ: "l",
			ņ: "n",
			ū: "u",
			Ā: "A",
			Ē: "E",
			Ģ: "G",
			Ī: "I",
			Ķ: "k",
			Ļ: "L",
			Ņ: "N",
			Ū: "U",
			Ќ: "Kj",
			ќ: "kj",
			Љ: "Lj",
			љ: "lj",
			Њ: "Nj",
			њ: "nj",
			Тс: "Ts",
			тс: "ts",
			ą: "a",
			ć: "c",
			ę: "e",
			ł: "l",
			ń: "n",
			ś: "s",
			ź: "z",
			ż: "z",
			Ą: "A",
			Ć: "C",
			Ę: "E",
			Ł: "L",
			Ń: "N",
			Ś: "S",
			Ź: "Z",
			Ż: "Z",
			Є: "Ye",
			І: "I",
			Ї: "Yi",
			Ґ: "G",
			є: "ye",
			і: "i",
			ї: "yi",
			ґ: "g",
			ă: "a",
			Ă: "A",
			ș: "s",
			Ș: "S",
			ț: "t",
			Ț: "T",
			ţ: "t",
			Ţ: "T",
			а: "a",
			б: "b",
			в: "v",
			г: "g",
			д: "d",
			е: "e",
			ё: "yo",
			ж: "zh",
			з: "z",
			и: "i",
			й: "i",
			к: "k",
			л: "l",
			м: "m",
			н: "n",
			о: "o",
			п: "p",
			р: "r",
			с: "s",
			т: "t",
			у: "u",
			ф: "f",
			х: "kh",
			ц: "c",
			ч: "ch",
			ш: "sh",
			щ: "sh",
			ъ: "",
			ы: "y",
			ь: "",
			э: "e",
			ю: "yu",
			я: "ya",
			А: "A",
			Б: "B",
			В: "V",
			Г: "G",
			Д: "D",
			Е: "E",
			Ё: "Yo",
			Ж: "Zh",
			З: "Z",
			И: "I",
			Й: "I",
			К: "K",
			Л: "L",
			М: "M",
			Н: "N",
			О: "O",
			П: "P",
			Р: "R",
			С: "S",
			Т: "T",
			У: "U",
			Ф: "F",
			Х: "Kh",
			Ц: "C",
			Ч: "Ch",
			Ш: "Sh",
			Щ: "Sh",
			Ъ: "",
			Ы: "Y",
			Ь: "",
			Э: "E",
			Ю: "Yu",
			Я: "Ya",
			ђ: "dj",
			ј: "j",
			ћ: "c",
			џ: "dz",
			Ђ: "Dj",
			Ј: "j",
			Ћ: "C",
			Џ: "Dz",
			ľ: "l",
			ĺ: "l",
			ŕ: "r",
			Ľ: "L",
			Ĺ: "L",
			Ŕ: "R",
			ş: "s",
			Ş: "S",
			ı: "i",
			İ: "I",
			ğ: "g",
			Ğ: "G",
			ả: "a",
			Ả: "A",
			ẳ: "a",
			Ẳ: "A",
			ẩ: "a",
			Ẩ: "A",
			đ: "d",
			Đ: "D",
			ẹ: "e",
			Ẹ: "E",
			ẽ: "e",
			Ẽ: "E",
			ẻ: "e",
			Ẻ: "E",
			ế: "e",
			Ế: "E",
			ề: "e",
			Ề: "E",
			ệ: "e",
			Ệ: "E",
			ễ: "e",
			Ễ: "E",
			ể: "e",
			Ể: "E",
			ỏ: "o",
			ọ: "o",
			Ọ: "o",
			ố: "o",
			Ố: "O",
			ồ: "o",
			Ồ: "O",
			ổ: "o",
			Ổ: "O",
			ộ: "o",
			Ộ: "O",
			ỗ: "o",
			Ỗ: "O",
			ơ: "o",
			Ơ: "O",
			ớ: "o",
			Ớ: "O",
			ờ: "o",
			Ờ: "O",
			ợ: "o",
			Ợ: "O",
			ỡ: "o",
			Ỡ: "O",
			Ở: "o",
			ở: "o",
			ị: "i",
			Ị: "I",
			ĩ: "i",
			Ĩ: "I",
			ỉ: "i",
			Ỉ: "i",
			ủ: "u",
			Ủ: "U",
			ụ: "u",
			Ụ: "U",
			ũ: "u",
			Ũ: "U",
			ư: "u",
			Ư: "U",
			ứ: "u",
			Ứ: "U",
			ừ: "u",
			Ừ: "U",
			ự: "u",
			Ự: "U",
			ữ: "u",
			Ữ: "U",
			ử: "u",
			Ử: "ư",
			ỷ: "y",
			Ỷ: "y",
			ỳ: "y",
			Ỳ: "Y",
			ỵ: "y",
			Ỵ: "Y",
			ỹ: "y",
			Ỹ: "Y",
			ạ: "a",
			Ạ: "A",
			ấ: "a",
			Ấ: "A",
			ầ: "a",
			Ầ: "A",
			ậ: "a",
			Ậ: "A",
			ẫ: "a",
			Ẫ: "A",
			ắ: "a",
			Ắ: "A",
			ằ: "a",
			Ằ: "A",
			ặ: "a",
			Ặ: "A",
			ẵ: "a",
			Ẵ: "A",
			"⓪": "0",
			"①": "1",
			"②": "2",
			"③": "3",
			"④": "4",
			"⑤": "5",
			"⑥": "6",
			"⑦": "7",
			"⑧": "8",
			"⑨": "9",
			"⑩": "10",
			"⑪": "11",
			"⑫": "12",
			"⑬": "13",
			"⑭": "14",
			"⑮": "15",
			"⑯": "16",
			"⑰": "17",
			"⑱": "18",
			"⑲": "18",
			"⑳": "18",
			"⓵": "1",
			"⓶": "2",
			"⓷": "3",
			"⓸": "4",
			"⓹": "5",
			"⓺": "6",
			"⓻": "7",
			"⓼": "8",
			"⓽": "9",
			"⓾": "10",
			"⓿": "0",
			"⓫": "11",
			"⓬": "12",
			"⓭": "13",
			"⓮": "14",
			"⓯": "15",
			"⓰": "16",
			"⓱": "17",
			"⓲": "18",
			"⓳": "19",
			"⓴": "20",
			"Ⓐ": "A",
			"Ⓑ": "B",
			"Ⓒ": "C",
			"Ⓓ": "D",
			"Ⓔ": "E",
			"Ⓕ": "F",
			"Ⓖ": "G",
			"Ⓗ": "H",
			"Ⓘ": "I",
			"Ⓙ": "J",
			"Ⓚ": "K",
			"Ⓛ": "L",
			"Ⓜ": "M",
			"Ⓝ": "N",
			"Ⓞ": "O",
			"Ⓟ": "P",
			"Ⓠ": "Q",
			"Ⓡ": "R",
			"Ⓢ": "S",
			"Ⓣ": "T",
			"Ⓤ": "U",
			"Ⓥ": "V",
			"Ⓦ": "W",
			"Ⓧ": "X",
			"Ⓨ": "Y",
			"Ⓩ": "Z",
			"ⓐ": "a",
			"ⓑ": "b",
			"ⓒ": "c",
			"ⓓ": "d",
			"ⓔ": "e",
			"ⓕ": "f",
			"ⓖ": "g",
			"ⓗ": "h",
			"ⓘ": "i",
			"ⓙ": "j",
			"ⓚ": "k",
			"ⓛ": "l",
			"ⓜ": "m",
			"ⓝ": "n",
			"ⓞ": "o",
			"ⓟ": "p",
			"ⓠ": "q",
			"ⓡ": "r",
			"ⓢ": "s",
			"ⓣ": "t",
			"ⓤ": "u",
			"ⓦ": "v",
			"ⓥ": "w",
			"ⓧ": "x",
			"ⓨ": "y",
			"ⓩ": "z",
			"“": "\"",
			"”": "\"",
			"‘": "'",
			"’": "'",
			"∂": "d",
			ƒ: "f",
			"™": "(TM)",
			"©": "(C)",
			œ: "oe",
			Œ: "OE",
			"®": "(R)",
			"†": "+",
			"℠": "(SM)",
			"…": "...",
			"˚": "o",
			º: "o",
			ª: "a",
			"•": "*",
			"၊": ",",
			"။": ".",
			$: "USD",
			"€": "EUR",
			"₢": "BRN",
			"₣": "FRF",
			"£": "GBP",
			"₤": "ITL",
			"₦": "NGN",
			"₧": "ESP",
			"₩": "KRW",
			"₪": "ILS",
			"₫": "VND",
			"₭": "LAK",
			"₮": "MNT",
			"₯": "GRD",
			"₱": "ARS",
			"₲": "PYG",
			"₳": "ARA",
			"₴": "UAH",
			"₵": "GHS",
			"¢": "cent",
			"¥": "CNY",
			元: "CNY",
			円: "YEN",
			"﷼": "IRR",
			"₠": "EWE",
			"฿": "THB",
			"₨": "INR",
			"₹": "INR",
			"₰": "PF",
			"₺": "TRY",
			"؋": "AFN",
			"₼": "AZN",
			лв: "BGN",
			"៛": "KHR",
			"₡": "CRC",
			"₸": "KZT",
			ден: "MKD",
			zł: "PLN",
			"₽": "RUB",
			"₾": "GEL"
		}, r = ["်", "ް"], i = {
			"ာ": "a",
			"ါ": "a",
			"ေ": "e",
			"ဲ": "e",
			"ိ": "i",
			"ီ": "i",
			"ို": "o",
			"ု": "u",
			"ူ": "u",
			"ေါင်": "aung",
			"ော": "aw",
			"ော်": "aw",
			"ေါ": "aw",
			"ေါ်": "aw",
			"်": "်",
			က်: "et",
			"ိုက်": "aik",
			"ောက်": "auk",
			င်: "in",
			"ိုင်": "aing",
			"ောင်": "aung",
			စ်: "it",
			ည်: "i",
			တ်: "at",
			"ိတ်": "eik",
			"ုတ်": "ok",
			"ွတ်": "ut",
			"ေတ်": "it",
			ဒ်: "d",
			"ိုဒ်": "ok",
			"ုဒ်": "ait",
			န်: "an",
			"ာန်": "an",
			"ိန်": "ein",
			"ုန်": "on",
			"ွန်": "un",
			ပ်: "at",
			"ိပ်": "eik",
			"ုပ်": "ok",
			"ွပ်": "ut",
			န်ုပ်: "nub",
			မ်: "an",
			"ိမ်": "ein",
			"ုမ်": "on",
			"ွမ်": "un",
			ယ်: "e",
			"ိုလ်": "ol",
			ဉ်: "in",
			"ံ": "an",
			"ိံ": "ein",
			"ုံ": "on",
			"ައް": "ah",
			"ަށް": "ah"
		}, a = {
			en: {},
			az: {
				ç: "c",
				ə: "e",
				ğ: "g",
				ı: "i",
				ö: "o",
				ş: "s",
				ü: "u",
				Ç: "C",
				Ə: "E",
				Ğ: "G",
				İ: "I",
				Ö: "O",
				Ş: "S",
				Ü: "U"
			},
			cs: {
				č: "c",
				ď: "d",
				ě: "e",
				ň: "n",
				ř: "r",
				š: "s",
				ť: "t",
				ů: "u",
				ž: "z",
				Č: "C",
				Ď: "D",
				Ě: "E",
				Ň: "N",
				Ř: "R",
				Š: "S",
				Ť: "T",
				Ů: "U",
				Ž: "Z"
			},
			fi: {
				ä: "a",
				Ä: "A",
				ö: "o",
				Ö: "O"
			},
			hu: {
				ä: "a",
				Ä: "A",
				ö: "o",
				Ö: "O",
				ü: "u",
				Ü: "U",
				ű: "u",
				Ű: "U"
			},
			lt: {
				ą: "a",
				č: "c",
				ę: "e",
				ė: "e",
				į: "i",
				š: "s",
				ų: "u",
				ū: "u",
				ž: "z",
				Ą: "A",
				Č: "C",
				Ę: "E",
				Ė: "E",
				Į: "I",
				Š: "S",
				Ų: "U",
				Ū: "U"
			},
			lv: {
				ā: "a",
				č: "c",
				ē: "e",
				ģ: "g",
				ī: "i",
				ķ: "k",
				ļ: "l",
				ņ: "n",
				š: "s",
				ū: "u",
				ž: "z",
				Ā: "A",
				Č: "C",
				Ē: "E",
				Ģ: "G",
				Ī: "i",
				Ķ: "k",
				Ļ: "L",
				Ņ: "N",
				Š: "S",
				Ū: "u",
				Ž: "Z"
			},
			pl: {
				ą: "a",
				ć: "c",
				ę: "e",
				ł: "l",
				ń: "n",
				ó: "o",
				ś: "s",
				ź: "z",
				ż: "z",
				Ą: "A",
				Ć: "C",
				Ę: "e",
				Ł: "L",
				Ń: "N",
				Ó: "O",
				Ś: "S",
				Ź: "Z",
				Ż: "Z"
			},
			sv: {
				ä: "a",
				Ä: "A",
				ö: "o",
				Ö: "O"
			},
			sk: {
				ä: "a",
				Ä: "A"
			},
			sr: {
				љ: "lj",
				њ: "nj",
				Љ: "Lj",
				Њ: "Nj",
				đ: "dj",
				Đ: "Dj"
			},
			tr: {
				Ü: "U",
				Ö: "O",
				ü: "u",
				ö: "o"
			}
		}, o = {
			ar: {
				"∆": "delta",
				"∞": "la-nihaya",
				"♥": "hob",
				"&": "wa",
				"|": "aw",
				"<": "aqal-men",
				">": "akbar-men",
				"∑": "majmou",
				"¤": "omla"
			},
			az: {},
			ca: {
				"∆": "delta",
				"∞": "infinit",
				"♥": "amor",
				"&": "i",
				"|": "o",
				"<": "menys que",
				">": "mes que",
				"∑": "suma dels",
				"¤": "moneda"
			},
			cs: {
				"∆": "delta",
				"∞": "nekonecno",
				"♥": "laska",
				"&": "a",
				"|": "nebo",
				"<": "mensi nez",
				">": "vetsi nez",
				"∑": "soucet",
				"¤": "mena"
			},
			de: {
				"∆": "delta",
				"∞": "unendlich",
				"♥": "Liebe",
				"&": "und",
				"|": "oder",
				"<": "kleiner als",
				">": "groesser als",
				"∑": "Summe von",
				"¤": "Waehrung"
			},
			dv: {
				"∆": "delta",
				"∞": "kolunulaa",
				"♥": "loabi",
				"&": "aai",
				"|": "noonee",
				"<": "ah vure kuda",
				">": "ah vure bodu",
				"∑": "jumula",
				"¤": "faisaa"
			},
			en: {
				"∆": "delta",
				"∞": "infinity",
				"♥": "love",
				"&": "and",
				"|": "or",
				"<": "less than",
				">": "greater than",
				"∑": "sum",
				"¤": "currency"
			},
			es: {
				"∆": "delta",
				"∞": "infinito",
				"♥": "amor",
				"&": "y",
				"|": "u",
				"<": "menos que",
				">": "mas que",
				"∑": "suma de los",
				"¤": "moneda"
			},
			fa: {
				"∆": "delta",
				"∞": "bi-nahayat",
				"♥": "eshgh",
				"&": "va",
				"|": "ya",
				"<": "kamtar-az",
				">": "bishtar-az",
				"∑": "majmooe",
				"¤": "vahed"
			},
			fi: {
				"∆": "delta",
				"∞": "aarettomyys",
				"♥": "rakkaus",
				"&": "ja",
				"|": "tai",
				"<": "pienempi kuin",
				">": "suurempi kuin",
				"∑": "summa",
				"¤": "valuutta"
			},
			fr: {
				"∆": "delta",
				"∞": "infiniment",
				"♥": "Amour",
				"&": "et",
				"|": "ou",
				"<": "moins que",
				">": "superieure a",
				"∑": "somme des",
				"¤": "monnaie"
			},
			ge: {
				"∆": "delta",
				"∞": "usasruloba",
				"♥": "siqvaruli",
				"&": "da",
				"|": "an",
				"<": "naklebi",
				">": "meti",
				"∑": "jami",
				"¤": "valuta"
			},
			gr: {},
			hu: {
				"∆": "delta",
				"∞": "vegtelen",
				"♥": "szerelem",
				"&": "es",
				"|": "vagy",
				"<": "kisebb mint",
				">": "nagyobb mint",
				"∑": "szumma",
				"¤": "penznem"
			},
			it: {
				"∆": "delta",
				"∞": "infinito",
				"♥": "amore",
				"&": "e",
				"|": "o",
				"<": "minore di",
				">": "maggiore di",
				"∑": "somma",
				"¤": "moneta"
			},
			lt: {
				"∆": "delta",
				"∞": "begalybe",
				"♥": "meile",
				"&": "ir",
				"|": "ar",
				"<": "maziau nei",
				">": "daugiau nei",
				"∑": "suma",
				"¤": "valiuta"
			},
			lv: {
				"∆": "delta",
				"∞": "bezgaliba",
				"♥": "milestiba",
				"&": "un",
				"|": "vai",
				"<": "mazak neka",
				">": "lielaks neka",
				"∑": "summa",
				"¤": "valuta"
			},
			my: {
				"∆": "kwahkhyaet",
				"∞": "asaonasme",
				"♥": "akhyait",
				"&": "nhin",
				"|": "tho",
				"<": "ngethaw",
				">": "kyithaw",
				"∑": "paungld",
				"¤": "ngwekye"
			},
			mk: {},
			nl: {
				"∆": "delta",
				"∞": "oneindig",
				"♥": "liefde",
				"&": "en",
				"|": "of",
				"<": "kleiner dan",
				">": "groter dan",
				"∑": "som",
				"¤": "valuta"
			},
			pl: {
				"∆": "delta",
				"∞": "nieskonczonosc",
				"♥": "milosc",
				"&": "i",
				"|": "lub",
				"<": "mniejsze niz",
				">": "wieksze niz",
				"∑": "suma",
				"¤": "waluta"
			},
			pt: {
				"∆": "delta",
				"∞": "infinito",
				"♥": "amor",
				"&": "e",
				"|": "ou",
				"<": "menor que",
				">": "maior que",
				"∑": "soma",
				"¤": "moeda"
			},
			ro: {
				"∆": "delta",
				"∞": "infinit",
				"♥": "dragoste",
				"&": "si",
				"|": "sau",
				"<": "mai mic ca",
				">": "mai mare ca",
				"∑": "suma",
				"¤": "valuta"
			},
			ru: {
				"∆": "delta",
				"∞": "beskonechno",
				"♥": "lubov",
				"&": "i",
				"|": "ili",
				"<": "menshe",
				">": "bolshe",
				"∑": "summa",
				"¤": "valjuta"
			},
			sk: {
				"∆": "delta",
				"∞": "nekonecno",
				"♥": "laska",
				"&": "a",
				"|": "alebo",
				"<": "menej ako",
				">": "viac ako",
				"∑": "sucet",
				"¤": "mena"
			},
			sr: {},
			tr: {
				"∆": "delta",
				"∞": "sonsuzluk",
				"♥": "ask",
				"&": "ve",
				"|": "veya",
				"<": "kucuktur",
				">": "buyuktur",
				"∑": "toplam",
				"¤": "para birimi"
			},
			uk: {
				"∆": "delta",
				"∞": "bezkinechnist",
				"♥": "lubov",
				"&": "i",
				"|": "abo",
				"<": "menshe",
				">": "bilshe",
				"∑": "suma",
				"¤": "valjuta"
			},
			vn: {
				"∆": "delta",
				"∞": "vo cuc",
				"♥": "yeu",
				"&": "va",
				"|": "hoac",
				"<": "nho hon",
				">": "lon hon",
				"∑": "tong",
				"¤": "tien te"
			}
		}, s = [
			";",
			"?",
			":",
			"@",
			"&",
			"=",
			"+",
			"$",
			",",
			"/"
		].join(""), c = [
			";",
			"?",
			":",
			"@",
			"&",
			"=",
			"+",
			"$",
			","
		].join(""), l = [
			".",
			"!",
			"~",
			"*",
			"'",
			"(",
			")"
		].join(""), u = function(e, t) {
			var u = "-", d = "", m = "", h = !0, g = {}, _, v, y, b, x, S, C, w, T, E, D, O, k, A, j = "";
			if (typeof e != "string") return "";
			if (typeof t == "string" && (u = t), C = o.en, w = a.en, typeof t == "object") for (D in _ = t.maintainCase || !1, g = t.custom && typeof t.custom == "object" ? t.custom : g, y = +t.truncate > 1 && t.truncate || !1, b = t.uric || !1, x = t.uricNoSlash || !1, S = t.mark || !1, h = !(t.symbols === !1 || t.lang === !1), u = t.separator || u, b && (j += s), x && (j += c), S && (j += l), C = t.lang && o[t.lang] && h ? o[t.lang] : h ? o.en : {}, w = t.lang && a[t.lang] ? a[t.lang] : t.lang === !1 || t.lang === !0 ? {} : a.en, t.titleCase && typeof t.titleCase.length == "number" && Array.prototype.toString.call(t.titleCase) ? (t.titleCase.forEach(function(e) {
				g[e + ""] = e + "";
			}), v = !0) : v = !!t.titleCase, t.custom && typeof t.custom.length == "number" && Array.prototype.toString.call(t.custom) && t.custom.forEach(function(e) {
				g[e + ""] = e + "";
			}), Object.keys(g).forEach(function(t) {
				var n = t.length > 1 ? RegExp("\\b" + f(t) + "\\b", "gi") : new RegExp(f(t), "gi");
				e = e.replace(n, g[t]);
			}), g) j += D;
			for (j += u, j = f(j), e = e.replace(/(^\s+|\s+$)/g, ""), k = !1, A = !1, E = 0, O = e.length; E < O; E++) D = e[E], p(D, g) ? k = !1 : w[D] ? (D = k && w[D].match(/[A-Za-z0-9]/) ? " " + w[D] : w[D], k = !1) : D in n ? (E + 1 < O && r.indexOf(e[E + 1]) >= 0 ? (m += D, D = "") : A === !0 ? (D = i[m] + n[D], m = "") : D = k && n[D].match(/[A-Za-z0-9]/) ? " " + n[D] : n[D], k = !1, A = !1) : D in i ? (m += D, D = "", E === O - 1 && (D = i[m]), A = !0) : C[D] && !(b && s.indexOf(D) !== -1) && !(x && c.indexOf(D) !== -1) ? (D = k || d.substr(-1).match(/[A-Za-z0-9]/) ? u + C[D] : C[D], D += e[E + 1] !== void 0 && e[E + 1].match(/[A-Za-z0-9]/) ? u : "", k = !0) : (A === !0 ? (D = i[m] + D, m = "", A = !1) : k && (/[A-Za-z0-9]/.test(D) || d.substr(-1).match(/A-Za-z0-9]/)) && (D = " " + D), k = !1), d += D.replace(RegExp("[^\\w\\s" + j + "_-]", "g"), u);
			return v && (d = d.replace(/(\w)(\S*)/g, function(e, t, n) {
				var r = t.toUpperCase() + (n === null ? "" : n);
				return Object.keys(g).indexOf(r.toLowerCase()) < 0 ? r : r.toLowerCase();
			})), d = d.replace(/\s+/g, u).replace(RegExp("\\" + u + "+", "g"), u).replace(RegExp("(^\\" + u + "+|\\" + u + "+$)", "g"), ""), y && d.length > y && (T = d.charAt(y) === u, d = d.slice(0, y), T || (d = d.slice(0, d.lastIndexOf(u)))), !_ && !v && (d = d.toLowerCase()), d;
		}, d = function(e) {
			return function(t) {
				return u(t, e);
			};
		}, f = function(e) {
			return e.replace(/[-\\^$*+?.()|[\]{}\/]/g, "\\$&");
		}, p = function(e, t) {
			for (var n in t) if (t[n] === e) return !0;
		};
		if (t !== void 0 && t.exports) t.exports = u, t.exports.createSlug = d;
		else if (typeof define < "u" && define.amd) define([], function() {
			return u;
		});
		else try {
			if (e.getSlug || e.createSlug) throw "speakingurl: globals exists /(getSlug|createSlug)/";
			e.getSlug = u, e.createSlug = d;
		} catch {}
	})(e);
} }), dt = st({ "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/index.js"(e, t) {
	W(), t.exports = ut();
} });
W(), W(), W(), W(), W(), W(), W(), W();
function ft(e) {
	let t = e.name || e._componentTag || e.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ || e.__name;
	return t === "index" && e.__file?.endsWith("index.vue") ? "" : t;
}
function pt(e) {
	let t = e.__file;
	if (t) return Be(Ve(t, ".vue"));
}
function mt(e, t) {
	return e.type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ = t, t;
}
function ht(e) {
	if (e.__VUE_DEVTOOLS_NEXT_APP_RECORD__) return e.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
	if (e.root) return e.appContext.app.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
}
function gt(e) {
	let t = e.subTree?.type, n = ht(e);
	return n ? n?.types?.Fragment === t : !1;
}
function _t(e) {
	let t = ft(e?.type || {});
	if (t) return t;
	if (e?.root === e) return "Root";
	for (let t in e.parent?.type?.components) if (e.parent.type.components[t] === e?.type) return mt(e, t);
	for (let t in e.appContext?.components) if (e.appContext.components[t] === e?.type) return mt(e, t);
	return pt(e?.type || {}) || "Anonymous Component";
}
function vt(e) {
	return `${e?.appContext?.app?.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__ ?? 0}:${e === e?.root ? "root" : e.uid}`;
}
function yt(e, t) {
	return t ||= `${e.id}:root`, e.instanceMap.get(t) || e.instanceMap.get(":root");
}
function bt() {
	let e = {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		get width() {
			return e.right - e.left;
		},
		get height() {
			return e.bottom - e.top;
		}
	};
	return e;
}
var xt;
function St(e) {
	return xt ||= document.createRange(), xt.selectNode(e), xt.getBoundingClientRect();
}
function Ct(e) {
	let t = bt();
	if (!e.children) return t;
	for (let n = 0, r = e.children.length; n < r; n++) {
		let r = e.children[n], i;
		if (r.component) i = Et(r.component);
		else if (r.el) {
			let e = r.el;
			e.nodeType === 1 || e.getBoundingClientRect ? i = e.getBoundingClientRect() : e.nodeType === 3 && e.data.trim() && (i = St(e));
		}
		i && wt(t, i);
	}
	return t;
}
function wt(e, t) {
	return (!e.top || t.top < e.top) && (e.top = t.top), (!e.bottom || t.bottom > e.bottom) && (e.bottom = t.bottom), (!e.left || t.left < e.left) && (e.left = t.left), (!e.right || t.right > e.right) && (e.right = t.right), e;
}
var Tt = {
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	width: 0,
	height: 0
};
function Et(e) {
	let t = e.subTree.el;
	return typeof window > "u" ? Tt : gt(e) ? Ct(e.subTree) : t?.nodeType === 1 ? t?.getBoundingClientRect() : e.subTree.component ? Et(e.subTree.component) : Tt;
}
W();
function Dt(e) {
	return gt(e) ? Ot(e.subTree) : e.subTree ? [e.subTree.el] : [];
}
function Ot(e) {
	if (!e.children) return [];
	let t = [];
	return e.children.forEach((e) => {
		e.component ? t.push(...Dt(e.component)) : e?.el && t.push(e.el);
	}), t;
}
var kt = "__vue-devtools-component-inspector__", At = "__vue-devtools-component-inspector__card__", jt = "__vue-devtools-component-inspector__name__", Mt = "__vue-devtools-component-inspector__indicator__", Nt = {
	display: "block",
	zIndex: 2147483640,
	position: "fixed",
	backgroundColor: "#42b88325",
	border: "1px solid #42b88350",
	borderRadius: "5px",
	transition: "all 0.1s ease-in",
	pointerEvents: "none"
}, Pt = {
	fontFamily: "Arial, Helvetica, sans-serif",
	padding: "5px 8px",
	borderRadius: "4px",
	textAlign: "left",
	position: "absolute",
	left: 0,
	color: "#e9e9e9",
	fontSize: "14px",
	fontWeight: 600,
	lineHeight: "24px",
	backgroundColor: "#42b883",
	boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
}, Ft = {
	display: "inline-block",
	fontWeight: 400,
	fontStyle: "normal",
	fontSize: "12px",
	opacity: .7
};
function It() {
	return document.getElementById(kt);
}
function Lt() {
	return document.getElementById(At);
}
function Rt() {
	return document.getElementById(Mt);
}
function zt() {
	return document.getElementById(jt);
}
function Bt(e) {
	return {
		left: `${Math.round(e.left * 100) / 100}px`,
		top: `${Math.round(e.top * 100) / 100}px`,
		width: `${Math.round(e.width * 100) / 100}px`,
		height: `${Math.round(e.height * 100) / 100}px`
	};
}
function Vt(e) {
	let t = document.createElement("div");
	t.id = e.elementId ?? kt, Object.assign(t.style, {
		...Nt,
		...Bt(e.bounds),
		...e.style
	});
	let n = document.createElement("span");
	n.id = At, Object.assign(n.style, {
		...Pt,
		top: e.bounds.top < 35 ? 0 : "-35px"
	});
	let r = document.createElement("span");
	r.id = jt, r.innerHTML = `&lt;${e.name}&gt;&nbsp;&nbsp;`;
	let i = document.createElement("i");
	return i.id = Mt, i.innerHTML = `${Math.round(e.bounds.width * 100) / 100} x ${Math.round(e.bounds.height * 100) / 100}`, Object.assign(i.style, Ft), n.appendChild(r), n.appendChild(i), t.appendChild(n), document.body.appendChild(t), t;
}
function Ht(e) {
	let t = It(), n = Lt(), r = zt(), i = Rt();
	t && (Object.assign(t.style, {
		...Nt,
		...Bt(e.bounds)
	}), Object.assign(n.style, { top: e.bounds.top < 35 ? 0 : "-35px" }), r.innerHTML = `&lt;${e.name}&gt;&nbsp;&nbsp;`, i.innerHTML = `${Math.round(e.bounds.width * 100) / 100} x ${Math.round(e.bounds.height * 100) / 100}`);
}
function Ut(e) {
	let t = Et(e);
	if (!t.width && !t.height) return;
	let n = _t(e);
	It() ? Ht({
		bounds: t,
		name: n
	}) : Vt({
		bounds: t,
		name: n
	});
}
function Wt() {
	let e = It();
	e && (e.style.display = "none");
}
var Gt = null;
function Kt(e) {
	let t = e.target;
	if (t) {
		let e = t.__vueParentComponent;
		if (e && (Gt = e, e.vnode.el)) {
			let t = Et(e), n = _t(e);
			It() ? Ht({
				bounds: t,
				name: n
			}) : Vt({
				bounds: t,
				name: n
			});
		}
	}
}
function qt(e, t) {
	e.preventDefault(), e.stopPropagation(), Gt && t(vt(Gt));
}
var Jt = null;
function Yt() {
	Wt(), window.removeEventListener("mouseover", Kt), window.removeEventListener("click", Jt, !0), Jt = null;
}
function Xt() {
	return window.addEventListener("mouseover", Kt), new Promise((e) => {
		function t(n) {
			n.preventDefault(), n.stopPropagation(), qt(n, (n) => {
				window.removeEventListener("click", t, !0), Jt = null, window.removeEventListener("mouseover", Kt);
				let r = It();
				r && (r.style.display = "none"), e(JSON.stringify({ id: n }));
			});
		}
		Jt = t, window.addEventListener("click", t, !0);
	});
}
function Zt(e) {
	let t = yt(G.value, e.id);
	if (t) {
		let [n] = Dt(t);
		if (typeof n.scrollIntoView == "function") n.scrollIntoView({ behavior: "smooth" });
		else {
			let e = Et(t), n = document.createElement("div"), r = {
				...Bt(e),
				position: "absolute"
			};
			Object.assign(n.style, r), document.body.appendChild(n), n.scrollIntoView({ behavior: "smooth" }), setTimeout(() => {
				document.body.removeChild(n);
			}, 2e3);
		}
		setTimeout(() => {
			let n = Et(t);
			if (n.width || n.height) {
				let r = _t(t), i = It();
				i ? Ht({
					...e,
					name: r,
					bounds: n
				}) : Vt({
					...e,
					name: r,
					bounds: n
				}), setTimeout(() => {
					i && (i.style.display = "none");
				}, 1500);
			}
		}, 1200);
	}
}
W();
var Qt;
(Qt = U).__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ ?? (Qt.__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ = !0);
function $t(e) {
	let t = 0, n = setInterval(() => {
		U.__VUE_INSPECTOR__ && (clearInterval(n), t += 30, e()), t >= 5e3 && clearInterval(n);
	}, 30);
}
function en() {
	let e = U.__VUE_INSPECTOR__, t = e.openInEditor;
	e.openInEditor = async (...n) => {
		e.disable(), t(...n);
	};
}
function tn() {
	return new Promise((e) => {
		function t() {
			en(), e(U.__VUE_INSPECTOR__);
		}
		U.__VUE_INSPECTOR__ ? t() : $t(() => {
			t();
		});
	});
}
W(), W();
function nn(e) {
	return !!(e && e.__v_isReadonly);
}
function rn(e) {
	return nn(e) ? rn(e.__v_raw) : !!(e && e.__v_isReactive);
}
function an(e) {
	return !!(e && e.__v_isRef === !0);
}
function on(e) {
	let t = e && e.__v_raw;
	return t ? on(t) : e;
}
var sn = class {
	constructor() {
		this.refEditor = new cn();
	}
	set(e, t, n, r) {
		let i = Array.isArray(t) ? t : t.split(".");
		for (; i.length > 1;) {
			let t = i.shift();
			e = e instanceof Map ? e.get(t) : e instanceof Set ? Array.from(e.values())[t] : e[t], this.refEditor.isRef(e) && (e = this.refEditor.get(e));
		}
		let a = i[0], o = this.refEditor.get(e)[a];
		r ? r(e, a, n) : this.refEditor.isRef(o) ? this.refEditor.set(o, n) : e[a] = n;
	}
	get(e, t) {
		let n = Array.isArray(t) ? t : t.split(".");
		for (let t = 0; t < n.length; t++) if (e = e instanceof Map ? e.get(n[t]) : e[n[t]], this.refEditor.isRef(e) && (e = this.refEditor.get(e)), !e) return;
		return e;
	}
	has(e, t, n = !1) {
		if (e === void 0) return !1;
		let r = Array.isArray(t) ? t.slice() : t.split("."), i = n ? 2 : 1;
		for (; e && r.length > i;) {
			let t = r.shift();
			e = e[t], this.refEditor.isRef(e) && (e = this.refEditor.get(e));
		}
		return e != null && Object.prototype.hasOwnProperty.call(e, r[0]);
	}
	createDefaultSetCallback(e) {
		return (t, n, r) => {
			if ((e.remove || e.newKey) && (Array.isArray(t) ? t.splice(n, 1) : on(t) instanceof Map ? t.delete(n) : on(t) instanceof Set ? t.delete(Array.from(t.values())[n]) : Reflect.deleteProperty(t, n)), !e.remove) {
				let i = t[e.newKey || n];
				this.refEditor.isRef(i) ? this.refEditor.set(i, r) : on(t) instanceof Map ? t.set(e.newKey || n, r) : on(t) instanceof Set ? t.add(r) : t[e.newKey || n] = r;
			}
		};
	}
}, cn = class {
	set(e, t) {
		if (an(e)) e.value = t;
		else {
			if (e instanceof Set && Array.isArray(t)) {
				e.clear(), t.forEach((t) => e.add(t));
				return;
			}
			let n = Object.keys(t);
			if (e instanceof Map) {
				let r = new Set(e.keys());
				n.forEach((n) => {
					e.set(n, Reflect.get(t, n)), r.delete(n);
				}), r.forEach((t) => e.delete(t));
				return;
			}
			let r = new Set(Object.keys(e));
			n.forEach((n) => {
				Reflect.set(e, n, Reflect.get(t, n)), r.delete(n);
			}), r.forEach((t) => Reflect.deleteProperty(e, t));
		}
	}
	get(e) {
		return an(e) ? e.value : e;
	}
	isRef(e) {
		return an(e) || rn(e);
	}
};
new sn(), W(), W(), W();
var ln = "__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS_STATE__";
function un() {
	if (typeof window > "u" || !Ie || typeof localStorage > "u" || localStorage === null) return {
		recordingState: !1,
		mouseEventEnabled: !1,
		keyboardEventEnabled: !1,
		componentEventEnabled: !1,
		performanceEventEnabled: !1,
		selected: ""
	};
	let e = localStorage.getItem === void 0 ? null : localStorage.getItem(ln);
	return e ? JSON.parse(e) : {
		recordingState: !1,
		mouseEventEnabled: !1,
		keyboardEventEnabled: !1,
		componentEventEnabled: !1,
		performanceEventEnabled: !1,
		selected: ""
	};
}
W(), W(), W();
var dn;
(dn = U).__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS ?? (dn.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS = []);
var fn = new Proxy(U.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS, { get(e, t, n) {
	return Reflect.get(e, t, n);
} });
function pn(e, t) {
	K.timelineLayersState[t.id] = !1, fn.push({
		...e,
		descriptorId: t.id,
		appRecord: ht(t.app)
	});
}
var mn;
(mn = U).__VUE_DEVTOOLS_KIT_INSPECTOR__ ?? (mn.__VUE_DEVTOOLS_KIT_INSPECTOR__ = []);
var hn = new Proxy(U.__VUE_DEVTOOLS_KIT_INSPECTOR__, { get(e, t, n) {
	return Reflect.get(e, t, n);
} }), gn = We(() => {
	fr.hooks.callHook("sendInspectorToClient", vn());
});
function _n(e, t) {
	hn.push({
		options: e,
		descriptor: t,
		treeFilterPlaceholder: e.treeFilterPlaceholder ?? "Search tree...",
		stateFilterPlaceholder: e.stateFilterPlaceholder ?? "Search state...",
		treeFilter: "",
		selectedNodeId: "",
		appRecord: ht(t.app)
	}), gn();
}
function vn() {
	return hn.filter((e) => e.descriptor.app === G.value.app).filter((e) => e.descriptor.id !== "components").map((e) => {
		let t = e.descriptor, n = e.options;
		return {
			id: n.id,
			label: n.label,
			logo: t.logo,
			icon: `custom-ic-baseline-${(n?.icon)?.replace(/_/g, "-")}`,
			packageName: t.packageName,
			homepage: t.homepage,
			pluginId: t.id
		};
	});
}
function yn(e, t) {
	return hn.find((n) => n.options.id === e && (t ? n.descriptor.app === t : !0));
}
function bn() {
	let e = $e();
	e.hook("addInspector", ({ inspector: e, plugin: t }) => {
		_n(e, t.descriptor);
	});
	let t = We(async ({ inspectorId: t, plugin: n }) => {
		if (!t || !n?.descriptor?.app || K.highPerfModeEnabled) return;
		let r = yn(t, n.descriptor.app), i = {
			app: n.descriptor.app,
			inspectorId: t,
			filter: r?.treeFilter || "",
			rootNodes: []
		};
		await new Promise((t) => {
			e.callHookWith(async (e) => {
				await Promise.all(e.map((e) => e(i))), t();
			}, "getInspectorTree");
		}), e.callHookWith(async (e) => {
			await Promise.all(e.map((e) => e({
				inspectorId: t,
				rootNodes: i.rootNodes
			})));
		}, "sendInspectorTreeToClient");
	}, 120);
	e.hook("sendInspectorTree", t);
	let n = We(async ({ inspectorId: t, plugin: n }) => {
		if (!t || !n?.descriptor?.app || K.highPerfModeEnabled) return;
		let r = yn(t, n.descriptor.app), i = {
			app: n.descriptor.app,
			inspectorId: t,
			nodeId: r?.selectedNodeId || "",
			state: null
		}, a = { currentTab: `custom-inspector:${t}` };
		i.nodeId && await new Promise((t) => {
			e.callHookWith(async (e) => {
				await Promise.all(e.map((e) => e(i, a))), t();
			}, "getInspectorState");
		}), e.callHookWith(async (e) => {
			await Promise.all(e.map((e) => e({
				inspectorId: t,
				nodeId: i.nodeId,
				state: i.state
			})));
		}, "sendInspectorStateToClient");
	}, 120);
	return e.hook("sendInspectorState", n), e.hook("customInspectorSelectNode", ({ inspectorId: e, nodeId: t, plugin: n }) => {
		let r = yn(e, n.descriptor.app);
		r && (r.selectedNodeId = t);
	}), e.hook("timelineLayerAdded", ({ options: e, plugin: t }) => {
		pn(e, t.descriptor);
	}), e.hook("timelineEventAdded", ({ options: t, plugin: n }) => {
		K.highPerfModeEnabled || !K.timelineLayersState?.[n.descriptor.id] && ![
			"performance",
			"component-event",
			"keyboard",
			"mouse"
		].includes(t.layerId) || e.callHookWith(async (e) => {
			await Promise.all(e.map((e) => e(t)));
		}, "sendTimelineEventToClient");
	}), e.hook("getComponentInstances", async ({ app: e }) => {
		let t = e.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
		if (!t) return null;
		let n = t.id.toString();
		return [...t.instanceMap].filter(([e]) => e.split(":")[0] === n).map(([, e]) => e);
	}), e.hook("getComponentBounds", async ({ instance: e }) => Et(e)), e.hook("getComponentName", ({ instance: e }) => _t(e)), e.hook("componentHighlight", ({ uid: e }) => {
		let t = G.value.instanceMap.get(e);
		t && Ut(t);
	}), e.hook("componentUnhighlight", () => {
		Wt();
	}), e;
}
var xn;
(xn = U).__VUE_DEVTOOLS_KIT_APP_RECORDS__ ?? (xn.__VUE_DEVTOOLS_KIT_APP_RECORDS__ = []);
var Sn;
(Sn = U).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ ?? (Sn.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = {});
var Cn;
(Cn = U).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ ?? (Cn.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = "");
var wn;
(wn = U).__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ ?? (wn.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ = []);
var Tn;
(Tn = U).__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ ?? (Tn.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ = []);
var En = "__VUE_DEVTOOLS_KIT_GLOBAL_STATE__";
function Dn() {
	return {
		connected: !1,
		clientConnected: !1,
		vitePluginDetected: !0,
		appRecords: [],
		activeAppRecordId: "",
		tabs: [],
		commands: [],
		highPerfModeEnabled: !0,
		devtoolsClientDetected: {},
		perfUniqueGroupId: 0,
		timelineLayersState: un()
	};
}
var On;
(On = U)[En] ?? (On[En] = Dn());
var kn = We((e) => {
	fr.hooks.callHook("devtoolsStateUpdated", { state: e });
});
We((e, t) => {
	fr.hooks.callHook("devtoolsConnectedUpdated", {
		state: e,
		oldState: t
	});
});
var An = new Proxy(U.__VUE_DEVTOOLS_KIT_APP_RECORDS__, { get(e, t, n) {
	return t === "value" ? U.__VUE_DEVTOOLS_KIT_APP_RECORDS__ : U.__VUE_DEVTOOLS_KIT_APP_RECORDS__[t];
} }), G = new Proxy(U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__, { get(e, t, n) {
	return t === "value" ? U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ : t === "id" ? U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ : U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__[t];
} });
function jn() {
	kn({
		...U[En],
		appRecords: An.value,
		activeAppRecordId: G.id,
		tabs: U.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__,
		commands: U.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__
	});
}
function Mn(e) {
	U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = e, jn();
}
function Nn(e) {
	U.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = e, jn();
}
var K = new Proxy(U[En], {
	get(e, t) {
		return t === "appRecords" ? An : t === "activeAppRecordId" ? G.id : t === "tabs" ? U.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ : t === "commands" ? U.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ : U[En][t];
	},
	deleteProperty(e, t) {
		return delete e[t], !0;
	},
	set(e, t, n) {
		return { ...U[En] }, e[t] = n, U[En][t] = n, !0;
	}
});
function Pn(e = {}) {
	let { file: t, host: n, baseUrl: r = window.location.origin, line: i = 0, column: a = 0 } = e;
	if (t) {
		if (n === "chrome-extension") {
			let e = t.replace(/\\/g, "\\\\"), n = window.VUE_DEVTOOLS_CONFIG?.openInEditorHost ?? "/";
			fetch(`${n}__open-in-editor?file=${encodeURI(t)}`).then((t) => {
				if (!t.ok) {
					let t = `Opening component ${e} failed`;
					console.log(`%c${t}`, "color:red");
				}
			});
		} else if (K.vitePluginDetected) {
			let e = U.__VUE_DEVTOOLS_OPEN_IN_EDITOR_BASE_URL__ ?? r;
			U.__VUE_INSPECTOR__.openInEditor(e, t, i, a);
		}
	}
}
W(), W(), W(), W(), W();
var Fn;
(Fn = U).__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__ ?? (Fn.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__ = []);
var In = new Proxy(U.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__, { get(e, t, n) {
	return Reflect.get(e, t, n);
} });
function Ln(e) {
	let t = {};
	return Object.keys(e).forEach((n) => {
		t[n] = e[n].defaultValue;
	}), t;
}
function Rn(e) {
	return `__VUE_DEVTOOLS_NEXT_PLUGIN_SETTINGS__${e}__`;
}
function zn(e) {
	return (In.find((t) => t[0].id === e && !!t[0]?.settings)?.[0] ?? null)?.settings ?? null;
}
function Bn(e, t) {
	let n = Rn(e);
	if (n) {
		let e = localStorage.getItem(n);
		if (e) return JSON.parse(e);
	}
	return Ln(e ? (In.find((t) => t[0].id === e)?.[0] ?? null)?.settings ?? {} : t);
}
function Vn(e, t) {
	let n = Rn(e);
	localStorage.getItem(n) || localStorage.setItem(n, JSON.stringify(Ln(t)));
}
function Hn(e, t, n) {
	let r = Rn(e), i = localStorage.getItem(r), a = JSON.parse(i || "{}"), o = {
		...a,
		[t]: n
	};
	localStorage.setItem(r, JSON.stringify(o)), fr.hooks.callHookWith((r) => {
		r.forEach((r) => r({
			pluginId: e,
			key: t,
			oldValue: a[t],
			newValue: n,
			settings: o
		}));
	}, "setPluginSettings");
}
W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W();
var Un, q = (Un = U).__VUE_DEVTOOLS_HOOK ?? (Un.__VUE_DEVTOOLS_HOOK = $e()), Wn = {
	on: {
		vueAppInit(e) {
			q.hook("app:init", e);
		},
		vueAppUnmount(e) {
			q.hook("app:unmount", e);
		},
		vueAppConnected(e) {
			q.hook("app:connected", e);
		},
		componentAdded(e) {
			return q.hook("component:added", e);
		},
		componentEmit(e) {
			return q.hook("component:emit", e);
		},
		componentUpdated(e) {
			return q.hook("component:updated", e);
		},
		componentRemoved(e) {
			return q.hook("component:removed", e);
		},
		setupDevtoolsPlugin(e) {
			q.hook("devtools-plugin:setup", e);
		},
		perfStart(e) {
			return q.hook("perf:start", e);
		},
		perfEnd(e) {
			return q.hook("perf:end", e);
		}
	},
	setupDevToolsPlugin(e, t) {
		return q.callHook("devtools-plugin:setup", e, t);
	}
}, Gn = class {
	constructor({ plugin: e, ctx: t }) {
		this.hooks = t.hooks, this.plugin = e;
	}
	get on() {
		return {
			visitComponentTree: (e) => {
				this.hooks.hook("visitComponentTree", e);
			},
			inspectComponent: (e) => {
				this.hooks.hook("inspectComponent", e);
			},
			editComponentState: (e) => {
				this.hooks.hook("editComponentState", e);
			},
			getInspectorTree: (e) => {
				this.hooks.hook("getInspectorTree", e);
			},
			getInspectorState: (e) => {
				this.hooks.hook("getInspectorState", e);
			},
			editInspectorState: (e) => {
				this.hooks.hook("editInspectorState", e);
			},
			inspectTimelineEvent: (e) => {
				this.hooks.hook("inspectTimelineEvent", e);
			},
			timelineCleared: (e) => {
				this.hooks.hook("timelineCleared", e);
			},
			setPluginSettings: (e) => {
				this.hooks.hook("setPluginSettings", e);
			}
		};
	}
	notifyComponentUpdate(e) {
		if (K.highPerfModeEnabled) return;
		let t = vn().find((e) => e.packageName === this.plugin.descriptor.packageName);
		if (t?.id) {
			if (e) {
				let t = [
					e.appContext.app,
					e.uid,
					e.parent?.uid,
					e
				];
				q.callHook("component:updated", ...t);
			} else q.callHook("component:updated");
			this.hooks.callHook("sendInspectorState", {
				inspectorId: t.id,
				plugin: this.plugin
			});
		}
	}
	addInspector(e) {
		this.hooks.callHook("addInspector", {
			inspector: e,
			plugin: this.plugin
		}), this.plugin.descriptor.settings && Vn(e.id, this.plugin.descriptor.settings);
	}
	sendInspectorTree(e) {
		K.highPerfModeEnabled || this.hooks.callHook("sendInspectorTree", {
			inspectorId: e,
			plugin: this.plugin
		});
	}
	sendInspectorState(e) {
		K.highPerfModeEnabled || this.hooks.callHook("sendInspectorState", {
			inspectorId: e,
			plugin: this.plugin
		});
	}
	selectInspectorNode(e, t) {
		this.hooks.callHook("customInspectorSelectNode", {
			inspectorId: e,
			nodeId: t,
			plugin: this.plugin
		});
	}
	visitComponentTree(e) {
		return this.hooks.callHook("visitComponentTree", e);
	}
	now() {
		return K.highPerfModeEnabled ? 0 : Date.now();
	}
	addTimelineLayer(e) {
		this.hooks.callHook("timelineLayerAdded", {
			options: e,
			plugin: this.plugin
		});
	}
	addTimelineEvent(e) {
		K.highPerfModeEnabled || this.hooks.callHook("timelineEventAdded", {
			options: e,
			plugin: this.plugin
		});
	}
	getSettings(e) {
		return Bn(e ?? this.plugin.descriptor.id, this.plugin.descriptor.settings);
	}
	getComponentInstances(e) {
		return this.hooks.callHook("getComponentInstances", { app: e });
	}
	getComponentBounds(e) {
		return this.hooks.callHook("getComponentBounds", { instance: e });
	}
	getComponentName(e) {
		return this.hooks.callHook("getComponentName", { instance: e });
	}
	highlightElement(e) {
		let t = e.__VUE_DEVTOOLS_NEXT_UID__;
		return this.hooks.callHook("componentHighlight", { uid: t });
	}
	unhighlightElement() {
		return this.hooks.callHook("componentUnhighlight");
	}
};
W(), W(), W(), W();
var Kn = "__vue_devtool_undefined__", qn = "__vue_devtool_infinity__", Jn = "__vue_devtool_negative_infinity__", Yn = "__vue_devtool_nan__";
W(), W(), Object.entries({
	[Kn]: "undefined",
	[Yn]: "NaN",
	[qn]: "Infinity",
	[Jn]: "-Infinity"
}).reduce((e, [t, n]) => (e[n] = t, e), {}), W(), W(), W(), W(), W();
var Xn;
(Xn = U).__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__ ?? (Xn.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__ = /* @__PURE__ */ new Set());
function Zn(e, t) {
	return Wn.setupDevToolsPlugin(e, t);
}
function Qn(e, t) {
	let [n, r] = e;
	if (n.app !== t) return;
	let i = new Gn({
		plugin: {
			setupFn: r,
			descriptor: n
		},
		ctx: fr
	});
	n.packageName === "vuex" && i.on.editInspectorState((e) => {
		i.sendInspectorState(e.inspectorId);
	}), r(i);
}
function $n(e, t) {
	U.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.has(e) || K.highPerfModeEnabled && !t?.inspectingComponent || (U.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.add(e), In.forEach((t) => {
		Qn(t, e);
	}));
}
W(), W();
var er = "__VUE_DEVTOOLS_ROUTER__", tr = "__VUE_DEVTOOLS_ROUTER_INFO__", nr;
(nr = U).__VUE_DEVTOOLS_ROUTER_INFO__ ?? (nr.__VUE_DEVTOOLS_ROUTER_INFO__ = {
	currentRoute: null,
	routes: []
});
var rr;
(rr = U).__VUE_DEVTOOLS_ROUTER__ ?? (rr.__VUE_DEVTOOLS_ROUTER__ = {}), new Proxy(U[tr], { get(e, t) {
	return U[tr][t];
} }), new Proxy(U[er], { get(e, t) {
	if (t === "value") return U[er];
} });
function ir(e) {
	let t = /* @__PURE__ */ new Map();
	return (e?.getRoutes() || []).filter((e) => !t.has(e.path) && t.set(e.path, 1));
}
function ar(e) {
	return e.map((e) => {
		let { path: t, name: n, children: r, meta: i } = e;
		return r?.length && (r = ar(r)), {
			path: t,
			name: n,
			children: r,
			meta: i
		};
	});
}
function or(e) {
	if (e) {
		let { fullPath: t, hash: n, href: r, path: i, name: a, matched: o, params: s, query: c } = e;
		return {
			fullPath: t,
			hash: n,
			href: r,
			path: i,
			name: a,
			params: s,
			query: c,
			matched: ar(o)
		};
	}
	return e;
}
function sr(e, t) {
	function n() {
		let t = e.app?.config.globalProperties.$router, n = or(t?.currentRoute.value), r = ar(ir(t)), i = console.warn;
		console.warn = () => {}, U[tr] = {
			currentRoute: n ? He(n) : {},
			routes: He(r)
		}, U[er] = t, console.warn = i;
	}
	n(), Wn.on.componentUpdated(We(() => {
		t.value?.app === e.app && (n(), !K.highPerfModeEnabled && fr.hooks.callHook("routerInfoUpdated", { state: U[tr] }));
	}, 200));
}
function cr(e) {
	return {
		async getInspectorTree(t) {
			let n = {
				...t,
				app: G.value.app,
				rootNodes: []
			};
			return await new Promise((t) => {
				e.callHookWith(async (e) => {
					await Promise.all(e.map((e) => e(n))), t();
				}, "getInspectorTree");
			}), n.rootNodes;
		},
		async getInspectorState(t) {
			let n = {
				...t,
				app: G.value.app,
				state: null
			}, r = { currentTab: `custom-inspector:${t.inspectorId}` };
			return await new Promise((t) => {
				e.callHookWith(async (e) => {
					await Promise.all(e.map((e) => e(n, r))), t();
				}, "getInspectorState");
			}), n.state;
		},
		editInspectorState(t) {
			let n = new sn(), r = {
				...t,
				app: G.value.app,
				set: (e, r = t.path, i = t.state.value, a) => {
					n.set(e, r, i, a || n.createDefaultSetCallback(t.state));
				}
			};
			e.callHookWith((e) => {
				e.forEach((e) => e(r));
			}, "editInspectorState");
		},
		sendInspectorState(t) {
			let n = yn(t);
			e.callHook("sendInspectorState", {
				inspectorId: t,
				plugin: {
					descriptor: n.descriptor,
					setupFn: () => ({})
				}
			});
		},
		inspectComponentInspector() {
			return Xt();
		},
		cancelInspectComponentInspector() {
			return Yt();
		},
		getComponentRenderCode(e) {
			let t = yt(G.value, e);
			if (t) return typeof t?.type == "function" ? t.type.toString() : t.render.toString();
		},
		scrollToComponent(e) {
			return Zt({ id: e });
		},
		openInEditor: Pn,
		getVueInspector: tn,
		toggleApp(e, t) {
			let n = An.value.find((t) => t.id === e);
			n && (Nn(e), Mn(n), sr(n, G), gn(), $n(n.app, t));
		},
		inspectDOM(e) {
			let t = yt(G.value, e);
			if (t) {
				let [e] = Dt(t);
				e && (U.__VUE_DEVTOOLS_INSPECT_DOM_TARGET__ = e);
			}
		},
		updatePluginSettings(e, t, n) {
			Hn(e, t, n);
		},
		getPluginSettings(e) {
			return {
				options: zn(e),
				values: Bn(e)
			};
		}
	};
}
W();
var lr;
(lr = U).__VUE_DEVTOOLS_ENV__ ?? (lr.__VUE_DEVTOOLS_ENV__ = { vitePluginDetected: !1 });
var ur = bn(), dr;
(dr = U).__VUE_DEVTOOLS_KIT_CONTEXT__ ?? (dr.__VUE_DEVTOOLS_KIT_CONTEXT__ = {
	hooks: ur,
	get state() {
		return {
			...K,
			activeAppRecordId: G.id,
			activeAppRecord: G.value,
			appRecords: An.value
		};
	},
	api: cr(ur)
});
var fr = U.__VUE_DEVTOOLS_KIT_CONTEXT__;
W(), lt(dt(), 1);
var pr;
(pr = U).__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__ ?? (pr.__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__ = {
	id: 0,
	appIds: /* @__PURE__ */ new Set()
}), W(), W();
function mr(e) {
	K.highPerfModeEnabled = e ?? !K.highPerfModeEnabled, !e && G.value && $n(G.value.app);
}
W(), W(), W();
function hr(e) {
	K.devtoolsClientDetected = {
		...K.devtoolsClientDetected,
		...e
	}, mr(!Object.values(K.devtoolsClientDetected).some(Boolean));
}
var gr;
(gr = U).__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__ ?? (gr.__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__ = hr), W(), W(), W(), W(), W(), W(), W();
var _r = class {
	constructor() {
		this.keyToValue = /* @__PURE__ */ new Map(), this.valueToKey = /* @__PURE__ */ new Map();
	}
	set(e, t) {
		this.keyToValue.set(e, t), this.valueToKey.set(t, e);
	}
	getByKey(e) {
		return this.keyToValue.get(e);
	}
	getByValue(e) {
		return this.valueToKey.get(e);
	}
	clear() {
		this.keyToValue.clear(), this.valueToKey.clear();
	}
}, vr = class {
	constructor(e) {
		this.generateIdentifier = e, this.kv = new _r();
	}
	register(e, t) {
		this.kv.getByValue(e) || (t ||= this.generateIdentifier(e), this.kv.set(t, e));
	}
	clear() {
		this.kv.clear();
	}
	getIdentifier(e) {
		return this.kv.getByValue(e);
	}
	getValue(e) {
		return this.kv.getByKey(e);
	}
}, yr = class extends vr {
	constructor() {
		super((e) => e.name), this.classToAllowedProps = /* @__PURE__ */ new Map();
	}
	register(e, t) {
		typeof t == "object" ? (t.allowProps && this.classToAllowedProps.set(e, t.allowProps), super.register(e, t.identifier)) : super.register(e, t);
	}
	getAllowedProps(e) {
		return this.classToAllowedProps.get(e);
	}
};
W(), W();
function br(e) {
	if ("values" in Object) return Object.values(e);
	let t = [];
	for (let n in e) e.hasOwnProperty(n) && t.push(e[n]);
	return t;
}
function xr(e, t) {
	let n = br(e);
	if ("find" in n) return n.find(t);
	let r = n;
	for (let e = 0; e < r.length; e++) {
		let n = r[e];
		if (t(n)) return n;
	}
}
function Sr(e, t) {
	Object.entries(e).forEach(([e, n]) => t(n, e));
}
function Cr(e, t) {
	return e.indexOf(t) !== -1;
}
function wr(e, t) {
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (t(r)) return r;
	}
}
var Tr = class {
	constructor() {
		this.transfomers = {};
	}
	register(e) {
		this.transfomers[e.name] = e;
	}
	findApplicable(e) {
		return xr(this.transfomers, (t) => t.isApplicable(e));
	}
	findByName(e) {
		return this.transfomers[e];
	}
};
W(), W();
var Er = (e) => Object.prototype.toString.call(e).slice(8, -1), Dr = (e) => e === void 0, Or = (e) => e === null, kr = (e) => typeof e != "object" || !e || e === Object.prototype ? !1 : Object.getPrototypeOf(e) === null ? !0 : Object.getPrototypeOf(e) === Object.prototype, Ar = (e) => kr(e) && Object.keys(e).length === 0, jr = (e) => Array.isArray(e), Mr = (e) => typeof e == "string", Nr = (e) => typeof e == "number" && !isNaN(e), Pr = (e) => typeof e == "boolean", Fr = (e) => e instanceof RegExp, Ir = (e) => e instanceof Map, Lr = (e) => e instanceof Set, Rr = (e) => Er(e) === "Symbol", zr = (e) => e instanceof Date && !isNaN(e.valueOf()), Br = (e) => e instanceof Error, Vr = (e) => typeof e == "number" && isNaN(e), Hr = (e) => Pr(e) || Or(e) || Dr(e) || Nr(e) || Mr(e) || Rr(e), Ur = (e) => typeof e == "bigint", Wr = (e) => e === Infinity || e === -Infinity, Gr = (e) => ArrayBuffer.isView(e) && !(e instanceof DataView), Kr = (e) => e instanceof URL;
W();
var qr = (e) => e.replace(/\./g, "\\."), Jr = (e) => e.map(String).map(qr).join("."), Yr = (e) => {
	let t = [], n = "";
	for (let r = 0; r < e.length; r++) {
		let i = e.charAt(r);
		if (i === "\\" && e.charAt(r + 1) === ".") {
			n += ".", r++;
			continue;
		}
		if (i === ".") {
			t.push(n), n = "";
			continue;
		}
		n += i;
	}
	let r = n;
	return t.push(r), t;
};
W();
function J(e, t, n, r) {
	return {
		isApplicable: e,
		annotation: t,
		transform: n,
		untransform: r
	};
}
var Xr = [
	J(Dr, "undefined", () => null, () => void 0),
	J(Ur, "bigint", (e) => e.toString(), (e) => typeof BigInt < "u" ? BigInt(e) : (console.error("Please add a BigInt polyfill."), e)),
	J(zr, "Date", (e) => e.toISOString(), (e) => new Date(e)),
	J(Br, "Error", (e, t) => {
		let n = {
			name: e.name,
			message: e.message
		};
		return t.allowedErrorProps.forEach((t) => {
			n[t] = e[t];
		}), n;
	}, (e, t) => {
		let n = Error(e.message);
		return n.name = e.name, n.stack = e.stack, t.allowedErrorProps.forEach((t) => {
			n[t] = e[t];
		}), n;
	}),
	J(Fr, "regexp", (e) => "" + e, (e) => {
		let t = e.slice(1, e.lastIndexOf("/")), n = e.slice(e.lastIndexOf("/") + 1);
		return new RegExp(t, n);
	}),
	J(Lr, "set", (e) => [...e.values()], (e) => new Set(e)),
	J(Ir, "map", (e) => [...e.entries()], (e) => new Map(e)),
	J((e) => Vr(e) || Wr(e), "number", (e) => Vr(e) ? "NaN" : e > 0 ? "Infinity" : "-Infinity", Number),
	J((e) => e === 0 && 1 / e == -Infinity, "number", () => "-0", Number),
	J(Kr, "URL", (e) => e.toString(), (e) => new URL(e))
];
function Zr(e, t, n, r) {
	return {
		isApplicable: e,
		annotation: t,
		transform: n,
		untransform: r
	};
}
var Qr = Zr((e, t) => Rr(e) ? !!t.symbolRegistry.getIdentifier(e) : !1, (e, t) => ["symbol", t.symbolRegistry.getIdentifier(e)], (e) => e.description, (e, t, n) => {
	let r = n.symbolRegistry.getValue(t[1]);
	if (!r) throw Error("Trying to deserialize unknown symbol");
	return r;
}), $r = [
	Int8Array,
	Uint8Array,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array,
	Uint8ClampedArray
].reduce((e, t) => (e[t.name] = t, e), {}), ei = Zr(Gr, (e) => ["typed-array", e.constructor.name], (e) => [...e], (e, t) => {
	let n = $r[t[1]];
	if (!n) throw Error("Trying to deserialize unknown typed array");
	return new n(e);
});
function ti(e, t) {
	return e?.constructor ? !!t.classRegistry.getIdentifier(e.constructor) : !1;
}
var ni = Zr(ti, (e, t) => ["class", t.classRegistry.getIdentifier(e.constructor)], (e, t) => {
	let n = t.classRegistry.getAllowedProps(e.constructor);
	if (!n) return { ...e };
	let r = {};
	return n.forEach((t) => {
		r[t] = e[t];
	}), r;
}, (e, t, n) => {
	let r = n.classRegistry.getValue(t[1]);
	if (!r) throw Error(`Trying to deserialize unknown class '${t[1]}' - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564`);
	return Object.assign(Object.create(r.prototype), e);
}), ri = Zr((e, t) => !!t.customTransformerRegistry.findApplicable(e), (e, t) => ["custom", t.customTransformerRegistry.findApplicable(e).name], (e, t) => t.customTransformerRegistry.findApplicable(e).serialize(e), (e, t, n) => {
	let r = n.customTransformerRegistry.findByName(t[1]);
	if (!r) throw Error("Trying to deserialize unknown custom value");
	return r.deserialize(e);
}), ii = [
	ni,
	Qr,
	ri,
	ei
], ai = (e, t) => {
	let n = wr(ii, (n) => n.isApplicable(e, t));
	if (n) return {
		value: n.transform(e, t),
		type: n.annotation(e, t)
	};
	let r = wr(Xr, (n) => n.isApplicable(e, t));
	if (r) return {
		value: r.transform(e, t),
		type: r.annotation
	};
}, oi = {};
Xr.forEach((e) => {
	oi[e.annotation] = e;
});
var si = (e, t, n) => {
	if (jr(t)) switch (t[0]) {
		case "symbol": return Qr.untransform(e, t, n);
		case "class": return ni.untransform(e, t, n);
		case "custom": return ri.untransform(e, t, n);
		case "typed-array": return ei.untransform(e, t, n);
		default: throw Error("Unknown transformation: " + t);
	}
	else {
		let r = oi[t];
		if (!r) throw Error("Unknown transformation: " + t);
		return r.untransform(e, n);
	}
};
W();
var ci = (e, t) => {
	if (t > e.size) throw Error("index out of bounds");
	let n = e.keys();
	for (; t > 0;) n.next(), t--;
	return n.next().value;
};
function li(e) {
	if (Cr(e, "__proto__")) throw Error("__proto__ is not allowed as a property");
	if (Cr(e, "prototype")) throw Error("prototype is not allowed as a property");
	if (Cr(e, "constructor")) throw Error("constructor is not allowed as a property");
}
var ui = (e, t) => {
	li(t);
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (Lr(e)) e = ci(e, +r);
		else if (Ir(e)) {
			let i = +r, a = +t[++n] == 0 ? "key" : "value", o = ci(e, i);
			switch (a) {
				case "key":
					e = o;
					break;
				case "value":
					e = e.get(o);
					break;
			}
		} else e = e[r];
	}
	return e;
}, di = (e, t, n) => {
	if (li(t), t.length === 0) return n(e);
	let r = e;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e];
		if (jr(r)) {
			let e = +n;
			r = r[e];
		} else if (kr(r)) r = r[n];
		else if (Lr(r)) {
			let e = +n;
			r = ci(r, e);
		} else if (Ir(r)) {
			if (e === t.length - 2) break;
			let i = +n, a = +t[++e] == 0 ? "key" : "value", o = ci(r, i);
			switch (a) {
				case "key":
					r = o;
					break;
				case "value":
					r = r.get(o);
					break;
			}
		}
	}
	let i = t[t.length - 1];
	if (jr(r) ? r[+i] = n(r[+i]) : kr(r) && (r[i] = n(r[i])), Lr(r)) {
		let e = ci(r, +i), t = n(e);
		e !== t && (r.delete(e), r.add(t));
	}
	if (Ir(r)) {
		let e = +t[t.length - 2], a = ci(r, e);
		switch (+i == 0 ? "key" : "value") {
			case "key": {
				let e = n(a);
				r.set(e, r.get(a)), e !== a && r.delete(a);
				break;
			}
			case "value":
				r.set(a, n(r.get(a)));
				break;
		}
	}
	return e;
};
function fi(e, t, n = []) {
	if (!e) return;
	if (!jr(e)) {
		Sr(e, (e, r) => fi(e, t, [...n, ...Yr(r)]));
		return;
	}
	let [r, i] = e;
	i && Sr(i, (e, r) => {
		fi(e, t, [...n, ...Yr(r)]);
	}), t(r, n);
}
function pi(e, t, n) {
	return fi(t, (t, r) => {
		e = di(e, r, (e) => si(e, t, n));
	}), e;
}
function mi(e, t) {
	function n(t, n) {
		let r = ui(e, Yr(n));
		t.map(Yr).forEach((t) => {
			e = di(e, t, () => r);
		});
	}
	if (jr(t)) {
		let [r, i] = t;
		r.forEach((t) => {
			e = di(e, Yr(t), () => e);
		}), i && Sr(i, n);
	} else Sr(t, n);
	return e;
}
var hi = (e, t) => kr(e) || jr(e) || Ir(e) || Lr(e) || ti(e, t);
function gi(e, t, n) {
	let r = n.get(e);
	r ? r.push(t) : n.set(e, [t]);
}
function _i(e, t) {
	let n = {}, r;
	return e.forEach((e) => {
		if (e.length <= 1) return;
		t || (e = e.map((e) => e.map(String)).sort((e, t) => e.length - t.length));
		let [i, ...a] = e;
		i.length === 0 ? r = a.map(Jr) : n[Jr(i)] = a.map(Jr);
	}), r ? Ar(n) ? [r] : [r, n] : Ar(n) ? void 0 : n;
}
var vi = (e, t, n, r, i = [], a = [], o = /* @__PURE__ */ new Map()) => {
	let s = Hr(e);
	if (!s) {
		gi(e, i, t);
		let n = o.get(e);
		if (n) return r ? { transformedValue: null } : n;
	}
	if (!hi(e, n)) {
		let t = ai(e, n), r = t ? {
			transformedValue: t.value,
			annotations: [t.type]
		} : { transformedValue: e };
		return s || o.set(e, r), r;
	}
	if (Cr(a, e)) return { transformedValue: null };
	let c = ai(e, n), l = c?.value ?? e, u = jr(l) ? [] : {}, d = {};
	Sr(l, (s, c) => {
		if (c === "__proto__" || c === "constructor" || c === "prototype") throw Error(`Detected property ${c}. This is a prototype pollution risk, please remove it from your object.`);
		let l = vi(s, t, n, r, [...i, c], [...a, e], o);
		u[c] = l.transformedValue, jr(l.annotations) ? d[c] = l.annotations : kr(l.annotations) && Sr(l.annotations, (e, t) => {
			d[qr(c) + "." + t] = e;
		});
	});
	let f = Ar(d) ? {
		transformedValue: u,
		annotations: c ? [c.type] : void 0
	} : {
		transformedValue: u,
		annotations: c ? [c.type, d] : d
	};
	return s || o.set(e, f), f;
};
W(), W();
function yi(e) {
	return Object.prototype.toString.call(e).slice(8, -1);
}
function bi(e) {
	return yi(e) === "Array";
}
function xi(e) {
	if (yi(e) !== "Object") return !1;
	let t = Object.getPrototypeOf(e);
	return !!t && t.constructor === Object && t === Object.prototype;
}
function Si(e, t, n, r, i) {
	let a = {}.propertyIsEnumerable.call(r, t) ? "enumerable" : "nonenumerable";
	a === "enumerable" && (e[t] = n), i && a === "nonenumerable" && Object.defineProperty(e, t, {
		value: n,
		enumerable: !1,
		writable: !0,
		configurable: !0
	});
}
function Ci(e, t = {}) {
	if (bi(e)) return e.map((e) => Ci(e, t));
	if (!xi(e)) return e;
	let n = Object.getOwnPropertyNames(e), r = Object.getOwnPropertySymbols(e);
	return [...n, ...r].reduce((n, r) => {
		if (bi(t.props) && !t.props.includes(r)) return n;
		let i = e[r];
		return Si(n, r, Ci(i, t), e, t.nonenumerable), n;
	}, {});
}
var Y = class {
	constructor({ dedupe: e = !1 } = {}) {
		this.classRegistry = new yr(), this.symbolRegistry = new vr((e) => e.description ?? ""), this.customTransformerRegistry = new Tr(), this.allowedErrorProps = [], this.dedupe = e;
	}
	serialize(e) {
		let t = /* @__PURE__ */ new Map(), n = vi(e, t, this, this.dedupe), r = { json: n.transformedValue };
		n.annotations && (r.meta = {
			...r.meta,
			values: n.annotations
		});
		let i = _i(t, this.dedupe);
		return i && (r.meta = {
			...r.meta,
			referentialEqualities: i
		}), r;
	}
	deserialize(e) {
		let { json: t, meta: n } = e, r = Ci(t);
		return n?.values && (r = pi(r, n.values, this)), n?.referentialEqualities && (r = mi(r, n.referentialEqualities)), r;
	}
	stringify(e) {
		return JSON.stringify(this.serialize(e));
	}
	parse(e) {
		return this.deserialize(JSON.parse(e));
	}
	registerClass(e, t) {
		this.classRegistry.register(e, t);
	}
	registerSymbol(e, t) {
		this.symbolRegistry.register(e, t);
	}
	registerCustom(e, t) {
		this.customTransformerRegistry.register({
			name: t,
			...e
		});
	}
	allowErrorProps(...e) {
		this.allowedErrorProps.push(...e);
	}
};
Y.defaultInstance = new Y(), Y.serialize = Y.defaultInstance.serialize.bind(Y.defaultInstance), Y.deserialize = Y.defaultInstance.deserialize.bind(Y.defaultInstance), Y.stringify = Y.defaultInstance.stringify.bind(Y.defaultInstance), Y.parse = Y.defaultInstance.parse.bind(Y.defaultInstance), Y.registerClass = Y.defaultInstance.registerClass.bind(Y.defaultInstance), Y.registerSymbol = Y.defaultInstance.registerSymbol.bind(Y.defaultInstance), Y.registerCustom = Y.defaultInstance.registerCustom.bind(Y.defaultInstance), Y.allowErrorProps = Y.defaultInstance.allowErrorProps.bind(Y.defaultInstance), Y.serialize, Y.deserialize, Y.stringify, Y.parse, Y.registerClass, Y.registerCustom, Y.registerSymbol, Y.allowErrorProps, W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W(), W();
var wi;
(wi = U).__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__ ?? (wi.__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__ = []);
var Ti;
(Ti = U).__VUE_DEVTOOLS_KIT_RPC_CLIENT__ ?? (Ti.__VUE_DEVTOOLS_KIT_RPC_CLIENT__ = null);
var Ei;
(Ei = U).__VUE_DEVTOOLS_KIT_RPC_SERVER__ ?? (Ei.__VUE_DEVTOOLS_KIT_RPC_SERVER__ = null);
var Di;
(Di = U).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ ?? (Di.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ = null);
var Oi;
(Oi = U).__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ ?? (Oi.__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ = null);
var ki;
(ki = U).__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__ ?? (ki.__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__ = null), W(), W(), W(), W(), W(), W(), W();
//#endregion
//#region node_modules/pinia/dist/pinia.mjs
var Ai = typeof window < "u", ji, Mi = (e) => ji = e, Ni = process.env.NODE_ENV === "production" ? () => f() && p(Pi) || ji : () => {
	let e = f() && p(Pi);
	return !e && !Ai && console.error("[🍍]: Pinia instance not found in context. This falls back to the global activePinia which exposes you to cross-request pollution on the server. Most of the time, it means you are calling \"useStore()\" in the wrong place.\nRead https://vuejs.org/guide/reusability/composables.html to learn more"), e || ji;
}, Pi = process.env.NODE_ENV === "production" ? Symbol() : Symbol("pinia");
function Fi(e) {
	return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var Ii;
(function(e) {
	e.direct = "direct", e.patchObject = "patch object", e.patchFunction = "patch function";
})(Ii ||= {});
var Li = typeof window == "object" && window.window === window ? window : typeof self == "object" && self.self === self ? self : typeof global == "object" && global.global === global ? global : typeof globalThis == "object" ? globalThis : { HTMLElement: null };
function Ri(e, { autoBom: t = !1 } = {}) {
	return t && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob(["﻿", e], { type: e.type }) : e;
}
function zi(e, t, n) {
	let r = new XMLHttpRequest();
	r.open("GET", e), r.responseType = "blob", r.onload = function() {
		Wi(r.response, t, n);
	}, r.onerror = function() {
		console.error("could not download file");
	}, r.send();
}
function Bi(e) {
	let t = new XMLHttpRequest();
	t.open("HEAD", e, !1);
	try {
		t.send();
	} catch {}
	return t.status >= 200 && t.status <= 299;
}
function Vi(e) {
	try {
		e.dispatchEvent(new MouseEvent("click"));
	} catch {
		let t = new MouseEvent("click", {
			bubbles: !0,
			cancelable: !0,
			view: window,
			detail: 0,
			screenX: 80,
			screenY: 20,
			clientX: 80,
			clientY: 20,
			ctrlKey: !1,
			altKey: !1,
			shiftKey: !1,
			metaKey: !1,
			button: 0,
			relatedTarget: null
		});
		e.dispatchEvent(t);
	}
}
var Hi = typeof navigator == "object" ? navigator : { userAgent: "" }, Ui = /Macintosh/.test(Hi.userAgent) && /AppleWebKit/.test(Hi.userAgent) && !/Safari/.test(Hi.userAgent), Wi = Ai ? typeof HTMLAnchorElement < "u" && "download" in HTMLAnchorElement.prototype && !Ui ? Gi : "msSaveOrOpenBlob" in Hi ? Ki : qi : () => {};
function Gi(e, t = "download", n) {
	let r = document.createElement("a");
	r.download = t, r.rel = "noopener", typeof e == "string" ? (r.href = e, r.origin === location.origin ? Vi(r) : Bi(r.href) ? zi(e, t, n) : (r.target = "_blank", Vi(r))) : (r.href = URL.createObjectURL(e), setTimeout(function() {
		URL.revokeObjectURL(r.href);
	}, 4e4), setTimeout(function() {
		Vi(r);
	}, 0));
}
function Ki(e, t = "download", n) {
	if (typeof e == "string") if (Bi(e)) zi(e, t, n);
	else {
		let t = document.createElement("a");
		t.href = e, t.target = "_blank", setTimeout(function() {
			Vi(t);
		});
	}
	else navigator.msSaveOrOpenBlob(Ri(e, n), t);
}
function qi(e, t, n, r) {
	if (r ||= open("", "_blank"), r && (r.document.title = r.document.body.innerText = "downloading..."), typeof e == "string") return zi(e, t, n);
	let i = e.type === "application/octet-stream", a = /constructor/i.test(String(Li.HTMLElement)) || "safari" in Li, o = /CriOS\/[\d]+/.test(navigator.userAgent);
	if ((o || i && a || Ui) && typeof FileReader < "u") {
		let t = new FileReader();
		t.onloadend = function() {
			let e = t.result;
			if (typeof e != "string") throw r = null, Error("Wrong reader.result type");
			e = o ? e : e.replace(/^data:[^;]*;/, "data:attachment/file;"), r ? r.location.href = e : location.assign(e), r = null;
		}, t.readAsDataURL(e);
	} else {
		let t = URL.createObjectURL(e);
		r ? r.location.assign(t) : location.href = t, r = null, setTimeout(function() {
			URL.revokeObjectURL(t);
		}, 4e4);
	}
}
function X(e, t) {
	let n = "🍍 " + e;
	typeof __VUE_DEVTOOLS_TOAST__ == "function" ? __VUE_DEVTOOLS_TOAST__(n, t) : t === "error" ? console.error(n) : t === "warn" ? console.warn(n) : console.log(n);
}
function Ji(e) {
	return "_a" in e && "install" in e;
}
function Yi() {
	if (!("clipboard" in navigator)) return X("Your browser doesn't support the Clipboard API", "error"), !0;
}
function Xi(e) {
	return e instanceof Error && e.message.toLowerCase().includes("document is not focused") ? (X("You need to activate the \"Emulate a focused page\" setting in the \"Rendering\" panel of devtools.", "warn"), !0) : !1;
}
async function Zi(e) {
	if (!Yi()) try {
		await navigator.clipboard.writeText(JSON.stringify(e.state.value)), X("Global state copied to clipboard.");
	} catch (e) {
		if (Xi(e)) return;
		X("Failed to serialize the state. Check the console for more details.", "error"), console.error(e);
	}
}
async function Qi(e) {
	if (!Yi()) try {
		ra(e, JSON.parse(await navigator.clipboard.readText())), X("Global state pasted from clipboard.");
	} catch (e) {
		if (Xi(e)) return;
		X("Failed to deserialize the state from clipboard. Check the console for more details.", "error"), console.error(e);
	}
}
async function $i(e) {
	try {
		Wi(new Blob([JSON.stringify(e.state.value)], { type: "text/plain;charset=utf-8" }), "pinia-state.json");
	} catch (e) {
		X("Failed to export the state as JSON. Check the console for more details.", "error"), console.error(e);
	}
}
var ea;
function ta() {
	ea || (ea = document.createElement("input"), ea.type = "file", ea.accept = ".json");
	function e() {
		return new Promise((e, t) => {
			ea.onchange = async () => {
				let t = ea.files;
				if (!t) return e(null);
				let n = t.item(0);
				return e(n ? {
					text: await n.text(),
					file: n
				} : null);
			}, ea.oncancel = () => e(null), ea.onerror = t, ea.click();
		});
	}
	return e;
}
async function na(e) {
	try {
		let t = await ta()();
		if (!t) return;
		let { text: n, file: r } = t;
		ra(e, JSON.parse(n)), X(`Global state imported from "${r.name}".`);
	} catch (e) {
		X("Failed to import the state from JSON. Check the console for more details.", "error"), console.error(e);
	}
}
function ra(e, t) {
	for (let n in t) {
		let r = e.state.value[n];
		r ? Object.assign(r, t[n]) : e.state.value[n] = t[n];
	}
}
function Z(e) {
	return { _custom: { display: e } };
}
var ia = "🍍 Pinia (root)", aa = "_root";
function oa(e) {
	return Ji(e) ? {
		id: aa,
		label: ia
	} : {
		id: e.$id,
		label: e.$id
	};
}
function sa(e) {
	if (Ji(e)) {
		let t = Array.from(e._s.keys()), n = e._s;
		return {
			state: t.map((t) => ({
				editable: !0,
				key: t,
				value: e.state.value[t]
			})),
			getters: t.filter((e) => n.get(e)._getters).map((e) => {
				let t = n.get(e);
				return {
					editable: !1,
					key: e,
					value: t._getters.reduce((e, n) => (e[n] = t[n], e), {})
				};
			})
		};
	}
	let t = { state: Object.keys(e.$state).map((t) => ({
		editable: !0,
		key: t,
		value: e.$state[t]
	})) };
	return e._getters && e._getters.length && (t.getters = e._getters.map((t) => ({
		editable: !1,
		key: t,
		value: e[t]
	}))), e._customProperties.size && (t.customProperties = Array.from(e._customProperties).map((t) => ({
		editable: !0,
		key: t,
		value: e[t]
	}))), t;
}
function ca(e) {
	return e ? Array.isArray(e) ? e.reduce((e, t) => (e.keys.push(t.key), e.operations.push(t.type), e.oldValue[t.key] = t.oldValue, e.newValue[t.key] = t.newValue, e), {
		oldValue: {},
		keys: [],
		operations: [],
		newValue: {}
	}) : {
		operation: Z(e.type),
		key: Z(e.key),
		oldValue: e.oldValue,
		newValue: e.newValue
	} : {};
}
function la(e) {
	switch (e) {
		case Ii.direct: return "mutation";
		case Ii.patchFunction: return "$patch";
		case Ii.patchObject: return "$patch";
		default: return "unknown";
	}
}
var ua = !0, da = [], fa = "pinia:mutations", Q = "pinia", { assign: pa } = Object, ma = (e) => "🍍 " + e;
function ha(e, t) {
	Zn({
		id: "dev.esm.pinia",
		label: "Pinia 🍍",
		logo: "https://pinia.vuejs.org/logo.svg",
		packageName: "pinia",
		homepage: "https://pinia.vuejs.org",
		componentStateTypes: da,
		app: e
	}, (n) => {
		typeof n.now != "function" && X("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html."), n.addTimelineLayer({
			id: fa,
			label: "Pinia 🍍",
			color: 15064968
		}), n.addInspector({
			id: Q,
			label: "Pinia 🍍",
			icon: "storage",
			treeFilterPlaceholder: "Search stores",
			actions: [
				{
					icon: "content_copy",
					action: () => {
						Zi(t);
					},
					tooltip: "Serialize and copy the state"
				},
				{
					icon: "content_paste",
					action: async () => {
						await Qi(t), n.sendInspectorTree(Q), n.sendInspectorState(Q);
					},
					tooltip: "Replace the state with the content of your clipboard"
				},
				{
					icon: "save",
					action: () => {
						$i(t);
					},
					tooltip: "Save the state as a JSON file"
				},
				{
					icon: "folder_open",
					action: async () => {
						await na(t), n.sendInspectorTree(Q), n.sendInspectorState(Q);
					},
					tooltip: "Import the state from a JSON file"
				}
			],
			nodeActions: [{
				icon: "restore",
				tooltip: "Reset the state (with \"$reset\")",
				action: (e) => {
					let n = t._s.get(e);
					n ? typeof n.$reset == "function" ? (n.$reset(), X(`Store "${e}" reset.`)) : X(`Cannot reset "${e}" store because it doesn't have a "$reset" method implemented.`, "warn") : X(`Cannot reset "${e}" store because it wasn't found.`, "warn");
				}
			}]
		}), n.on.inspectComponent((e) => {
			let t = e.componentInstance && e.componentInstance.proxy;
			if (t && t._pStores) {
				let t = e.componentInstance.proxy._pStores;
				Object.values(t).forEach((t) => {
					e.instanceData.state.push({
						type: ma(t.$id),
						key: "state",
						editable: !0,
						value: t._isOptionsAPI ? { _custom: {
							value: j(t.$state),
							actions: [{
								icon: "restore",
								tooltip: "Reset the state of this store",
								action: () => t.$reset()
							}]
						} } : Object.keys(t.$state).reduce((e, n) => (e[n] = t.$state[n], e), {})
					}), t._getters && t._getters.length && e.instanceData.state.push({
						type: ma(t.$id),
						key: "getters",
						editable: !1,
						value: t._getters.reduce((e, n) => {
							try {
								e[n] = t[n];
							} catch (t) {
								e[n] = t;
							}
							return e;
						}, {})
					});
				});
			}
		}), n.on.getInspectorTree((n) => {
			if (n.app === e && n.inspectorId === Q) {
				let e = [t];
				e = e.concat(Array.from(t._s.values())), n.rootNodes = (n.filter ? e.filter((e) => "$id" in e ? e.$id.toLowerCase().includes(n.filter.toLowerCase()) : ia.toLowerCase().includes(n.filter.toLowerCase())) : e).map(oa);
			}
		}), globalThis.$pinia = t, n.on.getInspectorState((n) => {
			if (n.app === e && n.inspectorId === Q) {
				let e = n.nodeId === aa ? t : t._s.get(n.nodeId);
				if (!e) return;
				e && (n.nodeId !== aa && (globalThis.$store = j(e)), n.state = sa(e));
			}
		}), n.on.editInspectorState((n) => {
			if (n.app === e && n.inspectorId === Q) {
				let e = n.nodeId === aa ? t : t._s.get(n.nodeId);
				if (!e) return X(`store "${n.nodeId}" not found`, "error");
				let { path: r } = n;
				Ji(e) ? r.unshift("state") : (r.length !== 1 || !e._customProperties.has(r[0]) || r[0] in e.$state) && r.unshift("$state"), ua = !1, n.set(e, r, n.state.value), ua = !0;
			}
		}), n.on.editComponentState((e) => {
			if (e.type.startsWith("🍍")) {
				let n = e.type.replace(/^🍍\s*/, ""), r = t._s.get(n);
				if (!r) return X(`store "${n}" not found`, "error");
				let { path: i } = e;
				if (i[0] !== "state") return X(`Invalid path for store "${n}":\n${i}\nOnly state can be modified.`);
				i[0] = "$state", ua = !1, e.set(r, i, e.state.value), ua = !0;
			}
		});
	});
}
function ga(e, t) {
	da.includes(ma(t.$id)) || da.push(ma(t.$id)), Zn({
		id: "dev.esm.pinia",
		label: "Pinia 🍍",
		logo: "https://pinia.vuejs.org/logo.svg",
		packageName: "pinia",
		homepage: "https://pinia.vuejs.org",
		componentStateTypes: da,
		app: e,
		settings: { logStoreChanges: {
			label: "Notify about new/deleted stores",
			type: "boolean",
			defaultValue: !0
		} }
	}, (e) => {
		let n = typeof e.now == "function" ? e.now.bind(e) : Date.now;
		t.$onAction(({ after: r, onError: i, name: a, args: o }) => {
			let s = _a++;
			e.addTimelineEvent({
				layerId: fa,
				event: {
					time: n(),
					title: "🛫 " + a,
					subtitle: "start",
					data: {
						store: Z(t.$id),
						action: Z(a),
						args: o
					},
					groupId: s
				}
			}), r((r) => {
				va = void 0, e.addTimelineEvent({
					layerId: fa,
					event: {
						time: n(),
						title: "🛬 " + a,
						subtitle: "end",
						data: {
							store: Z(t.$id),
							action: Z(a),
							args: o,
							result: r
						},
						groupId: s
					}
				});
			}), i((r) => {
				va = void 0, e.addTimelineEvent({
					layerId: fa,
					event: {
						time: n(),
						logType: "error",
						title: "💥 " + a,
						subtitle: "end",
						data: {
							store: Z(t.$id),
							action: Z(a),
							args: o,
							error: r
						},
						groupId: s
					}
				});
			});
		}, !0), t._customProperties.forEach((r) => {
			z(() => P(t[r]), (t, i) => {
				e.notifyComponentUpdate(), e.sendInspectorState(Q), ua && e.addTimelineEvent({
					layerId: fa,
					event: {
						time: n(),
						title: "Change",
						subtitle: r,
						data: {
							newValue: t,
							oldValue: i
						},
						groupId: va
					}
				});
			}, { deep: !0 });
		}), t.$subscribe(({ events: r, type: i }, a) => {
			if (e.notifyComponentUpdate(), e.sendInspectorState(Q), !ua) return;
			let o = {
				time: n(),
				title: la(i),
				data: pa({ store: Z(t.$id) }, ca(r)),
				groupId: va
			};
			i === Ii.patchFunction ? o.subtitle = "⤵️" : i === Ii.patchObject ? o.subtitle = "🧩" : r && !Array.isArray(r) && (o.subtitle = r.type), r && (o.data["rawEvent(s)"] = { _custom: {
				display: "DebuggerEvent",
				type: "object",
				tooltip: "raw DebuggerEvent[]",
				value: r
			} }), e.addTimelineEvent({
				layerId: fa,
				event: o
			});
		}, {
			detached: !0,
			flush: "sync"
		});
		let r = t._hotUpdate;
		t._hotUpdate = g((i) => {
			r(i), e.addTimelineEvent({
				layerId: fa,
				event: {
					time: n(),
					title: "🔥 " + t.$id,
					subtitle: "HMR update",
					data: {
						store: Z(t.$id),
						info: Z("HMR update")
					}
				}
			}), e.notifyComponentUpdate(), e.sendInspectorTree(Q), e.sendInspectorState(Q);
		});
		let { $dispose: i } = t;
		t.$dispose = () => {
			i(), e.notifyComponentUpdate(), e.sendInspectorTree(Q), e.sendInspectorState(Q), e.getSettings().logStoreChanges && X(`Disposed "${t.$id}" store 🗑`);
		}, e.notifyComponentUpdate(), e.sendInspectorTree(Q), e.sendInspectorState(Q), e.getSettings().logStoreChanges && X(`"${t.$id}" store installed 🆕`);
	});
}
var _a = 0, va;
function ya(e, t, n) {
	let r = t.reduce((t, n) => (t[n] = j(e)[n], t), {});
	for (let t in r) e[t] = function() {
		let i = _a, a = n ? new Proxy(e, {
			get(...e) {
				return va = i, Reflect.get(...e);
			},
			set(...e) {
				return va = i, Reflect.set(...e);
			}
		}) : e;
		va = i;
		let o = r[t].apply(a, arguments);
		return va = void 0, o;
	};
}
function ba({ app: e, store: t, options: n }) {
	if (!t.$id.startsWith("__hot:")) {
		if (t._isOptionsAPI = !!n.state, !t._p._testing) {
			ya(t, Object.keys(n.actions), t._isOptionsAPI);
			let e = t._hotUpdate;
			j(t)._hotUpdate = function(n) {
				e.apply(this, arguments), ya(t, Object.keys(n._hmrPayload.actions), !!t._isOptionsAPI);
			};
		}
		ga(e, t);
	}
}
function xa() {
	let e = l(!0), t = e.run(() => E({})), n = [], r = [], i = g({
		install(e) {
			Mi(i), i._a = e, e.provide(Pi, i), e.config.globalProperties.$pinia = i, process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Ai && ha(e, i), r.forEach((e) => n.push(e)), r = [];
		},
		use(e) {
			return this._a ? n.push(e) : r.push(e), this;
		},
		_p: n,
		_a: null,
		_e: e,
		_s: /* @__PURE__ */ new Map(),
		state: t
	});
	return process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Ai && typeof Proxy < "u" && i.use(ba), i;
}
function Sa(e, t) {
	for (let n in t) {
		let r = t[n];
		if (!(n in e)) continue;
		let i = e[n];
		Fi(i) && Fi(r) && !h(r) && !m(r) ? e[n] = Sa(i, r) : e[n] = r;
	}
	return e;
}
var Ca = () => {};
function wa(e, t, n, r = Ca) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && d() && S(i), i;
}
function Ta(e, ...t) {
	e.forEach((e) => {
		e(...t);
	});
}
var Ea = (e) => e(), Da = Symbol(), Oa = Symbol();
function ka(e, t) {
	e instanceof Map && t instanceof Map ? t.forEach((t, n) => e.set(n, t)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
	for (let n in t) {
		if (!t.hasOwnProperty(n)) continue;
		let r = t[n], i = e[n];
		Fi(i) && Fi(r) && e.hasOwnProperty(n) && !h(r) && !m(r) ? e[n] = ka(i, r) : e[n] = r;
	}
	return e;
}
var Aa = process.env.NODE_ENV === "production" ? Symbol() : Symbol("pinia:skipHydration");
function ja(e) {
	return !Fi(e) || !Object.prototype.hasOwnProperty.call(e, Aa);
}
var { assign: $ } = Object;
function Ma(e) {
	return !!(h(e) && e.effect);
}
function Na(e, t, r, i) {
	let { state: a, actions: o, getters: s } = t, c = r.state.value[e], l;
	function u() {
		!c && (process.env.NODE_ENV === "production" || !i) && (r.state.value[e] = a ? a() : {});
		let t = process.env.NODE_ENV !== "production" && i ? N(E(a ? a() : {}).value) : N(r.state.value[e]);
		return $(t, o, Object.keys(s || {}).reduce((i, a) => (process.env.NODE_ENV !== "production" && a in t && console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${a}" in store "${e}".`), i[a] = g(n(() => {
			Mi(r);
			let t = r._s.get(e);
			return s[a].call(t, t);
		})), i), {}));
	}
	return l = Pa(e, u, t, r, i, !0), l;
}
function Pa(e, t, r = {}, i, a, o) {
	let s, c = $({ actions: {} }, r);
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== "production" && !i._e.active) throw Error("Pinia destroyed");
	let u = { deep: !0 };
	/* istanbul ignore else */
	process.env.NODE_ENV !== "production" && (u.onTrigger = (e) => {
		/* istanbul ignore else */
		d ? y = e : d == 0 && !N._hotUpdating && (Array.isArray(y) ? y.push(e) : console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug."));
	});
	let d, f, p = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ new Set(), y, b = i.state.value[e];
	!o && !b && (process.env.NODE_ENV === "production" || !a) && (i.state.value[e] = {});
	let x = E({}), S;
	function C(t) {
		let n;
		d = f = !1, process.env.NODE_ENV !== "production" && (y = []), typeof t == "function" ? (t(i.state.value[e]), n = {
			type: Ii.patchFunction,
			storeId: e,
			events: y
		}) : (ka(i.state.value[e], t), n = {
			type: Ii.patchObject,
			payload: t,
			storeId: e,
			events: y
		});
		let r = S = Symbol();
		v().then(() => {
			S === r && (d = !0);
		}), f = !0, Ta(p, n, i.state.value[e]);
	}
	let w = o ? function() {
		let { state: e } = r, t = e ? e() : {};
		this.$patch((e) => {
			$(e, t);
		});
	} : process.env.NODE_ENV === "production" ? Ca : () => {
		throw Error(`🍍: Store "${e}" is built using the setup syntax and does not implement $reset().`);
	};
	function D() {
		s.stop(), p.clear(), _.clear(), i._s.delete(e);
	}
	let O = (t, n = "") => {
		if (Da in t) return t[Oa] = n, t;
		let r = function() {
			Mi(i);
			let n = Array.from(arguments), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
			function s(e) {
				a.add(e);
			}
			function c(e) {
				o.add(e);
			}
			Ta(_, {
				args: n,
				name: r[Oa],
				store: N,
				after: s,
				onError: c
			});
			let l;
			try {
				l = t.apply(this && this.$id === e ? this : N, n);
			} catch (e) {
				throw Ta(o, e), e;
			}
			return l instanceof Promise ? l.then((e) => (Ta(a, e), e)).catch((e) => (Ta(o, e), Promise.reject(e))) : (Ta(a, l), l);
		};
		return r[Da] = !0, r[Oa] = n, r;
	}, k = /* @__PURE__ */ g({
		actions: {},
		getters: {},
		state: [],
		hotState: x
	}), A = {
		_p: i,
		$id: e,
		$onAction: wa.bind(null, _),
		$patch: C,
		$reset: w,
		$subscribe(t, n = {}) {
			let r = wa(p, t, n.detached, () => a()), a = s.run(() => z(() => i.state.value[e], (r) => {
				(n.flush === "sync" ? f : d) && t({
					storeId: e,
					type: Ii.direct,
					events: y
				}, r);
			}, $({}, u, n)));
			return r;
		},
		$dispose: D
	}, N = T(process.env.NODE_ENV !== "production" || process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Ai ? $({
		_hmrPayload: k,
		_customProperties: g(/* @__PURE__ */ new Set())
	}, A) : A);
	i._s.set(e, N);
	let P = (i._a && i._a.runWithContext || Ea)(() => i._e.run(() => (s = l()).run(() => t({ action: O }))));
	for (let t in P) {
		let n = P[t];
		h(n) && !Ma(n) || m(n) ? (process.env.NODE_ENV !== "production" && a ? x.value[t] = M(P, t) : o || (b && ja(n) && (h(n) ? n.value = b[t] : ka(n, b[t])), i.state.value[e][t] = n), process.env.NODE_ENV !== "production" && k.state.push(t)) : typeof n == "function" ? (P[t] = process.env.NODE_ENV !== "production" && a ? n : O(n, t), process.env.NODE_ENV !== "production" && (k.actions[t] = n), c.actions[t] = n) : process.env.NODE_ENV !== "production" && Ma(n) && (k.getters[t] = o ? r.getters[t] : n, Ai && (P._getters ||= g([])).push(t));
	}
	if ($(N, P), $(j(N), P), Object.defineProperty(N, "$state", {
		get: () => process.env.NODE_ENV !== "production" && a ? x.value : i.state.value[e],
		set: (e) => {
			/* istanbul ignore if */
			if (process.env.NODE_ENV !== "production" && a) throw Error("cannot set hotState");
			C((t) => {
				$(t, e);
			});
		}
	}), process.env.NODE_ENV !== "production" && (N._hotUpdate = g((t) => {
		N._hotUpdating = !0, t._hmrPayload.state.forEach((e) => {
			if (e in N.$state) {
				let n = t.$state[e], r = N.$state[e];
				typeof n == "object" && Fi(n) && Fi(r) ? Sa(n, r) : t.$state[e] = r;
			}
			N[e] = M(t.$state, e);
		}), Object.keys(N.$state).forEach((e) => {
			e in t.$state || delete N[e];
		}), d = !1, f = !1, i.state.value[e] = M(t._hmrPayload, "hotState"), f = !0, v().then(() => {
			d = !0;
		});
		for (let e in t._hmrPayload.actions) {
			let n = t[e];
			N[e] = O(n, e);
		}
		for (let e in t._hmrPayload.getters) {
			let r = t._hmrPayload.getters[e];
			N[e] = o ? n(() => (Mi(i), r.call(N, N))) : r;
		}
		Object.keys(N._hmrPayload.getters).forEach((e) => {
			e in t._hmrPayload.getters || delete N[e];
		}), Object.keys(N._hmrPayload.actions).forEach((e) => {
			e in t._hmrPayload.actions || delete N[e];
		}), N._hmrPayload = t._hmrPayload, N._getters = t._getters, N._hotUpdating = !1;
	})), process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Ai) {
		let e = {
			writable: !0,
			configurable: !0,
			enumerable: !1
		};
		[
			"_p",
			"_hmrPayload",
			"_getters",
			"_customProperties"
		].forEach((t) => {
			Object.defineProperty(N, t, $({ value: N[t] }, e));
		});
	}
	return i._p.forEach((e) => {
		/* istanbul ignore else */
		if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Ai) {
			let t = s.run(() => e({
				store: N,
				app: i._a,
				pinia: i,
				options: c
			}));
			Object.keys(t || {}).forEach((e) => N._customProperties.add(e)), $(N, t);
		} else $(N, s.run(() => e({
			store: N,
			app: i._a,
			pinia: i,
			options: c
		})));
	}), process.env.NODE_ENV !== "production" && N.$state && typeof N.$state == "object" && typeof N.$state.constructor == "function" && !N.$state.constructor.toString().includes("[native code]") && console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${N.$id}".`), b && o && r.hydrate && r.hydrate(N.$state, b), d = !0, f = !0, N;
}
function Fa(e, t, n) {
	let r, i = typeof t == "function";
	r = i ? n : t;
	function a(n, o) {
		let s = f();
		if (n = (process.env.NODE_ENV === "test" && ji && ji._testing ? null : n) || (s ? p(Pi, null) : null), n && Mi(n), process.env.NODE_ENV !== "production" && !ji) throw Error("[🍍]: \"getActivePinia()\" was called but there was no active Pinia. Are you trying to use a store before calling \"app.use(pinia)\"?\nSee https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.\nThis will fail in production.");
		n = ji, n._s.has(e) || (i ? Pa(e, t, r, n) : Na(e, r, n), process.env.NODE_ENV !== "production" && (a._pinia = n));
		let c = n._s.get(e);
		if (process.env.NODE_ENV !== "production" && o) {
			let a = "__hot:" + e, s = i ? Pa(a, t, r, n, !0) : Na(a, $({}, r), n, !0);
			o._hotUpdate(s), delete n.state.value[a], n._s.delete(a);
		}
		if (process.env.NODE_ENV !== "production" && Ai) {
			let t = u();
			if (t && t.proxy && !o) {
				let n = t.proxy, r = "_pStores" in n ? n._pStores : n._pStores = {};
				r[e] = c;
			}
		}
		return c;
	}
	return a.$id = e, a;
}
//#endregion
//#region src/config/PiNoteConfig.ts
var Ia = {
	backendUrl: "",
	storageRetentionDays: 30,
	appTitle: "PiNote",
	theme: "light",
	defaults: {
		tool: "pen",
		color: "#000000",
		width: 2,
		background: { mode: "none" },
		snapEnabled: !1,
		snapSize: 80,
		bezier: !0
	},
	colorPresets: [
		{
			value: "#000000",
			label: "Noir"
		},
		{
			value: "#e53935",
			label: "Rouge"
		},
		{
			value: "#1e88e5",
			label: "Bleu"
		},
		{
			value: "#43a047",
			label: "Vert"
		}
	],
	maxPages: 0
}, La = {
	...Ia,
	defaults: { ...Ia.defaults }
};
function Ra() {
	return La;
}
//#endregion
//#region src/store/useNoteStore.ts
var za = "pi_note_index", Ba = "pi_note_current", Va = "pi_note_page_counter";
function Ha() {
	let e = parseInt(localStorage.getItem(Va) ?? "0", 10) + 1;
	return localStorage.setItem(Va, String(e)), e;
}
var Ua = Fa("note", () => {
	let e = k(null), t = E(null);
	function n(e) {
		t.value = e;
	}
	let r = Ra(), i = T({
		layer: "MAIN",
		tool: r.defaults.tool,
		width: r.defaults.width,
		color: r.defaults.color,
		bezier: r.defaults.bezier,
		rectMode: "2pts"
	}), a = T({
		pen: {
			color: r.defaults.color,
			width: r.defaults.width
		},
		highlighter: {
			color: "#eab308",
			width: 12
		},
		eraser: {
			color: "",
			width: 2
		},
		move: {
			color: "",
			width: 0
		},
		select: {
			color: "",
			width: 0
		},
		line: {
			color: "",
			width: 2
		},
		segment: {
			color: "",
			width: 2
		},
		vector: {
			color: "",
			width: 2
		},
		circle: {
			color: "",
			width: 2
		},
		rectangle: {
			color: "",
			width: 2
		},
		polygon: {
			color: "",
			width: 2
		}
	}), o = E(0);
	function s(e) {
		if (e === "rectangle" && i.tool === "rectangle") {
			i.rectMode = i.rectMode === "3pts" ? "2pts" : "3pts", o.value++;
			return;
		}
		a[i.tool].color = i.color, a[i.tool].width = i.width, i.tool = e, i.color = a[e].color, i.width = a[e].width, o.value++;
	}
	function c(e) {
		i.width = e, a[i.tool].width = e;
	}
	function l(e) {
		i.color = e, i.tool !== "eraser" && (a[i.tool].color = e);
	}
	let u = E([]), d = E(null), f = E(!1), p = E(!1), m = E([]);
	function h() {
		u.value = e.value?.shapes.slice() ?? [], f.value = e.value?.canUndo ?? !1, p.value = e.value?.canRedo ?? !1;
	}
	function g() {
		e.value?.undo(), h();
	}
	function _() {
		e.value?.redo(), h();
	}
	function v(t) {
		d.value === t && (d.value = null, e.value?.clearHighlight()), e.value?.destroyById(t), h();
	}
	function y(t) {
		e.value?.toggleVisibility(t), h();
	}
	function b(t) {
		d.value = t, t ? e.value?.highlightShape(t) : e.value?.clearHighlight();
	}
	function x(t, n) {
		e.value?.updateShapeProps(t, n), h();
	}
	function S(t) {
		e.value && e.value.setLayerVisibility(t, !e.value.getLayer(t).visible);
	}
	let C = E({
		mode: "none",
		grid: {
			size: 80,
			color: "#777777",
			lineWidth: 1
		},
		ruled: {
			spacing: 40,
			color: "#777777",
			lineWidth: 1
		},
		hex: {
			size: 40,
			color: "#777777",
			lineWidth: 1,
			orientation: "pointy"
		}
	}), w = E(""), D = T({
		enabled: r.defaults.snapEnabled,
		size: r.defaults.snapSize
	});
	function O(t) {
		C.value = t, e.value?.setBackground(t), t.mode === "grid" && t.grid?.size && (D.size = t.grid.size);
	}
	function A(t) {
		w.value = t, e.value && (e.value.title = t);
	}
	function j(t) {
		let n = t.size !== D.size;
		D.enabled = t.enabled, D.size = t.size, e.value && (e.value.snapGridEnabled = t.enabled, e.value.snapGridSize = t.size, n && e.value.showGridPreview());
	}
	function M() {
		e.value?.resetAll(), d.value = null, h();
	}
	async function N() {
		if (!e.value) return;
		let t = e.value.toJSONData(), n = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }), r = (w.value || "dessin") + ".pinote.json";
		if ("showSaveFilePicker" in window) try {
			let e = await (await window.showSaveFilePicker({
				suggestedName: r,
				types: [{
					description: "PiNote JSON",
					accept: { "application/json": [".pinote.json", ".json"] }
				}]
			})).createWritable();
			await e.write(n), await e.close();
			return;
		} catch (e) {
			if (e?.name === "AbortError") return;
		}
		let i = URL.createObjectURL(n), a = document.createElement("a");
		a.href = i, a.download = r, a.click(), URL.revokeObjectURL(i);
	}
	async function P(t) {
		if (!e.value) return;
		let n = await t.text(), r;
		try {
			r = JSON.parse(n);
		} catch {
			console.warn("[PiNote] importJSON: fichier JSON invalide");
			return;
		}
		e.value.loadFromJSONData(r), C.value = e.value.backgroundState, w.value = e.value.title, D.enabled = e.value.snapGridEnabled, D.size = e.value.snapGridSize, h();
	}
	function F(t) {
		if (!e.value) return;
		let n = t === "screen" ? e.value.exportPNG() : e.value.exportA4(t === "a4-portrait" ? "portrait" : t === "a4-landscape" ? "landscape" : "auto");
		if (!n) return;
		let r = t === "screen" ? "" : `-${t}`, i = document.createElement("a");
		i.href = n, i.download = (w.value || "dessin") + r + ".png", i.click();
	}
	let I = E("default"), L = E([]), R = E([]);
	function z() {
		localStorage.setItem(za, JSON.stringify(L.value));
	}
	function ee(e) {
		let t = L.value.find((t) => t.id === e);
		t && (t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), z());
	}
	function te() {
		let e = Ra().storageRetentionDays * 24 * 60 * 60 * 1e3, t = Date.now();
		R.value = L.value.filter((n) => t - new Date(n.updatedAt).getTime() > e);
	}
	function B() {
		e.value && (C.value = e.value.backgroundState, w.value = e.value.title, d.value = null, e.value.clearHighlight(), h());
	}
	function ne(t) {
		I.value = t, localStorage.setItem(Ba, t), e.value && (e.value.resetState(), e.value.setPageId(t), e.value.loadLocal(), e.value.onSave = () => ee(I.value), B());
	}
	function V() {
		let t = [];
		try {
			let e = localStorage.getItem(za);
			e && (t = JSON.parse(e));
		} catch {}
		if (t.length === 0) {
			let e = localStorage.getItem("pi_note_draft");
			e && localStorage.setItem("pi_note_draft_default", e), localStorage.setItem(Va, "1"), t = [{
				id: "default",
				name: "Page 1",
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}], localStorage.setItem(za, JSON.stringify(t));
		} else localStorage.getItem(Va) || localStorage.setItem(Va, String(t.length));
		L.value = t;
		let n = localStorage.getItem(Ba), r = n && t.some((e) => e.id === n) ? n : t[0].id;
		e.value && (e.value.resetState(), e.value.setPageId(r), e.value.loadLocal(), e.value.onSave = () => ee(I.value)), I.value = r, localStorage.setItem(Ba, r), B(), te();
	}
	function re(e) {
		let t = Ra().maxPages;
		if (t > 0 && L.value.length >= t) return;
		let n = "page-" + Date.now(), r = {
			id: n,
			name: e ?? `Page ${Ha()}`,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		L.value = [...L.value, r], z(), ne(n);
	}
	function ie(e) {
		e !== I.value && (ee(I.value), ne(e));
	}
	function ae(e) {
		L.value.length <= 1 || (localStorage.removeItem("pi_note_draft_" + e), L.value = L.value.filter((t) => t.id !== e), R.value = R.value.filter((t) => t.id !== e), z(), e === I.value && ne(L.value[0].id));
	}
	function oe(e, t) {
		let n = L.value.find((t) => t.id === e);
		n && (n.name = t, z());
	}
	function se() {
		R.value = [];
	}
	function ce() {
		for (let e of L.value) localStorage.removeItem("pi_note_draft_" + e.id);
		localStorage.removeItem(za), localStorage.removeItem(Ba), localStorage.setItem(Va, "1"), L.value = [{
			id: "default",
			name: "Page 1",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}], R.value = [], localStorage.setItem(za, JSON.stringify(L.value)), I.value = "default", localStorage.setItem(Ba, "default"), e.value && (e.value.resetState(), e.value.setPageId("default"), e.value.onSave = () => ee(I.value), e.value.saveLocal()), d.value = null, w.value = "", C.value = {
			mode: "none",
			grid: {
				size: 80,
				color: "#777777",
				lineWidth: 1
			},
			ruled: {
				spacing: 40,
				color: "#777777",
				lineWidth: 1
			},
			hex: {
				size: 40,
				color: "#777777",
				lineWidth: 1,
				orientation: "pointy"
			}
		}, h();
	}
	let le = E(Ra().backendUrl), ue = E("idle"), H = null;
	async function de() {
		if (!(!e.value || !le.value)) {
			ue.value = "syncing";
			try {
				await e.value.syncRemote(le.value), ue.value = "ok";
			} catch {
				ue.value = "error";
			}
			H && clearTimeout(H), H = setTimeout(() => {
				ue.value = "idle";
			}, 3e3);
		}
	}
	let fe = E(!0);
	function pe() {
		t.value?.zoomIn();
	}
	function me() {
		t.value?.zoomOut();
	}
	function he() {
		t.value?.resetView();
	}
	function ge() {
		t.value?.fitView();
	}
	return {
		engine: e,
		registerZoom: n,
		tool: i,
		toolMemory: a,
		toolSelectCount: o,
		selectTool: s,
		setToolWidth: c,
		setToolColor: l,
		shapes: u,
		selectedShapeId: d,
		canUndo: f,
		canRedo: p,
		layers: m,
		syncFromEngine: h,
		undo: g,
		redo: _,
		destroyShape: v,
		toggleShapeVisibility: y,
		highlightShape: b,
		updateShapeProps: x,
		toggleLayerVisibility: S,
		backgroundState: C,
		title: w,
		snapGrid: D,
		setBackground: O,
		setTitle: A,
		setSnapGrid: j,
		clearAll: M,
		exportPNG: F,
		exportJSON: N,
		importJSON: P,
		currentPageId: I,
		pages: L,
		expiredPages: R,
		initSession: V,
		createPage: re,
		switchPage: ie,
		deletePage: ae,
		renamePage: oe,
		dismissExpiredPages: se,
		newDocument: ce,
		remoteUrl: le,
		syncStatus: ue,
		syncRemote: de,
		sidebarOpen: fe,
		zoomIn: pe,
		zoomOut: me,
		resetView: he,
		fitView: ge
	};
}), Wa = { class: "tool-selector" }, Ga = ["onClick"], Ka = { class: "icon-wrapper" }, qa = {
	key: 0,
	viewBox: "0 0 24 24",
	fill: "none"
}, Ja = {
	key: 1,
	viewBox: "0 0 24 24"
}, Ya = {
	key: 2,
	viewBox: "0 0 24 24"
}, Xa = {
	key: 3,
	viewBox: "0 0 24 24"
}, Za = {
	key: 4,
	viewBox: "0 0 24 24",
	fill: "none"
}, Qa = {
	key: 5,
	viewBox: "0 0 24 24"
}, $a = {
	key: 6,
	viewBox: "0 0 24 24"
}, eo = {
	key: 7,
	viewBox: "0 0 24 24",
	fill: "none"
}, to = {
	key: 8,
	viewBox: "0 0 24 24"
}, no = {
	key: 9,
	viewBox: "0 0 24 24"
}, ro = {
	key: 10,
	viewBox: "0 0 24 24"
}, io = {
	key: 11,
	viewBox: "0 0 24 24",
	fill: "none"
}, ao = /* @__PURE__ */ c({
	__name: "ToolSelector",
	props: { tools: { default: () => [
		"pen",
		"highlighter",
		"eraser",
		"line",
		"segment",
		"circle",
		"rectangle"
	] } },
	setup(t) {
		let n = Ua(), r = t;
		return (t, s) => (w(), a("div", Wa, [(w(!0), a(e, null, D(r.tools, (e) => (w(), a("button", {
			key: e,
			class: y(["tool-button", { active: P(n).tool.tool === e }]),
			onClick: (t) => P(n).selectTool(e)
		}, [o("span", Ka, [e === "select" ? (w(), a("svg", qa, [...s[0] ||= [o("path", {
			d: "M5 3l14 9-7 1-4 9L5 3z",
			fill: "currentColor"
		}, null, -1)]])) : i("", !0), e === "pen" ? (w(), a("svg", Ja, [...s[1] ||= [o("path", { d: "M3 21l3-1 11-11-2-2L4 18l-1 3z" }, null, -1)]])) : e === "highlighter" ? (w(), a("svg", Ya, [...s[2] ||= [o("rect", {
			x: "3",
			y: "14",
			width: "18",
			height: "6"
		}, null, -1), o("path", { d: "M7 14L17 4l3 3-10 10" }, null, -1)]])) : e === "eraser" ? (w(), a("svg", Xa, [...s[3] ||= [o("path", { d: "M16 3l5 5-9 9H7L2 12l9-9h5z" }, null, -1)]])) : e === "move" ? (w(), a("svg", Za, [...s[4] ||= [o("path", {
			d: "M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3",
			stroke: "currentColor",
			"stroke-width": "1.8",
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		}, null, -1)]])) : e === "line" ? (w(), a("svg", Qa, [...s[5] ||= [
			o("line", {
				x1: "2",
				y1: "22",
				x2: "22",
				y2: "2",
				stroke: "currentColor",
				"stroke-width": "2",
				"stroke-linecap": "round"
			}, null, -1),
			o("circle", {
				cx: "8",
				cy: "16",
				r: "2.5",
				fill: "currentColor"
			}, null, -1),
			o("circle", {
				cx: "16",
				cy: "8",
				r: "2.5",
				fill: "currentColor"
			}, null, -1)
		]])) : e === "segment" ? (w(), a("svg", $a, [...s[6] ||= [
			o("line", {
				x1: "4",
				y1: "20",
				x2: "20",
				y2: "4",
				stroke: "currentColor",
				"stroke-width": "2",
				"stroke-linecap": "round"
			}, null, -1),
			o("circle", {
				cx: "4",
				cy: "20",
				r: "2.5",
				fill: "currentColor"
			}, null, -1),
			o("circle", {
				cx: "20",
				cy: "4",
				r: "2.5",
				fill: "currentColor"
			}, null, -1)
		]])) : e === "vector" ? (w(), a("svg", eo, [...s[7] ||= [o("line", {
			x1: "4",
			y1: "20",
			x2: "18",
			y2: "6",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linecap": "round"
		}, null, -1), o("path", {
			d: "M18 6l-5 1 4 4z",
			fill: "currentColor",
			stroke: "none"
		}, null, -1)]])) : e === "circle" ? (w(), a("svg", to, [...s[8] ||= [o("circle", {
			cx: "12",
			cy: "12",
			r: "7",
			stroke: "currentColor",
			"stroke-width": "2",
			fill: "none"
		}, null, -1)]])) : e === "rectangle" && !(P(n).tool.tool === "rectangle" && P(n).tool.rectMode === "3pts") ? (w(), a("svg", no, [...s[9] ||= [o("rect", {
			x: "5",
			y: "7",
			width: "14",
			height: "10",
			rx: "2",
			stroke: "currentColor",
			"stroke-width": "2",
			fill: "none"
		}, null, -1)]])) : e === "rectangle" ? (w(), a("svg", ro, [...s[10] ||= [o("rect", {
			x: "5",
			y: "7",
			width: "14",
			height: "10",
			rx: "2",
			stroke: "currentColor",
			"stroke-width": "2",
			fill: "none",
			transform: "rotate(-18, 12, 12)"
		}, null, -1)]])) : e === "polygon" ? (w(), a("svg", io, [...s[11] ||= [o("polygon", {
			points: "12,3 21,9 18,20 6,20 3,9",
			stroke: "currentColor",
			"stroke-width": "2",
			"stroke-linejoin": "round"
		}, null, -1)]])) : i("", !0)])], 10, Ga))), 128))]));
	}
}), oo = { class: "color-selector" }, so = ["onClick"], co = /* @__PURE__ */ c({
	__name: "ColorSelector",
	props: /* @__PURE__ */ _({ tool: {} }, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let n = F(t, "modelValue"), r = t, i = [
			"#000000",
			"#ef4444",
			"#3b82f6",
			"#22c55e",
			"#eab308"
		];
		function s(e) {
			return r.tool === "eraser" ? !0 : e === void 0 ? !1 : r.tool === "highlighter" && e === "#000000";
		}
		function c(e) {
			n.value = e, d.value = e === u.value;
		}
		let l = I("picker"), u = E("#34cd34"), d = E(!1);
		function f() {
			if (!d.value) {
				n.value = u.value, d.value = !0;
				return;
			}
			l.value?.click();
		}
		function p(e) {
			let t = e.target.value;
			u.value = t, n.value = t;
		}
		return (t, r) => (w(), a("div", oo, [(w(), a(e, null, D(i, (e) => o("button", {
			key: e,
			class: y(["color-button", {
				active: n.value === e,
				disabled: s(e)
			}]),
			style: b({ backgroundColor: e }),
			onClick: (t) => c(e)
		}, null, 14, so)), 64)), o("button", {
			class: "color-btn",
			onClick: f
		}, [o("div", {
			style: b({ backgroundColor: u.value }),
			class: "circle"
		}, null, 4), B(o("input", {
			ref_key: "picker",
			ref: l,
			"onUpdate:modelValue": r[0] ||= (e) => u.value = e,
			type: "color",
			onChange: p,
			onInput: p
		}, null, 544), [[L, u.value]])])]));
	}
}), lo = { class: "width-selector" }, uo = { class: "presets" }, fo = ["onClick"], po = {
	key: 0,
	class: "slider-row"
}, mo = ["max", "value"], ho = ["max", "value"], go = /* @__PURE__ */ c({
	__name: "WidthSelector",
	props: /* @__PURE__ */ _({
		tool: {},
		color: {},
		showSlider: { type: Boolean }
	}, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let r = F(t, "modelValue"), s = t, c = n(() => {
			switch (s.tool) {
				case "highlighter": return [
					16,
					24,
					32
				];
				case "eraser": return [
					10,
					20,
					30
				];
				default: return [
					2,
					4,
					6
				];
			}
		}), l = n(() => s.tool === "eraser" ? 60 : 30), u = n(() => s.tool === "eraser");
		function d(e) {
			let t = Number(e.target.value);
			t > 0 && (r.value = t);
		}
		return (n, f) => (w(), a("div", lo, [o("div", uo, [(w(!0), a(e, null, D(c.value, (e) => (w(), a("button", {
			key: e,
			class: y(["width-button", { active: r.value === e }]),
			onClick: (t) => r.value = e
		}, [u.value ? (w(), a("span", {
			key: 0,
			class: "width-circle",
			style: b({
				width: e + "px",
				height: e + "px"
			})
		}, null, 4)) : (w(), a("span", {
			key: 1,
			class: "width-line",
			style: b({
				height: e / 2 + "px",
				background: s.color || "#333"
			})
		}, null, 4))], 10, fo))), 128))]), t.showSlider ? (w(), a("div", po, [o("input", {
			type: "range",
			class: "slider",
			min: 1,
			max: l.value,
			value: r.value,
			onInput: d
		}, null, 40, mo), o("input", {
			type: "number",
			class: "number-input",
			min: 1,
			max: l.value,
			value: r.value,
			onChange: d
		}, null, 40, ho)])) : i("", !0)]));
	}
}), _o = { class: "layer-selector" }, vo = ["onClick"], yo = /* @__PURE__ */ c({
	__name: "LayerSelector",
	props: /* @__PURE__ */ _({ showNull: {
		type: Boolean,
		default: !0
	} }, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let n = F(t, "modelValue"), r = ["MAIN", "LAYER"];
		function s(e) {
			n.value = e;
		}
		return (c, l) => (w(), a("div", _o, [(w(), a(e, null, D(r, (e) => o("button", {
			key: e,
			class: y(["layer-btn", { active: n.value === e }]),
			onClick: (t) => s(e)
		}, A(e[0]), 11, vo)), 64)), t.showNull ? (w(), a("button", {
			key: 0,
			class: y(["layer-btn", { active: n.value === null }]),
			onClick: l[0] ||= (e) => s(null)
		}, " T ", 2)) : i("", !0)]));
	}
}), bo = { class: "note-tools" }, xo = { class: "tabs" }, So = { class: "clear tabs-row" }, Co = { class: "mini-panel-row" }, wo = ["title"], To = { class: "tools-row" }, Eo = /* @__PURE__ */ c({
	__name: "NoteTools",
	setup(e) {
		let t = Ua(), n = E("drawing"), r = [
			"select",
			"move",
			"pen",
			"highlighter",
			"eraser"
		], i = [
			"select",
			"move",
			"line",
			"segment",
			"vector",
			"circle",
			"rectangle",
			"polygon"
		];
		function c(e) {
			n.value = e;
			let a = e === "drawing" ? r : i;
			a.includes(t.tool.tool) || t.selectTool(a[0]);
		}
		let l = E(!1), u = null;
		function d() {
			l.value ? (u && clearTimeout(u), l.value = !1, t.clearAll()) : (l.value = !0, u = setTimeout(() => {
				l.value = !1;
			}, 2500));
		}
		return (e, u) => (w(), a("div", bo, [o("div", xo, [
			o("button", {
				class: y(["btn btn-ghost", { "btn-active": n.value === "drawing" }]),
				onClick: u[0] ||= (e) => c("drawing")
			}, " Dessin ", 2),
			o("button", {
				class: y(["btn btn-ghost", { "btn-active": n.value === "shapes" }]),
				onClick: u[1] ||= (e) => c("shapes")
			}, " Formes ", 2),
			o("div", So, [o("div", Co, [
				o("button", {
					class: "btn",
					title: "Zoom +",
					onClick: u[2] ||= (e) => P(t).zoomIn()
				}, " + "),
				o("button", {
					class: "btn",
					title: "Zoom −",
					onClick: u[3] ||= (e) => P(t).zoomOut()
				}, " − "),
				o("button", {
					class: "btn",
					title: "Tout afficher",
					onClick: u[4] ||= (e) => P(t).fitView()
				}, " ⤢ "),
				o("button", {
					class: "btn",
					title: "Réinitialiser",
					onClick: u[5] ||= (e) => P(t).resetView()
				}, " ⊙ ")
			]), o("button", {
				class: y(["btn btn-ghost", { pending: l.value }]),
				title: l.value ? "Cliquer à nouveau pour confirmer" : "Tout effacer",
				onClick: d
			}, A(l.value ? "Confirmer ?" : "🗑"), 11, wo)])
		]), o("div", To, [
			s(ao, { tools: n.value === "drawing" ? r : i }, null, 8, ["tools"]),
			u[9] ||= o("div", { class: "divider" }, null, -1),
			s(co, {
				"model-value": P(t).tool.color,
				tool: P(t).tool.tool,
				"onUpdate:modelValue": u[6] ||= (e) => P(t).setToolColor(e)
			}, null, 8, ["model-value", "tool"]),
			s(go, {
				"model-value": P(t).tool.width,
				tool: P(t).tool.tool,
				"onUpdate:modelValue": u[7] ||= (e) => P(t).setToolWidth(e)
			}, null, 8, ["model-value", "tool"]),
			s(yo, {
				"model-value": P(t).tool.layer,
				"onUpdate:modelValue": u[8] ||= (e) => P(t).tool.layer = e
			}, null, 8, ["model-value"])
		])]));
	}
}), Do = { class: "history-body" }, Oo = {
	key: 0,
	class: "msg-empty"
}, ko = ["onClick"], Ao = ["title", "onClick"], jo = ["onClick"], Mo = /* @__PURE__ */ c({
	__name: "SidebarPanelHistory",
	setup(t) {
		let n = Ua(), r = {
			pen: "Stylo",
			highlighter: "Surligneur",
			eraser: "Gomme",
			select: "Sélection",
			line: "Droite",
			segment: "Segment",
			vector: "Vecteur",
			circle: "Cercle",
			rectangle: "Rectangle",
			polygon: "Polygone",
			move: "Dépl."
		};
		return (t, s) => (w(), a("div", Do, [P(n).shapes.length === 0 ? (w(), a("div", Oo, " Aucune forme ")) : i("", !0), (w(!0), a(e, null, D([...P(n).shapes].reverse(), (e) => (w(), a("div", {
			key: e.id,
			class: y(["h-row", { active: P(n).selectedShapeId === e.id }]),
			onClick: (t) => P(n).highlightShape(e.id)
		}, [
			e.color ? (w(), a("span", {
				key: 0,
				class: "h-color",
				style: b({ background: e.color })
			}, null, 4)) : i("", !0),
			o("span", { class: y(["h-label", { hidden: e.hidden }]) }, A(r[e.tool] ?? e.tool), 3),
			o("button", {
				class: "btn-icon",
				title: e.hidden ? "Afficher" : "Cacher",
				onClick: V((t) => P(n).toggleShapeVisibility(e.id), ["stop"])
			}, A(e.hidden ? "🙈" : "👁"), 9, Ao),
			o("button", {
				class: "btn-icon del",
				title: "Supprimer",
				onClick: V((t) => P(n).destroyShape(e.id), ["stop"])
			}, " 🗑 ", 8, jo)
		], 10, ko))), 128))]));
	}
}), No = { class: "canvas-body" }, Po = { class: "canvas-field pages-header" }, Fo = { style: {
	display: "flex",
	gap: "4px"
} }, Io = { class: "pages-list" }, Lo = [
	"value",
	"onBlur",
	"onKeydown"
], Ro = ["onClick", "onDblclick"], zo = ["disabled", "onClick"], Bo = {
	key: 0,
	class: "expiry-warning"
}, Vo = { class: "expiry-actions" }, Ho = { class: "canvas-field" }, Uo = ["value"], Wo = { class: "canvas-field" }, Go = { class: "bg-grid" }, Ko = ["onClick"], qo = { class: "canvas-field" }, Jo = ["value"], Yo = { class: "opt-val" }, Xo = { class: "canvas-field" }, Zo = ["value"], Qo = { class: "opt-val" }, $o = { class: "canvas-field" }, es = { class: "color-row" }, ts = ["title", "onClick"], ns = ["value"], rs = { class: "canvas-field" }, is = ["value"], as = { class: "opt-val" }, os = { class: "canvas-field" }, ss = ["value"], cs = { class: "opt-val" }, ls = { class: "canvas-field" }, us = { class: "color-row" }, ds = ["title", "onClick"], fs = ["value"], ps = { class: "canvas-field" }, ms = { class: "origin-row" }, hs = { class: "canvas-field" }, gs = ["value"], _s = { class: "opt-val" }, vs = { class: "canvas-field" }, ys = ["value"], bs = { class: "opt-val" }, xs = { class: "canvas-field" }, Ss = { class: "color-row" }, Cs = ["title", "onClick"], ws = ["value"], Ts = { class: "canvas-field" }, Es = {
	key: 0,
	class: "opt-val linked-label"
}, Ds = {
	key: 4,
	class: "canvas-field"
}, Os = ["value"], ks = { class: "opt-val" }, As = {
	key: 5,
	class: "canvas-field"
}, js = { class: "opt-val linked-size" }, Ms = { class: "canvas-field export-field" }, Ns = { class: "canvas-field export-field" }, Ps = { class: "canvas-field" }, Fs = ["value"], Is = {
	key: 6,
	class: "canvas-field export-field"
}, Ls = ["disabled"], Rs = /* @__PURE__ */ c({
	__name: "SidebarPanelCanvas",
	setup(t) {
		let r = Ua(), s = E(null);
		async function c(e) {
			let t = e.target, n = t.files?.[0];
			n && (await r.importJSON(n), t.value = "");
		}
		let l = E(null), u = E("");
		function d(e, t) {
			l.value = e, u.value = t;
		}
		function f(e) {
			u.value.trim() && r.renamePage(e, u.value.trim()), l.value = null;
		}
		function p() {
			l.value = null;
		}
		function m() {
			for (let e of [...r.expiredPages]) r.deletePage(e.id);
			r.dismissExpiredPages();
		}
		function h() {
			confirm("Nouveau document : toutes les pages seront supprimées. Continuer ?") && r.newDocument();
		}
		let g = E(r.remoteUrl);
		z(g, (e) => {
			r.remoteUrl = e;
		});
		let _ = n(() => r.syncStatus === "syncing" ? "En cours…" : r.syncStatus === "ok" ? "Synchronisé" : r.syncStatus === "error" ? "Erreur" : "Synchroniser"), v = {
			none: "blanc",
			ruled: "réglé",
			grid: "grille",
			hex: "hex"
		}, x = Ra().colorPresets, S = E(r.snapGrid.enabled), C = E(r.snapGrid.size);
		z(() => r.snapGrid, (e) => {
			S.value = e.enabled, C.value = e.size;
		}, { deep: !0 });
		function T() {
			S.value = !S.value, r.setSnapGrid({
				enabled: S.value,
				size: C.value
			});
		}
		function O(e) {
			C.value = e, r.setSnapGrid({
				enabled: S.value,
				size: C.value
			});
		}
		function k(e, t) {
			r.setBackground({
				...r.backgroundState,
				[t]: {
					...r.backgroundState[t],
					...e
				}
			});
		}
		return (t, n) => (w(), a("div", No, [
			o("div", Po, [n[25] ||= o("span", { class: "sec-label" }, "Pages", -1), o("div", Fo, [o("button", {
				class: "btn btn-sm",
				onClick: n[0] ||= (e) => P(r).createPage()
			}, " + Nouvelle "), o("button", {
				class: "btn btn-sm btn-danger",
				title: "Nouveau document vierge",
				onClick: n[1] ||= (e) => h()
			}, " Nouveau ")])]),
			o("div", Io, [(w(!0), a(e, null, D(P(r).pages, (e) => (w(), a("div", {
				key: e.id,
				class: y(["h-row", { active: e.id === P(r).currentPageId }])
			}, [l.value === e.id ? (w(), a("input", {
				key: 0,
				class: "page-name-input",
				value: u.value,
				autofocus: "",
				onInput: n[2] ||= (e) => u.value = e.target.value,
				onBlur: (t) => f(e.id),
				onKeydown: [ne((t) => f(e.id), ["enter"]), ne(p, ["escape"])]
			}, null, 40, Lo)) : (w(), a("span", {
				key: 1,
				class: "h-label",
				onClick: (t) => P(r).switchPage(e.id),
				onDblclick: (t) => d(e.id, e.name)
			}, A(e.name), 41, Ro)), o("button", {
				class: "btn-icon del",
				disabled: P(r).pages.length <= 1,
				title: "Supprimer la page",
				onClick: (t) => P(r).deletePage(e.id)
			}, " ✕ ", 8, zo)], 2))), 128))]),
			P(r).expiredPages.length ? (w(), a("div", Bo, [o("span", null, A(P(r).expiredPages.length) + " page(s) non modifiée(s) depuis 30 jours", 1), o("div", Vo, [o("button", {
				class: "btn btn-sm btn-danger",
				onClick: m
			}, " Supprimer "), o("button", {
				class: "btn btn-sm",
				onClick: n[3] ||= (e) => P(r).dismissExpiredPages()
			}, " Ignorer ")])])) : i("", !0),
			o("div", Ho, [n[26] ||= o("span", { class: "sec-label" }, "Titre", -1), o("input", {
				class: "title-input",
				type: "text",
				placeholder: "Sans titre",
				value: P(r).title,
				onInput: n[4] ||= (e) => P(r).setTitle(e.target.value)
			}, null, 40, Uo)]),
			o("div", Wo, [n[27] ||= o("span", { class: "sec-label" }, "Fond", -1), o("div", Go, [(w(), a(e, null, D([
				"none",
				"ruled",
				"grid",
				"hex"
			], (e) => o("button", {
				key: e,
				class: y(["btn btn-sm btn-opt", { "btn-active": P(r).backgroundState.mode === e }]),
				onClick: (t) => P(r).setBackground({
					...P(r).backgroundState,
					mode: e
				})
			}, A(v[e]), 11, Ko)), 64))])]),
			P(r).backgroundState.mode === "grid" ? (w(), a(e, { key: 1 }, [
				o("div", qo, [
					n[28] ||= o("span", { class: "sec-label" }, "Cellule", -1),
					o("input", {
						type: "range",
						min: "20",
						max: "200",
						step: "5",
						class: "opt-slider",
						value: P(r).backgroundState.grid?.size ?? 80,
						onInput: n[5] ||= (e) => k({ size: +e.target.value }, "grid")
					}, null, 40, Jo),
					o("span", Yo, A(P(r).backgroundState.grid?.size ?? 80) + "px", 1)
				]),
				o("div", Xo, [
					n[29] ||= o("span", { class: "sec-label" }, "Trait", -1),
					o("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: P(r).backgroundState.grid?.lineWidth ?? 1,
						onInput: n[6] ||= (e) => k({ lineWidth: +e.target.value }, "grid")
					}, null, 40, Zo),
					o("span", Qo, A(P(r).backgroundState.grid?.lineWidth ?? 1), 1)
				]),
				o("div", $o, [n[30] ||= o("span", { class: "sec-label" }, "Couleur", -1), o("div", es, [(w(!0), a(e, null, D(P(x), (e) => (w(), a("button", {
					key: e.value,
					class: y(["color-swatch", { active: (P(r).backgroundState.grid?.color ?? "#777777") === e.value }]),
					style: b({ background: e.value }),
					title: e.label,
					onClick: (t) => k({ color: e.value }, "grid")
				}, null, 14, ts))), 128)), o("input", {
					type: "color",
					class: "color-pick",
					value: P(r).backgroundState.grid?.color ?? "#777777",
					onInput: n[7] ||= (e) => k({ color: e.target.value }, "grid")
				}, null, 40, ns)])])
			], 64)) : i("", !0),
			P(r).backgroundState.mode === "ruled" ? (w(), a(e, { key: 2 }, [
				o("div", rs, [
					n[31] ||= o("span", { class: "sec-label" }, "Lignes", -1),
					o("input", {
						type: "range",
						min: "10",
						max: "100",
						step: "5",
						class: "opt-slider",
						value: P(r).backgroundState.ruled?.spacing ?? 40,
						onInput: n[8] ||= (e) => k({ spacing: +e.target.value }, "ruled")
					}, null, 40, is),
					o("span", as, A(P(r).backgroundState.ruled?.spacing ?? 40) + "px", 1)
				]),
				o("div", os, [
					n[32] ||= o("span", { class: "sec-label" }, "Trait", -1),
					o("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: P(r).backgroundState.ruled?.lineWidth ?? 1,
						onInput: n[9] ||= (e) => k({ lineWidth: +e.target.value }, "ruled")
					}, null, 40, ss),
					o("span", cs, A(P(r).backgroundState.ruled?.lineWidth ?? 1), 1)
				]),
				o("div", ls, [n[33] ||= o("span", { class: "sec-label" }, "Couleur", -1), o("div", us, [(w(!0), a(e, null, D(P(x), (e) => (w(), a("button", {
					key: e.value,
					class: y(["color-swatch", { active: (P(r).backgroundState.ruled?.color ?? "#777777") === e.value }]),
					style: b({ background: e.value }),
					title: e.label,
					onClick: (t) => k({ color: e.value }, "ruled")
				}, null, 14, ds))), 128)), o("input", {
					type: "color",
					class: "color-pick",
					value: P(r).backgroundState.ruled?.color ?? "#777777",
					onInput: n[10] ||= (e) => k({ color: e.target.value }, "ruled")
				}, null, 40, fs)])])
			], 64)) : i("", !0),
			P(r).backgroundState.mode === "hex" ? (w(), a(e, { key: 3 }, [
				o("div", ps, [n[34] ||= o("span", { class: "sec-label" }, "Orient.", -1), o("div", ms, [o("button", {
					class: y(["btn btn-sm btn-opt", { "btn-active": (P(r).backgroundState.hex?.orientation ?? "pointy") === "pointy" }]),
					onClick: n[11] ||= (e) => k({ orientation: "pointy" }, "hex")
				}, " sommet ", 2), o("button", {
					class: y(["btn btn-sm btn-opt", { "btn-active": (P(r).backgroundState.hex?.orientation ?? "pointy") === "flat" }]),
					onClick: n[12] ||= (e) => k({ orientation: "flat" }, "hex")
				}, " arête ", 2)])]),
				o("div", hs, [
					n[35] ||= o("span", { class: "sec-label" }, "Côté", -1),
					o("input", {
						type: "range",
						min: "10",
						max: "150",
						step: "5",
						class: "opt-slider",
						value: P(r).backgroundState.hex?.size ?? 40,
						onInput: n[13] ||= (e) => k({ size: +e.target.value }, "hex")
					}, null, 40, gs),
					o("span", _s, A(P(r).backgroundState.hex?.size ?? 40) + "px", 1)
				]),
				o("div", vs, [
					n[36] ||= o("span", { class: "sec-label" }, "Trait", -1),
					o("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: P(r).backgroundState.hex?.lineWidth ?? 1,
						onInput: n[14] ||= (e) => k({ lineWidth: +e.target.value }, "hex")
					}, null, 40, ys),
					o("span", bs, A(P(r).backgroundState.hex?.lineWidth ?? 1), 1)
				]),
				o("div", xs, [n[37] ||= o("span", { class: "sec-label" }, "Couleur", -1), o("div", Ss, [(w(!0), a(e, null, D(P(x), (e) => (w(), a("button", {
					key: e.value,
					class: y(["color-swatch", { active: (P(r).backgroundState.hex?.color ?? "#777777") === e.value }]),
					style: b({ background: e.value }),
					title: e.label,
					onClick: (t) => k({ color: e.value }, "hex")
				}, null, 14, Cs))), 128)), o("input", {
					type: "color",
					class: "color-pick",
					value: P(r).backgroundState.hex?.color ?? "#777777",
					onInput: n[15] ||= (e) => k({ color: e.target.value }, "hex")
				}, null, 40, ws)])])
			], 64)) : i("", !0),
			o("div", Ts, [
				n[38] ||= o("span", { class: "sec-label" }, "Snap", -1),
				o("button", {
					class: y(["btn btn-sm btn-opt snap-toggle", { "btn-active": S.value }]),
					onClick: T
				}, " Grille ", 2),
				P(r).backgroundState.mode === "grid" ? (w(), a("span", Es, "lié")) : i("", !0)
			]),
			S.value && P(r).backgroundState.mode !== "grid" ? (w(), a("div", Ds, [
				n[39] ||= o("span", { class: "sec-label" }, "Pas", -1),
				o("input", {
					type: "range",
					min: "10",
					max: "200",
					step: "5",
					class: "opt-slider",
					value: C.value,
					onInput: n[16] ||= (e) => O(+e.target.value)
				}, null, 40, Os),
				o("span", ks, A(C.value) + "px", 1)
			])) : i("", !0),
			S.value && P(r).backgroundState.mode === "grid" ? (w(), a("div", As, [n[40] ||= o("span", { class: "sec-label" }, "Pas", -1), o("span", js, A(C.value) + "px (fond)", 1)])) : i("", !0),
			o("div", Ms, [
				o("button", {
					class: "btn btn-sm",
					title: "Enregistrer en JSON",
					onClick: n[17] ||= (e) => P(r).exportJSON()
				}, " Enregistrer "),
				o("button", {
					class: "btn btn-sm",
					title: "Charger un fichier .pinote.json",
					onClick: n[18] ||= (e) => s.value?.click()
				}, " Charger "),
				o("input", {
					ref_key: "fileInput",
					ref: s,
					type: "file",
					accept: ".json,.pinote.json",
					style: { display: "none" },
					onChange: c
				}, null, 544)
			]),
			o("div", Ns, [
				o("button", {
					class: "btn btn-sm",
					title: "Export résolution écran",
					onClick: n[19] ||= (e) => P(r).exportPNG("screen")
				}, " PNG "),
				o("button", {
					class: "btn btn-sm",
					title: "A4 orientation automatique",
					onClick: n[20] ||= (e) => P(r).exportPNG("a4-auto")
				}, " A4 auto "),
				o("button", {
					class: "btn btn-sm",
					title: "A4 portrait",
					onClick: n[21] ||= (e) => P(r).exportPNG("a4-portrait")
				}, " A4 ↕ "),
				o("button", {
					class: "btn btn-sm",
					title: "A4 paysage",
					onClick: n[22] ||= (e) => P(r).exportPNG("a4-landscape")
				}, " A4 ↔ ")
			]),
			o("div", Ps, [n[41] ||= o("span", { class: "sec-label" }, "Sync", -1), o("input", {
				class: "title-input",
				type: "url",
				placeholder: "https://…",
				value: g.value,
				onInput: n[23] ||= (e) => g.value = e.target.value
			}, null, 40, Fs)]),
			g.value ? (w(), a("div", Is, [o("button", {
				class: y(["btn btn-sm", { "btn-active": P(r).syncStatus === "ok" }]),
				disabled: P(r).syncStatus === "syncing",
				onClick: n[24] ||= (e) => P(r).syncRemote()
			}, A(_.value), 11, Ls)])) : i("", !0)
		]));
	}
}), zs = { class: "sp-root" }, Bs = { class: "sp-body" }, Vs = { key: 0 }, Hs = {
	key: 1,
	class: "sp-divider"
}, Us = { key: 2 }, Ws = { class: "sp-row-gap" }, Gs = { class: "sp-row-gap" }, Ks = { class: "sp-row-gap" }, qs = { class: "sp-row" }, Js = { class: "sp-row" }, Ys = { class: "sp-row" }, Xs = { key: 0 }, Zs = { class: "sp-opacity-row" }, Qs = ["value"], $s = { class: "sp-opacity-val" }, ec = /* @__PURE__ */ c({
	__name: "ShapeProperties",
	props: { shape: {} },
	emits: ["update"],
	setup(t, { emit: r }) {
		let c = t, l = r, u = c.shape, d = E(u.color ?? "#000000"), f = E(u.width ?? 2), p = E(u.layer ?? "MAIN"), m = E(u.lineStyle ?? "solid"), h = E(u.arrowStart ?? !1), g = E(u.arrowEnd ?? !1), _ = E(u.arrowStyle ?? "filled"), v = E(u.bezier ?? !0), b = E(u.closed ?? !1), x = E(u.fill ?? !1), S = E(u.fillOpacity ?? .3);
		z(d, (e) => l("update", c.shape.id, { color: e })), z(f, (e) => l("update", c.shape.id, { width: e })), z(p, (e) => l("update", c.shape.id, { layer: e })), z(m, (e) => l("update", c.shape.id, { lineStyle: e })), z(h, (e) => l("update", c.shape.id, { arrowStart: e })), z(g, (e) => l("update", c.shape.id, { arrowEnd: e })), z(_, (e) => l("update", c.shape.id, { arrowStyle: e })), z(v, (e) => l("update", c.shape.id, { bezier: e })), z(b, (e) => l("update", c.shape.id, { closed: e })), z(x, (e) => l("update", c.shape.id, { fill: e })), z(S, (e) => l("update", c.shape.id, { fillOpacity: e }));
		let C = c.shape.tool, T = C !== "eraser", D = !["move", "select"].includes(C), O = ![
			"move",
			"select",
			"eraser"
		].includes(C), k = n(() => c.shape.canHaveArrows), j = n(() => c.shape.canBeFilled), M = C === "pen", N = C === "polygon", F = n(() => h.value || g.value);
		return (t, n) => (w(), a("div", zs, [o("div", Bs, [
			T ? (w(), a("section", Vs, [n[14] ||= o("div", { class: "sp-label" }, " Couleur ", -1), s(co, {
				modelValue: d.value,
				"onUpdate:modelValue": n[0] ||= (e) => d.value = e,
				tool: P(C)
			}, null, 8, ["modelValue", "tool"])])) : i("", !0),
			T && D ? (w(), a("div", Hs)) : i("", !0),
			D ? (w(), a("section", Us, [n[15] ||= o("div", { class: "sp-label" }, " Épaisseur ", -1), s(go, {
				modelValue: f.value,
				"onUpdate:modelValue": n[1] ||= (e) => f.value = e,
				tool: P(C),
				color: d.value,
				"show-slider": !0
			}, null, 8, [
				"modelValue",
				"tool",
				"color"
			])])) : i("", !0),
			n[30] ||= o("div", { class: "sp-divider" }, null, -1),
			o("section", null, [n[16] ||= o("div", { class: "sp-label" }, " Calque ", -1), s(yo, {
				modelValue: p.value,
				"onUpdate:modelValue": n[2] ||= (e) => p.value = e,
				"show-null": !1
			}, null, 8, ["modelValue"])]),
			O ? (w(), a(e, { key: 3 }, [n[18] ||= o("div", { class: "sp-divider" }, null, -1), o("section", null, [n[17] ||= o("div", { class: "sp-label" }, " Trait ", -1), o("div", Ws, [
				o("button", {
					class: y(["btn btn-sm btn-toggle", { "btn-active": m.value === "solid" }]),
					onClick: n[3] ||= (e) => m.value = "solid"
				}, " plein ", 2),
				o("button", {
					class: y(["btn btn-sm btn-toggle", { "btn-active": m.value === "dashed" }]),
					onClick: n[4] ||= (e) => m.value = "dashed"
				}, " tirets ", 2),
				o("button", {
					class: y(["btn btn-sm btn-toggle", { "btn-active": m.value === "dotted" }]),
					onClick: n[5] ||= (e) => m.value = "dotted"
				}, " points ", 2)
			])])], 64)) : i("", !0),
			k.value ? (w(), a(e, { key: 4 }, [
				n[22] ||= o("div", { class: "sp-divider" }, null, -1),
				o("section", null, [n[19] ||= o("div", { class: "sp-label" }, " Flèche ", -1), o("div", Gs, [o("button", {
					class: y(["btn btn-sm btn-toggle", { "btn-active": h.value }]),
					onClick: n[6] ||= (e) => h.value = !h.value
				}, " ← départ ", 2), o("button", {
					class: y(["btn btn-sm btn-toggle", { "btn-active": g.value }]),
					onClick: n[7] ||= (e) => g.value = !g.value
				}, " arrivée → ", 2)])]),
				F.value ? (w(), a(e, { key: 0 }, [n[21] ||= o("div", { class: "sp-divider" }, null, -1), o("section", null, [n[20] ||= o("div", { class: "sp-label" }, " Style ", -1), o("div", Ks, [o("button", {
					class: y(["sp-toggle", { active: _.value === "filled" }]),
					onClick: n[8] ||= (e) => _.value = "filled"
				}, " ▶ plein ", 2), o("button", {
					class: y(["sp-toggle", { active: _.value === "open" }]),
					onClick: n[9] ||= (e) => _.value = "open"
				}, " ➤ ouvert ", 2)])])], 64)) : i("", !0)
			], 64)) : i("", !0),
			M ? (w(), a(e, { key: 5 }, [n[24] ||= o("div", { class: "sp-divider" }, null, -1), o("section", qs, [n[23] ||= o("span", { class: "sp-label" }, "Lissage", -1), o("button", {
				class: y(["sp-toggle", { active: v.value }]),
				onClick: n[10] ||= (e) => v.value = !v.value
			}, A(v.value ? "oui" : "non"), 3)])], 64)) : i("", !0),
			N ? (w(), a(e, { key: 6 }, [n[26] ||= o("div", { class: "sp-divider" }, null, -1), o("section", Js, [n[25] ||= o("span", { class: "sp-label" }, "Fermé", -1), o("button", {
				class: y(["sp-toggle", { active: b.value }]),
				onClick: n[11] ||= (e) => b.value = !b.value
			}, A(b.value ? "oui" : "non"), 3)])], 64)) : i("", !0),
			j.value ? (w(), a(e, { key: 7 }, [
				n[29] ||= o("div", { class: "sp-divider" }, null, -1),
				o("section", Ys, [n[27] ||= o("span", { class: "sp-label" }, "Remplissage", -1), o("button", {
					class: y(["sp-toggle", { active: x.value }]),
					onClick: n[12] ||= (e) => x.value = !x.value
				}, A(x.value ? "oui" : "non"), 3)]),
				x.value ? (w(), a("section", Xs, [n[28] ||= o("div", { class: "sp-label" }, " Opacité ", -1), o("div", Zs, [o("input", {
					type: "range",
					min: "0.05",
					max: "1",
					step: "0.05",
					value: S.value,
					class: "sp-slider",
					onInput: n[13] ||= (e) => S.value = parseFloat(e.target.value)
				}, null, 40, Qs), o("span", $s, A(Math.round(S.value * 100)) + "%", 1)])])) : i("", !0)
			], 64)) : i("", !0)
		])]));
	}
}), tc = { class: "props-body" }, nc = {
	key: 0,
	class: "msg-empty"
}, rc = /* @__PURE__ */ c({
	__name: "SidebarPanelProperties",
	setup(e) {
		let t = Ua(), i = n(() => t.tool.tool === "select" && t.selectedShapeId ? t.engine?.getShapeById(t.selectedShapeId) ?? null : null);
		return (e, n) => (w(), a("div", tc, [i.value ? (w(), r(ec, {
			key: P(t).selectedShapeId ?? "",
			shape: i.value,
			onUpdate: n[0] ||= (e, n) => P(t).updateShapeProps(e, n)
		}, null, 8, ["shape"])) : (w(), a("div", nc, " Aucune forme sélectionnée "))]));
	}
}), ic = { class: "zoom-row" }, ac = /* @__PURE__ */ c({
	__name: "SidebarPanelZoom",
	setup(e) {
		let t = Ua();
		return (e, n) => (w(), a("div", ic, [
			o("button", {
				class: "btn",
				title: "Zoom +",
				onClick: n[0] ||= (e) => P(t).zoomIn()
			}, " + "),
			o("button", {
				class: "btn",
				title: "Zoom −",
				onClick: n[1] ||= (e) => P(t).zoomOut()
			}, " − "),
			o("button", {
				class: "btn",
				title: "Tout afficher",
				onClick: n[2] ||= (e) => P(t).fitView()
			}, " ⤢ "),
			o("button", {
				class: "btn",
				title: "Réinitialiser",
				onClick: n[3] ||= (e) => P(t).resetView()
			}, " ⊙ ")
		]));
	}
}), oc = { class: "history-body" }, sc = ["onClick"], cc = ["title", "onClick"], lc = ["onClick"], uc = /* @__PURE__ */ c({
	__name: "SidebarPanelLayers",
	setup(t) {
		let n = Ua(), r = {
			BACKGROUND: "Fond",
			MAIN: "Principal",
			LAYER: "Calque"
		}, i = ["MAIN", "LAYER"], s = [
			"BACKGROUND",
			"MAIN",
			"LAYER"
		], c = T({
			BACKGROUND: !0,
			MAIN: !0,
			LAYER: !0
		});
		ee(() => {
			let e = n.engine;
			if (e) for (let t of s) c[t] = e.getLayer(t).visible;
		});
		function l(e) {
			n.engine?.setLayerVisibility(e, !c[e]), c[e] = !c[e];
		}
		function u(e) {
			n.engine?.clearLayer(e);
		}
		function d(e) {
			n.tool.layer = e;
		}
		return (t, f) => (w(), a("div", oc, [(w(), a(e, null, D(s, (e) => o("div", {
			key: e,
			class: y(["h-row", { active: P(n).tool.layer === e }]),
			style: b(i.includes(e) ? { cursor: "pointer" } : {}),
			onClick: (t) => i.includes(e) && d(e)
		}, [
			o("span", { class: y(["h-label", { hidden: !c[e] }]) }, A(r[e]), 3),
			o("button", {
				class: "btn-icon",
				title: c[e] ? "Cacher" : "Afficher",
				onClick: V((t) => l(e), ["stop"])
			}, A(c[e] ? "👁" : "🙈"), 9, cc),
			o("button", {
				class: "btn-icon del",
				title: "Effacer le calque",
				style: b(e === "BACKGROUND" ? { visibility: "hidden" } : {}),
				onClick: V((t) => u(e), ["stop"])
			}, " 🗑 ", 12, lc)
		], 14, sc)), 64))]));
	}
}), dc = { class: "sidebar" }, fc = { class: "sidebar-topbar" }, pc = { class: "sidebar-topbar-panel" }, mc = { class: "undo-redo" }, hc = ["disabled"], gc = ["disabled"], _c = { class: "sec sec-history" }, vc = { class: "sec-header-row" }, yc = { class: "sec" }, bc = { class: "sec" }, xc = { class: "sec sec-props" }, Sc = { class: "sec-zoom" }, Cc = { class: "sec-row" }, wc = /* @__PURE__ */ c({
	__name: "NoteSidebar",
	setup(e) {
		let t = Ua(), n = E(!0), r = E(!1), i = E(!0), c = E(!0);
		return z(() => t.selectedShapeId, (e) => {
			e && (i.value = !0);
		}), (e, l) => (w(), a("div", dc, [
			o("div", fc, [l[7] ||= o("span", { class: "sidebar-title" }, "PiNote", -1), o("div", pc, [o("div", mc, [o("button", {
				class: "btn",
				disabled: !P(t).canUndo,
				title: "Annuler",
				onClick: l[0] ||= (e) => P(t).undo()
			}, " ↩ ", 8, hc), o("button", {
				class: "btn",
				disabled: !P(t).canRedo,
				title: "Rétablir",
				onClick: l[1] ||= (e) => P(t).redo()
			}, " ↪ ", 8, gc)]), o("button", {
				class: "close-btn",
				title: "Fermer le panneau",
				onClick: l[2] ||= (e) => P(t).sidebarOpen = !1
			}, " ‹ ")])]),
			o("div", _c, [o("div", vc, [o("button", {
				class: "sec-header-btn",
				onClick: l[3] ||= (e) => n.value = !n.value
			}, [l[8] ||= o("span", { class: "sec-title" }, "Historique", -1), o("span", { class: y(["chevron", { open: n.value }]) }, "›", 2)])]), B(s(Mo, null, null, 512), [[R, n.value]])]),
			o("div", yc, [o("button", {
				class: "sec-header",
				onClick: l[4] ||= (e) => r.value = !r.value
			}, [l[9] ||= o("span", { class: "sec-title" }, "Canvas", -1), o("span", { class: y(["chevron", { open: r.value }]) }, "›", 2)]), B(s(Rs, null, null, 512), [[R, r.value]])]),
			o("div", bc, [o("button", {
				class: "sec-header",
				onClick: l[5] ||= (e) => c.value = !c.value
			}, [l[10] ||= o("span", { class: "sec-title" }, "Calques", -1), o("span", { class: y(["chevron", { open: c.value }]) }, "›", 2)]), B(s(uc, null, null, 512), [[R, c.value]])]),
			o("div", xc, [o("button", {
				class: "sec-header",
				onClick: l[6] ||= (e) => i.value = !i.value
			}, [l[11] ||= o("span", { class: "sec-title" }, "Propriétés", -1), o("span", { class: y(["chevron", { open: i.value }]) }, "›", 2)]), B(s(rc, null, null, 512), [[R, i.value]])]),
			o("div", Sc, [o("div", Cc, [l[12] ||= o("span", { class: "sec-label" }, "Zoom", -1), s(ac)])])
		]));
	}
}), Tc = {
	pen: "Tracé libre à main levée.",
	highlighter: "Surlignage à main levée avec opacité réduite.",
	eraser: "Effacez les traits en les survolant avec le bouton enfoncé.",
	move: "Cliquez et glissez pour déplacer la vue.",
	select: "Cliquez sur une forme pour la sélectionner, puis glissez pour la déplacer.",
	line: "Cliquez pour poser deux points. La droite s'étend à l'infini dans les deux sens.",
	segment: "Cliquez et glissez entre deux points pour tracer un segment borné.",
	vector: "Cliquez et glissez pour tracer un vecteur orienté avec une flèche.",
	circle: "Cliquez pour définir le centre, glissez pour fixer le rayon.",
	rectangle: "2pts : glissez pour tracer le rectangle. 3pts : glissez pour l'arête, relâchez, puis glissez pour la largeur.",
	polygon: "Cliquez pour ajouter des sommets un par un. Double-clic pour fermer et terminer."
}, Ec = {
	key: 0,
	class: "tool-hint"
}, Dc = /* @__PURE__ */ c({
	__name: "ToolHint",
	setup(e) {
		let t = Ua(), n = E(!1), r = E(""), o = null;
		return z(() => t.toolSelectCount, () => {
			r.value = Tc[t.tool.tool] ?? "", r.value && (n.value = !0, o && clearTimeout(o), o = setTimeout(() => {
				n.value = !1;
			}, 3e3));
		}), (e, t) => n.value ? (w(), a("div", Ec, A(r.value), 1)) : i("", !0);
	}
});
//#endregion
//#region src/composables/useCanvasTransform.ts
function Oc(e, t = {}) {
	let { panButton: r = 0, onTransformChange: i, canPan: a } = t, o = .1, s = .15, c = O({
		x: 0,
		y: 0,
		scale: 1
	}), l = n(() => `translate(${c.x}px, ${c.y}px) scale(${c.scale})`);
	function u() {
		i?.();
	}
	function d(e, t, n) {
		return Math.max(t, Math.min(n, e));
	}
	function f(e, t, n) {
		let r = d(c.scale * n, o, 10), i = r / c.scale;
		c.x = e - (e - c.x) * i, c.y = t - (t - c.y) * i, c.scale = r, u();
	}
	function p() {
		let t = e.value;
		t && f(t.offsetWidth / 2, t.offsetHeight / 2, 1 + s);
	}
	function m() {
		let t = e.value;
		t && f(t.offsetWidth / 2, t.offsetHeight / 2, 1 - s);
	}
	function h() {
		c.x = 0, c.y = 0, c.scale = 1, u();
	}
	function g(t) {
		let n = e.value;
		if (!n || !t.length) return;
		let r = Infinity, i = Infinity, a = -Infinity, s = -Infinity;
		for (let e of t) {
			let t = e.getBounds();
			t && (t.minX < r && (r = t.minX), t.minY < i && (i = t.minY), t.maxX > a && (a = t.maxX), t.maxY > s && (s = t.maxY));
		}
		if (!isFinite(r)) return;
		let l = a - r || 1, f = s - i || 1;
		c.scale = d(Math.min((n.offsetWidth - 48) / l, (n.offsetHeight - 48) / f), o, 10), c.x = (n.offsetWidth - l * c.scale) / 2 - r * c.scale, c.y = (n.offsetHeight - f * c.scale) / 2 - i * c.scale, u();
	}
	let _ = !1, v = {
		x: 0,
		y: 0
	};
	function y(e) {
		e.button === r && (_ = !0, v = {
			x: e.clientX - c.x,
			y: e.clientY - c.y
		});
	}
	function b(e) {
		_ && (c.x = e.clientX - v.x, c.y = e.clientY - v.y, u());
	}
	function S() {
		_ = !1;
	}
	function w(t) {
		t.preventDefault();
		let n = e.value.getBoundingClientRect(), r = t.deltaY < 0 ? 1 + s : 1 - s;
		f(t.clientX - n.left, t.clientY - n.top, r);
	}
	let T = [], E = 0;
	function D(e) {
		let t = [];
		for (let n of Array.from(e)) t.push({
			x: n.clientX,
			y: n.clientY
		});
		return t;
	}
	function k(e, t) {
		return Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
	}
	function A(e) {
		e.preventDefault(), T = D(e.touches), e.touches.length === 2 && (E = k(T[0], T[1]));
	}
	function j(t) {
		t.preventDefault();
		let n = D(t.touches), r = e.value.getBoundingClientRect();
		if (n.length === 1 && T.length >= 1 && (!a || a())) c.x += n[0].x - T[0].x, c.y += n[0].y - T[0].y, u();
		else if (n.length === 2 && T.length === 2) {
			let e = k(n[0], n[1]), t = e / E, i = (n[0].x + n[1].x) / 2 - r.left, a = (n[0].y + n[1].y) / 2 - r.top, s = (T[0].x + T[1].x) / 2 - r.left, l = (T[0].y + T[1].y) / 2 - r.top, f = d(c.scale * t, o, 10), p = f / c.scale;
			c.x = i - (i - c.x) * p + (i - s), c.y = a - (a - c.y) * p + (a - l), c.scale = f, E = e, u();
		}
		T = n;
	}
	function M(e) {
		T = D(e.touches), E = T.length === 2 ? k(T[0], T[1]) : 0;
	}
	return x(() => {
		let t = e.value;
		t.addEventListener("mousedown", y), t.addEventListener("mousemove", b), t.addEventListener("mouseup", S), t.addEventListener("mouseleave", S), t.addEventListener("touchstart", A, { passive: !1 }), t.addEventListener("touchmove", j, { passive: !1 }), t.addEventListener("touchend", M), t.addEventListener("wheel", w, { passive: !1 });
	}), C(() => {
		let t = e.value;
		t && (t.removeEventListener("mousedown", y), t.removeEventListener("mousemove", b), t.removeEventListener("mouseup", S), t.removeEventListener("mouseleave", S), t.removeEventListener("touchstart", A), t.removeEventListener("touchmove", j), t.removeEventListener("touchend", M), t.removeEventListener("wheel", w));
	}), {
		transform: c,
		cssTransform: l,
		zoomIn: p,
		zoomOut: m,
		resetView: h,
		zoomAt: f,
		fitView: g
	};
}
//#endregion
//#region src/vue/NoteCanvas.vue?vue&type=script&setup=true&lang.ts
var kc = { class: "note-canvas-wrapper" }, Ac = {
	key: 0,
	class: "mini-panel"
}, jc = { class: "mini-panel-row" }, Mc = ["disabled"], Nc = ["disabled"], Pc = /* @__PURE__ */ c({
	__name: "NoteCanvas",
	props: {
		background: { default: () => ({
			mode: "none",
			grid: {
				size: 80,
				color: "#777777",
				lineWidth: 1
			},
			ruled: {
				spacing: 40,
				color: "#777777",
				lineWidth: 1
			}
		}) },
		snapGridSize: { default: 80 },
		snapGridEnabled: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["tool-change"],
	setup(e, { expose: n, emit: r }) {
		Ni() || Mi(xa());
		let c = Ua(), l = r, u = e, d = E(null), { transform: f, zoomIn: p, zoomOut: m, resetView: h, fitView: g } = Oc(d, {
			panButton: 2,
			onTransformChange: () => {
				c.engine?.setViewTransform(f.x, f.y, f.scale), c.engine?.draw();
			},
			canPan: () => c.tool.tool === "move"
		}), _ = k(void 0), v = null, b = !1, S = 0, T = !1, D = 0, O = !1, A = !1, j = !1, M = !1, N = {
			x: 0,
			y: 0
		}, F = !1, I = {
			x: 0,
			y: 0
		};
		function L(e) {
			if (!d.value) return {
				x: 0,
				y: 0
			};
			let t = d.value.getBoundingClientRect();
			return {
				x: (e.clientX - t.left - f.x) / f.scale,
				y: (e.clientY - t.top - f.y) / f.scale
			};
		}
		function R(e) {
			if (!e.isPrimary || e.button !== 0 || !d.value || !_.value) return;
			if (c.tool.tool === "move") {
				F = !0, I = {
					x: e.clientX - f.x,
					y: e.clientY - f.y
				};
				return;
			}
			let t = L(e);
			if (c.selectedShapeId) {
				if (_.value.isOverDeleteHandle(t.x, t.y)) {
					c.destroyShape(c.selectedShapeId);
					return;
				}
				if (_.value.isOverDuplicateHandle(t.x, t.y)) {
					M = !0;
					return;
				}
				if (_.value.isOverMoveHandle(t.x, t.y)) {
					j = !0, N = t;
					return;
				}
			}
			if (c.tool.tool === "select") {
				let e = _.value.findShapeAt(t.x, t.y);
				e && e === c.selectedShapeId ? (j = !0, N = t) : e ? c.highlightShape(e) : c.highlightShape(null);
				return;
			}
			if (A && v) {
				A = !1, b = !0, S = Date.now();
				return;
			}
			if (T && v) {
				let e = Date.now(), n = v.doubleClickTimeout !== void 0 && e - D < v.doubleClickTimeout;
				D = e, n || _.value.handleDrawClick(t.x, t.y) === "done" ? (_.value.endShape(), T = !1, v = null, c.syncFromEngine()) : _.value.updateShape(t.x, t.y);
				return;
			}
			S = Date.now(), v = _.value.startShape({
				layer: c.tool.layer,
				color: c.tool.color ?? "black",
				width: c.tool.width ?? 2,
				tool: c.tool.tool,
				createdAt: S,
				x: t.x,
				y: t.y,
				rectMode: c.tool.rectMode
			});
			let n = v.drawingMode ?? "drag";
			n === "two-phase" ? O = !0 : n === "multi-click" ? (T = !0, D = Date.now()) : b = !0, v.onDrawPoint?.(t.x, t.y, 0);
		}
		function ee(e) {
			if (!e.isPrimary) return;
			if (F) {
				f.x = e.clientX - I.x, f.y = e.clientY - I.y, _.value?.setViewTransform(f.x, f.y, f.scale), _.value?.draw();
				return;
			}
			if (j && c.selectedShapeId) {
				let t = L(e);
				_.value?.moveShape(c.selectedShapeId, t.x - N.x, t.y - N.y), N = t;
				return;
			}
			if (d.value) {
				let t = L(e);
				c.selectedShapeId && _.value?.isOverMoveHandle(t.x, t.y) ? d.value.style.cursor = "grab" : c.selectedShapeId && _.value?.isOverDeleteHandle(t.x, t.y) ? d.value.style.cursor = "not-allowed" : c.selectedShapeId && _.value?.isOverDuplicateHandle(t.x, t.y) ? d.value.style.cursor = "copy" : c.tool.tool === "select" ? d.value.style.cursor = _.value?.findShapeAt(t.x, t.y) ? "pointer" : "" : d.value.style.cursor = "";
			}
			if (O || A || T) {
				_.value?.updateShape(L(e).x, L(e).y);
				return;
			}
			if (!b || !v) {
				let t = L(e);
				_.value?.hoverSnap(t.x, t.y, c.tool.tool);
				return;
			}
			let t = L(e);
			v.onDrawPoint?.(t.x, t.y, Date.now() - S), _.value?.updateShape(t.x, t.y);
		}
		function B(e) {
			if (e.isPrimary) {
				if (F) {
					F = !1;
					return;
				}
				if (M) {
					M = !1, c.selectedShapeId &&= _.value?.duplicateShape(c.selectedShapeId) ?? null, c.syncFromEngine();
					return;
				}
				if (j) {
					j = !1, d.value && (d.value.style.cursor = ""), _.value?.saveLocal(), c.syncFromEngine();
					return;
				}
				if (O && v) {
					let t = L(e);
					O = !1, _.value?.phaseTransition(t.x, t.y), A = !0;
					return;
				}
				if (!b) {
					_.value?.clearHoverSnap();
					return;
				}
				b = !1, v &&= (_.value?.endShape(), c.syncFromEngine(), null);
			}
		}
		return z(() => c.tool.bezier, (e) => {
			_.value && (_.value.bezier = e);
		}), z(() => c.tool.rectMode, () => {
			(O || A) && (_.value?.cancelShape(), O = !1, A = !1, b = !1, v = null);
		}), z(() => c.tool.tool, (e) => {
			(T || O || A) && (_.value?.cancelShape(), T = !1, O = !1, A = !1, v = null), e !== "select" && c.selectedShapeId && c.highlightShape(null);
		}), z(() => ({ ...c.tool }), (e) => {
			l("tool-change", e);
		}, { deep: !0 }), z(() => u.background, (e) => {
			c.setBackground(e), _.value?.setBackground(e);
		}, { deep: !0 }), z(() => u.snapGridSize, (e) => {
			c.snapGrid.size = e, _.value && (_.value.snapGridSize = e);
		}), z(() => u.snapGridEnabled, (e) => {
			c.snapGrid.enabled = e, _.value && (_.value.snapGridEnabled = e);
		}), x(() => {
			d.value && (d.value.addEventListener("touchstart", (e) => {
				e.touches.length >= 2 && (b || T || O || A) && (_.value?.cancelShape(), b = !1, T = !1, O = !1, A = !1, v = null);
			}, { passive: !0 }), _.value = new Ce(d.value, u.background), _.value.bezier = c.tool.bezier, _.value.snapGridEnabled = u.snapGridEnabled, _.value.snapGridSize = u.snapGridSize, c.engine = _.value, c.initSession(), c.title = _.value.title, c.backgroundState = _.value.backgroundState, c.snapGrid.enabled = u.snapGridEnabled, c.snapGrid.size = u.snapGridSize, c.layers = _.value.layers.map((e) => e.name), c.syncFromEngine(), c.registerZoom({
				zoomIn: p,
				zoomOut: m,
				resetView: h,
				fitView: () => g(_.value?.shapes ?? [])
			}));
		}), C(() => {
			_.value?.destroy();
		}), n({ engine: _ }), (e, n) => (w(), a("div", kc, [
			o("div", {
				ref_key: "canvasEl",
				ref: d,
				class: y(["note-canvas", {
					"cursor-grab": P(c).tool.tool === "move" && !P(F),
					"cursor-grabbing": P(c).tool.tool === "move" && P(F)
				}]),
				onPointerdown: V(R, ["prevent"]),
				onPointermove: V(ee, ["prevent"]),
				onPointerup: V(B, ["prevent"]),
				onPointerleave: V(B, ["prevent"]),
				onPointercancel: B,
				onContextmenu: n[0] ||= V(() => {}, ["prevent"])
			}, null, 34),
			s(Dc),
			s(Eo),
			s(t, { name: "mini" }, {
				default: te(() => [P(c).sidebarOpen ? i("", !0) : (w(), a("div", Ac, [o("div", jc, [o("button", {
					class: "btn",
					disabled: !P(c).canUndo,
					title: "Annuler",
					onClick: n[1] ||= (e) => P(c).undo()
				}, " ↩ ", 8, Mc), o("button", {
					class: "btn",
					disabled: !P(c).canRedo,
					title: "Rétablir",
					onClick: n[2] ||= (e) => P(c).redo()
				}, " ↪ ", 8, Nc)]), o("button", {
					class: "btn mini-open",
					title: "Ouvrir le panneau",
					onClick: n[3] ||= (e) => P(c).sidebarOpen = !0
				}, " › ")]))]),
				_: 1
			}),
			o("div", { class: y(["sidebar-wrapper", { closed: !P(c).sidebarOpen }]) }, [s(wc)], 2)
		]));
	}
});
//#endregion
export { Ce as Engine, re as Layer, Pc as NoteCanvas };
