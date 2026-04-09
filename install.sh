#!/bin/sh
# Flownet CLI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/fnetai/cli/main/install.sh | sh
set -e

REPO="fnetai/cli"
INSTALL_DIR="$HOME/.fnet/bin"
BINARIES="frun fbin fservice"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case "$OS" in
  darwin) OS="darwin" ;;
  linux)  OS="linux" ;;
  mingw*|msys*|cygwin*) OS="windows" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64|amd64)  ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

echo "Detected platform: ${OS}-${ARCH}"

# Get latest release tag
echo "Fetching latest release..."
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
if [ -z "$LATEST" ]; then
  echo "Error: Could not determine latest release."
  exit 1
fi
echo "Latest release: ${LATEST}"

# Create install directory
mkdir -p "$INSTALL_DIR"

# Determine archive extension
EXT="tar.gz"
if [ "$OS" = "windows" ]; then
  EXT="zip"
fi

# Download and install each binary
BASE_URL="https://github.com/${REPO}/releases/download/${LATEST}"

for BIN in $BINARIES; do
  ARCHIVE="${BIN}-${OS}-${ARCH}.${EXT}"
  URL="${BASE_URL}/${ARCHIVE}"

  echo "Downloading ${BIN}..."
  if ! curl -fsSL -o "/tmp/${ARCHIVE}" "$URL"; then
    echo "Warning: Failed to download ${BIN} for ${OS}-${ARCH}. Skipping."
    continue
  fi

  # Extract
  if [ "$EXT" = "tar.gz" ]; then
    tar -xzf "/tmp/${ARCHIVE}" -C "$INSTALL_DIR"
  else
    unzip -o "/tmp/${ARCHIVE}" -d "$INSTALL_DIR" > /dev/null
  fi

  chmod +x "${INSTALL_DIR}/${BIN}" 2>/dev/null || true
  rm -f "/tmp/${ARCHIVE}"
  echo "  ✓ ${BIN} installed"
done

# Check if INSTALL_DIR is in PATH
case ":$PATH:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    echo ""
    echo "Add the following to your shell profile (.bashrc, .zshrc, etc.):"
    echo ""
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    echo ""
    ;;
esac

echo ""
echo "Flownet CLI installed successfully!"
echo "Installed binaries: ${BINARIES}"
echo "Location: ${INSTALL_DIR}"
