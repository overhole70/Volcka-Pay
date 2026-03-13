import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  console.warn("FIREBASE_PROJECT_ID not set. Firebase features will be disabled.");
}

const db = admin.apps.length ? admin.firestore() : null;

// Initialize Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Endpoints
  app.post("/api/auth/login", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/auth/register", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { email, password, fullName } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    
    // Create profile in Firestore if user created
    if (data.user && db) {
      await db.collection("users").doc(data.user.id).set({
        uid: data.user.id,
        email,
        fullName,
        balance: 0,
        volckaId: Math.random().toString(36).substring(2, 10).toUpperCase(),
        createdAt: new Date().toISOString(),
      });
    }
    
    res.json(data);
  });

  // Firestore Endpoints (Proxy)
  app.get("/api/firestore/:collection/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { collection, id } = req.params;
    try {
      const doc = await db.collection(collection).doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      res.json(doc.data());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/firestore/:collection/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { collection, id } = req.params;
    try {
      await db.collection(collection).doc(id).set(req.body, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/firestore/:collection", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { collection } = req.params;
    try {
      const snapshot = await db.collection(collection).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add more endpoints as needed based on app functionality...

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
