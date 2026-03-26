import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SwipeableCarouselProps {
  images: string[];
}

export function SwipeableCarousel({ images }: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragDistance = useRef<number>(0);

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

  const nextDialog = () => {
    if (dialogIndex === null) return;
    const next = (dialogIndex + 1) % images.length;
    setDialogIndex(next);
    if (dialogContainerRef.current) {
      dialogContainerRef.current.style.transform = `translateX(-${next * 100}%)`;
    }
  };

  const prevDialog = () => {
    if (dialogIndex === null) return;
    const prev = (dialogIndex - 1 + images.length) % images.length;
    setDialogIndex(prev);
    if (dialogContainerRef.current) {
      dialogContainerRef.current.style.transform = `translateX(-${prev * 100}%)`;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    dragDistance.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    dragDistance.current = diff;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${-currentIndex * 100 - (diff / containerRef.current.offsetWidth) * 100}%)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = dragDistance.current;
    const threshold = 50;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    if (Math.abs(diff) > threshold) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    isDragging.current = true;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.clientX;
    const diff = startX.current - currentX.current;
    dragDistance.current = diff;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${-currentIndex * 100 - (diff / containerRef.current.offsetWidth) * 100}%)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = dragDistance.current;
    const threshold = 50;
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    if (Math.abs(diff) > threshold) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) handleMouseUp();
    };
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        currentX.current = e.clientX;
        const diff = startX.current - currentX.current;
        dragDistance.current = diff;
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

  useEffect(() => {
    if (dialogIndex === null) return;
    if (dialogContainerRef.current) {
      dialogContainerRef.current.style.transform = `translateX(-${dialogIndex * 100}%)`;
    }
  }, [dialogIndex]);

  useEffect(() => {
    if (dialogIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialogIndex(null);
      if (e.key === 'ArrowRight') nextDialog();
      if (e.key === 'ArrowLeft') prevDialog();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialogIndex]);

  useEffect(() => {
    document.body.style.overflow = dialogIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [dialogIndex]);

  if (images.length === 0) return null;

  return (
    <>
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
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg select-none cursor-pointer"
                  draggable={false}
                  onClick={(e) => {
                    if (Math.abs(dragDistance.current) < 5) {
                      e.stopPropagation();
                      setDialogIndex(index);
                    }
                  }}
                  data-testid={`img-feed-${index}`}
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
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Dot Indicators */}
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

      {/* Minimalist Image Dialog */}
      {dialogIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setDialogIndex(null)}
          data-testid="image-dialog-overlay"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Dialog Card */}
          <div
            className="relative z-10 w-[92vw] max-w-sm mx-auto bg-gray-900 border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <span className="text-xs text-gray-400 font-medium">
                {images.length > 1 ? `${(dialogIndex ?? 0) + 1} of ${images.length}` : 'Image'}
              </span>
              <button
                className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 flex items-center justify-center transition-colors"
                onClick={() => setDialogIndex(null)}
                data-testid="button-close-image-dialog"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Image carousel strip */}
            <div className="relative overflow-hidden bg-black">
              <div
                ref={dialogContainerRef}
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${dialogIndex * 100}%)` }}
              >
                {images.map((src, i) => (
                  <div key={i} className="w-full flex-shrink-0 flex items-center justify-center">
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      className="w-full max-h-[60vh] object-contain select-none"
                      draggable={false}
                      data-testid={`img-dialog-${i}`}
                    />
                  </div>
                ))}
              </div>

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-colors"
                    onClick={prevDialog}
                    aria-label="Previous image"
                    data-testid="button-dialog-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-colors"
                    onClick={nextDialog}
                    aria-label="Next image"
                    data-testid="button-dialog-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3 border-t border-gray-700/50">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`rounded-full transition-all duration-200 ${
                      i === dialogIndex
                        ? 'w-4 h-1.5 bg-blue-400'
                        : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-500'
                    }`}
                    onClick={() => {
                      setDialogIndex(i);
                      if (dialogContainerRef.current) {
                        dialogContainerRef.current.style.transform = `translateX(-${i * 100}%)`;
                      }
                    }}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
