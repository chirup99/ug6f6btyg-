import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, DollarSign } from 'lucide-react';

// Price Change Animation Component
interface PriceChangeAnimationProps {
  value: number;
  previousValue?: number;
  duration?: number;
  className?: string;
}

export const PriceChangeAnimation: React.FC<PriceChangeAnimationProps> = ({
  value,
  previousValue,
  duration = 1000,
  className = ""
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    if (previousValue !== undefined && value !== previousValue) {
      setDirection(value > previousValue ? 'up' : 'down');
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [value, previousValue, duration]);

  const getAnimationStyles = () => {
    switch (direction) {
      case 'up':
        return {
          color: '#10b981', // green-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          scale: 1.05
        };
      case 'down':
        return {
          color: '#ef4444', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          scale: 0.95
        };
      default:
        return {
          color: 'inherit',
          backgroundColor: 'transparent',
          scale: 1
        };
    }
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-all ${className}`}
      animate={isAnimating ? getAnimationStyles() : { scale: 1, backgroundColor: 'transparent' }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <AnimatePresence>
        {isAnimating && direction !== 'neutral' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {direction === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="font-mono">{value.toFixed(2)}</span>
    </motion.div>
  );
};

// Trade Execution Animation
interface TradeExecutionAnimationProps {
  isExecuting: boolean;
  tradeType: 'buy' | 'sell';
  amount?: string;
  symbol?: string;
}

export const TradeExecutionAnimation: React.FC<TradeExecutionAnimationProps> = ({
  isExecuting,
  tradeType,
  amount,
  symbol
}) => {
  return (
    <AnimatePresence>
      {isExecuting && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
            tradeType === 'buy' 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className={`p-2 rounded-full ${
                tradeType === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}
            >
              <Activity className={`w-4 h-4 ${
                tradeType === 'buy' ? 'text-green-600' : 'text-red-600'
              }`} />
            </motion.div>
            <div>
              <div className={`font-semibold ${
                tradeType === 'buy' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                Executing {tradeType.toUpperCase()} Order
              </div>
              {amount && symbol && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {amount} shares of {symbol}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Volume Spike Animation
interface VolumeSpikeAnimationProps {
  volume: number;
  averageVolume?: number;
  className?: string;
}

export const VolumeSpikeAnimation: React.FC<VolumeSpikeAnimationProps> = ({
  volume,
  averageVolume,
  className = ""
}) => {
  const [isSpike, setIsSpike] = useState(false);

  useEffect(() => {
    if (averageVolume && volume > averageVolume * 1.5) {
      setIsSpike(true);
      const timer = setTimeout(() => setIsSpike(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [volume, averageVolume]);

  return (
    <motion.div
      className={`relative ${className}`}
      animate={isSpike ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <AnimatePresence>
        {isSpike && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full"
          >
            <Zap className="w-3 h-3 inline mr-1" />
            Volume Spike
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-500" />
        <span className="font-mono">{volume.toLocaleString()}</span>
      </div>
    </motion.div>
  );
};

// Market Status Pulse Animation
interface MarketStatusPulseProps {
  isLive: boolean;
  className?: string;
}

export const MarketStatusPulse: React.FC<MarketStatusPulseProps> = ({
  isLive,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <motion.div
          className={`w-3 h-3 rounded-full ${
            isLive ? 'bg-green-500' : 'bg-gray-400'
          }`}
          animate={isLive ? { scale: [1, 1.2, 1] } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {isLive && (
          <motion.div
            className="absolute inset-0 w-3 h-3 rounded-full bg-green-400"
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
      <span className={`text-sm font-medium ${
        isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
      }`}>
        {isLive ? 'Live Market' : 'Market Closed'}
      </span>
    </div>
  );
};

// Profit/Loss Animation
interface ProfitLossAnimationProps {
  value: number;
  isPercentage?: boolean;
  showCurrency?: boolean;
  className?: string;
}

export const ProfitLossAnimation: React.FC<ProfitLossAnimationProps> = ({
  value,
  isPercentage = false,
  showCurrency = true,
  className = ""
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      setPrevValue(value);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const isPositive = value >= 0;
  const displayValue = Math.abs(value);

  return (
    <motion.div
      className={`inline-flex items-center gap-1 ${className}`}
      animate={isAnimating ? { 
        scale: [1, 1.1, 1],
        y: [0, -2, 0]
      } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className={`flex items-center gap-1 px-2 py-1 rounded ${
          isPositive 
            ? 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
            : 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
        }`}
        animate={isAnimating ? {
          backgroundColor: isPositive 
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'rgba(239, 68, 68, 0.2)'
        } : {}}
      >
        {showCurrency && <DollarSign className="w-3 h-3" />}
        <span className="font-mono font-semibold">
          {isPositive ? '+' : '-'}
          {displayValue.toFixed(2)}
          {isPercentage && '%'}
        </span>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isPositive ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <TrendingUp className="w-3 h-3" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Candlestick Formation Animation
interface CandlestickAnimationProps {
  candle: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  duration?: number;
  className?: string;
}

export const CandlestickAnimation: React.FC<CandlestickAnimationProps> = ({
  candle,
  duration = 2000,
  className = ""
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [duration]);

  const isBullish = candle.close > candle.open;
  const currentHigh = candle.low + (candle.high - candle.low) * animationProgress;
  const currentClose = candle.open + (candle.close - candle.open) * animationProgress;

  return (
    <div className={`relative w-8 h-24 ${className}`}>
      <svg width="32" height="96" viewBox="0 0 32 96" className="absolute inset-0">
        {/* Wick */}
        <motion.line
          x1="16"
          y1={96 - ((candle.low - candle.low) / (candle.high - candle.low)) * 80 - 8}
          x2="16"
          y2={96 - ((currentHigh - candle.low) / (candle.high - candle.low)) * 80 - 8}
          stroke={isBullish ? '#10b981' : '#ef4444'}
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: duration / 1000 * 0.3 }}
        />
        
        {/* Body */}
        <motion.rect
          x="10"
          y={96 - Math.max(
            ((candle.open - candle.low) / (candle.high - candle.low)) * 80,
            ((currentClose - candle.low) / (candle.high - candle.low)) * 80
          ) - 8}
          width="12"
          height={Math.abs(
            ((currentClose - candle.low) / (candle.high - candle.low)) * 80 -
            ((candle.open - candle.low) / (candle.high - candle.low)) * 80
          )}
          fill={isBullish ? '#10b981' : '#ef4444'}
          stroke={isBullish ? '#059669' : '#dc2626'}
          strokeWidth="1"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: duration / 1000 * 0.7, delay: duration / 1000 * 0.3 }}
        />
      </svg>
    </div>
  );
};

// Loading Skeleton Animation for market data
export const MarketDataSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};