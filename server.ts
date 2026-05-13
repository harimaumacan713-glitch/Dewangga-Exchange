import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Helper to load firebase config safely
function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error("Failed to load firebase-applet-config.json", error);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  const firebaseConfig = getFirebaseConfig();
  let db: any = null;

  if (firebaseConfig) {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  }

  // API Route for External Deposit
  app.post("/api/external-deposit", async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.PROJECT_API_KEY;

    if (!expectedKey) {
      return res.status(500).json({ error: "Server misconfigured: PROJECT_API_KEY not set." });
    }

    if (apiKey !== expectedKey) {
      return res.status(401).json({ error: "Unauthorized: Invalid API Key." });
    }

    const { userId, amount } = req.body;

    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: "Invalid request body. Need userId and positive amount." });
    }

    if (!db) {
      return res.status(500).json({ error: "Database connection not initialized." });
    }

    try {
      const walletRef = doc(db, 'exchange_wallets', userId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        await updateDoc(walletRef, {
          balance: increment(amount),
          lastUpdatedAt: new Date().toISOString()
        });
      } else {
        await setDoc(walletRef, {
          balance: amount,
          lastUpdatedAt: new Date().toISOString()
        });
      }

      res.json({ success: true, message: `Deposited ${amount} to user ${userId}` });
    } catch (error: any) {
      console.error("Deposit error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

startServer().catch(err => {
  console.error("Startup error:", err);
});
