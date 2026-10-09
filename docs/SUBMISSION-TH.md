# เช็กลิสต์ส่งงานและบทเดโม 5 นาที

## สิ่งที่โค้ดเตรียมให้แล้ว

- Next.js + MongoDB self-hosted และ REST CRUD ครบ Equipment, Borrower, Loan
- UI รายการ รายละเอียด เพิ่ม แก้ไข ลบ พร้อม confirmation และ validation
- Dashboard และสถานะ Available / On loan / Overdue / Returned
- บันทึกคืน กันยืมซ้ำ และกันลบ equipment/borrower ที่มีประวัติ
- Docker Compose สำหรับ VM, README, screenshots, API/browser tests

## สิ่งที่คุณต้องทำก่อนส่ง

- [ ] ส่ง proposal ในฟอร์ม Teams ด้วยตัวเอง ให้ตรงหัวข้อและสมาชิกจริง
- [ ] หาก proposal ยังไม่ได้ส่ง ให้ตรวจวันที่กับอาจารย์ เพราะไม่ส่ง proposal จะได้ศูนย์ตามกฎ ส่วนวันกำหนดจริงไม่ได้ระบุในข้อความที่แนบ
- [ ] ตรวจนโยบายวิชาเรื่องการใช้ AI ช่วยเขียนโค้ดและทำความเข้าใจโค้ดที่ส่ง
- [x] เผยแพร่ source ที่ https://github.com/nongfresh8234-cloud/project-2
- [ ] ใส่ลิงก์ repo จริงของสมาชิกใน README/proposal ตามที่อาจารย์ต้องการ
- [x] ติดตั้งแอปบน Azure VM เดิม และเปิดเว็บที่ http://my-server.eastasia.cloudapp.azure.com
- [ ] ตรวจ URL production จากอุปกรณ์อื่น พร้อมให้ VM เปิดระหว่างตรวจงาน
- [x] เตรียมข้อมูลตัวอย่างสำหรับเดโมบนเว็บแล้ว
- [ ] อัดคลิป 5 นาทีและอัปโหลด YouTube ตั้ง Unlisted — ผู้ใช้ขอทำภายหลัง
- [ ] ส่ง URL production, GitHub repo และคลิปตามแบบส่งงาน

คะแนนตามข้อความที่ให้มา: Proposal 10, Repository/README 5, UI 5, CRUD 3 โมเดล 30, Deployment 10 รวม 60 คะแนน ไม่สามารถยืนยันคะแนนแทนอาจารย์ได้

## เตรียมก่อนอัดคลิป

เปิดเว็บจาก **production URL บน VM** และ GitHub repository ในอีกแท็บ เตรียมอุปกรณ์ว่าง ผู้ยืม และ loan เกินกำหนดหนึ่งรายการ โดยใช้ข้อมูลสมมติ ตรวจเสียงและขนาดตัวอักษรก่อนเริ่ม ไม่เปิด SSH key หรือข้อมูลบัญชีในคลิป

## บทและลำดับเดโม

| เวลา | สิ่งที่แสดง | แนวพูด |
| --- | --- | --- |
| 0:00–0:30 | ชื่อโปรเจกต์และ Dashboard | “ผม Pongpisit Arjnarong โปรเจกต์ Project 2 เป็นระบบจัดการยืมคืนอุปกรณ์สำหรับภาควิชา ช่วยรวมข้อมูลอุปกรณ์ ผู้ยืม และประวัติไว้ในที่เดียว พัฒนาด้วย Next.js และ MongoDB ที่รันบน Azure VM” |
| 0:30–1:20 | Equipment list → Create → Details → Edit → Search | “แต่ละ record แทนอุปกรณ์จริงหนึ่งชิ้น มีรหัสไม่ซ้ำ ผมเพิ่มอุปกรณ์ ดูรายละเอียด แก้ไข condition และค้นหาด้วยรหัสได้” ลองรหัสซ้ำเพื่อแสดง validation |
| 1:20–2:05 | Borrowers → Create → Details → Edit | “ผู้ยืมมีชื่อ อีเมล เบอร์โทร และภาควิชา เราสามารถเพิ่ม อ่าน และแก้ไขข้อมูลได้” ใช้อีเมลตัวอย่าง |
| 2:05–3:15 | New loan → Loan details → Edit → Record return | “ระบบเลือกอุปกรณ์ที่ว่างและผู้ยืมที่มีอยู่ เมื่อสร้าง loan อุปกรณ์จะเป็น On loan และไม่สามารถมี active loan ซ้ำ เมื่อบันทึกคืนจะกลับเป็น Available” แก้ due date/notes แล้วคืนให้เห็นผล |
| 3:15–4:00 | Overdue filter, history and delete protection | “Overdue คำนวณจาก due date ที่ผ่านไปและยังไม่คืน เราลบอุปกรณ์หรือผู้ยืมที่มีประวัติไม่ได้เพื่อรักษาความสัมพันธ์ของข้อมูล” ลองกดลบและแสดง error แล้ว Cancel |
| 4:00–4:35 | Delete incorrect loan and unused records | สร้าง loan ตัวอย่างที่ตั้งใจเป็นข้อมูลผิด แล้วลบผ่าน dialog จากนั้นลบ equipment และ borrower ที่ไม่มี loan history เพื่อแสดง Delete ครบ 3 โมเดล |
| 4:35–5:00 | Dashboard, production URL, GitHub README | “แอปทำงานบน VM ผ่าน Docker Compose มี Next.js กับ MongoDB self-hosted ไม่ใช้ managed backend หรือ serverless งานพัฒนาต่อคือ login, สิทธิ์, QR และแจ้งเตือน” เปิด README ให้เห็นสมาชิก screenshots และ source |

ลำดับนี้เป็นบทสำหรับคุณอัดเอง ยังไม่ได้สร้างหรืออัปโหลดวิดีโอ
