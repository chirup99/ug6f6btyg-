import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableCarouselProps {
  images: string[];
}

export function SwipeableCarousel({ images }: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${-currentIndex * 100 - (diff / containerRef.current.offsetWidth) * 100}%)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = startX.current - currentX.current;
    const threshold = 50;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX;
    const diff = startX.current - currentX.current;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${-currentIndex * 100 - (diff / containerRef.current.offsetWidth) * 100}%)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = startX.current - currentX.current;
    const threshold = 50;
    
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) {
        handleMouseUp();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        currentX.current = e.clientX;
        const diff = startX.current - currentX.current;
        
        if (containerRef.current) {
          containerRef.current.style.transform = `translateX(${-currentIndex * 100 - (diff / containerRef.current.offsetWidth) * 100}%)`;
        }
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }, [currentIndex]);

  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Image Carousel */}
      <div className="relative w-full overflow-hidden group">
        <div 
          ref={containerRef}
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {images.map((imageUrl: string, index: number) => (
            <div key={index} className="w-full flex-shrink-0">
              <img
                src={imageUrl}
                alt={`Image ${index + 1} of ${images.length}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1}/{images.length}
        </div>
      </div>

      {/* Dot Indicators - Below Images */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsTransitioning(false), 300);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-gray-700 dark:bg-gray-300 scale-110' 
                  : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}