//#region node_modules/@mathjax/src/mjs/util/PrioritizedList.js
var e = class e {
	constructor() {
		this.items = [], this.items = [];
	}
	[Symbol.iterator]() {
		let e = 0, t = this.items;
		return { next() {
			return {
				value: t[e++],
				done: e > t.length
			};
		} };
	}
	add(t, n = e.DEFAULTPRIORITY) {
		let r = this.items.length;
		do
			r--;
		while (r >= 0 && n < this.items[r].priority);
		return this.items.splice(r + 1, 0, {
			item: t,
			priority: n
		}), t;
	}
	remove(e) {
		let t = this.items.length;
		do
			t--;
		while (t >= 0 && this.items[t].item !== e);
		return t >= 0 && this.items.splice(t, 1), this;
	}
};
e.DEFAULTPRIORITY = 5;
//#endregion
export { e as t };
