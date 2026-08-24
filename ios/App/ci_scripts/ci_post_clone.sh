#!/bin/sh

set -eu

cd "${CI_PRIMARY_REPOSITORY_PATH:-$(pwd)}"

# Capacitor's generated Swift package uses local paths into node_modules.
# Xcode Cloud checks out only tracked files, so install JS dependencies before
# Xcode attempts to resolve CapApp-SPM.
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

  if command -v brew >/dev/null 2>&1; then
    # Xcode Cloud includes Homebrew for installing build-time tools. Installing
    # pnpm also installs its Node.js dependency when the image lacks Node.
    export HOMEBREW_NO_AUTO_UPDATE=1
    brew install pnpm
    pnpm "$@"
    return
  fi

  echo "Xcode Cloud image does not provide pnpm, Corepack, or Homebrew." >&2
  exit 1
}

run_pnpm install --frozen-lockfile

# Cloud archives must always contain the production web bundle and must never
# inherit a local Capacitor live-reload server.
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.laindainwallet.com}"
unset CAPACITOR_LIVE_RELOAD
unset CAPACITOR_DEV_SERVER_URL

run_pnpm run build
run_pnpm exec cap sync ios
