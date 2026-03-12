import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, createElement } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Image, BookOpen, TrendingUp, DollarSign, Lightbulb, X, Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file?: File;
}

interface MultipleImageUploadProps {
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
  variant?: 'journal' | 'neofeed';
}

export interface MultipleImageUploadRef {
  getCurrentImages: () => UploadedImage[];
}

export const MultipleImageUpload = forwardRef<MultipleImageUploadRef, MultipleImageUploadProps>(
  function MultipleImageUpload({ images: externalImages = [], onImagesChange, variant = 'journal' }, ref) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [imageCaptions, setImageCaptions] = useState<Record<string, string>>({});
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Sync external images
    useEffect(() => {
      setImages(externalImages);
    }, [externalImages]);

    const updateImages = useCallback((newImages: UploadedImage[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    }, [onImagesChange]);

    useImperativeHandle(ref, () => ({
      getCurrentImages: () => images
    }), [images]);

    const processFiles = (files: File[]) => {
      setIsUploading(true);
      const newImages: UploadedImage[] = [];
      let loaded = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            url: e.target?.result as string,
            name: file.name,
            file: file
          });
          
          loaded++;
          if (loaded === files.length) {
            const allImages = [...images, ...newImages];
            updateImages(allImages);
            setIsUploading(false);
            toast({
              title: "Images uploaded",
              description: `Added ${newImages.length} image(s)`
            });
          }
        };
        reader.readAsDataURL(file);
      });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        processFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const navigateLeft = () => {
      setCurrentIndex((currentIndex - 1 + (images.length > 0 ? images.length : 5)) % (images.length > 0 ? images.length : 5));
    };

    const navigateRight = () => {
      setCurrentIndex((currentIndex + 1) % (images.length > 0 ? images.length : 5));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setIsDragging(true);
      setDragOffset(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      // Only horizontal swipe (not vertical)
      if (deltaY < 50) {
        setDragOffset(deltaX);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      setIsDragging(false);
      const threshold = 50;
      
      if (dragOffset > threshold) {
        // Swiped right - go to previous
        navigateLeft();
      } else if (dragOffset < -threshold) {
        // Swiped left - go to next
        navigateRight();
      }
      
      setDragOffset(0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      touchStartX.current = e.clientX;
      touchStartY.current = e.clientY;
      setIsDragging(true);
      setDragOffset(0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      if (deltaY < 50) {
        setDragOffset(deltaX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const threshold = 50;
      
      if (dragOffset > threshold) {
        navigateLeft();
      } else if (dragOffset < -threshold) {
        navigateRight();
      }
      
      setDragOffset(0);
    };

    // Define card slots with labels
    const cardSlots = [
      { id: 'card-1', label: 'Upload Image' },
      { id: 'card-2', label: 'Upload Articles Images' },
      { id: 'card-3', label: 'Technical Analysis' },
      { id: 'card-4', label: 'Fundamentals' },
      { id: 'card-5', label: 'Strategy Image' },
    ];

    // Map uploaded images to card slots
    const allCards = cardSlots.map((slot, idx) => ({
      ...slot,
      image: images[idx] || null,
    }));

    // Reorder: image cards first, then empty cards
    const imageCards = allCards.filter(card => card.image !== null);
    const emptyCards = allCards.filter(card => card.image === null);
    const cardsToShow = variant === 'neofeed' 
      ? (images.length < 5 ? [...images.map((img, i) => ({ id: img.id, label: 'Image', image: img })), { id: 'upload-new', label: 'Upload Image', image: null }] : images.map((img, i) => ({ id: img.id, label: 'Image', image: img })))
      : [...imageCards, ...emptyCards];

    if (variant === 'neofeed') {
      return (
        <div className="w-full h-full p-4 flex flex-col bg-transparent relative overflow-hidden group/neofeed">
          {/* Navigation Arrows for NeoFeed - Positioned in the corners */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-30 opacity-0 group-hover/neofeed:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl pointer-events-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = e.currentTarget.parentElement?.nextElementSibling;
                if (container) {
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }
              }}
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl pointer-events-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = e.currentTarget.parentElement?.nextElementSibling;
                if (container) {
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }
              }}
            >
              <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </Button>
          </div>

          <div className="flex-1 overflow-x-auto flex flex-row gap-3 pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar">
            {images.map((img, idx) => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md flex-shrink-0 w-72 snap-start">
                <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  {/* Number Indicator - More visible */}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white/30 z-20">
                    {idx + 1}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button 
                      type="button"
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newImages = images.filter(i => i.id !== img.id);
                        setImages(newImages);
                        onImagesChange?.(newImages);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {images.length < 5 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex-shrink-0 w-72 aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 transition-all bg-gray-50/50 dark:bg-gray-900/20 snap-start"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center border border-gray-100 dark:border-gray-700">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Add Image</p>
                  <p className="text-[10px] opacity-70">Up to 5 images allowed</p>
                </div>
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      );
    }

    return (
      <div 
        className="w-full h-full flex flex-col bg-transparent relative overflow-hidden"
        onPaste={(e) => {
          e.preventDefault();
          const items = e.clipboardData?.items;
          if (items) {
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) files.push(file);
              }
            }
            if (files.length > 0) {
              processFiles(files);
            }
          }
        }}
      >
        {/* Main Carousel Area - Full height, no wrapper */}
        <div 
          ref={carouselRef}
          className={`flex-1 relative bg-transparent flex items-center justify-center select-none cursor-grab active:cursor-grabbing transition-opacity ${selectedImage ? 'opacity-0 pointer-events-none' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Cards Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {cardsToShow.map((card, idx) => {
              const offset = idx - currentIndex;
              let displayOffset = offset;
              const totalCards = cardsToShow.length;
              
              if (displayOffset < -totalCards / 2) {
                displayOffset += totalCards;
              } else if (displayOffset > totalCards / 2) {
                displayOffset -= totalCards;
              }

              if (Math.abs(displayOffset) > 2) return null;

              // Only apply drag offset to the center/top card (displayOffset === 0)
              const dragOffsetForThisCard = isDragging && displayOffset === 0 ? dragOffset : 0;
              const dragRotationForThisCard = isDragging && displayOffset === 0 ? (dragOffset * 0.15) : 0;

              const rotation = displayOffset * 8 + dragRotationForThisCard;
              const translateX = displayOffset * 45 + dragOffsetForThisCard * 0.3;
              const translateY = Math.abs(displayOffset) * 15;
              const scale = 1 - Math.abs(displayOffset) * 0.06;
              const zIndex = 10 - Math.abs(displayOffset);
              const opacity = displayOffset === 0 ? 1 : 0.65;

              return (
                <div
                  key={card.id}
                  className={`absolute ${isDragging ? '' : 'transition-all duration-400 ease-out'}`}
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                >
                  <div 
                    className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform hover:scale-105" 
                    style={{ width: '200px', height: '150px' }}
                    onClick={() => {
                      if ((card as any).image) {
                        // If card has image, open modal for viewing/editing
                        setSelectedCardIndex(idx);
                        setSelectedImage((card as any).image);
                      } else {
                        // If card is empty, directly open file upload
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {(card as any).image ? (
                      <div className="w-full h-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={(card as any).image.url}
                          alt={(card as any).label}
                          className="w-full h-full object-contain pointer-events-none"
                          data-testid={`img-card-${idx}`}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 bg-gray-200 dark:bg-gray-900">
                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-white text-xs font-medium text-center line-clamp-2">{(card as any).label}</span>
                        <span className="text-gray-600 dark:text-gray-300 text-xs opacity-75">Paste or upload</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curved Line Footer - Transparent Background */}
        <div className="h-16 relative bg-transparent flex items-center justify-center overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full opacity-40"
            viewBox="0 0 800 60"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 15 Q 400 50, 800 15"
              stroke="#9ca3af"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* Counter Badge - Tiny and minimalistic */}
          <div 
            className={`relative z-10 bg-gray-500 dark:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold shadow-md border border-gray-400 dark:border-gray-500 ${
              isDragging ? "" : "transition-transform duration-400 ease-out"
            }`}
            style={{
              transform: `translateX(${(dragOffset * 0.5)}px)`
            }}
          >
            {images.length === 0 
              ? `${currentIndex + 1}/5`
              : `${Math.min(currentIndex + 1, images.length)}/${images.length}`
            }
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          className="hidden"
          data-testid="input-file-upload"
        />

        {/* Image Modal Dialog */}
        {selectedCardIndex !== null && (
          <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300 flex flex-col items-center justify-center"
            onClick={() => {
              setSelectedCardIndex(null);
              setSelectedImage(null);
            }}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = 0;
            }}
            onTouchMove={(e) => {
              const currentX = e.touches[0].clientX;
              const deltaX = currentX - touchStartX.current;
              if (Math.abs(deltaX) > 50) {
                if (!selectedImage) return;
                const currentImageIndex = cardsToShow.findIndex(card => card.image?.id === selectedImage.id);
                if (deltaX > 0) {
                  // Swiped right - previous
                  const prevIdx = currentImageIndex > 0 ? currentImageIndex - 1 : cardsToShow.length - 1;
                  if (cardsToShow[prevIdx].image) {
                    setSelectedImage(cardsToShow[prevIdx].image);
                  }
                } else {
                  // Swiped left - next
                  const nextIdx = currentImageIndex < cardsToShow.length - 1 ? currentImageIndex + 1 : 0;
                  if (cardsToShow[nextIdx].image) {
                    setSelectedImage(cardsToShow[nextIdx].image);
                  }
                }
                touchStartX.current = currentX;
              }
            }}
          >
            {/* Main Modal */}
            <div 
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full h-auto flex-shrink-0 animate-modal-bounce flex flex-col"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedCardIndex(null);
                  setSelectedImage(null);
                }}
                className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                data-testid="button-close-modal"
              >
                <X className="w-5 h-5 text-gray-800 dark:text-white" />
              </button>

              {/* Image Display / Empty State */}
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl overflow-hidden min-h-96">
                {selectedImage ? (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                    data-testid="img-modal-display"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No image added</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click button below to upload or paste an image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Info - Bottom Bar */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-2xl flex items-center justify-between gap-3">
                {selectedImage ? (
                  <>
                    {/* Edit Button - Left Corner */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingImageId(editingImageId === selectedImage.id ? null : selectedImage.id);
                      }}
                      className="flex-shrink-0 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      data-testid="button-edit-caption"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Text Input/Display - Center */}
                    <div className="flex-1">
                      {editingImageId === selectedImage.id ? (
                        <input
                          type="text"
                          value={imageCaptions[selectedImage.id] || ''}
                          onChange={(e) => setImageCaptions(prev => ({
                            ...prev,
                            [selectedImage.id]: e.target.value
                          }))}
                          placeholder="Add caption..."
                          autoFocus
                          className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          data-testid="input-caption"
                        />
                      ) : (
                        <p className="text-xs font-medium text-center text-gray-800 dark:text-gray-100 truncate">
                          {selectedImage ? (imageCaptions[selectedImage.id] || selectedImage.name) : ''}
                        </p>
                      )}
                    </div>

                    {/* Delete Button - Right Corner */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!selectedImage) return;
                        setImages(images.filter(img => img.id !== selectedImage.id));
                        setImageCaptions(prev => {
                          const updated = { ...prev };
                          delete updated[selectedImage.id];
                          return updated;
                        });
                        setSelectedImage(null);
                        toast({
                          title: "Image deleted",
                          description: "The image has been removed"
                        });
                      }}
                      className="flex-shrink-0 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      data-testid="button-delete-image"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-2 px-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded text-xs font-medium transition-colors"
                    data-testid="button-upload-from-dialog"
                  >
                    Click to upload image
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail Strip Below - Tiny All Cards */}
            <div 
              className="flex gap-2 mt-6 overflow-x-auto pb-2 w-full items-center justify-center flex-shrink-0"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchMove={(e) => {
                const currentX = e.touches[0].clientX;
                const deltaX = currentX - touchStartX.current;
                if (Math.abs(deltaX) > 50) {
                  if (!selectedImage) return;
                  const currentImageIndex = cardsToShow.findIndex(card => card.image?.id === selectedImage.id);
                  if (deltaX > 0) {
                    // Swiped right - previous
                    const prevIdx = currentImageIndex > 0 ? currentImageIndex - 1 : cardsToShow.length - 1;
                    if (cardsToShow[prevIdx].image) {
                      setSelectedImage(cardsToShow[prevIdx].image);
                    }
                  } else {
                    // Swiped left - next
                    const nextIdx = currentImageIndex < cardsToShow.length - 1 ? currentImageIndex + 1 : 0;
                    if (cardsToShow[nextIdx].image) {
                      setSelectedImage(cardsToShow[nextIdx].image);
                    }
                  }
                  touchStartX.current = currentX;
                }
              }}
              style={{ maxWidth: '500px' }}
            >
              {cardsToShow.map((card, idx) => (
                <button
                  type="button"
                  key={card.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedCardIndex(idx);
                    if (card.image) {
                      setSelectedImage(card.image);
                    } else {
                      setSelectedImage(null);
                    }
                  }}
                  className={`flex-shrink-0 rounded-md overflow-hidden transition-all cursor-pointer ${
                    selectedCardIndex === idx && card.image && selectedImage && selectedImage.id === card.image.id 
                      ? 'ring-2 ring-white' 
                      : selectedCardIndex === idx
                      ? 'ring-2 ring-blue-400'
                      : card.image ? 'opacity-70 hover:opacity-100' : 'opacity-40 hover:opacity-60'
                  }`}
                  style={{ width: '48px', height: '48px' }}
                  data-testid={`button-thumbnail-${idx}`}
                >
                  {card.image ? (
                    <img
                      src={card.image.url}
                      alt={card.image.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              ))}
            </div>

          </div>
        )}
      </div>
    );
  }
);
