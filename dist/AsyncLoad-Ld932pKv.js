import { t as e } from "./mathjax-KVeV0VvI.js";
//#region node_modules/@mathjax/src/mjs/util/AsyncLoad.js
function t(t) {
	return e.asyncLoad ? new Promise((n, r) => {
		let i = e.asyncLoad(t);
		i instanceof Promise ? i.then((e) => n(e)).catch((e) => r(e)) : n(i);
	}) : Promise.reject(`Can't load '${t}': No mathjax.asyncLoad method specified`);
}
//#endregion
export { t };
