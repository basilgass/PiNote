//#region node_modules/@mathjax/src/mjs/core/MathItem.js
function e(e, t, n, r, i, a, o = null) {
	return {
		open: e,
		math: t,
		close: n,
		n: r,
		start: { n: i },
		end: { n: a },
		display: o
	};
}
var t = class {
	get isEscaped() {
		return this.display === null;
	}
	constructor(e, t, r = !0, i = {
		i: 0,
		n: 0,
		delim: ""
	}, a = {
		i: 0,
		n: 0,
		delim: ""
	}) {
		this.root = null, this.typesetRoot = null, this.metrics = {}, this.inputData = {}, this.outputData = {}, this._state = n.UNPROCESSED, this.math = e, this.inputJax = t, this.display = r, this.start = i, this.end = a, this.root = null, this.typesetRoot = null, this.metrics = {}, this.inputData = {}, this.outputData = {};
	}
	render(e) {
		e.renderActions.renderMath(this, e);
	}
	rerender(e, t = n.RERENDER) {
		this.state() >= t && this.state(t - 1), e.renderActions.renderMath(this, e, t);
	}
	convert(e, t = n.LAST) {
		e.renderActions.renderConvert(this, e, t);
	}
	compile(e) {
		this.state() < n.COMPILED && (this.root = this.inputJax.compile(this, e), this.state(n.COMPILED));
	}
	typeset(e) {
		this.state() < n.TYPESET && (this.typesetRoot = e.outputJax[this.isEscaped ? "escaped" : "typeset"](this, e), this.state(n.TYPESET));
	}
	updateDocument(e) {}
	removeFromDocument(e = !1) {
		this.clear();
	}
	setMetrics(e, t, n, r) {
		this.metrics = {
			em: e,
			ex: t,
			containerWidth: n,
			scale: r
		};
	}
	state(e = null, t = !1) {
		return e != null && (e < n.INSERTED && this._state >= n.INSERTED && this.removeFromDocument(t), e < n.TYPESET && this._state >= n.TYPESET && (this.outputData = {}), e < n.COMPILED && this._state >= n.COMPILED && (this.inputData = {}), this._state = e), this._state;
	}
	reset(e = !1) {
		this.state(n.UNPROCESSED, e);
	}
	clear() {}
}, n = {
	UNPROCESSED: 0,
	FINDMATH: 10,
	COMPILED: 20,
	CONVERT: 100,
	METRICS: 110,
	RERENDER: 125,
	TYPESET: 150,
	INSERTED: 200,
	LAST: 1e4
};
function r(e, t) {
	if (e in n) throw Error("State " + e + " already exists");
	n[e] = t;
}
//#endregion
//#region node_modules/@mathjax/src/mjs/core/Tree/Factory.js
var i = class {
	constructor(e = null) {
		this.defaultKind = "unknown", this.nodeMap = /* @__PURE__ */ new Map(), this.node = {}, e === null && (e = this.constructor.defaultNodes);
		for (let t of Object.keys(e)) this.setNodeClass(t, e[t]);
	}
	create(e, ...t) {
		return (this.node[e] || this.node[this.defaultKind])(...t);
	}
	setNodeClass(e, t) {
		this.nodeMap.set(e, t);
		let n = this.nodeMap.get(e);
		this.node[e] = (...e) => new n(this, ...e);
	}
	getNodeClass(e) {
		return this.nodeMap.get(e);
	}
	deleteNodeClass(e) {
		this.nodeMap.delete(e), delete this.node[e];
	}
	nodeIsKind(e, t) {
		return e instanceof this.getNodeClass(t);
	}
	getKinds() {
		return Array.from(this.nodeMap.keys());
	}
};
i.defaultNodes = {};
//#endregion
export { e as a, r as i, t as n, n as r, i as t };
