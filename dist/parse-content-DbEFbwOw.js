//#region src/math/parse-content.ts
function e(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e.indexOf("$", n);
		if (r === -1) {
			n < e.length && t.push({
				type: "text",
				content: e.slice(n)
			});
			break;
		}
		r > n && t.push({
			type: "text",
			content: e.slice(n, r)
		});
		let i = e.indexOf("$", r + 1);
		if (i === -1) {
			t.push({
				type: "text",
				content: e.slice(r)
			});
			break;
		}
		let a = e.slice(r + 1, i);
		a.trim() && t.push({
			type: "math",
			content: a,
			display: !1
		}), n = i + 1;
	}
	return t;
}
function t(t) {
	let n = [], r = [], i = t.replace(/\$\$([\s\S]*?)\$\$/g, (e, t) => (r.push(t), "\0MATH_DISPLAY_\0" + (r.length - 1) + "\0")).split("\n");
	for (let t of i) {
		if (!t.trim()) continue;
		let i = t.trim().match(/^\x00MATH_DISPLAY_\x00(\d+)\x00$/);
		if (i) {
			let e = r[parseInt(i[1])];
			e?.trim() && n.push({
				kind: "display",
				segments: [{
					type: "math",
					content: e.trim(),
					display: !0
				}]
			});
			continue;
		}
		let a = e(t.replace(/\x00MATH_DISPLAY_\x00(\d+)\x00/g, (e, t) => `$$${r[parseInt(t)]}$$`)).filter((e) => e.content.trim());
		a.length > 0 && n.push({
			kind: "inline",
			segments: a
		});
	}
	return n;
}
//#endregion
export { t };
