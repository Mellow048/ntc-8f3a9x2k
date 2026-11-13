#!/bin/bash
# A browser for local review stills, in a sandbox that cannot download Chrome (only the npm registry is reachable).
#
#   scripts/local-chromium.sh            # installs once, prints the path of the browser wrapper
#   REMOTION_BROWSER="$(scripts/local-chromium.sh)" REVIEW=<Film>Review scripts/pick.sh out/r1 100,200,300 540
#
# It unpacks the Chromium build of the npm package @sparticuz/chromium (made for AWS Lambda: one binary plus the
# libraries, a software GL and fonts it needs) into ~/.cache/chromium-probe, which survives between commands but not a
# sandbox reset. Run it again after a reset; it takes about a minute. Rendering on GitHub Actions does not use it.
set -euo pipefail
ROOT="${CHROMIUM_PROBE:-$HOME/.cache/chromium-probe}"
VER="${CHROMIUM_NPM_VERSION:-133.0.0}"
if [ ! -x "$ROOT/chrome-local" ] || [ ! -x "$ROOT/rt/chromium" ]; then
  mkdir -p "$ROOT/rt" && cd "$ROOT"
  [ -d node_modules/@sparticuz/chromium ] || npm i --no-audit --no-fund --silent "@sparticuz/chromium@$VER" >&2
  BIN="$ROOT/node_modules/@sparticuz/chromium/bin"
  node -e '
    const fs = require("fs"), zlib = require("zlib"), path = require("path"), {execFileSync} = require("child_process");
    const [bin, rt] = process.argv.slice(1);
    fs.writeFileSync(path.join(rt, "chromium"), zlib.brotliDecompressSync(fs.readFileSync(path.join(bin, "chromium.br"))), {mode: 0o755});
    for (const f of fs.readdirSync(bin).filter((f) => f.endsWith(".tar.br"))) {
      const tar = path.join(rt, f.replace(/\.br$/, ""));
      fs.writeFileSync(tar, zlib.brotliDecompressSync(fs.readFileSync(path.join(bin, f))));
      execFileSync("tar", ["-xf", tar, "-C", rt]); fs.unlinkSync(tar);
    }' "$BIN" "$ROOT/rt" >&2
  cat > "$ROOT/chrome-local" <<WRAP
#!/bin/bash
export LD_LIBRARY_PATH="$ROOT/rt/lib:$ROOT/rt\${LD_LIBRARY_PATH:+:\$LD_LIBRARY_PATH}"
export FONTCONFIG_PATH="$ROOT/rt"
exec "$ROOT/rt/chromium" "\$@"
WRAP
  chmod +x "$ROOT/chrome-local"
fi
echo "$ROOT/chrome-local"
