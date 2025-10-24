/**
 * Netlify Function for Zero-Cost Virtual Try-On System
 *
 * This function receives form submissions, stores images in Cloudinary, and triggers GitHub Actions
 */

const admin = require('firebase-admin');
const busboy = require('busboy');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  try {
    // For Netlify, decode base64-encoded service account from environment variable
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    const tmpdir = os.tmpdir();
    const uploads = {};
    const fields = {};

    // Parse uploaded files
    bb.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;

      if (!mimeType.startsWith('image/')) {
        file.resume(); // Drain the stream
        return;
      }

      const filepath = path.join(tmpdir, filename);
      uploads[fieldname] = { filepath, filename, mimeType };
      file.pipe(fs.createWriteStream(filepath));
    });

    // Parse form fields
    bb.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    // Process request when parsing is complete
    bb.on('finish', async () => {
      try {
        // Validate required fields
        if (!uploads.user_photo || !uploads.garment_photo || !fields.email) {
          resolve({
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields: user_photo, garment_photo, email' })
          });
          return;
        }

        const userEmail = fields.email;
        const timestamp = Date.now();
        const requestId = `req_${timestamp}_${Math.random().toString(36).substring(7)}`;

        // Upload user photo to Cloudinary
        const userPhotoUpload = await cloudinary.uploader.upload(uploads.user_photo.filepath, {
          folder: `zero-cost-tryon/requests/${requestId}`,
          public_id: `user_photo_${timestamp}`,
          resource_type: 'image'
        });
        const userPhotoUrl = userPhotoUpload.secure_url;

        // Upload garment photo to Cloudinary
        const garmentPhotoUpload = await cloudinary.uploader.upload(uploads.garment_photo.filepath, {
          folder: `zero-cost-tryon/requests/${requestId}`,
          public_id: `garment_photo_${timestamp}`,
          resource_type: 'image'
        });
        const garmentPhotoUrl = garmentPhotoUpload.secure_url;

        // Create Firestore document
        await admin.firestore().collection('requests').doc(requestId).set({
          userId: requestId, // For now, using requestId as userId
          email: userEmail,
          userPhotoUrl: userPhotoUrl,
          garmentPhotoUrl: garmentPhotoUrl,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Trigger GitHub Actions via repository_dispatch
        const githubToken = process.env.GITHUB_TOKEN;
        const githubRepo = process.env.GITHUB_REPO; // Format: "username/repo-name"

        if (!githubToken || !githubRepo) {
          console.error('GitHub configuration missing. Set GITHUB_TOKEN and GITHUB_REPO environment variables.');
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server configuration error' })
          });
          return;
        }

        await axios.post(
          `https://api.github.com/repos/${githubRepo}/dispatches`,
          {
            event_type: 'run_vto_bot',
            client_payload: {
              request_id: requestId,
              user_photo_url: userPhotoUrl,
              garment_photo_url: garmentPhotoUrl,
              email: userEmail
            }
          },
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        // Clean up temporary files
        fs.unlinkSync(uploads.user_photo.filepath);
        fs.unlinkSync(uploads.garment_photo.filepath);

        resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Request submitted successfully! Check your email in ~2 minutes.',
            requestId: requestId
          })
        });

      } catch (error) {
        console.error('Error processing request:', error);
        resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to process request. Please try again.' })
        });
      }
    });

    bb.on('error', (error) => {
      console.error('Busboy error:', error);
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse request' })
      });
    });

    // Parse the request body
    bb.end(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
  });
};
