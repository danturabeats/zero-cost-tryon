# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a virtual try-on application built with React, TypeScript, and Vite. It uses Google's Gemini AI (specifically `gemini-2.5-flash-image`) to generate photorealistic images of users wearing different clothing items. The app allows users to:
1. Upload their photo or use a base model
2. Transform the photo into a fashion model image
3. Virtually try on clothing items from a wardrobe
4. Generate different poses with the same outfit
5. Contact stores via WhatsApp to purchase items

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

The app requires a Gemini API key to function:
- Set `GEMINI_API_KEY` in `.env.local` file
- The Vite config maps this to `process.env.API_KEY` at build time (see vite.config.ts:14)

## Core Architecture

### State Management
The app uses React hooks for state management in `App.tsx`:
- **Outfit History System**: `outfitHistory` is an array of `OutfitLayer` objects where each layer represents the model with added garments
- **Time-Travel UX**: `currentOutfitIndex` allows users to navigate backward through outfit history
- **Pose Variations**: Each outfit layer stores multiple `poseImages` (Record<string, string>) mapping pose instructions to generated image URLs
- **Try-On Limiting**: `tryOnCount` tracks API usage with a `MAX_TRY_ONS` limit (5 tries per session) for cost control

### Key Data Structures (types.ts)
- `WardrobeItem`: Represents a clothing item with store metadata (storeId, productSku) for commerce integration
- `OutfitLayer`: Contains a garment reference and its pose variations. The first layer has `garment: null` representing the base model

### Gemini AI Integration (services/geminiService.ts)
Three main AI operations, all using `gemini-2.5-flash-image`:
1. **generateModelImage**: Transforms user photo into a fashion model on neutral background
2. **generateVirtualTryOnImage**: Places garments onto the model with precise design fidelity (heavily prompted for exact logo/text replication)
3. **generatePoseVariation**: Regenerates the try-on image from different camera angles

**Critical API Config**: All generation functions MUST use `responseModalities: [Modality.IMAGE]` per Gemini API requirements for image generation models.

### Component Hierarchy
```
App.tsx (main state & orchestration)
├── StartScreen (photo upload & model generation)
│   └── Compare (before/after slider UI)
├── Canvas (displays current outfit image)
├── Wardrobe Panel (product selection sidebar)
│   ├── ProductSelector (filter & search)
│   └── ObjectCard (individual product display)
└── OutfitStack (outfit history navigation)
```

### User Flow States
1. **Start Screen**: Upload photo → AI generates model image → User confirms or retries
2. **Main App**: Three-column layout (desktop) or collapsible bottom sheet (mobile)
   - Canvas shows current outfit
   - Wardrobe panel for selecting garments
   - Outfit stack for history navigation

### Mobile Responsiveness
- Uses custom `useMediaQuery` hook (threshold: 767px)
- Mobile shows full-screen loading overlay during generation
- Bottom sheet collapses/expands with chevron button
- Canvas adjusts to fit screen while maintaining aspect ratio

## Important Implementation Details

### Error Handling
- `getFriendlyErrorMessage` in `lib/utils.ts` converts technical errors to user-friendly Hebrew messages
- All AI operations wrapped in try-catch with user-facing error states
- Safety filter blocks from Gemini are explicitly handled (see geminiService.ts:33-36)

### Image Processing
- User images converted to File objects for API calls
- Generated images returned as base64 data URLs
- `urlToFile` utility converts URLs back to Files for retry operations

### Analytics
- `trackEvent` function in utils.ts logs user actions (try_on_success, order_request_initiated)
- Events include storeId and productSku for commerce tracking

### Wardrobe System
- Default products in `wardrobe.ts` are hosted on GitHub (ammaarreshi/app-images)
- User can add custom products which get appended to the wardrobe state
- Active garments tracked by ID to show visual indicators in UI

### WhatsApp Integration
- `handleSendToStore` generates WhatsApp messages with product SKU
- Currently uses generic WhatsApp link; production would use store-specific phone numbers

## Critical Constraints

1. **Cost Control**: The `MAX_TRY_ONS` limit prevents excessive API usage
2. **API Key Security**: Never commit `.env.local` - it contains the Gemini API key
3. **Prompt Engineering**: The virtual try-on prompt (geminiService.ts:79-98) is heavily optimized for design fidelity - changes may degrade quality
4. **Pose Instructions**: Fixed array of 6 poses (App.tsx:21-28) - adding/removing affects UX flow

## Known Technical Patterns

### Undo/Redo Pattern
The app doesn't delete history when going backward:
- Selecting the same garment at index N+1 moves forward instead of regenerating
- Only regenerates if a different garment is selected or a refinement prompt is used

### Retry Mechanism
`handleRetryLastGarment` regenerates the current layer with the same garment using the previous layer as base - useful for AI generation variance.

### Hebrew UI
All user-facing text is in Hebrew with RTL (right-to-left) layout considerations throughout components.
