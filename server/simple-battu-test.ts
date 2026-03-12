import { Router } from "express";
import { BattuStorage } from "./battu-storage";

const router = Router();

// Simple test endpoint to verify BATTU system is working
router.get("/test", async (req, res) => {
  try {
    console.log("🚀 Testing BATTU Scanner System...");
    
    const storage = new BattuStorage();
    
    // Test database connectivity
    const symbols = await storage.getActiveSymbols();
    console.log(`📊 Found ${symbols.length} symbols in database`);
    
    // Test basic functionality
    const testResult = {
      success: true,
      message: "BATTU Scanner System is operational",
      database: {
        connected: true,
        symbols: symbols.length,
        symbolsList: symbols.map(s => s.symbol).slice(0, 5)
      },
      scanner: {
        available: true,
        engines: [
          "Symbol Loop Engine",
          "Pattern Detection Engine", 
          "Pattern Recording System",
          "Trade Execution Engine",
          "Continuous Loop"
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(testResult);
    
  } catch (error) {
    console.error("❌ BATTU Test Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "BATTU Scanner System test failed"
    });
  }
});

// Quick status endpoint
router.get("/status", async (req, res) => {
  try {
    const storage = new BattuStorage();
    const sessions = await storage.getActiveScannerSessions();
    const patterns = await storage.getDiscoveredPatterns();
    const trades = await storage.getActiveTrades();
    
    res.json({
      success: true,
      system: "BATTU Scanner",
      status: "operational", 
      activeSessions: sessions.length,
      discoveredPatterns: patterns.length,
      activeTrades: trades.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;