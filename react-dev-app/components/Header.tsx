/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ShirtIcon, HistoryIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <ShirtIcon className="w-7 h-7 text-gray-800" />
            <h1 className="text-2xl md:text-3xl font-serif tracking-wider text-gray-900">
                קניון ה-AI המקומי
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => alert('בקרוב: רשימת החנויות המשתתפות')} className="hidden sm:block text-sm font-semibold text-gray-700 hover:bg-gray-200/70 rounded-full px-4 py-2 transition-colors" aria-label="הצג חנויות משתתפות">
                החנויות המשתתפות
            </button>
            <button onClick={() => alert('בקרוב: היסטוריית המדידות שלך')} className="relative p-2 rounded-full hover:bg-gray-200/70 transition-colors" aria-label="הצג היסטוריית מדידות">
                <HistoryIcon className="w-6 h-6 text-gray-800" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;