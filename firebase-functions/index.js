/**
 * Firebase Cloud Functions for Zero-Cost Virtual Try-On System
 *
 * This function receives form submissions, stores images, and triggers GitHub Actions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Busboy = require('busboy');
const axios = require('axios');
const path = require('path');
const os = require('os');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

admin.initializeApp();

// Configure Cloudinary
cloudinary.config({
  cloud_name: functions.config().cloudinary.cloud_name,
  api_key: functions.config().cloudinary.api_key,
  api_secret: functions.config().cloudinary.api_secret
});

/**
 * Main trigger function: Receives try-on requests from HTML form
 *
 * Flow:
 * 1. Parse multipart/form-data with Busboy
 * 2. Upload images to Firebase Storage
 * 3. Create Firestore document with 'pending' status
 * 4. Trigger GitHub Actions via repository_dispatch webhook
 * 5. Return success response to user
 */
exports.submitTryOn = functions.https.onRequest(async (req, res) => {
  // Enable CORS for web requests
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const busboy = Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();
  const uploads = {};
  const fields = {};

  // Parse uploaded files
  busboy.on('file', (fieldname, file, info) => {
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
  busboy.on('field', (fieldname, value) => {
    fields[fieldname] = value;
  });

  // Process request when parsing is complete
  busboy.on('finish', async () => {
    try {
      // Validate required fields
      if (!uploads.user_photo || !uploads.garment_photo || !fields.email) {
        res.status(400).json({ error: 'Missing required fields: user_photo, garment_photo, email' });
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
      const githubToken = functions.config().github.token;
      const githubRepo = functions.config().github.repo; // Format: "username/repo-name"

      if (!githubToken || !githubRepo) {
        console.error('GitHub configuration missing. Set with: firebase functions:config:set github.token="YOUR_TOKEN" github.repo="username/repo"');
        res.status(500).json({ error: 'Server configuration error' });
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

      res.status(200).json({
        success: true,
        message: 'Request submitted successfully! Check your email in ~2 minutes.',
        requestId: requestId
      });

    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Failed to process request. Please try again.' });
    }
  });

  busboy.end(req.rawBody);
});

/**
 * Optional: Function to retrieve result by request ID
 * Users can check their request status via a simple GET request
 */
exports.getResult = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  const requestId = req.query.id;

  if (!requestId) {
    res.status(400).json({ error: 'Missing request ID parameter' });
    return;
  }

  try {
    const doc = await admin.firestore().collection('requests').doc(requestId).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const data = doc.data();
    res.status(200).json({
      requestId: requestId,
      status: data.status,
      resultUrl: data.resultUrl || null,
      createdAt: data.createdAt,
      completedAt: data.completedAt || null
    });

  } catch (error) {
    console.error('Error retrieving result:', error);
    res.status(500).json({ error: 'Failed to retrieve result' });
  }
});
