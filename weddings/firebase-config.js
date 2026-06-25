/*
 * Firebase Config Pusat
 * Project: STIFIn Family Medan - Wedding Invitation System
 * Path target: /weddings/firebase-config.js
 *
 * Dipakai bersama oleh:
 * - /weddings/index.html
 * - /weddings/wedding_001/index.html
 * - /weddings/wedding_002/index.html
 * - /weddings/admin/index.html
 *
 * Catatan:
 * File ini sengaja TIDAK memakai import/export static agar bisa dipanggil
 * dengan <script src="../firebase-config.js"></script> atau
 * <script src="./firebase-config.js"></script> di halaman biasa.
 */

(function () {
  'use strict';

  const FIREBASE_VERSION = '12.0.0';

  const firebaseConfig = {
    apiKey: 'AIzaSyAfI1UUHUqnpImUpX_fsH_pTeJGZcUcG8s',
    authDomain: 'rezaintan-wedding.firebaseapp.com',
    projectId: 'rezaintan-wedding',
    storageBucket: 'rezaintan-wedding.firebasestorage.app',
    messagingSenderId: '834037181305',
    appId: '1:834037181305:web:4d8335917243a408759da8',
    measurementId: 'G-WDJEYXSV6M'
  };

  const weddingSettings = {
    firebaseEnabled: true,
    collectionName: 'weddings',
    defaultWeddingId: 'wedding_002',
    demoPrefix: 'demo_',
    maxEditorsPerWedding: 2,
    appName: 'STIFIn Wedding Invitation'
  };

  let cachedFirebase = null;

  function getFirebaseConfig() {
    return { ...firebaseConfig };
  }

  function getWeddingSettings() {
    return { ...weddingSettings };
  }

  async function initFirebase(options = {}) {
    if (cachedFirebase && !options.forceNew) {
      return cachedFirebase;
    }

    const [firebaseApp, firestore, auth, storage] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`)
    ]);

    const existingApps = firebaseApp.getApps();
    const app = existingApps.length
      ? firebaseApp.getApp()
      : firebaseApp.initializeApp(firebaseConfig);

    const db = firestore.getFirestore(app);
    const authInstance = auth.getAuth(app);
    const storageInstance = storage.getStorage(app);

    cachedFirebase = {
      app,
      db,
      auth: authInstance,
      storage: storageInstance,
      modules: {
        firebaseApp,
        firestore,
        auth,
        storage
      },
      settings: getWeddingSettings(),
      config: getFirebaseConfig()
    };

    return cachedFirebase;
  }

  async function getWeddingDocRef(weddingId) {
    const firebase = await initFirebase();
    const id = weddingId || weddingSettings.defaultWeddingId;
    return firebase.modules.firestore.doc(
      firebase.db,
      weddingSettings.collectionName,
      id
    );
  }

  async function getWeddingCollectionRef() {
    const firebase = await initFirebase();
    return firebase.modules.firestore.collection(
      firebase.db,
      weddingSettings.collectionName
    );
  }

  // Kompatibilitas untuk script template yang sudah memakai window.firebaseConfig.
  window.WEDDING_FIREBASE_ENABLED = weddingSettings.firebaseEnabled;
  window.WEDDING_COLLECTION = weddingSettings.collectionName;
  window.WEDDING_DEFAULT_ID = weddingSettings.defaultWeddingId;
  window.WEDDING_MAX_EDITORS = weddingSettings.maxEditorsPerWedding;
  window.firebaseConfig = getFirebaseConfig();

  // Helper utama untuk template dan admin.
  window.WeddingFirebase = {
    version: FIREBASE_VERSION,
    getFirebaseConfig,
    getWeddingSettings,
    initFirebase,
    getWeddingDocRef,
    getWeddingCollectionRef
  };
})();
