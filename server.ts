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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
      // Fast 10-digit ID generation
      const volckaId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      await db.collection("users").doc(data.user.id).set({
        uid: data.user.id,
        email,
        fullName: fullName || 'مستخدم',
        balance: 0,
        volckaId,
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

  app.post("/api/firestore/:collection", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { collection } = req.params;
    try {
      const docRef = await db.collection(collection).add(req.body);
      res.json({ id: docRef.id, success: true });
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

  // OTP Endpoints
  app.post("/api/otp/generate", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    try {
      // Store OTP in Firestore
      await db.collection("otps").doc(email).set({
        email,
        code: otp,
        expiresAt,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      // Send via EmailJS
      const emailJsData = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          passcode: otp,
          time: "5 minutes",
        },
      };

      const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailJsData),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("EmailJS Error:", errorText);
        return res.status(500).json({ error: "Failed to send email" });
      }

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("OTP Generate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    try {
      const otpDoc = await db.collection("otps").doc(email).get();
      if (!otpDoc.exists) return res.status(400).json({ error: "No OTP found for this email" });

      const otpData = otpDoc.data();
      if (otpData.verified) return res.status(400).json({ error: "OTP already used" });
      if (new Date() > new Date(otpData.expiresAt)) return res.status(400).json({ error: "OTP expired" });
      if (otpData.code !== code) return res.status(400).json({ error: "Invalid OTP code" });

      // Mark as verified or delete
      await db.collection("otps").doc(email).update({ verified: true });
      // Alternatively, delete it: await db.collection("otps").doc(email).delete();

      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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
