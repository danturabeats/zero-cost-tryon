/**
 * Netlify Function to retrieve result by request ID
 * Users can check their request status via a simple GET request
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  // For Netlify, decode base64-encoded service account from environment variable
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' })
    };
  }

  const requestId = event.queryStringParameters?.id;

  if (!requestId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request ID parameter' })
    };
  }

  try {
    const doc = await admin.firestore().collection('requests').doc(requestId).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Request not found' })
      };
    }

    const data = doc.data();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        requestId: requestId,
        status: data.status,
        resultUrl: data.resultUrl || null,
        createdAt: data.createdAt,
        completedAt: data.completedAt || null
      })
    };

  } catch (error) {
    console.error('Error retrieving result:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve result' })
    };
  }
};
