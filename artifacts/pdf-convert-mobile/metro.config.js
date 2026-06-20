const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// pdf-lib (CJS) does `require("tslib")`. Under Metro's package-exports resolution
// the bare "tslib" specifier maps to tslib's ESM build, whose default-import
// interop breaks under Hermes ("Cannot destructure property '__extends' of
// 'tslib.default' as it is undefined"). tslib's exports expose the CJS entry via
// the "./" subpath, so force the bare specifier to resolve to it.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return context.resolveRequest(context, "tslib/tslib.js", platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
