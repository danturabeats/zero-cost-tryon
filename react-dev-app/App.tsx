/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation } from './services/geminiService';
import { OutfitLayer, WardrobeItem } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultProducts } from './wardrobe';
import Footer from './components/Footer';
import Header from './components/Header';
import { getFriendlyErrorMessage, urlToFile, trackEvent } from './lib/utils';
import Spinner from './components/Spinner';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const MAX_TRY_ONS = 5; // Cost control: Limit for non-registered users

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultProducts);
  const [tryOnCount, setTryOnCount] = useState(0);

  const isMobile = useMediaQuery('(max-width: 767px)');

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const generatedPoses = useMemo(() => {
    if (outfitHistory.length === 0) return {};
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? currentLayer.poseImages : {};
  }, [outfitHistory, currentOutfitIndex]);
  
  const isTryOnLimitReached = useMemo(() => tryOnCount >= MAX_TRY_ONS, [tryOnCount]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultProducts);
    setTryOnCount(0);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem, refinementPrompt?: string) => {
    if (!displayImageUrl || isLoading) return;

    if (isTryOnLimitReached) {
        setError(`הגעת למכסת המדידות (${MAX_TRY_ONS}) לסשן זה.`);
        return;
    }

    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id && !refinementPrompt) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0);
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`👕 ה-AI מתאים את ${garmentInfo.name} לגופך...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile, refinementPrompt);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      setTryOnCount(prev => prev + 1);

      trackEvent('try_on_success', { 
        storeId: garmentInfo.storeId, 
        productSku: garmentInfo.productSku,
        refinementUsed: !!refinementPrompt,
      });
      
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      // FIX: Pass the 'unknown' error object directly to the error handler, which is designed to process it.
      setError(getFriendlyErrorMessage(err, 'המדידה נכשלה'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex, isTryOnLimitReached]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0);
    }
  };

  const handleRetryLastGarment = useCallback(async () => {
    if (isLoading || currentOutfitIndex === 0) return;
    
    if (isTryOnLimitReached) {
        setError(`הגעת למכסת המדידות (${MAX_TRY_ONS}) לסשן זה.`);
        return;
    }

    const currentLayer = outfitHistory[currentOutfitIndex];
    const garmentInfo = currentLayer.garment;
    if (!garmentInfo) return;

    const previousLayer = outfitHistory[currentOutfitIndex - 1];
    const baseImageUrl = Object.values(previousLayer.poseImages)[0];
    if (!baseImageUrl) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`✨ מנסה שוב את ${garmentInfo.name} מזווית אחרת...`);

    try {
        const garmentFile = await urlToFile(garmentInfo.url, garmentInfo.name);
        const newImageUrl = await generateVirtualTryOnImage(baseImageUrl, garmentFile);
        
        const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];

        setOutfitHistory(prevHistory => {
            const newHistory = [...prevHistory];
            const updatedLayer = { ...newHistory[currentOutfitIndex] };
            updatedLayer.poseImages = {
                ...updatedLayer.poseImages,
                [currentPoseInstruction]: newImageUrl
            };
            newHistory[currentOutfitIndex] = updatedLayer;
            return newHistory;
        });
        setTryOnCount(prev => prev + 1);
        trackEvent('retry_try_on_success', { 
            storeId: garmentInfo.storeId, 
            productSku: garmentInfo.productSku 
        });

    } catch (err) {
        // FIX: Pass the 'unknown' error object directly to the error handler, which is designed to process it.
        setError(getFriendlyErrorMessage(err, 'הניסיון החוזר נכשל'));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [isLoading, currentOutfitIndex, outfitHistory, currentPoseIndex, isTryOnLimitReached]);
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`🏃‍♀️ ה-AI יוצר את התנוחה המושלמת שלך...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      // FIX: Pass the 'unknown' error object directly to the error handler, which is designed to process it.
      setError(getFriendlyErrorMessage(err, 'שינוי התנוחה נכשל'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  const handleSendToStore = (item: WardrobeItem) => {
    trackEvent('order_request_initiated', {
        storeId: item.storeId,
        productSku: item.productSku,
        itemName: item.name
    });

    const message = `היי, התעניינתי בפריט '${item.name}' (SKU: ${item.productSku}) דרך קניון ה-AI. האם הוא זמין במלאי? תודה!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // In a real app, you would use the store's actual phone number:
    // const storePhoneNumber = getStorePhoneNumber(item.storeId);
    // const whatsappUrl = `https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };


  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Header />
            <main className="flex-grow relative flex flex-col md:flex-row-reverse overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  generatedPoses={generatedPoses}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 left-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-r border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'הרחב פאנל' : 'כווץ פאנל'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">שגיאה</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                      onRetryLastGarment={handleRetryLastGarment}
                      isLoading={isLoading}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      onSendToStore={handleSendToStore}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading || isTryOnLimitReached}
                      wardrobe={wardrobe}
                    />
                     {isTryOnLimitReached && !error && (
                        <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-800 p-4 rounded-md" role="alert">
                            <p className="font-bold">מכסת מדידות</p>
                            <p>הגעת למכסת המדידות לסשן זה. כדי להמשיך, יש להתחיל מחדש.</p>
                        </div>
                    )}
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
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
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;