#!/usr/bin/env bash
set -euo pipefail

# Run on the project's Ubuntu VM. Installs the official Docker packages only.
if command -v docker >/dev/null 2>&1 && sudo docker compose version >/dev/null 2>&1; then
  echo 'Docker Engine and Compose are already installed.'
  exit 0
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
if [ "$ID" != 'ubuntu' ]; then
  echo 'This installer is intended for Ubuntu.' >&2
  exit 1
fi
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$VERSION_CODENAME" "$(dpkg --print-architecture)" | sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker --version
sudo docker compose version
