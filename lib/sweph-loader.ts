import { createRequire } from "module";
import { resolve } from "path";

let _sweph: any = null;

export function getSweph() {
  if (!_sweph) {
    // createRequire enables CJS require() in ESM context (Node.js native)
    const nodeRequire = createRequire(import.meta.url);
    _sweph = nodeRequire("sweph");
    _sweph.set_ephe_path(resolve(process.cwd(), "ephe"));

    // Debug: log sweph API format (J2000, Sun, SEFLG_SWIEPH)
    try {
      const testJd = _sweph.julday(2000, 1, 1, 12, 1);
      const testCalc = _sweph.calc_ut(testJd, 0, 2);
      const testHouses = _sweph.houses(testJd, 48.85, 2.35, "O");
      console.log("[sweph-debug] julday result:", testJd);
      console.log("[sweph-debug] calc_ut result:", JSON.stringify(testCalc));
      console.log("[sweph-debug] calc_ut type:", typeof testCalc, Array.isArray(testCalc));
      console.log("[sweph-debug] houses result keys:", testHouses ? Object.keys(testHouses) : "undefined");
      console.log("[sweph-debug] houses.data type:", testHouses?.data ? Object.keys(testHouses.data) : "undefined");
      console.log("[sweph-debug] exports:", Object.keys(_sweph).slice(0, 20));
    } catch (e) {
      console.log("[sweph-debug] error:", e);
    }
  }
  return _sweph;
}
