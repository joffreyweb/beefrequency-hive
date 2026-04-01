import { createRequire } from "module";
import { resolve } from "path";

let _sweph: any = null;

export function getSweph() {
  if (!_sweph) {
    // createRequire enables CJS require() in ESM context (Node.js native)
    const nodeRequire = createRequire(import.meta.url);
    _sweph = nodeRequire("sweph");
    _sweph.set_ephe_path(resolve(process.cwd(), "ephe"));
  }
  return _sweph;
}
