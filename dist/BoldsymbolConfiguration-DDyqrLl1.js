import { C as e, S as t, b as n, o as r, t as i, x as a } from "./Configuration-D9a4xjiL.js";
import { t as o } from "./NodeFactory-vJK_Ykma.js";
//#region node_modules/@mathjax/src/mjs/input/tex/boldsymbol/BoldsymbolConfiguration.js
var s = {};
s[t.Variant.NORMAL] = t.Variant.BOLD, s[t.Variant.ITALIC] = t.Variant.BOLDITALIC, s[t.Variant.FRAKTUR] = t.Variant.BOLDFRAKTUR, s[t.Variant.SCRIPT] = t.Variant.BOLDSCRIPT, s[t.Variant.SANSSERIF] = t.Variant.BOLDSANSSERIF, s["-tex-calligraphic"] = "-tex-bold-calligraphic", s["-tex-oldstyle"] = "-tex-bold-oldstyle", s["-tex-mathit"] = t.Variant.BOLDITALIC, new r("boldsymbol", { boldsymbol: { Boldsymbol(e, t) {
	let n = e.stack.env.boldsymbol;
	e.stack.env.boldsymbol = !0;
	let r = e.ParseArg(t);
	e.stack.env.boldsymbol = n, e.Push(r);
} }.Boldsymbol });
function c(t, n, r, i) {
	let a = o.createToken(t, n, r, i);
	return n !== "mtext" && t.configuration.parser.stack.env.boldsymbol && (e.setProperty(a, "fixBold", !0), t.configuration.addNode("fixBold", a)), a;
}
function l(t) {
	for (let n of t.data.getList("fixBold")) if (e.getProperty(n, "fixBold")) {
		let t = e.getAttribute(n, "mathvariant");
		e.setAttribute(n, "mathvariant", s[t] || t), e.removeProperties(n, "fixBold");
	}
}
i.create("boldsymbol", {
	[n.HANDLER]: { [a.MACRO]: ["boldsymbol"] },
	[n.NODES]: { token: c },
	[n.POSTPROCESSORS]: [l]
});
//#endregion
