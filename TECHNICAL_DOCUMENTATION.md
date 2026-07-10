# Technical Documentation: Result-Based Web Platform

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [Admin Features](#4-admin-features)
5. [User Features](#5-user-features)
6. [Security](#6-security)
7. [API / Cloud Functions](#7-api--cloud-functions)
8. [Frontend Implementation](#8-frontend-implementation)
9. [Performance Optimization](#9-performance-optimization)
10. [Deployment](#10-deployment)
11. [Future Enhancements](#11-future-enhancements)

---

## 1. Project Overview

### 1.1 Purpose

A real-time result display platform that publishes daily game results (Gali, Desawar, Ghaziabad, Faridabad, and others) with historical chart records, push notifications, and an admin management dashboard. The platform serves as an information portal for users tracking daily results.

### 1.2 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Visitor** | Anonymous user browsing results | Read-only access to public results, charts, and contact info |
| **Subscriber** | User who opted into push notifications | Read-only + receives push notifications |
| **Admin** | Platform manager | Full CRUD on results, charts, banners, ads, notifications |
| **Super Admin** | Owner / primary administrator | All admin access + manage other admins, security rules, analytics |

### 1.3 Main Modules

```
Platform
├── Public Website
│   ├── Live Results Display
│   ├── Historical Chart Records
│   ├── Search & Filter
│   ├── Contact / WhatsApp Integration
│   └── Advertisement Display
│
├── Admin Dashboard
│   ├── Result Management
│   ├── Chart Management
│   ├── Banner Management
│   ├── Notification Management
│   ├── Advertisement Management
│   └── Analytics Dashboard
│
├── Notification System
│   ├── Firebase Cloud Messaging (FCM)
│   └── Push Notification Triggers
│
└── Backend Services
    ├── Firebase Cloud Functions
    ├── Firestore Real-time Database
    ├── Firebase Authentication
    └── Firebase Storage
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Next.js App  │  │ Admin Panel  │  │  Service Worker (PWA) │ │
│  │  (Public UI)  │  │  (Dashboard) │  │  (Push Notifications) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FIREBASE LAYER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Cloud        │  │  Firestore   │  │  Firebase Auth        │ │
│  │  Functions    │  │  (Database)  │  │  (Admin Login)        │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Cloud        │  │  Firebase    │  │  Firebase Hosting     │ │
│  │  Messaging    │  │  Storage     │  │  (Static Deploy)      │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Flow

```
User Request
    │
    ▼
Next.js SSR / SSG Page
    │
    ├── Static Pages (SSG) ──── Home, About, Contact
    │
    ├── ISR Pages ──────────── Result pages (revalidate: 60s)
    │
    └── Client-side ────────── Real-time Firestore listeners
                                for live result updates
```

### 2.3 Real-Time Data Flow

```
Admin Updates Result
    │
    ▼
Cloud Function Triggered (onWrite)
    │
    ├──► Update Firestore document
    │
    ├──► Invalidate ISR cache (revalidation webhook)
    │
    └──► Send FCM push notification to subscribed users
              │
              ▼
         User devices receive notification
         Browser auto-refreshes via Firestore onSnapshot
```

### 2.4 Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | Next.js 14 (Pages or App Router) | SSR, SSG, ISR, routing |
| UI Styling | Tailwind CSS | Responsive design, utility-first CSS |
| Database | Firebase Firestore | NoSQL real-time database |
| Authentication | Firebase Auth | Admin login (email/password) |
| Backend Logic | Firebase Cloud Functions (Node.js) | API endpoints, triggers, notifications |
| Push Notifications | Firebase Cloud Messaging (FCM) | Browser push notifications |
| File Storage | Firebase Storage | Banner images, ad creatives |
| Hosting | Firebase Hosting | Static + SSR deployment |
| Analytics | Google Analytics 4 + Firebase Analytics | User tracking, page views |

---

## 3. Database Design

### 3.1 Firestore Collections Overview

```
firestore-root/
├── daily_results/
├── charts_history/
├── admins/
├── users/
├── notifications/
├── banners/
├── advertisements/
├── site_config/
└── contact_messages/
```

### 3.2 Collection: `daily_results`

Stores daily results for each game. Document ID format: `{YYYY-MM-DD}`.

```typescript
// Collection: daily_results
// Document ID: "2026-05-16"
interface DailyResult {
  date: string;                    // "2026-05-16"
  results: GameResult[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;               // admin UID
}

interface GameResult {
  gameName: string;                // "GALI", "DESAWAR", "GHAZIABAD", "FARIDABAD"
  gameCode: string;                // "gali", "desawar", "ghaziabad", "faridabad"
  result: string;                  // "45" (two-digit result)
  resultTime: string;              // "11:30 PM"
  status: "pending" | "declared";
  declaredAt: Timestamp | null;
}
```

**Indexes:**
- `date` (descending) — for listing recent results
- `results.gameName` + `date` — for filtering by game

### 3.3 Collection: `charts_history`

Monthly chart records for historical data. Document ID format: `{gameCode}_{YYYY-MM}`.

```typescript
// Collection: charts_history
// Document ID: "gali_2026-05"
interface ChartHistory {
  gameCode: string;               // "gali"
  gameName: string;               // "GALI"
  month: number;                  // 5
  year: number;                   // 2026
  monthYear: string;              // "2026-05"
  records: ChartRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ChartRecord {
  date: string;                   // "2026-05-01"
  day: string;                    // "Thursday"
  result: string;                 // "45"
  resultTime: string;             // "11:30 PM"
}
```

**Indexes:**
- `gameCode` + `year` (descending) + `month` (descending)
- `monthYear` + `gameCode`

### 3.4 Collection: `admins`

Admin user profiles and permissions.

```typescript
// Collection: admins
// Document ID: Firebase Auth UID
interface Admin {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "super_admin";
  permissions: string[];           // ["manage_results", "manage_banners", ...]
  isActive: boolean;
  lastLogin: Timestamp;
  createdAt: Timestamp;
}
```

### 3.5 Collection: `users`

Stores push notification subscribers and visitor data.

```typescript
// Collection: users
// Document ID: auto-generated
interface User {
  fcmToken: string;               // FCM device token
  deviceType: string;             // "web", "android", "ios"
  subscribedGames: string[];      // ["gali", "desawar"]
  isSubscribed: boolean;
  subscribedAt: Timestamp;
  lastActive: Timestamp;
  userAgent: string;
}
```

### 3.6 Collection: `notifications`

Push notification history and templates.

```typescript
// Collection: notifications
// Document ID: auto-generated
interface Notification {
  title: string;
  body: string;
  type: "result_update" | "announcement" | "promotion";
  targetAudience: "all" | "subscribed" | "specific_game";
  targetGame?: string;            // game code if specific_game
  imageUrl?: string;
  clickAction?: string;           // URL to open on click
  sentAt: Timestamp;
  sentBy: string;                 // admin UID
  recipientCount: number;
  status: "sent" | "failed" | "scheduled";
  scheduledFor?: Timestamp;
}
```

### 3.7 Collection: `banners`

Homepage and section banners.

```typescript
// Collection: banners
// Document ID: auto-generated
interface Banner {
  title: string;
  imageUrl: string;               // Firebase Storage URL
  linkUrl?: string;               // click-through URL
  position: "top" | "middle" | "bottom" | "sidebar";
  displayOrder: number;
  isActive: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}
```

### 3.8 Collection: `advertisements`

Ad placements and tracking.

```typescript
// Collection: advertisements
// Document ID: auto-generated
interface Advertisement {
  title: string;
  adType: "banner" | "popup" | "inline" | "sticky_footer";
  content: {
    imageUrl?: string;
    htmlCode?: string;            // for third-party ad scripts (Google AdSense)
    text?: string;
  };
  placement: string;              // "homepage_top", "chart_sidebar", etc.
  linkUrl?: string;
  impressions: number;
  clicks: number;
  isActive: boolean;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}
```

### 3.9 Collection: `site_config`

Global site configuration (single document).

```typescript
// Collection: site_config
// Document ID: "main"
interface SiteConfig {
  siteName: string;
  siteTitle: string;
  metaDescription: string;
  whatsappNumber: string;
  contactEmail: string;
  telegramLink?: string;
  marqueeText: string;            // scrolling announcement text
  maintenanceMode: boolean;
  gamesList: GameConfig[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  seoKeywords: string[];
  footerText: string;
  updatedAt: Timestamp;
}

interface GameConfig {
  gameCode: string;
  gameName: string;
  resultTime: string;             // "11:30 PM"
  displayOrder: number;
  isActive: boolean;
}
```

### 3.10 Collection: `contact_messages`

User-submitted contact messages.

```typescript
// Collection: contact_messages
// Document ID: auto-generated
interface ContactMessage {
  name: string;
  phone?: string;
  email?: string;
  message: string;
  isRead: boolean;
  repliedAt?: Timestamp;
  createdAt: Timestamp;
}
```

---

## 4. Admin Features

### 4.1 Admin Authentication Flow

```
Admin navigates to /admin/login
    │
    ▼
Firebase Auth (email/password)
    │
    ├── Success → Check admins collection for role
    │                 │
    │                 ├── Found + isActive → Redirect to /admin/dashboard
    │                 └── Not found → Access denied
    │
    └── Failure → Show error message
```

### 4.2 Admin Dashboard Layout

```
/admin
├── /admin/login                  ── Login page
├── /admin/dashboard              ── Overview (today's results summary, stats)
├── /admin/results                ── Manage daily results
│   ├── /admin/results/today      ── Add/edit today's results
│   └── /admin/results/history    ── Edit past results
├── /admin/charts                 ── Manage chart records
├── /admin/banners                ── Upload/manage banners
├── /admin/ads                    ── Manage advertisements
├── /admin/notifications          ── Send/schedule notifications
├── /admin/contacts               ── View contact messages
├── /admin/site-config            ── Site settings (WhatsApp, marquee, SEO)
├── /admin/analytics              ── View analytics dashboard
└── /admin/users                  ── Manage admin users (super_admin only)
```

### 4.3 Result Management

**Add/Update Daily Result:**

```typescript
// Admin submits result via dashboard form
async function updateDailyResult(date: string, gameResult: GameResult) {
  const docRef = doc(db, "daily_results", date);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const existing = docSnap.data();
    const updatedResults = existing.results.map((r: GameResult) =>
      r.gameCode === gameResult.gameCode ? { ...gameResult, declaredAt: serverTimestamp() } : r
    );
    await updateDoc(docRef, {
      results: updatedResults,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(docRef, {
      date,
      results: [{ ...gameResult, declaredAt: serverTimestamp() }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
    });
  }
}
```

**Admin Result Form Fields:**

| Field | Type | Validation |
|-------|------|------------|
| Game | Dropdown (from gamesList) | Required |
| Result | Text input | Required, 2 digits (00-99) |
| Result Time | Time picker | Required |
| Date | Date picker | Required, defaults to today |

### 4.4 Banner Management

- Upload banner image to Firebase Storage (`banners/{timestamp}_{filename}`)
- Store metadata in `banners` collection
- Support position targeting (top, middle, bottom, sidebar)
- Set active/inactive status and date ranges

### 4.5 Notification Management

- Compose notification with title, body, optional image
- Target: all users, game-specific subscribers, or custom segment
- Schedule for future delivery or send immediately
- View delivery history and recipient counts

### 4.6 Advertisement Management

- Support banner ads (image-based) and script-based ads (AdSense)
- Track impressions and clicks per ad
- Set placement positions across the site
- Configure start/end dates for campaigns

---

## 5. User Features

### 5.1 Public Page Structure

```
/                                 ── Homepage (live results, marquee, banners)
/chart/{gameCode}                 ── Monthly chart for specific game
/chart/{gameCode}/{year}/{month}  ── Specific month chart
/charts                           ── All games chart listing
/contact                          ── Contact form + WhatsApp link
/about                            ── About page
/privacy                          ── Privacy policy
/disclaimer                       ── Disclaimer page
```

### 5.2 Homepage Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Site Name + Logo + Navigation          │
├─────────────────────────────────────────────────┤
│  Marquee: Scrolling announcement text           │
├─────────────────────────────────────────────────┤
│  Top Banner (advertisement/banner slot)         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │         TODAY'S LIVE RESULTS              │  │
│  │                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │   DESAWAR   │  │    GALI     │        │  │
│  │  │     45      │  │   Pending   │        │  │
│  │  │  05:00 AM   │  │  11:30 PM   │        │  │
│  │  └─────────────┘  └─────────────┘        │  │
│  │                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │ GHAZIABAD   │  │  FARIDABAD  │        │  │
│  │  │   Pending   │  │   Pending   │        │  │
│  │  │  08:30 PM   │  │  09:30 PM   │        │  │
│  │  └─────────────┘  └─────────────┘        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│  Middle Banner / Ad Slot                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  RECENT RESULTS TABLE                           │
│  ┌──────────┬────────┬────────┬──────┬───────┐  │
│  │  Date    │Desawar │ Gali   │Gzbad │Frdbd  │  │
│  ├──────────┼────────┼────────┼──────┼───────┤  │
│  │ 16 May   │  45    │  --    │  --  │  --   │  │
│  │ 15 May   │  78    │  23    │  56  │  90   │  │
│  │ 14 May   │  12    │  67    │  34  │  45   │  │
│  └──────────┴────────┴────────┴──────┴───────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│  Chart Links (View Full Chart for each game)    │
├─────────────────────────────────────────────────┤
│  Bottom Banner / Ad Slot                        │
├─────────────────────────────────────────────────┤
│  Footer: Links, Disclaimer, Contact, WhatsApp   │
└─────────────────────────────────────────────────┘
```

### 5.3 Real-Time Result Updates

```typescript
// Client-side: Firestore real-time listener
import { doc, onSnapshot } from "firebase/firestore";

function useLiveResults(date: string) {
  const [results, setResults] = useState<DailyResult | null>(null);

  useEffect(() => {
    const docRef = doc(db, "daily_results", date);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setResults(snapshot.data() as DailyResult);
      }
    });
    return () => unsubscribe();
  }, [date]);

  return results;
}
```

### 5.4 Chart Search & Filter

Users can browse historical charts by:
- **Game selection**: dropdown to pick game (Gali, Desawar, etc.)
- **Month/Year picker**: navigate to specific month
- **Pagination**: previous/next month navigation

```typescript
// Fetch chart data
async function getChartData(gameCode: string, year: number, month: number) {
  const docId = `${gameCode}_${year}-${String(month).padStart(2, "0")}`;
  const docRef = doc(db, "charts_history", docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as ChartHistory) : null;
}
```

### 5.5 Push Notification Subscription

```typescript
// Request notification permission and register FCM token
async function subscribeToNotifications(selectedGames: string[]) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });

  await addDoc(collection(db, "users"), {
    fcmToken: token,
    deviceType: "web",
    subscribedGames: selectedGames,
    isSubscribed: true,
    subscribedAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    userAgent: navigator.userAgent,
  });
}
```

### 5.6 WhatsApp Integration

```typescript
// WhatsApp click-to-chat link
function getWhatsAppLink(phoneNumber: string, message?: string) {
  const baseUrl = "https://wa.me";
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
  return `${baseUrl}/${cleanNumber}${encodedMessage}`;
}
```

Floating WhatsApp button component placed on all pages with the number pulled from `site_config`.

---

## 6. Security

### 6.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check if user is authenticated admin
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isActive == true;
    }

    function isSuperAdmin() {
      return isAdmin()
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == "super_admin";
    }

    // Daily results: public read, admin write
    match /daily_results/{date} {
      allow read: if true;
      allow create, update: if isAdmin();
      allow delete: if isSuperAdmin();
    }

    // Chart history: public read, admin write
    match /charts_history/{chartId} {
      allow read: if true;
      allow create, update: if isAdmin();
      allow delete: if isSuperAdmin();
    }

    // Admin profiles: admin read own, super_admin read all
    match /admins/{adminId} {
      allow read: if request.auth != null && (request.auth.uid == adminId || isSuperAdmin());
      allow write: if isSuperAdmin();
    }

    // Users (notification subscribers): anyone can create, admin can read
    match /users/{userId} {
      allow create: if true;
      allow read: if isAdmin();
      allow update: if true;  // allow token refresh
      allow delete: if isAdmin();
    }

    // Notifications: admin only
    match /notifications/{notifId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    // Banners: public read, admin write
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Advertisements: public read, admin write
    match /advertisements/{adId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Site config: public read, super_admin write
    match /site_config/{configId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }

    // Contact messages: anyone can create, admin can read/update
    match /contact_messages/{msgId} {
      allow create: if true;
      allow read, update: if isAdmin();
      allow delete: if isSuperAdmin();
    }
  }
}
```

### 6.2 Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Banners: public read, admin write
    match /banners/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    // Ads: public read, admin write
    match /ads/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    // Max file size: 5MB
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### 6.3 Data Validation

**Client-side validation (React):**

```typescript
// Result validation
const resultSchema = {
  gameCode: (v: string) => v.length > 0,
  result: (v: string) => /^\d{2}$/.test(v),               // exactly 2 digits
  resultTime: (v: string) => /^\d{1,2}:\d{2}\s(AM|PM)$/.test(v),
};
```

**Server-side validation (Cloud Functions):**

```typescript
// Validate result before writing
function validateResult(data: any): { valid: boolean; error?: string } {
  if (!data.gameCode || typeof data.gameCode !== "string") {
    return { valid: false, error: "Invalid game code" };
  }
  if (!data.result || !/^\d{2}$/.test(data.result)) {
    return { valid: false, error: "Result must be exactly 2 digits" };
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return { valid: false, error: "Invalid date format" };
  }
  return { valid: true };
}
```

### 6.4 Admin Authentication Security

- Email/password authentication via Firebase Auth
- Admin accounts created only by Super Admin (no public registration)
- Session persistence set to `browserSessionPersistence` (cleared on tab close)
- Failed login attempts logged for auditing
- Admin actions logged with UID and timestamp

### 6.5 Rate Limiting

Implement rate limiting on Cloud Functions:

```typescript
import * as functions from "firebase-functions";

const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
```

---

## 7. API / Cloud Functions

### 7.1 Cloud Functions Overview

```
functions/
├── src/
│   ├── index.ts                  ── Function exports
│   ├── results/
│   │   ├── onResultUpdate.ts     ── Firestore trigger on result write
│   │   └── syncChart.ts          ── Sync result to charts_history
│   ├── notifications/
│   │   ├── sendNotification.ts   ── Send push notification
│   │   └── scheduled.ts         ── Scheduled notification checks
│   ├── analytics/
│   │   └── trackEvent.ts        ── Custom analytics events
│   └── utils/
│       ├── validation.ts         ── Input validation helpers
│       └── auth.ts               ── Auth middleware
├── package.json
└── tsconfig.json
```

### 7.2 Result Update Trigger

Fires whenever a daily result document is created or updated.

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const onResultUpdate = functions.firestore
  .document("daily_results/{date}")
  .onWrite(async (change, context) => {
    const date = context.params.date;
    const newData = change.after.data();

    if (!newData) return;

    // Find newly declared results
    const oldData = change.before.data();
    const newResults = newData.results.filter((r: GameResult) => {
      if (r.status !== "declared") return false;
      if (!oldData) return true;
      const oldResult = oldData.results.find(
        (o: GameResult) => o.gameCode === r.gameCode
      );
      return !oldResult || oldResult.status !== "declared";
    });

    // For each newly declared result, sync chart and send notification
    for (const result of newResults) {
      await syncToChart(date, result);
      await sendResultNotification(result, date);
    }
  });
```

### 7.3 Chart Sync Function

```typescript
async function syncToChart(date: string, result: GameResult) {
  const [year, month] = date.split("-");
  const chartDocId = `${result.gameCode}_${year}-${month}`;
  const chartRef = db.doc(`charts_history/${chartDocId}`);

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
  });

  const newRecord: ChartRecord = {
    date,
    day: dayOfWeek,
    result: result.result,
    resultTime: result.resultTime,
  };

  const chartSnap = await chartRef.get();

  if (chartSnap.exists) {
    const chartData = chartSnap.data()!;
    const existingIndex = chartData.records.findIndex(
      (r: ChartRecord) => r.date === date
    );

    if (existingIndex >= 0) {
      chartData.records[existingIndex] = newRecord;
    } else {
      chartData.records.push(newRecord);
    }

    // Sort by date
    chartData.records.sort(
      (a: ChartRecord, b: ChartRecord) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    await chartRef.update({
      records: chartData.records,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await chartRef.set({
      gameCode: result.gameCode,
      gameName: result.gameName,
      month: parseInt(month),
      year: parseInt(year),
      monthYear: `${year}-${month}`,
      records: [newRecord],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

### 7.4 Notification Functions

```typescript
async function sendResultNotification(result: GameResult, date: string) {
  // Get all subscribed users for this game (or all subscribers)
  const usersSnapshot = await db
    .collection("users")
    .where("isSubscribed", "==", true)
    .where("subscribedGames", "array-contains", result.gameCode)
    .get();

  if (usersSnapshot.empty) return;

  const tokens = usersSnapshot.docs.map((doc) => doc.data().fcmToken);

  // Batch send (FCM supports up to 500 tokens per call)
  const batchSize = 500;
  let totalSent = 0;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);

    const message: admin.messaging.MulticastMessage = {
      tokens: batch,
      notification: {
        title: `${result.gameName} Result Declared`,
        body: `${result.gameName} result for ${date}: ${result.result}`,
      },
      webpush: {
        fcmOptions: {
          link: "/",
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    totalSent += response.successCount;

    // Clean up invalid tokens
    response.responses.forEach((resp, idx) => {
      if (resp.error?.code === "messaging/invalid-registration-token" ||
          resp.error?.code === "messaging/registration-token-not-registered") {
        db.collection("users")
          .where("fcmToken", "==", batch[idx])
          .get()
          .then((snap) => snap.docs.forEach((doc) => doc.ref.delete()));
      }
    });
  }

  // Log notification
  await db.collection("notifications").add({
    title: `${result.gameName} Result Declared`,
    body: `${result.gameName} result for ${date}: ${result.result}`,
    type: "result_update",
    targetAudience: "specific_game",
    targetGame: result.gameCode,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    sentBy: "system",
    recipientCount: totalSent,
    status: "sent",
  });
}
```

### 7.5 Manual Notification Endpoint

```typescript
export const sendManualNotification = functions.https.onCall(
  async (data, context) => {
    // Verify admin
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Not authenticated");
    }

    const adminDoc = await db.doc(`admins/${context.auth.uid}`).get();
    if (!adminDoc.exists || !adminDoc.data()?.isActive) {
      throw new functions.https.HttpsError("permission-denied", "Not an admin");
    }

    const { title, body, targetAudience, targetGame, imageUrl } = data;

    let query: admin.firestore.Query = db
      .collection("users")
      .where("isSubscribed", "==", true);

    if (targetAudience === "specific_game" && targetGame) {
      query = query.where("subscribedGames", "array-contains", targetGame);
    }

    const usersSnapshot = await query.get();
    const tokens = usersSnapshot.docs.map((doc) => doc.data().fcmToken);

    if (tokens.length === 0) {
      return { success: true, recipientCount: 0 };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body, ...(imageUrl && { imageUrl }) },
      webpush: { fcmOptions: { link: "/" } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    await db.collection("notifications").add({
      title,
      body,
      type: "announcement",
      targetAudience,
      targetGame: targetGame || null,
      imageUrl: imageUrl || null,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: context.auth.uid,
      recipientCount: response.successCount,
      status: "sent",
    });

    return { success: true, recipientCount: response.successCount };
  }
);
```

### 7.6 Analytics Functions

```typescript
// Track ad impressions/clicks
export const trackAdEvent = functions.https.onCall(async (data, context) => {
  const { adId, eventType } = data;

  if (!["impression", "click"].includes(eventType)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid event type");
  }

  const field = eventType === "impression" ? "impressions" : "clicks";
  await db.doc(`advertisements/${adId}`).update({
    [field]: admin.firestore.FieldValue.increment(1),
  });

  return { success: true };
});

// Daily cleanup: remove expired banners and ads
export const dailyCleanup = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // Deactivate expired banners
    const expiredBanners = await db
      .collection("banners")
      .where("endDate", "<", now)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    expiredBanners.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    // Deactivate expired ads
    const expiredAds = await db
      .collection("advertisements")
      .where("endDate", "<", now)
      .where("isActive", "==", true)
      .get();

    expiredAds.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
  });
```

---

## 8. Frontend Implementation

### 8.1 Project Structure

```
game-proj/
├── public/
│   ├── firebase-messaging-sw.js    ── FCM service worker
│   ├── manifest.json               ── PWA manifest
│   ├── icons/                      ── App icons
│   └── robots.txt
│
├── src/
│   ├── app/                        ── Next.js App Router
│   │   ├── layout.tsx              ── Root layout (meta, fonts, analytics)
│   │   ├── page.tsx                ── Homepage
│   │   ├── chart/
│   │   │   ├── page.tsx            ── All charts listing
│   │   │   └── [gameCode]/
│   │   │       ├── page.tsx        ── Latest chart for game
│   │   │       └── [year]/
│   │   │           └── [month]/
│   │   │               └── page.tsx ── Specific month chart
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── disclaimer/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── layout.tsx          ── Admin layout (sidebar, auth guard)
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── results/
│   │       │   └── page.tsx
│   │       ├── charts/
│   │       │   └── page.tsx
│   │       ├── banners/
│   │       │   └── page.tsx
│   │       ├── ads/
│   │       │   └── page.tsx
│   │       ├── notifications/
│   │       │   └── page.tsx
│   │       └── site-config/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     ── Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Marquee.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   └── AdSlot.tsx
│   │   ├── results/
│   │   │   ├── LiveResultCard.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── ResultTimer.tsx
│   │   ├── charts/
│   │   │   ├── ChartTable.tsx
│   │   │   ├── MonthPicker.tsx
│   │   │   └── GameSelector.tsx
│   │   └── admin/
│   │       ├── Sidebar.tsx
│   │       ├── ResultForm.tsx
│   │       ├── BannerUpload.tsx
│   │       ├── NotificationForm.tsx
│   │       └── StatsCards.tsx
│   │
│   ├── lib/
│   │   ├── firebase.ts             ── Firebase client initialization
│   │   ├── firestore.ts            ── Firestore query helpers
│   │   ├── auth.ts                 ── Auth helpers
│   │   ├── messaging.ts            ── FCM helpers
│   │   ├── storage.ts              ── Storage upload helpers
│   │   └── utils.ts                ── General utilities
│   │
│   ├── hooks/
│   │   ├── useLiveResults.ts       ── Real-time results hook
│   │   ├── useAuth.ts              ── Admin auth state hook
│   │   ├── useBanners.ts           ── Active banners hook
│   │   └── useSiteConfig.ts        ── Site configuration hook
│   │
│   ├── context/
│   │   └── AuthContext.tsx          ── Admin auth context provider
│   │
│   └── types/
│       └── index.ts                ── TypeScript interfaces
│
├── functions/                       ── Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules
├── storage.rules
├── firebase.json
├── .firebaserc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

### 8.2 Firebase Client Initialization

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function getMessagingInstance() {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
}
```

### 8.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 8.4 SEO Implementation

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Result Platform - Live Daily Results",
    template: "%s | Result Platform",
  },
  description:
    "View live daily results for Gali, Desawar, Ghaziabad, Faridabad and more. Check historical chart records and get instant notifications.",
  keywords: [
    "daily results",
    "live results",
    "chart records",
    "Gali result",
    "Desawar result",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Result Platform",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "your-google-verification-code",
  },
};
```

**Dynamic SEO for chart pages:**

```typescript
// src/app/chart/[gameCode]/[year]/[month]/page.tsx
import type { Metadata } from "next";

interface ChartPageProps {
  params: Promise<{ gameCode: string; year: string; month: string }>;
}

export async function generateMetadata({ params }: ChartPageProps): Promise<Metadata> {
  const { gameCode, year, month } = await params;
  const gameName = gameCode.charAt(0).toUpperCase() + gameCode.slice(1);
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString(
    "en",
    { month: "long" }
  );

  return {
    title: `${gameName} Chart ${monthName} ${year}`,
    description: `View ${gameName} results chart for ${monthName} ${year}. Complete daily results history.`,
  };
}
```

### 8.5 Responsive Design Breakpoints

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a5f",
        },
        result: {
          pending: "#f59e0b",
          declared: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 8.6 FCM Service Worker

```javascript
// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, image } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    image,
    data: { url: payload.fcmOptions?.link || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
```

---

## 9. Performance Optimization

### 9.1 Lazy Loading

```typescript
// Dynamic imports for heavy components
import dynamic from "next/dynamic";

const ChartTable = dynamic(() => import("@/components/charts/ChartTable"), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded" />,
});

const AdminDashboard = dynamic(
  () => import("@/components/admin/StatsCards"),
  { ssr: false }
);
```

### 9.2 Firestore Query Optimization

```typescript
// Paginated results fetching
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

async function getRecentResults(lastDoc?: any, pageSize = 7) {
  let q = query(
    collection(db, "daily_results"),
    orderBy("date", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    results: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === pageSize,
  };
}
```

### 9.3 Caching Strategy

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "s-maxage=60, stale-while-revalidate=300" },
        ],
      },
      {
        source: "/:path*.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 9.4 Image Optimization

- Use `next/image` for all images (banners, ads) with automatic WebP/AVIF conversion
- Set explicit `width` and `height` to prevent layout shift
- Use `priority` prop for above-the-fold banner images
- Compress uploads to max 500KB before storing in Firebase Storage

```typescript
// Image upload with compression
async function uploadBannerImage(file: File): Promise<string> {
  // Compress on client before upload
  const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });

  const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, compressed);
  return getDownloadURL(snapshot.ref);
}
```

### 9.5 Bundle Optimization

- Tree-shake Firebase SDK (import only used modules)
- Use `next/dynamic` for admin components (not loaded on public pages)
- Analyze bundle with `@next/bundle-analyzer`

```typescript
// Import only what you need from Firebase
// GOOD
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// BAD - imports entire Firestore SDK
// import firebase from "firebase/app";
```

---

## 10. Deployment

### 10.1 Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Select:
# - Firestore
# - Functions
# - Storage
# - Hosting
# - Emulators (for local development)
```

### 10.2 Firebase Configuration

```json
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": ["npm --prefix functions run build"]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### 10.3 Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only hosting
firebase deploy --only hosting

# Deploy only storage rules
firebase deploy --only storage
```

### 10.4 Next.js Static Export for Firebase Hosting

```typescript
// next.config.js (for static export)
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
  },
};

module.exports = nextConfig;
```

```bash
# Build and export
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 10.5 Alternative: Next.js SSR on Firebase (Cloud Run)

For SSR support, deploy Next.js to Cloud Run via Firebase:

```json
// firebase.json (SSR with Cloud Run)
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "nextjs-app",
          "region": "asia-south1"
        }
      }
    ]
  }
}
```

### 10.6 Domain Setup

```bash
# Add custom domain
firebase hosting:channel:deploy preview  # Preview channel
firebase hosting:site:create your-site   # Create site

# In Firebase Console:
# Hosting → Add custom domain → Follow DNS verification steps
```

**DNS Configuration:**

| Record Type | Host | Value |
|-------------|------|-------|
| A | @ | Firebase IP (provided in console) |
| A | @ | Firebase IP #2 |
| CNAME | www | your-project.web.app |

SSL is automatically provisioned by Firebase Hosting.

### 10.7 Local Development

```bash
# Start Firebase emulators + Next.js dev server
npm run dev          # Next.js on port 3000
firebase emulators:start  # Emulators on ports 4000, 8080, 9099, etc.
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "emulators": "firebase emulators:start",
    "dev:full": "concurrently \"npm run dev\" \"npm run emulators\"",
    "deploy": "npm run build && firebase deploy",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:rules": "firebase deploy --only firestore:rules,storage"
  }
}
```

---

## 11. Future Enhancements

### 11.1 Payment Integration

- Integrate Razorpay/Stripe for premium features
- Subscription model for ad-free experience or early result access
- Payment webhook handling via Cloud Functions

### 11.2 AI Prediction System

- Historical data analysis for trend insights
- Statistical pattern display (frequency charts, hot/cold numbers)
- Implement using Python Cloud Functions or a separate ML service
- Display prediction confidence and disclaimers

### 11.3 Multi-Language Support

- Use `next-intl` or `next-i18next` for internationalization
- Support Hindi, English, and regional languages
- Store translations in JSON files or Firestore
- Language selector in header

### 11.4 Mobile App (React Native / Flutter)

- Shared Firebase backend
- Native push notifications
- Offline-first with local caching
- App store distribution (Google Play, Apple App Store)

### 11.5 Progressive Web App (PWA)

- Add `manifest.json` for installability
- Service worker for offline support
- Cache critical pages for offline viewing
- Add to home screen prompt

### 11.6 Advanced Analytics

- Custom dashboard with charts (Chart.js / Recharts)
- User engagement metrics
- Result timing analytics
- Ad performance reports
- Geographic distribution of users

### 11.7 Telegram Bot Integration

- Telegram bot for result notifications
- Commands: `/today`, `/chart gali`, `/subscribe`
- Use Telegram Bot API with Cloud Functions webhook

### 11.8 Result API (Public)

- REST API for third-party integrations
- Rate-limited public endpoints
- API key authentication
- Endpoints: `/api/results/today`, `/api/results/{date}`, `/api/chart/{game}/{year}/{month}`

---

## Appendix A: Firestore Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "daily_results",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "charts_history",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gameCode", "order": "ASCENDING" },
        { "fieldPath": "year", "order": "DESCENDING" },
        { "fieldPath": "month", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isSubscribed", "order": "ASCENDING" },
        { "fieldPath": "subscribedGames", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "banners",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "position", "order": "ASCENDING" },
        { "fieldPath": "displayOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "advertisements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "placement", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Appendix B: Dependencies

```json
// package.json (key dependencies)
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "firebase": "^10.12.0",
    "tailwindcss": "^3.4.0",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^5.2.0",
    "next-seo": "^6.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.12.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^8.2.0",
    "@next/bundle-analyzer": "^14.2.0"
  }
}
```

```json
// functions/package.json
{
  "dependencies": {
    "firebase-admin": "^12.1.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": "20"
  }
}
```
