let _sweph: any = null;

export function getSweph() {
  if (!_sweph) {
    // Dynamic require hidden from Turbopack's static analysis
    const dynamicRequire = new Function("moduleName", "return require(moduleName)");
    _sweph = dynamicRequire("sweph");
    const path = dynamicRequire("path");
    _sweph.set_ephe_path(path.resolve(process.cwd(), "ephe"));
  }
  return _sweph;
}
