#!/bin/bash
set -e

echo "[deploy] sending build to server"
scp -r backend $PROD_USER@$PROD_HOST:/tmp/backend-build

echo "[deploy] running remote deploy script"
ssh $PROD_USER@$PROD_HOST "bash -s" << 'EOF'
  bash /tmp/backend-build/deploy/deploy-prod.sh
EOF

echo "[deploy] complete"