import { a as e, o as t, r as n, t as r } from "./Options-xGJmd5BJ.js";
import { r as i } from "./mathjax-KVeV0VvI.js";
import { a, h as o, l as s, r as c } from "./mo-CHa-ZBtr.js";
import { t as l } from "./InputJax-Ws8a0gwI.js";
import { a as u, t as d } from "./Factory-BKM7FEO-.js";
import { C as f, S as p, _ as ee, a as m, b as h, c as te, g as ne, h as g, l as re, n as ie, o as ae, p as oe, r as se, s as ce, t as le, u as _, v, x as y, y as ue } from "./Configuration-D9a4xjiL.js";
import { t as de } from "./NodeFactory-vJK_Ykma.js";
import { t as b } from "./ParseUtil-DNGKyXxF.js";
import { C as x, D as S, E as C, O as w, S as T, T as E, _ as D, a as O, b as k, c as A, d as j, f as M, g as N, h as P, i as F, k as I, l as L, m as R, n as z, o as B, p as V, s as H, t as U, u as fe, v as W, w as pe, x as me, y as he } from "./ParseMethods-Df_yRkOl.js";
import { n as G, r as ge } from "./lengths-BtEx5qB5.js";
//#region node_modules/@mathjax/src/mjs/core/FindMath.js
var _e = class {
	constructor(e) {
		let n = this.constructor;
		this.options = t(r({}, n.OPTIONS), e);
	}
};
_e.OPTIONS = {};
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/FindTeX.js
var K = class extends _e {
	constructor(e) {
		super(e), this.getPatterns();
	}
	getPatterns() {
		let e = this.options, t = [], n = [], r = [];
		this.end = {}, this.env = this.sub = 0;
		let i = 1;
		e.inlineMath.forEach((e) => this.addPattern(t, e, !1)), e.displayMath.forEach((e) => this.addPattern(t, e, !0)), t.length && n.push(t.sort(a).join("|")), e.processEnvironments && (n.push("\\\\begin\\s*\\{([^}]*)\\}"), this.env = i, i++), e.processEscapes && r.push("\\\\([\\\\$])"), e.processRefs && r.push("(\\\\(?:eq)?ref\\s*\\{[^}]*\\})"), r.length && (n.push("(" + r.join("|") + ")"), this.sub = i), this.start = new RegExp(n.join("|"), "g"), this.hasPatterns = n.length > 0;
	}
	addPattern(e, t, n) {
		let [r, i] = t;
		e.push(c(r)), this.end[r] = [
			i,
			n,
			this.endPattern(i)
		];
	}
	endPattern(e, t) {
		return RegExp((t || c(e)) + "|\\\\(?:[a-zA-Z]|.)|[{}]", "g");
	}
	findEnd(e, t, n, r) {
		let [i, a, o] = r, s = o.lastIndex = n.index + n[0].length, c, l = 0;
		for (; c = o.exec(e);) if ((c[1] || c[0]) === i && l === 0) return u(n[0], e.substring(s, c.index), c[0], t, n.index, c.index + c[0].length, a);
		else c[0] === "{" ? l++ : c[0] === "}" && l && l--;
		return null;
	}
	findMathInString(e, t, n) {
		let r, i;
		for (this.start.lastIndex = 0; r = this.start.exec(n);) {
			if (r[this.env] !== void 0 && this.env) {
				let e = "\\\\end\\s*(\\{" + c(r[this.env]) + "\\})";
				i = this.findEnd(n, t, r, [
					"{" + r[this.env] + "}",
					!0,
					this.endPattern(null, e)
				]), i && (i.math = i.open + i.math + i.close, i.open = i.close = "");
			} else if (r[this.sub] !== void 0 && this.sub) {
				let e = r[this.sub], n = r.index + r[this.sub].length;
				i = e.length === 2 ? u("\\", e.substring(1), "", t, r.index, n) : u("", e, "", t, r.index, n, !1);
			} else i = this.findEnd(n, t, r, this.end[r[0]]);
			i && (e.push(i), this.start.lastIndex = i.end.n);
		}
	}
	findMath(e) {
		let t = [];
		if (this.hasPatterns) for (let n = 0, r = e.length; n < r; n++) this.findMathInString(t, n, e[n]);
		return t;
	}
};
K.OPTIONS = {
	inlineMath: [["\\(", "\\)"]],
	displayMath: [["$$", "$$"], ["\\[", "\\]"]],
	processEscapes: !0,
	processEnvironments: !0,
	processRefs: !0
};
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/FilterUtil.js
function ve(e, t, n) {
	let r = t.attributes, i = n.attributes;
	e.forEach((e) => {
		let t = i.getExplicit(e);
		t != null && r.set(e, t);
	});
}
function ye(e, t) {
	let n = (e, t) => e.getExplicitNames().filter((n) => n !== t && (n !== "stretchy" || e.getExplicit("stretchy")) && n !== "data-latex" && n !== "data-latex-item"), r = e.attributes, i = t.attributes, a = n(r, "lspace"), o = n(i, "rspace");
	if (a.length !== o.length) return !1;
	for (let e of a) if (r.getExplicit(e) !== i.getExplicit(e)) return !1;
	return !0;
}
function be(e, t, n) {
	let r = [];
	for (let i of e.getList("m" + t + n)) {
		let a = i.childNodes;
		if (a[i[t]] && a[i[n]]) continue;
		let o = i.parent, s = a[i[t]] ? e.nodeFactory.create("node", "m" + t, [a[i.base], a[i[t]]]) : e.nodeFactory.create("node", "m" + n, [a[i.base], a[i[n]]]);
		f.copyAttributes(i, s), o.replaceChild(s, i), r.push(i);
	}
	e.removeFromList("m" + t + n, r);
}
function q(e, t, n) {
	let r = [];
	for (let i of e.getList(t)) {
		if (i.attributes.get("displaystyle")) continue;
		let t = i.childNodes[i.base], a = t.coreMO();
		if (t.getProperty("movablelimits") && !a.attributes.hasExplicit("movablelimits")) {
			let t = e.nodeFactory.create("node", n, i.childNodes);
			f.copyAttributes(i, t), i.parent.replaceChild(t, i), r.push(i);
		}
	}
	e.removeFromList(t, r);
}
var J = {
	cleanStretchy(e) {
		let t = e.data;
		for (let e of t.getList("fixStretchy")) f.getProperty(e, "fixStretchy") && (f.getForm(e)?.[3]?.stretchy && f.setAttribute(e, "stretchy", !1), f.removeProperties(e, "fixStretchy"));
	},
	cleanAttributes(e) {
		e.data.root.walkTree((e) => {
			let t = new Set((e.getProperty("keep-attrs") || "").split(/ /)), n = e.attributes;
			n.unset(p.Attr.LATEXITEM);
			for (let e of n.getExplicitNames()) !t.has(e) && n.get(e) === n.getInherited(e) && n.unset(e);
		});
	},
	combineRelations(e) {
		let t = [];
		for (let n of e.data.getList("mo")) {
			if (n.getProperty("relationsCombined") || !n.parent || n.parent && !f.isType(n.parent, "mrow") || f.getTexClass(n) !== o.REL) continue;
			let e = n.parent, r, i = e.childNodes, a = i.indexOf(n) + 1, s = f.getProperty(n, "variantForm");
			for (; a < i.length && (r = i[a]) && f.isType(r, "mo") && f.getTexClass(r) === o.REL;) if (s === f.getProperty(r, "variantForm") && ye(n, r)) {
				f.appendChildren(n, f.getChildren(r)), ve(["stretchy", "rspace"], n, r);
				for (let e of r.getPropertyNames()) n.setProperty(e, r.getProperty(e));
				r.attributes.get("data-latex") && n.attributes.set("data-latex", n.attributes.get("data-latex") + r.attributes.get("data-latex")), i.splice(a, 1), t.push(r), r.parent = null, r.setProperty("relationsCombined", !0), n.setProperty("texClass", o.REL);
			} else {
				n.attributes.hasExplicit("rspace") || f.setAttribute(n, "rspace", "0pt"), r.attributes.hasExplicit("lspace") || f.setAttribute(r, "lspace", "0pt");
				break;
			}
			n.attributes.setInherited("form", n.getForms()[0]);
		}
		e.data.removeFromList("mo", t);
	},
	cleanSubSup(e) {
		let t = e.data;
		t.error || (be(t, "sub", "sup"), be(t, "under", "over"));
	},
	moveLimits(e) {
		let t = e.data;
		q(t, "munderover", "msubsup"), q(t, "munder", "msub"), q(t, "mover", "msup");
	},
	setInherited(e) {
		e.data.root.setInheritedAttributes({}, e.math.display, 0, !1);
	},
	checkScriptlevel(e) {
		let t = e.data, n = [];
		for (let e of t.getList("mstyle")) {
			if (e.childNodes[0].childNodes.length !== 1) continue;
			let t = e.attributes;
			for (let e of ["displaystyle", "scriptlevel"]) t.getExplicit(e) === t.getInherited(e) && t.unset(e);
			let r = t.getExplicitNames();
			if (r.filter((e) => e.substring(0, 10) !== "data-latex").length === 0) {
				let i = e.childNodes[0].childNodes[0];
				r.forEach((e) => i.attributes.set(e, t.get(e))), e.parent.replaceChild(i, e), n.push(e);
			}
		}
		t.removeFromList("mstyle", n);
	}
}, Y = class extends ee {}, xe = class extends d {
	constructor() {
		super(...arguments), this.defaultKind = "dummy", this.configuration = null;
	}
};
xe.DefaultStackItems = { [Y.prototype.kind]: Y };
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/ColumnParser.js
var Se = class {
	constructor() {
		this.columnHandler = {
			l: (e) => e.calign[e.j++] = "left",
			c: (e) => e.calign[e.j++] = "center",
			r: (e) => e.calign[e.j++] = "right",
			p: (e) => this.getColumn(e, "top"),
			m: (e) => this.getColumn(e, "middle"),
			b: (e) => this.getColumn(e, "bottom"),
			w: (e) => this.getColumn(e, "top", ""),
			W: (e) => this.getColumn(e, "top", ""),
			"|": (e) => this.addRule(e, "solid"),
			":": (e) => this.addRule(e, "dashed"),
			">": (e) => e.cstart[e.j] = (e.cstart[e.j] || "") + this.getBraces(e),
			"<": (e) => e.cend[e.j - 1] = (e.cend[e.j - 1] || "") + this.getBraces(e),
			"@": (e) => this.addAt(e, this.getBraces(e)),
			"!": (e) => this.addBang(e, this.getBraces(e)),
			"*": (e) => this.repeat(e),
			P: (e) => this.macroColumn(e, ">{$}p{#1}<{$}", 1),
			M: (e) => this.macroColumn(e, ">{$}m{#1}<{$}", 1),
			B: (e) => this.macroColumn(e, ">{$}b{#1}<{$}", 1),
			" ": (e) => {}
		}, this.MAXCOLUMNS = 1e4;
	}
	process(e, t, n) {
		let r = {
			parser: e,
			template: t,
			i: 0,
			j: 0,
			c: "",
			cwidth: [],
			calign: [],
			cspace: [],
			clines: [],
			cstart: n.cstart,
			cend: n.cend,
			ralign: n.ralign,
			cextra: n.cextra
		}, i = 0;
		for (; r.i < r.template.length;) {
			if (i++ > this.MAXCOLUMNS) throw new v("MaxColumns", "Too many column specifiers (perhaps looping column definitions?)");
			let e = r.template.codePointAt(r.i), t = r.c = String.fromCodePoint(e);
			if (r.i += t.length, !Object.hasOwn(this.columnHandler, t)) throw new v("BadPreamToken", "Illegal pream-token (%1)", t);
			this.columnHandler[t](r);
		}
		this.setColumnAlign(r, n), this.setColumnWidths(r, n), this.setColumnSpacing(r, n), this.setColumnLines(r, n), this.setPadding(r, n);
	}
	setColumnAlign(e, t) {
		t.arraydef.columnalign = e.calign.join(" ");
	}
	setColumnWidths(e, t) {
		if (!e.cwidth.length) return;
		let n = [...e.cwidth];
		n.length < e.calign.length && n.push("auto"), t.arraydef.columnwidth = n.map((e) => e || "auto").join(" ");
	}
	setColumnSpacing(e, t) {
		if (!e.cspace.length) return;
		let n = [...e.cspace];
		n.length < e.calign.length && n.push("1em"), t.arraydef.columnspacing = n.slice(1).map((e) => e || "1em").join(" ");
	}
	setColumnLines(e, t) {
		if (!e.clines.length) return;
		let n = [...e.clines];
		n[0] && t.frame.push(["left", n[0]]), n.length > e.calign.length ? t.frame.push(["right", n.pop()]) : n.length < e.calign.length && n.push("none"), n.length > 1 && (t.arraydef.columnlines = n.slice(1).map((e) => e || "none").join(" "));
	}
	setPadding(e, t) {
		if (!e.cextra[0] && !e.cextra[e.calign.length - 1]) return;
		let n = e.calign.length - 1, r = e.cspace, i = e.cextra[n] ? r[n] : null;
		t.arraydef["data-array-padding"] = `${r[0] || ".5em"} ${i || ".5em"}`;
	}
	getColumn(e, t, n = "left") {
		e.calign[e.j] = n || this.getAlign(e), e.cwidth[e.j] = this.getDimen(e), e.ralign[e.j] = [
			t,
			e.cwidth[e.j],
			e.calign[e.j]
		], e.j++;
	}
	getDimen(e) {
		let t = this.getBraces(e);
		if (!ue.matchDimen(t)[0]) throw new v("MissingColumnDimOrUnits", "Missing dimension or its units for %1 column declaration", e.c);
		return t;
	}
	getAlign(e) {
		return n(this.getBraces(e).toLowerCase(), {
			l: "left",
			c: "center",
			r: "right"
		}, "");
	}
	getBraces(e) {
		for (; e.template[e.i] === " ";) e.i++;
		if (e.i >= e.template.length) throw new v("MissingArgForColumn", "Missing argument for %1 column declaration", e.c);
		if (e.template[e.i] !== "{") return e.template[e.i++];
		let t = ++e.i, n = 1;
		for (; e.i < e.template.length;) switch (e.template.charAt(e.i++)) {
			case "\\":
				e.i++;
				break;
			case "{":
				n++;
				break;
			case "}":
				if (--n === 0) return e.template.slice(t, e.i - 1);
				break;
		}
		throw new v("MissingCloseBrace", "Missing close brace");
	}
	macroColumn(e, t, n) {
		let r = [];
		for (; n > 0 && n--;) r.push(this.getBraces(e));
		e.template = b.substituteArgs(e.parser, r, t) + e.template.slice(e.i), e.i = 0;
	}
	addRule(e, t) {
		e.clines[e.j] && this.addAt(e, "\\,"), e.clines[e.j] = t, e.cspace[e.j] === "0" && (e.cstart[e.j] = "\\hspace{.5em}");
	}
	addAt(e, t) {
		let { cstart: n, cspace: r, j: i } = e;
		e.cextra[i] = !0, e.calign[i] = "center", e.clines[i] && (r[i] === ".5em" ? n[i - 1] += "\\hspace{.25em}" : r[i] || (e.cend[i - 1] = (e.cend[i - 1] || "") + "\\hspace{.5em}")), n[i] = t, r[i] = "0", r[++e.j] = "0";
	}
	addBang(e, t) {
		let { cstart: n, cspace: r, j: i } = e;
		e.cextra[i] = !0, e.calign[i] = "center", n[i] = (r[i] === "0" && e.clines[i] ? "\\hspace{.25em}" : "") + t, r[i] || (r[i] = ".5em"), r[++e.j] = ".5em";
	}
	repeat(e) {
		let t = this.getBraces(e), n = this.getBraces(e), r = parseInt(t);
		if (String(r) !== t) throw new v("ColArgNotNum", "First argument to %1 column specifier must be a number", "*");
		e.template = Array(r).fill(n).join("") + e.template.substring(e.i), e.i = 0;
	}
}, X = p.Variant, Ce = class e {
	constructor(t, n = []) {
		this.options = {}, this.columnParser = new Se(), this.packageData = /* @__PURE__ */ new Map(), this.parsers = [], this.root = null, this.nodeLists = {}, this.error = !1, this.handlers = t.handlers, this.nodeFactory = new de(), this.nodeFactory.configuration = this, this.nodeFactory.setCreators(t.nodes), this.itemFactory = new xe(t.items), this.itemFactory.configuration = this, r(this.options, ...n), r(this.options, t.options), this.mathStyle = e.getVariant.get(this.options.mathStyle) || e.getVariant.get("TeX");
	}
	pushParser(e) {
		this.parsers.unshift(e);
	}
	popParser() {
		this.parsers.shift();
	}
	get parser() {
		return this.parsers[0];
	}
	clear() {
		this.parsers = [], this.root = null, this.nodeLists = {}, this.error = !1, this.tags.resetTag();
	}
	addNode(e, t) {
		let n = this.nodeLists[e];
		if (n ||= this.nodeLists[e] = [], n.push(t), t.kind !== e) {
			let n = f.getProperty(t, "in-lists") || "", r = (n ? n.split(/,/) : []).concat(e).join(",");
			f.setProperty(t, "in-lists", r);
		}
	}
	getList(e) {
		let t = this.nodeLists[e] || [], n = [];
		for (let e of t) this.inTree(e) && n.push(e);
		return this.nodeLists[e] = n, n;
	}
	removeFromList(e, t) {
		let n = this.nodeLists[e] || [];
		for (let e of t) {
			let t = n.indexOf(e);
			t >= 0 && n.splice(t, 1);
		}
	}
	inTree(e) {
		for (; e && e !== this.root;) e = e.parent;
		return !!e;
	}
};
Ce.getVariant = new Map([
	["TeX", (e, t) => t && e.match(/^[\u0391-\u03A9\u03F4]/) ? X.NORMAL : ""],
	["ISO", (e) => X.ITALIC],
	["French", (e) => e.normalize("NFD").match(/^[a-z]/) ? X.ITALIC : X.NORMAL],
	["upright", (e) => X.NORMAL]
]);
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/base/BaseMappings.js
var Z = ge(G.thickmathspace), Q = p.Variant;
new _("letter", U.variable, /[a-z]/i), new _("digit", U.digit, /[0-9.,]/), new _("command", U.controlSequence, /^\\/), new re("special", {
	"{": z.Open,
	"}": z.Close,
	"~": z.Tilde,
	"^": z.Superscript,
	_: z.Subscript,
	"|": z.Bar,
	" ": z.Space,
	"	": z.Space,
	"\r": z.Space,
	"\n": z.Space,
	"'": z.Prime,
	"%": z.Comment,
	"&": z.Entry,
	"#": z.Hash,
	"\xA0": z.Space,
	"’": z.Prime
}), new m("lcGreek", U.lcGreek, {
	alpha: "α",
	beta: "β",
	gamma: "γ",
	delta: "δ",
	epsilon: "ϵ",
	zeta: "ζ",
	eta: "η",
	theta: "θ",
	iota: "ι",
	kappa: "κ",
	lambda: "λ",
	mu: "μ",
	nu: "ν",
	xi: "ξ",
	omicron: "ο",
	pi: "π",
	rho: "ρ",
	sigma: "σ",
	tau: "τ",
	upsilon: "υ",
	phi: "ϕ",
	chi: "χ",
	psi: "ψ",
	omega: "ω",
	varepsilon: "ε",
	vartheta: "ϑ",
	varpi: "ϖ",
	varrho: "ϱ",
	varsigma: "ς",
	varphi: "φ"
}), new m("ucGreek", U.ucGreek, {
	Gamma: "Γ",
	Delta: "Δ",
	Theta: "Θ",
	Lambda: "Λ",
	Xi: "Ξ",
	Pi: "Π",
	Sigma: "Σ",
	Upsilon: "Υ",
	Phi: "Φ",
	Psi: "Ψ",
	Omega: "Ω"
}), new m("mathchar0mi", U.mathchar0mi, {
	AA: "Å",
	S: ["§", { mathvariant: Q.NORMAL }],
	aleph: ["ℵ", { mathvariant: Q.NORMAL }],
	hbar: ["ℏ", { variantForm: !0 }],
	imath: "ı",
	jmath: "ȷ",
	ell: "ℓ",
	wp: ["℘", { mathvariant: Q.NORMAL }],
	Re: ["ℜ", { mathvariant: Q.NORMAL }],
	Im: ["ℑ", { mathvariant: Q.NORMAL }],
	partial: ["∂", { mathvariant: Q.ITALIC }],
	infty: ["∞", { mathvariant: Q.NORMAL }],
	prime: ["′", { variantForm: !0 }],
	emptyset: ["∅", { mathvariant: Q.NORMAL }],
	nabla: ["∇", { mathvariant: Q.NORMAL }],
	top: ["⊤", { mathvariant: Q.NORMAL }],
	bot: ["⊥", { mathvariant: Q.NORMAL }],
	angle: ["∠", { mathvariant: Q.NORMAL }],
	triangle: ["△", { mathvariant: Q.NORMAL }],
	backslash: ["\\", { mathvariant: Q.NORMAL }],
	forall: ["∀", { mathvariant: Q.NORMAL }],
	exists: ["∃", { mathvariant: Q.NORMAL }],
	neg: ["¬", { mathvariant: Q.NORMAL }],
	lnot: ["¬", { mathvariant: Q.NORMAL }],
	flat: ["♭", { mathvariant: Q.NORMAL }],
	natural: ["♮", { mathvariant: Q.NORMAL }],
	sharp: ["♯", { mathvariant: Q.NORMAL }],
	clubsuit: ["♣", { mathvariant: Q.NORMAL }],
	diamondsuit: ["♢", { mathvariant: Q.NORMAL }],
	heartsuit: ["♡", { mathvariant: Q.NORMAL }],
	spadesuit: ["♠", { mathvariant: Q.NORMAL }]
}), new m("mathchar0mo", U.mathchar0mo, {
	surd: ["√", { symmetric: !0 }],
	coprod: ["∐", { movesupsub: !0 }],
	bigvee: ["⋁", { movesupsub: !0 }],
	bigwedge: ["⋀", { movesupsub: !0 }],
	biguplus: ["⨄", { movesupsub: !0 }],
	bigcap: ["⋂", { movesupsub: !0 }],
	bigcup: ["⋃", { movesupsub: !0 }],
	int: "∫",
	intop: ["∫", {
		movesupsub: !0,
		movablelimits: !0
	}],
	iint: "∬",
	iiint: "∭",
	prod: ["∏", { movesupsub: !0 }],
	sum: ["∑", { movesupsub: !0 }],
	bigotimes: ["⨂", { movesupsub: !0 }],
	bigoplus: ["⨁", { movesupsub: !0 }],
	bigodot: ["⨀", { movesupsub: !0 }],
	oint: "∮",
	ointop: ["∮", {
		movesupsub: !0,
		movablelimits: !0
	}],
	oiint: "∯",
	oiiint: "∰",
	bigsqcup: ["⨆", { movesupsub: !0 }],
	smallint: ["∫", { largeop: !1 }],
	triangleleft: "◃",
	triangleright: "▹",
	bigtriangleup: "△",
	bigtriangledown: "▽",
	wedge: "∧",
	land: "∧",
	vee: "∨",
	lor: "∨",
	cap: "∩",
	cup: "∪",
	ddagger: "‡",
	dagger: "†",
	sqcap: "⊓",
	sqcup: "⊔",
	uplus: "⊎",
	amalg: "⨿",
	diamond: "⋄",
	bullet: "∙",
	wr: "≀",
	div: "÷",
	odot: ["⊙", { largeop: !1 }],
	oslash: ["⊘", { largeop: !1 }],
	otimes: ["⊗", { largeop: !1 }],
	ominus: ["⊖", { largeop: !1 }],
	oplus: ["⊕", { largeop: !1 }],
	mp: "∓",
	pm: "±",
	circ: "∘",
	bigcirc: "◯",
	setminus: "∖",
	cdot: "⋅",
	ast: "∗",
	times: "×",
	star: "⋆",
	propto: "∝",
	sqsubseteq: "⊑",
	sqsupseteq: "⊒",
	parallel: "∥",
	mid: "∣",
	dashv: "⊣",
	vdash: "⊢",
	leq: "≤",
	le: "≤",
	geq: "≥",
	ge: "≥",
	lt: "<",
	gt: ">",
	succ: "≻",
	prec: "≺",
	approx: "≈",
	succeq: "⪰",
	preceq: "⪯",
	supset: "⊃",
	subset: "⊂",
	supseteq: "⊇",
	subseteq: "⊆",
	in: "∈",
	ni: "∋",
	notin: "∉",
	owns: "∋",
	gg: "≫",
	ll: "≪",
	sim: "∼",
	simeq: "≃",
	perp: "⟂",
	equiv: "≡",
	asymp: "≍",
	smile: "⌣",
	frown: "⌢",
	ne: "≠",
	neq: "≠",
	cong: "≅",
	doteq: "≐",
	bowtie: "⋈",
	models: "⊧",
	notChar: "⧸",
	Leftrightarrow: "⇔",
	Leftarrow: "⇐",
	Rightarrow: "⇒",
	leftrightarrow: "↔",
	leftarrow: "←",
	gets: "←",
	rightarrow: "→",
	to: ["→", { accent: !1 }],
	mapsto: "↦",
	leftharpoonup: "↼",
	leftharpoondown: "↽",
	rightharpoonup: "⇀",
	rightharpoondown: "⇁",
	nearrow: "↗",
	searrow: "↘",
	nwarrow: "↖",
	swarrow: "↙",
	rightleftharpoons: "⇌",
	hookrightarrow: "↪",
	hookleftarrow: "↩",
	longleftarrow: "⟵",
	Longleftarrow: "⟸",
	longrightarrow: "⟶",
	Longrightarrow: "⟹",
	Longleftrightarrow: "⟺",
	longleftrightarrow: "⟷",
	longmapsto: "⟼",
	ldots: "…",
	cdots: "⋯",
	vdots: "⋮",
	ddots: "⋱",
	iddots: "⋰",
	dotsc: "…",
	dotsb: "⋯",
	dotsm: "⋯",
	dotsi: "⋯",
	dotso: "…",
	ldotp: [".", { texClass: o.PUNCT }],
	cdotp: ["⋅", { texClass: o.PUNCT }],
	colon: [":", { texClass: o.PUNCT }]
}), new m("mathchar7", U.mathchar7, {
	_: "_",
	"#": "#",
	$: "$",
	"%": "%",
	"&": "&",
	And: "&"
}), new ce("delimiter", U.delimiter, {
	"(": "(",
	")": ")",
	"[": "[",
	"]": "]",
	"<": "⟨",
	">": "⟩",
	"\\lt": "⟨",
	"\\gt": "⟩",
	"/": "/",
	"|": ["|", { texClass: o.ORD }],
	".": "",
	"\\lmoustache": "⎰",
	"\\rmoustache": "⎱",
	"\\lgroup": "⟮",
	"\\rgroup": "⟯",
	"\\arrowvert": "⏐",
	"\\Arrowvert": "‖",
	"\\bracevert": "⎪",
	"\\Vert": ["‖", { texClass: o.ORD }],
	"\\|": ["‖", { texClass: o.ORD }],
	"\\vert": ["|", { texClass: o.ORD }],
	"\\uparrow": "↑",
	"\\downarrow": "↓",
	"\\updownarrow": "↕",
	"\\Uparrow": "⇑",
	"\\Downarrow": "⇓",
	"\\Updownarrow": "⇕",
	"\\backslash": "\\",
	"\\rangle": "⟩",
	"\\langle": "⟨",
	"\\rbrace": "}",
	"\\lbrace": "{",
	"\\}": "}",
	"\\{": "{",
	"\\rceil": "⌉",
	"\\lceil": "⌈",
	"\\rfloor": "⌋",
	"\\lfloor": "⌊",
	"\\lbrack": "[",
	"\\rbrack": "]"
}), new ae("macros", {
	displaystyle: [
		z.SetStyle,
		"D",
		!0,
		0
	],
	textstyle: [
		z.SetStyle,
		"T",
		!1,
		0
	],
	scriptstyle: [
		z.SetStyle,
		"S",
		!1,
		1
	],
	scriptscriptstyle: [
		z.SetStyle,
		"SS",
		!1,
		2
	],
	rm: [z.SetFont, Q.NORMAL],
	mit: [z.SetFont, Q.ITALIC],
	oldstyle: [z.SetFont, Q.OLDSTYLE],
	cal: [z.SetFont, Q.CALLIGRAPHIC],
	it: [z.SetFont, Q.MATHITALIC],
	bf: [z.SetFont, Q.BOLD],
	sf: [z.SetFont, Q.SANSSERIF],
	tt: [z.SetFont, Q.MONOSPACE],
	frak: [z.MathFont, Q.FRAKTUR],
	Bbb: [z.MathFont, Q.DOUBLESTRUCK],
	mathrm: [z.MathFont, Q.NORMAL],
	mathup: [z.MathFont, Q.NORMAL],
	mathnormal: [z.MathFont, ""],
	mathbf: [z.MathFont, Q.BOLD],
	mathbfup: [z.MathFont, Q.BOLD],
	mathit: [z.MathFont, Q.MATHITALIC],
	mathbfit: [z.MathFont, Q.BOLDITALIC],
	mathbb: [z.MathFont, Q.DOUBLESTRUCK],
	mathfrak: [z.MathFont, Q.FRAKTUR],
	mathbffrak: [z.MathFont, Q.BOLDFRAKTUR],
	mathscr: [z.MathFont, Q.SCRIPT],
	mathbfscr: [z.MathFont, Q.BOLDSCRIPT],
	mathsf: [z.MathFont, Q.SANSSERIF],
	mathsfup: [z.MathFont, Q.SANSSERIF],
	mathbfsf: [z.MathFont, Q.BOLDSANSSERIF],
	mathbfsfup: [z.MathFont, Q.BOLDSANSSERIF],
	mathsfit: [z.MathFont, Q.SANSSERIFITALIC],
	mathbfsfit: [z.MathFont, Q.SANSSERIFBOLDITALIC],
	mathtt: [z.MathFont, Q.MONOSPACE],
	mathcal: [z.MathFont, Q.CALLIGRAPHIC],
	mathbfcal: [z.MathFont, Q.BOLDCALLIGRAPHIC],
	symrm: [z.MathFont, Q.NORMAL],
	symup: [z.MathFont, Q.NORMAL],
	symnormal: [z.MathFont, ""],
	symbf: [
		z.MathFont,
		Q.BOLD,
		Q.BOLDITALIC
	],
	symbfup: [z.MathFont, Q.BOLD],
	symit: [z.MathFont, Q.ITALIC],
	symbfit: [z.MathFont, Q.BOLDITALIC],
	symbb: [z.MathFont, Q.DOUBLESTRUCK],
	symfrak: [z.MathFont, Q.FRAKTUR],
	symbffrak: [z.MathFont, Q.BOLDFRAKTUR],
	symscr: [z.MathFont, Q.SCRIPT],
	symbfscr: [z.MathFont, Q.BOLDSCRIPT],
	symsf: [
		z.MathFont,
		Q.SANSSERIF,
		Q.SANSSERIFITALIC
	],
	symsfup: [z.MathFont, Q.SANSSERIF],
	symbfsf: [z.MathFont, Q.BOLDSANSSERIF],
	symbfsfup: [z.MathFont, Q.BOLDSANSSERIF],
	symsfit: [z.MathFont, Q.SANSSERIFITALIC],
	symbfsfit: [z.MathFont, Q.SANSSERIFBOLDITALIC],
	symtt: [z.MathFont, Q.MONOSPACE],
	symcal: [z.MathFont, Q.CALLIGRAPHIC],
	symbfcal: [z.MathFont, Q.BOLDCALLIGRAPHIC],
	textrm: [
		z.HBox,
		null,
		Q.NORMAL
	],
	textup: [
		z.HBox,
		null,
		Q.NORMAL
	],
	textnormal: [z.HBox],
	textit: [
		z.HBox,
		null,
		Q.ITALIC
	],
	textbf: [
		z.HBox,
		null,
		Q.BOLD
	],
	textsf: [
		z.HBox,
		null,
		Q.SANSSERIF
	],
	texttt: [
		z.HBox,
		null,
		Q.MONOSPACE
	],
	tiny: [z.SetSize, .5],
	Tiny: [z.SetSize, .6],
	scriptsize: [z.SetSize, .7],
	small: [z.SetSize, .85],
	normalsize: [z.SetSize, 1],
	large: [z.SetSize, 1.2],
	Large: [z.SetSize, 1.44],
	LARGE: [z.SetSize, 1.73],
	huge: [z.SetSize, 2.07],
	Huge: [z.SetSize, 2.49],
	arcsin: z.NamedFn,
	arccos: z.NamedFn,
	arctan: z.NamedFn,
	arg: z.NamedFn,
	cos: z.NamedFn,
	cosh: z.NamedFn,
	cot: z.NamedFn,
	coth: z.NamedFn,
	csc: z.NamedFn,
	deg: z.NamedFn,
	det: z.NamedOp,
	dim: z.NamedFn,
	exp: z.NamedFn,
	gcd: z.NamedOp,
	hom: z.NamedFn,
	inf: z.NamedOp,
	ker: z.NamedFn,
	lg: z.NamedFn,
	lim: z.NamedOp,
	liminf: [z.NamedOp, "lim&thinsp;inf"],
	limsup: [z.NamedOp, "lim&thinsp;sup"],
	ln: z.NamedFn,
	log: z.NamedFn,
	max: z.NamedOp,
	min: z.NamedOp,
	Pr: z.NamedOp,
	sec: z.NamedFn,
	sin: z.NamedFn,
	sinh: z.NamedFn,
	sup: z.NamedOp,
	tan: z.NamedFn,
	tanh: z.NamedFn,
	limits: [z.Limits, !0],
	nolimits: [z.Limits, !1],
	overline: [z.UnderOver, "2015"],
	underline: [z.UnderOver, "2015"],
	overbrace: [
		z.UnderOver,
		"23DE",
		!0
	],
	underbrace: [
		z.UnderOver,
		"23DF",
		!0
	],
	overparen: [z.UnderOver, "23DC"],
	underparen: [z.UnderOver, "23DD"],
	overrightarrow: [z.UnderOver, "2192"],
	underrightarrow: [z.UnderOver, "2192"],
	overleftarrow: [z.UnderOver, "2190"],
	underleftarrow: [z.UnderOver, "2190"],
	overleftrightarrow: [z.UnderOver, "2194"],
	underleftrightarrow: [z.UnderOver, "2194"],
	overset: z.Overset,
	underset: z.Underset,
	overunderset: z.Overunderset,
	stackrel: [
		z.Macro,
		"\\mathrel{\\mathop{#2}\\limits^{#1}}",
		2
	],
	stackbin: [
		z.Macro,
		"\\mathbin{\\mathop{#2}\\limits^{#1}}",
		2
	],
	over: z.Over,
	overwithdelims: z.Over,
	atop: z.Over,
	atopwithdelims: z.Over,
	above: z.Over,
	abovewithdelims: z.Over,
	brace: [
		z.Over,
		"{",
		"}"
	],
	brack: [
		z.Over,
		"[",
		"]"
	],
	choose: [
		z.Over,
		"(",
		")"
	],
	frac: z.Frac,
	sqrt: z.Sqrt,
	root: z.Root,
	uproot: [z.MoveRoot, "upRoot"],
	leftroot: [z.MoveRoot, "leftRoot"],
	left: z.LeftRight,
	right: z.LeftRight,
	middle: z.LeftRight,
	llap: z.Lap,
	rlap: z.Lap,
	raise: z.RaiseLower,
	lower: z.RaiseLower,
	moveleft: z.MoveLeftRight,
	moveright: z.MoveLeftRight,
	",": [z.Spacer, G.thinmathspace],
	":": [z.Spacer, G.mediummathspace],
	">": [z.Spacer, G.mediummathspace],
	";": [z.Spacer, G.thickmathspace],
	"!": [z.Spacer, G.negativethinmathspace],
	enspace: [z.Spacer, .5],
	quad: [z.Spacer, 1],
	qquad: [z.Spacer, 2],
	thinspace: [z.Spacer, G.thinmathspace],
	negthinspace: [z.Spacer, G.negativethinmathspace],
	"*": z.DiscretionaryTimes,
	allowbreak: z.AllowBreak,
	goodbreak: [z.Linebreak, p.LineBreak.GOODBREAK],
	badbreak: [z.Linebreak, p.LineBreak.BADBREAK],
	nobreak: [z.Linebreak, p.LineBreak.NOBREAK],
	break: z.Break,
	hskip: z.Hskip,
	hspace: z.Hskip,
	kern: [z.Hskip, !0],
	mskip: z.Hskip,
	mspace: z.Hskip,
	mkern: [z.Hskip, !0],
	rule: z.rule,
	Rule: [z.Rule],
	Space: [z.Rule, "blank"],
	nonscript: z.Nonscript,
	big: [
		z.MakeBig,
		o.ORD,
		.85
	],
	Big: [
		z.MakeBig,
		o.ORD,
		1.15
	],
	bigg: [
		z.MakeBig,
		o.ORD,
		1.45
	],
	Bigg: [
		z.MakeBig,
		o.ORD,
		1.75
	],
	bigl: [
		z.MakeBig,
		o.OPEN,
		.85
	],
	Bigl: [
		z.MakeBig,
		o.OPEN,
		1.15
	],
	biggl: [
		z.MakeBig,
		o.OPEN,
		1.45
	],
	Biggl: [
		z.MakeBig,
		o.OPEN,
		1.75
	],
	bigr: [
		z.MakeBig,
		o.CLOSE,
		.85
	],
	Bigr: [
		z.MakeBig,
		o.CLOSE,
		1.15
	],
	biggr: [
		z.MakeBig,
		o.CLOSE,
		1.45
	],
	Biggr: [
		z.MakeBig,
		o.CLOSE,
		1.75
	],
	bigm: [
		z.MakeBig,
		o.REL,
		.85
	],
	Bigm: [
		z.MakeBig,
		o.REL,
		1.15
	],
	biggm: [
		z.MakeBig,
		o.REL,
		1.45
	],
	Biggm: [
		z.MakeBig,
		o.REL,
		1.75
	],
	mathord: [z.TeXAtom, o.ORD],
	mathop: [z.TeXAtom, o.OP],
	mathopen: [z.TeXAtom, o.OPEN],
	mathclose: [z.TeXAtom, o.CLOSE],
	mathbin: [z.TeXAtom, o.BIN],
	mathrel: [z.TeXAtom, o.REL],
	mathpunct: [z.TeXAtom, o.PUNCT],
	mathinner: [z.TeXAtom, o.INNER],
	vtop: [z.VBox, "top"],
	vcenter: [z.VBox, "center"],
	vbox: [z.VBox, "bottom"],
	hsize: z.Hsize,
	parbox: z.ParBox,
	breakAlign: z.BreakAlign,
	buildrel: z.BuildRel,
	hbox: [z.HBox, 0],
	text: z.HBox,
	mbox: [z.HBox, 0],
	fbox: z.FBox,
	boxed: [
		z.Macro,
		"\\fbox{$\\displaystyle{#1}$}",
		1
	],
	framebox: z.FrameBox,
	makebox: z.MakeBox,
	strut: z.Strut,
	mathstrut: [z.Macro, "\\vphantom{(}"],
	phantom: z.Phantom,
	vphantom: [
		z.Phantom,
		1,
		0
	],
	hphantom: [
		z.Phantom,
		0,
		1
	],
	smash: z.Smash,
	acute: [z.Accent, "00B4"],
	grave: [z.Accent, "0060"],
	ddot: [z.Accent, "00A8"],
	dddot: [z.Accent, "20DB"],
	ddddot: [z.Accent, "20DC"],
	tilde: [z.Accent, "007E"],
	bar: [z.Accent, "00AF"],
	breve: [z.Accent, "02D8"],
	check: [z.Accent, "02C7"],
	hat: [z.Accent, "005E"],
	vec: [
		z.Accent,
		"2192",
		!1
	],
	dot: [z.Accent, "02D9"],
	widetilde: [
		z.Accent,
		"007E",
		!0
	],
	widehat: [
		z.Accent,
		"005E",
		!0
	],
	matrix: z.Matrix,
	array: z.Matrix,
	pmatrix: [
		z.Matrix,
		"(",
		")"
	],
	cases: [
		z.Matrix,
		"{",
		"",
		"left left",
		null,
		".2em",
		null,
		!0
	],
	eqalign: [
		z.Matrix,
		null,
		null,
		"right left",
		Z,
		".5em",
		"D"
	],
	displaylines: [
		z.Matrix,
		null,
		null,
		"center",
		null,
		".5em",
		"D"
	],
	cr: z.Cr,
	"\\": z.CrLaTeX,
	newline: [z.CrLaTeX, !0],
	hline: z.HLine,
	hdashline: [z.HLine, "dashed"],
	eqalignno: [
		z.Matrix,
		null,
		null,
		"right left",
		Z,
		".5em",
		"D",
		null,
		"right"
	],
	leqalignno: [
		z.Matrix,
		null,
		null,
		"right left",
		Z,
		".5em",
		"D",
		null,
		"left"
	],
	hfill: z.HFill,
	hfil: z.HFill,
	hfilll: z.HFill,
	bmod: [z.Macro, `\\mmlToken{mo}[lspace="${Z}" rspace="${Z}"]{mod}`],
	pmod: [
		z.Macro,
		"\\pod{\\mmlToken{mi}{mod}\\kern 6mu #1}",
		1
	],
	mod: [
		z.Macro,
		"\\mathchoice{\\kern18mu}{\\kern12mu}{\\kern12mu}{\\kern12mu}\\mmlToken{mi}{mod}\\,\\,#1",
		1
	],
	pod: [
		z.Macro,
		"\\mathchoice{\\kern18mu}{\\kern8mu}{\\kern8mu}{\\kern8mu}(#1)",
		1
	],
	iff: [z.Macro, "\\;\\Longleftrightarrow\\;"],
	skew: [
		z.Macro,
		"{{#2{#3\\mkern#1mu}\\mkern-#1mu}{}}",
		3
	],
	pmb: [
		z.Macro,
		"\\rlap{#1}\\kern1px{#1}",
		1
	],
	TeX: [z.Macro, "T\\kern-.14em\\lower.5ex{E}\\kern-.115em X"],
	LaTeX: [z.Macro, "L\\kern-.325em\\raise.21em{\\scriptstyle{A}}\\kern-.17em\\TeX"],
	not: z.Not,
	dots: z.Dots,
	space: z.Tilde,
	"\xA0": z.Tilde,
	" ": z.Tilde,
	begin: z.BeginEnd,
	end: z.BeginEnd,
	label: z.HandleLabel,
	ref: z.HandleRef,
	nonumber: z.HandleNoTag,
	newcolumntype: z.NewColumnType,
	mathchoice: z.MathChoice,
	mmlToken: z.MmlToken
}), new te("environment", U.environment, {
	displaymath: [
		z.Equation,
		null,
		!1
	],
	math: [
		z.Equation,
		null,
		!1,
		!1
	],
	array: [z.AlignedArray],
	darray: [
		z.AlignedArray,
		null,
		"D"
	],
	equation: [
		z.Equation,
		null,
		!0
	],
	eqnarray: [
		z.EqnArray,
		null,
		!0,
		!0,
		"rcl",
		"bmt",
		b.cols(0, G.thickmathspace),
		".5em"
	],
	indentalign: [z.IndentAlign]
}), new m("not_remap", null, {
	"←": "↚",
	"→": "↛",
	"↔": "↮",
	"⇐": "⇍",
	"⇒": "⇏",
	"⇔": "⇎",
	"∈": "∉",
	"∋": "∌",
	"∣": "∤",
	"∥": "∦",
	"∼": "≁",
	"~": "≁",
	"≃": "≄",
	"≅": "≇",
	"≈": "≉",
	"≍": "≭",
	"=": "≠",
	"≡": "≢",
	"<": "≮",
	">": "≯",
	"≤": "≰",
	"≥": "≱",
	"≲": "≴",
	"≳": "≵",
	"≶": "≸",
	"≷": "≹",
	"≺": "⊀",
	"≻": "⊁",
	"⊂": "⊄",
	"⊃": "⊅",
	"⊆": "⊈",
	"⊇": "⊉",
	"⊢": "⊬",
	"⊨": "⊭",
	"⊩": "⊮",
	"⊫": "⊯",
	"≼": "⋠",
	"≽": "⋡",
	"⊑": "⋢",
	"⊒": "⋣",
	"⊲": "⋪",
	"⊳": "⋫",
	"⊴": "⋬",
	"⊵": "⋭",
	"∃": "∄"
});
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/base/BaseConfiguration.js
var we = p.Variant;
new m("remap", null, {
	"-": "−",
	"*": "∗",
	"`": "‘"
});
function Te(e, t) {
	let n = e.stack.env.font, r = e.stack.env.italicFont, i = n ? { mathvariant: n } : {}, a = se.getMap("remap").lookup(t), o = s(t), c = o[3], l = e.create("token", c, i, a ? a.char : t), u = b.isLatinOrGreekChar(t) ? e.configuration.mathStyle(t, !0) || r : "", d = o[4] || (n && u === we.NORMAL ? "" : u);
	d && l.attributes.set("mathvariant", d), c === "mo" && (f.setProperty(l, "fixStretchy", !0), e.configuration.addNode("fixStretchy", l)), e.Push(l);
}
function Ee(e, t) {
	throw new v("UndefinedControlSequence", "Undefined control sequence %1", "\\" + t);
}
function De(e, t) {
	throw new v("UnknownEnv", "Unknown environment '%1'", t);
}
function Oe({ data: e }) {
	for (let t of e.getList("nonscript")) if (t.attributes.get("scriptlevel") > 0) {
		let n = t.parent;
		if (n.childNodes.splice(n.childIndex(t), 1), e.removeFromList(t.kind, [t]), t.isKind("mrow")) {
			let n = t.childNodes[0];
			e.removeFromList("mstyle", [n]), e.removeFromList("mspace", n.childNodes[0].childNodes);
		}
	} else t.isKind("mrow") && (t.parent.replaceChild(t.childNodes[0], t), e.removeFromList("mrow", [t]));
}
var ke = class extends oe {};
le.create("base", {
	[h.CONFIG]: function(e, t) {
		let n = t.parseOptions.options;
		n.digits && (n.numberPattern = n.digits), new _("digit", U.digit, n.initialDigit), new _("letter", U.variable, n.initialLetter), e.handlers.get(y.CHARACTER).add(["letter", "digit"], null, 4);
	},
	[h.HANDLER]: {
		[y.CHARACTER]: ["command", "special"],
		[y.DELIMITER]: ["delimiter"],
		[y.MACRO]: [
			"delimiter",
			"macros",
			"lcGreek",
			"ucGreek",
			"mathchar0mi",
			"mathchar0mo",
			"mathchar7"
		],
		[y.ENVIRONMENT]: ["environment"]
	},
	[h.FALLBACK]: {
		[y.CHARACTER]: Te,
		[y.MACRO]: Ee,
		[y.ENVIRONMENT]: De
	},
	[h.ITEMS]: {
		[C.prototype.kind]: C,
		[S.prototype.kind]: S,
		[me.prototype.kind]: me,
		[A.prototype.kind]: A,
		[k.prototype.kind]: k,
		[pe.prototype.kind]: pe,
		[I.prototype.kind]: I,
		[T.prototype.kind]: T,
		[R.prototype.kind]: R,
		[P.prototype.kind]: P,
		[E.prototype.kind]: E,
		[B.prototype.kind]: B,
		[O.prototype.kind]: O,
		[fe.prototype.kind]: fe,
		[w.prototype.kind]: w,
		[x.prototype.kind]: x,
		[H.prototype.kind]: H,
		[N.prototype.kind]: N,
		[V.prototype.kind]: V,
		[he.prototype.kind]: he,
		[W.prototype.kind]: W,
		[L.prototype.kind]: L,
		[F.prototype.kind]: F,
		[j.prototype.kind]: j,
		[M.prototype.kind]: M,
		[D.prototype.kind]: D
	},
	[h.OPTIONS]: {
		maxMacros: 1e3,
		digits: "",
		numberPattern: /^(?:[0-9]+(?:\{,\}[0-9]{3})*(?:\.[0-9]*)?|\.[0-9]+)/,
		initialDigit: /[0-9.,]/,
		identifierPattern: /^[a-zA-Z]+/,
		initialLetter: /[a-zA-Z]/,
		baseURL: !i.document || i.document.getElementsByTagName("base").length === 0 ? "" : String(i.document.location).replace(/#.*$/, "")
	},
	[h.TAGS]: { base: ke },
	[h.POSTPROCESSORS]: [[Oe, -4]]
});
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex.js
var $ = class n extends l {
	static configure(e) {
		let t = new ie(e, ["tex"]);
		return t.init(), t;
	}
	static tags(e, t) {
		g.addTags(t.tags), g.setDefault(e.options.tags), e.tags = g.getDefault(), e.tags.configuration = e;
	}
	constructor(r = {}) {
		let [i, a, o] = e(r, n.OPTIONS, K.OPTIONS);
		super(a), this.findTeX = this.options.FindTeX || new K(o);
		let s = this.options.packages, c = this.configuration = n.configure(s), l = this._parseOptions = new Ce(c, [this.options, g.OPTIONS]);
		t(l.options, i), c.config(this), n.tags(l, c), this.postFilters.addList([
			[J.cleanSubSup, -7],
			[J.setInherited, -6],
			[J.checkScriptlevel, -5],
			[J.moveLimits, -4],
			[J.cleanStretchy, -3],
			[J.cleanAttributes, -2],
			[J.combineRelations, -1]
		]);
	}
	setMmlFactory(e) {
		super.setMmlFactory(e), this._parseOptions.nodeFactory.setMmlFactory(e);
	}
	get parseOptions() {
		return this._parseOptions;
	}
	reset(e = 0) {
		this.parseOptions.tags.reset(e);
	}
	compile(e, t) {
		this.parseOptions.clear(), this.parseOptions.mathItem = e, this.executeFilters(this.preFilters, e, t, this.parseOptions), this.latex = e.math;
		let n;
		this.parseOptions.tags.startEquation(e);
		let r;
		try {
			r = new ne(this.latex, {
				display: e.display,
				isInner: !1
			}, this.parseOptions), n = r.mml();
		} catch (e) {
			if (!(e instanceof v)) throw e;
			this.parseOptions.error = !0, n = this.options.formatError(this, e);
		}
		return n = this.parseOptions.nodeFactory.create("node", "math", [n]), n.attributes.set(p.Attr.LATEX, this.latex), e.display && f.setAttribute(n, "display", "block"), this.parseOptions.tags.finishEquation(e), this.parseOptions.root = n, this.executeFilters(this.postFilters, e, t, this.parseOptions), r && r.stack.env.hsize && (f.setAttribute(n, "maxwidth", r.stack.env.hsize), f.setAttribute(n, "overflow", "linebreak")), this.mathNode = this.parseOptions.root, this.mathNode;
	}
	findMath(e) {
		return this.findTeX.findMath(e);
	}
	formatError(e) {
		let t = e.message.replace(/\n.*/, "");
		return this.parseOptions.nodeFactory.create("error", t, e.id, this.latex);
	}
};
$.NAME = "TeX", $.OPTIONS = Object.assign(Object.assign({}, l.OPTIONS), {
	FindTeX: null,
	packages: ["base"],
	maxBuffer: 5 * 1024,
	maxTemplateSubtitutions: 1e4,
	mathStyle: "TeX",
	formatError: (e, t) => e.formatError(t)
});
//#endregion
export { $ as TeX };
