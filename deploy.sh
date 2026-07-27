#!/usr/bin/env bash
# 🐝 Déploiement manuel BeeFrequency Hive — Mac → VPS Infomaniak
# Réplique le workflow GitHub Actions (rsync + build + db push + pm2).
# Usage :  cd ~/beefrequency-hive && ./deploy.sh
set -euo pipefail

VPS="ubuntu@83.228.246.147"
KEY="$HOME/.ssh/id_rsa"
SRC="$HOME/beefrequency-hive/"
DEST="/var/www/hive"

echo "🐝 Déploiement Hive → $VPS"
echo "→ 1/2  Envoi des fichiers (rsync)…"
rsync -avz --delete \
  --exclude='.env' --exclude='node_modules' --exclude='.next' \
  --exclude='uploads' --exclude='.git' --exclude='_to_delete' --exclude='deploy.sh' \
  -e "ssh -i $KEY" \
  "$SRC" "$VPS:$DEST/"

echo "→ 2/2  Build + migration DB + redémarrage sur le VPS…"
ssh -i "$KEY" "$VPS" "cd $DEST && rm -rf .next && npm install --production=false && npx prisma generate && npx prisma db push && npm run build && (fuser -k 3001/tcp 2>/dev/null || true) && (pm2 delete hive 2>/dev/null || true) && sleep 2 && pm2 start npm --name hive -- start && pm2 save"

echo ""
echo "✅ Déploiement terminé — pense au hard refresh (Cmd+Shift+R) côté navigateur."
