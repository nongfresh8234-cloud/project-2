# Project 2 deployment

Application: [http://my-server.eastasia.cloudapp.azure.com](http://my-server.eastasia.cloudapp.azure.com)

Fallback IP URL: [http://20.255.52.202](http://20.255.52.202)

Source: [nongfresh8234-cloud/project-2](https://github.com/nongfresh8234-cloud/project-2)

Deployed on 9 October 2026 to the owner's existing Azure for Students VM `my-server`, Ubuntu 24.04 x64, 2 vCPU / 4 GiB RAM. No new VM or paid service was created. Docker Engine and Compose were installed from the official Docker Ubuntu repository. The app is located at `/home/azureuser/project-2`.

Next.js runs in its standalone production container, mapped from VM port 80 to container port 3000. MongoDB 8 runs in a separate container as a one-node replica set, with a persistent Docker volume and no published database port. The existing Azure HTTP rule was already present and was reused; no inbound network rules were added.

`/api/health` was checked from inside the VM and over its public IP. The database was explicitly seeded with synthetic demonstration records only. API tests were run against the deployed POC. The repository excludes `.local-data`, `.env` files, private SSH keys and generated video files.

## Operations

SSH into the VM with your existing key, then:

```bash
cd /home/azureuser/project-2
sudo docker compose ps -a
sudo docker compose logs --tail=100 web
curl -fsS http://127.0.0.1/api/health
```

To restart without deleting data:

```bash
sudo docker compose restart web mongo
```

For a rebuild, preserve the public port setting:

```bash
APP_PORT=80 sudo -E docker compose up -d --build
```

`mongo-init` exiting with code 0 is expected. It initializes the replica set and does not need to run continuously. Do not use `docker compose down -v` unless you explicitly intend to erase the MongoDB volume.

This is the proposed unauthenticated academic POC. The public site is for synthetic demo data; anyone who can reach it can manage records. User authentication, permissions and HTTPS are future deployment enhancements. Keep the VM running during instructor assessment. The existing VM is configured as Azure Spot and may be evicted; monitor it before submission and demonstration.

YouTube upload and the instructor's Teams submission are tracked separately; this document does not claim those steps are complete.
