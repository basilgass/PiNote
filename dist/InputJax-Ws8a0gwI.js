import { o as e, t } from "./Options-xGJmd5BJ.js";
import { x as n } from "./mo-CHa-ZBtr.js";
//#region node_modules/@mathjax/src/mjs/core/InputJax.js
var r = class {
	constructor(r = {}) {
		this.adaptor = null, this.mmlFactory = null;
		let i = this.constructor;
		this.options = e(t({}, i.OPTIONS), r), this.preFilters = new n(this.options.preFilters), this.postFilters = new n(this.options.postFilters);
	}
	get name() {
		return this.constructor.NAME;
	}
	setAdaptor(e) {
		this.adaptor = e;
	}
	setMmlFactory(e) {
		this.mmlFactory = e;
	}
	initialize() {}
	reset(...e) {}
	get processStrings() {
		return !0;
	}
	findMath(e, t) {
		return [];
	}
	executeFilters(e, t, n, r) {
		let i = {
			math: t,
			document: n,
			data: r
		};
		return e.execute(i), i.data;
	}
};
r.NAME = "generic", r.OPTIONS = {
	preFilters: [],
	postFilters: []
};
//#endregion
export { r as t };
