import { t as e } from "./PrioritizedList-OKfur1cD.js";
//#region node_modules/@mathjax/src/mjs/util/FunctionList.js
var t = class extends e {
	constructor(e = null) {
		super(), e && this.addList(e);
	}
	addList(e) {
		for (let t of e) Array.isArray(t) ? this.add(t[0], t[1]) : this.add(t);
	}
	execute(...e) {
		for (let t of this) if (t.item(...e) === !1) return !1;
		return !0;
	}
	asyncExecute(...e) {
		let t = -1, n = this.items;
		return new Promise((r, i) => {
			(function a() {
				for (; ++t < n.length;) {
					let o = n[t].item(...e);
					if (o instanceof Promise) {
						o.then(a).catch((e) => i(e));
						return;
					}
					if (o === !1) {
						r(!1);
						return;
					}
				}
				r(!0);
			})();
		});
	}
}, n = "_inherit_", r = class {
	constructor(e, t) {
		this.global = t, this.defaults = Object.create(t), this.inherited = Object.create(this.defaults), this.attributes = Object.create(this.inherited), Object.assign(this.defaults, e);
	}
	set(e, t) {
		this.attributes[e] = t;
	}
	setList(e) {
		Object.assign(this.attributes, e);
	}
	unset(e) {
		delete this.attributes[e];
	}
	get(e) {
		let t = this.attributes[e];
		return t === "_inherit_" && (t = this.global[e]), t;
	}
	getExplicit(e) {
		return this.hasExplicit(e) ? this.attributes[e] : void 0;
	}
	hasExplicit(e) {
		return Object.hasOwn(this.attributes, e);
	}
	hasOneOf(e) {
		for (let t of e) if (this.hasExplicit(t)) return !0;
		return !1;
	}
	getList(...e) {
		let t = {};
		for (let n of e) t[n] = this.get(n);
		return t;
	}
	setInherited(e, t) {
		this.inherited[e] = t;
	}
	getInherited(e) {
		return this.inherited[e];
	}
	getDefault(e) {
		return this.defaults[e];
	}
	isSet(e) {
		return Object.hasOwn(this.attributes, e) || Object.hasOwn(this.inherited, e);
	}
	hasDefault(e) {
		return e in this.defaults;
	}
	getExplicitNames() {
		return Object.keys(this.attributes);
	}
	getInheritedNames() {
		return Object.keys(this.inherited);
	}
	getDefaultNames() {
		return Object.keys(this.defaults);
	}
	getGlobalNames() {
		return Object.keys(this.global);
	}
	getAllAttributes() {
		return this.attributes;
	}
	getAllInherited() {
		return this.inherited;
	}
	getAllDefaults() {
		return this.defaults;
	}
	getAllGlobals() {
		return this.global;
	}
}, i = class {
	constructor(e, t = {}, n = []) {
		this.factory = e, this.parent = null, this.properties = {}, this.childNodes = [];
		for (let e of Object.keys(t)) this.setProperty(e, t[e]);
		n.length && this.setChildren(n);
	}
	get kind() {
		return "unknown";
	}
	setProperty(e, t) {
		this.properties[e] = t;
	}
	getProperty(e) {
		return this.properties[e];
	}
	getPropertyNames() {
		return Object.keys(this.properties);
	}
	getAllProperties() {
		return this.properties;
	}
	removeProperty(...e) {
		for (let t of e) delete this.properties[t];
	}
	isKind(e) {
		return this.factory.nodeIsKind(this, e);
	}
	setChildren(e) {
		this.childNodes = [];
		for (let t of e) this.appendChild(t);
	}
	appendChild(e) {
		return this.childNodes.push(e), e.parent = this, e;
	}
	replaceChild(e, t) {
		let n = this.childIndex(t);
		return n !== null && (this.childNodes[n] = e, e.parent = this, t.parent === this && (t.parent = null)), e;
	}
	removeChild(e) {
		let t = this.childIndex(e);
		return t !== null && (this.childNodes.splice(t, 1), e.parent = null), e;
	}
	childIndex(e) {
		let t = this.childNodes.indexOf(e);
		return t === -1 ? null : t;
	}
	copy() {
		let e = this.factory.create(this.kind);
		e.properties = Object.assign({}, this.properties);
		for (let t of this.childNodes || []) t && e.appendChild(t.copy());
		return e;
	}
	findNodes(e) {
		let t = [];
		return this.walkTree((n) => {
			n.isKind(e) && t.push(n);
		}), t;
	}
	walkTree(e, t) {
		e(this, t);
		for (let n of this.childNodes) n && n.walkTree(e, t);
		return t;
	}
	toString() {
		return this.kind + "(" + this.childNodes.join(",") + ")";
	}
}, a = class extends i {
	setChildren(e) {}
	appendChild(e) {
		return e;
	}
	replaceChild(e, t) {
		return t;
	}
	childIndex(e) {
		return null;
	}
	walkTree(e, t) {
		return e(this, t), t;
	}
	toString() {
		return this.kind;
	}
}, o = {
	ORD: 0,
	OP: 1,
	BIN: 2,
	REL: 3,
	OPEN: 4,
	CLOSE: 5,
	PUNCT: 6,
	INNER: 7,
	NONE: -1
}, s = [
	"ORD",
	"OP",
	"BIN",
	"REL",
	"OPEN",
	"CLOSE",
	"PUNCT",
	"INNER"
], c = [
	"",
	"thinmathspace",
	"mediummathspace",
	"thickmathspace"
], l = [
	[
		0,
		-1,
		2,
		3,
		0,
		0,
		0,
		1
	],
	[
		-1,
		-1,
		0,
		3,
		0,
		0,
		0,
		1
	],
	[
		2,
		2,
		0,
		0,
		2,
		0,
		0,
		2
	],
	[
		3,
		3,
		0,
		0,
		3,
		0,
		0,
		3
	],
	[
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	],
	[
		0,
		-1,
		2,
		3,
		0,
		0,
		0,
		1
	],
	[
		1,
		1,
		0,
		1,
		1,
		1,
		1,
		1
	],
	[
		1,
		-1,
		2,
		3,
		1,
		0,
		1,
		1
	]
], u = new Set([
	"normal",
	"bold",
	"italic",
	"bold-italic",
	"double-struck",
	"fraktur",
	"bold-fraktur",
	"script",
	"bold-script",
	"sans-serif",
	"bold-sans-serif",
	"sans-serif-italic",
	"sans-serif-bold-italic",
	"monospace",
	"inital",
	"tailed",
	"looped",
	"stretched"
]), d = [
	"indentalign",
	"indentalignfirst",
	"indentshift",
	"indentshiftfirst"
], f = class e extends i {
	constructor(e, t = {}, n = []) {
		super(e), this.prevClass = null, this.prevLevel = null, this.texclass = null, this.arity < 0 && (this.childNodes = [e.create("inferredMrow")], this.childNodes[0].parent = this), this.setChildren(n), this.attributes = new r(e.getNodeClass(this.kind).defaults, e.getNodeClass("math").defaults), this.attributes.setList(t);
	}
	copy(e = !1) {
		let t = this.factory.create(this.kind);
		if (t.properties = Object.assign({}, this.properties), this.attributes) {
			let n = this.attributes.getAllAttributes();
			for (let r of Object.keys(n)) (r !== "id" || e) && t.attributes.set(r, n[r]);
		}
		if (this.childNodes && this.childNodes.length) {
			let e = this.childNodes;
			e.length === 1 && e[0].isInferred && (e = e[0].childNodes);
			for (let n of e) n ? t.appendChild(n.copy()) : t.childNodes.push(null);
		}
		return t;
	}
	get texClass() {
		return this.texclass;
	}
	set texClass(e) {
		this.texclass = e;
	}
	get isToken() {
		return !1;
	}
	get isEmbellished() {
		return !1;
	}
	get isSpacelike() {
		return !1;
	}
	get linebreakContainer() {
		return !1;
	}
	get linebreakAlign() {
		return "data-align";
	}
	get isEmpty() {
		for (let e of this.childNodes) if (!e.isEmpty) return !1;
		return !0;
	}
	get arity() {
		return Infinity;
	}
	get isInferred() {
		return !1;
	}
	get Parent() {
		let e = this.parent;
		for (; e && e.notParent;) e = e.Parent;
		return e;
	}
	get notParent() {
		return !1;
	}
	setChildren(e) {
		return this.arity < 0 ? this.childNodes[0].setChildren(e) : super.setChildren(e);
	}
	appendChild(e) {
		if (this.arity < 0) return this.childNodes[0].appendChild(e), e;
		if (e.isInferred) {
			if (this.arity === Infinity) return e.childNodes.forEach((e) => super.appendChild(e)), e;
			let t = e;
			e = this.factory.create("mrow"), e.setChildren(t.childNodes), e.attributes = t.attributes;
			for (let n of t.getPropertyNames()) e.setProperty(n, t.getProperty(n));
		}
		return super.appendChild(e);
	}
	replaceChild(e, t) {
		return this.arity < 0 ? (this.childNodes[0].replaceChild(e, t), e) : super.replaceChild(e, t);
	}
	core() {
		return this;
	}
	coreMO() {
		return this;
	}
	coreIndex() {
		return 0;
	}
	childPosition() {
		let e = null, t = this.parent;
		for (; t && t.notParent;) e = t, t = t.parent;
		if (e ||= this, t) {
			let n = 0;
			for (let r of t.childNodes) {
				if (r === e) return n;
				n++;
			}
		}
		return null;
	}
	setTeXclass(e) {
		return this.getPrevClass(e), this.texClass == null ? e : this;
	}
	updateTeXclass(e) {
		e && (this.prevClass = e.prevClass, this.prevLevel = e.prevLevel, e.prevClass = e.prevLevel = null, this.texClass = e.texClass);
	}
	getPrevClass(e) {
		e && (this.prevClass = e.texClass, this.prevLevel = e.attributes.get("scriptlevel"));
	}
	texSpacing() {
		let e = this.prevClass == null ? o.NONE : this.prevClass, t = this.texClass || o.ORD;
		if (e === o.NONE || t === o.NONE) return "";
		let n = l[e][t];
		return (this.prevLevel > 0 || this.attributes.get("scriptlevel") > 0) && n >= 0 ? "" : c[Math.abs(n)];
	}
	hasSpacingAttributes() {
		return this.isEmbellished && this.coreMO().hasSpacingAttributes();
	}
	setInheritedAttributes(t = {}, n = !1, r = 0, i = !1) {
		let a = this.attributes.getAllDefaults();
		for (let n of Object.keys(t)) {
			if (Object.hasOwn(a, n) || Object.hasOwn(e.alwaysInherit, n)) {
				let [r, i] = t[n];
				e.noInherit[r]?.[this.kind]?.[n] || this.attributes.setInherited(n, i);
			}
			e.stopInherit[this.kind]?.[n] && (t = Object.assign({}, t), delete t[n]);
		}
		this.attributes.getExplicit("displaystyle") === void 0 && this.attributes.setInherited("displaystyle", n), this.attributes.getExplicit("scriptlevel") === void 0 && this.attributes.setInherited("scriptlevel", r), i && this.setProperty("texprimestyle", i);
		let o = this.arity;
		if (o >= 0 && o !== Infinity && (o === 1 && this.childNodes.length === 0 || o !== 1 && this.childNodes.length !== o)) if (o < this.childNodes.length) this.childNodes = this.childNodes.slice(0, o);
		else for (; this.childNodes.length < o;) this.appendChild(this.factory.create("mrow"));
		if (this.linebreakContainer && !this.isEmbellished) {
			let e = this.linebreakAlign;
			if (e) {
				let n = this.attributes.get(e) || "left";
				t = this.addInheritedAttributes(t, {
					indentalign: n,
					indentshift: "0",
					indentalignfirst: n,
					indentshiftfirst: "0",
					indentalignlast: "indentalign",
					indentshiftlast: "indentshift"
				});
			}
		}
		this.setChildInheritedAttributes(t, n, r, i);
	}
	setChildInheritedAttributes(e, t, n, r) {
		for (let i of this.childNodes) i.setInheritedAttributes(e, t, n, r);
	}
	addInheritedAttributes(e, t) {
		let n = Object.assign({}, e);
		for (let e of Object.keys(t)) e !== "displaystyle" && e !== "scriptlevel" && e !== "style" && (n[e] = [this.kind, t[e]]);
		return n;
	}
	inheritAttributesFrom(e) {
		let t = e.attributes, n = t.get("displaystyle"), r = t.get("scriptlevel"), i = t.isSet("mathsize") ? { mathsize: ["math", t.get("mathsize")] } : {}, a = e.getProperty("texprimestyle") || !1;
		this.setInheritedAttributes(i, n, r, a);
	}
	verifyTree(e = null) {
		if (e === null) return;
		this.verifyAttributes(e);
		let t = this.arity;
		e.checkArity && t >= 0 && t !== Infinity && (t === 1 && this.childNodes.length === 0 || t !== 1 && this.childNodes.length !== t) && this.mError("Wrong number of children for \"" + this.kind + "\" node", e, !0), this.verifyChildren(e);
	}
	verifyAttributes(e) {
		if (e.checkAttributes) {
			let t = this.attributes, n = [];
			for (let e of t.getExplicitNames()) e.substring(0, 5) !== "data-" && t.getDefault(e) === void 0 && !e.match(/^(?:class|style|id|(?:xlink:)?href)$/) && n.push(e);
			n.length && this.mError("Unknown attributes for " + this.kind + " node: " + n.join(", "), e);
		}
		if (e.checkMathvariants) {
			let t = this.attributes.getExplicit("mathvariant");
			t && !u.has(t) && !this.getProperty("ignore-variant") && this.mError(`Invalid mathvariant: ${t}`, e, !0);
		}
	}
	verifyChildren(e) {
		for (let t of this.childNodes) t.verifyTree(e);
	}
	mError(e, t, n = !1) {
		if (this.parent && this.parent.isKind("merror")) return null;
		let r = this.factory.create("merror");
		if (r.attributes.set("data-mjx-message", e), t.fullErrors || n) {
			let n = this.factory.create("mtext"), i = this.factory.create("text");
			i.setText(t.fullErrors ? e : this.kind), n.appendChild(i), r.appendChild(n), this.parent.replaceChild(r, this), t.fullErrors || r.attributes.set("title", e);
		} else this.parent.replaceChild(r, this), r.appendChild(this);
		return r;
	}
};
f.defaults = {
	mathbackground: n,
	mathcolor: n,
	mathsize: n,
	dir: n
}, f.noInherit = {
	mstyle: {
		mpadded: {
			width: !0,
			height: !0,
			depth: !0,
			lspace: !0,
			voffset: !0
		},
		mtable: {
			width: !0,
			height: !0,
			depth: !0,
			align: !0
		}
	},
	maligngroup: {
		mrow: { groupalign: !0 },
		mtable: { groupalign: !0 }
	},
	mtr: {
		msqrt: { "data-vertical-align": !0 },
		mroot: { "data-vertical-align": !0 }
	},
	mlabeledtr: {
		msqrt: { "data-vertical-align": !0 },
		mroot: { "data-vertical-align": !0 }
	}
}, f.stopInherit = { mtd: {
	columnalign: !0,
	rowalign: !0,
	groupalign: !0
} }, f.alwaysInherit = {
	scriptminsize: !0,
	scriptsizemultiplier: !0,
	infixlinebreakstyle: !0
}, f.verifyDefaults = {
	checkArity: !0,
	checkAttributes: !1,
	checkMathvariants: !0,
	fullErrors: !1,
	fixMmultiscripts: !0,
	fixMtables: !0
};
var p = class extends f {
	get isToken() {
		return !0;
	}
	get isEmpty() {
		for (let e of this.childNodes) if (!(e instanceof _) || e.getText().length) return !1;
		return !0;
	}
	getText() {
		let e = "";
		for (let t of this.childNodes) t instanceof _ ? e += t.getText() : "textContent" in t && (e += t.textContent());
		return e;
	}
	setChildInheritedAttributes(e, t, n, r) {
		for (let i of this.childNodes) i instanceof f && i.setInheritedAttributes(e, t, n, r);
	}
	walkTree(e, t) {
		e(this, t);
		for (let n of this.childNodes) n instanceof f && n.walkTree(e, t);
		return t;
	}
};
p.defaults = Object.assign(Object.assign({}, f.defaults), {
	mathvariant: "normal",
	mathsize: n
});
var m = class extends f {
	get isSpacelike() {
		return this.childNodes[0].isSpacelike;
	}
	get isEmbellished() {
		return this.childNodes[0].isEmbellished;
	}
	get arity() {
		return -1;
	}
	core() {
		return this.childNodes[0];
	}
	coreMO() {
		return this.childNodes[0].coreMO();
	}
	setTeXclass(e) {
		return e = this.childNodes[0].setTeXclass(e), this.updateTeXclass(this.childNodes[0]), e;
	}
};
m.defaults = f.defaults;
var h = class extends f {
	get isEmbellished() {
		return this.childNodes[0].isEmbellished;
	}
	core() {
		return this.childNodes[0];
	}
	coreMO() {
		return this.childNodes[0].coreMO();
	}
	setTeXclass(e) {
		this.getPrevClass(e), this.texClass = o.ORD;
		let t = this.childNodes[0], n = null;
		t && (this.isEmbellished || t.isKind("mi") ? (n = t.setTeXclass(e), this.updateTeXclass(this.core())) : (t.setTeXclass(null), t.isKind("TeXAtom") && (this.texClass = t.texClass)));
		for (let e of this.childNodes.slice(1)) e && e.setTeXclass(null);
		return n || this;
	}
};
h.defaults = f.defaults;
var g = class extends a {
	get isToken() {
		return !1;
	}
	get isEmpty() {
		return !0;
	}
	get isEmbellished() {
		return !1;
	}
	get isSpacelike() {
		return !1;
	}
	get linebreakContainer() {
		return !1;
	}
	get linebreakAlign() {
		return "";
	}
	get arity() {
		return 0;
	}
	get isInferred() {
		return !1;
	}
	get notParent() {
		return !1;
	}
	get Parent() {
		return this.parent;
	}
	get texClass() {
		return o.NONE;
	}
	get prevClass() {
		return o.NONE;
	}
	get prevLevel() {
		return 0;
	}
	hasSpacingAttributes() {
		return !1;
	}
	get attributes() {
		return null;
	}
	core() {
		return this;
	}
	coreMO() {
		return this;
	}
	coreIndex() {
		return 0;
	}
	childPosition() {
		return 0;
	}
	setTeXclass(e) {
		return e;
	}
	texSpacing() {
		return "";
	}
	setInheritedAttributes(e, t, n, r) {}
	inheritAttributesFrom(e) {}
	verifyTree(e) {}
	mError(e, t, n = !1) {
		return null;
	}
}, _ = class extends g {
	constructor() {
		super(...arguments), this.text = "";
	}
	get kind() {
		return "text";
	}
	getText() {
		return this.text;
	}
	setText(e) {
		return this.text = e, this;
	}
	copy() {
		return this.factory.create(this.kind).setText(this.getText());
	}
	toString() {
		return this.text;
	}
}, v = class extends g {
	constructor() {
		super(...arguments), this.xml = null, this.adaptor = null;
	}
	get kind() {
		return "XML";
	}
	getXML() {
		return this.xml;
	}
	setXML(e, t = null) {
		return this.xml = e, this.adaptor = t, this;
	}
	getSerializedXML() {
		return this.adaptor.serializeXML(this.xml);
	}
	copy() {
		return this.factory.create(this.kind).setXML(this.adaptor.clone(this.xml));
	}
	toString() {
		return "XML data";
	}
};
//#endregion
//#region node_modules/@mathjax/src/mjs/core/MmlTree/OperatorDictionary.js
function y(e, t, n = o.BIN, r = null) {
	return [
		e,
		t,
		n,
		r
	];
}
var b = {
	REL: y(5, 5, o.REL),
	WIDEREL: y(5, 5, o.REL, {
		accent: !0,
		stretchy: !0
	}),
	BIN4: y(4, 4, o.BIN),
	RELSTRETCH: y(5, 5, o.REL, { stretchy: !0 }),
	ORD: y(0, 0, o.ORD),
	BIN3: y(3, 3, o.BIN),
	OPEN: y(0, 0, o.OPEN, {
		fence: !0,
		stretchy: !0,
		symmetric: !0
	}),
	CLOSE: y(0, 0, o.CLOSE, {
		fence: !0,
		stretchy: !0,
		symmetric: !0
	}),
	INTEGRAL: y(3, 3, o.OP, {
		largeop: !0,
		symmetric: !0
	}),
	ACCENT: y(0, 0, o.ORD, { accent: !0 }),
	WIDEACCENT: y(0, 0, o.ORD, {
		accent: !0,
		stretchy: !0
	}),
	OP: y(3, 3, o.OP, {
		largeop: !0,
		movablelimits: !0,
		symmetric: !0
	}),
	RELACCENT: y(5, 5, o.REL, { accent: !0 }),
	BIN0: y(0, 0, o.BIN),
	BIN5: y(5, 5, o.BIN),
	FENCE: y(0, 0, o.ORD, {
		fence: !0,
		stretchy: !0,
		symmetric: !0
	}),
	INNER: y(1, 1, o.INNER),
	ORD30: y(3, 0, o.ORD),
	NONE: y(0, 0, o.NONE),
	ORDSTRETCH0: y(0, 0, o.ORD, { stretchy: !0 }),
	BINSTRETCH0: y(0, 0, o.BIN, { stretchy: !0 }),
	RELSTRETCH0: y(0, 0, o.REL, { stretchy: !0 }),
	CLOSE0: y(0, 0, o.CLOSE, { fence: !0 }),
	ORD3: y(3, 3, o.ORD),
	PUNCT03: y(0, 3, o.PUNCT, { linebreakstyle: "after" }),
	OPEN0: y(0, 0, o.OPEN, { fence: !0 }),
	STRETCH4: y(4, 4, o.BIN, { stretchy: !0 })
}, x = [
	[
		32,
		127,
		o.REL,
		"mo"
	],
	[
		160,
		191,
		o.ORD,
		"mo"
	],
	[
		192,
		591,
		o.ORD,
		"mi"
	],
	[
		688,
		879,
		o.ORD,
		"mo"
	],
	[
		880,
		6688,
		o.ORD,
		"mi"
	],
	[
		6832,
		6911,
		o.ORD,
		"mo"
	],
	[
		6912,
		7615,
		o.ORD,
		"mi"
	],
	[
		7616,
		7679,
		o.ORD,
		"mo"
	],
	[
		7680,
		8191,
		o.ORD,
		"mi"
	],
	[
		8192,
		8303,
		o.ORD,
		"mo"
	],
	[
		8304,
		8351,
		o.ORD,
		"mo"
	],
	[
		8448,
		8527,
		o.ORD,
		"mi"
	],
	[
		8528,
		8591,
		o.ORD,
		"mn"
	],
	[
		8592,
		8703,
		o.REL,
		"mo"
	],
	[
		8704,
		8959,
		o.BIN,
		"mo"
	],
	[
		8960,
		9215,
		o.ORD,
		"mo"
	],
	[
		9312,
		9471,
		o.ORD,
		"mn"
	],
	[
		9472,
		10223,
		o.ORD,
		"mo"
	],
	[
		10224,
		10239,
		o.REL,
		"mo"
	],
	[
		10240,
		10495,
		o.ORD,
		"mtext"
	],
	[
		10496,
		10623,
		o.REL,
		"mo"
	],
	[
		10624,
		10751,
		o.ORD,
		"mo"
	],
	[
		10752,
		11007,
		o.BIN,
		"mo"
	],
	[
		11008,
		11055,
		o.ORD,
		"mo"
	],
	[
		11056,
		11087,
		o.REL,
		"mo"
	],
	[
		11088,
		11263,
		o.ORD,
		"mo"
	],
	[
		11264,
		11744,
		o.ORD,
		"mi"
	],
	[
		11776,
		11903,
		o.ORD,
		"mo"
	],
	[
		11904,
		12255,
		o.ORD,
		"mi",
		"normal"
	],
	[
		12272,
		12351,
		o.ORD,
		"mo"
	],
	[
		12352,
		42143,
		o.ORD,
		"mi",
		"normal"
	],
	[
		42192,
		43055,
		o.ORD,
		"mi"
	],
	[
		43056,
		43071,
		o.ORD,
		"mn"
	],
	[
		43072,
		55295,
		o.ORD,
		"mi"
	],
	[
		63744,
		64255,
		o.ORD,
		"mi",
		"normal"
	],
	[
		64256,
		65023,
		o.ORD,
		"mi"
	],
	[
		65024,
		65135,
		o.ORD,
		"mo"
	],
	[
		65136,
		65791,
		o.ORD,
		"mi"
	],
	[
		65792,
		65935,
		o.ORD,
		"mn"
	],
	[
		65936,
		74751,
		o.ORD,
		"mi",
		"normal"
	],
	[
		74752,
		74879,
		o.ORD,
		"mn"
	],
	[
		74880,
		113823,
		o.ORD,
		"mi",
		"normal"
	],
	[
		113824,
		119391,
		o.ORD,
		"mo"
	],
	[
		119648,
		119679,
		o.ORD,
		"mn"
	],
	[
		119808,
		120781,
		o.ORD,
		"mi"
	],
	[
		120782,
		120831,
		o.ORD,
		"mn"
	],
	[
		122624,
		129023,
		o.ORD,
		"mo"
	],
	[
		129024,
		129279,
		o.REL,
		"mo"
	],
	[
		129280,
		129535,
		o.ORD,
		"mo"
	],
	[
		131072,
		195103,
		o.ORD,
		"mi",
		"normal"
	]
];
function S(e) {
	let t = w.infix[e] || w.prefix[e] || w.postfix[e];
	if (t) return [
		0,
		0,
		t[2],
		"mo"
	];
	let n = e.codePointAt(0);
	for (let e of x) if (n <= e[1]) {
		if (n >= e[0]) return e;
		break;
	}
	return [
		0,
		0,
		o.REL,
		"mo"
	];
}
var C = [
	[0, 0],
	[1, 2],
	[3, 3],
	[4, 4],
	[0, 0],
	[0, 0],
	[0, 3],
	[1, 1]
], w = {
	prefix: {
		"!": b.ORD,
		"(": b.OPEN,
		"+": b.BIN0,
		"-": b.BIN0,
		"[": b.OPEN,
		"{": b.OPEN,
		"|": b.OPEN,
		"||": b.BIN0,
		"¬": b.ORD,
		"±": b.BIN0,
		"‖": b.FENCE,
		"‘": b.OPEN0,
		"“": b.OPEN0,
		ⅅ: b.ORD30,
		ⅆ: b.ORD30,
		"∀": b.ORD,
		"∁": b.ORD,
		"∂": b.ORD30,
		"∃": b.ORD,
		"∄": b.ORD,
		"∇": b.ORD,
		"∏": b.OP,
		"∐": b.OP,
		"∑": b.OP,
		"−": b.BIN0,
		"∓": b.BIN0,
		"√": [
			3,
			0,
			o.ORD,
			{ stretchy: !0 }
		],
		"∛": b.ORD30,
		"∜": b.ORD30,
		"∟": b.ORD,
		"∠": b.ORD,
		"∡": b.ORD,
		"∢": b.ORD,
		"∫": b.INTEGRAL,
		"∬": b.INTEGRAL,
		"∭": b.INTEGRAL,
		"∮": b.INTEGRAL,
		"∯": b.INTEGRAL,
		"∰": b.INTEGRAL,
		"∱": b.INTEGRAL,
		"∲": b.INTEGRAL,
		"∳": b.INTEGRAL,
		"∴": b.REL,
		"∵": b.REL,
		"∼": [
			0,
			0,
			o.REL,
			{}
		],
		"⊾": b.ORD,
		"⊿": b.ORD,
		"⋀": b.OP,
		"⋁": b.OP,
		"⋂": b.OP,
		"⋃": b.OP,
		"⌈": b.OPEN,
		"⌊": b.OPEN,
		"⌐": b.ORD,
		"⌙": b.ORD,
		"❲": b.OPEN,
		"➕": b.ORD,
		"➖": b.ORD,
		"⟀": b.ORD,
		"⟦": b.OPEN,
		"⟨": b.OPEN,
		"⟪": b.OPEN,
		"⟬": b.OPEN,
		"⟮": b.OPEN,
		"⦀": b.FENCE,
		"⦃": b.OPEN,
		"⦅": b.OPEN,
		"⦇": b.OPEN,
		"⦉": b.OPEN,
		"⦋": b.OPEN,
		"⦍": b.OPEN,
		"⦏": b.OPEN,
		"⦑": b.OPEN,
		"⦓": b.OPEN,
		"⦕": b.OPEN,
		"⦗": b.OPEN,
		"⦙": b.FENCE,
		"⦛": b.ORD,
		"⦜": b.ORD,
		"⦝": b.ORD,
		"⦞": b.ORD,
		"⦟": b.ORD,
		"⦠": b.ORD,
		"⦡": b.ORD,
		"⦢": b.ORD,
		"⦣": b.ORD,
		"⦤": b.ORD,
		"⦥": b.ORD,
		"⦦": b.ORD,
		"⦧": b.ORD,
		"⦨": b.ORD,
		"⦩": b.ORD,
		"⦪": b.ORD,
		"⦫": b.ORD,
		"⦬": b.ORD,
		"⦭": b.ORD,
		"⦮": b.ORD,
		"⦯": b.ORD,
		"⧘": b.OPEN,
		"⧚": b.OPEN,
		"⧼": b.OPEN,
		"⨀": b.OP,
		"⨁": b.OP,
		"⨂": b.OP,
		"⨃": b.OP,
		"⨄": b.OP,
		"⨅": b.OP,
		"⨆": b.OP,
		"⨇": b.OP,
		"⨈": b.OP,
		"⨉": b.OP,
		"⨊": b.OP,
		"⨋": b.INTEGRAL,
		"⨌": b.INTEGRAL,
		"⨍": b.INTEGRAL,
		"⨎": b.INTEGRAL,
		"⨏": b.INTEGRAL,
		"⨐": b.INTEGRAL,
		"⨑": b.INTEGRAL,
		"⨒": b.INTEGRAL,
		"⨓": b.INTEGRAL,
		"⨔": b.INTEGRAL,
		"⨕": b.INTEGRAL,
		"⨖": b.INTEGRAL,
		"⨗": b.INTEGRAL,
		"⨘": b.INTEGRAL,
		"⨙": b.INTEGRAL,
		"⨚": b.INTEGRAL,
		"⨛": b.INTEGRAL,
		"⨜": b.INTEGRAL,
		"⨝": b.OP,
		"⨞": b.OP,
		"⫬": b.ORD,
		"⫭": b.ORD,
		"⫼": b.OP,
		"⫿": b.OP,
		"〈": b.OPEN
	},
	postfix: {
		"!!": b.BIN0,
		"!": b.CLOSE0,
		"\"": b.ORD,
		"%": b.ORD,
		"&": b.ORD,
		"'": b.ACCENT,
		")": b.CLOSE,
		"++": b.BIN0,
		"--": b.BIN0,
		"]": b.CLOSE,
		"^": b.WIDEACCENT,
		_: b.WIDEACCENT,
		"`": b.ACCENT,
		"|": b.CLOSE,
		"||": b.BIN0,
		"}": b.CLOSE,
		"~": b.WIDEACCENT,
		"¨": b.ACCENT,
		"¯": b.WIDEACCENT,
		"°": b.ACCENT,
		"²": b.ORD,
		"³": b.ORD,
		"´": b.ACCENT,
		"¸": b.ACCENT,
		"¹": b.ORD,
		ˆ: b.WIDEACCENT,
		ˇ: b.WIDEACCENT,
		ˉ: b.WIDEACCENT,
		ˊ: b.ACCENT,
		ˋ: b.ACCENT,
		ˍ: b.WIDEACCENT,
		"˘": b.ACCENT,
		"˙": b.ACCENT,
		"˚": b.ACCENT,
		"˜": b.WIDEACCENT,
		"˝": b.ACCENT,
		"˷": b.WIDEACCENT,
		"̂": b.WIDEACCENT,
		"̑": b.ACCENT,
		"‖": b.FENCE,
		"’": b.CLOSE0,
		"‚": b.ORD,
		"‛": b.ORD,
		"”": b.CLOSE0,
		"„": b.ORD,
		"‟": b.ORD,
		"′": b.ORD,
		"″": b.ORD,
		"‴": b.ORD,
		"‵": b.ORD,
		"‶": b.ORD,
		"‷": b.ORD,
		"‾": b.WIDEACCENT,
		"⁗": b.ORD,
		"⃛": b.ACCENT,
		"⃜": b.ACCENT,
		"⌉": b.CLOSE,
		"⌋": b.CLOSE,
		"⌢": b.RELSTRETCH0,
		"⌣": b.RELSTRETCH0,
		"⎴": b.WIDEACCENT,
		"⎵": b.WIDEACCENT,
		"⏍": b.ORD,
		"⏜": b.WIDEACCENT,
		"⏝": b.WIDEACCENT,
		"⏞": b.WIDEACCENT,
		"⏟": b.WIDEACCENT,
		"⏠": b.WIDEACCENT,
		"⏡": b.WIDEACCENT,
		"❳": b.CLOSE,
		"⟧": b.CLOSE,
		"⟩": b.CLOSE,
		"⟫": b.CLOSE,
		"⟭": b.CLOSE,
		"⟯": b.CLOSE,
		"⦀": b.FENCE,
		"⦄": b.CLOSE,
		"⦆": b.CLOSE,
		"⦈": b.CLOSE,
		"⦊": b.CLOSE,
		"⦌": b.CLOSE,
		"⦎": b.CLOSE,
		"⦐": b.CLOSE,
		"⦒": b.CLOSE,
		"⦔": b.CLOSE,
		"⦖": b.CLOSE,
		"⦘": b.CLOSE,
		"⦙": b.FENCE,
		"⧙": b.CLOSE,
		"⧛": b.CLOSE,
		"⧽": b.CLOSE,
		"〉": b.CLOSE,
		"𞻰": b.BINSTRETCH0,
		"𞻱": b.BINSTRETCH0
	},
	infix: {
		"!": b.ORD,
		"!=": b.BIN5,
		"#": b.ORD,
		$: b.ORD,
		"%": b.ORD3,
		"&&": b.BIN4,
		"**": b.BIN3,
		"*": b.BIN3,
		"*=": b.BIN5,
		"+": b.BIN4,
		"+=": b.BIN5,
		",": b.PUNCT03,
		"": b.ORD,
		"-": b.BIN4,
		"-=": b.BIN5,
		"->": b.BIN5,
		".": b.ORD3,
		"..": b.BIN3,
		"...": b.INNER,
		"/": [
			4,
			4,
			o.ORD,
			{}
		],
		"//": b.BIN5,
		"/=": b.BIN5,
		":": [
			0,
			3,
			o.REL,
			{}
		],
		":=": b.BIN5,
		";": b.PUNCT03,
		"<": b.REL,
		"<=": b.REL,
		"<>": [
			3,
			3,
			o.REL,
			{}
		],
		"=": b.REL,
		"==": b.REL,
		">": b.REL,
		">=": b.REL,
		"?": [
			3,
			3,
			o.CLOSE,
			{ fence: !0 }
		],
		"@": b.ORD3,
		"\\": b.ORD,
		"^": [
			3,
			3,
			o.ORD,
			{
				accent: !0,
				stretchy: !0
			}
		],
		_: b.WIDEACCENT,
		"|": [
			5,
			5,
			o.ORD,
			{}
		],
		"||": b.BIN5,
		"±": b.BIN4,
		"·": b.BIN3,
		"×": b.BIN3,
		"÷": b.BIN4,
		ʹ: b.ORD,
		"̀": b.ACCENT,
		"́": b.ACCENT,
		"̃": b.WIDEACCENT,
		"̄": b.ACCENT,
		"̆": b.ACCENT,
		"̇": b.ACCENT,
		"̈": b.ACCENT,
		"̌": b.ACCENT,
		"̲": b.WIDEACCENT,
		"̸": b.REL,
		"϶": b.REL,
		"―": b.ORDSTRETCH0,
		"‗": b.ORDSTRETCH0,
		"†": b.BIN3,
		"‡": b.BIN3,
		"•": b.BIN3,
		"…": b.INNER,
		"⁃": b.BIN3,
		"⁄": b.STRETCH4,
		"⁡": b.NONE,
		"⁢": b.NONE,
		"⁣": [
			0,
			0,
			o.NONE,
			{ linebreakstyle: "after" }
		],
		"⁤": b.NONE,
		"⃗": b.ACCENT,
		ℑ: b.ORD,
		ℓ: b.ORD,
		℘: b.ORD,
		ℜ: b.ORD,
		"←": b.WIDEREL,
		"↑": b.RELSTRETCH,
		"→": b.WIDEREL,
		"↓": b.RELSTRETCH,
		"↔": b.WIDEREL,
		"↕": b.RELSTRETCH,
		"↖": b.REL,
		"↗": b.REL,
		"↘": b.REL,
		"↙": b.REL,
		"↚": b.WIDEREL,
		"↛": b.WIDEREL,
		"↜": b.WIDEREL,
		"↝": b.WIDEREL,
		"↞": b.WIDEREL,
		"↟": b.RELSTRETCH,
		"↠": b.WIDEREL,
		"↡": b.RELSTRETCH,
		"↢": b.WIDEREL,
		"↣": b.WIDEREL,
		"↤": b.WIDEREL,
		"↥": b.RELSTRETCH,
		"↦": b.WIDEREL,
		"↧": b.RELSTRETCH,
		"↨": b.RELSTRETCH,
		"↩": b.WIDEREL,
		"↪": b.WIDEREL,
		"↫": b.WIDEREL,
		"↬": b.WIDEREL,
		"↭": b.WIDEREL,
		"↮": b.WIDEREL,
		"↯": b.REL,
		"↰": b.RELSTRETCH,
		"↱": b.RELSTRETCH,
		"↲": b.RELSTRETCH,
		"↳": b.RELSTRETCH,
		"↴": b.RELSTRETCH,
		"↵": b.RELSTRETCH,
		"↶": b.REL,
		"↷": b.REL,
		"↸": b.REL,
		"↹": b.WIDEREL,
		"↺": b.REL,
		"↻": b.REL,
		"↼": b.WIDEREL,
		"↽": b.WIDEREL,
		"↾": b.RELSTRETCH,
		"↿": b.RELSTRETCH,
		"⇀": b.WIDEREL,
		"⇁": b.WIDEREL,
		"⇂": b.RELSTRETCH,
		"⇃": b.RELSTRETCH,
		"⇄": b.WIDEREL,
		"⇅": b.RELSTRETCH,
		"⇆": b.WIDEREL,
		"⇇": b.WIDEREL,
		"⇈": b.RELSTRETCH,
		"⇉": b.WIDEREL,
		"⇊": b.RELSTRETCH,
		"⇋": b.WIDEREL,
		"⇌": b.WIDEREL,
		"⇍": b.WIDEREL,
		"⇎": b.WIDEREL,
		"⇏": b.WIDEREL,
		"⇐": b.WIDEREL,
		"⇑": b.RELSTRETCH,
		"⇒": b.WIDEREL,
		"⇓": b.RELSTRETCH,
		"⇔": b.WIDEREL,
		"⇕": b.RELSTRETCH,
		"⇖": b.REL,
		"⇗": b.REL,
		"⇘": b.REL,
		"⇙": b.REL,
		"⇚": b.WIDEREL,
		"⇛": b.WIDEREL,
		"⇜": b.WIDEREL,
		"⇝": b.WIDEREL,
		"⇞": b.RELSTRETCH,
		"⇟": b.RELSTRETCH,
		"⇠": b.WIDEREL,
		"⇡": b.RELSTRETCH,
		"⇢": b.WIDEREL,
		"⇣": b.RELSTRETCH,
		"⇤": b.WIDEREL,
		"⇥": b.WIDEREL,
		"⇦": b.WIDEREL,
		"⇧": b.RELSTRETCH,
		"⇨": b.WIDEREL,
		"⇩": b.RELSTRETCH,
		"⇪": b.RELSTRETCH,
		"⇫": b.RELSTRETCH,
		"⇬": b.RELSTRETCH,
		"⇭": b.RELSTRETCH,
		"⇮": b.RELSTRETCH,
		"⇯": b.RELSTRETCH,
		"⇰": b.WIDEREL,
		"⇱": b.REL,
		"⇲": b.REL,
		"⇳": b.RELSTRETCH,
		"⇴": b.WIDEREL,
		"⇵": b.RELSTRETCH,
		"⇶": b.WIDEREL,
		"⇷": b.WIDEREL,
		"⇸": b.WIDEREL,
		"⇹": b.WIDEREL,
		"⇺": b.WIDEREL,
		"⇻": b.WIDEREL,
		"⇼": b.WIDEREL,
		"⇽": b.WIDEREL,
		"⇾": b.WIDEREL,
		"⇿": b.WIDEREL,
		"∅": b.ORD,
		"∆": b.ORD,
		"∈": b.REL,
		"∉": b.REL,
		"∊": b.REL,
		"∋": b.REL,
		"∌": b.REL,
		"∍": b.REL,
		"−": b.BIN4,
		"∓": b.BIN4,
		"∔": b.BIN4,
		"∕": b.STRETCH4,
		"∖": b.BIN4,
		"∗": b.BIN3,
		"∘": b.BIN3,
		"∙": b.BIN3,
		"∝": b.REL,
		"∞": b.ORD,
		"∣": b.REL,
		"∤": b.REL,
		"∥": b.REL,
		"∦": b.REL,
		"∧": b.BIN4,
		"∨": b.BIN4,
		"∩": b.BIN4,
		"∪": b.BIN4,
		"∶": b.BIN4,
		"∷": b.REL,
		"∸": b.BIN4,
		"∹": b.REL,
		"∺": b.REL,
		"∻": b.REL,
		"∼": b.REL,
		"∽": b.REL,
		"∾": b.REL,
		"≀": b.BIN3,
		"≁": b.REL,
		"≂": b.REL,
		"≂̸": b.REL,
		"≃": b.REL,
		"≄": b.REL,
		"≅": b.REL,
		"≆": b.REL,
		"≇": b.REL,
		"≈": b.REL,
		"≉": b.REL,
		"≊": b.REL,
		"≋": b.REL,
		"≌": b.REL,
		"≍": b.REL,
		"≎": b.REL,
		"≏": b.REL,
		"≐": b.REL,
		"≑": b.REL,
		"≒": b.REL,
		"≓": b.REL,
		"≔": b.REL,
		"≕": b.REL,
		"≖": b.REL,
		"≗": b.REL,
		"≘": b.REL,
		"≙": b.REL,
		"≚": b.REL,
		"≛": b.REL,
		"≜": b.REL,
		"≝": b.REL,
		"≞": b.REL,
		"≟": b.REL,
		"≠": b.REL,
		"≡": b.REL,
		"≢": b.REL,
		"≣": b.REL,
		"≤": b.REL,
		"≥": b.REL,
		"≦": b.REL,
		"≦̸": b.REL,
		"≧": b.REL,
		"≧̸": b.REL,
		"≨": b.REL,
		"≩": b.REL,
		"≪": b.REL,
		"≪̸": b.REL,
		"≫": b.REL,
		"≫̸": b.REL,
		"≬": b.REL,
		"≭": b.REL,
		"≮": b.REL,
		"≯": b.REL,
		"≰": b.REL,
		"≱": b.REL,
		"≲": b.REL,
		"≳": b.REL,
		"≴": b.REL,
		"≵": b.REL,
		"≶": b.REL,
		"≷": b.REL,
		"≸": b.REL,
		"≹": b.REL,
		"≺": b.REL,
		"≻": b.REL,
		"≼": b.REL,
		"≽": b.REL,
		"≾": b.REL,
		"≾̸": b.REL,
		"≿": b.REL,
		"≿̸": b.REL,
		"⊀": b.REL,
		"⊁": b.REL,
		"⊂": b.REL,
		"⊃": b.REL,
		"⊄": b.REL,
		"⊅": b.REL,
		"⊆": b.REL,
		"⊇": b.REL,
		"⊈": b.REL,
		"⊉": b.REL,
		"⊊": b.REL,
		"⊋": b.REL,
		"⊌": b.BIN4,
		"⊍": b.BIN4,
		"⊎": b.BIN4,
		"⊏": b.REL,
		"⊏̸": b.REL,
		"⊐": b.REL,
		"⊐̸": b.REL,
		"⊑": b.REL,
		"⊒": b.REL,
		"⊓": b.BIN4,
		"⊔": b.BIN4,
		"⊕": b.BIN4,
		"⊖": b.BIN4,
		"⊗": b.BIN3,
		"⊘": b.BIN4,
		"⊙": b.BIN3,
		"⊚": b.BIN3,
		"⊛": b.BIN3,
		"⊜": b.REL,
		"⊝": b.BIN4,
		"⊞": b.BIN4,
		"⊟": b.BIN4,
		"⊠": b.BIN3,
		"⊡": b.BIN3,
		"⊢": b.REL,
		"⊣": b.REL,
		"⊤": b.ORD,
		"⊥": b.ORD,
		"⊦": b.REL,
		"⊧": b.REL,
		"⊨": b.REL,
		"⊩": b.REL,
		"⊪": b.REL,
		"⊫": b.REL,
		"⊬": b.REL,
		"⊭": b.REL,
		"⊮": b.REL,
		"⊯": b.REL,
		"⊰": b.REL,
		"⊱": b.REL,
		"⊲": b.REL,
		"⊳": b.REL,
		"⊴": b.REL,
		"⊵": b.REL,
		"⊶": b.REL,
		"⊷": b.REL,
		"⊸": b.REL,
		"⊺": b.BIN3,
		"⊻": b.BIN4,
		"⊼": b.BIN4,
		"⊽": b.BIN4,
		"⋄": b.BIN3,
		"⋅": b.BIN3,
		"⋆": b.BIN3,
		"⋇": b.BIN3,
		"⋈": b.REL,
		"⋉": b.BIN3,
		"⋊": b.BIN3,
		"⋋": b.BIN3,
		"⋌": b.BIN3,
		"⋍": b.REL,
		"⋎": b.BIN4,
		"⋏": b.BIN4,
		"⋐": b.REL,
		"⋑": b.REL,
		"⋒": b.BIN4,
		"⋓": b.BIN4,
		"⋔": b.REL,
		"⋕": b.REL,
		"⋖": b.REL,
		"⋗": b.REL,
		"⋘": b.REL,
		"⋙": b.REL,
		"⋚": b.REL,
		"⋛": b.REL,
		"⋜": b.REL,
		"⋝": b.REL,
		"⋞": b.REL,
		"⋟": b.REL,
		"⋠": b.REL,
		"⋡": b.REL,
		"⋢": b.REL,
		"⋣": b.REL,
		"⋤": b.REL,
		"⋥": b.REL,
		"⋦": b.REL,
		"⋧": b.REL,
		"⋨": b.REL,
		"⋩": b.REL,
		"⋪": b.REL,
		"⋫": b.REL,
		"⋬": b.REL,
		"⋭": b.REL,
		"⋮": b.ORD,
		"⋯": b.INNER,
		"⋰": b.INNER,
		"⋱": b.INNER,
		"⋲": b.REL,
		"⋳": b.REL,
		"⋴": b.REL,
		"⋵": b.REL,
		"⋶": b.REL,
		"⋷": b.REL,
		"⋸": b.REL,
		"⋹": b.REL,
		"⋺": b.REL,
		"⋻": b.REL,
		"⋼": b.REL,
		"⋽": b.REL,
		"⋾": b.REL,
		"⋿": b.REL,
		"⌁": b.REL,
		"⌅": b.BIN3,
		"⌆": b.BIN3,
		"〈": b.OPEN,
		"〉": b.CLOSE,
		"⍼": b.REL,
		"⎋": b.REL,
		"⎪": b.ORD,
		"⎯": b.ORDSTRETCH0,
		"⎰": b.OPEN,
		"⎱": b.CLOSE,
		"─": b.ORD,
		"△": b.BIN3,
		"▵": b.BIN3,
		"▹": b.BIN3,
		"▽": b.BIN3,
		"▿": b.BIN3,
		"◃": b.BIN3,
		"◯": b.BIN3,
		"♠": b.ORD,
		"♡": b.ORD,
		"♢": b.ORD,
		"♣": b.ORD,
		"♭": b.ORD,
		"♮": b.ORD,
		"♯": b.ORD,
		"❘": [
			5,
			5,
			o.REL,
			{
				stretchy: !0,
				symmetric: !0
			}
		],
		"➔": b.WIDEREL,
		"➕": b.BIN4,
		"➖": b.BIN4,
		"➗": b.BIN4,
		"➘": b.REL,
		"➙": b.WIDEREL,
		"➚": b.REL,
		"➛": b.WIDEREL,
		"➜": b.WIDEREL,
		"➝": b.WIDEREL,
		"➞": b.WIDEREL,
		"➟": b.WIDEREL,
		"➠": b.WIDEREL,
		"➡": b.WIDEREL,
		"➥": b.WIDEREL,
		"➦": b.WIDEREL,
		"➧": b.RELACCENT,
		"➨": b.WIDEREL,
		"➩": b.WIDEREL,
		"➪": b.WIDEREL,
		"➫": b.WIDEREL,
		"➬": b.WIDEREL,
		"➭": b.WIDEREL,
		"➮": b.WIDEREL,
		"➯": b.WIDEREL,
		"➱": b.WIDEREL,
		"➲": b.RELACCENT,
		"➳": b.WIDEREL,
		"➴": b.REL,
		"➵": b.WIDEREL,
		"➶": b.REL,
		"➷": b.REL,
		"➸": b.WIDEREL,
		"➹": b.REL,
		"➺": b.WIDEREL,
		"➻": b.WIDEREL,
		"➼": b.WIDEREL,
		"➽": b.WIDEREL,
		"➾": b.WIDEREL,
		"⟂": b.REL,
		"⟂̸": b.REL,
		"⟋": b.BIN3,
		"⟍": b.BIN3,
		"⟰": b.RELSTRETCH,
		"⟱": b.RELSTRETCH,
		"⟲": b.REL,
		"⟳": b.REL,
		"⟴": b.RELSTRETCH,
		"⟵": b.WIDEREL,
		"⟶": b.WIDEREL,
		"⟷": b.WIDEREL,
		"⟸": b.WIDEREL,
		"⟹": b.WIDEREL,
		"⟺": b.WIDEREL,
		"⟻": b.WIDEREL,
		"⟼": b.WIDEREL,
		"⟽": b.WIDEREL,
		"⟾": b.WIDEREL,
		"⟿": b.WIDEREL,
		"⤀": b.WIDEREL,
		"⤁": b.WIDEREL,
		"⤂": b.WIDEREL,
		"⤃": b.WIDEREL,
		"⤄": b.WIDEREL,
		"⤅": b.WIDEREL,
		"⤆": b.WIDEREL,
		"⤇": b.WIDEREL,
		"⤈": b.RELSTRETCH,
		"⤉": b.RELSTRETCH,
		"⤊": b.RELSTRETCH,
		"⤋": b.RELSTRETCH,
		"⤌": b.WIDEREL,
		"⤍": b.WIDEREL,
		"⤎": b.WIDEREL,
		"⤏": b.WIDEREL,
		"⤐": b.WIDEREL,
		"⤑": b.WIDEREL,
		"⤒": b.RELSTRETCH,
		"⤓": b.RELSTRETCH,
		"⤔": b.WIDEREL,
		"⤕": b.WIDEREL,
		"⤖": b.WIDEREL,
		"⤗": b.WIDEREL,
		"⤘": b.WIDEREL,
		"⤙": b.WIDEREL,
		"⤚": b.WIDEREL,
		"⤛": b.WIDEREL,
		"⤜": b.WIDEREL,
		"⤝": b.WIDEREL,
		"⤞": b.WIDEREL,
		"⤟": b.WIDEREL,
		"⤠": b.WIDEREL,
		"⤡": b.REL,
		"⤢": b.REL,
		"⤣": b.REL,
		"⤤": b.REL,
		"⤥": b.REL,
		"⤦": b.REL,
		"⤧": b.REL,
		"⤨": b.REL,
		"⤩": b.REL,
		"⤪": b.REL,
		"⤫": b.REL,
		"⤬": b.REL,
		"⤭": b.REL,
		"⤮": b.REL,
		"⤯": b.REL,
		"⤰": b.REL,
		"⤱": b.REL,
		"⤲": b.REL,
		"⤳": b.RELACCENT,
		"⤴": b.RELSTRETCH,
		"⤵": b.RELSTRETCH,
		"⤶": b.RELSTRETCH,
		"⤷": b.RELSTRETCH,
		"⤸": b.REL,
		"⤹": b.REL,
		"⤺": b.RELACCENT,
		"⤻": b.RELACCENT,
		"⤼": b.RELACCENT,
		"⤽": b.RELACCENT,
		"⤾": b.REL,
		"⤿": b.REL,
		"⥀": b.REL,
		"⥁": b.REL,
		"⥂": b.WIDEREL,
		"⥃": b.WIDEREL,
		"⥄": b.WIDEREL,
		"⥅": b.RELSTRETCH,
		"⥆": b.RELSTRETCH,
		"⥇": b.WIDEREL,
		"⥈": b.WIDEREL,
		"⥉": b.RELSTRETCH,
		"⥊": b.WIDEREL,
		"⥋": b.WIDEREL,
		"⥌": b.RELSTRETCH,
		"⥍": b.RELSTRETCH,
		"⥎": b.WIDEREL,
		"⥏": b.RELSTRETCH,
		"⥐": b.WIDEREL,
		"⥑": b.RELSTRETCH,
		"⥒": b.WIDEREL,
		"⥓": b.WIDEREL,
		"⥔": b.RELSTRETCH,
		"⥕": b.RELSTRETCH,
		"⥖": b.WIDEREL,
		"⥗": b.WIDEREL,
		"⥘": b.RELSTRETCH,
		"⥙": b.RELSTRETCH,
		"⥚": b.WIDEREL,
		"⥛": b.WIDEREL,
		"⥜": b.RELSTRETCH,
		"⥝": b.RELSTRETCH,
		"⥞": b.WIDEREL,
		"⥟": b.WIDEREL,
		"⥠": b.RELSTRETCH,
		"⥡": b.RELSTRETCH,
		"⥢": b.WIDEREL,
		"⥣": b.RELSTRETCH,
		"⥤": b.WIDEREL,
		"⥥": b.RELSTRETCH,
		"⥦": b.WIDEREL,
		"⥧": b.WIDEREL,
		"⥨": b.WIDEREL,
		"⥩": b.WIDEREL,
		"⥪": b.WIDEREL,
		"⥫": b.WIDEREL,
		"⥬": b.WIDEREL,
		"⥭": b.WIDEREL,
		"⥮": b.RELSTRETCH,
		"⥯": b.RELSTRETCH,
		"⥰": b.WIDEREL,
		"⥱": b.WIDEREL,
		"⥲": b.WIDEREL,
		"⥳": b.WIDEREL,
		"⥴": b.WIDEREL,
		"⥵": b.WIDEREL,
		"⥶": b.RELACCENT,
		"⥷": b.RELACCENT,
		"⥸": b.RELACCENT,
		"⥹": b.RELACCENT,
		"⥺": b.RELACCENT,
		"⥻": b.RELACCENT,
		"⥼": b.WIDEREL,
		"⥽": b.WIDEREL,
		"⥾": b.RELSTRETCH,
		"⥿": b.RELSTRETCH,
		"⦁": b.REL,
		"⦂": b.REL,
		"⦶": b.REL,
		"⦷": b.REL,
		"⦸": b.BIN4,
		"⦹": b.REL,
		"⦼": b.BIN4,
		"⧀": b.REL,
		"⧁": b.REL,
		"⧄": b.BIN4,
		"⧅": b.BIN4,
		"⧆": b.BIN3,
		"⧇": b.BIN3,
		"⧈": b.BIN3,
		"⧎": b.REL,
		"⧏": b.REL,
		"⧐": b.REL,
		"⧑": b.REL,
		"⧒": b.REL,
		"⧓": b.REL,
		"⧔": b.BIN3,
		"⧕": b.BIN3,
		"⧖": b.BIN3,
		"⧗": b.BIN3,
		"⧟": b.REL,
		"⧡": b.REL,
		"⧢": b.BIN3,
		"⧣": b.REL,
		"⧤": b.REL,
		"⧥": b.REL,
		"⧦": b.REL,
		"⧴": b.REL,
		"⧵": b.BIN4,
		"⧶": b.BIN4,
		"⧷": b.BIN4,
		"⧸": b.BIN4,
		"⧹": b.BIN4,
		"⧺": b.BIN4,
		"⧻": b.BIN4,
		"⨝": b.BIN3,
		"⨞": b.BIN3,
		"⨟": b.BIN4,
		"⨠": b.BIN4,
		"⨡": b.BIN4,
		"⨢": b.BIN4,
		"⨣": b.BIN4,
		"⨤": b.BIN4,
		"⨥": b.BIN4,
		"⨦": b.BIN4,
		"⨧": b.BIN4,
		"⨨": b.BIN4,
		"⨩": b.BIN4,
		"⨪": b.BIN4,
		"⨫": b.BIN4,
		"⨬": b.BIN4,
		"⨭": b.BIN4,
		"⨮": b.BIN4,
		"⨯": b.BIN3,
		"⨰": b.BIN3,
		"⨱": b.BIN3,
		"⨲": b.BIN3,
		"⨳": b.BIN3,
		"⨴": b.BIN3,
		"⨵": b.BIN3,
		"⨶": b.BIN3,
		"⨷": b.BIN3,
		"⨸": b.BIN4,
		"⨹": b.BIN4,
		"⨺": b.BIN4,
		"⨻": b.BIN3,
		"⨼": b.BIN3,
		"⨽": b.BIN3,
		"⨾": b.BIN4,
		"⨿": b.BIN3,
		"⩀": b.BIN4,
		"⩁": b.BIN4,
		"⩂": b.BIN4,
		"⩃": b.BIN4,
		"⩄": b.BIN4,
		"⩅": b.BIN4,
		"⩆": b.BIN4,
		"⩇": b.BIN4,
		"⩈": b.BIN4,
		"⩉": b.BIN4,
		"⩊": b.BIN4,
		"⩋": b.BIN4,
		"⩌": b.BIN4,
		"⩍": b.BIN4,
		"⩎": b.BIN4,
		"⩏": b.BIN4,
		"⩐": b.BIN3,
		"⩑": b.BIN4,
		"⩒": b.BIN4,
		"⩓": b.BIN4,
		"⩔": b.BIN4,
		"⩕": b.BIN4,
		"⩖": b.BIN4,
		"⩗": b.BIN4,
		"⩘": b.BIN4,
		"⩙": b.BIN4,
		"⩚": b.BIN4,
		"⩛": b.BIN4,
		"⩜": b.BIN4,
		"⩝": b.BIN4,
		"⩞": b.BIN4,
		"⩟": b.BIN4,
		"⩠": b.BIN4,
		"⩡": b.BIN4,
		"⩢": b.BIN4,
		"⩣": b.BIN4,
		"⩤": b.BIN3,
		"⩥": b.BIN3,
		"⩦": b.REL,
		"⩧": b.REL,
		"⩨": b.REL,
		"⩩": b.REL,
		"⩪": b.REL,
		"⩫": b.REL,
		"⩬": b.REL,
		"⩭": b.REL,
		"⩮": b.REL,
		"⩯": b.REL,
		"⩰": b.REL,
		"⩱": b.REL,
		"⩲": b.REL,
		"⩳": b.REL,
		"⩴": b.REL,
		"⩵": b.REL,
		"⩶": b.REL,
		"⩷": b.REL,
		"⩸": b.REL,
		"⩹": b.REL,
		"⩺": b.REL,
		"⩻": b.REL,
		"⩼": b.REL,
		"⩽": b.REL,
		"⩽̸": b.REL,
		"⩾": b.REL,
		"⩾̸": b.REL,
		"⩿": b.REL,
		"⪀": b.REL,
		"⪁": b.REL,
		"⪂": b.REL,
		"⪃": b.REL,
		"⪄": b.REL,
		"⪅": b.REL,
		"⪆": b.REL,
		"⪇": b.REL,
		"⪈": b.REL,
		"⪉": b.REL,
		"⪊": b.REL,
		"⪋": b.REL,
		"⪌": b.REL,
		"⪍": b.REL,
		"⪎": b.REL,
		"⪏": b.REL,
		"⪐": b.REL,
		"⪑": b.REL,
		"⪒": b.REL,
		"⪓": b.REL,
		"⪔": b.REL,
		"⪕": b.REL,
		"⪖": b.REL,
		"⪗": b.REL,
		"⪘": b.REL,
		"⪙": b.REL,
		"⪚": b.REL,
		"⪛": b.REL,
		"⪜": b.REL,
		"⪝": b.REL,
		"⪞": b.REL,
		"⪟": b.REL,
		"⪠": b.REL,
		"⪡": b.REL,
		"⪢": b.REL,
		"⪣": b.REL,
		"⪤": b.REL,
		"⪥": b.REL,
		"⪦": b.REL,
		"⪧": b.REL,
		"⪨": b.REL,
		"⪩": b.REL,
		"⪪": b.REL,
		"⪫": b.REL,
		"⪬": b.REL,
		"⪭": b.REL,
		"⪮": b.REL,
		"⪯": b.REL,
		"⪯̸": b.REL,
		"⪰": b.REL,
		"⪰̸": b.REL,
		"⪱": b.REL,
		"⪲": b.REL,
		"⪳": b.REL,
		"⪴": b.REL,
		"⪵": b.REL,
		"⪶": b.REL,
		"⪷": b.REL,
		"⪸": b.REL,
		"⪹": b.REL,
		"⪺": b.REL,
		"⪻": b.REL,
		"⪼": b.REL,
		"⪽": b.REL,
		"⪾": b.REL,
		"⪿": b.REL,
		"⫀": b.REL,
		"⫁": b.REL,
		"⫂": b.REL,
		"⫃": b.REL,
		"⫄": b.REL,
		"⫅": b.REL,
		"⫆": b.REL,
		"⫇": b.REL,
		"⫈": b.REL,
		"⫉": b.REL,
		"⫊": b.REL,
		"⫋": b.REL,
		"⫌": b.REL,
		"⫍": b.REL,
		"⫎": b.REL,
		"⫏": b.REL,
		"⫐": b.REL,
		"⫑": b.REL,
		"⫒": b.REL,
		"⫓": b.REL,
		"⫔": b.REL,
		"⫕": b.REL,
		"⫖": b.REL,
		"⫗": b.REL,
		"⫘": b.REL,
		"⫙": b.REL,
		"⫚": b.REL,
		"⫛": b.BIN4,
		"⫝": b.BIN3,
		"⫝̸": b.REL,
		"⫞": b.REL,
		"⫟": b.REL,
		"⫠": b.REL,
		"⫡": b.REL,
		"⫢": b.REL,
		"⫣": b.REL,
		"⫤": b.REL,
		"⫥": b.REL,
		"⫦": b.REL,
		"⫧": b.REL,
		"⫨": b.REL,
		"⫩": b.REL,
		"⫪": b.REL,
		"⫫": b.REL,
		"⫮": b.REL,
		"⫲": b.REL,
		"⫳": b.REL,
		"⫴": b.REL,
		"⫵": b.REL,
		"⫶": b.BIN4,
		"⫷": b.REL,
		"⫸": b.REL,
		"⫹": b.REL,
		"⫺": b.REL,
		"⫻": b.BIN4,
		"⫽": b.BIN4,
		"⫾": b.BIN3,
		"⬀": b.REL,
		"⬁": b.REL,
		"⬂": b.REL,
		"⬃": b.REL,
		"⬄": b.WIDEREL,
		"⬅": b.WIDEREL,
		"⬆": b.RELSTRETCH,
		"⬇": b.RELSTRETCH,
		"⬈": b.REL,
		"⬉": b.REL,
		"⬊": b.REL,
		"⬋": b.REL,
		"⬌": b.WIDEREL,
		"⬍": b.RELSTRETCH,
		"⬎": b.RELSTRETCH,
		"⬏": b.RELSTRETCH,
		"⬐": b.RELSTRETCH,
		"⬑": b.RELSTRETCH,
		"⬰": b.WIDEREL,
		"⬱": b.WIDEREL,
		"⬲": b.RELSTRETCH,
		"⬳": b.WIDEREL,
		"⬴": b.WIDEREL,
		"⬵": b.WIDEREL,
		"⬶": b.WIDEREL,
		"⬷": b.WIDEREL,
		"⬸": b.WIDEREL,
		"⬹": b.WIDEREL,
		"⬺": b.WIDEREL,
		"⬻": b.WIDEREL,
		"⬼": b.WIDEREL,
		"⬽": b.WIDEREL,
		"⬾": b.WIDEREL,
		"⬿": b.RELACCENT,
		"⭀": b.WIDEREL,
		"⭁": b.WIDEREL,
		"⭂": b.WIDEREL,
		"⭃": b.WIDEREL,
		"⭄": b.WIDEREL,
		"⭅": b.WIDEREL,
		"⭆": b.WIDEREL,
		"⭇": b.WIDEREL,
		"⭈": b.WIDEREL,
		"⭉": b.WIDEREL,
		"⭊": b.WIDEREL,
		"⭋": b.WIDEREL,
		"⭌": b.WIDEREL,
		"⭍": b.REL,
		"⭎": b.REL,
		"⭏": b.REL,
		"⭚": b.REL,
		"⭛": b.REL,
		"⭜": b.REL,
		"⭝": b.REL,
		"⭞": b.REL,
		"⭟": b.REL,
		"⭠": b.WIDEREL,
		"⭡": b.RELSTRETCH,
		"⭢": b.WIDEREL,
		"⭣": b.RELSTRETCH,
		"⭤": b.WIDEREL,
		"⭥": b.RELSTRETCH,
		"⭦": b.REL,
		"⭧": b.REL,
		"⭨": b.REL,
		"⭩": b.REL,
		"⭪": b.WIDEREL,
		"⭫": b.RELSTRETCH,
		"⭬": b.WIDEREL,
		"⭭": b.RELSTRETCH,
		"⭮": b.REL,
		"⭯": b.REL,
		"⭰": b.WIDEREL,
		"⭱": b.RELSTRETCH,
		"⭲": b.WIDEREL,
		"⭳": b.RELSTRETCH,
		"⭶": b.REL,
		"⭷": b.REL,
		"⭸": b.REL,
		"⭹": b.REL,
		"⭺": b.WIDEREL,
		"⭻": b.RELSTRETCH,
		"⭼": b.WIDEREL,
		"⭽": b.RELSTRETCH,
		"⮀": b.WIDEREL,
		"⮁": b.RELSTRETCH,
		"⮂": b.WIDEREL,
		"⮃": b.RELSTRETCH,
		"⮄": b.WIDEREL,
		"⮅": b.RELSTRETCH,
		"⮆": b.WIDEREL,
		"⮇": b.RELSTRETCH,
		"⮈": b.RELACCENT,
		"⮉": b.REL,
		"⮊": b.RELACCENT,
		"⮋": b.REL,
		"⮌": b.REL,
		"⮍": b.REL,
		"⮎": b.REL,
		"⮏": b.REL,
		"⮔": b.REL,
		"⮕": b.WIDEREL,
		"⮠": b.RELSTRETCH,
		"⮡": b.RELSTRETCH,
		"⮢": b.RELSTRETCH,
		"⮣": b.RELSTRETCH,
		"⮤": b.RELSTRETCH,
		"⮥": b.RELSTRETCH,
		"⮦": b.RELSTRETCH,
		"⮧": b.RELSTRETCH,
		"⮨": b.WIDEREL,
		"⮩": b.WIDEREL,
		"⮪": b.WIDEREL,
		"⮫": b.WIDEREL,
		"⮬": b.RELSTRETCH,
		"⮭": b.RELSTRETCH,
		"⮮": b.RELSTRETCH,
		"⮯": b.RELSTRETCH,
		"⮰": b.REL,
		"⮱": b.REL,
		"⮲": b.REL,
		"⮳": b.REL,
		"⮴": b.REL,
		"⮵": b.REL,
		"⮶": b.REL,
		"⮷": b.REL,
		"⮸": b.RELSTRETCH,
		"⯑": b.REL,
		㫜: b.BIN3,
		"︷": b.WIDEACCENT,
		"︸": b.WIDEACCENT
	}
};
//#endregion
//#region node_modules/@mathjax/src/mjs/util/string.js
function T(e, t) {
	return e.length === t.length ? e === t ? 0 : e < t ? -1 : 1 : t.length - e.length;
}
function E(e) {
	return e.replace(/([\^$(){}.+*?\-|[\]:\\])/g, "\\$1");
}
function D(e) {
	return Array.from(e).map((e) => e.codePointAt(0));
}
function O(e) {
	return String.fromCodePoint(...e);
}
function k(e) {
	return !!e.match(/%\s*$/);
}
function A(e) {
	return e.trim().split(/\s+/);
}
function j(e) {
	return e.replace(/\\U(?:([0-9A-Fa-f]{4})|\{\s*([0-9A-Fa-f]{1,6})\s*\})|\\./g, (e, t, n) => e === "\\\\" ? "\\" : String.fromCodePoint(parseInt(t || n, 16)));
}
//#endregion
//#region node_modules/@mathjax/src/mjs/core/MmlTree/MmlNodes/mo.js
var M = class extends p {
	constructor() {
		super(...arguments), this._texClass = null, this.lspace = 5 / 18, this.rspace = 5 / 18;
	}
	get texClass() {
		return this._texClass === null ? this.getOperatorDef(this.getText())[2] : this._texClass;
	}
	set texClass(e) {
		this._texClass = e;
	}
	get kind() {
		return "mo";
	}
	get isEmbellished() {
		return !0;
	}
	coreParent() {
		let e = null, t = this, n = this.factory.getNodeClass("math");
		for (; t && t.isEmbellished && t.coreMO() === this && !(t instanceof n);) e = t, t = t.parent;
		return e || this;
	}
	coreText(e) {
		if (!e) return "";
		if (e.isEmbellished) return e.coreMO().getText();
		for (; ((e.isKind("mrow") || e.isKind("TeXAtom") || e.isKind("mstyle") || e.isKind("mphantom")) && e.childNodes.length === 1 || e.isKind("munderover")) && e.childNodes[0];) e = e.childNodes[0];
		return e.isToken ? e.getText() : "";
	}
	hasSpacingAttributes() {
		return this.attributes.isSet("lspace") || this.attributes.isSet("rspace");
	}
	get isAccent() {
		let e = !1, t = this.coreParent().parent;
		if (t) {
			let n = t.isKind("mover") ? t.childNodes[t.over].coreMO() ? "accent" : "" : t.isKind("munder") ? t.childNodes[t.under].coreMO() ? "accentunder" : "" : t.isKind("munderover") ? this === t.childNodes[t.over].coreMO() ? "accent" : this === t.childNodes[t.under].coreMO() ? "accentunder" : "" : "";
			n && (e = t.attributes.getExplicit(n) === void 0 ? this.attributes.get("accent") : e);
		}
		return e;
	}
	setTeXclass(e) {
		let { form: t, fence: n } = this.attributes.getList("form", "fence");
		return this.getProperty("texClass") === void 0 && this.hasSpacingAttributes() ? null : (n && this.texClass === o.REL && (t === "prefix" && (this.texClass = o.OPEN), t === "postfix" && (this.texClass = o.CLOSE)), this.adjustTeXclass(e));
	}
	adjustTeXclass(e) {
		let t = this.texClass, n = this.prevClass;
		if (t === o.NONE) return e;
		if (e ? (e.getProperty("autoOP") && (t === o.BIN || t === o.REL) && (n = e.texClass = o.ORD), n = this.prevClass = e.texClass || o.ORD, this.prevLevel = this.attributes.getInherited("scriptlevel")) : n = this.prevClass = o.NONE, t === o.BIN && (n === o.NONE || n === o.BIN || n === o.OP || n === o.REL || n === o.OPEN || n === o.PUNCT)) this.texClass = o.ORD;
		else if (n === o.BIN && (t === o.REL || t === o.CLOSE || t === o.PUNCT)) e.texClass = this.prevClass = o.ORD;
		else if (t === o.BIN) {
			let e = null, t = this.parent;
			for (; t && t.parent && t.isEmbellished && (t.childNodes.length === 1 || !t.isKind("mrow") && t.core() === e);) e = t, t = t.parent;
			e ||= this, t.childNodes[t.childNodes.length - 1] === e && (this.texClass = o.ORD);
		}
		return this;
	}
	setInheritedAttributes(e = {}, t = !1, n = 0, r = !1) {
		super.setInheritedAttributes(e, t, n, r);
		let i = this.getText();
		this.checkOperatorTable(i), this.checkPseudoScripts(i), this.checkPrimes(i), this.checkMathAccent(i);
	}
	getOperatorDef(e) {
		let [t, n, r] = this.handleExplicitForm(this.getForms());
		this.attributes.setInherited("form", t);
		let i = this.constructor, a = i.OPTABLE, s = a[t][e] || a[n][e] || a[r][e];
		if (s) return s;
		this.setProperty("noDictDef", !0);
		let c = this.attributes.get("movablelimits");
		if ((e.match(i.opPattern) || c) && this.getProperty("texClass") === void 0) return y(1, 2, o.OP);
		let l = S(e), [u, d] = i.MMLSPACING[l[2]];
		return y(u, d, l[2]);
	}
	checkOperatorTable(e) {
		let t = this.getOperatorDef(e);
		this.getProperty("texClass") === void 0 && (this.texClass = t[2]);
		for (let e of Object.keys(t[3] || {})) this.attributes.setInherited(e, t[3][e]);
		this.lspace = t[0] / 18, this.rspace = t[1] / 18;
	}
	getForms() {
		let e = null, t = this.parent, n = this.Parent;
		for (; n && n.isEmbellished;) e = t, t = n.parent, n = n.Parent;
		if (e ||= this, t && t.isKind("mrow") && t.nonSpaceLength() !== 1) {
			if (t.firstNonSpace() === e) return [
				"prefix",
				"infix",
				"postfix"
			];
			if (t.lastNonSpace() === e) return [
				"postfix",
				"infix",
				"prefix"
			];
		}
		return [
			"infix",
			"prefix",
			"postfix"
		];
	}
	handleExplicitForm(e) {
		if (this.attributes.isSet("form")) {
			let t = this.attributes.get("form");
			e = [t].concat(e.filter((e) => e !== t));
		}
		return e;
	}
	checkPseudoScripts(e) {
		let t = this.constructor.pseudoScripts;
		if (!e.match(t)) return;
		let n = this.coreParent().Parent, r = !n || !(n.isKind("msubsup") && !n.isKind("msub"));
		this.setProperty("pseudoscript", r), r && (this.attributes.setInherited("lspace", 0), this.attributes.setInherited("rspace", 0));
	}
	checkPrimes(e) {
		let t = this.constructor.primes;
		if (!e.match(t)) return;
		let n = this.constructor.remapPrimes, r = O(D(e).map((e) => n[e]));
		this.setProperty("primes", r);
	}
	checkMathAccent(e) {
		let t = this.Parent;
		if (this.getProperty("mathaccent") !== void 0 || !t || !t.isKind("munderover")) return;
		let [n, r, i] = t.childNodes;
		if (n.isEmbellished && n.coreMO() === this) return;
		let a = !!(r && r.isEmbellished && r.coreMO() === this), o = !!(i && i.isEmbellished && r.coreMO() === this);
		!a && !o || (this.isMathAccent(e) ? this.setProperty("mathaccent", !0) : this.isMathAccentWithWidth(e) && this.setProperty("mathaccent", !1));
	}
	isMathAccent(e = this.getText()) {
		let t = this.constructor.mathaccents;
		return !!e.match(t);
	}
	isMathAccentWithWidth(e = this.getText()) {
		let t = this.constructor.mathaccentsWithWidth;
		return !!e.match(t);
	}
};
M.defaults = Object.assign(Object.assign({}, p.defaults), {
	form: "infix",
	fence: !1,
	separator: !1,
	lspace: "thickmathspace",
	rspace: "thickmathspace",
	stretchy: !1,
	symmetric: !1,
	maxsize: "infinity",
	minsize: "0em",
	largeop: !1,
	movablelimits: !1,
	accent: !1,
	linebreak: "auto",
	lineleading: "100%",
	linebreakstyle: "before",
	indentalign: "auto",
	indentshift: "0",
	indenttarget: "",
	indentalignfirst: "indentalign",
	indentshiftfirst: "indentshift",
	indentalignlast: "indentalign",
	indentshiftlast: "indentshift"
}), M.MMLSPACING = C, M.OPTABLE = w, M.pseudoScripts = new RegExp([
	"^[\"'*`",
	"ª",
	"°",
	"²-´",
	"¹",
	"º",
	"‘-‟",
	"′-‷⁗",
	"⁰ⁱ",
	"⁴-ⁿ",
	"₀-₎",
	"]+$"
].join("")), M.primes = new RegExp([
	"^[\"'",
	"‘-‟",
	"]+$"
].join("")), M.opPattern = /^[a-zA-Z]{2,}$/, M.remapPrimes = {
	34: 8243,
	39: 8242,
	8216: 8245,
	8217: 8242,
	8218: 8242,
	8219: 8245,
	8220: 8246,
	8221: 8243,
	8222: 8243,
	8223: 8246
}, M.mathaccents = new RegExp([
	"^[",
	"´́ˊ",
	"`̀ˋ",
	"¨̈",
	"~̃˜",
	"¯̄ˉ",
	"˘̆",
	"ˇ̌",
	"^̂ˆ",
	"⃐⃑",
	"⃖⃗⃡",
	"˙̇",
	"˚̊",
	"⃛",
	"⃜",
	"]$"
].join("")), M.mathaccentsWithWidth = new RegExp([
	"^[",
	"←→↔",
	"⏜⏝",
	"⏞⏟",
	"]$"
].join(""));
//#endregion
export { _, T as a, n as b, w as c, g as d, m as f, s as g, o as h, j as i, S as l, p as m, k as n, A as o, f as p, E as r, D as s, M as t, h as u, v, t as x, d as y };
