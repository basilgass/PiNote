//#region node_modules/@mathjax/src/mjs/util/lengths.js
var e = 1e6, t = {
	px: 1,
	in: 96,
	cm: 96 / 2.54,
	mm: 96 / 25.4
}, n = {
	em: 1,
	ex: .431,
	pt: 1 / 10,
	pc: 12 / 10,
	mu: 1 / 18
}, r = {
	veryverythinmathspace: 1 / 18,
	verythinmathspace: 2 / 18,
	thinmathspace: 3 / 18,
	mediummathspace: 4 / 18,
	thickmathspace: 5 / 18,
	verythickmathspace: 6 / 18,
	veryverythickmathspace: 7 / 18,
	negativeveryverythinmathspace: -1 / 18,
	negativeverythinmathspace: -2 / 18,
	negativethinmathspace: -3 / 18,
	negativemediummathspace: -4 / 18,
	negativethickmathspace: -5 / 18,
	negativeverythickmathspace: -6 / 18,
	negativeveryverythickmathspace: -7 / 18,
	thin: .04,
	medium: .06,
	thick: .1,
	normal: 1,
	big: 2,
	small: 1 / Math.sqrt(2),
	infinity: e
};
function i(e, i = 0, a = 1, o = 16) {
	if (typeof e != "string" && (e = String(e)), e === "" || e == null) return i;
	if (r[e]) return r[e];
	let s = e.match(/^\s*([-+]?(?:\.\d+|\d+(?:\.\d*)?))?(pt|em|ex|mu|px|pc|in|mm|cm|%)?/);
	if (!s || s[0] === "") return i;
	let c = parseFloat(s[1] || "1"), l = s[2];
	return Object.hasOwn(t, l) ? c * t[l] / o / a : Object.hasOwn(n, l) ? c * n[l] : l === "%" ? c / 100 * i : c * i;
}
function a(e) {
	return (100 * e).toFixed(1).replace(/\.?0+$/, "") + "%";
}
function o(e) {
	return Math.abs(e) < .001 ? "0" : e.toFixed(3).replace(/\.?0+$/, "") + "em";
}
function s(t, n = -e, r = 16) {
	return t *= r, n && t < n && (t = n), Math.abs(t) < .1 ? "0" : t.toFixed(1).replace(/\.0$/, "") + "px";
}
//#endregion
export { a, i, r as n, s as o, o as r, e as t };
