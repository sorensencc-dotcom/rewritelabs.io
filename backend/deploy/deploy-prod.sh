#!/bin/bash
set -e

APP_DIR="/var/www/rewritelabs-backend"
SERVICE_NAME="rewritelabs-backend"

echo "[deploy] pulling latest build"
rm -rf $APP_DIR/*
cp -R backend/* $APP_DIR/

cd $APP_DIR

echo "[deploy] installing deps"
npm install --omit=dev

echo "[deploy] restarting pm2 service"
pm2 restart $SERVICE_NAME || pm2 start server.js --name $SERVICE_NAME

echo "[deploy] done"