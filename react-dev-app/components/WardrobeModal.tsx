/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon, WhatsAppIcon } from './icons';
import { urlToFile } from '../lib/utils';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem, refinementPrompt?: string) => void;
  onSendToStore: (item: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onSendToStore, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [refinementPrompt, setRefinementPrompt] = useState('');

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item, refinementPrompt);
        } catch (err) {
            const detailedError = `טעינת הפריט נכשלה. ייתכן שיש בעיית CORS. בדוק את מסוף המפתחים לפרטים.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('יש לבחור קובץ תמונה.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                price: 0,
                currency: 'ILS',
                storeId: 'custom',
                productSku: 'CUSTOM',
            };
            onGarmentSelect(file, customGarmentInfo, refinementPrompt);
        }
    };

  return (
    <div className="pt-6 border-t border-gray-400/50">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">קטלוג מוצרים</h2>
        <div className="grid grid-cols-3 gap-3">
            {wardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <div key={item.id} className="relative aspect-square flex flex-col border rounded-lg overflow-hidden group">
                    <button
                        onClick={() => handleGarmentClick(item)}
                        disabled={isLoading || isActive}
                        className="relative w-full h-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label={`למדוד ${item.name}`}
                        data-testid={`try-on-button-${item.productSku}`}
                    >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-bold text-center p-1">למדידה</p>
                        </div>
                        {isActive && (
                            <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </button>
                    <div className="p-1.5 bg-white/70 backdrop-blur-sm">
                         <p className="text-xs font-semibold text-gray-800 truncate" title={item.name}>{item.name}</p>
                         <div className="flex justify-between items-center mt-1">
                            <p className="text-xs font-bold text-gray-600">{item.price.toLocaleString()} ₪</p>
                            <button onClick={() => onSendToStore(item)} disabled={isLoading} className="p-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors disabled:bg-gray-300" aria-label={`הזמן ${item.name} בוואטסאפ`} data-testid={`whatsapp-button-${item.productSku}`}>
                                <WhatsAppIcon className="w-4 h-4" />
                            </button>
                         </div>
                    </div>
                </div>
            );
            })}
            <label htmlFor="custom-garment-upload" data-testid="upload-custom-garment-label" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">העלאה</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>

        <div className="mt-4">
            <label htmlFor="refinement-prompt" className="block text-sm font-medium text-gray-700 mb-1">
                הוראות נוספות ל-AI (אופציונלי)
            </label>
            <input
                type="text"
                id="refinement-prompt"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="לדוגמה: 'התאם כ-Oversize', 'ודא שהצווארון פתוח'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isLoading}
                data-testid="refinement-prompt-input"
            />
        </div>

        {wardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">פריטים שתעלו יופיעו כאן.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;