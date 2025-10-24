/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            // FIX: Per Gemini API guidelines for image generation models, `responseModalities` must be an array with a single `Modality.IMAGE` element.
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File, refinementPrompt?: string): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    
    let prompt = `You are a hyper-realistic, precision-focused virtual try-on AI. Your SOLE purpose is to digitally place a garment onto a model with perfect accuracy. You will receive a 'model image' and a 'garment image'.

**NON-NEGOTIABLE DIRECTIVES:**

1.  **MODEL & BACKGROUND IMMUTABILITY:** The person in the 'model image' (including face, hair, skin, pose, body shape) and the entire background MUST remain 100% identical to the original 'model image'. NO modifications to the model or background are permitted.

2.  **GARMENT REPLACEMENT:** The existing clothing on the model must be COMPLETELY OBLITERATED and replaced by the clothing from the 'garment image'.

3.  **DESIGN FIDELITY IS PARAMOUNT:** This is the most critical rule. The garment's design must be replicated with *photorealistic, microscopic detail*.
    *   **EXACT REPLICA:** All logos, text, graphics, patches, embroidery, and patterns must be transferred EXACTLY as they appear in the 'garment image'.
    *   **NO CREATIVE INTERPRETATION:** Do not alter, omit, add, or "reimagine" any part of the design. Do not guess what small text says; replicate its visual form perfectly. Your job is replication, not creation. If a logo is slightly blurry in the source, it should be slightly blurry in the output. Replicate it faithfully.
    *   **TEXTURE & COLOR ACCURACY:** The fabric texture, color, and material properties must be reproduced with absolute fidelity.

4.  **PHYSICALLY ACCURATE DRAPING:** The new garment must be realistically draped over the model's body, respecting their pose. Create natural-looking folds, shadows, and highlights that are consistent with the lighting in the 'model image'.`;
    
    if (refinementPrompt && refinementPrompt.trim()) {
        prompt += `\n\n**USER REFINEMENT INSTRUCTION:** A user has provided a specific styling request. Apply this instruction to the final draped garment, while still adhering to all previous directives. The instruction is: "${refinementPrompt}"`;
    }

    prompt += `\n\n5.  **OUTPUT REQUIREMENT:** Your output MUST be ONLY the final, high-resolution image. No text, no commentary, no explanations.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            // FIX: Per Gemini API guidelines for image generation models, `responseModalities` must be an array with a single `Modality.IMAGE` element.
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            // FIX: Per Gemini API guidelines for image generation models, `responseModalities` must be an array with a single `Modality.IMAGE` element.
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};