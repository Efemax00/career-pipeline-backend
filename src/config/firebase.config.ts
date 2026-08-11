import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      // Method 1: Using service account file path
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('🔥 Firebase initialized with service account file');
          return admin;
        }
      }

      // Method 2: Using environment variable with JSON string
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('🔥 Firebase initialized with service account env var');
        return admin;
      }

      // Method 3: For development with project ID only (limited functionality)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'career-pipeline-835ee',
      });
      console.log('🔥 Firebase initialized with project ID only (development mode)');
      console.log('⚠️  Warning: Token verification may not work without service account');
      
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }
  return admin;
};