var F = Object.defineProperty;
var Q = (o, t, e) => t in o ? F(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var h = (o, t, e) => Q(o, typeof t != "symbol" ? t + "" : t, e);
import { defineComponent as C, useModel as V, openBlock as f, createElementBlock as m, Fragment as O, renderList as N, createElementVNode as _, normalizeClass as A, createCommentVNode as Z, useTemplateRef as ee, ref as L, normalizeStyle as B, withDirectives as te, vModelText as se, mergeModels as j, computed as J, toDisplayString as z, watch as M, createVNode as I, shallowRef as ie, reactive as re, onMounted as ne, onUnmounted as oe, withModifiers as R, isRef as ae, unref as le } from "vue";
class $ {
  constructor(t, e) {
    h(this, "name");
    h(this, "canvas");
    h(this, "ctx");
    h(this, "_visible", !0);
    h(this, "_opacity", 1);
    h(this, "_locked", !1);
    h(this, "_blendMode", "source-over");
    this.name = e.name;
    const s = document.createElement("canvas");
    s.dataset.layer = this.name, s.width = t.clientWidth, s.height = t.clientHeight, s.style.position = "absolute", s.style.top = "0", s.style.left = "0", s.style.zIndex = e.zIndex.toString(), s.style.pointerEvents = "none", s.style.backgroundColor = this.name === "BACKGROUND" ? "white" : "transparent", t.appendChild(s), this.canvas = s, this.ctx = s.getContext("2d"), this.resize(t);
  }
  // ----------------
  // resize
  // ----------------
  resize(t) {
    const e = t.getBoundingClientRect();
    this.canvas.width = e.width, this.canvas.height = e.height;
  }
  // ----------------
  // Visibility
  // ----------------
  set visible(t) {
    this._visible = t, this.canvas.style.display = t ? "block" : "none";
  }
  get visible() {
    return this._visible;
  }
  // ----------------
  // Opacity
  // ----------------
  set opacity(t) {
    this._opacity = Math.max(0, Math.min(1, t)), this.canvas.style.opacity = this._opacity.toString();
  }
  get opacity() {
    return this._opacity;
  }
  // ----------------
  // Lock
  // ----------------
  set locked(t) {
    this._locked = t;
  }
  get locked() {
    return this._locked;
  }
  // ----------------
  // Blend Mode
  // ----------------
  set blendMode(t) {
    this._blendMode = t, this.canvas.style.mixBlendMode = t;
  }
  get blendMode() {
    return this._blendMode;
  }
  // ----------------
  // Drawing helpers
  // ----------------
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  exportPNG() {
    return this.canvas.toDataURL("image/png");
  }
}
class he {
  constructor(t = 100) {
    h(this, "grid", /* @__PURE__ */ new Map());
    h(this, "cellSize");
    this.cellSize = t;
  }
  // calcule la clé de la cellule
  cellKey(t, e) {
    const s = Math.floor(t / this.cellSize), i = Math.floor(e / this.cellSize);
    return `${s},${i}`;
  }
  // ajoute un snap point
  insertSnapPoint(t) {
    const e = this.cellKey(t.x, t.y);
    this.grid.has(e) || this.grid.set(e, { snapPoints: [], segments: [], circles: [] }), this.grid.get(e).snapPoints.push(t);
  }
  // ajoute un segment (stocké dans toutes les cellules qu'il traverse)
  insertSegment(t) {
    const e = Math.min(t.a.x, t.b.x), s = Math.max(t.a.x, t.b.x), i = Math.min(t.a.y, t.b.y), r = Math.max(t.a.y, t.b.y), n = Math.floor(e / this.cellSize), a = Math.floor(s / this.cellSize), l = Math.floor(i / this.cellSize), y = Math.floor(r / this.cellSize);
    for (let d = n; d <= a; d++)
      for (let c = l; c <= y; c++) {
        const p = `${d},${c}`;
        this.grid.has(p) || this.grid.set(p, { snapPoints: [], segments: [], circles: [] }), this.grid.get(p).segments.push(t);
      }
  }
  insertCircle(t) {
    const e = this.cellKey(t.center.x, t.center.y);
    this.grid.has(e) || this.grid.set(e, { snapPoints: [], segments: [], circles: [] }), this.grid.get(e).circles.push(t);
  }
  // récupère les points/segments/circles proches d’une position
  query(t, e) {
    const s = this.cellKey(t, e), i = this.grid.get(s);
    return {
      snapPoints: (i == null ? void 0 : i.snapPoints) ?? [],
      segments: (i == null ? void 0 : i.segments) ?? [],
      circles: (i == null ? void 0 : i.circles) ?? []
    };
  }
  // clear index
  clear() {
    this.grid.clear();
  }
}
class ce {
  constructor(t) {
    h(this, "_name", "grid");
    h(this, "_enabled");
    h(this, "gridSize");
    h(this, "_priority");
    this._enabled = t.enabled ?? !0, this.gridSize = t.gridSize, this._priority = t.priority ?? 10;
  }
  snap(t) {
    if (!this._enabled) return null;
    const e = Math.round(t.x / this.gridSize) * this.gridSize, s = Math.round(t.y / this.gridSize) * this.gridSize;
    return { x: e, y: s, priority: this._priority, type: "point" };
  }
  get name() {
    return this._name;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(t) {
    this._enabled = t;
  }
  get priority() {
    return this._priority;
  }
  set priority(t) {
    this._priority = t;
  }
}
class de {
  constructor(t = 5) {
    h(this, "name", "midpoint");
    h(this, "enabled", !0);
    h(this, "priority");
    this.priority = t;
  }
  snap(t) {
    let e = t.snapRadius, s = null, i = null;
    const { segments: r } = t.index.query(t.x, t.y);
    for (const n of r) {
      if (t.activeLayer && n.layer !== t.activeLayer) continue;
      const a = (n.a.x + n.b.x) / 2, l = (n.a.y + n.b.y) / 2, y = t.x - a, d = t.y - l, c = Math.hypot(y, d);
      c <= e && (e = c, s = a, i = l);
    }
    return s !== null && i !== null ? { x: s, y: i, priority: this.priority, type: "midpoint" } : null;
  }
}
class ue {
  constructor(t = 20) {
    h(this, "name", "point");
    h(this, "enabled", !0);
    h(this, "priority");
    this.priority = t;
  }
  snap(t) {
    const { x: e, y: s, snapRadius: i, index: r, activeLayer: n } = t;
    let a = i, l = null, y = null;
    const { snapPoints: d } = r.query(e, s);
    for (const c of d) {
      if (n && c.layer !== n) continue;
      const p = e - c.x, v = s - c.y, b = Math.hypot(p, v);
      b <= a && (a = b, l = c.x, y = c.y);
    }
    return l !== null && y !== null ? {
      x: l,
      y,
      priority: this.priority,
      type: "point"
    } : null;
  }
}
class ye {
  constructor(t) {
    h(this, "strategies", []);
    h(this, "index", new he(100));
    // taille de cellule par défaut
    h(this, "_snapRadius");
    this._snapRadius = (t == null ? void 0 : t.snapRadius) ?? 10, this.addStrategies([
      new ce({ gridSize: (t == null ? void 0 : t.gridSize) ?? 30, priority: 10 }),
      new de(),
      new ue()
    ]);
  }
  // ajoute une stratégie de snap
  addStrategies(t) {
    t.forEach((e) => this.strategies.push(e)), this.strategies.sort((e, s) => s.priority - e.priority);
  }
  setStrategyEnabled(t, e) {
    const s = this.strategies.find((i) => i.name === t);
    s && (s.enabled = e);
  }
  // construit l'index spatial pour toutes les shapes
  buildIndex(t) {
    this.index.clear();
    for (const e of t)
      e.getSnapPoints().forEach((s) => this.index.insertSnapPoint(s)), e.getSegments().forEach((s) => this.index.insertSegment(s)), e.getCircles().forEach((s) => this.index.insertCircle(s));
  }
  get snapRadius() {
    return this._snapRadius;
  }
  set snapRadius(t) {
    this._snapRadius = t;
  }
  // calcule le snap pour une position (x,y)
  snap(t, e, s, i) {
    this.buildIndex(s);
    const r = {
      x: t,
      y: e,
      shapes: s,
      index: this.index,
      snapRadius: this._snapRadius,
      activeLayer: i
    };
    let n = null;
    for (const a of this.strategies) {
      if (!a.enabled) continue;
      const l = a.snap(r);
      l && (!n || (l.priority ?? 0) > (n.priority ?? 0)) && (n = l);
    }
    return n;
  }
  // supprime toutes les stratégies et l'index
  clear() {
    this.strategies = [], this.index.clear();
  }
  setGridSize(t) {
    const e = this.strategies.find((s) => s.name === "grid");
    e && (e.gridSize = t);
  }
}
class W {
  constructor(t = {}) {
    h(this, "id", `shape-${Math.random().toString(36).slice(2, 9)}`);
    h(this, "tool");
    h(this, "layer");
    h(this, "color");
    h(this, "width");
    h(this, "isIncremental", !1);
    h(this, "createdAt");
    this.id = t.id ?? "shape-" + Math.random().toString(36).slice(2, 9), this.createdAt = t.createdAt ?? Date.now(), this.tool = t.tool ?? "pen", this.layer = t.layer ?? null, this.color = t.color ?? "#000000", this.width = t.width ?? 2;
  }
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      tool: this.tool,
      layer: this.layer,
      color: this.color,
      width: this.width
    };
  }
}
class T extends W {
  constructor(e, s = {}) {
    super(s);
    h(this, "points", []);
    h(this, "bezier", !0);
    h(this, "isIncremental", !0);
    this.points = e.points ? e.points : [];
  }
  addPoint(e) {
    this.points.push(e);
  }
  update(e, s) {
    this.addPoint({ x: e, y: s, t: 0, pressure: 1 });
  }
  getPointsUntil(e) {
    return this.points.filter((s) => s.t <= e);
  }
  isEmpty() {
    return this.points.length === 0;
  }
  draw(e) {
    if (this.points.length < 2) return;
    e.save();
    let s = this.filterMinDistance(this.points, 1.2);
    switch (s = this.movingAverage(s, 3), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", e.lineJoin = "round", e.globalAlpha = 1, e.globalCompositeOperation = "source-over", this.tool) {
      case "pen":
        break;
      case "eraser":
        e.strokeStyle = "rgba(0,0,0,1)", e.globalCompositeOperation = "destination-out";
        break;
      case "highlighter":
        e.globalAlpha = 0.2;
        break;
    }
    if (e.beginPath(), !this.bezier || s.length < 4) {
      e.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) e.lineTo(s[i].x, s[i].y);
    } else {
      e.moveTo(s[0].x, s[0].y);
      for (let r = 0; r < s.length - 3; r++) {
        const n = s[r], a = s[r + 1], l = s[r + 2], y = s[r + 3], d = a.x + (l.x - n.x) / 6, c = a.y + (l.y - n.y) / 6, p = l.x - (y.x - a.x) / 6, v = l.y - (y.y - a.y) / 6;
        e.bezierCurveTo(d, c, p, v, l.x, l.y);
      }
      const i = s[s.length - 1];
      e.lineTo(i.x, i.y);
    }
    e.stroke(), e.restore();
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
  filterMinDistance(e, s = 1.5) {
    if (!e.length) return e;
    const i = [e[0]];
    let r = e[0];
    for (let n = 1; n < e.length; n++) {
      const a = e[n].x - r.x, l = e[n].y - r.y;
      a * a + l * l >= s * s && (i.push(e[n]), r = e[n]);
    }
    return i;
  }
  movingAverage(e, s = 3) {
    if (e.length < s) return e;
    const i = [];
    for (let r = 0; r < e.length; r++) {
      let n = 0, a = 0, l = 0;
      for (let y = -Math.floor(s / 2); y <= Math.floor(s / 2); y++) {
        const d = r + y;
        d >= 0 && d < e.length && (n += e[d].x, a += e[d].y, l++);
      }
      i.push({ x: n / l, y: a / l, t: e[r].t, pressure: e[r].pressure });
    }
    return i;
  }
  getSnapPoints() {
    if (!this.points.length) return [];
    const e = this.points[0], s = this.points[this.points.length - 1];
    return [
      { x: e.x, y: e.y, type: "endpoint", shapeId: this.id, layer: this.layer },
      { x: s.x, y: s.y, type: "endpoint", shapeId: this.id, layer: this.layer }
    ];
  }
  getSegments() {
    if (this.points.length < 2) return [];
    const e = [];
    for (let s = 0; s < this.points.length - 1; s++)
      e.push({ a: this.points[s], b: this.points[s + 1], layer: this.layer });
    return e;
  }
  getCircles() {
    return [];
  }
}
class pe extends W {
  constructor(e, s = {}) {
    super(s);
    h(this, "x1");
    h(this, "y1");
    h(this, "x2");
    h(this, "y2");
    const { x1: i, y1: r, x2: n, y2: a } = e;
    this.x1 = i, this.y1 = r, this.x2 = n, this.y2 = a;
  }
  draw(e) {
    e.save(), e.beginPath(), e.moveTo(this.x1, this.y1), e.lineTo(this.x2, this.y2), e.strokeStyle = this.color, e.lineWidth = this.width, e.lineCap = "round", e.stroke(), e.restore();
  }
  update(e, s) {
    this.x2 = e, this.y2 = s;
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
      { x: this.x1, y: this.y1, type: "endpoint", shapeId: this.id, layer: this.layer },
      { x: this.x2, y: this.y2, type: "endpoint", shapeId: this.id, layer: this.layer },
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
    return [{ a: { x: this.x1, y: this.y1 }, b: { x: this.x2, y: this.y2 }, layer: this.layer }];
  }
  getCircles() {
    return [];
  }
}
class ge extends W {
  constructor(e, s = {}) {
    super(s);
    h(this, "cx");
    h(this, "cy");
    h(this, "radius");
    const { cx: i, cy: r, radius: n } = e;
    this.cx = i, this.cy = r, this.radius = n;
  }
  draw(e) {
    e.save(), e.beginPath(), e.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2), e.strokeStyle = this.color, e.lineWidth = this.width, e.stroke(), e.restore();
  }
  update(e, s) {
    const i = e - this.cx, r = s - this.cy;
    this.radius = Math.hypot(i, r);
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
      { x: this.cx, y: this.cy, type: "center", shapeId: this.id, layer: this.layer },
      { x: this.cx + this.radius, y: this.cy, type: "circumference", shapeId: this.id, layer: this.layer },
      { x: this.cx - this.radius, y: this.cy, type: "circumference", shapeId: this.id, layer: this.layer },
      { x: this.cx, y: this.cy + this.radius, type: "circumference", shapeId: this.id, layer: this.layer },
      { x: this.cx, y: this.cy - this.radius, type: "circumference", shapeId: this.id, layer: this.layer }
    ];
  }
  getSegments() {
    return [];
  }
  getCircles() {
    return [{ center: { x: this.cx, y: this.cy }, radius: this.radius, layer: this.layer }];
  }
}
class ve extends W {
  constructor(e, s = {}) {
    super(s);
    h(this, "x");
    h(this, "y");
    h(this, "w");
    h(this, "h");
    const { x: i, y: r, w: n, h: a } = e;
    this.x = i, this.y = r, this.w = n, this.h = a;
  }
  draw(e) {
    e.save(), e.beginPath(), e.rect(this.x, this.y, this.w, this.h), e.strokeStyle = this.color, e.lineWidth = this.width, e.stroke(), e.restore();
  }
  update(e, s) {
    this.w = e - this.x, this.h = s - this.y;
  }
  toJSON() {
    return {
      config: {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h
      },
      options: super.toJSON()
    };
  }
  getSnapPoints() {
    const e = this.x + this.w, s = this.y + this.h, i = (this.x + e) / 2, r = (this.y + s) / 2;
    return [
      { x: this.x, y: this.y, type: "corner", shapeId: this.id, layer: this.layer },
      { x: e, y: this.y, type: "corner", shapeId: this.id, layer: this.layer },
      { x: e, y: s, type: "corner", shapeId: this.id, layer: this.layer },
      { x: this.x, y: s, type: "corner", shapeId: this.id, layer: this.layer },
      { x: i, y: r, type: "center", shapeId: this.id, layer: this.layer }
    ];
  }
  getSegments() {
    const e = this.x + this.w, s = this.y + this.h;
    return [
      { a: { x: this.x, y: this.y }, b: { x: e, y: this.y }, layer: this.layer },
      { a: { x: e, y: this.y }, b: { x: e, y: s }, layer: this.layer },
      { a: { x: e, y: s }, b: { x: this.x, y: s }, layer: this.layer },
      { a: { x: this.x, y: s }, b: { x: this.x, y: this.y }, layer: this.layer }
    ];
  }
  getCircles() {
    return [];
  }
}
const E = class E {
  static generateId() {
    return this._idCounter++, `shape-${this._idCounter}`;
  }
  static create(t, e) {
    const { x: s, y: i, color: r, width: n, layer: a, id: l, createdAt: y, tool: d } = t, c = a ?? null, p = r ?? "#000", v = n ?? 1, b = l ?? this.generateId(), S = y ?? Date.now(), w = {
      id: b,
      createdAt: S,
      tool: d,
      layer: c,
      color: p,
      width: v
    };
    switch (d) {
      case "pen":
      case "highlighter":
      case "eraser":
        return new T(e ?? { tool: d }, w);
      case "line":
        return new pe(e ?? { x1: s, y1: i, x2: s, y2: i }, w);
      case "circle":
        return new ge(e ?? { cx: s, cy: i, radius: 0 }, w);
      case "rectangle":
        return new ve(e ?? { x: s, y: i, w: 0, h: 0 }, w);
      default:
        throw new Error(`Tool not supported: ${d}`);
    }
  }
  static fromJSON(t) {
    try {
      const { config: e, options: s } = t, i = {
        tool: s.tool,
        x: 0,
        y: 0,
        color: s.color,
        width: s.width,
        layer: s.layer,
        id: s.id,
        createdAt: s.createdAt
      };
      return E.create(i, e);
    } catch {
      return null;
    }
  }
};
h(E, "_idCounter", 0);
let D = E;
function fe(o, t, e, s) {
  const {
    size: i,
    color: r = "#ddd",
    lineWidth: n = 1,
    majorEvery: a = 0,
    majorColor: l = "#bbb",
    majorWidth: y = 1.5
  } = s;
  if (!(i <= 0)) {
    o.save();
    for (let d = 0; d <= t; d += i) {
      const c = a > 0 && d / i % a === 0;
      o.strokeStyle = c ? l : r, o.lineWidth = c ? y : n;
      const p = Math.round(d) + 0.5;
      o.beginPath(), o.moveTo(p, 0), o.lineTo(p, e), o.stroke();
    }
    for (let d = 0; d <= e; d += i) {
      const c = a > 0 && d / i % a === 0;
      o.strokeStyle = c ? l : r, o.lineWidth = c ? y : n;
      const p = Math.round(d) + 0.5;
      o.beginPath(), o.moveTo(0, p), o.lineTo(t, p), o.stroke();
    }
    o.restore();
  }
}
function me(o, t, e, s) {
  const {
    spacing: i,
    color: r = "#cfd8ff",
    lineWidth: n = 1,
    marginTop: a = 0
  } = s;
  o.save(), o.strokeStyle = r, o.lineWidth = n;
  for (let l = a; l <= e; l += i)
    o.beginPath(), o.moveTo(0, l), o.lineTo(t, l), o.stroke();
  o.restore();
}
function be(o, t, e, s) {
  const {
    origin: i = { mode: "center" },
    color: r = "#000",
    lineWidth: n = 2,
    arrowSize: a = 10,
    tickSize: l = 0,
    padding: y = 0
  } = s, { x: d, y: c } = _e(t, e, y, i), p = K(d, n), v = K(c, n), b = y === 0 ? l / 3 : y;
  o.save(), o.strokeStyle = r, o.lineWidth = n, o.beginPath(), o.moveTo(b, v), o.lineTo(t - b, v), o.stroke(), U(o, b, v, t - b, v, a), o.beginPath(), o.moveTo(p, b), o.lineTo(p, e - b), o.stroke(), U(o, p, e - b, p, b, a), l && (o.lineWidth = 1, Y(o, p, b, t - b, l, (S) => {
    o.beginPath(), o.moveTo(S, v - 5), o.lineTo(S, v + 5), o.stroke();
  }), Y(o, v, b, e - b, l, (S) => {
    o.beginPath(), o.moveTo(p - 5, S), o.lineTo(p + 5, S), o.stroke();
  })), o.restore();
}
function _e(o, t, e, s) {
  switch (s.mode) {
    case "center":
      return { x: o / 2, y: t / 2 };
    case "bottom":
      return { x: o / 2, y: t - e };
    case "bottom-left":
      return { x: e, y: t - e };
    case "manual":
      return { x: s.x, y: s.y };
  }
}
function U(o, t, e, s, i, r) {
  const n = Math.atan2(i - e, s - t);
  o.beginPath(), o.moveTo(s, i), o.lineTo(
    s - r * Math.cos(n - Math.PI / 6),
    i - r * Math.sin(n - Math.PI / 6)
  ), o.moveTo(s, i), o.lineTo(
    s - r * Math.cos(n + Math.PI / 6),
    i - r * Math.sin(n + Math.PI / 6)
  ), o.stroke();
}
function Y(o, t, e, s, i, r) {
  const n = Math.ceil((e - t) / i), a = Math.floor((s - t) / i);
  for (let l = n; l <= a; l++)
    r(t + l * i);
}
function K(o, t) {
  return t % 2 === 1 ? Math.round(o) + 0.5 : Math.round(o);
}
class xe {
  constructor(t) {
    h(this, "ctx");
    this.ctx = t;
  }
  draw(t) {
    const e = this.ctx;
    if (e.clearRect(0, 0, e.canvas.width, e.canvas.height), !!t) {
      switch (e.save(), e.strokeStyle = "#00A8FF", e.lineWidth = 1.5, t.type) {
        case "point":
          e.beginPath(), e.arc(t.x, t.y, 6, 0, Math.PI * 2), e.stroke();
          break;
        case "midpoint":
          e.beginPath(), e.moveTo(t.x - 6, t.y), e.lineTo(t.x + 6, t.y), e.moveTo(t.x, t.y - 6), e.lineTo(t.x, t.y + 6), e.stroke();
          break;
        case "grid":
          e.beginPath(), e.rect(t.x - 4, t.y - 4, 8, 8), e.stroke();
          break;
      }
      e.restore();
    }
  }
}
const k = class k {
  constructor(t) {
    h(this, "bezier", !1);
    h(this, "container");
    h(this, "overlay");
    h(this, "_layers");
    h(this, "_shapes", []);
    h(this, "_currentShape", null);
    h(this, "_background", { mode: "none" });
    h(this, "_snapManager", new ye({ snapRadius: 10 }));
    h(this, "snapRenderer");
    h(this, "_resizeObserver");
    this.container = t, this.container.style.position = "relative", this._layers = {
      BACKGROUND: new $(this.container, { name: "BACKGROUND", zIndex: 1 }),
      MAIN: new $(this.container, { name: "MAIN", zIndex: 2 }),
      LAYER: new $(this.container, { name: "LAYER", zIndex: 3 })
    }, this.overlay = new $(this.container, { name: "overlay", zIndex: 99 }), this.snapRenderer = new xe(this.overlay.ctx), this._resizeObserver = new ResizeObserver(() => this.resize()), this._resizeObserver.observe(this.container);
  }
  get snapManager() {
    return this._snapManager;
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
  set mode(t) {
    this._background.mode = t;
  }
  // --- Shape creation ---
  startShape(t) {
    let e = t.x, s = t.y;
    if (!k.NO_SNAP_TOOLS.has(t.tool)) {
      const r = this.snapManager.snap(t.x, t.y, this._shapes, t.layer);
      this.snapRenderer.draw(r), e = (r == null ? void 0 : r.x) ?? t.x, s = (r == null ? void 0 : r.y) ?? t.y;
    }
    const i = D.create({
      ...t,
      x: e,
      y: s
    });
    return i instanceof T && (i.bezier = this.bezier, this._shapes.push(i)), this._currentShape = i, i;
  }
  updateShape(t, e) {
    var r, n;
    if (!this._currentShape) return;
    this.overlay.clear();
    let s = t, i = e;
    if (!k.NO_SNAP_TOOLS.has(this._currentShape.tool)) {
      const a = this.snapManager.snap(t, e, this._shapes, this._currentShape.layer);
      this.snapRenderer.draw(a), s = (a == null ? void 0 : a.x) ?? t, i = (a == null ? void 0 : a.y) ?? e;
    }
    (n = (r = this._currentShape).update) == null || n.call(r, s, i), this._currentShape.draw(this.overlay.ctx);
  }
  endShape() {
    if (!this._currentShape) return;
    const t = this._currentShape;
    if (this._currentShape = null, this.overlay.clear(), t instanceof T && t.isEmpty()) {
      const e = this._shapes.indexOf(t);
      e !== -1 && this._shapes.splice(e, 1);
      return;
    }
    if (t instanceof T || this._shapes.push(t), t.layer !== null) {
      const e = this.getLayer(t.layer);
      t.draw(e.ctx);
    }
    this.saveLocal();
  }
  // --- Layer management ---
  getLayer(t) {
    return this._layers[t] ?? this._layers.MAIN;
  }
  setLayerVisibility(t, e) {
    const s = this.getLayer(t);
    s.visible = e, s.canvas.style.display = e ? "block" : "none";
  }
  setLayerOpacity(t, e) {
    const s = this.getLayer(t);
    s.opacity = e, s.canvas.style.opacity = e.toString();
  }
  clearLayer(t) {
    var e;
    (e = this.getLayer(t)) == null || e.clear();
  }
  clearAll() {
    for (const t of Object.values(this._layers))
      t.visible && !t.locked && t.name !== "BACKGROUND" && t.clear();
  }
  // --- Drawing ---
  // excludeLayer: si fourni, les shapes appartenant à ce layer sont ignorées
  draw(t) {
    this.clearAll();
    const e = /* @__PURE__ */ new Map();
    for (const s of this._shapes) {
      if (!s.layer || t && s.layer === t) continue;
      const i = e.get(s.layer);
      i ? i.push(s) : e.set(s.layer, [s]);
    }
    for (const [s, i] of e) {
      const r = this.getLayer(s).ctx;
      for (const n of i) n.draw(r);
    }
  }
  resize() {
    for (const t of [...Object.values(this._layers), this.overlay])
      t.resize(this.container);
    this.renderBackground(this._background);
  }
  // --- Background ---
  setBackground(t) {
    this._background = t, this.renderBackground(t);
  }
  renderBackground(t) {
    const e = this.getLayer("BACKGROUND"), s = e.ctx, i = e.canvas.width, r = e.canvas.height;
    switch (s.clearRect(0, 0, i, r), t.mode) {
      case "grid":
        fe(s, i, r, t.grid);
        break;
      case "ruled":
        me(s, i, r, t.ruled);
        break;
      case "axes":
        be(s, i, r, t.axes);
        break;
    }
    this.draw();
  }
  // --- LocalStorage ---
  saveLocal() {
    const t = this._shapes.map((e) => e.toJSON());
    localStorage.setItem(k.localStorageKey, JSON.stringify(t));
  }
  loadLocal() {
    const t = localStorage.getItem(k.localStorageKey);
    if (!t) return;
    let e;
    try {
      e = JSON.parse(t);
    } catch {
      console.warn("[PiNote] loadLocal: données localStorage invalides, ignorées");
      return;
    }
    let s = 0;
    this._shapes = e.map((i) => {
      const r = D.fromJSON(i);
      return r || s++, r;
    }).filter(Boolean), s > 0 && console.warn(`[PiNote] loadLocal: ${s} forme(s) ignorée(s) (données invalides ou outil inconnu)`), this.draw();
  }
  // --- Shape destruction ---
  destroyById(t) {
    const e = this._shapes.findIndex((s) => s.id === t);
    e !== -1 && (this._shapes.splice(e, 1), this.draw(), this.saveLocal());
  }
  destroy() {
    this._resizeObserver.disconnect();
  }
};
// toggle global
h(k, "NO_SNAP_TOOLS", /* @__PURE__ */ new Set(["pen", "highlighter", "eraser"])), h(k, "localStorageKey", "pi_note_draft");
let G = k;
const Se = { class: "tool-selector" }, we = ["onClick"], ke = { class: "icon-wrapper" }, Me = {
  key: 0,
  viewBox: "0 0 24 24"
}, Ce = {
  key: 1,
  viewBox: "0 0 24 24"
}, Pe = {
  key: 2,
  viewBox: "0 0 24 24"
}, ze = {
  key: 3,
  viewBox: "0 0 24 24"
}, Ie = {
  key: 4,
  viewBox: "0 0 24 24"
}, Te = {
  key: 5,
  viewBox: "0 0 24 24"
}, Oe = /* @__PURE__ */ C({
  __name: "ToolSelector",
  props: {
    modelValue: {
      default: "pen"
    },
    modelModifiers: {}
  },
  emits: ["update:modelValue"],
  setup(o) {
    const t = V(o, "modelValue"), e = [
      "pen",
      "highlighter",
      "eraser",
      "line",
      "circle",
      "rectangle"
    ];
    function s(i) {
      t.value = i;
    }
    return (i, r) => (f(), m("div", Se, [
      (f(), m(O, null, N(e, (n) => _("button", {
        key: n,
        class: A(["tool-button", { active: t.value === n }]),
        onClick: (a) => s(n)
      }, [
        _("span", ke, [
          n === "pen" ? (f(), m("svg", Me, [...r[0] || (r[0] = [
            _("path", { d: "M3 21l3-1 11-11-2-2L4 18l-1 3z" }, null, -1)
          ])])) : n === "highlighter" ? (f(), m("svg", Ce, [...r[1] || (r[1] = [
            _("rect", {
              x: "3",
              y: "14",
              width: "18",
              height: "6"
            }, null, -1),
            _("path", { d: "M7 14L17 4l3 3-10 10" }, null, -1)
          ])])) : n === "eraser" ? (f(), m("svg", Pe, [...r[2] || (r[2] = [
            _("path", { d: "M16 3l5 5-9 9H7L2 12l9-9h5z" }, null, -1)
          ])])) : n === "line" ? (f(), m("svg", ze, [...r[3] || (r[3] = [
            _("line", {
              x1: "4",
              y1: "20",
              x2: "20",
              y2: "4",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round"
            }, null, -1)
          ])])) : n === "circle" ? (f(), m("svg", Ie, [...r[4] || (r[4] = [
            _("circle", {
              cx: "12",
              cy: "12",
              r: "7",
              stroke: "currentColor",
              "stroke-width": "2",
              fill: "none"
            }, null, -1)
          ])])) : n === "rectangle" ? (f(), m("svg", Te, [...r[5] || (r[5] = [
            _("rect", {
              x: "5",
              y: "7",
              width: "14",
              height: "10",
              rx: "2",
              stroke: "currentColor",
              "stroke-width": "2",
              fill: "none"
            }, null, -1)
          ])])) : Z("", !0)
        ])
      ], 10, we)), 64))
    ]));
  }
}), P = (o, t) => {
  const e = o.__vccOpts || o;
  for (const [s, i] of t)
    e[s] = i;
  return e;
}, Ne = /* @__PURE__ */ P(Oe, [["__scopeId", "data-v-c2adfaa0"]]), Le = { class: "color-selector" }, Ae = ["onClick"], Ve = /* @__PURE__ */ C({
  __name: "ColorSelector",
  props: /* @__PURE__ */ j({
    tool: {}
  }, {
    modelValue: {},
    modelModifiers: {}
  }),
  emits: ["update:modelValue"],
  setup(o) {
    const t = V(o, "modelValue"), e = o, s = [
      "#000000",
      "#ef4444",
      "#3b82f6",
      "#22c55e",
      "#eab308"
    ];
    function i(c) {
      return e.tool === "eraser" ? !0 : c === void 0 ? !1 : e.tool === "highlighter" && c === "#000000";
    }
    function r(c) {
      t.value = c, l.value = c === a.value;
    }
    const n = ee("picker"), a = L("#34cd34"), l = L(!1);
    function y() {
      var c;
      if (!l.value) {
        t.value = a.value, l.value = !0;
        return;
      }
      (c = n.value) == null || c.click();
    }
    function d(c) {
      const v = c.target.value;
      a.value = v, t.value = v;
    }
    return (c, p) => (f(), m("div", Le, [
      (f(), m(O, null, N(s, (v) => _("button", {
        key: v,
        class: A(["color-button", {
          active: t.value === v,
          disabled: i(v)
        }]),
        style: B({ backgroundColor: v }),
        onClick: (b) => r(v)
      }, null, 14, Ae)), 64)),
      _("button", {
        class: "color-btn",
        onClick: y
      }, [
        _("div", {
          style: B({ backgroundColor: a.value }),
          class: "circle"
        }, null, 4),
        te(_("input", {
          ref_key: "picker",
          ref: n,
          "onUpdate:modelValue": p[0] || (p[0] = (v) => a.value = v),
          type: "color",
          onChange: d,
          onInput: d
        }, null, 544), [
          [se, a.value]
        ])
      ])
    ]));
  }
}), Re = /* @__PURE__ */ P(Ve, [["__scopeId", "data-v-9977e7ac"]]), $e = { class: "width-selector" }, Be = ["onClick"], De = /* @__PURE__ */ C({
  __name: "WidthSelector",
  props: /* @__PURE__ */ j({
    tool: {},
    color: {}
  }, {
    modelValue: {},
    modelModifiers: {}
  }),
  emits: ["update:modelValue"],
  setup(o) {
    const t = V(o, "modelValue"), e = o, s = J(() => {
      switch (e.tool) {
        case "highlighter":
          return [8, 12, 16];
        case "eraser":
          return [10, 20, 30];
        default:
          return [2, 4, 6];
      }
    }), i = J(() => e.tool === "eraser");
    return (r, n) => (f(), m("div", $e, [
      (f(!0), m(O, null, N(s.value, (a) => (f(), m("button", {
        key: a,
        class: A(["width-button", { active: t.value === a }]),
        onClick: (l) => t.value = a
      }, [
        i.value ? (f(), m("span", {
          key: 0,
          class: "width-circle",
          style: B({ width: a + "px", height: a + "px" })
        }, null, 4)) : (f(), m("span", {
          key: 1,
          class: "width-line",
          style: B({
            height: a / 2 + "px",
            background: e.color || "#333"
          })
        }, null, 4))
      ], 10, Be))), 128))
    ]));
  }
}), Ee = /* @__PURE__ */ P(De, [["__scopeId", "data-v-4f2b8442"]]), We = { class: "layer-selector" }, Ge = ["onClick"], Je = /* @__PURE__ */ C({
  __name: "LayerSelector",
  props: {
    modelValue: {},
    modelModifiers: {}
  },
  emits: ["update:modelValue"],
  setup(o) {
    const t = V(o, "modelValue"), e = ["MAIN", "LAYER"];
    function s(i) {
      t.value = i;
    }
    return (i, r) => (f(), m("div", We, [
      (f(), m(O, null, N(e, (n) => _("button", {
        key: n,
        class: A(["layer-btn", { active: t.value === n }]),
        onClick: (a) => s(n)
      }, z(n[0]), 11, Ge)), 64)),
      _("button", {
        class: A(["layer-btn", { active: t.value === null }]),
        onClick: r[0] || (r[0] = (n) => s(null))
      }, " T ", 2)
    ]));
  }
}), Ue = /* @__PURE__ */ P(Je, [["__scopeId", "data-v-6b353e7a"]]), Ye = { class: "note-tools" }, Ke = /* @__PURE__ */ C({
  __name: "NoteTools",
  props: {
    modelValue: {
      default: {
        tool: "pen",
        color: "black",
        width: 2,
        layer: "background"
      }
    },
    modelModifiers: {}
  },
  emits: ["update:modelValue"],
  setup(o) {
    const t = V(o, "modelValue"), e = {
      pen: {
        color: t.value.color,
        width: t.value.width
      },
      highlighter: {
        color: "#eab308",
        width: 12
      },
      eraser: {
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
      line: {
        color: "",
        width: 2
      }
    };
    return M(
      () => t.value.tool,
      (s) => {
        const i = e[s];
        t.value.color = i.color, t.value.width = i.width;
      }
    ), M(
      () => t.value.width,
      (s) => {
        e[t.value.tool].width = s;
      }
    ), M(
      () => t.value.color,
      (s) => {
        t.value.tool !== "eraser" && (e[t.value.tool].color = s);
      }
    ), (s, i) => (f(), m("div", Ye, [
      I(Ne, {
        modelValue: t.value.tool,
        "onUpdate:modelValue": i[0] || (i[0] = (r) => t.value.tool = r)
      }, null, 8, ["modelValue"]),
      I(Re, {
        modelValue: t.value.color,
        "onUpdate:modelValue": i[1] || (i[1] = (r) => t.value.color = r),
        tool: t.value.tool
      }, null, 8, ["modelValue", "tool"]),
      I(Ee, {
        modelValue: t.value.width,
        "onUpdate:modelValue": i[2] || (i[2] = (r) => t.value.width = r),
        tool: t.value.tool
      }, null, 8, ["modelValue", "tool"]),
      I(Ue, {
        modelValue: t.value.layer,
        "onUpdate:modelValue": i[3] || (i[3] = (r) => t.value.layer = r)
      }, null, 8, ["modelValue"])
    ]));
  }
}), je = /* @__PURE__ */ P(Ke, [["__scopeId", "data-v-117c15b5"]]), Xe = { class: "note-history-wrapper" }, He = { class: "history-list" }, qe = ["onClick"], Fe = { class: "layer-list" }, Qe = ["onClick"], Ze = /* @__PURE__ */ C({
  __name: "NoteHistory",
  props: {
    shapes: {},
    layers: {}
  },
  emits: ["destroy", "layerChange"],
  setup(o, { emit: t }) {
    const e = t;
    return (s, i) => (f(), m("div", Xe, [
      _("div", null, "HISTORY " + z(o.shapes.length), 1),
      _("div", He, [
        (f(!0), m(O, null, N(o.shapes, (r, n) => {
          var a;
          return f(), m("div", {
            key: r.id,
            onClick: (l) => e("destroy", r.id)
          }, z(n) + " - " + z((a = r.points) == null ? void 0 : a.length) + " - " + z(r.color), 9, qe);
        }), 128))
      ]),
      _("div", Fe, [
        (f(!0), m(O, null, N(o.layers, (r) => (f(), m("div", {
          key: r,
          onClick: (n) => e("layerChange", r)
        }, z(r), 9, Qe))), 128))
      ])
    ]));
  }
}), et = /* @__PURE__ */ P(Ze, [["__scopeId", "data-v-59b22c9b"]]), tt = { class: "note-canvas-wrapper" }, st = /* @__PURE__ */ C({
  __name: "NoteCanvas",
  props: {
    background: { default: () => ({ mode: "ruled", grid: { size: 80 }, ruled: { color: "#777", spacing: 40 } }) },
    snapGridSize: { default: 80 },
    snapGridEnabled: { type: Boolean, default: !1 }
  },
  emits: ["tool-change"],
  setup(o, { expose: t, emit: e }) {
    const s = e, i = o, r = L(null), n = ie(void 0);
    let a = null, l = re({
      layer: "MAIN",
      tool: "pen",
      width: 2,
      color: "black",
      bezier: !1
    });
    const y = L([]), d = L([]);
    let c = !1, p = 0;
    function v(g) {
      if (!r.value) return { x: 0, y: 0 };
      const u = r.value.getBoundingClientRect(), x = window.devicePixelRatio || 1;
      return {
        x: (g.clientX - u.left) * x,
        y: (g.clientY - u.top) * x
      };
    }
    function b(g) {
      if (!g.isPrimary || !r.value || !n.value) return;
      c = !0, p = Date.now();
      const u = v(g);
      a = n.value.startShape({
        layer: l.layer,
        color: l.color ?? "black",
        width: l.width ?? 2,
        tool: l.tool,
        createdAt: p,
        x: u.x,
        y: u.y
      }), a instanceof T && a.addPoint({ x: u.x, y: u.y, t: 0, pressure: 1 });
    }
    function S(g) {
      var x;
      if (!g.isPrimary || !c || !a) return;
      const u = v(g);
      if (a instanceof T) {
        const q = Date.now() - p;
        a.addPoint({ x: u.x, y: u.y, t: q, pressure: 1 });
      }
      (x = n.value) == null || x.updateShape(u.x, u.y);
    }
    function w(g) {
      var u, x;
      !g.isPrimary || !c || (c = !1, a && ((u = n.value) == null || u.endShape(), y.value = ((x = n.value) == null ? void 0 : x.shapes.slice()) ?? y.value, a = null));
    }
    M(() => l.bezier, (g) => {
      n.value && (n.value.bezier = g);
    });
    function X(g) {
      var u, x;
      (u = n.value) == null || u.destroyById(g), y.value = ((x = n.value) == null ? void 0 : x.shapes.slice()) ?? y.value;
    }
    function H(g) {
      var u;
      (u = n.value) == null || u.setLayerVisibility(g, !n.value.getLayer(g).visible);
    }
    return ne(() => {
      r.value && (n.value = new G(r.value), n.value.loadLocal(), n.value.bezier = l.bezier, y.value = n.value.shapes.slice(), d.value = n.value.layers.map((g) => g.name), n.value.setBackground(i.background), n.value.snapManager.setGridSize(i.snapGridSize), n.value.snapManager.setStrategyEnabled("grid", i.snapGridEnabled));
    }), oe(() => {
      var g;
      (g = n.value) == null || g.destroy();
    }), M(() => i.background, (g) => {
      var u;
      (u = n.value) == null || u.setBackground(g);
    }, { deep: !0 }), M(() => i.snapGridSize, (g) => {
      var u;
      (u = n.value) == null || u.snapManager.setGridSize(g);
    }), M(() => i.snapGridEnabled, (g) => {
      var u;
      (u = n.value) == null || u.snapManager.setStrategyEnabled("grid", g);
    }), M(l, (g) => {
      s("tool-change", { ...g });
    }, { deep: !0 }), t({ engine: n }), (g, u) => (f(), m("div", tt, [
      _("div", {
        ref_key: "canvas",
        ref: r,
        class: "note-canvas",
        onPointerdown: R(b, ["prevent"]),
        onPointermove: R(S, ["prevent"]),
        onPointerup: R(w, ["prevent"]),
        onPointerleave: R(w, ["prevent"]),
        onPointercancel: w
      }, null, 544),
      I(je, {
        modelValue: le(l),
        "onUpdate:modelValue": u[0] || (u[0] = (x) => ae(l) ? l.value = x : l = x),
        layers: d.value
      }, null, 8, ["modelValue", "layers"]),
      I(et, {
        shapes: y.value,
        layers: d.value,
        style: { position: "fixed", right: "0", top: "0", "z-index": "20" },
        onDestroy: X,
        onLayerChange: H
      }, null, 8, ["shapes", "layers"])
    ]));
  }
}), nt = /* @__PURE__ */ P(st, [["__scopeId", "data-v-e7766039"]]);
export {
  G as Engine,
  $ as Layer,
  nt as NoteCanvas
};
