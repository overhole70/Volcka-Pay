import express from "express";
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

// Helper to send OTP email via EmailJS
async function sendOtpEmail(email: string, otp: string) {
  const emailJsData = {
    service_id: process.env.EMAILJS_SERVICE_ID || "service_fnlf5he",
    template_id: process.env.EMAILJS_TEMPLATE_ID || "template_kjsflkf",
    user_id: process.env.EMAILJS_PUBLIC_KEY || "1OdM68bcwaNhA0RZv",
    template_params: {
      to_email: email,
      email: email,
      user_email: email,
      passcode: otp,
      time: "5 minutes",
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Origin": process.env.APP_URL || "http://localhost:3000"
    },
    body: JSON.stringify(emailJsData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS Error: ${response.status} ${text}`);
  }
  
  console.log("OTP email sent successfully to", email);
  return true;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth Endpoints
app.post("/api/auth/send-otp", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Server not configured" });
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    try {
      // Check for recent OTP to prevent duplicates (30s cooldown)
      const existingOtp = await db.collection("otps").doc(email).get();
      if (existingOtp.exists) {
        const data = existingOtp.data();
        const lastSent = new Date(data?.createdAt || 0).getTime();
        if (Date.now() - lastSent < 30000) {
          console.log("OTP requested too soon for", email, "- skipping send");
          return res.json({ success: true, message: "OTP already sent recently" });
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
      
      // Store OTP in Firestore
      await db.collection("otps").doc(email).set({
        email,
        code: otp,
        expiresAt,
        verified: false,
        createdAt: new Date().toISOString(),
      });
      
      // Send email
      await sendOtpEmail(email, otp);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Send OTP Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/verify-otp-only", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Server not configured" });
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Missing required fields" });

    try {
      const otpDoc = await db.collection("otps").doc(email).get();
      if (!otpDoc.exists) return res.status(400).json({ error: "No OTP found for this email" });

      const otpData = otpDoc.data();
      if (otpData?.verified) return res.status(400).json({ error: "OTP already used" });
      if (new Date() > new Date(otpData?.expiresAt)) return res.status(400).json({ error: "OTP expired" });
      if (otpData?.code !== code) return res.status(400).json({ error: "Invalid OTP code" });

      // Mark as verified
      await db.collection("otps").doc(email).update({ verified: true });

      res.json({ success: true });
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      res.status(500).json({ error: error.message });
    }
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

    try {
      // Check for recent OTP to prevent duplicates (30s cooldown)
      const existingOtp = await db.collection("otps").doc(email).get();
      if (existingOtp.exists) {
        const data = existingOtp.data();
        const lastSent = new Date(data?.createdAt || 0).getTime();
        if (Date.now() - lastSent < 30000) {
          console.log("OTP requested too soon for", email, "- skipping send");
          return res.json({ success: true, message: "OTP already sent recently" });
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Store OTP in Firestore
      await db.collection("otps").doc(email).set({
        email,
        code: otp,
        expiresAt,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      // Send email
      await sendOtpEmail(email, otp);

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
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
} else {
  // In production (e.g. Render), serve static files if needed
  // Note: Vercel handles static files automatically, so this is just a fallback
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Start server if not running on Vercel (e.g. Render)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
