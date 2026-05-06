import { o as e, t } from "./Options-xGJmd5BJ.js";
import { t as n } from "./PrioritizedList-OKfur1cD.js";
import { d as r, p as i, t as a, x as o } from "./mo-CHa-ZBtr.js";
//#region node_modules/@mathjax/src/mjs/input/tex/NodeUtil.js
var s = {
	attrs: new Set([
		"autoOP",
		"fnOP",
		"movesupsub",
		"subsupOK",
		"texprimestyle",
		"useHeight",
		"variantForm",
		"withDelims",
		"mathaccent",
		"open",
		"close"
	]),
	createEntity(e) {
		return String.fromCodePoint(parseInt(e, 16));
	},
	getChildren(e) {
		return e.childNodes;
	},
	getText(e) {
		return e.getText();
	},
	appendChildren(e, t) {
		for (let n of t) e.appendChild(n);
	},
	setAttribute(e, t, n) {
		e.attributes.set(t, n);
	},
	setProperty(e, t, n) {
		e.setProperty(t, n);
	},
	setProperties(e, t) {
		for (let n of Object.keys(t)) {
			let r = t[n];
			n === "texClass" ? (e.texClass = r, e.setProperty(n, r)) : n === "movablelimits" ? (e.setProperty("movablelimits", r), (e.isKind("mo") || e.isKind("mstyle")) && e.attributes.set("movablelimits", r)) : n === "inferred" || (s.attrs.has(n) ? e.setProperty(n, r) : e.attributes.set(n, r));
		}
	},
	getProperty(e, t) {
		return e.getProperty(t);
	},
	getAttribute(e, t) {
		return e.attributes.get(t);
	},
	removeAttribute(e, t) {
		e.attributes.unset(t);
	},
	removeProperties(e, ...t) {
		e.removeProperty(...t);
	},
	getChildAt(e, t) {
		return e.childNodes[t];
	},
	setChild(e, t, n) {
		let r = e.childNodes;
		r[t] = n, n && (n.parent = e);
	},
	copyChildren(e, t) {
		let n = e.childNodes;
		for (let e = 0; e < n.length; e++) this.setChild(t, e, n[e]);
	},
	copyAttributes(e, t) {
		t.attributes = e.attributes;
		for (let [n, r] of Object.entries(e.getAllProperties())) t.setProperty(n, r);
	},
	isType(e, t) {
		return e.isKind(t);
	},
	isEmbellished(e) {
		return e.isEmbellished;
	},
	getTexClass(e) {
		return e.texClass;
	},
	getCoreMO(e) {
		return e.coreMO();
	},
	isNode(e) {
		return e instanceof i || e instanceof r;
	},
	isInferred(e) {
		return e.isInferred;
	},
	getForm(e) {
		if (!e.isKind("mo")) return null;
		let t = e, n = t.getForms();
		for (let e of n) {
			let n = this.getOp(t, e);
			if (n) return n;
		}
		return null;
	},
	getOp(e, t = "infix") {
		return a.OPTABLE[t][e.getText()] || null;
	},
	getMoAttribute(e, t) {
		if (!e.attributes.isSet(t)) for (let n of [
			"infix",
			"postfix",
			"prefix"
		]) {
			let r = this.getOp(e, n)?.[3]?.[t];
			if (r !== void 0) return r;
		}
		return e.attributes.get(t);
	}
}, c = {
	Variant: {
		NORMAL: "normal",
		BOLD: "bold",
		ITALIC: "italic",
		BOLDITALIC: "bold-italic",
		DOUBLESTRUCK: "double-struck",
		FRAKTUR: "fraktur",
		BOLDFRAKTUR: "bold-fraktur",
		SCRIPT: "script",
		BOLDSCRIPT: "bold-script",
		SANSSERIF: "sans-serif",
		BOLDSANSSERIF: "bold-sans-serif",
		SANSSERIFITALIC: "sans-serif-italic",
		SANSSERIFBOLDITALIC: "sans-serif-bold-italic",
		MONOSPACE: "monospace",
		INITIAL: "inital",
		TAILED: "tailed",
		LOOPED: "looped",
		STRETCHED: "stretched",
		CALLIGRAPHIC: "-tex-calligraphic",
		BOLDCALLIGRAPHIC: "-tex-bold-calligraphic",
		OLDSTYLE: "-tex-oldstyle",
		BOLDOLDSTYLE: "-tex-bold-oldstyle",
		MATHITALIC: "-tex-mathit"
	},
	Form: {
		PREFIX: "prefix",
		INFIX: "infix",
		POSTFIX: "postfix"
	},
	LineBreak: {
		AUTO: "auto",
		NEWLINE: "newline",
		NOBREAK: "nobreak",
		GOODBREAK: "goodbreak",
		BADBREAK: "badbreak"
	},
	LineBreakStyle: {
		BEFORE: "before",
		AFTER: "after",
		DUPLICATE: "duplicate",
		INFIXLINBREAKSTYLE: "infixlinebreakstyle"
	},
	IndentAlign: {
		LEFT: "left",
		CENTER: "center",
		RIGHT: "right",
		AUTO: "auto",
		ID: "id",
		INDENTALIGN: "indentalign"
	},
	IndentShift: { INDENTSHIFT: "indentshift" },
	LineThickness: {
		THIN: "thin",
		MEDIUM: "medium",
		THICK: "thick"
	},
	Notation: {
		LONGDIV: "longdiv",
		ACTUARIAL: "actuarial",
		PHASORANGLE: "phasorangle",
		RADICAL: "radical",
		BOX: "box",
		ROUNDEDBOX: "roundedbox",
		CIRCLE: "circle",
		LEFT: "left",
		RIGHT: "right",
		TOP: "top",
		BOTTOM: "bottom",
		UPDIAGONALSTRIKE: "updiagonalstrike",
		DOWNDIAGONALSTRIKE: "downdiagonalstrike",
		VERTICALSTRIKE: "verticalstrike",
		HORIZONTALSTRIKE: "horizontalstrike",
		NORTHEASTARROW: "northeastarrow",
		MADRUWB: "madruwb",
		UPDIAGONALARROW: "updiagonalarrow"
	},
	Align: {
		TOP: "top",
		BOTTOM: "bottom",
		CENTER: "center",
		BASELINE: "baseline",
		AXIS: "axis",
		LEFT: "left",
		RIGHT: "right"
	},
	Lines: {
		NONE: "none",
		SOLID: "solid",
		DASHED: "dashed"
	},
	Side: {
		LEFT: "left",
		RIGHT: "right",
		LEFTOVERLAP: "leftoverlap",
		RIGHTOVERLAP: "rightoverlap"
	},
	Width: {
		AUTO: "auto",
		FIT: "fit"
	},
	Actiontype: {
		TOGGLE: "toggle",
		STATUSLINE: "statusline",
		TOOLTIP: "tooltip",
		INPUT: "input"
	},
	Overflow: {
		LINBREAK: "linebreak",
		SCROLL: "scroll",
		ELIDE: "elide",
		TRUNCATE: "truncate",
		SCALE: "scale"
	},
	Unit: {
		EM: "em",
		EX: "ex",
		PX: "px",
		IN: "in",
		CM: "cm",
		MM: "mm",
		PT: "pt",
		PC: "pc"
	},
	Attr: {
		LATEX: "data-latex",
		LATEXITEM: "data-latex-item"
	}
}, l;
(function(e) {
	e.HANDLER = "handler", e.FALLBACK = "fallback", e.ITEMS = "items", e.TAGS = "tags", e.OPTIONS = "options", e.NODES = "nodes", e.PREPROCESSORS = "preprocessors", e.POSTPROCESSORS = "postprocessors", e.INIT = "init", e.CONFIG = "config", e.PRIORITY = "priority", e.PARSER = "parser";
})(l ||= {});
var u;
(function(e) {
	e.DELIMITER = "delimiter", e.MACRO = "macro", e.CHARACTER = "character", e.ENVIRONMENT = "environment";
})(u ||= {});
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/UnitUtil.js
var d = class {
	constructor(e) {
		this.num = "([-+]?([.,]\\d+|\\d+([.,]\\d*)?))", this.unit = "", this.dimenEnd = /./, this.dimenRest = /./, this.map = new Map(e), this.updateDimen();
	}
	updateDimen() {
		this.unit = `(${Array.from(this.map.keys()).join("|")})`, this.dimenEnd = RegExp("^\\s*" + this.num + "\\s*" + this.unit + "\\s*$"), this.dimenRest = RegExp("^\\s*" + this.num + "\\s*" + this.unit + " ?");
	}
	set(e, t) {
		return this.map.set(e, t), this.updateDimen(), this;
	}
	get(e) {
		return this.map.get(e) || this.map.get("pt");
	}
	delete(e) {
		return this.map.delete(e) ? (this.updateDimen(), !0) : !1;
	}
}, f = 7.2, p = 72;
function m([e, t, n]) {
	return t === "mu" ? [
		h.em(h.UNIT_CASES.get(t) * parseFloat(e)).slice(0, -2),
		"em",
		n
	] : [
		e,
		t,
		n
	];
}
var h = {
	UNIT_CASES: new d([
		["em", 1],
		["ex", .43],
		["pt", 1 / 10],
		["pc", 1.2],
		["px", f / p],
		["in", f],
		["cm", f / 2.54],
		["mm", f / 25.4],
		["mu", 1 / 18]
	]),
	matchDimen(e, t = !1) {
		let n = e.match(t ? h.UNIT_CASES.dimenRest : h.UNIT_CASES.dimenEnd);
		return n ? m([
			n[1].replace(/,/, "."),
			n[4],
			n[0].length
		]) : [
			null,
			null,
			0
		];
	},
	dimen2em(e) {
		let [t, n] = h.matchDimen(e), r = parseFloat(t || "1");
		return h.UNIT_CASES.get(n) * r;
	},
	em(e) {
		return Math.abs(e) < 6e-4 ? "0em" : e.toFixed(3).replace(/\.?0+$/, "") + "em";
	},
	trimSpaces(e) {
		if (typeof e != "string") return e;
		let t = e.trim();
		return t.match(/\\$/) && e.match(/ $/) && (t += " "), t;
	}
}, g = class {
	constructor(e, t, n) {
		this._factory = e, this._env = t, this.global = {}, this.stack = [], this.global = { isInner: n }, this.stack = [this._factory.create("start", this.global)], t && (this.stack[0].env = t), this.env = this.stack[0].env;
	}
	set env(e) {
		this._env = e;
	}
	get env() {
		return this._env;
	}
	Push(...e) {
		for (let t of e) {
			if (!t) continue;
			let e = s.isNode(t) ? this._factory.create("mml", t) : t;
			e.global = this.global;
			let [n, r] = this.stack.length ? this.Top().checkItem(e) : [null, !0];
			if (r) {
				if (n) {
					this.Pop(), this.Push(...n);
					continue;
				}
				e.isKind("null") || this.stack.push(e), e.env ? (e.copyEnv && Object.assign(e.env, this.env), this.env = e.env) : e.env = this.env;
			}
		}
	}
	Pop() {
		let e = this.stack.pop();
		return e.isOpen || delete e.env, this.env = this.stack.length ? this.Top().env : {}, e;
	}
	Top(e = 1) {
		return this.stack.length < e ? null : this.stack[this.stack.length - e];
	}
	Prev(e) {
		let t = this.Top();
		return e ? t.First : t.Pop();
	}
	get height() {
		return this.stack.length;
	}
	toString() {
		return "stack[\n  " + this.stack.join("\n  ") + "\n]";
	}
}, _ = class e {
	static processString(t, n) {
		let r = t.split(e.pattern);
		for (let e = 1, t = r.length; e < t; e += 2) {
			let t = r[e].charAt(0);
			t >= "0" && t <= "9" ? (r[e] = n[parseInt(r[e], 10) - 1], typeof r[e] == "number" && (r[e] = r[e].toString())) : t === "{" && (t = r[e].substring(1), t >= "0" && t <= "9" ? (r[e] = n[parseInt(r[e].substring(1, r[e].length - 1), 10) - 1], typeof r[e] == "number" && (r[e] = r[e].toString())) : r[e].match(/^\{([a-z]+):%(\d+)\|(.*)\}$/) && (r[e] = "%" + r[e]));
		}
		return r.join("");
	}
	constructor(t, n, ...r) {
		this.id = t, this.message = e.processString(n, r);
	}
};
_.pattern = /%(\d+|\{\d+\}|\{[a-z]+:%\d+(?:\|(?:%\{\d+\}|%.|[^}])*)+\}|.)/g;
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/StackItem.js
var v = class {
	constructor(e) {
		this._nodes = e, this.startStr = "", this.startI = 0, this.stopI = 0;
	}
	get nodes() {
		return this._nodes;
	}
	Push(...e) {
		this._nodes.push(...e);
	}
	Pop() {
		return this._nodes.pop();
	}
	get First() {
		return this._nodes[this.Size() - 1];
	}
	set First(e) {
		this._nodes[this.Size() - 1] = e;
	}
	get Last() {
		return this._nodes[0];
	}
	set Last(e) {
		this._nodes[0] = e;
	}
	Peek(e) {
		return e ??= 1, this._nodes.slice(this.Size() - e);
	}
	Size() {
		return this._nodes.length;
	}
	Clear() {
		this._nodes = [];
	}
	toMml(e = !0, t) {
		return this._nodes.length === 1 && !t ? this.First : this.create("node", e ? "inferredMrow" : "mrow", this._nodes, {});
	}
	create(e, ...t) {
		return this.factory.configuration.nodeFactory.create(e, ...t);
	}
}, y = class e extends v {
	constructor(e, ...t) {
		super(t), this.factory = e, this.global = {}, this._properties = {}, this.isOpen && (this._env = {});
	}
	get kind() {
		return "base";
	}
	get env() {
		return this._env;
	}
	set env(e) {
		this._env = e;
	}
	get copyEnv() {
		return !0;
	}
	getProperty(e) {
		return this._properties[e];
	}
	setProperty(e, t) {
		return this._properties[e] = t, this;
	}
	get isOpen() {
		return !1;
	}
	get isClose() {
		return !1;
	}
	get isFinal() {
		return !1;
	}
	isKind(e) {
		return e === this.kind;
	}
	checkItem(t) {
		if (t.isKind("over") && this.isOpen && (t.setProperty("num", this.toMml(!1)), this.Clear()), t.isKind("cell") && this.isOpen) {
			if (t.getProperty("linebreak")) return e.fail;
			throw new _("Misplaced", "Misplaced %1", t.getName());
		}
		if (t.isClose && this.getErrors(t.kind)) {
			let [e, n] = this.getErrors(t.kind);
			throw new _(e, n, t.getName());
		}
		return t.isFinal ? (this.Push(t.First), e.fail) : e.success;
	}
	clearEnv() {
		for (let e of Object.keys(this.env)) delete this.env[e];
	}
	setProperties(e) {
		return Object.assign(this._properties, e), this;
	}
	getName() {
		return this.getProperty("name");
	}
	toString() {
		return this.kind + "[" + this.nodes.join("; ") + "]";
	}
	getErrors(t) {
		return this.constructor.errors[t] || e.errors[t];
	}
	addLatexItem(e, t = "") {
		let n = this.startStr.slice(this.startI, this.stopI);
		if (n) {
			let r = t ? t + n : n;
			e.attributes.set(c.Attr.LATEXITEM, r), r !== "}" && e.attributes.set(c.Attr.LATEX, r);
		}
	}
};
y.fail = [null, !1], y.success = [null, !0], y.errors = {
	end: ["MissingBeginExtraEnd", "Missing \\begin{%1} or extra \\end{%1}"],
	close: ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"],
	right: ["MissingLeftExtraRight", "Missing \\left or extra \\right"],
	middle: ["ExtraMiddle", "Extra \\middle"]
};
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/TexParser.js
var b = class e {
	constructor(e, t, n) {
		this._string = e, this.configuration = n, this.macroCount = 0, this.i = 0, this.currentCS = "", this.saveI = 0;
		let r = Object.hasOwn(t, "isInner"), i = t.isInner;
		delete t.isInner;
		let a;
		if (t) {
			a = {};
			for (let e of Object.keys(t)) a[e] = t[e];
		}
		this.configuration.pushParser(this), this.stack = new g(this.itemFactory, a, r ? i : !0), this.Parse(), this.Push(this.itemFactory.create("stop")), this.stack.env = a;
	}
	get options() {
		return this.configuration.options;
	}
	get itemFactory() {
		return this.configuration.itemFactory;
	}
	get tags() {
		return this.configuration.tags;
	}
	set string(e) {
		this._string = e;
	}
	get string() {
		return this._string;
	}
	parse(e, t) {
		let n = this.saveI;
		this.saveI = this.i - +(e === "character" && t[1] !== "&");
		let r = this.configuration.handlers.get(e).parse(t);
		return e !== "macro" && this.updateResult(t[1], n), this.saveI = n, r;
	}
	lookup(e, t) {
		return this.configuration.handlers.get(e).lookup(t);
	}
	contains(e, t) {
		return this.configuration.handlers.get(e).contains(t);
	}
	toString() {
		let e = "";
		for (let t of Array.from(this.configuration.handlers.keys())) e += t + ": " + this.configuration.handlers.get(t) + "\n";
		return e;
	}
	Parse() {
		let e;
		for (; this.i < this.string.length;) e = this.getCodePoint(), this.i += e.length, this.parse(u.CHARACTER, [this, e]);
	}
	Push(e) {
		e instanceof y && (e.startI = this.saveI, e.stopI = this.i, e.startStr = this.string), e instanceof i && e.isInferred ? this.PushAll(e.childNodes) : this.stack.Push(e);
	}
	PushAll(e) {
		for (let t of e) this.stack.Push(t);
	}
	mml() {
		if (!this.stack.Top().isKind("mml")) return null;
		let e = this.stack.Top().First;
		this.configuration.popParser();
		let t = this.trimTex(this.string);
		return t && e.attributes.set(c.Attr.LATEX, t), e;
	}
	convertDelimiter(e) {
		return this.lookup(u.DELIMITER, e)?.char ?? null;
	}
	getCodePoint() {
		let e = this.string.codePointAt(this.i);
		return e === void 0 ? "" : String.fromCodePoint(e);
	}
	nextIsSpace() {
		return !!this.string.charAt(this.i).match(/\s/);
	}
	GetNext() {
		for (; this.nextIsSpace();) this.i++;
		return this.getCodePoint();
	}
	GetCS() {
		let e = this.string.slice(this.i).match(/^(([a-z]+) ?|[\uD800-\uDBFF].|.)/i);
		return e ? (this.i += e[0].length, e[2] || e[1]) : (this.i++, " ");
	}
	GetArgument(e, t = !1) {
		switch (this.GetNext()) {
			case "":
				if (!t) throw new _("MissingArgFor", "Missing argument for %1", this.currentCS);
				return null;
			case "}":
				if (!t) throw new _("ExtraCloseMissingOpen", "Extra close brace or missing open brace");
				return null;
			case "\\": return this.i++, "\\" + this.GetCS();
			case "{": {
				let e = ++this.i, t = 1;
				for (; this.i < this.string.length;) switch (this.string.charAt(this.i++)) {
					case "\\":
						this.i++;
						break;
					case "{":
						t++;
						break;
					case "}":
						if (--t === 0) return this.string.slice(e, this.i - 1);
						break;
				}
				throw new _("MissingCloseBrace", "Missing close brace");
			}
		}
		let n = this.getCodePoint();
		return this.i += n.length, n;
	}
	GetBrackets(e, t, n = !1) {
		if (this.GetNext() !== "[") return t;
		let r = ++this.i, i = 0, a = 0;
		for (; this.i < this.string.length;) switch (this.string.charAt(this.i++)) {
			case "{":
				i++;
				break;
			case "\\":
				this.i++;
				break;
			case "}":
				if (i-- <= 0) throw new _("ExtraCloseLooking", "Extra close brace while looking for %1", "']'");
				break;
			case "[":
				i === 0 && a++;
				break;
			case "]":
				if (i === 0) {
					if (!n || a === 0) return this.string.slice(r, this.i - 1);
					a--;
				}
				break;
		}
		throw new _("MissingCloseBracket", "Could not find closing ']' for argument to %1", this.currentCS);
	}
	GetDelimiter(e, t = !1) {
		let n = this.GetNext();
		if (this.i += n.length, this.i <= this.string.length && (n === "\\" ? n += this.GetCS() : n === "{" && t && (this.i--, n = this.GetArgument(e).trim()), this.contains(u.DELIMITER, n))) return this.convertDelimiter(n);
		throw new _("MissingOrUnrecognizedDelim", "Missing or unrecognized delimiter for %1", this.currentCS);
	}
	GetDimen(e) {
		if (this.GetNext() === "{") {
			let t = this.GetArgument(e), [n, r] = h.matchDimen(t);
			if (n) return n + r;
		} else {
			let e = this.string.slice(this.i), [t, n, r] = h.matchDimen(e, !0);
			if (t) return this.i += r, t + n;
		}
		throw new _("MissingDimOrUnits", "Missing dimension or its units for %1", this.currentCS);
	}
	GetUpTo(e, t) {
		for (; this.nextIsSpace();) this.i++;
		let n = this.i, r = 0;
		for (; this.i < this.string.length;) {
			let e = this.i, i = this.GetNext();
			switch (this.i += i.length, i) {
				case "\\":
					i += this.GetCS();
					break;
				case "{":
					r++;
					break;
				case "}":
					if (r === 0) throw new _("ExtraCloseLooking", "Extra close brace while looking for %1", t);
					r--;
					break;
			}
			if (r === 0 && i === t) return this.string.slice(n, e);
		}
		throw new _("TokenNotFoundForCommand", "Could not find %1 for %2", t, this.currentCS);
	}
	ParseArg(t) {
		return new e(this.GetArgument(t), this.stack.env, this.configuration).mml();
	}
	ParseUpTo(t, n) {
		return new e(this.GetUpTo(t, n), this.stack.env, this.configuration).mml();
	}
	GetDelimiterArg(e) {
		let t = h.trimSpaces(this.GetArgument(e));
		if (t === "") return null;
		if (this.contains(u.DELIMITER, t)) return t;
		throw new _("MissingOrUnrecognizedDelim", "Missing or unrecognized delimiter for %1", this.currentCS);
	}
	GetStar() {
		let e = this.GetNext() === "*";
		return e && this.i++, e;
	}
	create(e, ...t) {
		let n = this.configuration.nodeFactory.create(e, ...t);
		return n.isToken && n.attributes.hasExplicit("mathvariant") && n.attributes.get("mathvariant").charAt(0) === "-" && n.setProperty("ignore-variant", !0), n;
	}
	trimTex(e) {
		return e.trim() + (e.match(/(?:^|[^\\])(?:\\\\)*\\\s+$/) ? " " : "");
	}
	updateResult(e, t) {
		let n = this.stack.Prev(!0);
		if (!n) return;
		let r = c.Attr.LATEX, i = n.attributes.get(r), a = n.attributes.get(c.Attr.LATEXITEM);
		if (a !== void 0) {
			i || (e === "}" || a === "}" ? this.composeBraces(n) : n.attributes.set(r, a));
			return;
		}
		t = t < this.saveI ? this.saveI : t;
		let o = this.trimTex(t === this.i ? e : this.string.slice(t, this.i));
		if (!(!o || o === i || e === "\\" && o === "\\")) {
			if (o === "_" || o === "^") n.setProperty("sub-sup", o);
			else {
				switch (n.getProperty("sub-sup")) {
					case "^":
						if (n.childNodes[2] && (o === "}" ? this.composeBraces(n.childNodes[2]) : n.childNodes[2].attributes.hasExplicit(r) || n.childNodes[2].attributes.set(r, o)), n.childNodes[1]) {
							let e = n.childNodes[1].attributes.get(r);
							this.composeLatex(n, `_${e}^`, 0, 2);
						} else this.composeLatex(n, "^", 0, 2);
						return;
					case "_":
						if (n.childNodes[1] && (o === "}" ? this.composeBraces(n.childNodes[1]) : n.childNodes[1].attributes.hasExplicit(r) || n.childNodes[1].attributes.set(r, o)), n.childNodes[2]) {
							let e = n.childNodes[2].attributes.get(r);
							this.composeLatex(n, `^${e}_`, 0, 1);
						} else this.composeLatex(n, "_", 0, 1);
						return;
				}
				if (o === "}") {
					this.composeBraces(n);
					return;
				}
			}
			n.attributes.set(r, o);
		}
	}
	composeLatex(e, t, n, r) {
		if (!e.childNodes[n] || !e.childNodes[r]) return;
		let i = c.Attr.LATEX, a = (e.childNodes[n].attributes.get(i) || "") + t + e.childNodes[r].attributes.get(i);
		e.attributes.set(i, a);
	}
	composeBraces(e) {
		let t = this.composeBracedContent(e);
		e.attributes.set(c.Attr.LATEX, `{${t}}`);
	}
	composeBracedContent(e) {
		let t = e.childNodes[0]?.childNodes || [], n = "";
		for (let e of t) {
			let t = (e?.attributes)?.get(c.Attr.LATEX) || "";
			t && (n += n && n.match(/[a-zA-Z]$/) && t.match(/^[a-zA-Z]/) ? " " + t : t);
		}
		return n;
	}
}, x = class {
	constructor(e = "???", t = "") {
		this.tag = e, this.id = t;
	}
}, S = class {
	constructor(e = "", t = !1, n = !1, r = null, i = "", a = "", o = !1, s = "") {
		this.env = e, this.taggable = t, this.defaultTags = n, this.tag = r, this.tagId = i, this.tagFormat = a, this.noTag = o, this.labelId = s;
	}
}, C = class {
	constructor() {
		this.counter = 0, this.allCounter = 0, this.configuration = null, this.ids = {}, this.allIds = {}, this.labels = {}, this.allLabels = {}, this.redo = !1, this.refUpdate = !1, this.currentTag = new S(), this.history = [], this.stack = [], this.enTag = function(e, t) {
			let n = this.configuration.nodeFactory, r = n.create("node", "mtd", [e]), i = n.create("node", "mlabeledtr", [t, r]);
			return n.create("node", "mtable", [i], {
				side: this.configuration.options.tagSide,
				minlabelspacing: this.configuration.options.tagIndent,
				displaystyle: !0
			});
		};
	}
	start(e, t, n) {
		this.currentTag && this.stack.push(this.currentTag);
		let r = this.label;
		this.currentTag = new S(e, t, n), this.label = r;
	}
	get env() {
		return this.currentTag.env;
	}
	end() {
		this.history.push(this.currentTag);
		let e = this.label;
		this.currentTag = this.stack.pop(), e && !this.label && (this.label = e);
	}
	tag(e, t) {
		this.currentTag.tag = e, this.currentTag.tagFormat = t ? e : this.formatTag(e), this.currentTag.noTag = !1;
	}
	notag() {
		this.tag("", !0), this.currentTag.noTag = !0;
	}
	get noTag() {
		return this.currentTag.noTag;
	}
	set label(e) {
		this.currentTag.labelId = e;
	}
	get label() {
		return this.currentTag.labelId;
	}
	formatUrl(e, t) {
		return t + "#" + encodeURIComponent(e);
	}
	formatTag(e) {
		return [
			"(",
			e,
			")"
		];
	}
	formatRef(e) {
		return this.formatTag(e);
	}
	formatId(e) {
		return "mjx-eqn:" + e.replace(/\s/g, "_");
	}
	formatNumber(e) {
		return e.toString();
	}
	autoTag() {
		this.currentTag.tag ?? (this.counter++, this.tag(this.formatNumber(this.counter), !1));
	}
	clearTag() {
		this.tag(null, !0), this.currentTag.tagId = "";
	}
	getTag(e = !1) {
		if (e) return this.autoTag(), this.makeTag();
		let t = this.currentTag;
		return t.taggable && !t.noTag && (t.defaultTags && this.autoTag(), t.tag) ? this.makeTag() : null;
	}
	resetTag() {
		this.history = [], this.redo = !1, this.refUpdate = !1, this.clearTag();
	}
	reset(e = 0) {
		this.resetTag(), this.counter = this.allCounter = e, this.allLabels = {}, this.allIds = {}, this.label = "";
	}
	startEquation(e) {
		this.history = [], this.stack = [], this.clearTag(), this.currentTag = new S("", void 0, void 0), this.labels = {}, this.ids = {}, this.counter = this.allCounter, this.redo = !1;
		let t = e.inputData.recompile;
		t && (this.refUpdate = !0, this.counter = t.counter);
	}
	finishEquation(e) {
		this.redo && (e.inputData.recompile = {
			state: e.state(),
			counter: this.allCounter
		}), this.refUpdate || (this.allCounter = this.counter), Object.assign(this.allIds, this.ids), Object.assign(this.allLabels, this.labels);
	}
	finalize(e, t) {
		if (!t.display || this.currentTag.env || this.currentTag.tag == null) return e;
		let n = this.makeTag();
		return this.enTag(e, n);
	}
	makeId() {
		this.currentTag.tagId = this.formatId(this.configuration.options.useLabelIds && this.label || this.currentTag.tag);
	}
	makeTag() {
		this.makeId(), this.label &&= (this.labels[this.label] = new x(this.currentTag.tag, this.currentTag.tagId), "");
		let e = this.currentTag.tagFormat, t = new b((Array.isArray(e) ? e : e.match(/^(\(|\[|\{)(.*)(\}|\]|\))$/)?.slice(1) || [e]).map((e) => e ? `\\text{${e}}` : "").join(""), {}, this.configuration).mml();
		return this.configuration.nodeFactory.create("node", "mtd", [t], {
			id: this.currentTag.tagId,
			rowalign: this.configuration.options.tagAlign
		});
	}
}, w = new Map([["none", class extends C {
	autoTag() {}
	getTag() {
		return this.currentTag.tag ? super.getTag() : null;
	}
}], ["all", class extends C {
	finalize(e, t) {
		if (!t.display || this.history.find(function(e) {
			return e.taggable;
		})) return e;
		let n = this.getTag(!0);
		return this.enTag(e, n);
	}
}]]), T = "none", E = {
	OPTIONS: {
		tags: T,
		tagSide: "right",
		tagIndent: "0.8em",
		useLabelIds: !0,
		ignoreDuplicateLabels: !1,
		tagAlign: "baseline"
	},
	add(e, t) {
		w.set(e, t);
	},
	addTags(e) {
		for (let t of Object.keys(e)) E.add(t, e[t]);
	},
	create(e) {
		let t = w.get(e) || w.get(T);
		if (!t) throw Error("Unknown tags class");
		return new t();
	},
	setDefault(e) {
		T = e;
	},
	getDefault() {
		return E.create(T);
	}
}, D = class {
	constructor(e, t, n) {
		this._token = e, this._char = t, this._attributes = n;
	}
	get token() {
		return this._token;
	}
	get char() {
		return this._char;
	}
	get attributes() {
		return this._attributes;
	}
}, O = class {
	constructor(e, t, n = []) {
		this._token = e, this._func = t, this._args = n;
	}
	get token() {
		return this._token;
	}
	get func() {
		return this._func;
	}
	get args() {
		return this._args;
	}
};
//#endregion
//#region node_modules/@mathjax/src/mjs/input/tex/TokenMap.js
function k(e) {
	return e === void 0 ? !0 : e;
}
var A = class {
	constructor(e, t) {
		this._name = e, this._parser = t, z.register(this);
	}
	get name() {
		return this._name;
	}
	parserFor(e) {
		return this.contains(e) ? this.parser : null;
	}
	parse([e, t]) {
		let n = this.parserFor(t), r = this.lookup(t);
		return n && r ? k(n(e, r)) : null;
	}
	set parser(e) {
		this._parser = e;
	}
	get parser() {
		return this._parser;
	}
}, j = class extends A {
	constructor(e, t, n) {
		super(e, t), this._regExp = n;
	}
	contains(e) {
		return this._regExp.test(e);
	}
	lookup(e) {
		return this.contains(e) ? e : null;
	}
}, M = class extends A {
	constructor() {
		super(...arguments), this.map = /* @__PURE__ */ new Map();
	}
	lookup(e) {
		return this.map.get(e);
	}
	contains(e) {
		return this.map.has(e);
	}
	add(e, t) {
		this.map.set(e, t);
	}
	remove(e) {
		this.map.delete(e);
	}
}, N = class extends M {
	constructor(e, t, n) {
		super(e, t);
		for (let e of Object.keys(n)) {
			let t = n[e], [r, i] = typeof t == "string" ? [t, null] : t, a = new D(e, r, i);
			this.add(e, a);
		}
	}
}, P = class extends N {
	parse([e, t]) {
		return super.parse([e, "\\" + t]);
	}
}, F = class extends M {
	constructor(e, t, n = {}) {
		super(e, null);
		let r = (e) => typeof e == "string" ? n[e] : e;
		for (let [e, n] of Object.entries(t)) {
			let t, i;
			Array.isArray(n) ? (t = r(n[0]), i = n.slice(1)) : (t = r(n), i = []);
			let a = new O(e, t, i);
			this.add(e, a);
		}
	}
	parserFor(e) {
		let t = this.lookup(e);
		return t ? t.func : null;
	}
	parse([e, t]) {
		let n = this.lookup(t), r = this.parserFor(t);
		return !n || !r ? null : k(r(e, n.token, ...n.args));
	}
}, I = class extends F {
	parse([e, t]) {
		let n = this.lookup(t), r = this.parserFor(t);
		if (!n || !r) return null;
		let i = e.currentCS;
		e.currentCS = "\\" + t;
		let a = r(e, "\\" + n.token, ...n.args);
		return e.currentCS = i, k(a);
	}
}, L = class extends F {
	constructor(e, t, n, r = {}) {
		super(e, n, r), this.parser = t;
	}
	parse([e, t]) {
		let n = this.lookup(t), r = this.parserFor(t);
		return !n || !r ? null : k(this.parser(e, n.token, r, n.args));
	}
}, R = /* @__PURE__ */ new Map(), z = {
	register(e) {
		R.set(e.name, e);
	},
	getMap(e) {
		return R.get(e);
	}
}, B = class e {
	constructor() {
		this._configuration = new n(), this._fallback = new o();
	}
	add(e, t, r = n.DEFAULTPRIORITY) {
		for (let t of e.slice().reverse()) {
			let e = z.getMap(t);
			if (!e) {
				this.warn(`Configuration '${t}' not found! Omitted.`);
				return;
			}
			this._configuration.add(e, r);
		}
		t && this._fallback.add(t, r);
	}
	remove(e, t = null) {
		for (let t of e) {
			let e = this.retrieve(t);
			e && this._configuration.remove(e);
		}
		t && this._fallback.remove(t);
	}
	parse(t) {
		for (let { item: n } of this._configuration) {
			let r = n.parse(t);
			if (r === e.FALLBACK) break;
			if (r) return r;
		}
		let [n, r] = t;
		Array.from(this._fallback)[0].item(n, r);
	}
	lookup(e) {
		let t = this.applicable(e);
		return t ? t.lookup(e) : null;
	}
	contains(e) {
		let t = this.applicable(e);
		return !!t && !(t instanceof N && t.lookup(e).char === null);
	}
	toString() {
		let e = [];
		for (let { item: t } of this._configuration) e.push(t.name);
		return e.join(", ");
	}
	applicable(e) {
		for (let { item: t } of this._configuration) if (t.contains(e)) return t;
		return null;
	}
	retrieve(e) {
		for (let { item: t } of this._configuration) if (t.name === e) return t;
		return null;
	}
	warn(e) {
		console.log("TexParser Warning: " + e);
	}
};
B.FALLBACK = Symbol("fallback");
var V = class {
	constructor() {
		this.map = /* @__PURE__ */ new Map();
	}
	add(e, t, r = n.DEFAULTPRIORITY) {
		for (let n of Object.keys(e)) {
			let i = n, a = this.get(i);
			a || (a = new B(), this.set(i, a)), a.add(e[i], t[i], r);
		}
	}
	remove(e, t) {
		for (let n of Object.keys(e)) {
			let r = this.get(n);
			r && r.remove(e[n], t[n]);
		}
	}
	set(e, t) {
		this.map.set(e, t);
	}
	get(e) {
		return this.map.get(e);
	}
	retrieve(e) {
		for (let t of this.map.values()) {
			let n = t.retrieve(e);
			if (n) return n;
		}
		return null;
	}
	keys() {
		return this.map.keys();
	}
}, H = class e {
	static makeProcessor(e, t) {
		return Array.isArray(e) ? e : [e, t];
	}
	static _create(t, r = {}) {
		let i = r.priority ?? n.DEFAULTPRIORITY, a = r.init ? this.makeProcessor(r.init, i) : null, o = r.config ? this.makeProcessor(r.config, i) : null, s = (r.preprocessors || []).map((e) => this.makeProcessor(e, i)), c = (r.postprocessors || []).map((e) => this.makeProcessor(e, i)), u = r.parser || "tex";
		return new e(t, r[l.HANDLER] || {}, r[l.FALLBACK] || {}, r[l.ITEMS] || {}, r[l.TAGS] || {}, r[l.OPTIONS] || {}, r[l.NODES] || {}, s, c, a, o, i, u);
	}
	static create(t, n = {}) {
		let r = e._create(t, n);
		return W.set(t, r), r;
	}
	static local(t = {}) {
		return e._create("", t);
	}
	constructor(e, t = {}, n = {}, r = {}, i = {}, a = {}, o = {}, s = [], c = [], l = null, d = null, f, p) {
		this.name = e, this.handler = t, this.fallback = n, this.items = r, this.tags = i, this.options = a, this.nodes = o, this.preprocessors = s, this.postprocessors = c, this.initMethod = l, this.configMethod = d, this.priority = f, this.parser = p, this.handler = Object.assign({
			[u.CHARACTER]: [],
			[u.DELIMITER]: [],
			[u.MACRO]: [],
			[u.ENVIRONMENT]: []
		}, t);
	}
	get init() {
		return this.initMethod ? this.initMethod[0] : null;
	}
	get config() {
		return this.configMethod ? this.configMethod[0] : null;
	}
}, U = /* @__PURE__ */ new Map(), W = {
	set(e, t) {
		U.set(e, t);
	},
	get(e) {
		return U.get(e);
	},
	keys() {
		return U.keys();
	}
}, G = class {
	constructor(e, t = ["tex"]) {
		this.initMethod = new o(), this.configMethod = new o(), this.configurations = new n(), this.parsers = [], this.handlers = new V(), this.items = {}, this.tags = {}, this.options = {}, this.nodes = {}, this.parsers = t;
		for (let t of e.slice().reverse()) this.addPackage(t);
		for (let { item: e, priority: t } of this.configurations) this.append(e, t);
	}
	init() {
		this.initMethod.execute(this);
	}
	config(e) {
		this.configMethod.execute(this, e);
		for (let t of this.configurations) this.addFilters(e, t.item);
	}
	addPackage(e) {
		let t = typeof e == "string" ? e : e[0], n = this.getPackage(t);
		n && this.configurations.add(n, typeof e == "string" ? n.priority : e[1]);
	}
	add(n, r, i = {}) {
		let a = this.getPackage(n);
		this.append(a), this.configurations.add(a, a.priority), this.init();
		let o = r.parseOptions;
		o.nodeFactory.setCreators(a.nodes);
		for (let e of Object.keys(a.items)) o.itemFactory.setNodeClass(e, a.items[e]);
		E.addTags(a.tags), t(o.options, a.options), e(o.options, i), this.addFilters(r, a), a.config && a.config(this, r);
	}
	getPackage(e) {
		let t = W.get(e);
		if (t && !this.parsers.includes(t.parser)) throw Error(`Package '${e}' doesn't target the proper parser`);
		return t || this.warn(`Package '${e}' not found.  Omitted.`), t;
	}
	append(e, n) {
		n ||= e.priority, e.initMethod && this.initMethod.add(e.initMethod[0], e.initMethod[1]), e.configMethod && this.configMethod.add(e.configMethod[0], e.configMethod[1]), this.handlers.add(e.handler, e.fallback, n), Object.assign(this.items, e.items), Object.assign(this.tags, e.tags), t(this.options, e.options), Object.assign(this.nodes, e.nodes);
	}
	addFilters(e, t) {
		for (let [n, r] of t.preprocessors) e.preFilters.add(n, r);
		for (let [n, r] of t.postprocessors) e.postFilters.add(n, r);
	}
	warn(e) {
		console.warn("MathJax Warning: " + e);
	}
};
//#endregion
export { s as C, c as S, y as _, N as a, l as b, L as c, O as d, D as f, b as g, E as h, B as i, F as l, x as m, G as n, I as o, C as p, z as r, P as s, H as t, j as u, _ as v, u as x, h as y };
