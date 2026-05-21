import type { HomepageData, MonthlyChartData } from "./types";

// ─── Firebase as backup/permanent storage for scraped data ───
// Write: Cron job stores data here alongside Redis
// Read: Fallback when Redis is empty (cold start / Redis down)
// Lazy imports to avoid Firebase SDK initialization when not configured

const COLLECTION = "scraped_cache";

function isFirebaseConfigured(): boolean {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  // Must be a real project ID, not a placeholder
  return !!projectId && projectId !== "your_project_id" && !projectId.startsWith("your_");
}

// Lazy load Firebase to avoid SDK init when not configured
async function getFirestoreDb() {
  const { getDb } = await import("./firebase");
  return getDb();
}

// ─── Homepage Data (LIVE/NEXT/REST) ───

export async function saveHomepageToFirestore(data: HomepageData): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const db = await getFirestoreDb();
    const docRef = doc(db, COLLECTION, "homepage");
    await setDoc(docRef, {
      live: data.live,
      next: data.next,
      rest: data.rest,
      scrapedAt: data.scrapedAt,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[firebase-cache] Failed to save homepage:", (err as Error).message);
  }
}

export async function getHomepageFromFirestore(): Promise<HomepageData | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const db = await getFirestoreDb();
    const docRef = doc(db, COLLECTION, "homepage");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      live: d.live || [],
      next: d.next || [],
      rest: d.rest || [],
      scrapedAt: d.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read homepage:", (err as Error).message);
    return null;
  }
}

// ─── Monthly Chart Data ───

export async function saveMonthlyChartToFirestore(
  month: string,
  year: string,
  data: MonthlyChartData
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const db = await getFirestoreDb();
    const docId = `chart_${month.toLowerCase()}_${year}`;
    const docRef = doc(db, COLLECTION, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[firebase-cache] Failed to save chart:", (err as Error).message);
  }
}

export async function getMonthlyChartFromFirestore(
  month: string,
  year: string
): Promise<MonthlyChartData | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const db = await getFirestoreDb();
    const docId = `chart_${month.toLowerCase()}_${year}`;
    const docRef = doc(db, COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      month: d.month,
      year: d.year,
      results: d.results || [],
      scrapedAt: d.scrapedAt || 0,
    };
  } catch (err) {
    console.error("[firebase-cache] Failed to read chart:", (err as Error).message);
    return null;
  }
}
