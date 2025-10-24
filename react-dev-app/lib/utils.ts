/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
export const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};


export function getFriendlyErrorMessage(error: unknown, context: string): string {
    console.error(`[AI Error] Context: ${context}`, error);
    let rawMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    }
    
    // Generic, user-focused error message
    if (rawMessage.includes("blocked")) {
        return "הפעולה נכשלה עקב מגבלות בטיחות. נסו תמונה או פריט אחר.";
    }

    return `אופס, משהו השתבש. ${context}. נשמח אם תנסו שוב.`;
}

/**
 * Simulates tracking an event for attribution.
 * In a real application, this would send data to a service like Google Analytics, Mixpanel, or a database.
 * @param eventName The name of the event (e.g., 'try_on', 'order_request').
 * @param details An object with event details (e.g., { storeId, productSku }).
 */
export const trackEvent = (eventName: string, details: object) => {
    const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        details,
        // In a real app, you might have a userId or sessionId here
        sessionId: 'session_12345',
    };

    console.log(`[Attribution Tracking]`, eventData);
    // In a real app, you would uncomment one of the following lines:
    // - fetch('/api/track', { method: 'POST', body: JSON.stringify(eventData) });
    // - analytics.track(eventName, details);
};
