/**
 * CANDLE PROGRESSION API ENDPOINT
 * Provides API endpoints for managing automatic candle progression from 4th -> 5th -> 6th candle
 * Fixes the critical bug where Point A/B Analysis stops updating after C2B completion
 */

import { Router } from 'express';
import { CandleProgressionManager } from './candle-progression-manager';
import { cycle3LiveStreamer } from './cycle3-live-data-streamer';

const router = Router();

// Create progression manager instance
let progressionManager: CandleProgressionManager | null = null;

// Initialize progression manager
function initializeProgressionManager() {
  if (!progressionManager) {
    progressionManager = new CandleProgressionManager(cycle3LiveStreamer);
    console.log('🔄 CANDLE PROGRESSION API: Manager initialized');
  }
  return progressionManager;
}

/**
 * POST /api/candle-progression/start
 * Start monitoring for automatic candle progression
 */
router.post('/start', async (req, res) => {
  try {
    const { symbol, timeframe } = req.body;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['symbol', 'timeframe']
      });
    }

    const manager = initializeProgressionManager();
    manager.startProgressionMonitoring(symbol, timeframe);

    console.log(`🚀 CANDLE PROGRESSION API: Started monitoring ${symbol} at ${timeframe}min`);

    res.json({
      success: true,
      message: `Candle progression monitoring started for ${symbol}`,
      symbol: symbol,
      timeframe: timeframe,
      monitoring: [
        'C2B → 5th candle progression',
        '5th → 6th candle progression'
      ]
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Start error:', error);
    res.status(500).json({
      error: 'Failed to start candle progression monitoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/candle-progression/stop
 * Stop monitoring for automatic candle progression
 */
router.post('/stop', async (req, res) => {
  try {
    if (progressionManager) {
      progressionManager.stopProgressionMonitoring();
      console.log('🛑 CANDLE PROGRESSION API: Monitoring stopped');
    }

    res.json({
      success: true,
      message: 'Candle progression monitoring stopped'
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Stop error:', error);
    res.status(500).json({
      error: 'Failed to stop candle progression monitoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/candle-progression/status
 * Get current progression status
 */
router.get('/status', async (req, res) => {
  try {
    if (!progressionManager) {
      return res.json({
        isActive: false,
        message: 'Progression manager not initialized'
      });
    }

    const status = progressionManager.getProgressionStatus();

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Status error:', error);
    res.status(500).json({
      error: 'Failed to get progression status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/candle-progression/check
 * Manually trigger candle completion check
 */
router.post('/check', async (req, res) => {
  try {
    const { symbol, timeframe, liveData } = req.body;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['symbol', 'timeframe']
      });
    }

    const manager = initializeProgressionManager();
    const completionStatus = await manager.checkCandleCompletion(
      symbol,
      timeframe,
      liveData || []
    );

    res.json({
      success: true,
      completionStatus: completionStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Check error:', error);
    res.status(500).json({
      error: 'Failed to check candle completion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/candle-progression/trigger-fifth
 * Manually trigger 5th candle progression (for testing)
 */
router.post('/trigger-fifth', async (req, res) => {
  try {
    const { symbol, timeframe, startTime } = req.body;
    
    if (!symbol || !timeframe || !startTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['symbol', 'timeframe', 'startTime']
      });
    }

    // Trigger 5th candle validation manually
    await cycle3LiveStreamer.start5thCandleValidation(symbol, timeframe, startTime);

    console.log(`🚀 CANDLE PROGRESSION API: Manually triggered 5th candle for ${symbol}`);

    res.json({
      success: true,
      message: `5th candle monitoring triggered for ${symbol}`,
      symbol: symbol,
      timeframe: timeframe,
      startTime: new Date(startTime * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Manual trigger error:', error);
    res.status(500).json({
      error: 'Failed to trigger 5th candle progression',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/candle-progression/trigger-sixth
 * Manually trigger 6th candle progression (for testing)
 */
router.post('/trigger-sixth', async (req, res) => {
  try {
    const { symbol, timeframe, startTime } = req.body;
    
    if (!symbol || !timeframe || !startTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['symbol', 'timeframe', 'startTime']
      });
    }

    // Trigger 6th candle (Cycle 3) streaming manually
    await cycle3LiveStreamer.startCycle3Streaming(symbol, timeframe, startTime);

    console.log(`🚀 CANDLE PROGRESSION API: Manually triggered 6th candle for ${symbol}`);

    res.json({
      success: true,
      message: `6th candle monitoring triggered for ${symbol}`,
      symbol: symbol,
      timeframe: timeframe,
      startTime: new Date(startTime * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ CANDLE PROGRESSION API: Manual trigger error:', error);
    res.status(500).json({
      error: 'Failed to trigger 6th candle progression',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;