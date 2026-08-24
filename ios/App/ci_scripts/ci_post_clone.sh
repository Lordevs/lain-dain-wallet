#!/bin/sh

set -eu

cd "${CI_PRIMARY_REPOSITORY_PATH:-$(pwd)}"

# Capacitor's generated Swift package uses local paths into node_modules.
# Xcode Cloud checks out only tracked files, so install JS dependencies before
# Xcode attempts to resolve CapApp-SPM.
if ! command -v node >/dev/null 2>&1 || {
  ! command -v pnpm >/dev/null 2>&1 &&
  ! command -v corepack >/dev/null 2>&1
}; then
  BREW_BIN="$(command -v brew 2>/dev/null || true)"

  if [ -z "$BREW_BIN" ] && [ -x /opt/homebrew/bin/brew ]; then
    BREW_BIN=/opt/homebrew/bin/brew
  elif [ -z "$BREW_BIN" ] && [ -x /usr/local/bin/brew ]; then
    BREW_BIN=/usr/local/bin/brew
  fi

  if [ -z "$BREW_BIN" ]; then
    echo "Xcode Cloud image does not provide Node.js, pnpm/Corepack, or Homebrew." >&2
    exit 1
  fi

  export HOMEBREW_NO_AUTO_UPDATE=1
  "$BREW_BIN" install node pnpm

  BREW_PREFIX="$("$BREW_BIN" --prefix)"
  PATH="$BREW_PREFIX/bin:$PATH"
  export PATH
fi

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    export COREPACK_HOME="${CI_DERIVED_DATA_PATH:-${TMPDIR:-/tmp}}/corepack"
    corepack pnpm "$@"
    return
  fi

  echo "pnpm installation completed but its executable is unavailable." >&2
  exit 1
}

echo "Node.js: $(node --version)"
echo "pnpm: $(run_pnpm --version)"

run_pnpm install --frozen-lockfile

# Cloud archives must always contain the production web bundle and must never
# inherit a local Capacitor live-reload server.
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.laindainwallet.com}"
unset CAPACITOR_LIVE_RELOAD
unset CAPACITOR_DEV_SERVER_URL

run_pnpm run build
run_pnpm exec cap sync ios
