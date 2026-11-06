#!/usr/bin/env bash
# [DOC: deploy-oracle]
set -euo pipefail

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

if ! swapon --show | grep -q .; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -p tcp --dport "$port" -j ACCEPT
done
sudo apt-get install -y iptables-persistent >/dev/null
sudo netfilter-persistent save

mkdir -p "$HOME/rac"
echo "Done. Log out and back in so the docker group applies."
