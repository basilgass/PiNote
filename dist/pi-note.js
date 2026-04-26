import { Fragment as e, Teleport as t, Transition as n, computed as r, createBlock as i, createCommentVNode as a, createElementBlock as o, createElementVNode as s, createTextVNode as c, createVNode as l, defineComponent as u, effectScope as d, getCurrentInstance as f, getCurrentScope as p, hasInjectionContext as m, inject as h, isReactive as g, isRef as _, markRaw as v, mergeModels as y, nextTick as b, normalizeClass as x, normalizeStyle as S, onBeforeUnmount as C, onMounted as w, onScopeDispose as T, onUnmounted as E, openBlock as D, reactive as O, ref as k, renderList as A, shallowReactive as j, shallowRef as M, toDisplayString as N, toRaw as P, toRef as ee, toRefs as F, unref as I, useModel as L, useTemplateRef as te, vModelText as ne, vShow as re, watch as R, watchEffect as ie, withCtx as ae, withDirectives as oe, withModifiers as z } from "vue";
import * as se from "pdfjs-dist";
//#region src/core/Layer.ts
var ce = class {
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
}, le = class {
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
}, ue = class {
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
}, de = class {
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
}, fe = class {
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
}, pe = class {
	strategies = [];
	index = new le(100);
	_snapRadius;
	constructor(e) {
		this._snapRadius = e?.snapRadius ?? 10, this.addStrategies([
			new ue({
				gridSize: e?.gridSize ?? 30,
				priority: 10
			}),
			new de(),
			new fe()
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
function me(e) {
	return new Worker("/assets/snap.worker-DmTDuzap.js", { name: e?.name });
}
//#endregion
//#region src/snap/SnapWorkerClient.ts
var he = class {
	worker;
	_latestId = -1;
	_nextId = 0;
	_onResult = null;
	constructor() {
		this.worker = new me(), this.worker.onmessage = ({ data: e }) => {
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
}, B = class {
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
}, ge = class extends B {
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
			if (B.distToSegment(e, t, i.x, i.y, a.x, a.y) <= r) return !0;
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
		if (B.applyLineStyle(e, this.lineStyle, this.width, t), e.beginPath(), !this.bezier || n.length < 4) {
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
				B.drawArrowHead(e, this.points[t - 1].x, this.points[t - 1].y, i, n, this.arrowStyle, this.color, this.width);
			}
			if (this.arrowStart) {
				let t = Math.atan2(this.points[0].y - this.points[r].y, this.points[0].x - this.points[r].x);
				B.drawArrowHead(e, this.points[0].x, this.points[0].y, t, n, this.arrowStyle, this.color, this.width);
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
}, _e = class extends B {
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
		e.save(), e.beginPath(), e.moveTo(g, _), e.lineTo(v, y), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", B.applyLineStyle(e, this.lineStyle, this.width, i), e.stroke(), e.setLineDash([]), this.arrowEnd && B.drawArrowHead(e, this.x2, this.y2, b, x, this.arrowStyle, this.color, this.width), this.arrowStart && B.drawArrowHead(e, this.x1, this.y1, b + Math.PI, x, this.arrowStyle, this.color, this.width), e.restore();
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
}, ve = class extends B {
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
		this.arrowEnd && a > o && (l = this.x2 - o * .8 * Math.cos(i), u = this.y2 - o * .8 * Math.sin(i)), this.arrowStart && a > o && (s = this.x1 + o * .8 * Math.cos(i), c = this.y1 + o * .8 * Math.sin(i)), e.save(), e.beginPath(), e.moveTo(s, c), e.lineTo(l, u), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", B.applyLineStyle(e, this.lineStyle, this.width, t), e.stroke(), e.setLineDash([]), this.arrowEnd && B.drawArrowHead(e, this.x2, this.y2, i, o, this.arrowStyle, this.color, this.width), this.arrowStart && B.drawArrowHead(e, this.x1, this.y1, i + Math.PI, o, this.arrowStyle, this.color, this.width), e.restore();
	}
	update(e, t) {
		this.x2 = e, this.y2 = t;
	}
	hitTest(e, t, n) {
		return B.distToSegment(e, t, this.x1, this.y1, this.x2, this.y2) <= this.width / 2 + n;
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
}, ye = class extends B {
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
		e.save(), e.beginPath(), e.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2), this.fill && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), e.strokeStyle = this.color, e.lineWidth = this.width, B.applyLineStyle(e, this.lineStyle, this.width, t), e.stroke(), e.setLineDash([]);
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
}, be = class extends B {
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
			if (B.distToSegment(e, t, a.x, a.y, o.x, o.y) <= i) return !0;
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
			e.closePath(), this.fill && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), B.applyLineStyle(e, this.lineStyle, this.width, n), e.stroke(), e.setLineDash([]);
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
}, xe = class extends B {
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
			if (B.distToSegment(e, t, i.x, i.y, a.x, a.y) <= r) return !0;
		}
		if (this.closed && this.points.length >= 3) {
			let n = this.points[0], i = this.points[this.points.length - 1];
			if (B.distToSegment(e, t, i.x, i.y, n.x, n.y) <= r) return !0;
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
		if (this.closed && e.closePath(), this.fill && this.closed && (e.globalAlpha = this.fillOpacity, e.fillStyle = this.color, e.fill(), e.globalAlpha = 1), B.applyLineStyle(e, this.lineStyle, this.width, n), e.stroke(), e.setLineDash([]), !this.closed && this.cursorPos && r.length >= 2) {
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
}, Se = class e {
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
			case "eraser": return new ge(t ?? { tool: l }, p);
			case "line": return new _e(t ?? {
				x1: n,
				y1: r,
				x2: n,
				y2: r
			}, p);
			case "segment": return new ve(t ?? {
				x1: n,
				y1: r,
				x2: n,
				y2: r
			}, p);
			case "circle": return new ye(t ?? {
				cx: n,
				cy: r,
				radius: 0
			}, p);
			case "rectangle": return new be(t ?? {
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
			case "polygon": return new xe(t ?? { points: [] }, p);
			case "vector": return new ve(t ?? {
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
function Ce(e, t, n, r) {
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
function we(e, t, n, r) {
	let { spacing: i, color: a = "#cfd8ff", lineWidth: o = 1, marginTop: s = 0 } = r;
	e.save(), e.strokeStyle = a, e.lineWidth = o;
	for (let r = s; r <= n; r += i) e.beginPath(), e.moveTo(0, r), e.lineTo(t, r), e.stroke();
	e.restore();
}
function Te(e, t, n, r) {
	let { size: i, color: a = "#ddd", lineWidth: o = 1, orientation: s = "pointy" } = r;
	if (!(i <= 0)) {
		if (e.save(), e.strokeStyle = a, e.lineWidth = o, s === "pointy") {
			let r = Math.sqrt(3) * i, a = i * 1.5, o = Math.ceil(t / r) + 2, s = Math.ceil(n / a) + 2;
			for (let t = -1; t < s; t++) for (let n = -1; n < o; n++) Ee(e, n * r + (t % 2 == 0 ? 0 : r / 2), t * a, i, Math.PI / 6);
		} else {
			let r = Math.sqrt(3) * i, a = i * 1.5, o = Math.ceil(t / a) + 2, s = Math.ceil(n / r) + 2;
			for (let t = -1; t < s; t++) for (let n = -1; n < o; n++) Ee(e, n * a, t * r + (n % 2 == 0 ? 0 : r / 2), i, 0);
		}
		e.restore();
	}
}
function Ee(e, t, n, r, i) {
	e.beginPath();
	for (let a = 0; a < 6; a++) {
		let o = i + a * Math.PI / 3, s = t + r * Math.cos(o), c = n + r * Math.sin(o);
		a === 0 ? e.moveTo(s, c) : e.lineTo(s, c);
	}
	e.closePath(), e.stroke();
}
//#endregion
//#region src/snap/visual/SnapRenderer.ts
var De = class {
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
}, Oe = class e {
	bezier = !1;
	_title = "";
	static NO_SNAP_TOOLS = new Set([
		"pen",
		"highlighter",
		"eraser"
	]);
	container;
	overlay;
	_tempLayer;
	_layers;
	_shapes = [];
	_currentShape = null;
	_background = {
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
	};
	_pageId = "default";
	_onSaveCallback;
	_snapManager = new pe({ snapRadius: 10 });
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
	_referenceBitmap = null;
	_undoStack = [];
	_selectedShapeId = null;
	_snapGridEnabled = !1;
	_snapGridSize = 80;
	_gridPreviewTimer = null;
	constructor(e, t) {
		this.container = e, this.container.style.position = "relative", this._layers = {
			BACKGROUND: new ce(this.container, {
				name: "BACKGROUND",
				zIndex: 1
			}),
			REFERENCE: new ce(this.container, {
				name: "REFERENCE",
				zIndex: 2
			}),
			OVERLAY: new ce(this.container, {
				name: "OVERLAY",
				zIndex: 3
			}),
			MAIN: new ce(this.container, {
				name: "MAIN",
				zIndex: 4
			}),
			LAYER: new ce(this.container, {
				name: "LAYER",
				zIndex: 5
			})
		}, this._tempLayer = new ce(this.container, {
			name: "TEMP",
			zIndex: 6
		}), this.overlay = new ce(this.container, {
			name: "overlay",
			zIndex: 99
		}), this.snapRenderer = new De(this.overlay.ctx), this._snapWorkerClient = new he(), t && this._applyBackground(t), this._resizeObserver = new ResizeObserver(() => this.resize()), this._resizeObserver.observe(this.container), this._snapManager.setStrategyEnabled("grid", !1);
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
		let i = Se.create({
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
		if (!this._currentShape || (this.overlay.clear(), this._tempLayer.clear(), this._currentShape.onDrawMove?.(t, n, this._buildDrawingContext()))) return;
		let r = t, i = n, a = !e.NO_SNAP_TOOLS.has(this._currentShape.tool), o = a ? this.snapManager.snap(t, n, this._shapes, this._currentShape.layer) : null;
		a && o && (r = o.x, i = o.y), this._currentShape.update?.(r, i);
		let { x: s, y: c, scale: l } = this._viewTransform;
		if (a) {
			let e = this.overlay.ctx;
			e.save(), e.translate(s, c), e.scale(l, l), this.snapRenderer.draw(o), e.restore();
		}
		let u = this._tempLayer.ctx;
		u.save(), u.translate(s, c), u.scale(l, l), this._currentShape.draw(u), u.restore();
	}
	endShape() {
		if (!this._currentShape) return;
		let e = this._currentShape;
		if (this._currentShape = null, this.overlay.clear(), this._tempLayer.clear(), !e.isEmpty()) {
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
		for (let e of Object.values(this._layers)) e.visible && !e.locked && e.name !== "BACKGROUND" && e.name !== "REFERENCE" && e.name !== "OVERLAY" && e.clear();
		this._tempLayer.clear();
	}
	get referenceBitmap() {
		return this._referenceBitmap;
	}
	setReferenceBitmap(e) {
		this._referenceBitmap = e, this._drawReference();
	}
	_drawReference() {
		let e = this._layers.REFERENCE;
		if (e.clear(), !this._referenceBitmap) return;
		let { x: t, y: n, scale: r } = this._viewTransform, i = e.ctx;
		i.save(), i.translate(t, n), i.scale(r, r), i.drawImage(this._referenceBitmap, 0, 0), i.strokeStyle = "#aaaaaa", i.lineWidth = 1, i.strokeRect(0, 0, this._referenceBitmap.width, this._referenceBitmap.height), i.restore();
	}
	draw(e) {
		this._drawReference(), this.clearAll();
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
		for (let e of [
			...Object.values(this._layers),
			this._tempLayer,
			this.overlay
		]) e.resize(this.container);
		this.snapRenderer.updateCtx(this.overlay.ctx), this.renderBackground(this._background), this.draw();
	}
	setBackground(e) {
		this._applyBackground(e), e.mode === "grid" && e.grid?.size && (this._snapGridSize = e.grid.size, this._snapManager.setGridSize(e.grid.size)), this.draw();
		try {
			this.saveLocal();
		} catch {}
	}
	_applyBackground(e) {
		this._background = {
			mode: e.mode,
			grid: e.grid ?? this._background.grid,
			ruled: e.ruled ?? this._background.ruled,
			hex: e.hex ?? this._background.hex
		}, this.renderBackground(this._background);
	}
	renderBackground(e) {
		let t = this.getLayer("OVERLAY"), n = t.ctx, r = t.canvas.width, i = t.canvas.height;
		switch (n.clearRect(0, 0, r, i), e.mode) {
			case "grid":
				Ce(n, r, i, e.grid);
				break;
			case "ruled":
				we(n, r, i, e.ruled);
				break;
			case "hex":
				Te(n, r, i, e.hex);
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
		this._shapes = [], this._undoStack = [], this._selectedShapeId = null, this._title = "", this._markGeometryDirty(), this.overlay.clear(), this.clearAll(), this._applyBackground({ mode: "none" }), this.setReferenceBitmap(null);
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
			let t = Se.fromJSON(e);
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
			"REFERENCE",
			"OVERLAY",
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
				Ce(v, u, d, this._background.grid);
				break;
			case "ruled":
				we(v, u, d, this._background.ruled);
				break;
			case "hex":
				Te(v, u, d, this._background.hex);
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
		this._currentShape && (this._currentShape = null, this.overlay.clear(), this._tempLayer.clear());
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
		let r = Se.fromJSON(n);
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
		return this._geometryDirty &&= (this._cachedGeometry = he.buildGeometry(this._shapes), !1), this._cachedGeometry;
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
}, ke = Object.create, Ae = Object.defineProperty, je = Object.getOwnPropertyDescriptor, Me = Object.getOwnPropertyNames, Ne = Object.getPrototypeOf, Pe = Object.prototype.hasOwnProperty, Fe = (e, t) => function() {
	return e && (t = (0, e[Me(e)[0]])(e = 0)), t;
}, Ie = (e, t) => function() {
	return t || (0, e[Me(e)[0]])((t = { exports: {} }).exports, t), t.exports;
}, Le = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (let i of Me(t)) !Pe.call(e, i) && i !== n && Ae(e, i, {
		get: () => t[i],
		enumerable: !(r = je(t, i)) || r.enumerable
	});
	return e;
}, Re = (e, t, n) => (n = e == null ? {} : ke(Ne(e)), Le(t || !e || !e.__esModule ? Ae(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), ze = Fe({ "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {} }), Be = Ie({ "../../node_modules/.pnpm/rfdc@1.4.1/node_modules/rfdc/index.js"(e, t) {
	ze(), t.exports = r;
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
ze(), ze(), ze();
var Ve = typeof navigator < "u", V = typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : typeof global < "u" ? global : {};
V.chrome !== void 0 && V.chrome.devtools, Ve && (V.self, V.top), typeof navigator < "u" && navigator.userAgent?.toLowerCase().includes("electron"), typeof window < "u" && window.__NUXT__, ze();
var He = Re(Be(), 1), Ue = /(?:^|[-_/])(\w)/g;
function We(e, t) {
	return t ? t.toUpperCase() : "";
}
function Ge(e) {
	return e && `${e}`.replace(Ue, We);
}
function Ke(e, t) {
	let n = e.replace(/^[a-z]:/i, "").replace(/\\/g, "/");
	n.endsWith(`index${t}`) && (n = n.replace(`/index${t}`, t));
	let r = n.lastIndexOf("/"), i = n.substring(r + 1);
	if (t) {
		let e = i.lastIndexOf(t);
		return i.substring(0, e);
	}
	return "";
}
var qe = (0, He.default)({ circles: !0 }), Je = { trailing: !0 };
function Ye(e, t = 25, n = {}) {
	if (n = {
		...Je,
		...n
	}, !Number.isFinite(t)) throw TypeError("Expected `wait` to be a finite number");
	let r, i, a = [], o, s, c = (t, r) => (o = Xe(e, t, r), o.finally(() => {
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
async function Xe(e, t, n) {
	return await e.apply(t, n);
}
//#endregion
//#region node_modules/hookable/dist/index.mjs
function Ze(e, t = {}, n) {
	for (let r in e) {
		let i = e[r], a = n ? `${n}:${r}` : r;
		typeof i == "object" && i ? Ze(i, t, a) : typeof i == "function" && (t[a] = i);
	}
	return t;
}
var Qe = { run: (e) => e() }, $e = console.createTask === void 0 ? () => Qe : console.createTask;
function et(e, t) {
	let n = $e(t.shift());
	return e.reduce((e, r) => e.then(() => n.run(() => r(...t))), Promise.resolve());
}
function tt(e, t) {
	let n = $e(t.shift());
	return Promise.all(e.map((e) => n.run(() => e(...t))));
}
function nt(e, t) {
	for (let n of [...e]) n(t);
}
var rt = class {
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
		let t = Ze(e), n = Object.keys(t).map((e) => this.hook(e, t[e]));
		return () => {
			for (let e of n.splice(0, n.length)) e();
		};
	}
	removeHooks(e) {
		let t = Ze(e);
		for (let e in t) this.removeHook(e, t[e]);
	}
	removeAllHooks() {
		for (let e in this._hooks) delete this._hooks[e];
	}
	callHook(e, ...t) {
		return t.unshift(e), this.callHookWith(et, e, ...t);
	}
	callHookParallel(e, ...t) {
		return t.unshift(e), this.callHookWith(tt, e, ...t);
	}
	callHookWith(e, t, ...n) {
		let r = this._before || this._after ? {
			name: t,
			args: n,
			context: {}
		} : void 0;
		this._before && nt(this._before, r);
		let i = e(t in this._hooks ? [...this._hooks[t]] : [], n);
		return i instanceof Promise ? i.finally(() => {
			this._after && r && nt(this._after, r);
		}) : (this._after && r && nt(this._after, r), i);
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
function it() {
	return new rt();
}
//#endregion
//#region node_modules/@vue/devtools-kit/dist/index.js
var at = Object.create, ot = Object.defineProperty, st = Object.getOwnPropertyDescriptor, ct = Object.getOwnPropertyNames, lt = Object.getPrototypeOf, ut = Object.prototype.hasOwnProperty, dt = (e, t) => function() {
	return e && (t = (0, e[ct(e)[0]])(e = 0)), t;
}, ft = (e, t) => function() {
	return t || (0, e[ct(e)[0]])((t = { exports: {} }).exports, t), t.exports;
}, pt = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (let i of ct(t)) !ut.call(e, i) && i !== n && ot(e, i, {
		get: () => t[i],
		enumerable: !(r = st(t, i)) || r.enumerable
	});
	return e;
}, mt = (e, t, n) => (n = e == null ? {} : at(lt(e)), pt(t || !e || !e.__esModule ? ot(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), H = dt({ "../../node_modules/.pnpm/tsup@8.4.0_@microsoft+api-extractor@7.51.1_@types+node@22.13.14__jiti@2.4.2_postcss@8.5_96eb05a9d65343021e53791dd83f3773/node_modules/tsup/assets/esm_shims.js"() {} }), ht = ft({ "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/lib/speakingurl.js"(e, t) {
	H(), (function(e) {
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
} }), gt = ft({ "../../node_modules/.pnpm/speakingurl@14.0.1/node_modules/speakingurl/index.js"(e, t) {
	H(), t.exports = ht();
} });
H(), H(), H(), H(), H(), H(), H(), H();
function _t(e) {
	let t = e.name || e._componentTag || e.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ || e.__name;
	return t === "index" && e.__file?.endsWith("index.vue") ? "" : t;
}
function vt(e) {
	let t = e.__file;
	if (t) return Ge(Ke(t, ".vue"));
}
function yt(e, t) {
	return e.type.__VUE_DEVTOOLS_COMPONENT_GUSSED_NAME__ = t, t;
}
function bt(e) {
	if (e.__VUE_DEVTOOLS_NEXT_APP_RECORD__) return e.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
	if (e.root) return e.appContext.app.__VUE_DEVTOOLS_NEXT_APP_RECORD__;
}
function xt(e) {
	let t = e.subTree?.type, n = bt(e);
	return n ? n?.types?.Fragment === t : !1;
}
function St(e) {
	let t = _t(e?.type || {});
	if (t) return t;
	if (e?.root === e) return "Root";
	for (let t in e.parent?.type?.components) if (e.parent.type.components[t] === e?.type) return yt(e, t);
	for (let t in e.appContext?.components) if (e.appContext.components[t] === e?.type) return yt(e, t);
	return vt(e?.type || {}) || "Anonymous Component";
}
function Ct(e) {
	return `${e?.appContext?.app?.__VUE_DEVTOOLS_NEXT_APP_RECORD_ID__ ?? 0}:${e === e?.root ? "root" : e.uid}`;
}
function wt(e, t) {
	return t ||= `${e.id}:root`, e.instanceMap.get(t) || e.instanceMap.get(":root");
}
function Tt() {
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
var Et;
function Dt(e) {
	return Et ||= document.createRange(), Et.selectNode(e), Et.getBoundingClientRect();
}
function Ot(e) {
	let t = Tt();
	if (!e.children) return t;
	for (let n = 0, r = e.children.length; n < r; n++) {
		let r = e.children[n], i;
		if (r.component) i = jt(r.component);
		else if (r.el) {
			let e = r.el;
			e.nodeType === 1 || e.getBoundingClientRect ? i = e.getBoundingClientRect() : e.nodeType === 3 && e.data.trim() && (i = Dt(e));
		}
		i && kt(t, i);
	}
	return t;
}
function kt(e, t) {
	return (!e.top || t.top < e.top) && (e.top = t.top), (!e.bottom || t.bottom > e.bottom) && (e.bottom = t.bottom), (!e.left || t.left < e.left) && (e.left = t.left), (!e.right || t.right > e.right) && (e.right = t.right), e;
}
var At = {
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	width: 0,
	height: 0
};
function jt(e) {
	let t = e.subTree.el;
	return typeof window > "u" ? At : xt(e) ? Ot(e.subTree) : t?.nodeType === 1 ? t?.getBoundingClientRect() : e.subTree.component ? jt(e.subTree.component) : At;
}
H();
function Mt(e) {
	return xt(e) ? Nt(e.subTree) : e.subTree ? [e.subTree.el] : [];
}
function Nt(e) {
	if (!e.children) return [];
	let t = [];
	return e.children.forEach((e) => {
		e.component ? t.push(...Mt(e.component)) : e?.el && t.push(e.el);
	}), t;
}
var Pt = "__vue-devtools-component-inspector__", Ft = "__vue-devtools-component-inspector__card__", It = "__vue-devtools-component-inspector__name__", Lt = "__vue-devtools-component-inspector__indicator__", Rt = {
	display: "block",
	zIndex: 2147483640,
	position: "fixed",
	backgroundColor: "#42b88325",
	border: "1px solid #42b88350",
	borderRadius: "5px",
	transition: "all 0.1s ease-in",
	pointerEvents: "none"
}, zt = {
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
}, Bt = {
	display: "inline-block",
	fontWeight: 400,
	fontStyle: "normal",
	fontSize: "12px",
	opacity: .7
};
function Vt() {
	return document.getElementById(Pt);
}
function Ht() {
	return document.getElementById(Ft);
}
function Ut() {
	return document.getElementById(Lt);
}
function Wt() {
	return document.getElementById(It);
}
function Gt(e) {
	return {
		left: `${Math.round(e.left * 100) / 100}px`,
		top: `${Math.round(e.top * 100) / 100}px`,
		width: `${Math.round(e.width * 100) / 100}px`,
		height: `${Math.round(e.height * 100) / 100}px`
	};
}
function Kt(e) {
	let t = document.createElement("div");
	t.id = e.elementId ?? Pt, Object.assign(t.style, {
		...Rt,
		...Gt(e.bounds),
		...e.style
	});
	let n = document.createElement("span");
	n.id = Ft, Object.assign(n.style, {
		...zt,
		top: e.bounds.top < 35 ? 0 : "-35px"
	});
	let r = document.createElement("span");
	r.id = It, r.innerHTML = `&lt;${e.name}&gt;&nbsp;&nbsp;`;
	let i = document.createElement("i");
	return i.id = Lt, i.innerHTML = `${Math.round(e.bounds.width * 100) / 100} x ${Math.round(e.bounds.height * 100) / 100}`, Object.assign(i.style, Bt), n.appendChild(r), n.appendChild(i), t.appendChild(n), document.body.appendChild(t), t;
}
function qt(e) {
	let t = Vt(), n = Ht(), r = Wt(), i = Ut();
	t && (Object.assign(t.style, {
		...Rt,
		...Gt(e.bounds)
	}), Object.assign(n.style, { top: e.bounds.top < 35 ? 0 : "-35px" }), r.innerHTML = `&lt;${e.name}&gt;&nbsp;&nbsp;`, i.innerHTML = `${Math.round(e.bounds.width * 100) / 100} x ${Math.round(e.bounds.height * 100) / 100}`);
}
function Jt(e) {
	let t = jt(e);
	if (!t.width && !t.height) return;
	let n = St(e);
	Vt() ? qt({
		bounds: t,
		name: n
	}) : Kt({
		bounds: t,
		name: n
	});
}
function Yt() {
	let e = Vt();
	e && (e.style.display = "none");
}
var Xt = null;
function Zt(e) {
	let t = e.target;
	if (t) {
		let e = t.__vueParentComponent;
		if (e && (Xt = e, e.vnode.el)) {
			let t = jt(e), n = St(e);
			Vt() ? qt({
				bounds: t,
				name: n
			}) : Kt({
				bounds: t,
				name: n
			});
		}
	}
}
function Qt(e, t) {
	e.preventDefault(), e.stopPropagation(), Xt && t(Ct(Xt));
}
var $t = null;
function en() {
	Yt(), window.removeEventListener("mouseover", Zt), window.removeEventListener("click", $t, !0), $t = null;
}
function tn() {
	return window.addEventListener("mouseover", Zt), new Promise((e) => {
		function t(n) {
			n.preventDefault(), n.stopPropagation(), Qt(n, (n) => {
				window.removeEventListener("click", t, !0), $t = null, window.removeEventListener("mouseover", Zt);
				let r = Vt();
				r && (r.style.display = "none"), e(JSON.stringify({ id: n }));
			});
		}
		$t = t, window.addEventListener("click", t, !0);
	});
}
function nn(e) {
	let t = wt(U.value, e.id);
	if (t) {
		let [n] = Mt(t);
		if (typeof n.scrollIntoView == "function") n.scrollIntoView({ behavior: "smooth" });
		else {
			let e = jt(t), n = document.createElement("div"), r = {
				...Gt(e),
				position: "absolute"
			};
			Object.assign(n.style, r), document.body.appendChild(n), n.scrollIntoView({ behavior: "smooth" }), setTimeout(() => {
				document.body.removeChild(n);
			}, 2e3);
		}
		setTimeout(() => {
			let n = jt(t);
			if (n.width || n.height) {
				let r = St(t), i = Vt();
				i ? qt({
					...e,
					name: r,
					bounds: n
				}) : Kt({
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
H();
var rn;
(rn = V).__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ ?? (rn.__VUE_DEVTOOLS_COMPONENT_INSPECTOR_ENABLED__ = !0);
function an(e) {
	let t = 0, n = setInterval(() => {
		V.__VUE_INSPECTOR__ && (clearInterval(n), t += 30, e()), t >= 5e3 && clearInterval(n);
	}, 30);
}
function on() {
	let e = V.__VUE_INSPECTOR__, t = e.openInEditor;
	e.openInEditor = async (...n) => {
		e.disable(), t(...n);
	};
}
function sn() {
	return new Promise((e) => {
		function t() {
			on(), e(V.__VUE_INSPECTOR__);
		}
		V.__VUE_INSPECTOR__ ? t() : an(() => {
			t();
		});
	});
}
H(), H();
function cn(e) {
	return !!(e && e.__v_isReadonly);
}
function ln(e) {
	return cn(e) ? ln(e.__v_raw) : !!(e && e.__v_isReactive);
}
function un(e) {
	return !!(e && e.__v_isRef === !0);
}
function dn(e) {
	let t = e && e.__v_raw;
	return t ? dn(t) : e;
}
var fn = class {
	constructor() {
		this.refEditor = new pn();
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
			if ((e.remove || e.newKey) && (Array.isArray(t) ? t.splice(n, 1) : dn(t) instanceof Map ? t.delete(n) : dn(t) instanceof Set ? t.delete(Array.from(t.values())[n]) : Reflect.deleteProperty(t, n)), !e.remove) {
				let i = t[e.newKey || n];
				this.refEditor.isRef(i) ? this.refEditor.set(i, r) : dn(t) instanceof Map ? t.set(e.newKey || n, r) : dn(t) instanceof Set ? t.add(r) : t[e.newKey || n] = r;
			}
		};
	}
}, pn = class {
	set(e, t) {
		if (un(e)) e.value = t;
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
		return un(e) ? e.value : e;
	}
	isRef(e) {
		return un(e) || ln(e);
	}
};
new fn(), H(), H(), H();
var mn = "__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS_STATE__";
function hn() {
	if (typeof window > "u" || !Ve || typeof localStorage > "u" || localStorage === null) return {
		recordingState: !1,
		mouseEventEnabled: !1,
		keyboardEventEnabled: !1,
		componentEventEnabled: !1,
		performanceEventEnabled: !1,
		selected: ""
	};
	let e = localStorage.getItem === void 0 ? null : localStorage.getItem(mn);
	return e ? JSON.parse(e) : {
		recordingState: !1,
		mouseEventEnabled: !1,
		keyboardEventEnabled: !1,
		componentEventEnabled: !1,
		performanceEventEnabled: !1,
		selected: ""
	};
}
H(), H(), H();
var gn;
(gn = V).__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS ?? (gn.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS = []);
var _n = new Proxy(V.__VUE_DEVTOOLS_KIT_TIMELINE_LAYERS, { get(e, t, n) {
	return Reflect.get(e, t, n);
} });
function vn(e, t) {
	W.timelineLayersState[t.id] = !1, _n.push({
		...e,
		descriptorId: t.id,
		appRecord: bt(t.app)
	});
}
var yn;
(yn = V).__VUE_DEVTOOLS_KIT_INSPECTOR__ ?? (yn.__VUE_DEVTOOLS_KIT_INSPECTOR__ = []);
var bn = new Proxy(V.__VUE_DEVTOOLS_KIT_INSPECTOR__, { get(e, t, n) {
	return Reflect.get(e, t, n);
} }), xn = Ye(() => {
	_r.hooks.callHook("sendInspectorToClient", Cn());
});
function Sn(e, t) {
	bn.push({
		options: e,
		descriptor: t,
		treeFilterPlaceholder: e.treeFilterPlaceholder ?? "Search tree...",
		stateFilterPlaceholder: e.stateFilterPlaceholder ?? "Search state...",
		treeFilter: "",
		selectedNodeId: "",
		appRecord: bt(t.app)
	}), xn();
}
function Cn() {
	return bn.filter((e) => e.descriptor.app === U.value.app).filter((e) => e.descriptor.id !== "components").map((e) => {
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
function wn(e, t) {
	return bn.find((n) => n.options.id === e && (t ? n.descriptor.app === t : !0));
}
function Tn() {
	let e = it();
	e.hook("addInspector", ({ inspector: e, plugin: t }) => {
		Sn(e, t.descriptor);
	});
	let t = Ye(async ({ inspectorId: t, plugin: n }) => {
		if (!t || !n?.descriptor?.app || W.highPerfModeEnabled) return;
		let r = wn(t, n.descriptor.app), i = {
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
	let n = Ye(async ({ inspectorId: t, plugin: n }) => {
		if (!t || !n?.descriptor?.app || W.highPerfModeEnabled) return;
		let r = wn(t, n.descriptor.app), i = {
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
		let r = wn(e, n.descriptor.app);
		r && (r.selectedNodeId = t);
	}), e.hook("timelineLayerAdded", ({ options: e, plugin: t }) => {
		vn(e, t.descriptor);
	}), e.hook("timelineEventAdded", ({ options: t, plugin: n }) => {
		W.highPerfModeEnabled || !W.timelineLayersState?.[n.descriptor.id] && ![
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
	}), e.hook("getComponentBounds", async ({ instance: e }) => jt(e)), e.hook("getComponentName", ({ instance: e }) => St(e)), e.hook("componentHighlight", ({ uid: e }) => {
		let t = U.value.instanceMap.get(e);
		t && Jt(t);
	}), e.hook("componentUnhighlight", () => {
		Yt();
	}), e;
}
var En;
(En = V).__VUE_DEVTOOLS_KIT_APP_RECORDS__ ?? (En.__VUE_DEVTOOLS_KIT_APP_RECORDS__ = []);
var Dn;
(Dn = V).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ ?? (Dn.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = {});
var On;
(On = V).__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ ?? (On.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = "");
var kn;
(kn = V).__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ ?? (kn.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ = []);
var An;
(An = V).__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ ?? (An.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ = []);
var jn = "__VUE_DEVTOOLS_KIT_GLOBAL_STATE__";
function Mn() {
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
		timelineLayersState: hn()
	};
}
var Nn;
(Nn = V)[jn] ?? (Nn[jn] = Mn());
var Pn = Ye((e) => {
	_r.hooks.callHook("devtoolsStateUpdated", { state: e });
});
Ye((e, t) => {
	_r.hooks.callHook("devtoolsConnectedUpdated", {
		state: e,
		oldState: t
	});
});
var Fn = new Proxy(V.__VUE_DEVTOOLS_KIT_APP_RECORDS__, { get(e, t, n) {
	return t === "value" ? V.__VUE_DEVTOOLS_KIT_APP_RECORDS__ : V.__VUE_DEVTOOLS_KIT_APP_RECORDS__[t];
} }), U = new Proxy(V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__, { get(e, t, n) {
	return t === "value" ? V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ : t === "id" ? V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ : V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__[t];
} });
function In() {
	Pn({
		...V[jn],
		appRecords: Fn.value,
		activeAppRecordId: U.id,
		tabs: V.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__,
		commands: V.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__
	});
}
function Ln(e) {
	V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD__ = e, In();
}
function Rn(e) {
	V.__VUE_DEVTOOLS_KIT_ACTIVE_APP_RECORD_ID__ = e, In();
}
var W = new Proxy(V[jn], {
	get(e, t) {
		return t === "appRecords" ? Fn : t === "activeAppRecordId" ? U.id : t === "tabs" ? V.__VUE_DEVTOOLS_KIT_CUSTOM_TABS__ : t === "commands" ? V.__VUE_DEVTOOLS_KIT_CUSTOM_COMMANDS__ : V[jn][t];
	},
	deleteProperty(e, t) {
		return delete e[t], !0;
	},
	set(e, t, n) {
		return { ...V[jn] }, e[t] = n, V[jn][t] = n, !0;
	}
});
function zn(e = {}) {
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
		} else if (W.vitePluginDetected) {
			let e = V.__VUE_DEVTOOLS_OPEN_IN_EDITOR_BASE_URL__ ?? r;
			V.__VUE_INSPECTOR__.openInEditor(e, t, i, a);
		}
	}
}
H(), H(), H(), H(), H();
var Bn;
(Bn = V).__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__ ?? (Bn.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__ = []);
var Vn = new Proxy(V.__VUE_DEVTOOLS_KIT_PLUGIN_BUFFER__, { get(e, t, n) {
	return Reflect.get(e, t, n);
} });
function Hn(e) {
	let t = {};
	return Object.keys(e).forEach((n) => {
		t[n] = e[n].defaultValue;
	}), t;
}
function Un(e) {
	return `__VUE_DEVTOOLS_NEXT_PLUGIN_SETTINGS__${e}__`;
}
function Wn(e) {
	return (Vn.find((t) => t[0].id === e && !!t[0]?.settings)?.[0] ?? null)?.settings ?? null;
}
function Gn(e, t) {
	let n = Un(e);
	if (n) {
		let e = localStorage.getItem(n);
		if (e) return JSON.parse(e);
	}
	return Hn(e ? (Vn.find((t) => t[0].id === e)?.[0] ?? null)?.settings ?? {} : t);
}
function Kn(e, t) {
	let n = Un(e);
	localStorage.getItem(n) || localStorage.setItem(n, JSON.stringify(Hn(t)));
}
function qn(e, t, n) {
	let r = Un(e), i = localStorage.getItem(r), a = JSON.parse(i || "{}"), o = {
		...a,
		[t]: n
	};
	localStorage.setItem(r, JSON.stringify(o)), _r.hooks.callHookWith((r) => {
		r.forEach((r) => r({
			pluginId: e,
			key: t,
			oldValue: a[t],
			newValue: n,
			settings: o
		}));
	}, "setPluginSettings");
}
H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H();
var Jn, G = (Jn = V).__VUE_DEVTOOLS_HOOK ?? (Jn.__VUE_DEVTOOLS_HOOK = it()), Yn = {
	on: {
		vueAppInit(e) {
			G.hook("app:init", e);
		},
		vueAppUnmount(e) {
			G.hook("app:unmount", e);
		},
		vueAppConnected(e) {
			G.hook("app:connected", e);
		},
		componentAdded(e) {
			return G.hook("component:added", e);
		},
		componentEmit(e) {
			return G.hook("component:emit", e);
		},
		componentUpdated(e) {
			return G.hook("component:updated", e);
		},
		componentRemoved(e) {
			return G.hook("component:removed", e);
		},
		setupDevtoolsPlugin(e) {
			G.hook("devtools-plugin:setup", e);
		},
		perfStart(e) {
			return G.hook("perf:start", e);
		},
		perfEnd(e) {
			return G.hook("perf:end", e);
		}
	},
	setupDevToolsPlugin(e, t) {
		return G.callHook("devtools-plugin:setup", e, t);
	}
}, Xn = class {
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
		if (W.highPerfModeEnabled) return;
		let t = Cn().find((e) => e.packageName === this.plugin.descriptor.packageName);
		if (t?.id) {
			if (e) {
				let t = [
					e.appContext.app,
					e.uid,
					e.parent?.uid,
					e
				];
				G.callHook("component:updated", ...t);
			} else G.callHook("component:updated");
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
		}), this.plugin.descriptor.settings && Kn(e.id, this.plugin.descriptor.settings);
	}
	sendInspectorTree(e) {
		W.highPerfModeEnabled || this.hooks.callHook("sendInspectorTree", {
			inspectorId: e,
			plugin: this.plugin
		});
	}
	sendInspectorState(e) {
		W.highPerfModeEnabled || this.hooks.callHook("sendInspectorState", {
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
		return W.highPerfModeEnabled ? 0 : Date.now();
	}
	addTimelineLayer(e) {
		this.hooks.callHook("timelineLayerAdded", {
			options: e,
			plugin: this.plugin
		});
	}
	addTimelineEvent(e) {
		W.highPerfModeEnabled || this.hooks.callHook("timelineEventAdded", {
			options: e,
			plugin: this.plugin
		});
	}
	getSettings(e) {
		return Gn(e ?? this.plugin.descriptor.id, this.plugin.descriptor.settings);
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
H(), H(), H(), H();
var Zn = "__vue_devtool_undefined__", Qn = "__vue_devtool_infinity__", $n = "__vue_devtool_negative_infinity__", er = "__vue_devtool_nan__";
H(), H(), Object.entries({
	[Zn]: "undefined",
	[er]: "NaN",
	[Qn]: "Infinity",
	[$n]: "-Infinity"
}).reduce((e, [t, n]) => (e[n] = t, e), {}), H(), H(), H(), H(), H();
var tr;
(tr = V).__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__ ?? (tr.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__ = /* @__PURE__ */ new Set());
function nr(e, t) {
	return Yn.setupDevToolsPlugin(e, t);
}
function rr(e, t) {
	let [n, r] = e;
	if (n.app !== t) return;
	let i = new Xn({
		plugin: {
			setupFn: r,
			descriptor: n
		},
		ctx: _r
	});
	n.packageName === "vuex" && i.on.editInspectorState((e) => {
		i.sendInspectorState(e.inspectorId);
	}), r(i);
}
function ir(e, t) {
	V.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.has(e) || W.highPerfModeEnabled && !t?.inspectingComponent || (V.__VUE_DEVTOOLS_KIT__REGISTERED_PLUGIN_APPS__.add(e), Vn.forEach((t) => {
		rr(t, e);
	}));
}
H(), H();
var ar = "__VUE_DEVTOOLS_ROUTER__", or = "__VUE_DEVTOOLS_ROUTER_INFO__", sr;
(sr = V).__VUE_DEVTOOLS_ROUTER_INFO__ ?? (sr.__VUE_DEVTOOLS_ROUTER_INFO__ = {
	currentRoute: null,
	routes: []
});
var cr;
(cr = V).__VUE_DEVTOOLS_ROUTER__ ?? (cr.__VUE_DEVTOOLS_ROUTER__ = {}), new Proxy(V[or], { get(e, t) {
	return V[or][t];
} }), new Proxy(V[ar], { get(e, t) {
	if (t === "value") return V[ar];
} });
function lr(e) {
	let t = /* @__PURE__ */ new Map();
	return (e?.getRoutes() || []).filter((e) => !t.has(e.path) && t.set(e.path, 1));
}
function ur(e) {
	return e.map((e) => {
		let { path: t, name: n, children: r, meta: i } = e;
		return r?.length && (r = ur(r)), {
			path: t,
			name: n,
			children: r,
			meta: i
		};
	});
}
function dr(e) {
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
			matched: ur(o)
		};
	}
	return e;
}
function fr(e, t) {
	function n() {
		let t = e.app?.config.globalProperties.$router, n = dr(t?.currentRoute.value), r = ur(lr(t)), i = console.warn;
		console.warn = () => {}, V[or] = {
			currentRoute: n ? qe(n) : {},
			routes: qe(r)
		}, V[ar] = t, console.warn = i;
	}
	n(), Yn.on.componentUpdated(Ye(() => {
		t.value?.app === e.app && (n(), !W.highPerfModeEnabled && _r.hooks.callHook("routerInfoUpdated", { state: V[or] }));
	}, 200));
}
function pr(e) {
	return {
		async getInspectorTree(t) {
			let n = {
				...t,
				app: U.value.app,
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
				app: U.value.app,
				state: null
			}, r = { currentTab: `custom-inspector:${t.inspectorId}` };
			return await new Promise((t) => {
				e.callHookWith(async (e) => {
					await Promise.all(e.map((e) => e(n, r))), t();
				}, "getInspectorState");
			}), n.state;
		},
		editInspectorState(t) {
			let n = new fn(), r = {
				...t,
				app: U.value.app,
				set: (e, r = t.path, i = t.state.value, a) => {
					n.set(e, r, i, a || n.createDefaultSetCallback(t.state));
				}
			};
			e.callHookWith((e) => {
				e.forEach((e) => e(r));
			}, "editInspectorState");
		},
		sendInspectorState(t) {
			let n = wn(t);
			e.callHook("sendInspectorState", {
				inspectorId: t,
				plugin: {
					descriptor: n.descriptor,
					setupFn: () => ({})
				}
			});
		},
		inspectComponentInspector() {
			return tn();
		},
		cancelInspectComponentInspector() {
			return en();
		},
		getComponentRenderCode(e) {
			let t = wt(U.value, e);
			if (t) return typeof t?.type == "function" ? t.type.toString() : t.render.toString();
		},
		scrollToComponent(e) {
			return nn({ id: e });
		},
		openInEditor: zn,
		getVueInspector: sn,
		toggleApp(e, t) {
			let n = Fn.value.find((t) => t.id === e);
			n && (Rn(e), Ln(n), fr(n, U), xn(), ir(n.app, t));
		},
		inspectDOM(e) {
			let t = wt(U.value, e);
			if (t) {
				let [e] = Mt(t);
				e && (V.__VUE_DEVTOOLS_INSPECT_DOM_TARGET__ = e);
			}
		},
		updatePluginSettings(e, t, n) {
			qn(e, t, n);
		},
		getPluginSettings(e) {
			return {
				options: Wn(e),
				values: Gn(e)
			};
		}
	};
}
H();
var mr;
(mr = V).__VUE_DEVTOOLS_ENV__ ?? (mr.__VUE_DEVTOOLS_ENV__ = { vitePluginDetected: !1 });
var hr = Tn(), gr;
(gr = V).__VUE_DEVTOOLS_KIT_CONTEXT__ ?? (gr.__VUE_DEVTOOLS_KIT_CONTEXT__ = {
	hooks: hr,
	get state() {
		return {
			...W,
			activeAppRecordId: U.id,
			activeAppRecord: U.value,
			appRecords: Fn.value
		};
	},
	api: pr(hr)
});
var _r = V.__VUE_DEVTOOLS_KIT_CONTEXT__;
H(), mt(gt(), 1);
var vr;
(vr = V).__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__ ?? (vr.__VUE_DEVTOOLS_NEXT_APP_RECORD_INFO__ = {
	id: 0,
	appIds: /* @__PURE__ */ new Set()
}), H(), H();
function yr(e) {
	W.highPerfModeEnabled = e ?? !W.highPerfModeEnabled, !e && U.value && ir(U.value.app);
}
H(), H(), H();
function br(e) {
	W.devtoolsClientDetected = {
		...W.devtoolsClientDetected,
		...e
	}, yr(!Object.values(W.devtoolsClientDetected).some(Boolean));
}
var xr;
(xr = V).__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__ ?? (xr.__VUE_DEVTOOLS_UPDATE_CLIENT_DETECTED__ = br), H(), H(), H(), H(), H(), H(), H();
var Sr = class {
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
}, Cr = class {
	constructor(e) {
		this.generateIdentifier = e, this.kv = new Sr();
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
}, wr = class extends Cr {
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
H(), H();
function Tr(e) {
	if ("values" in Object) return Object.values(e);
	let t = [];
	for (let n in e) e.hasOwnProperty(n) && t.push(e[n]);
	return t;
}
function Er(e, t) {
	let n = Tr(e);
	if ("find" in n) return n.find(t);
	let r = n;
	for (let e = 0; e < r.length; e++) {
		let n = r[e];
		if (t(n)) return n;
	}
}
function Dr(e, t) {
	Object.entries(e).forEach(([e, n]) => t(n, e));
}
function Or(e, t) {
	return e.indexOf(t) !== -1;
}
function kr(e, t) {
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (t(r)) return r;
	}
}
var Ar = class {
	constructor() {
		this.transfomers = {};
	}
	register(e) {
		this.transfomers[e.name] = e;
	}
	findApplicable(e) {
		return Er(this.transfomers, (t) => t.isApplicable(e));
	}
	findByName(e) {
		return this.transfomers[e];
	}
};
H(), H();
var jr = (e) => Object.prototype.toString.call(e).slice(8, -1), Mr = (e) => e === void 0, Nr = (e) => e === null, Pr = (e) => typeof e != "object" || !e || e === Object.prototype ? !1 : Object.getPrototypeOf(e) === null ? !0 : Object.getPrototypeOf(e) === Object.prototype, Fr = (e) => Pr(e) && Object.keys(e).length === 0, Ir = (e) => Array.isArray(e), Lr = (e) => typeof e == "string", Rr = (e) => typeof e == "number" && !isNaN(e), zr = (e) => typeof e == "boolean", Br = (e) => e instanceof RegExp, Vr = (e) => e instanceof Map, Hr = (e) => e instanceof Set, Ur = (e) => jr(e) === "Symbol", Wr = (e) => e instanceof Date && !isNaN(e.valueOf()), Gr = (e) => e instanceof Error, Kr = (e) => typeof e == "number" && isNaN(e), qr = (e) => zr(e) || Nr(e) || Mr(e) || Rr(e) || Lr(e) || Ur(e), Jr = (e) => typeof e == "bigint", Yr = (e) => e === Infinity || e === -Infinity, Xr = (e) => ArrayBuffer.isView(e) && !(e instanceof DataView), Zr = (e) => e instanceof URL;
H();
var Qr = (e) => e.replace(/\./g, "\\."), $r = (e) => e.map(String).map(Qr).join("."), ei = (e) => {
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
H();
function K(e, t, n, r) {
	return {
		isApplicable: e,
		annotation: t,
		transform: n,
		untransform: r
	};
}
var ti = [
	K(Mr, "undefined", () => null, () => void 0),
	K(Jr, "bigint", (e) => e.toString(), (e) => typeof BigInt < "u" ? BigInt(e) : (console.error("Please add a BigInt polyfill."), e)),
	K(Wr, "Date", (e) => e.toISOString(), (e) => new Date(e)),
	K(Gr, "Error", (e, t) => {
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
	K(Br, "regexp", (e) => "" + e, (e) => {
		let t = e.slice(1, e.lastIndexOf("/")), n = e.slice(e.lastIndexOf("/") + 1);
		return new RegExp(t, n);
	}),
	K(Hr, "set", (e) => [...e.values()], (e) => new Set(e)),
	K(Vr, "map", (e) => [...e.entries()], (e) => new Map(e)),
	K((e) => Kr(e) || Yr(e), "number", (e) => Kr(e) ? "NaN" : e > 0 ? "Infinity" : "-Infinity", Number),
	K((e) => e === 0 && 1 / e == -Infinity, "number", () => "-0", Number),
	K(Zr, "URL", (e) => e.toString(), (e) => new URL(e))
];
function ni(e, t, n, r) {
	return {
		isApplicable: e,
		annotation: t,
		transform: n,
		untransform: r
	};
}
var ri = ni((e, t) => Ur(e) ? !!t.symbolRegistry.getIdentifier(e) : !1, (e, t) => ["symbol", t.symbolRegistry.getIdentifier(e)], (e) => e.description, (e, t, n) => {
	let r = n.symbolRegistry.getValue(t[1]);
	if (!r) throw Error("Trying to deserialize unknown symbol");
	return r;
}), ii = [
	Int8Array,
	Uint8Array,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array,
	Uint8ClampedArray
].reduce((e, t) => (e[t.name] = t, e), {}), ai = ni(Xr, (e) => ["typed-array", e.constructor.name], (e) => [...e], (e, t) => {
	let n = ii[t[1]];
	if (!n) throw Error("Trying to deserialize unknown typed array");
	return new n(e);
});
function oi(e, t) {
	return e?.constructor ? !!t.classRegistry.getIdentifier(e.constructor) : !1;
}
var si = ni(oi, (e, t) => ["class", t.classRegistry.getIdentifier(e.constructor)], (e, t) => {
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
}), ci = ni((e, t) => !!t.customTransformerRegistry.findApplicable(e), (e, t) => ["custom", t.customTransformerRegistry.findApplicable(e).name], (e, t) => t.customTransformerRegistry.findApplicable(e).serialize(e), (e, t, n) => {
	let r = n.customTransformerRegistry.findByName(t[1]);
	if (!r) throw Error("Trying to deserialize unknown custom value");
	return r.deserialize(e);
}), li = [
	si,
	ri,
	ci,
	ai
], ui = (e, t) => {
	let n = kr(li, (n) => n.isApplicable(e, t));
	if (n) return {
		value: n.transform(e, t),
		type: n.annotation(e, t)
	};
	let r = kr(ti, (n) => n.isApplicable(e, t));
	if (r) return {
		value: r.transform(e, t),
		type: r.annotation
	};
}, di = {};
ti.forEach((e) => {
	di[e.annotation] = e;
});
var fi = (e, t, n) => {
	if (Ir(t)) switch (t[0]) {
		case "symbol": return ri.untransform(e, t, n);
		case "class": return si.untransform(e, t, n);
		case "custom": return ci.untransform(e, t, n);
		case "typed-array": return ai.untransform(e, t, n);
		default: throw Error("Unknown transformation: " + t);
	}
	else {
		let r = di[t];
		if (!r) throw Error("Unknown transformation: " + t);
		return r.untransform(e, n);
	}
};
H();
var pi = (e, t) => {
	if (t > e.size) throw Error("index out of bounds");
	let n = e.keys();
	for (; t > 0;) n.next(), t--;
	return n.next().value;
};
function mi(e) {
	if (Or(e, "__proto__")) throw Error("__proto__ is not allowed as a property");
	if (Or(e, "prototype")) throw Error("prototype is not allowed as a property");
	if (Or(e, "constructor")) throw Error("constructor is not allowed as a property");
}
var hi = (e, t) => {
	mi(t);
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (Hr(e)) e = pi(e, +r);
		else if (Vr(e)) {
			let i = +r, a = +t[++n] == 0 ? "key" : "value", o = pi(e, i);
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
}, gi = (e, t, n) => {
	if (mi(t), t.length === 0) return n(e);
	let r = e;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e];
		if (Ir(r)) {
			let e = +n;
			r = r[e];
		} else if (Pr(r)) r = r[n];
		else if (Hr(r)) {
			let e = +n;
			r = pi(r, e);
		} else if (Vr(r)) {
			if (e === t.length - 2) break;
			let i = +n, a = +t[++e] == 0 ? "key" : "value", o = pi(r, i);
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
	if (Ir(r) ? r[+i] = n(r[+i]) : Pr(r) && (r[i] = n(r[i])), Hr(r)) {
		let e = pi(r, +i), t = n(e);
		e !== t && (r.delete(e), r.add(t));
	}
	if (Vr(r)) {
		let e = +t[t.length - 2], a = pi(r, e);
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
function _i(e, t, n = []) {
	if (!e) return;
	if (!Ir(e)) {
		Dr(e, (e, r) => _i(e, t, [...n, ...ei(r)]));
		return;
	}
	let [r, i] = e;
	i && Dr(i, (e, r) => {
		_i(e, t, [...n, ...ei(r)]);
	}), t(r, n);
}
function vi(e, t, n) {
	return _i(t, (t, r) => {
		e = gi(e, r, (e) => fi(e, t, n));
	}), e;
}
function yi(e, t) {
	function n(t, n) {
		let r = hi(e, ei(n));
		t.map(ei).forEach((t) => {
			e = gi(e, t, () => r);
		});
	}
	if (Ir(t)) {
		let [r, i] = t;
		r.forEach((t) => {
			e = gi(e, ei(t), () => e);
		}), i && Dr(i, n);
	} else Dr(t, n);
	return e;
}
var bi = (e, t) => Pr(e) || Ir(e) || Vr(e) || Hr(e) || oi(e, t);
function xi(e, t, n) {
	let r = n.get(e);
	r ? r.push(t) : n.set(e, [t]);
}
function Si(e, t) {
	let n = {}, r;
	return e.forEach((e) => {
		if (e.length <= 1) return;
		t || (e = e.map((e) => e.map(String)).sort((e, t) => e.length - t.length));
		let [i, ...a] = e;
		i.length === 0 ? r = a.map($r) : n[$r(i)] = a.map($r);
	}), r ? Fr(n) ? [r] : [r, n] : Fr(n) ? void 0 : n;
}
var Ci = (e, t, n, r, i = [], a = [], o = /* @__PURE__ */ new Map()) => {
	let s = qr(e);
	if (!s) {
		xi(e, i, t);
		let n = o.get(e);
		if (n) return r ? { transformedValue: null } : n;
	}
	if (!bi(e, n)) {
		let t = ui(e, n), r = t ? {
			transformedValue: t.value,
			annotations: [t.type]
		} : { transformedValue: e };
		return s || o.set(e, r), r;
	}
	if (Or(a, e)) return { transformedValue: null };
	let c = ui(e, n), l = c?.value ?? e, u = Ir(l) ? [] : {}, d = {};
	Dr(l, (s, c) => {
		if (c === "__proto__" || c === "constructor" || c === "prototype") throw Error(`Detected property ${c}. This is a prototype pollution risk, please remove it from your object.`);
		let l = Ci(s, t, n, r, [...i, c], [...a, e], o);
		u[c] = l.transformedValue, Ir(l.annotations) ? d[c] = l.annotations : Pr(l.annotations) && Dr(l.annotations, (e, t) => {
			d[Qr(c) + "." + t] = e;
		});
	});
	let f = Fr(d) ? {
		transformedValue: u,
		annotations: c ? [c.type] : void 0
	} : {
		transformedValue: u,
		annotations: c ? [c.type, d] : d
	};
	return s || o.set(e, f), f;
};
H(), H();
function wi(e) {
	return Object.prototype.toString.call(e).slice(8, -1);
}
function Ti(e) {
	return wi(e) === "Array";
}
function Ei(e) {
	if (wi(e) !== "Object") return !1;
	let t = Object.getPrototypeOf(e);
	return !!t && t.constructor === Object && t === Object.prototype;
}
function Di(e, t, n, r, i) {
	let a = {}.propertyIsEnumerable.call(r, t) ? "enumerable" : "nonenumerable";
	a === "enumerable" && (e[t] = n), i && a === "nonenumerable" && Object.defineProperty(e, t, {
		value: n,
		enumerable: !1,
		writable: !0,
		configurable: !0
	});
}
function Oi(e, t = {}) {
	if (Ti(e)) return e.map((e) => Oi(e, t));
	if (!Ei(e)) return e;
	let n = Object.getOwnPropertyNames(e), r = Object.getOwnPropertySymbols(e);
	return [...n, ...r].reduce((n, r) => {
		if (Ti(t.props) && !t.props.includes(r)) return n;
		let i = e[r];
		return Di(n, r, Oi(i, t), e, t.nonenumerable), n;
	}, {});
}
var q = class {
	constructor({ dedupe: e = !1 } = {}) {
		this.classRegistry = new wr(), this.symbolRegistry = new Cr((e) => e.description ?? ""), this.customTransformerRegistry = new Ar(), this.allowedErrorProps = [], this.dedupe = e;
	}
	serialize(e) {
		let t = /* @__PURE__ */ new Map(), n = Ci(e, t, this, this.dedupe), r = { json: n.transformedValue };
		n.annotations && (r.meta = {
			...r.meta,
			values: n.annotations
		});
		let i = Si(t, this.dedupe);
		return i && (r.meta = {
			...r.meta,
			referentialEqualities: i
		}), r;
	}
	deserialize(e) {
		let { json: t, meta: n } = e, r = Oi(t);
		return n?.values && (r = vi(r, n.values, this)), n?.referentialEqualities && (r = yi(r, n.referentialEqualities)), r;
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
q.defaultInstance = new q(), q.serialize = q.defaultInstance.serialize.bind(q.defaultInstance), q.deserialize = q.defaultInstance.deserialize.bind(q.defaultInstance), q.stringify = q.defaultInstance.stringify.bind(q.defaultInstance), q.parse = q.defaultInstance.parse.bind(q.defaultInstance), q.registerClass = q.defaultInstance.registerClass.bind(q.defaultInstance), q.registerSymbol = q.defaultInstance.registerSymbol.bind(q.defaultInstance), q.registerCustom = q.defaultInstance.registerCustom.bind(q.defaultInstance), q.allowErrorProps = q.defaultInstance.allowErrorProps.bind(q.defaultInstance), q.serialize, q.deserialize, q.stringify, q.parse, q.registerClass, q.registerCustom, q.registerSymbol, q.allowErrorProps, H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H(), H();
var ki;
(ki = V).__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__ ?? (ki.__VUE_DEVTOOLS_KIT_MESSAGE_CHANNELS__ = []);
var Ai;
(Ai = V).__VUE_DEVTOOLS_KIT_RPC_CLIENT__ ?? (Ai.__VUE_DEVTOOLS_KIT_RPC_CLIENT__ = null);
var ji;
(ji = V).__VUE_DEVTOOLS_KIT_RPC_SERVER__ ?? (ji.__VUE_DEVTOOLS_KIT_RPC_SERVER__ = null);
var Mi;
(Mi = V).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ ?? (Mi.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__ = null);
var Ni;
(Ni = V).__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ ?? (Ni.__VUE_DEVTOOLS_KIT_VITE_RPC_SERVER__ = null);
var Pi;
(Pi = V).__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__ ?? (Pi.__VUE_DEVTOOLS_KIT_BROADCAST_RPC_SERVER__ = null), H(), H(), H(), H(), H(), H(), H();
//#endregion
//#region node_modules/pinia/dist/pinia.mjs
var Fi = typeof window < "u", Ii, Li = (e) => Ii = e, Ri = process.env.NODE_ENV === "production" ? () => m() && h(zi) || Ii : () => {
	let e = m() && h(zi);
	return !e && !Fi && console.error("[🍍]: Pinia instance not found in context. This falls back to the global activePinia which exposes you to cross-request pollution on the server. Most of the time, it means you are calling \"useStore()\" in the wrong place.\nRead https://vuejs.org/guide/reusability/composables.html to learn more"), e || Ii;
}, zi = process.env.NODE_ENV === "production" ? Symbol() : Symbol("pinia");
function Bi(e) {
	return e && typeof e == "object" && Object.prototype.toString.call(e) === "[object Object]" && typeof e.toJSON != "function";
}
var Vi;
(function(e) {
	e.direct = "direct", e.patchObject = "patch object", e.patchFunction = "patch function";
})(Vi ||= {});
var Hi = typeof window == "object" && window.window === window ? window : typeof self == "object" && self.self === self ? self : typeof global == "object" && global.global === global ? global : typeof globalThis == "object" ? globalThis : { HTMLElement: null };
function Ui(e, { autoBom: t = !1 } = {}) {
	return t && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type) ? new Blob(["﻿", e], { type: e.type }) : e;
}
function Wi(e, t, n) {
	let r = new XMLHttpRequest();
	r.open("GET", e), r.responseType = "blob", r.onload = function() {
		Yi(r.response, t, n);
	}, r.onerror = function() {
		console.error("could not download file");
	}, r.send();
}
function Gi(e) {
	let t = new XMLHttpRequest();
	t.open("HEAD", e, !1);
	try {
		t.send();
	} catch {}
	return t.status >= 200 && t.status <= 299;
}
function Ki(e) {
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
var qi = typeof navigator == "object" ? navigator : { userAgent: "" }, Ji = /Macintosh/.test(qi.userAgent) && /AppleWebKit/.test(qi.userAgent) && !/Safari/.test(qi.userAgent), Yi = Fi ? typeof HTMLAnchorElement < "u" && "download" in HTMLAnchorElement.prototype && !Ji ? Xi : "msSaveOrOpenBlob" in qi ? Zi : Qi : () => {};
function Xi(e, t = "download", n) {
	let r = document.createElement("a");
	r.download = t, r.rel = "noopener", typeof e == "string" ? (r.href = e, r.origin === location.origin ? Ki(r) : Gi(r.href) ? Wi(e, t, n) : (r.target = "_blank", Ki(r))) : (r.href = URL.createObjectURL(e), setTimeout(function() {
		URL.revokeObjectURL(r.href);
	}, 4e4), setTimeout(function() {
		Ki(r);
	}, 0));
}
function Zi(e, t = "download", n) {
	if (typeof e == "string") if (Gi(e)) Wi(e, t, n);
	else {
		let t = document.createElement("a");
		t.href = e, t.target = "_blank", setTimeout(function() {
			Ki(t);
		});
	}
	else navigator.msSaveOrOpenBlob(Ui(e, n), t);
}
function Qi(e, t, n, r) {
	if (r ||= open("", "_blank"), r && (r.document.title = r.document.body.innerText = "downloading..."), typeof e == "string") return Wi(e, t, n);
	let i = e.type === "application/octet-stream", a = /constructor/i.test(String(Hi.HTMLElement)) || "safari" in Hi, o = /CriOS\/[\d]+/.test(navigator.userAgent);
	if ((o || i && a || Ji) && typeof FileReader < "u") {
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
function J(e, t) {
	let n = "🍍 " + e;
	typeof __VUE_DEVTOOLS_TOAST__ == "function" ? __VUE_DEVTOOLS_TOAST__(n, t) : t === "error" ? console.error(n) : t === "warn" ? console.warn(n) : console.log(n);
}
function $i(e) {
	return "_a" in e && "install" in e;
}
function ea() {
	if (!("clipboard" in navigator)) return J("Your browser doesn't support the Clipboard API", "error"), !0;
}
function ta(e) {
	return e instanceof Error && e.message.toLowerCase().includes("document is not focused") ? (J("You need to activate the \"Emulate a focused page\" setting in the \"Rendering\" panel of devtools.", "warn"), !0) : !1;
}
async function na(e) {
	if (!ea()) try {
		await navigator.clipboard.writeText(JSON.stringify(e.state.value)), J("Global state copied to clipboard.");
	} catch (e) {
		if (ta(e)) return;
		J("Failed to serialize the state. Check the console for more details.", "error"), console.error(e);
	}
}
async function ra(e) {
	if (!ea()) try {
		ca(e, JSON.parse(await navigator.clipboard.readText())), J("Global state pasted from clipboard.");
	} catch (e) {
		if (ta(e)) return;
		J("Failed to deserialize the state from clipboard. Check the console for more details.", "error"), console.error(e);
	}
}
async function ia(e) {
	try {
		Yi(new Blob([JSON.stringify(e.state.value)], { type: "text/plain;charset=utf-8" }), "pinia-state.json");
	} catch (e) {
		J("Failed to export the state as JSON. Check the console for more details.", "error"), console.error(e);
	}
}
var aa;
function oa() {
	aa || (aa = document.createElement("input"), aa.type = "file", aa.accept = ".json");
	function e() {
		return new Promise((e, t) => {
			aa.onchange = async () => {
				let t = aa.files;
				if (!t) return e(null);
				let n = t.item(0);
				return e(n ? {
					text: await n.text(),
					file: n
				} : null);
			}, aa.oncancel = () => e(null), aa.onerror = t, aa.click();
		});
	}
	return e;
}
async function sa(e) {
	try {
		let t = await oa()();
		if (!t) return;
		let { text: n, file: r } = t;
		ca(e, JSON.parse(n)), J(`Global state imported from "${r.name}".`);
	} catch (e) {
		J("Failed to import the state from JSON. Check the console for more details.", "error"), console.error(e);
	}
}
function ca(e, t) {
	for (let n in t) {
		let r = e.state.value[n];
		r ? Object.assign(r, t[n]) : e.state.value[n] = t[n];
	}
}
function Y(e) {
	return { _custom: { display: e } };
}
var la = "🍍 Pinia (root)", ua = "_root";
function da(e) {
	return $i(e) ? {
		id: ua,
		label: la
	} : {
		id: e.$id,
		label: e.$id
	};
}
function fa(e) {
	if ($i(e)) {
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
function pa(e) {
	return e ? Array.isArray(e) ? e.reduce((e, t) => (e.keys.push(t.key), e.operations.push(t.type), e.oldValue[t.key] = t.oldValue, e.newValue[t.key] = t.newValue, e), {
		oldValue: {},
		keys: [],
		operations: [],
		newValue: {}
	}) : {
		operation: Y(e.type),
		key: Y(e.key),
		oldValue: e.oldValue,
		newValue: e.newValue
	} : {};
}
function ma(e) {
	switch (e) {
		case Vi.direct: return "mutation";
		case Vi.patchFunction: return "$patch";
		case Vi.patchObject: return "$patch";
		default: return "unknown";
	}
}
var ha = !0, ga = [], _a = "pinia:mutations", X = "pinia", { assign: va } = Object, ya = (e) => "🍍 " + e;
function ba(e, t) {
	nr({
		id: "dev.esm.pinia",
		label: "Pinia 🍍",
		logo: "https://pinia.vuejs.org/logo.svg",
		packageName: "pinia",
		homepage: "https://pinia.vuejs.org",
		componentStateTypes: ga,
		app: e
	}, (n) => {
		typeof n.now != "function" && J("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html."), n.addTimelineLayer({
			id: _a,
			label: "Pinia 🍍",
			color: 15064968
		}), n.addInspector({
			id: X,
			label: "Pinia 🍍",
			icon: "storage",
			treeFilterPlaceholder: "Search stores",
			actions: [
				{
					icon: "content_copy",
					action: () => {
						na(t);
					},
					tooltip: "Serialize and copy the state"
				},
				{
					icon: "content_paste",
					action: async () => {
						await ra(t), n.sendInspectorTree(X), n.sendInspectorState(X);
					},
					tooltip: "Replace the state with the content of your clipboard"
				},
				{
					icon: "save",
					action: () => {
						ia(t);
					},
					tooltip: "Save the state as a JSON file"
				},
				{
					icon: "folder_open",
					action: async () => {
						await sa(t), n.sendInspectorTree(X), n.sendInspectorState(X);
					},
					tooltip: "Import the state from a JSON file"
				}
			],
			nodeActions: [{
				icon: "restore",
				tooltip: "Reset the state (with \"$reset\")",
				action: (e) => {
					let n = t._s.get(e);
					n ? typeof n.$reset == "function" ? (n.$reset(), J(`Store "${e}" reset.`)) : J(`Cannot reset "${e}" store because it doesn't have a "$reset" method implemented.`, "warn") : J(`Cannot reset "${e}" store because it wasn't found.`, "warn");
				}
			}]
		}), n.on.inspectComponent((e) => {
			let t = e.componentInstance && e.componentInstance.proxy;
			if (t && t._pStores) {
				let t = e.componentInstance.proxy._pStores;
				Object.values(t).forEach((t) => {
					e.instanceData.state.push({
						type: ya(t.$id),
						key: "state",
						editable: !0,
						value: t._isOptionsAPI ? { _custom: {
							value: P(t.$state),
							actions: [{
								icon: "restore",
								tooltip: "Reset the state of this store",
								action: () => t.$reset()
							}]
						} } : Object.keys(t.$state).reduce((e, n) => (e[n] = t.$state[n], e), {})
					}), t._getters && t._getters.length && e.instanceData.state.push({
						type: ya(t.$id),
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
			if (n.app === e && n.inspectorId === X) {
				let e = [t];
				e = e.concat(Array.from(t._s.values())), n.rootNodes = (n.filter ? e.filter((e) => "$id" in e ? e.$id.toLowerCase().includes(n.filter.toLowerCase()) : la.toLowerCase().includes(n.filter.toLowerCase())) : e).map(da);
			}
		}), globalThis.$pinia = t, n.on.getInspectorState((n) => {
			if (n.app === e && n.inspectorId === X) {
				let e = n.nodeId === ua ? t : t._s.get(n.nodeId);
				if (!e) return;
				e && (n.nodeId !== ua && (globalThis.$store = P(e)), n.state = fa(e));
			}
		}), n.on.editInspectorState((n) => {
			if (n.app === e && n.inspectorId === X) {
				let e = n.nodeId === ua ? t : t._s.get(n.nodeId);
				if (!e) return J(`store "${n.nodeId}" not found`, "error");
				let { path: r } = n;
				$i(e) ? r.unshift("state") : (r.length !== 1 || !e._customProperties.has(r[0]) || r[0] in e.$state) && r.unshift("$state"), ha = !1, n.set(e, r, n.state.value), ha = !0;
			}
		}), n.on.editComponentState((e) => {
			if (e.type.startsWith("🍍")) {
				let n = e.type.replace(/^🍍\s*/, ""), r = t._s.get(n);
				if (!r) return J(`store "${n}" not found`, "error");
				let { path: i } = e;
				if (i[0] !== "state") return J(`Invalid path for store "${n}":\n${i}\nOnly state can be modified.`);
				i[0] = "$state", ha = !1, e.set(r, i, e.state.value), ha = !0;
			}
		});
	});
}
function xa(e, t) {
	ga.includes(ya(t.$id)) || ga.push(ya(t.$id)), nr({
		id: "dev.esm.pinia",
		label: "Pinia 🍍",
		logo: "https://pinia.vuejs.org/logo.svg",
		packageName: "pinia",
		homepage: "https://pinia.vuejs.org",
		componentStateTypes: ga,
		app: e,
		settings: { logStoreChanges: {
			label: "Notify about new/deleted stores",
			type: "boolean",
			defaultValue: !0
		} }
	}, (e) => {
		let n = typeof e.now == "function" ? e.now.bind(e) : Date.now;
		t.$onAction(({ after: r, onError: i, name: a, args: o }) => {
			let s = Sa++;
			e.addTimelineEvent({
				layerId: _a,
				event: {
					time: n(),
					title: "🛫 " + a,
					subtitle: "start",
					data: {
						store: Y(t.$id),
						action: Y(a),
						args: o
					},
					groupId: s
				}
			}), r((r) => {
				Ca = void 0, e.addTimelineEvent({
					layerId: _a,
					event: {
						time: n(),
						title: "🛬 " + a,
						subtitle: "end",
						data: {
							store: Y(t.$id),
							action: Y(a),
							args: o,
							result: r
						},
						groupId: s
					}
				});
			}), i((r) => {
				Ca = void 0, e.addTimelineEvent({
					layerId: _a,
					event: {
						time: n(),
						logType: "error",
						title: "💥 " + a,
						subtitle: "end",
						data: {
							store: Y(t.$id),
							action: Y(a),
							args: o,
							error: r
						},
						groupId: s
					}
				});
			});
		}, !0), t._customProperties.forEach((r) => {
			R(() => I(t[r]), (t, i) => {
				e.notifyComponentUpdate(), e.sendInspectorState(X), ha && e.addTimelineEvent({
					layerId: _a,
					event: {
						time: n(),
						title: "Change",
						subtitle: r,
						data: {
							newValue: t,
							oldValue: i
						},
						groupId: Ca
					}
				});
			}, { deep: !0 });
		}), t.$subscribe(({ events: r, type: i }, a) => {
			if (e.notifyComponentUpdate(), e.sendInspectorState(X), !ha) return;
			let o = {
				time: n(),
				title: ma(i),
				data: va({ store: Y(t.$id) }, pa(r)),
				groupId: Ca
			};
			i === Vi.patchFunction ? o.subtitle = "⤵️" : i === Vi.patchObject ? o.subtitle = "🧩" : r && !Array.isArray(r) && (o.subtitle = r.type), r && (o.data["rawEvent(s)"] = { _custom: {
				display: "DebuggerEvent",
				type: "object",
				tooltip: "raw DebuggerEvent[]",
				value: r
			} }), e.addTimelineEvent({
				layerId: _a,
				event: o
			});
		}, {
			detached: !0,
			flush: "sync"
		});
		let r = t._hotUpdate;
		t._hotUpdate = v((i) => {
			r(i), e.addTimelineEvent({
				layerId: _a,
				event: {
					time: n(),
					title: "🔥 " + t.$id,
					subtitle: "HMR update",
					data: {
						store: Y(t.$id),
						info: Y("HMR update")
					}
				}
			}), e.notifyComponentUpdate(), e.sendInspectorTree(X), e.sendInspectorState(X);
		});
		let { $dispose: i } = t;
		t.$dispose = () => {
			i(), e.notifyComponentUpdate(), e.sendInspectorTree(X), e.sendInspectorState(X), e.getSettings().logStoreChanges && J(`Disposed "${t.$id}" store 🗑`);
		}, e.notifyComponentUpdate(), e.sendInspectorTree(X), e.sendInspectorState(X), e.getSettings().logStoreChanges && J(`"${t.$id}" store installed 🆕`);
	});
}
var Sa = 0, Ca;
function wa(e, t, n) {
	let r = t.reduce((t, n) => (t[n] = P(e)[n], t), {});
	for (let t in r) e[t] = function() {
		let i = Sa, a = n ? new Proxy(e, {
			get(...e) {
				return Ca = i, Reflect.get(...e);
			},
			set(...e) {
				return Ca = i, Reflect.set(...e);
			}
		}) : e;
		Ca = i;
		let o = r[t].apply(a, arguments);
		return Ca = void 0, o;
	};
}
function Ta({ app: e, store: t, options: n }) {
	if (!t.$id.startsWith("__hot:")) {
		if (t._isOptionsAPI = !!n.state, !t._p._testing) {
			wa(t, Object.keys(n.actions), t._isOptionsAPI);
			let e = t._hotUpdate;
			P(t)._hotUpdate = function(n) {
				e.apply(this, arguments), wa(t, Object.keys(n._hmrPayload.actions), !!t._isOptionsAPI);
			};
		}
		xa(e, t);
	}
}
function Ea() {
	let e = d(!0), t = e.run(() => k({})), n = [], r = [], i = v({
		install(e) {
			Li(i), i._a = e, e.provide(zi, i), e.config.globalProperties.$pinia = i, process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Fi && ba(e, i), r.forEach((e) => n.push(e)), r = [];
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
	return process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Fi && typeof Proxy < "u" && i.use(Ta), i;
}
function Da(e, t) {
	for (let n in t) {
		let r = t[n];
		if (!(n in e)) continue;
		let i = e[n];
		Bi(i) && Bi(r) && !_(r) && !g(r) ? e[n] = Da(i, r) : e[n] = r;
	}
	return e;
}
var Oa = () => {};
function ka(e, t, n, r = Oa) {
	e.add(t);
	let i = () => {
		e.delete(t) && r();
	};
	return !n && p() && T(i), i;
}
function Aa(e, ...t) {
	e.forEach((e) => {
		e(...t);
	});
}
var ja = (e) => e(), Ma = Symbol(), Na = Symbol();
function Pa(e, t) {
	e instanceof Map && t instanceof Map ? t.forEach((t, n) => e.set(n, t)) : e instanceof Set && t instanceof Set && t.forEach(e.add, e);
	for (let n in t) {
		if (!t.hasOwnProperty(n)) continue;
		let r = t[n], i = e[n];
		Bi(i) && Bi(r) && e.hasOwnProperty(n) && !_(r) && !g(r) ? e[n] = Pa(i, r) : e[n] = r;
	}
	return e;
}
var Fa = process.env.NODE_ENV === "production" ? Symbol() : Symbol("pinia:skipHydration");
function Ia(e) {
	return !Bi(e) || !Object.prototype.hasOwnProperty.call(e, Fa);
}
var { assign: Z } = Object;
function La(e) {
	return !!(_(e) && e.effect);
}
function Ra(e, t, n, i) {
	let { state: a, actions: o, getters: s } = t, c = n.state.value[e], l;
	function u() {
		!c && (process.env.NODE_ENV === "production" || !i) && (n.state.value[e] = a ? a() : {});
		let t = process.env.NODE_ENV !== "production" && i ? F(k(a ? a() : {}).value) : F(n.state.value[e]);
		return Z(t, o, Object.keys(s || {}).reduce((i, a) => (process.env.NODE_ENV !== "production" && a in t && console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${a}" in store "${e}".`), i[a] = v(r(() => {
			Li(n);
			let t = n._s.get(e);
			return s[a].call(t, t);
		})), i), {}));
	}
	return l = za(e, u, t, n, i, !0), l;
}
function za(e, t, n = {}, i, a, o) {
	let s, c = Z({ actions: {} }, n);
	/* istanbul ignore if */
	if (process.env.NODE_ENV !== "production" && !i._e.active) throw Error("Pinia destroyed");
	let l = { deep: !0 };
	/* istanbul ignore else */
	process.env.NODE_ENV !== "production" && (l.onTrigger = (e) => {
		/* istanbul ignore else */
		u ? h = e : u == 0 && !j._hotUpdating && (Array.isArray(h) ? h.push(e) : console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug."));
	});
	let u, f, p = /* @__PURE__ */ new Set(), m = /* @__PURE__ */ new Set(), h, y = i.state.value[e];
	!o && !y && (process.env.NODE_ENV === "production" || !a) && (i.state.value[e] = {});
	let x = k({}), S;
	function C(t) {
		let n;
		u = f = !1, process.env.NODE_ENV !== "production" && (h = []), typeof t == "function" ? (t(i.state.value[e]), n = {
			type: Vi.patchFunction,
			storeId: e,
			events: h
		}) : (Pa(i.state.value[e], t), n = {
			type: Vi.patchObject,
			payload: t,
			storeId: e,
			events: h
		});
		let r = S = Symbol();
		b().then(() => {
			S === r && (u = !0);
		}), f = !0, Aa(p, n, i.state.value[e]);
	}
	let w = o ? function() {
		let { state: e } = n, t = e ? e() : {};
		this.$patch((e) => {
			Z(e, t);
		});
	} : process.env.NODE_ENV === "production" ? Oa : () => {
		throw Error(`🍍: Store "${e}" is built using the setup syntax and does not implement $reset().`);
	};
	function T() {
		s.stop(), p.clear(), m.clear(), i._s.delete(e);
	}
	let E = (t, n = "") => {
		if (Ma in t) return t[Na] = n, t;
		let r = function() {
			Li(i);
			let n = Array.from(arguments), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
			function s(e) {
				a.add(e);
			}
			function c(e) {
				o.add(e);
			}
			Aa(m, {
				args: n,
				name: r[Na],
				store: j,
				after: s,
				onError: c
			});
			let l;
			try {
				l = t.apply(this && this.$id === e ? this : j, n);
			} catch (e) {
				throw Aa(o, e), e;
			}
			return l instanceof Promise ? l.then((e) => (Aa(a, e), e)).catch((e) => (Aa(o, e), Promise.reject(e))) : (Aa(a, l), l);
		};
		return r[Ma] = !0, r[Na] = n, r;
	}, D = /* @__PURE__ */ v({
		actions: {},
		getters: {},
		state: [],
		hotState: x
	}), A = {
		_p: i,
		$id: e,
		$onAction: ka.bind(null, m),
		$patch: C,
		$reset: w,
		$subscribe(t, n = {}) {
			let r = ka(p, t, n.detached, () => a()), a = s.run(() => R(() => i.state.value[e], (r) => {
				(n.flush === "sync" ? f : u) && t({
					storeId: e,
					type: Vi.direct,
					events: h
				}, r);
			}, Z({}, l, n)));
			return r;
		},
		$dispose: T
	}, j = O(process.env.NODE_ENV !== "production" || process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Fi ? Z({
		_hmrPayload: D,
		_customProperties: v(/* @__PURE__ */ new Set())
	}, A) : A);
	i._s.set(e, j);
	let M = (i._a && i._a.runWithContext || ja)(() => i._e.run(() => (s = d()).run(() => t({ action: E }))));
	for (let t in M) {
		let r = M[t];
		_(r) && !La(r) || g(r) ? (process.env.NODE_ENV !== "production" && a ? x.value[t] = ee(M, t) : o || (y && Ia(r) && (_(r) ? r.value = y[t] : Pa(r, y[t])), i.state.value[e][t] = r), process.env.NODE_ENV !== "production" && D.state.push(t)) : typeof r == "function" ? (M[t] = process.env.NODE_ENV !== "production" && a ? r : E(r, t), process.env.NODE_ENV !== "production" && (D.actions[t] = r), c.actions[t] = r) : process.env.NODE_ENV !== "production" && La(r) && (D.getters[t] = o ? n.getters[t] : r, Fi && (M._getters ||= v([])).push(t));
	}
	if (Z(j, M), Z(P(j), M), Object.defineProperty(j, "$state", {
		get: () => process.env.NODE_ENV !== "production" && a ? x.value : i.state.value[e],
		set: (e) => {
			/* istanbul ignore if */
			if (process.env.NODE_ENV !== "production" && a) throw Error("cannot set hotState");
			C((t) => {
				Z(t, e);
			});
		}
	}), process.env.NODE_ENV !== "production" && (j._hotUpdate = v((t) => {
		j._hotUpdating = !0, t._hmrPayload.state.forEach((e) => {
			if (e in j.$state) {
				let n = t.$state[e], r = j.$state[e];
				typeof n == "object" && Bi(n) && Bi(r) ? Da(n, r) : t.$state[e] = r;
			}
			j[e] = ee(t.$state, e);
		}), Object.keys(j.$state).forEach((e) => {
			e in t.$state || delete j[e];
		}), u = !1, f = !1, i.state.value[e] = ee(t._hmrPayload, "hotState"), f = !0, b().then(() => {
			u = !0;
		});
		for (let e in t._hmrPayload.actions) {
			let n = t[e];
			j[e] = E(n, e);
		}
		for (let e in t._hmrPayload.getters) {
			let n = t._hmrPayload.getters[e];
			j[e] = o ? r(() => (Li(i), n.call(j, j))) : n;
		}
		Object.keys(j._hmrPayload.getters).forEach((e) => {
			e in t._hmrPayload.getters || delete j[e];
		}), Object.keys(j._hmrPayload.actions).forEach((e) => {
			e in t._hmrPayload.actions || delete j[e];
		}), j._hmrPayload = t._hmrPayload, j._getters = t._getters, j._hotUpdating = !1;
	})), process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Fi) {
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
			Object.defineProperty(j, t, Z({ value: j[t] }, e));
		});
	}
	return i._p.forEach((e) => {
		/* istanbul ignore else */
		if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && Fi) {
			let t = s.run(() => e({
				store: j,
				app: i._a,
				pinia: i,
				options: c
			}));
			Object.keys(t || {}).forEach((e) => j._customProperties.add(e)), Z(j, t);
		} else Z(j, s.run(() => e({
			store: j,
			app: i._a,
			pinia: i,
			options: c
		})));
	}), process.env.NODE_ENV !== "production" && j.$state && typeof j.$state == "object" && typeof j.$state.constructor == "function" && !j.$state.constructor.toString().includes("[native code]") && console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${j.$id}".`), y && o && n.hydrate && n.hydrate(j.$state, y), u = !0, f = !0, j;
}
function Ba(e, t, n) {
	let r, i = typeof t == "function";
	r = i ? n : t;
	function a(n, o) {
		let s = m();
		if (n = (process.env.NODE_ENV === "test" && Ii && Ii._testing ? null : n) || (s ? h(zi, null) : null), n && Li(n), process.env.NODE_ENV !== "production" && !Ii) throw Error("[🍍]: \"getActivePinia()\" was called but there was no active Pinia. Are you trying to use a store before calling \"app.use(pinia)\"?\nSee https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.\nThis will fail in production.");
		n = Ii, n._s.has(e) || (i ? za(e, t, r, n) : Ra(e, r, n), process.env.NODE_ENV !== "production" && (a._pinia = n));
		let c = n._s.get(e);
		if (process.env.NODE_ENV !== "production" && o) {
			let a = "__hot:" + e, s = i ? za(a, t, r, n, !0) : Ra(a, Z({}, r), n, !0);
			o._hotUpdate(s), delete n.state.value[a], n._s.delete(a);
		}
		if (process.env.NODE_ENV !== "production" && Fi) {
			let t = f();
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
var Va = {
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
}, Ha = {
	...Va,
	defaults: { ...Va.defaults }
};
function Ua() {
	return Ha;
}
//#endregion
//#region src/services/PdfStorage.ts
var Wa = "pinote-pdf", Ga = "pdfs", Ka = 1;
function qa() {
	return new Promise((e, t) => {
		let n = indexedDB.open(Wa, Ka);
		n.onupgradeneeded = () => {
			n.result.createObjectStore(Ga, { keyPath: "id" });
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error);
	});
}
async function Ja(e, t, n) {
	let r = await qa();
	return new Promise((i, a) => {
		let o = r.transaction(Ga, "readwrite"), s = {
			id: e,
			filename: t,
			data: n
		}, c = o.objectStore(Ga).put(s);
		c.onsuccess = () => i(), c.onerror = () => a(c.error);
	});
}
async function Ya(e) {
	let t = await qa();
	return new Promise((n, r) => {
		let i = t.transaction(Ga, "readonly").objectStore(Ga).get(e);
		i.onsuccess = () => n(i.result?.data ?? null), i.onerror = () => r(i.error);
	});
}
async function Xa(e) {
	let t = await qa();
	return new Promise((n, r) => {
		let i = t.transaction(Ga, "readwrite").objectStore(Ga).delete(e);
		i.onsuccess = () => n(), i.onerror = () => r(i.error);
	});
}
//#endregion
//#region src/services/PdfThumbnailDb.ts
var Za = "pi-note-thumbs", Qa = "thumbs", $a = 1, eo = null;
function to() {
	return eo || (eo = new Promise((e, t) => {
		let n = indexedDB.open(Za, $a);
		n.onupgradeneeded = () => n.result.createObjectStore(Qa), n.onsuccess = () => e(n.result), n.onerror = () => {
			eo = null, t(n.error);
		};
	}), eo);
}
async function no(e) {
	let t = await to();
	return new Promise((n, r) => {
		let i = t.transaction(Qa, "readonly").objectStore(Qa).get(e);
		i.onsuccess = () => n(i.result), i.onerror = () => r(i.error);
	});
}
async function ro(e, t) {
	let n = await to();
	return new Promise((r, i) => {
		let a = n.transaction(Qa, "readwrite").objectStore(Qa).put(t, e);
		a.onsuccess = () => r(), a.onerror = () => i(a.error);
	});
}
async function io(e) {
	let t = await to();
	return new Promise((n, r) => {
		let i = t.transaction(Qa, "readwrite").objectStore(Qa).openCursor();
		i.onsuccess = () => {
			let t = i.result;
			if (!t) {
				n();
				return;
			}
			t.key.startsWith(`${e}:`) && t.delete(), t.continue();
		}, i.onerror = () => r(i.error);
	});
}
async function ao() {
	let e = await to();
	return new Promise((t, n) => {
		let r = e.transaction(Qa, "readwrite").objectStore(Qa).clear();
		r.onsuccess = () => t(), r.onerror = () => n(r.error);
	});
}
//#endregion
//#region src/services/PdfRenderer.ts
function oo(e) {
	se.GlobalWorkerOptions.workerSrc = e;
}
var so = /* @__PURE__ */ new Map();
async function co(e, t, n, r) {
	let i = `${e}:${n}:${r}`, a = so.get(i);
	if (a) return a;
	let o = await (await se.getDocument({ data: t }).promise).getPage(n + 1), s = r / o.getViewport({ scale: 1 }).width, c = o.getViewport({ scale: s }), l = document.createElement("canvas");
	l.width = Math.round(c.width), l.height = Math.round(c.height);
	let u = l.getContext("2d");
	await o.render({
		canvas: l,
		canvasContext: u,
		viewport: c
	}).promise;
	let d = await createImageBitmap(l);
	return so.set(i, d), d;
}
async function lo(e) {
	return (await se.getDocument({ data: e }).promise).numPages;
}
function uo(e) {
	if (e === void 0) {
		for (let e of so.values()) e.close();
		so.clear();
		return;
	}
	for (let [t, n] of so) t.startsWith(`${e}:`) && (n.close(), so.delete(t));
}
var fo = /* @__PURE__ */ new Map();
async function po(e, t, n) {
	let r = `${e}:${n}`, i = fo.get(r);
	if (i) return i;
	let a = await no(r);
	if (a) return fo.set(r, a), a;
	let o = await (await se.getDocument({ data: t }).promise).getPage(n + 1), s = 320 / o.getViewport({ scale: 1 }).width, c = o.getViewport({ scale: s }), l = document.createElement("canvas");
	l.width = Math.round(c.width), l.height = Math.round(c.height);
	let u = l.getContext("2d");
	await o.render({
		canvas: l,
		canvasContext: u,
		viewport: c
	}).promise;
	let d = l.toDataURL("image/jpeg", .85);
	return fo.set(r, d), ro(r, d), d;
}
function mo(e) {
	if (e === void 0) {
		fo.clear(), ao();
		return;
	}
	for (let t of fo.keys()) t.startsWith(`${e}:`) && fo.delete(t);
	io(e);
}
//#endregion
//#region src/store/usePdfStore.ts
var ho = Ba("pdf", () => {
	let e = k(!1), t = k(null), n = k({}), r = k({});
	async function i() {
		let n = Q(), i = n.engine;
		if (console.log("[PDF] renderPageForCurrentPage — engine:", i, "currentPageId:", n.currentPageId), !i) return;
		let a = n.pages.find((e) => e.id === n.currentPageId);
		if (console.log("[PDF] page entry:", a), !a?.pdfId || a.pdfPageIndex === void 0) {
			i.setReferenceBitmap(null), t.value = null;
			return;
		}
		e.value = !0;
		try {
			let e = await Ya(a.pdfId);
			if (console.log("[PDF] buffer from IndexedDB:", e ? `${e.byteLength} bytes` : "null"), !e) {
				i.setReferenceBitmap(null), t.value = null;
				return;
			}
			let n = i.getLayer("MAIN").canvas.clientWidth || 800;
			console.log("[PDF] targetWidth:", n);
			let o = await co(a.pdfId, e, a.pdfPageIndex, n);
			console.log("[PDF] bitmap:", o), t.value = o, r.value[`${a.pdfId}:${a.pdfPageIndex}`] = {
				w: o.width,
				h: o.height
			}, i.setReferenceBitmap(o);
		} catch (e) {
			console.error("[PDF] renderPageForCurrentPage error:", e);
		} finally {
			e.value = !1;
		}
	}
	async function a(e) {
		let t = "pdf-" + Date.now(), n = await e.arrayBuffer();
		await Ja(t, e.name, n);
		let r = await lo(n);
		return o(t, n, r), {
			pdfId: t,
			pageCount: r
		};
	}
	async function o(e, t, r) {
		for (let i = 0; i < r; i++) try {
			let r = await po(e, t, i);
			n.value[`${e}:${i}`] = r;
		} catch (e) {
			console.warn("[PDF] thumbnail generation failed for page", i, e);
		}
	}
	function s(e, t) {
		return r.value[`${e}:${t}`] ?? null;
	}
	function c(e, t) {
		return n.value[`${e}:${t}`] ?? null;
	}
	async function l(e, t) {
		let r = `${e}:${t}`;
		if (n.value[r]) return n.value[r];
		try {
			let i = await Ya(e);
			if (!i) return null;
			let a = await po(e, i, t);
			return n.value[r] = a, a;
		} catch {
			return null;
		}
	}
	function u() {
		Q().engine?.setReferenceBitmap(null), t.value = null;
	}
	function d(e) {
		uo(e), mo(e);
		for (let t of Object.keys(n.value)) t.startsWith(`${e}:`) && delete n.value[t];
	}
	return {
		isRendering: e,
		currentBitmap: t,
		thumbnails: n,
		renderPageForCurrentPage: i,
		importPdf: a,
		getThumbnail: c,
		ensureThumbnail: l,
		getPdfCanvasSize: s,
		clearReference: u,
		clearCacheForPdf: d
	};
}), go = "pi_note_index", _o = "pi_note_current", vo = "pi_note_page_counter";
function yo() {
	let e = parseInt(localStorage.getItem(vo) ?? "0", 10) + 1;
	return localStorage.setItem(vo, String(e)), e;
}
var Q = Ba("note", () => {
	let e = M(null), t = k(null);
	function n(e) {
		t.value = e;
	}
	let r = Ua(), i = O({
		layer: "MAIN",
		tool: r.defaults.tool,
		width: r.defaults.width,
		color: r.defaults.color,
		bezier: r.defaults.bezier,
		rectMode: "2pts"
	}), a = O({
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
	}), o = k(0);
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
	let u = k([]), d = k(null), f = k(!1), p = k(!1), m = k([]);
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
	let C = k({
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
	}), w = k(""), T = O({
		enabled: r.defaults.snapEnabled,
		size: r.defaults.snapSize
	});
	function E(t) {
		C.value = t, e.value?.setBackground(t), t.mode === "grid" && t.grid?.size && (T.size = t.grid.size);
	}
	function D(t) {
		w.value = t, e.value && (e.value.title = t);
	}
	function A(t) {
		let n = t.size !== T.size;
		T.enabled = t.enabled, T.size = t.size, e.value && (e.value.snapGridEnabled = t.enabled, e.value.snapGridSize = t.size, n && e.value.showGridPreview());
	}
	function j() {
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
		e.value.loadFromJSONData(r), C.value = e.value.backgroundState, w.value = e.value.title, T.enabled = e.value.snapGridEnabled, T.size = e.value.snapGridSize, h();
	}
	function ee(t) {
		if (!e.value) return;
		let n = t === "screen" ? e.value.exportPNG() : e.value.exportA4(t === "a4-portrait" ? "portrait" : t === "a4-landscape" ? "landscape" : "auto");
		if (!n) return;
		let r = t === "screen" ? "" : `-${t}`, i = document.createElement("a");
		i.href = n, i.download = (w.value || "dessin") + r + ".png", i.click();
	}
	let F = k("default"), I = k([]), L = k([]);
	function te() {
		localStorage.setItem(go, JSON.stringify(I.value));
	}
	function ne(e) {
		let t = I.value.find((t) => t.id === e);
		t && (t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), te());
	}
	function re() {
		let e = Ua().storageRetentionDays * 24 * 60 * 60 * 1e3, t = Date.now();
		L.value = I.value.filter((n) => t - new Date(n.updatedAt).getTime() > e);
	}
	function R() {
		e.value && (C.value = e.value.backgroundState, w.value = e.value.title, d.value = null, e.value.clearHighlight(), h());
	}
	function ie(t) {
		F.value = t, localStorage.setItem(_o, t), e.value && (e.value.resetState(), e.value.setPageId(t), e.value.loadLocal(), e.value.onSave = () => ne(F.value), R(), ho().renderPageForCurrentPage());
	}
	function ae() {
		let t = [];
		try {
			let e = localStorage.getItem(go);
			e && (t = JSON.parse(e));
		} catch {}
		if (t.length === 0) {
			let e = localStorage.getItem("pi_note_draft");
			e && localStorage.setItem("pi_note_draft_default", e), localStorage.setItem(vo, "1"), t = [{
				id: "default",
				name: "Page 1",
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}], localStorage.setItem(go, JSON.stringify(t));
		} else localStorage.getItem(vo) || localStorage.setItem(vo, String(t.length));
		I.value = t;
		let n = localStorage.getItem(_o), r = n && t.some((e) => e.id === n) ? n : t[0].id;
		e.value && (e.value.resetState(), e.value.setPageId(r), e.value.loadLocal(), e.value.onSave = () => ne(F.value)), F.value = r, localStorage.setItem(_o, r), R(), re(), ho().renderPageForCurrentPage();
	}
	function oe(e) {
		let t = Ua().maxPages;
		if (t > 0 && I.value.length >= t) return;
		let n = "page-" + Date.now(), r = {
			id: n,
			name: e ?? `Page ${yo()}`,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		I.value = [...I.value, r], te(), ie(n);
	}
	function z(e) {
		e !== F.value && (ne(F.value), ie(e));
	}
	function se(e, t, n) {
		let r = I.value.find((t) => t.id === e);
		r && (r.pdfId = t, r.pdfPageIndex = n, te());
	}
	function ce(e, t, n) {
		let r = Ua().maxPages, i = Date.now(), a = [];
		for (let o = 0; o < t && !(r > 0 && I.value.length + a.length >= r); o++) {
			let t = {
				id: `page-${i}-${o}`,
				name: `${n} ${o + 1}`,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				pdfId: e,
				pdfPageIndex: o
			};
			a.push(t);
		}
		return a.length === 0 ? F.value : (I.value = [...I.value, ...a], te(), ie(a[0].id), a[0].id);
	}
	function le(e) {
		e && (I.value.some((t) => t.pdfId === e) || (Xa(e), uo(e), mo(e)));
	}
	function ue(e) {
		if (I.value.length <= 1) return;
		let t = I.value.find((t) => t.id === e);
		localStorage.removeItem("pi_note_draft_" + e), I.value = I.value.filter((t) => t.id !== e), L.value = L.value.filter((t) => t.id !== e), te(), le(t?.pdfId), e === F.value && ie(I.value[0].id);
	}
	function de(e, t) {
		let n = I.value.find((t) => t.id === e);
		n && (n.name = t, te());
	}
	function fe() {
		L.value = [];
	}
	function pe() {
		let t = new Set(I.value.map((e) => e.pdfId).filter(Boolean));
		for (let e of t) Xa(e), uo(e);
		mo();
		for (let e of I.value) localStorage.removeItem("pi_note_draft_" + e.id);
		localStorage.removeItem(go), localStorage.removeItem(_o), localStorage.setItem(vo, "1"), I.value = [{
			id: "default",
			name: "Page 1",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		}], L.value = [], localStorage.setItem(go, JSON.stringify(I.value)), F.value = "default", localStorage.setItem(_o, "default"), e.value && (e.value.resetState(), e.value.setPageId("default"), e.value.onSave = () => ne(F.value), e.value.saveLocal()), d.value = null, w.value = "", C.value = {
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
	let me = k(Ua().backendUrl), he = k("idle"), B = null;
	async function ge() {
		if (!(!e.value || !me.value)) {
			he.value = "syncing";
			try {
				await e.value.syncRemote(me.value), he.value = "ok";
			} catch {
				he.value = "error";
			}
			B && clearTimeout(B), B = setTimeout(() => {
				he.value = "idle";
			}, 3e3);
		}
	}
	let _e = k(!0);
	function ve() {
		t.value?.zoomIn();
	}
	function ye() {
		t.value?.zoomOut();
	}
	function be() {
		t.value?.resetView();
	}
	function xe() {
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
		snapGrid: T,
		setBackground: E,
		setTitle: D,
		setSnapGrid: A,
		clearAll: j,
		exportPNG: ee,
		exportJSON: N,
		importJSON: P,
		currentPageId: F,
		pages: I,
		expiredPages: L,
		initSession: ae,
		createPage: oe,
		switchPage: z,
		deletePage: ue,
		renamePage: de,
		dismissExpiredPages: fe,
		newDocument: pe,
		setPdfReference: se,
		appendPdfPages: ce,
		remoteUrl: me,
		syncStatus: he,
		syncRemote: ge,
		sidebarOpen: _e,
		zoomIn: ve,
		zoomOut: ye,
		resetView: be,
		fitView: xe
	};
}), bo = {
	"arrow-pointer": {
		viewBox: "0 0 448 512",
		content: "<path d=\"M77.3 2.5c8.1-4.1 17.9-3.2 25.1 2.3l320 239.9c8.3 6.2 11.6 17 8.4 26.8s-12.4 16.4-22.8 16.4l-152.3 0 88.9 177.7c7.9 15.8 1.5 35-14.3 42.9s-35 1.5-42.9-14.3l-88.9-177.7-91.3 121.8c-6.2 8.3-17 11.6-26.8 8.4S64 434.3 64 424L64 24c0-9.1 5.1-17.4 13.3-21.5z\"/>"
	},
	"pen-nib": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M368.5 18.3l-50.1 50.1 125.3 125.3 50.1-50.1c21.9-21.9 21.9-57.3 0-79.2L447.7 18.3c-21.9-21.9-57.3-21.9-79.2 0zM279.3 97.2l-.5 .1-144.1 43.2c-19.9 6-35.7 21.2-42.3 41L3.8 445.8c-2.9 8.7-1.9 18.2 2.5 26L161.7 316.4c-1.1-4-1.6-8.1-1.6-12.4 0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48c-4.3 0-8.5-.6-12.4-1.6L40.3 505.7c7.8 4.4 17.2 5.4 26 2.5l264.3-88.6c19.7-6.6 35-22.4 41-42.3l43.2-144.1 .1-.5-135.5-135.5z\"/>"
	},
	highlighter: {
		viewBox: "0 0 576 512",
		content: "<path d=\"M315 315L473.4 99.9 444.1 70.6 229 229 315 315zm-187 5l0 0 0-71.7c0-15.3 7.2-29.6 19.5-38.6L420.6 8.4C428 2.9 437 0 446.2 0 457.6 0 468.5 4.5 476.6 12.6l54.8 54.8c8.1 8.1 12.6 19 12.6 30.5 0 9.2-2.9 18.2-8.4 25.6L334.4 396.5c-9 12.3-23.4 19.5-38.6 19.5l-71.7 0-25.4 25.4c-12.5 12.5-32.8 12.5-45.3 0l-50.7-50.7c-12.5-12.5-12.5-32.8 0-45.3L128 320zM7 466.3l51.7-51.7 70.6 70.6-19.7 19.7c-4.5 4.5-10.6 7-17 7L24 512c-13.3 0-24-10.7-24-24l0-4.7c0-6.4 2.5-12.5 7-17z\"/>"
	},
	eraser: {
		viewBox: "0 0 576 512",
		content: "<path d=\"M178.5 416l123 0 65.3-65.3-173.5-173.5-126.7 126.7 112 112zM224 480l-45.5 0c-17 0-33.3-6.7-45.3-18.7L17 345C6.1 334.1 0 319.4 0 304s6.1-30.1 17-41L263 17C273.9 6.1 288.6 0 304 0s30.1 6.1 41 17L527 199c10.9 10.9 17 25.6 17 41s-6.1 30.1-17 41l-135 135 120 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0z\"/>"
	},
	"arrows-up-down-left-right": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M278.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l9.4-9.4 0 114.7-114.7 0 9.4-9.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4 114.7 0 0 114.7-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-9.4 9.4 0-114.7 114.7 0-9.4 9.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4-114.7 0 0-114.7 9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64z\"/>"
	},
	"draw-polygon": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M64 0c23.7 0 44.4 12.9 55.4 32l273.1 0c11.1-19.1 31.7-32 55.4-32 35.3 0 64 28.7 64 64 0 34-26.5 61.8-60 63.9l-2.1 2.9-71.5 99.1c3.6 8 5.6 16.9 5.6 26.2s-2 18.2-5.6 26.2l2.2 3.1 69.3 96 2.1 2.9c33.5 2.1 60 29.9 60 63.9 0 35.3-28.7 64-64 64-23.7 0-44.4-12.9-55.4-32l-273.1 0c-11.1 19.1-31.7 32-55.4 32-35.3 0-64-28.7-64-64 0-23.7 12.9-44.4 32-55.4l0-273.1C12.9 108.4 0 87.7 0 64 0 28.7 28.7 0 64 0zM394.2 413.4l-65.5-90.6-2.2-3.1c-2.1 .2-4.3 .3-6.5 .3-35.3 0-64-28.7-64-64s28.7-64 64-64c2.2 0 4.4 .1 6.5 .3l67.7-93.7c-.6-.9-1.1-1.7-1.6-2.6L119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4l0 273.1c9.7 5.6 17.8 13.7 23.4 23.4l273.1 0c.5-.9 1.1-1.8 1.6-2.6z\"/>"
	},
	"rotate-left": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M24 192l144 0c9.7 0 18.5-5.8 22.2-14.8s1.7-19.3-5.2-26.2l-46.7-46.7c75.3-58.6 184.3-53.3 253.5 15.9 75 75 75 196.5 0 271.5s-196.5 75-271.5 0c-10.2-10.2-19-21.3-26.4-33-9.5-14.9-29.3-19.3-44.2-9.8s-19.3 29.3-9.8 44.2C49.7 408.7 61.4 423.5 75 437 175 537 337 537 437 437S537 175 437 75C342.8-19.3 193.3-24.7 92.7 58.8L41 7C34.1 .2 23.8-1.9 14.8 1.8S0 14.3 0 24L0 168c0 13.3 10.7 24 24 24z\"/>"
	},
	"rotate-right": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M488 192l-144 0c-9.7 0-18.5-5.8-22.2-14.8s-1.7-19.3 5.2-26.2l46.7-46.7c-75.3-58.6-184.3-53.3-253.5 15.9-75 75-75 196.5 0 271.5s196.5 75 271.5 0c8.2-8.2 15.5-16.9 21.9-26.1 10.1-14.5 30.1-18 44.6-7.9s18 30.1 7.9 44.6c-8.5 12.2-18.2 23.8-29.1 34.7-100 100-262.1 100-362 0S-25 175 75 75c94.3-94.3 243.7-99.6 344.3-16.2L471 7c6.9-6.9 17.2-8.9 26.2-5.2S512 14.3 512 24l0 144c0 13.3-10.7 24-24 24z\"/>"
	},
	"chevron-right": {
		viewBox: "0 0 320 512",
		content: "<path d=\"M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z\"/>"
	},
	"chevron-left": {
		viewBox: "0 0 320 512",
		content: "<path d=\"M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z\"/>"
	},
	"chevron-up": {
		viewBox: "0 0 448 512",
		content: "<path d=\"M201.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 173.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z\"/>"
	},
	"chevron-down": {
		viewBox: "0 0 448 512",
		content: "<path d=\"M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z\"/>"
	},
	xmark: {
		viewBox: "0 0 384 512",
		content: "<path d=\"M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z\"/>"
	},
	"magnifying-glass-plus": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 112c-13.3 0-24 10.7-24 24l0 48-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0 0 48c0 13.3 10.7 24 24 24s24-10.7 24-24l0-48 48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-48c0-13.3-10.7-24-24-24z\"/>"
	},
	"magnifying-glass-minus": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM136 184c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-144 0z\"/>"
	},
	expand: {
		viewBox: "0 0 448 512",
		content: "<path d=\"M32 32C14.3 32 0 46.3 0 64l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 32zM64 352c0-17.7-14.3-32-32-32S0 334.3 0 352l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96z\"/>"
	},
	compress: {
		viewBox: "0 0 448 512",
		content: "<path d=\"M160 64c0-17.7-14.3-32-32-32S96 46.3 96 64l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z\"/>"
	},
	"arrow-left": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 105.4-105.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z\"/>"
	},
	"arrow-right": {
		viewBox: "0 0 512 512",
		content: "<path d=\"M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-105.4 105.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z\"/>"
	},
	play: {
		viewBox: "0 0 448 512",
		content: "<path d=\"M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z\"/>"
	},
	"angle-right": {
		viewBox: "0 0 256 512",
		content: "<path d=\"M247.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L179.2 256 41.9 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z\"/>"
	},
	eye: {
		viewBox: "0 0 576 512",
		content: "<path d=\"M288 80C222.8 80 169.2 109.6 128.1 147.7 89.6 183.5 63 226 49.4 256 63 286 89.6 328.5 128.1 364.3 169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256 513 226 486.4 183.5 447.9 147.7 406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1 3.3 7.9 3.3 16.7 0 24.6-14.9 35.7-46.2 87.7-93 131.1-47.1 43.7-111.8 80.6-192.6 80.6S142.5 443.2 95.4 399.4c-46.8-43.5-78.1-95.4-93-131.1-3.3-7.9-3.3-16.7 0-24.6 14.9-35.7 46.2-87.7 93-131.1zM288 336c44.2 0 80-35.8 80-80 0-29.6-16.1-55.5-40-69.3-1.4 59.7-49.6 107.9-109.3 109.3 13.8 23.9 39.7 40 69.3 40zm-79.6-88.4c2.5 .3 5 .4 7.6 .4 35.3 0 64-28.7 64-64 0-2.6-.2-5.1-.4-7.6-37.4 3.9-67.2 33.7-71.1 71.1zm45.6-115c10.8-3 22.2-4.5 33.9-4.5 8.8 0 17.5 .9 25.8 2.6 .3 .1 .5 .1 .8 .2 57.9 12.2 101.4 63.7 101.4 125.2 0 70.7-57.3 128-128 128-61.6 0-113-43.5-125.2-101.4-1.8-8.6-2.8-17.5-2.8-26.6 0-11 1.4-21.8 4-32 .2-.7 .3-1.3 .5-1.9 11.9-43.4 46.1-77.6 89.5-89.5z\"/>"
	},
	"eye-slash": {
		viewBox: "0 0 576 512",
		content: "<path d=\"M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM176.9 111.1c32.1-18.9 69.2-31.1 111.1-31.1 65.2 0 118.8 29.6 159.9 67.7 38.5 35.7 65.1 78.3 78.6 108.3-13.6 30-40.2 72.5-78.6 108.3-3.1 2.8-6.2 5.6-9.4 8.4L393.8 328c14-20.5 22.2-45.3 22.2-72 0-70.7-57.3-128-128-128-26.7 0-51.5 8.2-72 22.2l-39.1-39.1zm182 182l-108-108c11.1-5.8 23.7-9.1 37.1-9.1 44.2 0 80 35.8 80 80 0 13.4-3.3 26-9.1 37.1zM103.4 173.2l-34-34c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6L352.2 422c-20 6.4-41.4 10-64.2 10-65.2 0-118.8-29.6-159.9-67.7-38.5-35.7-65.1-78.3-78.6-108.3 10.4-23.1 28.6-53.6 54-82.8z\"/>"
	},
	"trash-can": {
		viewBox: "0 0 448 512",
		content: "<path d=\"M166.2-16c-13.3 0-25.3 8.3-30 20.8L120 48 24 48C10.7 48 0 58.7 0 72S10.7 96 24 96l400 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-96 0-16.2-43.2C307.1-7.7 295.2-16 281.8-16L166.2-16zM32 144l0 304c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-304-48 0 0 304c0 8.8-7.2 16-16 16L96 464c-8.8 0-16-7.2-16-16l0-304-48 0zm160 72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176zm112 0c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176z\"/>"
	},
	circle: {
		viewBox: "0 0 512 512",
		content: "<path d=\"M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z\"/>"
	},
	square: {
		viewBox: "0 0 448 512",
		content: "<path d=\"M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z\"/>"
	},
	"file-arrow-down": {
		viewBox: "0 0 384 512",
		content: "<path d=\"M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM216 232l0 102.1 31-31c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-72 72c-9.4 9.4-24.6 9.4-33.9 0l-72-72c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l31 31L168 232c0-13.3 10.7-24 24-24s24 10.7 24 24z\"/>"
	},
	"tool-line": {
		viewBox: "0 0 24 24",
		content: "<line x1=\"2\" y1=\"22\" x2=\"22\" y2=\"2\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"8\" cy=\"16\" r=\"2.5\"/><circle cx=\"16\" cy=\"8\" r=\"2.5\"/>"
	},
	"tool-segment": {
		viewBox: "0 0 24 24",
		content: "<line x1=\"4\" y1=\"20\" x2=\"20\" y2=\"4\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"4\" cy=\"20\" r=\"2.5\"/><circle cx=\"20\" cy=\"4\" r=\"2.5\"/>"
	},
	"tool-vector": {
		viewBox: "0 0 24 24",
		content: "<line x1=\"4\" y1=\"20\" x2=\"18\" y2=\"6\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><path d=\"M18 6l-5 1 4 4z\" stroke=\"none\"/>"
	},
	"tool-rect-2pts": {
		viewBox: "0 0 24 24",
		content: "<rect x=\"5\" y=\"7\" width=\"14\" height=\"10\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"/>"
	},
	"tool-rect-3pts": {
		viewBox: "0 0 24 24",
		content: "<rect x=\"5\" y=\"7\" width=\"14\" height=\"10\" rx=\"2\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\" transform=\"rotate(-18, 12, 12)\"/>"
	}
}, xo = ["viewBox", "innerHTML"], $ = /* @__PURE__ */ u({
	__name: "PiIcon",
	props: { icon: {} },
	setup(e) {
		let t = e, n = r(() => bo[t.icon]);
		return (e, t) => n.value ? (D(), o("svg", {
			key: 0,
			viewBox: n.value.viewBox,
			fill: "currentColor",
			xmlns: "http://www.w3.org/2000/svg",
			"aria-hidden": "true",
			innerHTML: n.value.content
		}, null, 8, xo)) : a("", !0);
	}
}), So = { class: "tool-selector" }, Co = ["onClick"], wo = { class: "icon-wrapper" }, To = /* @__PURE__ */ u({
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
		let n = Q(), r = t, i = {
			select: "arrow-pointer",
			pen: "pen-nib",
			highlighter: "highlighter",
			eraser: "eraser",
			move: "arrows-up-down-left-right",
			line: "tool-line",
			segment: "tool-segment",
			vector: "tool-vector",
			circle: "circle",
			polygon: "draw-polygon"
		};
		function a(e) {
			return e === "rectangle" ? n.tool.tool === "rectangle" && n.tool.rectMode === "3pts" ? "tool-rect-3pts" : "tool-rect-2pts" : i[e] ?? e;
		}
		return (t, i) => (D(), o("div", So, [(D(!0), o(e, null, A(r.tools, (e) => (D(), o("button", {
			key: e,
			class: x(["tool-button", { active: I(n).tool.tool === e }]),
			onClick: (t) => I(n).selectTool(e)
		}, [s("span", wo, [l($, { icon: a(e) }, null, 8, ["icon"])])], 10, Co))), 128))]));
	}
}), Eo = { class: "color-selector" }, Do = ["onClick"], Oo = /* @__PURE__ */ u({
	__name: "ColorSelector",
	props: /* @__PURE__ */ y({ tool: {} }, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let n = L(t, "modelValue"), r = t, i = [
			"#000000",
			"#ef4444",
			"#3b82f6",
			"#22c55e",
			"#eab308"
		];
		function a(e) {
			return r.tool === "eraser" ? !0 : e === void 0 ? !1 : r.tool === "highlighter" && e === "#000000";
		}
		function c(e) {
			n.value = e, d.value = e === u.value;
		}
		let l = te("picker"), u = k("#34cd34"), d = k(!1);
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
		return (t, r) => (D(), o("div", Eo, [(D(), o(e, null, A(i, (e) => s("button", {
			key: e,
			class: x(["color-button", {
				active: n.value === e,
				disabled: a(e)
			}]),
			style: S({ backgroundColor: e }),
			onClick: (t) => c(e)
		}, null, 14, Do)), 64)), s("button", {
			class: "color-btn",
			onClick: f
		}, [s("div", {
			style: S({ backgroundColor: u.value }),
			class: "circle"
		}, null, 4), oe(s("input", {
			ref_key: "picker",
			ref: l,
			"onUpdate:modelValue": r[0] ||= (e) => u.value = e,
			type: "color",
			onChange: p,
			onInput: p
		}, null, 544), [[ne, u.value]])])]));
	}
}), ko = { class: "width-selector" }, Ao = { class: "presets" }, jo = ["onClick"], Mo = {
	key: 0,
	class: "slider-row"
}, No = ["max", "value"], Po = ["max", "value"], Fo = /* @__PURE__ */ u({
	__name: "WidthSelector",
	props: /* @__PURE__ */ y({
		tool: {},
		color: {},
		showSlider: { type: Boolean }
	}, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let n = L(t, "modelValue"), i = t, c = r(() => {
			switch (i.tool) {
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
		}), l = r(() => i.tool === "eraser" ? 60 : 30), u = r(() => i.tool === "eraser");
		function d(e) {
			let t = Number(e.target.value);
			t > 0 && (n.value = t);
		}
		return (r, f) => (D(), o("div", ko, [s("div", Ao, [(D(!0), o(e, null, A(c.value, (e) => (D(), o("button", {
			key: e,
			class: x(["width-button", { active: n.value === e }]),
			onClick: (t) => n.value = e
		}, [u.value ? (D(), o("span", {
			key: 0,
			class: "width-circle",
			style: S({
				width: e + "px",
				height: e + "px"
			})
		}, null, 4)) : (D(), o("span", {
			key: 1,
			class: "width-line",
			style: S({
				height: e / 2 + "px",
				background: i.color || "#333"
			})
		}, null, 4))], 10, jo))), 128))]), t.showSlider ? (D(), o("div", Mo, [s("input", {
			type: "range",
			class: "slider",
			min: 1,
			max: l.value,
			value: n.value,
			onInput: d
		}, null, 40, No), s("input", {
			type: "number",
			class: "number-input",
			min: 1,
			max: l.value,
			value: n.value,
			onChange: d
		}, null, 40, Po)])) : a("", !0)]));
	}
}), Io = { class: "layer-selector" }, Lo = ["onClick"], Ro = /* @__PURE__ */ u({
	__name: "LayerSelector",
	props: /* @__PURE__ */ y({ showNull: {
		type: Boolean,
		default: !0
	} }, {
		modelValue: {},
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(t) {
		let n = L(t, "modelValue"), r = ["MAIN", "LAYER"];
		function i(e) {
			n.value = e;
		}
		return (c, l) => (D(), o("div", Io, [(D(), o(e, null, A(r, (e) => s("button", {
			key: e,
			class: x(["layer-btn", { active: n.value === e }]),
			onClick: (t) => i(e)
		}, N(e[0]), 11, Lo)), 64)), t.showNull ? (D(), o("button", {
			key: 0,
			class: x(["layer-btn", { active: n.value === null }]),
			onClick: l[0] ||= (e) => i(null)
		}, " T ", 2)) : a("", !0)]));
	}
}), zo = { class: "note-tools" }, Bo = { class: "tabs" }, Vo = { class: "clear tabs-row" }, Ho = { class: "mini-panel-row" }, Uo = ["title"], Wo = { class: "tools-row" }, Go = /* @__PURE__ */ u({
	__name: "NoteTools",
	setup(t) {
		let n = Q(), r = k("drawing"), a = [
			"select",
			"move",
			"pen",
			"highlighter",
			"eraser"
		], u = [
			"select",
			"move",
			"line",
			"segment",
			"vector",
			"circle",
			"rectangle",
			"polygon"
		];
		function d(e) {
			r.value = e;
			let t = e === "drawing" ? a : u;
			t.includes(n.tool.tool) || n.selectTool(t[0]);
		}
		let f = k(!1), p = null;
		function m() {
			f.value ? (p && clearTimeout(p), f.value = !1, n.clearAll()) : (f.value = !0, p = setTimeout(() => {
				f.value = !1;
			}, 2500));
		}
		return (t, p) => (D(), o("div", zo, [s("div", Bo, [
			s("button", {
				class: x(["btn btn-ghost", { "btn-active": r.value === "drawing" }]),
				onClick: p[0] ||= (e) => d("drawing")
			}, " Dessin ", 2),
			s("button", {
				class: x(["btn btn-ghost", { "btn-active": r.value === "shapes" }]),
				onClick: p[1] ||= (e) => d("shapes")
			}, " Formes ", 2),
			s("div", Vo, [s("div", Ho, [
				s("button", {
					class: "btn",
					title: "Zoom +",
					onClick: p[2] ||= (e) => I(n).zoomIn()
				}, [l($, { icon: "magnifying-glass-plus" })]),
				s("button", {
					class: "btn",
					title: "Zoom −",
					onClick: p[3] ||= (e) => I(n).zoomOut()
				}, [l($, { icon: "magnifying-glass-minus" })]),
				s("button", {
					class: "btn",
					title: "Tout afficher",
					onClick: p[4] ||= (e) => I(n).fitView()
				}, [l($, { icon: "expand" })]),
				s("button", {
					class: "btn",
					title: "Réinitialiser",
					onClick: p[5] ||= (e) => I(n).resetView()
				}, [l($, { icon: "compress" })])
			]), s("button", {
				class: x(["btn btn-ghost", { pending: f.value }]),
				title: f.value ? "Cliquer à nouveau pour confirmer" : "Tout effacer",
				onClick: m
			}, [f.value ? (D(), o(e, { key: 0 }, [c(" Confirmer ? ")], 64)) : (D(), i($, {
				key: 1,
				icon: "trash-can"
			}))], 10, Uo)])
		]), s("div", Wo, [
			l(To, { tools: r.value === "drawing" ? a : u }, null, 8, ["tools"]),
			p[9] ||= s("div", { class: "divider" }, null, -1),
			l(Oo, {
				"model-value": I(n).tool.color,
				tool: I(n).tool.tool,
				"onUpdate:modelValue": p[6] ||= (e) => e !== void 0 && I(n).setToolColor(e)
			}, null, 8, ["model-value", "tool"]),
			l(Fo, {
				"model-value": I(n).tool.width,
				tool: I(n).tool.tool,
				"onUpdate:modelValue": p[7] ||= (e) => e !== void 0 && I(n).setToolWidth(e)
			}, null, 8, ["model-value", "tool"]),
			l(Ro, {
				"model-value": I(n).tool.layer,
				"onUpdate:modelValue": p[8] ||= (e) => {
					I(n).tool.layer = e ?? null;
				}
			}, null, 8, ["model-value"])
		])]));
	}
}), Ko = { class: "history-body" }, qo = {
	key: 0,
	class: "msg-empty"
}, Jo = ["onClick"], Yo = ["title", "onClick"], Xo = ["onClick"], Zo = /* @__PURE__ */ u({
	__name: "SidebarPanelHistory",
	setup(t) {
		let n = Q(), r = {
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
		return (t, i) => (D(), o("div", Ko, [I(n).shapes.length === 0 ? (D(), o("div", qo, " Aucune forme ")) : a("", !0), (D(!0), o(e, null, A([...I(n).shapes].reverse(), (e) => (D(), o("div", {
			key: e.id,
			class: x(["h-row", { active: I(n).selectedShapeId === e.id }]),
			onClick: (t) => I(n).highlightShape(e.id)
		}, [
			e.color ? (D(), o("span", {
				key: 0,
				class: "h-color",
				style: S({ background: e.color })
			}, null, 4)) : a("", !0),
			s("span", { class: x(["h-label", { hidden: e.hidden }]) }, N(r[e.tool] ?? e.tool), 3),
			s("button", {
				class: "btn-icon",
				title: e.hidden ? "Afficher" : "Cacher",
				onClick: z((t) => I(n).toggleShapeVisibility(e.id), ["stop"])
			}, [l($, { icon: e.hidden ? "eye-slash" : "eye" }, null, 8, ["icon"])], 8, Yo),
			s("button", {
				class: "btn-icon del",
				title: "Supprimer",
				onClick: z((t) => I(n).destroyShape(e.id), ["stop"])
			}, [l($, { icon: "trash-can" })], 8, Xo)
		], 10, Jo))), 128))]));
	}
}), Qo = 1240, $o = 1754, es = 595, ts = 842;
function ns(e) {
	let t = localStorage.getItem("pi_note_draft_" + e);
	if (!t) return [];
	try {
		let e = JSON.parse(t);
		return (Array.isArray(e) ? e : e.shapes ?? []).map((e) => Se.fromJSON(e)).filter((e) => e !== null && !e.hidden);
	} catch {
		return [];
	}
}
async function rs(e, t) {
	let n = document.createElement("canvas");
	n.width = Qo, n.height = $o;
	let r = n.getContext("2d");
	r.fillStyle = "#ffffff", r.fillRect(0, 0, Qo, $o);
	let i = ns(e.id);
	if (e.pdfId !== void 0 && e.pdfPageIndex !== void 0) try {
		let n = await Ya(e.pdfId);
		if (n) {
			let a = await co(e.pdfId, n, e.pdfPageIndex, Qo);
			if (r.drawImage(a, 0, 0, Qo, $o), i.length && t) {
				let e = Qo / t.w, n = $o / t.h, a = Math.min(e, n);
				r.save(), r.scale(a, a);
				for (let e of i) e.draw(r);
				r.restore();
			} else if (i.length) for (let e of i) e.draw(r);
		}
	} catch {}
	else if (i.length) {
		let e = Infinity, t = Infinity, n = -Infinity, a = -Infinity;
		for (let r of i) {
			let i = r.getBounds();
			i && (e = Math.min(e, i.minX), t = Math.min(t, i.minY), n = Math.max(n, i.maxX), a = Math.max(a, i.maxY));
		}
		if (isFinite(e)) {
			let o = Math.max(n - e, 1), s = Math.max(a - t, 1), c = Math.min((Qo - 80) / o, ($o - 80) / s), l = 40 + (Qo - 80 - o * c) / 2 - e * c, u = 40 + ($o - 80 - s * c) / 2 - t * c;
			r.save(), r.translate(l, u), r.scale(c, c);
			for (let e of i) e.draw(r);
			r.restore();
		}
	}
	return n;
}
function is(e) {
	return new Promise((t, n) => {
		e.toBlob((e) => {
			if (!e) {
				n(/* @__PURE__ */ Error("toBlob failed"));
				return;
			}
			e.arrayBuffer().then((e) => t(new Uint8Array(e))).catch(n);
		}, "image/jpeg", .92);
	});
}
function as(e, t, n) {
	let r = new TextEncoder(), i = [];
	function a(e) {
		return r.encode(e);
	}
	function o(...e) {
		let t = e.reduce((e, t) => e + t.length, 0), n = new Uint8Array(t), r = 0;
		for (let t of e) n.set(t, r), r += t.length;
		return n;
	}
	i.push(a("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")), i.push(a("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")), i.push(a(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${es} ${ts}]\n/Resources << /XObject << /Im0 4 0 R >> >>\n/Contents 5 0 R >>\nendobj\n`));
	let s = a(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${t} /Height ${n}\n/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${e.length} >>\nstream\n`), c = a("\nendstream\nendobj\n");
	i.push(o(s, e, c));
	let l = `q ${es} 0 0 ${ts} 0 0 cm /Im0 Do Q`, u = a(l);
	i.push(a(`5 0 obj\n<< /Length ${u.length} >>\nstream\n${l}\nendstream\nendobj\n`));
	let d = a("%PDF-1.4\n%âãÏÓ\n"), f = d.length, p = [], m = [d];
	for (let e = 0; e < i.length; e++) p.push(f), m.push(i[e]), f += i[e].length;
	let h = f, g = [`xref\n0 ${i.length + 1}\n`, "0000000000 65535 f \n"];
	for (let e of p) g.push(String(e).padStart(10, "0") + " 00000 n \n");
	let _ = a(g.join(""));
	m.push(_);
	let v = a(`trailer\n<< /Size ${i.length + 1} /Root 1 0 R >>\nstartxref\n${h}\n%%EOF\n`);
	return m.push(v), o(...m);
}
async function os(e, t, n) {
	let r = as(await is(await rs(e, t)), Qo, $o), i = new Blob([r], { type: "application/pdf" }), a = URL.createObjectURL(i), o = document.createElement("a");
	o.href = a, o.download = n, o.click(), URL.revokeObjectURL(a);
}
//#endregion
//#region src/vue/components/PagePreview.vue
var ss = /* @__PURE__ */ u({
	__name: "PagePreview",
	props: { page: {} },
	setup(e, { expose: t }) {
		let n = e, r = ho(), i = k(null);
		function a(e) {
			let t = localStorage.getItem("pi_note_draft_" + e);
			if (!t) return [];
			try {
				let e = JSON.parse(t);
				return (Array.isArray(e) ? e : e.shapes ?? []).map((e) => Se.fromJSON(e)).filter((e) => e !== null && !e.hidden);
			} catch {
				return [];
			}
		}
		function s(e) {
			return new Promise((t, n) => {
				let r = new Image();
				r.onload = () => t(r), r.onerror = n, r.src = e;
			});
		}
		async function c() {
			let e = i.value;
			if (!e) return;
			let t = e.getContext("2d");
			if (!t) return;
			t.fillStyle = "#fff", t.fillRect(0, 0, 400, 300);
			let o = n.page, c = null, l = null;
			if (o.pdfId !== void 0 && o.pdfPageIndex !== void 0) {
				let e = await r.ensureThumbnail(o.pdfId, o.pdfPageIndex);
				if (e) try {
					c = await s(e);
				} catch {}
				let t = r.getPdfCanvasSize(o.pdfId, o.pdfPageIndex);
				t && (l = {
					x: 0,
					y: 0,
					w: t.w,
					h: t.h
				});
			}
			let u = a(o.id), d = Infinity, f = Infinity, p = -Infinity, m = -Infinity;
			l && (d = Math.min(d, 0), f = Math.min(f, 0), p = Math.max(p, l.w), m = Math.max(m, l.h));
			for (let e of u) {
				let t = e.getBounds();
				t && (d = Math.min(d, t.minX), f = Math.min(f, t.minY), p = Math.max(p, t.maxX), m = Math.max(m, t.maxY));
			}
			if (!isFinite(d)) {
				if (c) {
					let e = Math.min(400 / c.width, 300 / c.height);
					t.drawImage(c, (400 - c.width * e) / 2, (300 - c.height * e) / 2, c.width * e, c.height * e);
				}
				return;
			}
			let h = Math.max(p - d, 1), g = Math.max(m - f, 1), _ = Math.min(380 / h, 280 / g), v = 10 + (380 - h * _) / 2 - d * _, y = 10 + (280 - g * _) / 2 - f * _;
			if (c && l && t.drawImage(c, v + l.x * _, y + l.y * _, l.w * _, l.h * _), u.length) {
				t.save(), t.translate(v, y), t.scale(_, _);
				for (let e of u) e.draw(t);
				t.restore();
			}
		}
		return t({ render: c }), (e, t) => (D(), o("canvas", {
			ref_key: "canvasEl",
			ref: i,
			width: "400",
			height: "300"
		}, null, 512));
	}
}), cs = { class: "pn-card-header" }, ls = { class: "pn-card-num" }, us = { class: "pn-card-actions" }, ds = ["disabled", "title"], fs = { class: "pn-card-preview" }, ps = { class: "pn-card-name" }, ms = /* @__PURE__ */ u({
	__name: "PageCard",
	props: {
		page: {},
		pageNumber: {}
	},
	emits: ["select"],
	setup(e, { expose: t, emit: n }) {
		let i = e, a = n, c = Q(), u = ho(), d = k(null), f = r(() => i.page.id === c.currentPageId), p = r(() => c.pages.length > 1);
		function m(e) {
			e.stopPropagation(), p.value && c.deletePage(i.page.id);
		}
		async function h(e) {
			e.stopPropagation();
			let t = i.page;
			await os(t, t.pdfId !== void 0 && t.pdfPageIndex !== void 0 ? u.getPdfCanvasSize(t.pdfId, t.pdfPageIndex) : null, (t.name || `page-${i.pageNumber}`) + ".pdf");
		}
		function g() {
			return d.value?.render();
		}
		return t({ render: g }), (t, n) => (D(), o("div", {
			class: x(["pn-page-card", { active: f.value }]),
			onClick: n[0] ||= (e) => a("select")
		}, [
			s("div", cs, [s("span", ls, N(e.pageNumber), 1), s("div", us, [s("button", {
				class: x(["btn-icon", { del: p.value }]),
				disabled: !p.value,
				title: p.value ? "Supprimer la page" : "Impossible (dernière page)",
				onClick: m
			}, [l($, { icon: "trash-can" })], 10, ds), s("button", {
				class: "btn-icon",
				title: "Télécharger en PDF",
				onClick: h
			}, [l($, { icon: "file-arrow-down" })])])]),
			s("div", fs, [l(ss, {
				ref_key: "previewRef",
				ref: d,
				page: e.page
			}, null, 8, ["page"])]),
			s("div", ps, N(e.page.name), 1)
		], 2));
	}
}), hs = { class: "pn-pages-header" }, gs = { class: "pn-pages-body" }, _s = /* @__PURE__ */ u({
	__name: "PagesDialog",
	props: { open: { type: Boolean } },
	emits: ["close"],
	setup(n, { emit: r }) {
		let a = n, c = r, u = Q(), d = k(null), f = /* @__PURE__ */ new Map();
		function p(e, t) {
			t ? f.set(e, t) : f.delete(e);
		}
		function m(e) {
			u.switchPage(e), c("close");
		}
		function h(e) {
			return e + 1;
		}
		function g(e) {
			e.target === d.value && c("close");
		}
		function _(e) {
			e.preventDefault(), c("close");
		}
		function v(e) {
			d.value?.contains(e.target) || (e.stopPropagation(), e.preventDefault());
		}
		async function y() {
			for (let e of u.pages) {
				let t = f.get(e.id);
				t && (await t.render(), await new Promise((e) => setTimeout(e, 0)));
			}
		}
		return R(() => a.open, async (e) => {
			e ? (document.body.style.overflow = "hidden", window.addEventListener("wheel", v, {
				capture: !0,
				passive: !1
			}), d.value?.showModal(), await b(), y()) : (document.body.style.overflow = "", window.removeEventListener("wheel", v, { capture: !0 }), d.value?.close());
		}), C(() => {
			document.body.style.overflow = "", window.removeEventListener("wheel", v, { capture: !0 });
		}), (n, r) => (D(), i(t, { to: "body" }, [s("dialog", {
			ref_key: "dialogEl",
			ref: d,
			class: "pn-pages-dialog",
			onClick: g,
			onCancel: _
		}, [s("div", {
			class: "pn-pages-container",
			onClick: r[1] ||= z(() => {}, ["stop"])
		}, [s("header", hs, [r[2] ||= s("span", { class: "pn-pages-title" }, "Pages", -1), s("button", {
			class: "btn btn-ghost",
			style: { padding: "4px 8px" },
			onClick: r[0] ||= (e) => c("close")
		}, [l($, { icon: "xmark" })])]), s("div", gs, [(D(!0), o(e, null, A(I(u).pages, (e, t) => (D(), i(ms, {
			key: e.id,
			ref_for: !0,
			ref: (t) => p(e.id, t),
			page: e,
			"page-number": h(t),
			onSelect: (t) => m(e.id)
		}, null, 8, [
			"page",
			"page-number",
			"onSelect"
		]))), 128))])])], 544)]));
	}
}), vs = { class: "canvas-body" }, ys = { class: "canvas-field pages-header" }, bs = { class: "canvas-field" }, xs = ["value"], Ss = { class: "canvas-field" }, Cs = { class: "bg-grid" }, ws = ["onClick"], Ts = { class: "canvas-field" }, Es = ["value"], Ds = { class: "opt-val" }, Os = { class: "canvas-field" }, ks = ["value"], As = { class: "opt-val" }, js = { class: "canvas-field" }, Ms = { class: "color-row" }, Ns = ["title", "onClick"], Ps = ["value"], Fs = { class: "canvas-field" }, Is = ["value"], Ls = { class: "opt-val" }, Rs = { class: "canvas-field" }, zs = ["value"], Bs = { class: "opt-val" }, Vs = { class: "canvas-field" }, Hs = { class: "color-row" }, Us = ["title", "onClick"], Ws = ["value"], Gs = { class: "canvas-field" }, Ks = { class: "origin-row" }, qs = { class: "canvas-field" }, Js = ["value"], Ys = { class: "opt-val" }, Xs = { class: "canvas-field" }, Zs = ["value"], Qs = { class: "opt-val" }, $s = { class: "canvas-field" }, ec = { class: "color-row" }, tc = ["title", "onClick"], nc = ["value"], rc = { class: "canvas-field pages-header" }, ic = { style: {
	display: "flex",
	gap: "4px",
	"flex-wrap": "wrap"
} }, ac = ["disabled"], oc = {
	key: 3,
	class: "canvas-field"
}, sc = {
	class: "opt-val",
	style: {
		"font-size": "11px",
		overflow: "hidden",
		"text-overflow": "ellipsis",
		"white-space": "nowrap"
	}
}, cc = { class: "canvas-field" }, lc = {
	key: 0,
	class: "opt-val linked-label"
}, uc = {
	key: 4,
	class: "canvas-field"
}, dc = ["value"], fc = { class: "opt-val" }, pc = {
	key: 5,
	class: "canvas-field"
}, mc = { class: "opt-val linked-size" }, hc = { class: "canvas-field export-field" }, gc = { class: "canvas-field export-field" }, _c = { class: "canvas-field" }, vc = ["value"], yc = {
	key: 6,
	class: "canvas-field export-field"
}, bc = ["disabled"], xc = /* @__PURE__ */ u({
	__name: "SidebarPanelCanvas",
	setup(t) {
		let n = Q(), i = ho(), u = k(null), d = k(n.pages.find((e) => e.id === n.currentPageId));
		ie(() => {
			d.value = n.pages.find((e) => e.id === n.currentPageId);
		});
		let f = k({});
		async function p(e) {
			let t = e.target, r = t.files?.[0];
			if (!r) return;
			t.value = "";
			let { pdfId: a, pageCount: o } = await i.importPdf(r);
			f.value[a] = r.name, n.appendPdfPages(a, o, "Page");
		}
		function m() {
			d.value && (n.setPdfReference(d.value.id, void 0, void 0), i.clearReference());
		}
		let h = k(null);
		async function g(e) {
			let t = e.target, r = t.files?.[0];
			r && (await n.importJSON(r), t.value = "");
		}
		let _ = k(!1);
		function v() {
			confirm("Nouveau document : toutes les pages seront supprimées. Continuer ?") && n.newDocument();
		}
		let y = k(n.remoteUrl);
		R(y, (e) => {
			n.remoteUrl = e;
		});
		let b = r(() => n.syncStatus === "syncing" ? "En cours…" : n.syncStatus === "ok" ? "Synchronisé" : n.syncStatus === "error" ? "Erreur" : "Synchroniser"), C = {
			none: "blanc",
			ruled: "réglé",
			grid: "grille",
			hex: "hex"
		}, w = Ua().colorPresets, T = k(n.snapGrid.enabled), E = k(n.snapGrid.size);
		R(() => n.snapGrid, (e) => {
			T.value = e.enabled, E.value = e.size;
		}, { deep: !0 });
		function O() {
			T.value = !T.value, n.setSnapGrid({
				enabled: T.value,
				size: E.value
			});
		}
		function j(e) {
			E.value = e, n.setSnapGrid({
				enabled: T.value,
				size: E.value
			});
		}
		function M(e, t) {
			n.setBackground({
				...n.backgroundState,
				[t]: {
					...n.backgroundState[t],
					...e
				}
			});
		}
		return (t, r) => (D(), o("div", vs, [
			s("div", ys, [
				s("button", {
					class: "btn btn-sm",
					onClick: r[0] ||= (e) => I(n).createPage()
				}, " + Nouvelle "),
				s("button", {
					class: "btn btn-sm btn-danger",
					title: "Nouveau document vierge",
					onClick: r[1] ||= (e) => v()
				}, " Nouveau "),
				s("button", {
					class: "btn btn-sm",
					title: "Gérer toutes les pages",
					onClick: r[2] ||= (e) => _.value = !0
				}, " Pages… ")
			]),
			l(_s, {
				open: _.value,
				onClose: r[3] ||= (e) => _.value = !1
			}, null, 8, ["open"]),
			s("div", bs, [r[26] ||= s("span", { class: "sec-label" }, "Titre", -1), s("input", {
				class: "title-input",
				type: "text",
				placeholder: "Sans titre",
				value: I(n).title,
				onInput: r[4] ||= (e) => I(n).setTitle(e.target.value)
			}, null, 40, xs)]),
			s("div", Ss, [r[27] ||= s("span", { class: "sec-label" }, "Fond", -1), s("div", Cs, [(D(), o(e, null, A([
				"none",
				"ruled",
				"grid",
				"hex"
			], (e) => s("button", {
				key: e,
				class: x(["btn btn-sm btn-opt", { "btn-active": I(n).backgroundState.mode === e }]),
				onClick: (t) => I(n).setBackground({
					...I(n).backgroundState,
					mode: e
				})
			}, N(C[e]), 11, ws)), 64))])]),
			I(n).backgroundState.mode === "grid" ? (D(), o(e, { key: 0 }, [
				s("div", Ts, [
					r[28] ||= s("span", { class: "sec-label" }, "Cellule", -1),
					s("input", {
						type: "range",
						min: "20",
						max: "200",
						step: "5",
						class: "opt-slider",
						value: I(n).backgroundState.grid?.size ?? 80,
						onInput: r[5] ||= (e) => M({ size: +e.target.value }, "grid")
					}, null, 40, Es),
					s("span", Ds, N(I(n).backgroundState.grid?.size ?? 80) + "px", 1)
				]),
				s("div", Os, [
					r[29] ||= s("span", { class: "sec-label" }, "Trait", -1),
					s("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: I(n).backgroundState.grid?.lineWidth ?? 1,
						onInput: r[6] ||= (e) => M({ lineWidth: +e.target.value }, "grid")
					}, null, 40, ks),
					s("span", As, N(I(n).backgroundState.grid?.lineWidth ?? 1), 1)
				]),
				s("div", js, [r[30] ||= s("span", { class: "sec-label" }, "Couleur", -1), s("div", Ms, [(D(!0), o(e, null, A(I(w), (e) => (D(), o("button", {
					key: e.value,
					class: x(["color-swatch", { active: (I(n).backgroundState.grid?.color ?? "#777777") === e.value }]),
					style: S({ background: e.value }),
					title: e.label,
					onClick: (t) => M({ color: e.value }, "grid")
				}, null, 14, Ns))), 128)), s("input", {
					type: "color",
					class: "color-pick",
					value: I(n).backgroundState.grid?.color ?? "#777777",
					onInput: r[7] ||= (e) => M({ color: e.target.value }, "grid")
				}, null, 40, Ps)])])
			], 64)) : a("", !0),
			I(n).backgroundState.mode === "ruled" ? (D(), o(e, { key: 1 }, [
				s("div", Fs, [
					r[31] ||= s("span", { class: "sec-label" }, "Lignes", -1),
					s("input", {
						type: "range",
						min: "10",
						max: "100",
						step: "5",
						class: "opt-slider",
						value: I(n).backgroundState.ruled?.spacing ?? 40,
						onInput: r[8] ||= (e) => M({ spacing: +e.target.value }, "ruled")
					}, null, 40, Is),
					s("span", Ls, N(I(n).backgroundState.ruled?.spacing ?? 40) + "px", 1)
				]),
				s("div", Rs, [
					r[32] ||= s("span", { class: "sec-label" }, "Trait", -1),
					s("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: I(n).backgroundState.ruled?.lineWidth ?? 1,
						onInput: r[9] ||= (e) => M({ lineWidth: +e.target.value }, "ruled")
					}, null, 40, zs),
					s("span", Bs, N(I(n).backgroundState.ruled?.lineWidth ?? 1), 1)
				]),
				s("div", Vs, [r[33] ||= s("span", { class: "sec-label" }, "Couleur", -1), s("div", Hs, [(D(!0), o(e, null, A(I(w), (e) => (D(), o("button", {
					key: e.value,
					class: x(["color-swatch", { active: (I(n).backgroundState.ruled?.color ?? "#777777") === e.value }]),
					style: S({ background: e.value }),
					title: e.label,
					onClick: (t) => M({ color: e.value }, "ruled")
				}, null, 14, Us))), 128)), s("input", {
					type: "color",
					class: "color-pick",
					value: I(n).backgroundState.ruled?.color ?? "#777777",
					onInput: r[10] ||= (e) => M({ color: e.target.value }, "ruled")
				}, null, 40, Ws)])])
			], 64)) : a("", !0),
			I(n).backgroundState.mode === "hex" ? (D(), o(e, { key: 2 }, [
				s("div", Gs, [r[34] ||= s("span", { class: "sec-label" }, "Orient.", -1), s("div", Ks, [s("button", {
					class: x(["btn btn-sm btn-opt", { "btn-active": (I(n).backgroundState.hex?.orientation ?? "pointy") === "pointy" }]),
					onClick: r[11] ||= (e) => M({ orientation: "pointy" }, "hex")
				}, " sommet ", 2), s("button", {
					class: x(["btn btn-sm btn-opt", { "btn-active": (I(n).backgroundState.hex?.orientation ?? "pointy") === "flat" }]),
					onClick: r[12] ||= (e) => M({ orientation: "flat" }, "hex")
				}, " arête ", 2)])]),
				s("div", qs, [
					r[35] ||= s("span", { class: "sec-label" }, "Côté", -1),
					s("input", {
						type: "range",
						min: "10",
						max: "150",
						step: "5",
						class: "opt-slider",
						value: I(n).backgroundState.hex?.size ?? 40,
						onInput: r[13] ||= (e) => M({ size: +e.target.value }, "hex")
					}, null, 40, Js),
					s("span", Ys, N(I(n).backgroundState.hex?.size ?? 40) + "px", 1)
				]),
				s("div", Xs, [
					r[36] ||= s("span", { class: "sec-label" }, "Trait", -1),
					s("input", {
						type: "range",
						min: "0.5",
						max: "3",
						step: "0.5",
						class: "opt-slider",
						value: I(n).backgroundState.hex?.lineWidth ?? 1,
						onInput: r[14] ||= (e) => M({ lineWidth: +e.target.value }, "hex")
					}, null, 40, Zs),
					s("span", Qs, N(I(n).backgroundState.hex?.lineWidth ?? 1), 1)
				]),
				s("div", $s, [r[37] ||= s("span", { class: "sec-label" }, "Couleur", -1), s("div", ec, [(D(!0), o(e, null, A(I(w), (e) => (D(), o("button", {
					key: e.value,
					class: x(["color-swatch", { active: (I(n).backgroundState.hex?.color ?? "#777777") === e.value }]),
					style: S({ background: e.value }),
					title: e.label,
					onClick: (t) => M({ color: e.value }, "hex")
				}, null, 14, tc))), 128)), s("input", {
					type: "color",
					class: "color-pick",
					value: I(n).backgroundState.hex?.color ?? "#777777",
					onInput: r[15] ||= (e) => M({ color: e.target.value }, "hex")
				}, null, 40, nc)])])
			], 64)) : a("", !0),
			s("div", rc, [
				r[38] ||= s("span", { class: "sec-label" }, "PDF", -1),
				s("div", ic, [s("button", {
					class: "btn btn-sm",
					disabled: I(i).isRendering,
					title: "Importer un PDF et créer une page par feuille",
					onClick: r[16] ||= (e) => u.value?.click()
				}, N(I(i).isRendering ? "Chargement…" : "Importer"), 9, ac), d.value?.pdfId ? (D(), o("button", {
					key: 0,
					class: "btn btn-sm btn-danger",
					title: "Détacher le PDF de cette page",
					onClick: m
				}, " Détacher ")) : a("", !0)]),
				s("input", {
					ref_key: "pdfFileInput",
					ref: u,
					type: "file",
					accept: "application/pdf",
					style: { display: "none" },
					onChange: p
				}, null, 544)
			]),
			d.value?.pdfId ? (D(), o("div", oc, [r[39] ||= s("span", { class: "sec-label" }, "Fichier", -1), s("span", sc, [c(N(f.value[d.value.pdfId] ?? d.value.pdfId) + " ", 1), d.value.pdfPageIndex === void 0 ? a("", !0) : (D(), o(e, { key: 0 }, [c(" (p.\xA0" + N(d.value.pdfPageIndex + 1) + ") ", 1)], 64))])])) : a("", !0),
			s("div", cc, [
				r[40] ||= s("span", { class: "sec-label" }, "Snap", -1),
				s("button", {
					class: x(["btn btn-sm btn-opt snap-toggle", { "btn-active": T.value }]),
					onClick: O
				}, " Grille ", 2),
				I(n).backgroundState.mode === "grid" ? (D(), o("span", lc, "lié")) : a("", !0)
			]),
			T.value && I(n).backgroundState.mode !== "grid" ? (D(), o("div", uc, [
				r[41] ||= s("span", { class: "sec-label" }, "Pas", -1),
				s("input", {
					type: "range",
					min: "10",
					max: "200",
					step: "5",
					class: "opt-slider",
					value: E.value,
					onInput: r[17] ||= (e) => j(+e.target.value)
				}, null, 40, dc),
				s("span", fc, N(E.value) + "px", 1)
			])) : a("", !0),
			T.value && I(n).backgroundState.mode === "grid" ? (D(), o("div", pc, [r[42] ||= s("span", { class: "sec-label" }, "Pas", -1), s("span", mc, N(E.value) + "px (fond)", 1)])) : a("", !0),
			s("div", hc, [
				s("button", {
					class: "btn btn-sm",
					title: "Enregistrer en JSON",
					onClick: r[18] ||= (e) => I(n).exportJSON()
				}, " Enregistrer "),
				s("button", {
					class: "btn btn-sm",
					title: "Charger un fichier .pinote.json",
					onClick: r[19] ||= (e) => h.value?.click()
				}, " Charger "),
				s("input", {
					ref_key: "fileInput",
					ref: h,
					type: "file",
					accept: ".json,.pinote.json",
					style: { display: "none" },
					onChange: g
				}, null, 544)
			]),
			s("div", gc, [
				s("button", {
					class: "btn btn-sm",
					title: "Export résolution écran",
					onClick: r[20] ||= (e) => I(n).exportPNG("screen")
				}, " PNG "),
				s("button", {
					class: "btn btn-sm",
					title: "A4 orientation automatique",
					onClick: r[21] ||= (e) => I(n).exportPNG("a4-auto")
				}, " A4 auto "),
				s("button", {
					class: "btn btn-sm",
					title: "A4 portrait",
					onClick: r[22] ||= (e) => I(n).exportPNG("a4-portrait")
				}, " A4 ↕ "),
				s("button", {
					class: "btn btn-sm",
					title: "A4 paysage",
					onClick: r[23] ||= (e) => I(n).exportPNG("a4-landscape")
				}, " A4 ↔ ")
			]),
			s("div", _c, [r[43] ||= s("span", { class: "sec-label" }, "Sync", -1), s("input", {
				class: "title-input",
				type: "url",
				placeholder: "https://…",
				value: y.value,
				onInput: r[24] ||= (e) => y.value = e.target.value
			}, null, 40, vc)]),
			y.value ? (D(), o("div", yc, [s("button", {
				class: x(["btn btn-sm", { "btn-active": I(n).syncStatus === "ok" }]),
				disabled: I(n).syncStatus === "syncing",
				onClick: r[25] ||= (e) => I(n).syncRemote()
			}, N(b.value), 11, bc)])) : a("", !0)
		]));
	}
}), Sc = { class: "sp-root" }, Cc = { class: "sp-body" }, wc = { key: 0 }, Tc = {
	key: 1,
	class: "sp-divider"
}, Ec = { key: 2 }, Dc = { class: "sp-row-gap" }, Oc = { class: "sp-row-gap" }, kc = { class: "sp-row-gap" }, Ac = { class: "sp-row" }, jc = { class: "sp-row" }, Mc = { class: "sp-row" }, Nc = { key: 0 }, Pc = { class: "sp-opacity-row" }, Fc = ["value"], Ic = { class: "sp-opacity-val" }, Lc = /* @__PURE__ */ u({
	__name: "ShapeProperties",
	props: { shape: {} },
	emits: ["update"],
	setup(t, { emit: n }) {
		let i = t, u = n, d = i.shape, f = k(d.color ?? "#000000"), p = k(d.width ?? 2), m = k(d.layer ?? "MAIN"), h = k(d.lineStyle ?? "solid"), g = k(d.arrowStart ?? !1), _ = k(d.arrowEnd ?? !1), v = k(d.arrowStyle ?? "filled"), y = k(d.bezier ?? !0), b = k(d.closed ?? !1), S = k(d.fill ?? !1), C = k(d.fillOpacity ?? .3);
		R(f, (e) => u("update", i.shape.id, { color: e })), R(p, (e) => u("update", i.shape.id, { width: e })), R(m, (e) => u("update", i.shape.id, { layer: e })), R(h, (e) => u("update", i.shape.id, { lineStyle: e })), R(g, (e) => u("update", i.shape.id, { arrowStart: e })), R(_, (e) => u("update", i.shape.id, { arrowEnd: e })), R(v, (e) => u("update", i.shape.id, { arrowStyle: e })), R(y, (e) => u("update", i.shape.id, { bezier: e })), R(b, (e) => u("update", i.shape.id, { closed: e })), R(S, (e) => u("update", i.shape.id, { fill: e })), R(C, (e) => u("update", i.shape.id, { fillOpacity: e }));
		let w = i.shape.tool, T = w !== "eraser", E = !["move", "select"].includes(w), O = ![
			"move",
			"select",
			"eraser"
		].includes(w), A = r(() => i.shape.canHaveArrows), j = r(() => i.shape.canBeFilled), M = w === "pen", P = w === "polygon", ee = r(() => g.value || _.value);
		return (t, n) => (D(), o("div", Sc, [s("div", Cc, [
			T ? (D(), o("section", wc, [n[14] ||= s("div", { class: "sp-label" }, " Couleur ", -1), l(Oo, {
				modelValue: f.value,
				"onUpdate:modelValue": n[0] ||= (e) => f.value = e,
				tool: I(w)
			}, null, 8, ["modelValue", "tool"])])) : a("", !0),
			T && E ? (D(), o("div", Tc)) : a("", !0),
			E ? (D(), o("section", Ec, [n[15] ||= s("div", { class: "sp-label" }, " Épaisseur ", -1), l(Fo, {
				modelValue: p.value,
				"onUpdate:modelValue": n[1] ||= (e) => p.value = e,
				tool: I(w),
				color: f.value,
				"show-slider": !0
			}, null, 8, [
				"modelValue",
				"tool",
				"color"
			])])) : a("", !0),
			n[34] ||= s("div", { class: "sp-divider" }, null, -1),
			s("section", null, [n[16] ||= s("div", { class: "sp-label" }, " Calque ", -1), l(Ro, {
				modelValue: m.value,
				"onUpdate:modelValue": n[2] ||= (e) => m.value = e,
				"show-null": !1
			}, null, 8, ["modelValue"])]),
			O ? (D(), o(e, { key: 3 }, [n[18] ||= s("div", { class: "sp-divider" }, null, -1), s("section", null, [n[17] ||= s("div", { class: "sp-label" }, " Trait ", -1), s("div", Dc, [
				s("button", {
					class: x(["btn btn-sm btn-toggle", { "btn-active": h.value === "solid" }]),
					onClick: n[3] ||= (e) => h.value = "solid"
				}, " plein ", 2),
				s("button", {
					class: x(["btn btn-sm btn-toggle", { "btn-active": h.value === "dashed" }]),
					onClick: n[4] ||= (e) => h.value = "dashed"
				}, " tirets ", 2),
				s("button", {
					class: x(["btn btn-sm btn-toggle", { "btn-active": h.value === "dotted" }]),
					onClick: n[5] ||= (e) => h.value = "dotted"
				}, " points ", 2)
			])])], 64)) : a("", !0),
			A.value ? (D(), o(e, { key: 4 }, [
				n[26] ||= s("div", { class: "sp-divider" }, null, -1),
				s("section", null, [n[21] ||= s("div", { class: "sp-label" }, " Flèche ", -1), s("div", Oc, [s("button", {
					class: x(["btn btn-sm btn-toggle", { "btn-active": g.value }]),
					onClick: n[6] ||= (e) => g.value = !g.value
				}, [l($, { icon: "arrow-left" }), n[19] ||= c(" départ ", -1)], 2), s("button", {
					class: x(["btn btn-sm btn-toggle", { "btn-active": _.value }]),
					onClick: n[7] ||= (e) => _.value = !_.value
				}, [n[20] ||= c(" arrivée ", -1), l($, { icon: "arrow-right" })], 2)])]),
				ee.value ? (D(), o(e, { key: 0 }, [n[25] ||= s("div", { class: "sp-divider" }, null, -1), s("section", null, [n[24] ||= s("div", { class: "sp-label" }, " Style ", -1), s("div", kc, [s("button", {
					class: x(["sp-toggle", { active: v.value === "filled" }]),
					onClick: n[8] ||= (e) => v.value = "filled"
				}, [l($, { icon: "play" }), n[22] ||= c(" plein ", -1)], 2), s("button", {
					class: x(["sp-toggle", { active: v.value === "open" }]),
					onClick: n[9] ||= (e) => v.value = "open"
				}, [l($, { icon: "angle-right" }), n[23] ||= c(" ouvert ", -1)], 2)])])], 64)) : a("", !0)
			], 64)) : a("", !0),
			M ? (D(), o(e, { key: 5 }, [n[28] ||= s("div", { class: "sp-divider" }, null, -1), s("section", Ac, [n[27] ||= s("span", { class: "sp-label" }, "Lissage", -1), s("button", {
				class: x(["sp-toggle", { active: y.value }]),
				onClick: n[10] ||= (e) => y.value = !y.value
			}, N(y.value ? "oui" : "non"), 3)])], 64)) : a("", !0),
			P ? (D(), o(e, { key: 6 }, [n[30] ||= s("div", { class: "sp-divider" }, null, -1), s("section", jc, [n[29] ||= s("span", { class: "sp-label" }, "Fermé", -1), s("button", {
				class: x(["sp-toggle", { active: b.value }]),
				onClick: n[11] ||= (e) => b.value = !b.value
			}, N(b.value ? "oui" : "non"), 3)])], 64)) : a("", !0),
			j.value ? (D(), o(e, { key: 7 }, [
				n[33] ||= s("div", { class: "sp-divider" }, null, -1),
				s("section", Mc, [n[31] ||= s("span", { class: "sp-label" }, "Remplissage", -1), s("button", {
					class: x(["sp-toggle", { active: S.value }]),
					onClick: n[12] ||= (e) => S.value = !S.value
				}, N(S.value ? "oui" : "non"), 3)]),
				S.value ? (D(), o("section", Nc, [n[32] ||= s("div", { class: "sp-label" }, " Opacité ", -1), s("div", Pc, [s("input", {
					type: "range",
					min: "0.05",
					max: "1",
					step: "0.05",
					value: C.value,
					class: "sp-slider",
					onInput: n[13] ||= (e) => C.value = parseFloat(e.target.value)
				}, null, 40, Fc), s("span", Ic, N(Math.round(C.value * 100)) + "%", 1)])])) : a("", !0)
			], 64)) : a("", !0)
		])]));
	}
}), Rc = { class: "props-body" }, zc = {
	key: 0,
	class: "msg-empty"
}, Bc = /* @__PURE__ */ u({
	__name: "SidebarPanelProperties",
	setup(e) {
		let t = Q(), n = r(() => t.tool.tool === "select" && t.selectedShapeId ? t.engine?.getShapeById(t.selectedShapeId) ?? null : null);
		return (e, r) => (D(), o("div", Rc, [n.value ? (D(), i(Lc, {
			key: I(t).selectedShapeId ?? "",
			shape: n.value,
			onUpdate: r[0] ||= (e, n) => I(t).updateShapeProps(e, n)
		}, null, 8, ["shape"])) : (D(), o("div", zc, " Aucune forme sélectionnée "))]));
	}
}), Vc = { class: "zoom-row" }, Hc = /* @__PURE__ */ u({
	__name: "SidebarPanelZoom",
	setup(e) {
		let t = Q();
		return (e, n) => (D(), o("div", Vc, [
			s("button", {
				class: "btn",
				title: "Zoom +",
				onClick: n[0] ||= (e) => I(t).zoomIn()
			}, [l($, { icon: "magnifying-glass-plus" })]),
			s("button", {
				class: "btn",
				title: "Zoom −",
				onClick: n[1] ||= (e) => I(t).zoomOut()
			}, [l($, { icon: "magnifying-glass-minus" })]),
			s("button", {
				class: "btn",
				title: "Tout afficher",
				onClick: n[2] ||= (e) => I(t).fitView()
			}, [l($, { icon: "expand" })]),
			s("button", {
				class: "btn",
				title: "Réinitialiser",
				onClick: n[3] ||= (e) => I(t).resetView()
			}, [l($, { icon: "compress" })])
		]));
	}
}), Uc = { class: "history-body" }, Wc = ["onClick"], Gc = ["value", "onInput"], Kc = {
	key: 1,
	style: { flex: "1" }
}, qc = ["title", "onClick"], Jc = ["onClick"], Yc = /* @__PURE__ */ u({
	__name: "SidebarPanelLayers",
	setup(t) {
		let n = Q(), r = ho(), i = {
			BACKGROUND: "Fond",
			REFERENCE: "Référence",
			OVERLAY: "Grille",
			MAIN: "Principal",
			LAYER: "Calque"
		}, c = ["MAIN", "LAYER"], u = [
			"REFERENCE",
			"BACKGROUND",
			"MAIN",
			"LAYER"
		], d = O({
			BACKGROUND: !0,
			REFERENCE: !0,
			OVERLAY: !0,
			MAIN: !0,
			LAYER: !0
		}), f = O({
			BACKGROUND: 1,
			REFERENCE: 1,
			OVERLAY: 1,
			MAIN: 1,
			LAYER: 1
		});
		ie(() => {
			let e = n.engine;
			if (e) for (let t of [
				"BACKGROUND",
				"REFERENCE",
				"OVERLAY",
				"MAIN",
				"LAYER"
			]) d[t] = e.getLayer(t).visible, f[t] = e.getLayer(t).opacity;
		});
		function p(e) {
			n.engine?.setLayerVisibility(e, !d[e]), d[e] = !d[e];
		}
		function m(e, t) {
			f[e] = t, n.engine?.setLayerOpacity(e, t);
		}
		function h(e) {
			e === "REFERENCE" ? r.clearReference() : n.engine?.clearLayer(e);
		}
		function g(e) {
			n.tool.layer = e;
		}
		let _ = k(n.pages.find((e) => e.id === n.currentPageId));
		ie(() => {
			_.value = n.pages.find((e) => e.id === n.currentPageId);
		});
		let v = k(!1);
		return ie(() => {
			v.value = !!_.value?.pdfId;
		}), (t, r) => (D(), o("div", Uc, [(D(), o(e, null, A(u, (t) => s("div", {
			key: t,
			class: x(["h-row", { active: I(n).tool.layer === t }]),
			style: S(c.includes(t) ? { cursor: "pointer" } : {}),
			onClick: (e) => c.includes(t) && g(t)
		}, [
			s("span", { class: x(["h-label", { hidden: !d[t] }]) }, N(i[t]), 3),
			t === "REFERENCE" ? (D(), o(e, { key: 0 }, [v.value ? (D(), o("input", {
				key: 0,
				type: "range",
				min: "0",
				max: "1",
				step: "0.05",
				value: f[t],
				class: "opt-slider",
				title: "Opacité",
				onInput: (e) => m(t, +e.target.value),
				onClick: r[0] ||= z(() => {}, ["stop"])
			}, null, 40, Gc)) : (D(), o("span", Kc))], 64)) : a("", !0),
			s("button", {
				class: "btn-icon",
				title: d[t] ? "Cacher" : "Afficher",
				onClick: z((e) => p(t), ["stop"])
			}, [l($, { icon: d[t] ? "eye" : "eye-slash" }, null, 8, ["icon"])], 8, qc),
			s("button", {
				class: "btn-icon del",
				title: "Effacer le calque",
				style: S(t === "BACKGROUND" || t === "REFERENCE" && !v.value ? { visibility: "hidden" } : {}),
				onClick: z((e) => h(t), ["stop"])
			}, [l($, { icon: "trash-can" })], 12, Jc)
		], 14, Wc)), 64))]));
	}
}), Xc = { class: "sidebar" }, Zc = { class: "sidebar-topbar" }, Qc = { class: "sidebar-topbar-panel" }, $c = { class: "undo-redo" }, el = ["disabled"], tl = ["disabled"], nl = { class: "sec sec-history" }, rl = { class: "sec-header-row" }, il = { class: "sec" }, al = { class: "sec" }, ol = { class: "sec sec-props" }, sl = { class: "sec-zoom" }, cl = { class: "sec-row" }, ll = /* @__PURE__ */ u({
	__name: "NoteSidebar",
	setup(e) {
		let t = Q(), n = k(!0), r = k(!1), i = k(!0), a = k(!0);
		return R(() => t.selectedShapeId, (e) => {
			e && (i.value = !0);
		}), (e, c) => (D(), o("div", Xc, [
			s("div", Zc, [c[7] ||= s("span", { class: "sidebar-title" }, "PiNote", -1), s("div", Qc, [s("div", $c, [s("button", {
				class: "btn",
				disabled: !I(t).canUndo,
				title: "Annuler",
				onClick: c[0] ||= (e) => I(t).undo()
			}, [l($, { icon: "rotate-left" })], 8, el), s("button", {
				class: "btn",
				disabled: !I(t).canRedo,
				title: "Rétablir",
				onClick: c[1] ||= (e) => I(t).redo()
			}, [l($, { icon: "rotate-right" })], 8, tl)]), s("button", {
				class: "close-btn",
				title: "Fermer le panneau",
				onClick: c[2] ||= (e) => I(t).sidebarOpen = !1
			}, [l($, { icon: "chevron-right" })])])]),
			s("div", nl, [s("div", rl, [s("button", {
				class: "sec-header-btn",
				onClick: c[3] ||= (e) => n.value = !n.value
			}, [c[8] ||= s("span", { class: "sec-title" }, "Historique", -1), s("span", { class: x(["chevron", { open: n.value }]) }, [l($, { icon: "chevron-right" })], 2)])]), oe(l(Zo, null, null, 512), [[re, n.value]])]),
			s("div", il, [s("button", {
				class: "sec-header",
				onClick: c[4] ||= (e) => r.value = !r.value
			}, [c[9] ||= s("span", { class: "sec-title" }, "Canvas", -1), s("span", { class: x(["chevron", { open: r.value }]) }, [l($, { icon: "chevron-right" })], 2)]), oe(l(xc, null, null, 512), [[re, r.value]])]),
			s("div", al, [s("button", {
				class: "sec-header",
				onClick: c[5] ||= (e) => a.value = !a.value
			}, [c[10] ||= s("span", { class: "sec-title" }, "Calques", -1), s("span", { class: x(["chevron", { open: a.value }]) }, [l($, { icon: "chevron-right" })], 2)]), oe(l(Yc, null, null, 512), [[re, a.value]])]),
			s("div", ol, [s("button", {
				class: "sec-header",
				onClick: c[6] ||= (e) => i.value = !i.value
			}, [c[11] ||= s("span", { class: "sec-title" }, "Propriétés", -1), s("span", { class: x(["chevron", { open: i.value }]) }, [l($, { icon: "chevron-right" })], 2)]), oe(l(Bc, null, null, 512), [[re, i.value]])]),
			s("div", sl, [s("div", cl, [c[12] ||= s("span", { class: "sec-label" }, "Zoom", -1), l(Hc)])])
		]));
	}
}), ul = {
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
}, dl = {
	key: 0,
	class: "tool-hint"
}, fl = /* @__PURE__ */ u({
	__name: "ToolHint",
	setup(e) {
		let t = Q(), n = k(!1), r = k(""), i = null;
		return R(() => t.toolSelectCount, () => {
			r.value = ul[t.tool.tool] ?? "", r.value && (n.value = !0, i && clearTimeout(i), i = setTimeout(() => {
				n.value = !1;
			}, 3e3));
		}), (e, t) => n.value ? (D(), o("div", dl, N(r.value), 1)) : a("", !0);
	}
});
//#endregion
//#region src/composables/useCanvasTransform.ts
function pl(e, t = {}) {
	let { panButton: n = 0, onTransformChange: i, canPan: a } = t, o = .1, s = .15, c = j({
		x: 0,
		y: 0,
		scale: 1
	}), l = r(() => `translate(${c.x}px, ${c.y}px) scale(${c.scale})`);
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
		e.button === n && (_ = !0, v = {
			x: e.clientX - c.x,
			y: e.clientY - c.y
		});
	}
	function b(e) {
		_ && (c.x = e.clientX - v.x, c.y = e.clientY - v.y, u());
	}
	function x() {
		_ = !1;
	}
	function S(t) {
		t.preventDefault();
		let n = e.value.getBoundingClientRect(), r = t.deltaY < 0 ? 1 + s : 1 - s;
		f(t.clientX - n.left, t.clientY - n.top, r);
	}
	let C = [], T = 0;
	function D(e) {
		let t = [];
		for (let n of Array.from(e)) t.push({
			x: n.clientX,
			y: n.clientY
		});
		return t;
	}
	function O(e, t) {
		return Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
	}
	function k(e) {
		e.preventDefault(), C = D(e.touches), e.touches.length === 2 && (T = O(C[0], C[1]));
	}
	function A(t) {
		t.preventDefault();
		let n = D(t.touches), r = e.value.getBoundingClientRect();
		if (n.length === 1 && C.length >= 1 && (!a || a())) c.x += n[0].x - C[0].x, c.y += n[0].y - C[0].y, u();
		else if (n.length === 2 && C.length === 2) {
			let e = O(n[0], n[1]), t = e / T, i = (n[0].x + n[1].x) / 2 - r.left, a = (n[0].y + n[1].y) / 2 - r.top, s = (C[0].x + C[1].x) / 2 - r.left, l = (C[0].y + C[1].y) / 2 - r.top, f = d(c.scale * t, o, 10), p = f / c.scale;
			c.x = i - (i - c.x) * p + (i - s), c.y = a - (a - c.y) * p + (a - l), c.scale = f, T = e, u();
		}
		C = n;
	}
	function M(e) {
		C = D(e.touches), T = C.length === 2 ? O(C[0], C[1]) : 0;
	}
	return w(() => {
		let t = e.value;
		t.addEventListener("mousedown", y), t.addEventListener("mousemove", b), t.addEventListener("mouseup", x), t.addEventListener("mouseleave", x), t.addEventListener("touchstart", k, { passive: !1 }), t.addEventListener("touchmove", A, { passive: !1 }), t.addEventListener("touchend", M), t.addEventListener("wheel", S, { passive: !1 });
	}), E(() => {
		let t = e.value;
		t && (t.removeEventListener("mousedown", y), t.removeEventListener("mousemove", b), t.removeEventListener("mouseup", x), t.removeEventListener("mouseleave", x), t.removeEventListener("touchstart", k), t.removeEventListener("touchmove", A), t.removeEventListener("touchend", M), t.removeEventListener("wheel", S));
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
var ml = { class: "note-canvas-wrapper" }, hl = {
	key: 0,
	class: "mini-panel"
}, gl = { class: "mini-panel-row" }, _l = ["disabled"], vl = ["disabled"], yl = /* @__PURE__ */ u({
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
	setup(e, { expose: t, emit: r }) {
		Ri() || Li(Ea());
		let i = Q(), c = r, u = e, d = k(null), { transform: f, zoomIn: p, zoomOut: m, resetView: h, fitView: g } = pl(d, {
			panButton: 2,
			onTransformChange: () => {
				i.engine?.setViewTransform(f.x, f.y, f.scale), i.engine?.draw();
			},
			canPan: () => i.tool.tool === "move"
		}), _ = M(void 0), v = null, y = !1, b = 0, S = !1, C = 0, T = !1, O = !1, A = !1, j = !1, N = {
			x: 0,
			y: 0
		}, P = !1, ee = {
			x: 0,
			y: 0
		};
		function F(e) {
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
		function L(e) {
			if (!e.isPrimary || e.button !== 0 || !d.value || !_.value) return;
			if (i.tool.tool === "move") {
				P = !0, ee = {
					x: e.clientX - f.x,
					y: e.clientY - f.y
				};
				return;
			}
			let t = F(e);
			if (i.selectedShapeId) {
				if (_.value.isOverDeleteHandle(t.x, t.y)) {
					i.destroyShape(i.selectedShapeId);
					return;
				}
				if (_.value.isOverDuplicateHandle(t.x, t.y)) {
					j = !0;
					return;
				}
				if (_.value.isOverMoveHandle(t.x, t.y)) {
					A = !0, N = t;
					return;
				}
			}
			if (i.tool.tool === "select") {
				let e = _.value.findShapeAt(t.x, t.y);
				e && e === i.selectedShapeId ? (A = !0, N = t) : e ? i.highlightShape(e) : i.highlightShape(null);
				return;
			}
			if (O && v) {
				O = !1, y = !0, b = Date.now();
				return;
			}
			if (S && v) {
				let e = Date.now(), n = v.doubleClickTimeout !== void 0 && e - C < v.doubleClickTimeout;
				C = e, n || _.value.handleDrawClick(t.x, t.y) === "done" ? (_.value.endShape(), S = !1, v = null, i.syncFromEngine()) : _.value.updateShape(t.x, t.y);
				return;
			}
			b = Date.now(), v = _.value.startShape({
				layer: i.tool.layer,
				color: i.tool.color ?? "black",
				width: i.tool.width ?? 2,
				tool: i.tool.tool,
				createdAt: b,
				x: t.x,
				y: t.y,
				rectMode: i.tool.rectMode
			});
			let n = v.drawingMode ?? "drag";
			n === "two-phase" ? T = !0 : n === "multi-click" ? (S = !0, C = Date.now()) : y = !0, v.onDrawPoint?.(t.x, t.y, 0);
		}
		function te(e) {
			if (!e.isPrimary) return;
			if (P) {
				f.x = e.clientX - ee.x, f.y = e.clientY - ee.y, _.value?.setViewTransform(f.x, f.y, f.scale), _.value?.draw();
				return;
			}
			if (A && i.selectedShapeId) {
				let t = F(e);
				_.value?.moveShape(i.selectedShapeId, t.x - N.x, t.y - N.y), N = t;
				return;
			}
			if (d.value) {
				let t = F(e);
				i.selectedShapeId && _.value?.isOverMoveHandle(t.x, t.y) ? d.value.style.cursor = "grab" : i.selectedShapeId && _.value?.isOverDeleteHandle(t.x, t.y) ? d.value.style.cursor = "not-allowed" : i.selectedShapeId && _.value?.isOverDuplicateHandle(t.x, t.y) ? d.value.style.cursor = "copy" : i.tool.tool === "select" ? d.value.style.cursor = _.value?.findShapeAt(t.x, t.y) ? "pointer" : "" : d.value.style.cursor = "";
			}
			if (T || O || S) {
				_.value?.updateShape(F(e).x, F(e).y);
				return;
			}
			if (!y || !v) {
				let t = F(e);
				_.value?.hoverSnap(t.x, t.y, i.tool.tool);
				return;
			}
			let t = F(e);
			v.onDrawPoint?.(t.x, t.y, Date.now() - b), _.value?.updateShape(t.x, t.y);
		}
		function ne(e) {
			if (e.isPrimary) {
				if (P) {
					P = !1;
					return;
				}
				if (j) {
					j = !1, i.selectedShapeId &&= _.value?.duplicateShape(i.selectedShapeId) ?? null, i.syncFromEngine();
					return;
				}
				if (A) {
					A = !1, d.value && (d.value.style.cursor = ""), _.value?.saveLocal(), i.syncFromEngine();
					return;
				}
				if (T && v) {
					let t = F(e);
					T = !1, _.value?.phaseTransition(t.x, t.y), O = !0;
					return;
				}
				if (!y) {
					_.value?.clearHoverSnap();
					return;
				}
				y = !1, v &&= (_.value?.endShape(), i.syncFromEngine(), null);
			}
		}
		return R(() => i.tool.bezier, (e) => {
			_.value && (_.value.bezier = e);
		}), R(() => i.tool.rectMode, () => {
			(T || O) && (_.value?.cancelShape(), T = !1, O = !1, y = !1, v = null);
		}), R(() => i.tool.tool, (e) => {
			(S || T || O) && (_.value?.cancelShape(), S = !1, T = !1, O = !1, v = null), e !== "select" && i.selectedShapeId && i.highlightShape(null);
		}), R(() => ({ ...i.tool }), (e) => {
			c("tool-change", e);
		}, { deep: !0 }), R(() => u.background, (e) => {
			i.setBackground(e), _.value?.setBackground(e);
		}, { deep: !0 }), R(() => u.snapGridSize, (e) => {
			i.snapGrid.size = e, _.value && (_.value.snapGridSize = e);
		}), R(() => u.snapGridEnabled, (e) => {
			i.snapGrid.enabled = e, _.value && (_.value.snapGridEnabled = e);
		}), w(() => {
			d.value && (d.value.addEventListener("touchstart", (e) => {
				e.touches.length >= 2 && (y || S || T || O) && (_.value?.cancelShape(), y = !1, S = !1, T = !1, O = !1, v = null);
			}, { passive: !0 }), _.value = new Oe(d.value, u.background), _.value.bezier = i.tool.bezier, _.value.snapGridEnabled = u.snapGridEnabled, _.value.snapGridSize = u.snapGridSize, i.engine = _.value, i.initSession(), i.title = _.value.title, i.backgroundState = _.value.backgroundState, i.snapGrid.enabled = u.snapGridEnabled, i.snapGrid.size = u.snapGridSize, i.layers = _.value.layers.map((e) => e.name), i.syncFromEngine(), i.registerZoom({
				zoomIn: p,
				zoomOut: m,
				resetView: h,
				fitView: () => {
					let e = _.value?.shapes ?? [], t = _.value?.referenceBitmap;
					if (t) {
						let n = { getBounds: () => ({
							minX: 0,
							minY: 0,
							maxX: t.width,
							maxY: t.height
						}) };
						g([...e, n]);
					} else g(e);
				}
			}));
		}), E(() => {
			_.value?.destroy();
		}), t({ engine: _ }), (e, t) => (D(), o("div", ml, [
			s("div", {
				ref_key: "canvasEl",
				ref: d,
				class: x(["note-canvas", {
					"cursor-grab": I(i).tool.tool === "move" && !I(P),
					"cursor-grabbing": I(i).tool.tool === "move" && I(P)
				}]),
				onPointerdown: z(L, ["prevent"]),
				onPointermove: z(te, ["prevent"]),
				onPointerup: z(ne, ["prevent"]),
				onPointerleave: z(ne, ["prevent"]),
				onPointercancel: ne,
				onContextmenu: t[0] ||= z(() => {}, ["prevent"])
			}, null, 34),
			l(fl),
			l(Go),
			l(n, { name: "mini" }, {
				default: ae(() => [I(i).sidebarOpen ? a("", !0) : (D(), o("div", hl, [s("div", gl, [s("button", {
					class: "btn",
					disabled: !I(i).canUndo,
					title: "Annuler",
					onClick: t[1] ||= (e) => I(i).undo()
				}, [l($, { icon: "rotate-left" })], 8, _l), s("button", {
					class: "btn",
					disabled: !I(i).canRedo,
					title: "Rétablir",
					onClick: t[2] ||= (e) => I(i).redo()
				}, [l($, { icon: "rotate-right" })], 8, vl)]), s("button", {
					class: "btn mini-open",
					title: "Ouvrir le panneau",
					onClick: t[3] ||= (e) => I(i).sidebarOpen = !0
				}, [l($, { icon: "chevron-left" })])]))]),
				_: 1
			}),
			s("div", { class: x(["sidebar-wrapper", { closed: !I(i).sidebarOpen }]) }, [l(ll)], 2)
		]));
	}
});
//#endregion
export { Oe as Engine, ce as Layer, yl as NoteCanvas, $ as PiIcon, oo as initPdfWorker };
