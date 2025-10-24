/**
 * Playwright Bot for Zero-Cost Virtual Try-On System
 *
 * This script runs in GitHub Actions and automates the virtual try-on process
 * by controlling a headless browser to interact with the React dev app
 */

const { chromium } = require('playwright');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin SDK
// Credentials should be set via GOOGLE_APPLICATION_CREDENTIALS env var
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get environment variables (injected by GitHub Actions from webhook payload)
const REQUEST_ID = process.env.REQUEST_ID;
const USER_PHOTO_URL = process.env.USER_PHOTO_URL;
const GARMENT_PHOTO_URL = process.env.GARMENT_PHOTO_URL;
const USER_EMAIL = process.env.USER_EMAIL;

// Configuration
const LOCALHOST_URL = 'http://localhost:3000';
const TIMEOUT_MODEL_GENERATION = 150000; // 150 seconds for AI model generation
const TIMEOUT_TRYON = 180000; // 180 seconds for virtual try-on
const TIMEOUT_NAVIGATION = 30000; // 30 seconds for page navigation

/**
 * Download image from URL to local file
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Upload result image to Cloudinary
 */
async function uploadResultToCloudinary(imageBuffer, requestId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `zero-cost-tryon/requests/${requestId}`,
        public_id: `result_${Date.now()}`,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    uploadStream.end(imageBuffer);
  });
}

/**
 * Update request status in Firestore
 */
async function updateStatus(status, additionalData = {}) {
  await db.collection('requests').doc(REQUEST_ID).update({
    status: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...additionalData
  });
}

/**
 * Main bot execution function
 */
async function runBot() {
  console.log('🤖 Starting Virtual Try-On Bot...');
  console.log(`📋 Request ID: ${REQUEST_ID}`);
  console.log(`👤 User Email: ${USER_EMAIL}`);

  // Update status to 'processing'
  await updateStatus('processing');

  let browser;
  try {
    // Download images from Storage
    console.log('📥 Downloading images...');
    const userPhotoPath = path.join(__dirname, 'temp_user_photo.jpg');
    const garmentPhotoPath = path.join(__dirname, 'temp_garment_photo.jpg');

    await downloadImage(USER_PHOTO_URL, userPhotoPath);
    console.log('✅ User photo downloaded');

    await downloadImage(GARMENT_PHOTO_URL, garmentPhotoPath);
    console.log('✅ Garment photo downloaded');

    // Launch browser
    console.log('🌐 Launching headless browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Navigate to localhost React app
    console.log(`🔗 Navigating to ${LOCALHOST_URL}...`);
    await page.goto(LOCALHOST_URL, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_NAVIGATION
    });
    console.log('✅ Page loaded successfully');

    // STEP 1: Upload user photo
    console.log('📤 Uploading user photo...');
    const userUploadInput = page.locator('input#image-upload-start');
    await userUploadInput.setInputFiles(userPhotoPath);
    console.log('✅ User photo uploaded');

    // Wait for model generation to complete
    console.log('⏳ Waiting for AI model generation (up to 150s)...');
    await page.waitForSelector('[data-testid="continue-to-styling-button"]', {
      timeout: TIMEOUT_MODEL_GENERATION,
      state: 'visible'
    });
    console.log('✅ Model generated successfully');

    // Click continue button
    await page.click('[data-testid="continue-to-styling-button"]');
    console.log('➡️ Proceeded to styling screen');

    // Wait for wardrobe panel to be ready
    await page.waitForTimeout(2000); // Small delay for page transition

    // STEP 2: Upload garment photo
    console.log('📤 Uploading garment photo...');
    const garmentUploadInput = page.locator('input#custom-garment-upload');
    await garmentUploadInput.setInputFiles(garmentPhotoPath);
    console.log('✅ Garment photo uploaded');

    // Wait for virtual try-on to complete
    console.log('⏳ Waiting for AI virtual try-on (up to 180s)...');

    // Wait for loading to start (the image generation process)
    await page.waitForTimeout(2000);

    // Wait for loading to finish by checking if the main canvas image is visible and stable
    await page.waitForSelector('[data-testid="main-canvas-image"]', {
      timeout: TIMEOUT_TRYON,
      state: 'visible'
    });

    // Additional wait to ensure AI generation is fully complete
    await page.waitForTimeout(5000);

    console.log('✅ Virtual try-on completed');

    // STEP 3: Capture result image
    console.log('📸 Capturing result image...');
    const canvasImage = page.locator('[data-testid="main-canvas-image"]');

    // Take screenshot of the canvas element
    const screenshot = await canvasImage.screenshot({
      type: 'png'
    });

    console.log('✅ Result image captured');

    // Upload result to Cloudinary
    console.log('☁️ Uploading result to Cloudinary...');
    const resultUrl = await uploadResultToCloudinary(screenshot, REQUEST_ID);
    console.log(`✅ Result uploaded: ${resultUrl}`);

    // Update Firestore with result
    await updateStatus('completed', {
      resultUrl: resultUrl,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Request marked as completed');
    console.log('🎉 Bot execution finished successfully!');

    // Clean up temporary files
    fs.unlinkSync(userPhotoPath);
    fs.unlinkSync(garmentPhotoPath);

  } catch (error) {
    console.error('❌ Bot execution failed:', error);

    // Update status to failed
    await updateStatus('failed', {
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🌐 Browser closed');
    }
  }
}

// Execute bot
runBot()
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
