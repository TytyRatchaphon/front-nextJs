# 📋 Frontend Implementation Guide: Real-time Token Refresh

## 🎯 เป้าหมาย

เมื่อ User เติมเงิน/ซื้อแพ็คเกจสำเร็จ -> หน้าเว็บจะได้รับ event `force_refresh` แบบ real-time -> Frontend ต้อง refresh token อัตโนมัติเพื่ออัพเดทยอดเงินใน UI

---

## 📐 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │◄────│  Socket.IO  │◄────│   Backend   │
│  (Browser)  │     │   Server    │     │ StoreService│
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   ▲                   │
       │                   │                   │
       │        event:     │    Redis Pub/Sub  │
       │    force_refresh  │◄──────────────────┘
       │                   │
       └───────────────────┘
```

---

## 🔧 สิ่งที่ Frontend ต้องทำ

### 1. ติดตั้ง Socket.IO Client

```bash
npm install socket.io-client
# หรือ
yarn add socket.io-client
```

### 2. เชื่อมต่อ Socket พร้อมส่ง user_id

```javascript
import { io } from "socket.io-client";

// สร้าง connection (ควรทำครั้งเดียวเมื่อ login สำเร็จ)
const socket = io("https://api.enjoybook.co", {
  query: {
    user_id: currentUser.user_id, // ⚠️ จำเป็นต้องส่ง
    fullname: currentUser.fullname, // optional
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// เก็บ socket instance ไว้ใน global state (Redux/Zustand/Context)
```

### 3. ฟัง Event `force_refresh`

```javascript
// ⭐ สำคัญที่สุด: ต้อง listen event นี้
socket.on("force_refresh", async (data) => {
  console.log("📢 Received force_refresh:", data);
  // data = { action: 'refresh_token', timestamp: 1706432400000 }

  try {
    // เรียก API refresh token
    const response = await fetch("/api/refresh-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getCurrentToken()}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      const newToken = result.data; // token string

      // อัพเดท token ใน storage
      localStorage.setItem("accessToken", newToken);

      // อัพเดท state/store (เพื่อให้ UI refresh)
      updateUserState(decodeToken(newToken));

      console.log("✅ Token refreshed successfully");
    }
  } catch (error) {
    console.error("❌ Failed to refresh token:", error);
  }
});
```

### 4. Handle Reconnection

```javascript
// เมื่อ reconnect สำเร็จ ควร refresh token ด้วย (กันพลาด event)
socket.on("connect", () => {
  console.log("🔌 Socket connected");

  // ถ้าเคย disconnect แล้ว reconnect -> refresh token
  if (wasDisconnected) {
    refreshToken();
  }
});

socket.on("disconnect", () => {
  console.log("🔌 Socket disconnected");
  wasDisconnected = true;
});
```

### 5. Cleanup เมื่อ Logout

```javascript
function logout() {
  // ปิด socket connection
  socket.disconnect();

  // ล้าง token
  localStorage.removeItem("accessToken");

  // redirect
  router.push("/login");
}
```

---

## 🧪 วิธีทดสอบ

### ทดสอบผ่าน Browser Console

```javascript
// ดู socket connection status
console.log("Connected:", socket.connected);
console.log("Socket ID:", socket.id);

// ทดสอบ manual force_refresh
socket.emit("ping"); // ควรได้ 'pong' กลับมา
```

### ทดสอบผ่าน API (Backend)

```bash
# จำลองการเติมเงิน (เปลี่ยน USER_ID เป็น ID จริงของคุณ)
curl http://localhost:4005/admin/socket/test-publish/USER_ID

# ดู users ที่ connect อยู่
curl http://localhost:4005/admin/socket/connected-users
```

---

## ⚠️ สิ่งที่ต้องระวัง

| หัวข้อ                         | รายละเอียด                                             |
| ------------------------------ | ------------------------------------------------------ |
| **user_id ต้องส่งตอน connect** | ถ้าไม่ส่ง จะไม่ได้รับ event `force_refresh`            |
| **Multiple Tabs**              | ทุก tab จะได้รับ event เหมือนกัน (ถูกต้องแล้ว)         |
| **Token ใน Header**            | ตอนเรียก `/api/refresh-token` ต้องส่ง Token เดิมไปด้วย |
| **Error Handling**             | ถ้า refresh ไม่สำเร็จ ไม่ควร force logout              |

---

## 📡 Events ที่ Backend ส่งมา

| Event              | Data                                             | ความหมาย                    |
| ------------------ | ------------------------------------------------ | --------------------------- |
| `force_refresh`    | `{ action: 'refresh_token', timestamp: number }` | ให้ refresh token ทันที     |
| `useronline`       | `{ data: { count, users } }`                     | จำนวนคนออนไลน์ (ถ้าต้องการ) |
| `notification:new` | notification object                              | แจ้งเตือนใหม่               |

---

## 🔗 API Endpoints ที่เกี่ยวข้อง

| Method | Endpoint                             | Description                             |
| ------ | ------------------------------------ | --------------------------------------- |
| GET    | `/api/refresh-token`                 | Refresh token (ส่ง Bearer token เดิมไป) |
| GET    | `/admin/socket/connected-users`      | ดู users ที่ connect อยู่ (dev only)    |
| GET    | `/admin/socket/test-publish/:userId` | จำลองส่ง force_refresh (dev only)       |

---

## 📝 Example: React Hook

```javascript
// useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

export function useSocket() {
  const socketRef = useRef(null);
  const { user, refreshToken } = useAuth();

  useEffect(() => {
    if (!user?.user_id) return;

    // Connect
    socketRef.current = io(process.env.REACT_APP_API_URL, {
      query: {
        user_id: user.user_id,
        fullname: user.fullname,
      },
    });

    // Listen for force_refresh
    socketRef.current.on("force_refresh", async () => {
      console.log("📢 Force refresh received");
      await refreshToken();
    });

    // Cleanup
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?.user_id]);

  return socketRef.current;
}
```

---

## ✅ Checklist สำหรับ Frontend

- [ ] ติดตั้ง `socket.io-client`
- [ ] เชื่อมต่อ Socket เมื่อ login สำเร็จ (ส่ง `user_id` ไปด้วย)
- [ ] ฟัง event `force_refresh` แล้วเรียก refresh token API
- [ ] อัพเดท UI หลังได้ token ใหม่
- [ ] Handle reconnection (refresh token เมื่อ reconnect)
- [ ] Disconnect เมื่อ logout
- [ ] ทดสอบด้วย `/admin/socket/test-publish/:userId`
