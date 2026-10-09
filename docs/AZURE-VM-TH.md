# นำ Project 2 ขึ้น Azure Virtual Machine ทีละขั้น

คู่มือนี้ใช้ **Azure Virtual Machine (Ubuntu)** ให้ Next.js และ MongoDB ทำงานบนเครื่องเดียวกันด้วย Docker Compose ตรงตามข้อกำหนดใน proposal

## 1. เตรียมก่อนเริ่ม

- บัญชี Azure ที่มี subscription ของมหาวิทยาลัยหรือ Azure for Students ตามที่อาจารย์ให้
- โปรเจกต์นี้บนเครื่อง Windows และบัญชี GitHub ของคุณ
- VM มีค่าใช้จ่ายตาม subscription, region และขนาดเครื่อง ตรวจเครดิตและยอดประมาณการใน Portal ก่อนกดสร้าง ไม่สามารถรับรองว่าใช้ฟรี
- ไม่ต้องส่งรหัสผ่าน, private SSH key, recovery code หรือข้อมูลบัตรมาในแชต

## 2. สร้าง VM ใน Azure Portal

เข้า [Azure Portal](https://portal.azure.com) แล้วค้นหา **Virtual machines** → **Create** → **Azure virtual machine** เลือก subscription ที่อาจารย์อนุญาต และสร้าง Resource group ชื่อ `project-2-rg` เพื่อรวมทรัพยากรของงานนี้

ตั้งชื่อ VM `project-2-vm` เลือก region ที่ subscription ใช้ได้ และ image **Ubuntu Server 24.04 LTS — x64** เลือกขนาดอย่างน้อย 2 vCPU / 4 GiB RAM สำหรับ build Next.js กับ MongoDB; 2 vCPU / 8 GiB จะมีพื้นที่ RAM มากกว่า แต่ต้องดูราคาจริงและ quota ก่อน อย่าเลือก Spot สำหรับงานที่ต้องเปิดให้อาจารย์ตรวจต่อเนื่อง

เลือก Authentication type **SSH public key**, username `azureuser` และ Generate new key pair ตั้งชื่อ `project-2-key` เปิด SSH 22 เพื่อเชื่อมต่อ ส่วนหน้า Disks เลือกขนาดที่พอสำหรับ Docker images และฐานข้อมูล เช่น 30 GiB ขึ้นไป ตรวจยอดรวมของ VM และ disk ก่อนสร้าง

กด **Review + create** อ่าน validation และค่าใช้จ่าย แล้วกด **Create** ด้วยตัวคุณเอง ดาวน์โหลด private key `.pem` เมื่อ Azure แจ้ง เก็บไว้ที่ปลอดภัย เพราะใช้เข้า VM ไม่ต้องอัปโหลดไป GitHub รอ deployment เสร็จแล้วกด **Go to resource**

ดูแนวทางและตำแหน่งเมนูล่าสุดใน [Microsoft: Create a Linux VM in the Azure portal](https://learn.microsoft.com/azure/virtual-machines/linux/quick-create-portal?tabs=ubuntu) หน้าตา Portal อาจต่างเล็กน้อยตาม subscription

## 3. เปิดพอร์ตของเว็บ

หน้า VM → **Networking / Network settings** → Network security group → **Inbound security rules** → Add ตั้ง Source เป็น Any สำหรับเว็บเดโม, Source port ranges เป็น `*`, Destination เป็น Any, Service เป็น Custom, Destination port ranges เป็น `3000`, Protocol เป็น TCP, Action เป็น Allow, Priority เป็นค่าที่ไม่ชน เช่น `310`, Name เป็น `Allow-Project 2-3000`

พอร์ต 22 สำหรับ SSH ควรจำกัด Source เป็น public IP ของคุณถ้าทำได้ ไม่ต้องเปิดพอร์ต MongoDB 27017 เพราะแอปเชื่อมฐานข้อมูลภายใน Docker network อยู่แล้ว

หากอาจารย์ต้องการ URL ไม่มี `:3000` ให้เปิด TCP 80 แทน แล้วใช้ `APP_PORT=80` ตอนรันตามหัวข้อ 7

## 4. เชื่อมต่อจาก PowerShell บน Windows

ในหน้า Overview ของ VM คัดลอก **Public IP address** แล้วเปิด PowerShell บนเครื่องคุณ คำสั่งต่อไปนี้เป็นตัวอย่าง ต้องแทน `YOUR_VM_PUBLIC_IP` ด้วย IP จริงและปรับตำแหน่งไฟล์ key:

```powershell
ssh -i "$env:USERPROFILE\Downloads\project-2-key.pem" azureuser@YOUR_VM_PUBLIC_IP
```

ครั้งแรกตรวจว่า IP ตรงกับหน้า Portal ก่อนตอบ `yes` เมื่อเชื่อมต่อสำเร็จ prompt จะเปลี่ยนเป็น Ubuntu คำสั่งตั้งแต่หัวข้อ 6 ให้รัน **บน VM**

ถ้าพบ `Permission denied (publickey)` ตรวจ username, path ของ key และ key pair ที่เลือกไว้ หาก Windows แจ้งว่า permission ของ private key เปิดกว้าง ให้ปรับ Security ของไฟล์ให้เฉพาะบัญชีคุณอ่านได้แล้วลองใหม่ ดู [Microsoft: Connect to a Linux VM](https://learn.microsoft.com/en-us/azure/virtual-machines/linux-vm-connect) สำหรับวิธีเชื่อมต่ออื่น

## 5. สร้าง GitHub repository ของตัวเอง

ทำส่วนนี้บน GitHub และ PowerShell เครื่อง Windows:

1. กด New repository ตั้งชื่อ `equiptrack` เลือก Public ตามข้อกำหนดส่ง source ไม่เพิ่ม README/.gitignore/license อัตโนมัติเพราะโปรเจกต์มีไฟล์แล้ว
2. ในโฟลเดอร์โปรเจกต์ รันคำสั่งด้านล่าง โดย URL ต้องเป็น repo **ของคุณเอง** ที่เพิ่งสร้าง

```powershell
cd C:\Users\Nongf\Downloads\project2
git init
git add .
git commit -m "Build Project 2 equipment borrowing proof of concept"
git branch -M main
git remote add origin https://github.com/nongfresh8234-cloud/project-2.git
git push -u origin main
```

ถ้า Git ขอชื่อ/email ให้ตั้งค่าด้วยข้อมูล GitHub ของคุณ หาก authentication ไม่ผ่าน ให้ใช้ขั้นตอน sign-in ของ GitHub/Git Credential Manager แทนการใส่รหัสผ่านบัญชีเป็น token อัปเดต URL repo จริงใน README และ proposal ก่อนส่ง แยก commit ตามงานที่ทำต่อไปตามจริง ไม่สร้าง commit ย้อนหลังเพื่อแสดงชั่วโมงทำงาน

กฎห้าม clone repo คนอื่นมาแก้ส่ง แต่การ clone **repo ที่คุณสร้างเอง** มายัง VM เพื่อ deploy เป็นขั้นตอนนำ source ของคุณขึ้นเครื่องปลายทาง

## 6. ติดตั้ง Docker บน Ubuntu VM

หลัง SSH เข้า VM แล้ว รันบล็อกนี้เพื่อติดตั้ง Docker จาก repository ทางการ:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$VERSION_CODENAME" "$(dpkg --print-architecture)" | sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker --version
sudo docker compose version
```

อ้างอิงขั้นตอนติดตั้งจาก [Docker: Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) คู่มือนี้ใช้ `sudo docker` จึงไม่ต้องเพิ่มบัญชีเข้ากลุ่ม docker

## 7. ดาวน์โหลด source ของคุณและเปิดระบบ

บน VM รัน โดยแทน URL ด้วย repository จริงที่คุณเผยแพร่ไว้:

```bash
git clone https://github.com/nongfresh8234-cloud/project-2.git
cd project-2
sudo docker compose up -d --build
sudo docker compose ps -a
curl http://localhost:3000/api/health
```

รอ build ครั้งแรก เมื่อสำเร็จ `web` กับ `mongo` จะเป็น Running/Healthy ส่วน `mongo-init` เป็น Exited (0) ถือว่าปกติ เพราะมีหน้าที่ตั้งค่า replica set เพียงครั้งเดียว Health API ควรคืน `{"data":{"status":"ok"}}`

ถ้าใช้พอร์ต 80 ให้เปลี่ยนคำสั่งเปิดระบบและตรวจเป็น:

```bash
APP_PORT=80 sudo -E docker compose up -d --build
curl http://localhost/api/health
```

เปิด browser ของเครื่อง Windows ไปที่ `http://YOUR_VM_PUBLIC_IP:3000` หรือ `http://YOUR_VM_PUBLIC_IP` สำหรับพอร์ต 80 ใช้ **http** ตามตัวอย่างนี้ ยังไม่ได้ตั้งโดเมน/TLS หากต้องใช้งานข้อมูลจริงควรตั้ง HTTPS และ authentication ก่อน

ฐานข้อมูลใหม่จะว่าง ให้ใช้ฟอร์มเพิ่มอุปกรณ์และผู้ยืม แล้วลองยืมและคืนผ่านเว็บ ข้อมูลเก็บใน Docker volume ไม่หายเมื่อ restart container

## 8. ตรวจให้พร้อมส่ง

- เปิด URL จากโทรศัพท์ผ่านเน็ตมือถือ เพื่อยืนยันว่าคนอื่นเข้าได้ ไม่ใช่เฉพาะใน VM
- เพิ่มอุปกรณ์ → เพิ่มผู้ยืม → สร้าง loan → บันทึกคืน → ตรวจ Dashboard
- ตรวจว่า refresh แล้วยังเห็นข้อมูล และ restart container แล้วข้อมูลยังอยู่
- ทดลองรหัสอุปกรณ์ซ้ำและลบอุปกรณ์ที่มี loan history ต้องขึ้นข้อความปฏิเสธ
- ใส่ URL production จริงใน README และแบบส่งงาน พร้อมลิงก์ GitHub และ YouTube Unlisted
- ให้ VM เปิดอยู่ในช่วงอาจารย์ตรวจ ถ้าตั้ง Auto-shutdown ต้องปรับไม่ให้ตัดช่วงนั้น

## 9. แก้ปัญหาที่พบบ่อย

**เปิดเว็บไม่ได้:** ตรวจ VM เป็น Running, Public IP ถูกต้อง, พอร์ตใน URL ตรงกับ APP_PORT, inbound NSG อนุญาต TCP พอร์ตนั้น และ `docker compose ps -a` มี web Running หาก firewall ใน Ubuntu เปิดอยู่ต้องอนุญาตพอร์ตที่เลือกด้วย

**เว็บขึ้น แต่โหลดข้อมูลไม่ได้:** ดู `sudo docker compose logs --tail=100 web mongo mongo-init` ถ้า replica set ยังไม่พร้อมให้ดู mongo-init ก่อน อย่าเปลี่ยนไปใช้ MongoDB Atlas เพราะ proposal กำหนด self-hosted

**Build ถูก kill / memory ไม่พอ:** ตรวจ `free -h` และ `df -h` หาก RAM ไม่พอให้หยุดโปรเซสที่ไม่จำเป็น หรือเปลี่ยน VM size หลังตรวจค่าใช้จ่าย อาจใช้ 8 GiB สำหรับ build ได้สะดวกกว่า

**อัปเดตโค้ดบน VM:** `git pull` แล้ว `sudo docker compose up -d --build` ข้อมูลอยู่ใน volume เดิม

**หยุดแอป:** `sudo docker compose down` เก็บฐานข้อมูลไว้ อย่าเติม `-v` เว้นแต่ตั้งใจลบข้อมูล

**หลังส่งเสร็จ:** เมื่ออาจารย์ตรวจเรียบร้อย ค่อย Stop (deallocate) VM ใน Portal ตรวจสถานะว่า deallocated เพราะการปิด Ubuntu อย่างเดียวอาจไม่หยุดค่าประมวลผล Disk/IP และทรัพยากรอื่นอาจยังมีค่าใช้จ่าย หากไม่ใช้ต่อให้สำรองข้อมูลแล้วลบ Resource group ของงานนี้ หลังตรวจว่าไม่มีทรัพยากรอื่นที่ต้องเก็บ ดูยอดจริงใน Cost Management

## สถานะของคู่มือนี้

อัปเดต 9 ตุลาคม 2026: เชื่อมต่อ VM เดิมของคุณชื่อ my-server และติดตั้ง Docker/Compose พร้อม deploy จริงเรียบร้อยแล้ว ไม่ได้สร้าง VM เพิ่ม ตรวจผลและ URL จริงใน [DEPLOYMENT.md](DEPLOYMENT.md) คู่มือด้านบนเก็บไว้สำหรับการติดตั้งซ้ำหรือสร้างเครื่องใหม่ในอนาคต
