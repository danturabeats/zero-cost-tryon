/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  generatedPoses: Record<string, string>;
}

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
);

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex, generatedPoses }) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const availablePoseKeys = Object.keys(generatedPoses);

  const handleResetZoomAndPan = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset zoom and pan when the image source changes
  useEffect(() => {
    handleResetZoomAndPan();
  }, [displayImageUrl]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

  // Panning handlers for both mouse and touch
  const handlePanStart = (clientX: number, clientY: number) => {
    if (scale <= 1 || isLoading) return;
    setIsPanning(true);
    panStartRef.current = { x: clientX - position.x, y: clientY - position.y };
    if (imageContainerRef.current) imageContainerRef.current.style.cursor = 'grabbing';
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isPanning || scale <= 1) return;
    setPosition({ x: clientX - panStartRef.current.x, y: clientY - panStartRef.current.y });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    if (imageContainerRef.current) imageContainerRef.current.style.cursor = scale > 1 ? 'grab' : 'default';
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if (isLoading) return;
    e.preventDefault();
    const zoomFactor = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomFactor) : scale * (1 + zoomFactor);
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }

    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    
    if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) {
            onSelectPose(newGlobalPoseIndex);
        }
    } else {
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      <button 
          onClick={onStartOver}
          className="absolute top-4 right-4 z-30 flex items-center justify-center text-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
      >
          <RotateCcwIcon className="w-4 h-4 ml-2" />
          התחלה חדשה
      </button>

      {displayImageUrl && (
        <div className="absolute top-4 left-4 z-30 flex flex-col items-center gap-1 bg-white/60 backdrop-blur-md rounded-full p-1 border border-gray-300/50">
            <button onClick={handleZoomIn} disabled={scale >= 3 || isLoading} className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50" aria-label="הגדל תצוגה">
                <ZoomInIcon className="w-5 h-5 text-gray-800" />
            </button>
            <div className="w-8 h-px bg-gray-300/80"></div>
            <button onClick={handleZoomOut} disabled={scale <= 0.5 || isLoading} className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50" aria-label="הקטן תצוגה">
                <ZoomOutIcon className="w-5 h-5 text-gray-800" />
            </button>
            <div className="w-8 h-px bg-gray-300/80"></div>
            <button onClick={handleResetZoomAndPan} disabled={(scale === 1 && position.x === 0 && position.y === 0) || isLoading} className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50" aria-label="אפס תצוגה">
                <MaximizeIcon className="w-5 h-5 text-gray-800" />
            </button>
        </div>
      )}

      <div 
        ref={imageContainerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg"
        onMouseDown={(e) => { e.preventDefault(); handlePanStart(e.clientX, e.clientY); }}
        onMouseMove={(e) => { e.preventDefault(); handlePanMove(e.clientX, e.clientY); }}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={(e) => handlePanStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePanMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePanEnd}
        onWheel={handleWheel}
        style={{ cursor: scale > 1 && !isLoading ? 'grab' : 'default' }}
      >
        {displayImageUrl ? (
          <motion.img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="דוגמנית למדידה וירטואלית"
            className="max-w-none max-h-none"
            draggable={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
                opacity: 1, 
                scale: scale,
                x: position.x,
                y: position.y,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                touchAction: 'none'
            }}
            data-testid="main-canvas-image"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-600 mt-4">טוען דוגמנית...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {displayImageUrl && !isLoading && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          <AnimatePresence>
              {isPoseMenuOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute bottom-full mb-3 w-80 bg-white/80 backdrop-blur-lg rounded-xl p-2 border border-gray-200/80 shadow-lg"
                  >
                      <div className="grid grid-cols-3 gap-2">
                          {poseInstructions.map((pose, index) => {
                              const imageUrl = generatedPoses[pose];
                              const isGenerated = !!imageUrl;
                              const isCurrent = index === currentPoseIndex;

                              return (
                                <button
                                    key={pose}
                                    onClick={() => onSelectPose(index)}
                                    disabled={isLoading}
                                    className={`relative w-full text-xs font-semibold text-gray-800 rounded-lg transition-all duration-200 flex flex-col items-center gap-1.5 p-1.5 group ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-200/70'}`}
                                >
                                    <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200/80">
                                        {isGenerated ? (
                                            <img src={imageUrl} alt={pose} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <span className="text-center leading-tight h-8 flex items-center">
                                      {pose}
                                    </span>
                                </button>
                              );
                          })}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-2 border border-gray-300/50">
            <button 
              onClick={handleNextPose}
              aria-label="פוזה קודמת"
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-800" />
            </button>
            <span className="text-sm font-semibold text-gray-800 w-48 text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>
            <button 
              onClick={handlePreviousPose}
              aria-label="פוזה הבאה"
              className="p-2 rounded-full hover:bg-white/80 active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;