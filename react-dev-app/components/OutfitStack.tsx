/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, RefreshCwIcon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
  onRetryLastGarment: () => void;
  isLoading: boolean;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment, onRetryLastGarment, isLoading }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-3">מה אני לובש/ת כרגע</h2>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.garment?.id || 'base'}
            className="flex items-center justify-between bg-white/50 p-2 rounded-lg animate-fade-in border border-gray-200/80"
          >
            <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 ml-3 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">
                  {index + 1}
                </span>
                {layer.garment && (
                    <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md ml-3" />
                )}
                <span className="font-semibold text-gray-800 truncate" title={layer.garment?.name}>
                  {layer.garment ? layer.garment.name : 'דוגמנית בסיס'}
                </span>
            </div>
            {index > 0 && index === outfitHistory.length - 1 && (
                <div className="flex items-center flex-shrink-0">
                    <button
                        onClick={onRetryLastGarment}
                        disabled={isLoading}
                        className="flex-shrink-0 text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`נסה שוב ${layer.garment?.name}`}
                    >
                        <RefreshCwIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRemoveLastGarment}
                        disabled={isLoading}
                        className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`הסר ${layer.garment?.name}`}
                    >
                        <Trash2Icon className="w-5 h-5" />
                    </button>
                </div>
            )}
          </div>
        ))}
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-gray-500 pt-4">הפריטים שתמדדו יופיעו כאן. בחרו פריט מהקטלוג למטה.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;