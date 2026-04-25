#!/bin/bash
set -e

REPO_ROOT="/mnt/c/Users/soren/google-drive-mcp/rewrite-mcp"
SUBMODULE_PATH="$REPO_ROOT/castironforge"
SUBMODULE_URL="https://github.com/sorensencc-dotcom/castironforge.git"

echo "=== RewriteMCP Submodule Auto-Fix ==="
cd "$REPO_ROOT"

# 1. Ensure repo exists
if [ ! -d ".git" ]; then
    echo "[!] ERROR: No .git folder found in $REPO_ROOT"
    exit 1
fi

# 2. Detect if castironforge is already a submodule
if git config --file .gitmodules --get-regexp path | grep -q "castironforge"; then
    echo "[OK] castironforge already registered as submodule."
else
    echo "[*] castironforge NOT registered as submodule. Fixing..."
fi

# 3. Force Git to see the folder (nested repo)
echo "[*] Forcing Git to recognize castironforge..."
git add -f castironforge || true

# 4. Remove nested repo from index
echo "[*] Removing nested repo from index..."
git rm -f -r --cached castironforge || true

# 5. Add as proper submodule
echo "[*] Adding castironforge as submodule..."
git submodule add "$SUBMODULE_URL" castironforge || true

# 6. Commit the fix
echo "[*] Committing submodule fix..."
git add . 
git commit -m "Automated: castironforge converted to proper submodule" || true

echo "=== Submodule Fix Complete ==="
