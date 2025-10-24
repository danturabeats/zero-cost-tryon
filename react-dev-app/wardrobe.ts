/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items hosted for easy access
export const defaultProducts: WardrobeItem[] = [
  {
    id: 'gemini-sweat',
    name: 'סווטשירט Gemini',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/gemini-sweat-2.png',
    price: 250,
    currency: 'ILS',
    storeId: 'gemini_store_b7',
    productSku: 'GEM-SWT-001-B7',
  },
  {
    id: 'gemini-tee',
    name: 'טי-שירט Gemini',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/Gemini-tee.png',
    price: 120,
    currency: 'ILS',
    storeId: 'gemini_store_b7',
    productSku: 'GEM-TEE-002-B7',
  },
  {
    id: 'roberto-vino-hoodie',
    name: 'קפוצ\'ון Roberto Vino',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/roberto-vino-hoodie.png',
    price: 300,
    currency: 'ILS',
    storeId: 'roberto_vino_beersheva',
    productSku: 'RV-HDE-458-BS',
  },
  {
    id: 'replay-zip-hoodie',
    name: 'קפוצ\'ון Replay Zip',
    url: 'https://raw.githubusercontent.com/ammaarreshi/app-images/main/replay-hoodie.png',
    price: 350,
    currency: 'ILS',
    storeId: 'replay_grand_canyon_bs',
    productSku: 'RP-HDE-ZIP-112-GC',
  }
];