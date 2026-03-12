import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Trash2, Undo, Download, PenTool } from 'lucide-react';

interface BlackboardDrawingProps {
  height: number;
  onPointsChange: (points: any[]) => void;
  selectedPoints: any[];
  onReset: () => void;
  isExpanded: boolean;
}

export default function BlackboardDrawing({
  height,
  onPointsChange,
  selectedPoints,
  onReset,
  isExpanded
}: BlackboardDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<any[]>([]);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#00ff00');
  const [drawingMode, setDrawingMode] = useState<'path' | 'sketch'>('sketch');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number, t: number}[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    // Clear with black background
    clearCanvas();
  }, [height]);

  const clearCanvas = () => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (drawingMode !== 'path') return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add clicked point directly as a pattern point
    const newPoint = {
      x,
      y,
      price: (canvas.clientHeight - y) / canvas.clientHeight * 1000 + 24000,
      timestamp: Date.now() + drawingPoints.length * 60000,
      index: drawingPoints.length,
      type: y < canvas.clientHeight / 2 ? 'high' : 'low',
      pointNumber: drawingPoints.length + 1,
      label: `${drawingPoints.length + 1}`,
      cornerType: 'clicked'
    };

    const newPoints = [...drawingPoints, newPoint];
    setDrawingPoints(newPoints);
    onPointsChange(newPoints);

    // Redraw the entire canvas with updated points and lines
    redrawCanvas();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drawingMode !== 'sketch') return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = Date.now();

    setCurrentStroke([{ x, y, t }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || drawingMode !== 'sketch') return;

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = Date.now();

    // Throttle point collection (every ~10ms) and avoid duplicate points
    const lastPoint = currentStroke[currentStroke.length - 1];
    if (lastPoint && Math.abs(x - lastPoint.x) < 2 && Math.abs(y - lastPoint.y) < 2) {
      return; // Skip if too close to last point
    }

    const newStroke = [...currentStroke, { x, y, t }];
    setCurrentStroke(newStroke);

    // Draw smooth line in real-time
    drawSmoothStroke(ctx, newStroke);
  };

  const handleMouseUp = () => {
    if (!isDrawing || drawingMode !== 'sketch') return;

    setIsDrawing(false);

    if (currentStroke.length > 3) {
      // Post-process stroke to detect curve points
      const curvePoints = detectCurvePoints(currentStroke);
      const newPoints = [...drawingPoints, ...curvePoints];
      setDrawingPoints(newPoints);
      onPointsChange(newPoints);
    }

    setCurrentStroke([]);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    // Clear canvas
    clearCanvas();
    
    if (drawingPoints.length === 0) return;

    // Draw connecting lines between points
    if (drawingPoints.length > 1) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      for (let i = 1; i < drawingPoints.length; i++) {
        ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
      }
      
      ctx.stroke();
    }

    // Draw all points on top of lines
    drawingPoints.forEach((point, index) => {
      drawPointMarker(ctx, point.x, point.y, index + 1);
    });
  };

  const drawPointMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, pointNumber: number) => {
    // Draw point circle
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw point number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(pointNumber.toString(), x, y + 4);
  };

  // Remove the last clicked point
  const removeLastPoint = () => {
    if (drawingPoints.length === 0) return;
    
    const newPoints = drawingPoints.slice(0, -1);
    setDrawingPoints(newPoints);
    onPointsChange(newPoints);
    redrawCanvas();
  };

  const clearDrawing = () => {
    clearCanvas();
    setDrawingPoints([]);
    onPointsChange([]);
  };

  const undoLastPoint = () => {
    removeLastPoint();
  };

  // Draw smooth stroke in real-time
  const drawSmoothStroke = (ctx: CanvasRenderingContext2D, stroke: {x: number, y: number, t: number}[]) => {
    if (stroke.length < 2) return;

    // Clear and redraw everything
    clearCanvas();
    
    // Redraw existing pattern points and lines
    if (drawingPoints.length > 1) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      for (let i = 1; i < drawingPoints.length; i++) {
        ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y);
      }
      ctx.stroke();
    }
    
    // Draw existing points
    drawingPoints.forEach((point, index) => {
      drawPointMarker(ctx, point.x, point.y, index + 1);
    });

    // Draw current smooth stroke
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    
    // Use quadratic curves for smoothness
    for (let i = 1; i < stroke.length - 1; i++) {
      const currentPoint = stroke[i];
      const nextPoint = stroke[i + 1];
      const xControl = (currentPoint.x + nextPoint.x) / 2;
      const yControl = (currentPoint.y + nextPoint.y) / 2;
      ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, xControl, yControl);
    }
    
    // Draw to the last point
    if (stroke.length > 1) {
      const lastPoint = stroke[stroke.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }
    
    ctx.stroke();
  };

  // Detect curve points using Douglas-Peucker + curvature analysis
  const detectCurvePoints = (stroke: {x: number, y: number, t: number}[]): any[] => {
    if (stroke.length < 3) return [];

    // Step 1: Simplify path using Douglas-Peucker algorithm
    const epsilon = 8; // Simplification threshold
    const simplified = douglasPeucker(stroke, epsilon);
    
    // Step 2: Detect key curve points
    const curvePoints: any[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return [];

    // Always include start and end
    const startPoint = simplified[0];
    const endPoint = simplified[simplified.length - 1];
    
    // Find turning points (peaks/valleys) with curvature analysis
    const keyPoints = [startPoint];
    
    if (simplified.length > 2) {
      for (let i = 1; i < simplified.length - 1; i++) {
        const prev = simplified[i - 1];
        const curr = simplified[i];
        const next = simplified[i + 1];
        
        // Calculate turning angle
        const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
        let turningAngle = Math.abs(angle2 - angle1);
        if (turningAngle > Math.PI) turningAngle = 2 * Math.PI - turningAngle;
        
        // If significant turning angle (>30 degrees), include as key point
        if (turningAngle > Math.PI / 6) {
          keyPoints.push(curr);
        }
      }
    }
    
    keyPoints.push(endPoint);
    
    // Convert to pattern points format
    keyPoints.forEach((point, index) => {
      curvePoints.push({
        x: point.x,
        y: point.y,
        price: (canvas.clientHeight - point.y) / canvas.clientHeight * 1000 + 24000,
        timestamp: point.t || (Date.now() + index * 60000),
        index: drawingPoints.length + index,
        type: point.y < canvas.clientHeight / 2 ? 'high' : 'low',
        pointNumber: drawingPoints.length + index + 1,
        label: `${drawingPoints.length + index + 1}`,
        cornerType: 'curve'
      });
    });
    
    return curvePoints;
  };
  
  // Douglas-Peucker path simplification algorithm
  const douglasPeucker = (points: {x: number, y: number, t: number}[], epsilon: number): {x: number, y: number, t: number}[] => {
    if (points.length <= 2) return points;
    
    // Find the point with maximum distance from start-end line
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = distanceFromLine(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      const leftSegment = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const rightSegment = douglasPeucker(points.slice(maxIndex), epsilon);
      
      // Combine results (remove duplicate middle point)
      return [...leftSegment.slice(0, -1), ...rightSegment];
    } else {
      return [start, end];
    }
  };
  
  // Calculate perpendicular distance from point to line
  const distanceFromLine = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
    const A = lineEnd.y - lineStart.y;
    const B = lineStart.x - lineEnd.x;
    const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
    
    return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
  };

  // Update canvas when points change
  useEffect(() => {
    redrawCanvas();
  }, [drawingPoints]);

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `pattern-drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const canvas = canvasRef.current;

  return (
    <div className="w-full h-full flex flex-col">
      {/* 🎨 Compact Drawing Tools */}
      <div className="flex items-center justify-between mb-2 p-1 bg-gray-800/50 rounded border border-gray-600/50">
        <div className="flex items-center gap-1">
          <PenTool className="h-3 w-3 text-green-400" />
          <span className="text-xs text-white font-medium">Drawing</span>
          
          {/* Compact Drawing Mode Toggle */}
          <div className="flex bg-gray-700 rounded p-0.5 ml-2">
            <button
              onClick={() => setDrawingMode('sketch')}
              className={`px-1 py-0.5 text-[10px] rounded ${drawingMode === 'sketch' ? 'bg-green-500 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              📝
            </button>
            <button
              onClick={() => setDrawingMode('path')}
              className={`px-1 py-0.5 text-[10px] rounded ${drawingMode === 'path' ? 'bg-green-500 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              📍
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Compact Brush Size */}
          <input
            type="range"
            min="1"
            max="10"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-8 h-1 bg-gray-600 rounded appearance-none cursor-pointer"
          />

          {/* Compact Color Picker */}
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-4 h-4 rounded border border-gray-600 cursor-pointer"
          />

          {/* Compact Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={undoLastPoint}
            className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10 h-5 w-5 p-0"
            disabled={drawingPoints.length === 0}
            data-testid="button-undo"
          >
            <Undo className="h-2 w-2" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearDrawing}
            className="text-red-400 border-red-400 hover:bg-red-400/10 h-5 w-5 p-0"
            data-testid="button-clear"
          >
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      </div>

      {/* 🎯 Drawing Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-600 rounded cursor-crosshair bg-black"
          style={{ height: `${height}px` }}
          onClick={drawingMode === 'path' ? handleCanvasClick : undefined}
          onMouseDown={drawingMode === 'sketch' ? handleMouseDown : undefined}
          onMouseMove={drawingMode === 'sketch' ? handleMouseMove : undefined}
          onMouseUp={drawingMode === 'sketch' ? handleMouseUp : undefined}
          onMouseLeave={drawingMode === 'sketch' ? handleMouseUp : undefined}
          data-testid="blackboard-canvas"
        />
        
        {/* Pattern Points Overlay */}
        {drawingPoints.map((point, index) => (
          <div
            key={index}
            className="absolute w-3 h-3 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-black"
            style={{
              left: `${point.x - 6}px`,
              top: `${point.y - 6}px`,
              zIndex: 10
            }}
            title={`Point ${index + 1}: ${point.price?.toFixed(2)}`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* 📊 Compact Drawing Stats */}
      <div className="mt-1 p-1 bg-gray-800/50 rounded border border-gray-600/50 text-[10px] text-gray-300">
        <div className="flex items-center justify-between">
          <span>Points: {drawingPoints.length}</span>
          <span>{brushSize}px • {brushColor}</span>
        </div>
      </div>
    </div>
  );
}