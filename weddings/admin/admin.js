/*
 * Wedding Admin Manager
 * Path target: /weddings/admin/admin.js
 * Requires: /weddings/firebase-config.js loaded before this file.
 */

(() => {
  'use strict';

  const TEMPLATE_CATALOG = {
    wedding_001: {
      id: 'wedding_001',
      name: 'Classic Wedding',
      path: '/weddings/wedding_001/index.html'
    },
    wedding_002: {
      id: 'wedding_002',
      name: 'Dark Luxury Cinematic',
      path: '/weddings/wedding_002/index.html'
    }
  };

  const FIELD_IDS = [
    'templateId', 'templateName', 'templatePath', 'isActive', 'metaTitle', 'metaDescription',
    'openingTitle', 'guestName', 'weddingDateText', 'weddingDatetime', 'groomShortName',
    'brideShortName', 'openingMessage', 'heroDescription', 'openingPrayer', 'groomName',
    'brideName', 'groomBadge', 'brideBadge', 'groomPhotoUrl', 'bridePhotoUrl', 'groomParent',
    'brideParent', 'coupleStory', 'akadTitle', 'receptionTitle', 'mapUrl', 'phoneNumber',
    'akadDetail', 'receptionDetail', 'closingMessage', 'giftBank1', 'giftNumber1', 'giftName1',
    'giftType1', 'giftIcon1', 'giftBank2', 'giftNumber2', 'giftName2', 'giftType2', 'giftIcon2',
    'qrisImageUrl', 'giftDescription', 'qrisNote', 'giftThanks', 'musicUrl', 'closingCoupleNames',
    'galleryImages', 'editorEmails', 'editorUids', 'maxEditors'
  ];

  const els = {};
  const state = {
    firebase: null,
    user: null,
    currentWeddingId: window.WEDDING_DEFAULT_ID || 'wedding_002',
    currentData: {},
    accessibleWeddings: [],
    rsvpRows: [],
    subcollectionUnsubs: []
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindEvents();
    setStatus('loginStatus', 'Menyiapkan koneksi Firebase...');

    if (!window.WeddingFirebase) {
      setStatus('loginStatus', 'firebase-config.js belum terbaca. Pastikan ../firebase-config.js dipanggil sebelum admin.js.', 'error');
      return;
    }

    try {
      state.firebase = await window.WeddingFirebase.initFirebase();
      initAuthListener();
    } catch (error) {
      console.error(error);
      setStatus('loginStatus', 'Gagal memulai Firebase. Cek firebase-config.js dan koneksi internet.', 'error');
    }
  }

  function cacheElements() {
    const ids = [
      'toast', 'loginPage', 'dashboard', 'loginForm', 'email', 'password', 'loginStatus',
      'logoutBtn', 'userInfo', 'weddingList', 'refreshWeddingListBtn', 'weddingIdInput',
      'loadWeddingBtn', 'activeWeddingTitle', 'activeWeddingSubtitle', 'previewWeddingBtn',
      'copyPreviewBtn', 'newWeddingId', 'newTemplateId', 'newEditorEmail', 'createWeddingBtn',
      'createWeddingStatus', 'saveWeddingBtn', 'saveWeddingStatus', 'linkTemplatePath',
      'guestInput', 'generateLinkBtn', 'guestLinkOutput', 'copyLinkBtn', 'uploadStatus',
      'totalVisitors', 'totalRsvp', 'totalHadir', 'totalWishes', 'rsvpTable', 'exportRsvpBtn',
      'wishesList', 'visitorsList', ...FIELD_IDS
    ];

    ids.forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    els.loginForm?.addEventListener('submit', handleLogin);
    els.logoutBtn?.addEventListener('click', handleLogout);
    els.refreshWeddingListBtn?.addEventListener('click', loadAccessibleWeddings);
    els.loadWeddingBtn?.addEventListener('click', () => loadWeddingById(getValue('weddingIdInput')));
    els.weddingIdInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') loadWeddingById(getValue('weddingIdInput'));
    });
    els.createWeddingBtn?.addEventListener('click', createWeddingData);
    els.saveWeddingBtn?.addEventListener('click', saveWeddingData);
    els.generateLinkBtn?.addEventListener('click', generateGuestLink);
    els.copyLinkBtn?.addEventListener('click', () => copyText(els.guestLinkOutput?.value || '', 'Link tamu berhasil disalin ✨'));
    els.copyPreviewBtn?.addEventListener('click', () => copyText(els.previewWeddingBtn?.href || '', 'Link preview berhasil disalin ✨'));
    els.exportRsvpBtn?.addEventListener('click', exportRsvpCsv);

    document.querySelectorAll('.tab-btn').forEach((button) => {
      button.addEventListener('click', () => activateTab(button.dataset.tab));
    });

    els.templateId?.addEventListener('change', () => applyTemplateChoice(els.templateId.value));
    els.newTemplateId?.addEventListener('change', () => suggestNewWeddingId());

    document.querySelectorAll('input[type="file"][data-field]').forEach((input) => {
      input.addEventListener('change', () => handleMediaUpload(input));
    });
  }

  function initAuthListener() {
    const authModule = state.firebase.modules.auth;
    authModule.onAuthStateChanged(state.firebase.auth, async (user) => {
      state.user = user;
      if (user) {
        showDashboard(user);
        await loadAccessibleWeddings();
        const params = new URLSearchParams(window.location.search);
        const weddingFromUrl = params.get('id');
        if (weddingFromUrl) await loadWeddingById(weddingFromUrl);
        return;
      }
      showLogin();
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = getValue('email');
    const password = getValue('password');

    if (!state.firebase?.auth || !state.firebase?.modules?.auth) {
      setStatus('loginStatus', 'Firebase Auth belum siap. Cek apakah ../firebase-config.js sudah benar-benar terbaca.', 'error');
      return;
    }

    setStatus('loginStatus', 'Memproses login...');
    try {
      const authModule = state.firebase.modules.auth;
      const credential = await authModule.signInWithEmailAndPassword(state.firebase.auth, email, password);

      // Force masuk dashboard setelah login sukses.
      // onAuthStateChanged tetap aktif, tapi ini membuat UI tidak diam kalau listener lambat.
      state.user = credential.user;
      showDashboard(credential.user);
      setStatus('loginStatus', 'Login berhasil. Membuka dashboard...', 'success');

      try {
        await loadAccessibleWeddings();
      } catch (firestoreError) {
        console.warn('Login berhasil, tetapi daftar wedding belum bisa dimuat.', firestoreError);
        setWeddingListState('Login berhasil, tetapi data wedding belum bisa dimuat. Cek Firestore Rules atau tambahkan UID/email akun ini ke dokumen wedding.');
        showToast('Login berhasil, data wedding belum termuat.');
      }
    } catch (error) {
      console.error('LOGIN ERROR DETAIL:', error);
      setStatus('loginStatus', getFriendlyAuthError(error), 'error');
    }
  }

  async function handleLogout() {
    try {
      await state.firebase.modules.auth.signOut(state.firebase.auth);
      showToast('Logout berhasil.');
    } catch (error) {
      console.error(error);
      showToast('Gagal logout.');
    }
  }

  function showDashboard(user) {
    els.loginPage?.classList.add('hidden');
    els.dashboard?.classList.remove('hidden');
    if (els.userInfo) {
      els.userInfo.textContent = `${user.email || 'Tanpa email'} · UID: ${user.uid}`;
    }
  }

  function showLogin() {
    state.currentWeddingId = window.WEDDING_DEFAULT_ID || 'wedding_002';
    state.currentData = {};
    state.accessibleWeddings = [];
    els.dashboard?.classList.add('hidden');
    els.loginPage?.classList.remove('hidden');
    setStatus('loginStatus', 'Silakan login untuk membuka dashboard.');
  }

  async function loadAccessibleWeddings() {
    if (!state.user) return;
    setWeddingListState('Memuat daftar undangan...');

    const firestore = state.firebase.modules.firestore;
    const collectionName = getCollectionName();
    const weddingsRef = firestore.collection(state.firebase.db, collectionName);
    const resultMap = new Map();

    async function runArrayQuery(field, value) {
      if (!value) return;
      try {
        const q = firestore.query(weddingsRef, firestore.where(field, 'array-contains', value));
        const snap = await firestore.getDocs(q);
        snap.forEach((docSnap) => resultMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
      } catch (error) {
        console.warn(`Query ${field} gagal`, error);
      }
    }

    await Promise.all([
      runArrayQuery('editorUids', state.user.uid),
      runArrayQuery('editorEmails', state.user.email)
    ]);

    state.accessibleWeddings = Array.from(resultMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    renderWeddingList();

    if (!state.currentData?.id && state.accessibleWeddings.length) {
      await loadWeddingById(state.accessibleWeddings[0].id);
    }
  }

  function renderWeddingList() {
    if (!els.weddingList) return;
    if (!state.accessibleWeddings.length) {
      setWeddingListState('Belum ada wedding yang terhubung dengan akun ini. Admin bisa load manual ID atau tambahkan UID/email akun ini ke dokumen wedding.');
      return;
    }

    els.weddingList.classList.remove('empty-state');
    els.weddingList.innerHTML = state.accessibleWeddings.map((item) => {
      const title = item.couple_title || item.meta_title || `${item.groom_short_name || item.groomName || 'Mempelai'} & ${item.bride_short_name || item.brideName || ''}`;
      const template = item.template_name || TEMPLATE_CATALOG[item.template_id]?.name || item.template_id || 'Template belum diset';
      const activeClass = item.id === state.currentWeddingId ? ' active' : '';
      return `
        <button class="wedding-item${activeClass}" type="button" data-id="${escapeHtml(item.id)}">
          <strong>${escapeHtml(item.id)}</strong>
          <span>${escapeHtml(title)} · ${escapeHtml(template)}</span>
        </button>
      `;
    }).join('');

    els.weddingList.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => loadWeddingById(button.dataset.id));
    });
  }

  function setWeddingListState(message) {
    if (!els.weddingList) return;
    els.weddingList.classList.add('empty-state');
    els.weddingList.innerHTML = escapeHtml(message);
  }

  async function loadWeddingById(weddingId) {
    const cleanId = (weddingId || '').trim();
    if (!cleanId) {
      showToast('Wedding ID belum diisi.');
      return;
    }

    state.currentWeddingId = cleanId;
    setValue('weddingIdInput', cleanId);
    setStatus('saveWeddingStatus', `Memuat ${cleanId}...`);

    try {
      const firestore = state.firebase.modules.firestore;
      const ref = firestore.doc(state.firebase.db, getCollectionName(), cleanId);
      const snap = await firestore.getDoc(ref);

      if (!snap.exists()) {
        const defaultData = getDefaultWeddingData(getTemplateIdFromWeddingId(cleanId));
        state.currentData = { id: cleanId, ...defaultData };
        fillForm(state.currentData);
        updateActiveWeddingHeader();
        resetStatsAndLists();
        setStatus('saveWeddingStatus', `Dokumen ${cleanId} belum ada. Isi data lalu klik Simpan Data untuk membuatnya.`, 'error');
        renderWeddingList();
        return;
      }

      state.currentData = { id: cleanId, ...snap.data() };
      fillForm(state.currentData);
      updateActiveWeddingHeader();
      await loadCollections(cleanId);
      setStatus('saveWeddingStatus', `${cleanId} berhasil dimuat.`, 'success');
      renderWeddingList();
    } catch (error) {
      console.error(error);
      setStatus('saveWeddingStatus', `Gagal memuat ${cleanId}. Cek akses Firestore Rules.`, 'error');
    }
  }

  function fillForm(data) {
    const templateId = data.template_id || data.template || getTemplateIdFromWeddingId(state.currentWeddingId);
    const templateInfo = TEMPLATE_CATALOG[templateId] || TEMPLATE_CATALOG.wedding_002;

    setValue('templateId', templateId);
    setValue('templateName', data.template_name || templateInfo.name);
    setValue('templatePath', data.template_path || templateInfo.path);
    setValue('linkTemplatePath', data.template_path || templateInfo.path);
    setValue('isActive', String(data.isActive !== false));
    setValue('metaTitle', data.meta_title || data.couple_title || '');
    setValue('metaDescription', data.meta_description || '');
    setValue('openingTitle', data.opening_title || 'Wedding Invitation');
    setValue('guestName', data.guest_name || data.guest_default_name || 'Bapak/Ibu/Saudara/i');
    setValue('weddingDateText', data.wedding_date_text || data.weddingDateText || data.weddingDate || '');
    setValue('weddingDatetime', toDatetimeLocal(data.wedding_datetime || data.event_date || data.eventDate));
    setValue('groomShortName', data.groom_short_name || data.groomName || '');
    setValue('brideShortName', data.bride_short_name || data.brideName || '');
    setValue('openingMessage', data.opening_message || '');
    setValue('heroDescription', data.hero_description || data.opening_text || '');
    setValue('openingPrayer', data.opening_prayer || '');
    setValue('groomName', data.groom_name || data.groomFullName || data.groom_full_name || '');
    setValue('brideName', data.bride_name || data.brideFullName || data.bride_full_name || '');
    setValue('groomBadge', data.groom_badge || '');
    setValue('brideBadge', data.bride_badge || '');
    setValue('groomPhotoUrl', data.groom_photo_url || data.groomPhoto || data.groomPhotoUrl || '');
    setValue('bridePhotoUrl', data.bride_photo_url || data.bridePhoto || data.bridePhotoUrl || '');
    setValue('groomParent', data.groom_parent || buildParentText('Putra', data.groomFather, data.groomMother) || '');
    setValue('brideParent', data.bride_parent || buildParentText('Putri', data.brideFather, data.brideMother) || '');
    setValue('coupleStory', data.couple_story || data.story || '');
    setValue('akadTitle', data.akad_title || 'Akad Nikah');
    setValue('receptionTitle', data.reception_title || 'Resepsi');
    setValue('mapUrl', data.map_url || data.mapsLink || '');
    setValue('phoneNumber', data.phone_number || data.phoneNumber || '');
    setValue('akadDetail', data.akad_detail || buildEventDetail(data.weddingDate, data.akadTime, data.akadLocation));
    setValue('receptionDetail', data.reception_detail || buildEventDetail(data.weddingDate, data.receptionTime, data.location));
    setValue('closingMessage', data.closing_message || '');
    setValue('giftBank1', data.gift_bank_1 || data.bankName1 || '');
    setValue('giftNumber1', data.gift_number_1 || data.bankNumber1 || '');
    setValue('giftName1', data.gift_name_1 || data.bankHolder1 || '');
    setValue('giftType1', data.gift_type_1 || 'Transfer Rekening');
    setValue('giftIcon1', data.gift_icon_1 || '💳');
    setValue('giftBank2', data.gift_bank_2 || data.bankName2 || '');
    setValue('giftNumber2', data.gift_number_2 || data.bankNumber2 || '');
    setValue('giftName2', data.gift_name_2 || data.bankHolder2 || '');
    setValue('giftType2', data.gift_type_2 || 'E-Wallet');
    setValue('giftIcon2', data.gift_icon_2 || '🎁');
    setValue('qrisImageUrl', data.qris_image_url || '');
    setValue('giftDescription', data.gift_description || '');
    setValue('qrisNote', data.qris_note || '');
    setValue('giftThanks', data.gift_thanks || '');
    setValue('musicUrl', data.music_url || data.musicUrl || '');
    setValue('closingCoupleNames', data.closing_couple_names || '');
    setValue('galleryImages', arrayToLines(normalizeGallery(data)));
    setValue('editorEmails', arrayToLines(data.editorEmails || []));
    setValue('editorUids', arrayToLines(data.editorUids || []));
    setValue('maxEditors', data.maxEditors || window.WEDDING_MAX_EDITORS || 2);
  }

  function collectFormData() {
    const templateId = getValue('templateId') || 'wedding_002';
    const templateInfo = TEMPLATE_CATALOG[templateId] || TEMPLATE_CATALOG.wedding_002;
    const editorEmails = linesToArray(getValue('editorEmails'));
    const editorUids = linesToArray(getValue('editorUids'));
    const maxEditors = Number(getValue('maxEditors')) || window.WEDDING_MAX_EDITORS || 2;

    if (state.user) {
      if (state.user.email && !editorEmails.includes(state.user.email)) editorEmails.unshift(state.user.email);
      if (!editorUids.includes(state.user.uid)) editorUids.unshift(state.user.uid);
    }

    if (editorEmails.length > maxEditors || editorUids.length > maxEditors) {
      throw new Error(`Maksimal ${maxEditors} editor per wedding. Kurangi email/UID editor terlebih dahulu.`);
    }

    const galleryImages = linesToArray(getValue('galleryImages'));
    const weddingDatetime = fromDatetimeLocal(getValue('weddingDatetime'));
    const groomShort = getValue('groomShortName');
    const brideShort = getValue('brideShortName');
    const groomName = getValue('groomName');
    const brideName = getValue('brideName');

    const data = {
      template_id: templateId,
      template: templateId,
      template_name: getValue('templateName') || templateInfo.name,
      template_path: getValue('templatePath') || templateInfo.path,
      isActive: getValue('isActive') !== 'false',
      meta_title: getValue('metaTitle') || `Undangan Pernikahan ${groomShort} & ${brideShort}`,
      meta_description: getValue('metaDescription'),
      opening_title: getValue('openingTitle'),
      guest_name: getValue('guestName') || 'Bapak/Ibu/Saudara/i',
      guest_default_name: getValue('guestName') || 'Bapak/Ibu/Saudara/i',
      wedding_date_text: getValue('weddingDateText'),
      wedding_datetime: weddingDatetime,
      event_date: weddingDatetime,
      groom_short_name: groomShort,
      bride_short_name: brideShort,
      opening_message: getValue('openingMessage'),
      hero_description: getValue('heroDescription'),
      opening_prayer: getValue('openingPrayer'),
      groom_name: groomName,
      bride_name: brideName,
      groom_badge: getValue('groomBadge'),
      bride_badge: getValue('brideBadge'),
      groom_photo_url: getValue('groomPhotoUrl'),
      bride_photo_url: getValue('bridePhotoUrl'),
      groom_parent: getValue('groomParent'),
      bride_parent: getValue('brideParent'),
      couple_story: getValue('coupleStory'),
      akad_title: getValue('akadTitle'),
      akad_detail: getValue('akadDetail'),
      reception_title: getValue('receptionTitle'),
      reception_detail: getValue('receptionDetail'),
      map_url: getValue('mapUrl'),
      phone_number: getValue('phoneNumber'),
      gift_bank_1: getValue('giftBank1'),
      gift_type_1: getValue('giftType1'),
      gift_icon_1: getValue('giftIcon1'),
      gift_number_1: getValue('giftNumber1'),
      gift_name_1: getValue('giftName1'),
      gift_bank_2: getValue('giftBank2'),
      gift_type_2: getValue('giftType2'),
      gift_icon_2: getValue('giftIcon2'),
      gift_number_2: getValue('giftNumber2'),
      gift_name_2: getValue('giftName2'),
      gift_description: getValue('giftDescription'),
      qris_image_url: getValue('qrisImageUrl'),
      qris_note: getValue('qrisNote'),
      gift_thanks: getValue('giftThanks'),
      gallery_images: galleryImages,
      music_url: getValue('musicUrl'),
      closing_message: getValue('closingMessage'),
      closing_couple_names: getValue('closingCoupleNames') || `${groomShort} & ${brideShort}`.toUpperCase(),
      editorEmails,
      editorUids,
      maxEditors,
      updatedAt: state.firebase.modules.firestore.serverTimestamp()
    };

    // Compatibility aliases untuk template wedding_001 / admin lama.
    Object.assign(data, {
      groomName: groomShort,
      brideName: brideShort,
      groomFullName: groomName,
      brideFullName: brideName,
      groomPhoto: data.groom_photo_url,
      bridePhoto: data.bride_photo_url,
      weddingDateText: data.wedding_date_text,
      eventDate: data.event_date,
      mapsLink: data.map_url,
      phoneNumber: data.phone_number,
      bankName1: data.gift_bank_1,
      bankNumber1: data.gift_number_1,
      bankHolder1: data.gift_name_1,
      bankName2: data.gift_bank_2,
      bankNumber2: data.gift_number_2,
      bankHolder2: data.gift_name_2,
      musicUrl: data.music_url,
      story: data.couple_story,
      gallery1: galleryImages[0] || '',
      gallery2: galleryImages[1] || '',
      gallery3: galleryImages[2] || '',
      gallery4: galleryImages[3] || ''
    });

    return data;
  }

  async function saveWeddingData() {
    if (!state.currentWeddingId) {
      showToast('Pilih wedding dulu sebelum menyimpan.');
      return;
    }

    setStatus('saveWeddingStatus', 'Menyimpan data...');
    try {
      const data = collectFormData();
      const firestore = state.firebase.modules.firestore;
      const ref = firestore.doc(state.firebase.db, getCollectionName(), state.currentWeddingId);
      await firestore.setDoc(ref, data, { merge: true });
      state.currentData = { id: state.currentWeddingId, ...state.currentData, ...data };
      updateActiveWeddingHeader();
      renderWeddingList();
      setStatus('saveWeddingStatus', 'Data wedding berhasil disimpan.', 'success');
      showToast('Data wedding berhasil disimpan ✨');
    } catch (error) {
      console.error(error);
      setStatus('saveWeddingStatus', error.message || 'Gagal menyimpan data wedding.', 'error');
    }
  }

  async function createWeddingData() {
    const newId = getValue('newWeddingId');
    const templateId = getValue('newTemplateId') || 'wedding_002';
    const editorEmail = getValue('newEditorEmail');

    if (!newId) {
      setStatus('createWeddingStatus', 'Wedding ID baru wajib diisi.', 'error');
      return;
    }

    setStatus('createWeddingStatus', `Membuat ${newId}...`);
    try {
      const firestore = state.firebase.modules.firestore;
      const ref = firestore.doc(state.firebase.db, getCollectionName(), newId);
      const exists = await firestore.getDoc(ref);
      if (exists.exists()) {
        setStatus('createWeddingStatus', `${newId} sudah ada. Gunakan ID lain.`, 'error');
        return;
      }

      const defaultData = getDefaultWeddingData(templateId);
      const editorEmails = [state.user?.email, editorEmail].filter(Boolean).filter(uniqueOnly).slice(0, 2);
      const editorUids = [state.user?.uid].filter(Boolean);
      const data = {
        ...defaultData,
        editorEmails,
        editorUids,
        maxEditors: window.WEDDING_MAX_EDITORS || 2,
        isActive: true,
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp()
      };

      await firestore.setDoc(ref, data, { merge: true });
      setStatus('createWeddingStatus', `${newId} berhasil dibuat.`, 'success');
      showToast(`${newId} berhasil dibuat ✨`);
      await loadAccessibleWeddings();
      await loadWeddingById(newId);
    } catch (error) {
      console.error(error);
      setStatus('createWeddingStatus', 'Gagal membuat data wedding. Cek Firestore Rules.', 'error');
    }
  }

  async function handleMediaUpload(input) {
    if (!state.currentWeddingId) {
      showToast('Load wedding dulu sebelum upload media.');
      input.value = '';
      return;
    }

    const file = input.files?.[0];
    if (!file) return;

    const field = input.dataset.field;
    const index = input.dataset.index !== undefined ? Number(input.dataset.index) : null;
    const fileName = input.dataset.name || safeFileName(file.name);

    const validation = validateMediaFile(file, field);
    if (!validation.ok) {
      setStatus('uploadStatus', validation.message, 'error');
      input.value = '';
      return;
    }

    const path = `weddings/${state.currentWeddingId}/media/${Date.now()}-${field}-${fileName}`;

    setStatus('uploadStatus', `Mengupload ${file.name}...`);
    try {
      const storageModule = state.firebase.modules.storage;
      const firestore = state.firebase.modules.firestore;
      const storageRef = storageModule.ref(state.firebase.storage, path);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          weddingId: state.currentWeddingId,
          field,
          index: index === null ? '' : String(index),
          uploadedBy: state.user?.uid || '',
          uploadedByEmail: state.user?.email || ''
        }
      };
      await storageModule.uploadBytes(storageRef, file, metadata);
      const downloadUrl = await storageModule.getDownloadURL(storageRef);

      const updateData = { updatedAt: firestore.serverTimestamp() };

      if (field === 'gallery_images') {
        const gallery = linesToArray(getValue('galleryImages'));
        gallery[index || 0] = downloadUrl;
        updateData.gallery_images = gallery;
        updateData[`gallery${(index || 0) + 1}`] = downloadUrl;
        setValue('galleryImages', arrayToLines(gallery));
        state.currentData.gallery_images = gallery;
      } else {
        updateData[field] = downloadUrl;
        updateLinkedMediaInput(field, downloadUrl);
        state.currentData[field] = downloadUrl;
      }

      const ref = firestore.doc(state.firebase.db, getCollectionName(), state.currentWeddingId);
      await firestore.setDoc(ref, updateData, { merge: true });
      setStatus('uploadStatus', 'Upload berhasil dan URL sudah disimpan.', 'success');
      showToast('Upload media berhasil ✨');
    } catch (error) {
      console.error(error);
      setStatus('uploadStatus', 'Upload gagal. Cek Storage Rules dan koneksi.', 'error');
    } finally {
      input.value = '';
    }
  }

  function updateLinkedMediaInput(field, url) {
    const map = {
      groom_photo_url: 'groomPhotoUrl',
      bride_photo_url: 'bridePhotoUrl',
      qris_image_url: 'qrisImageUrl',
      music_url: 'musicUrl'
    };
    if (map[field]) setValue(map[field], url);
  }

  function validateMediaFile(file, field) {
    const isAudioField = field === 'music_url';
    const isImageField = ['groom_photo_url', 'bride_photo_url', 'qris_image_url', 'gallery_images'].includes(field);
    const maxImageSize = 7 * 1024 * 1024;
    const maxAudioSize = 15 * 1024 * 1024;

    if (isImageField && !file.type.startsWith('image/')) {
      return { ok: false, message: 'File harus berupa gambar.' };
    }

    if (isAudioField && !file.type.startsWith('audio/')) {
      return { ok: false, message: 'File musik harus berupa audio.' };
    }

    if (isImageField && file.size > maxImageSize) {
      return { ok: false, message: 'Ukuran gambar maksimal 7MB.' };
    }

    if (isAudioField && file.size > maxAudioSize) {
      return { ok: false, message: 'Ukuran musik maksimal 15MB.' };
    }

    return { ok: true, message: '' };
  }

  async function loadCollections(weddingId) {
    const [rsvp, wishes, visitors] = await Promise.all([
      readSubcollection(weddingId, 'rsvp'),
      readSubcollection(weddingId, 'wishes'),
      readSubcollection(weddingId, 'visitors')
    ]);

    state.rsvpRows = rsvp;
    renderRsvp(rsvp);
    renderWishes(wishes);
    renderVisitors(visitors);
    updateStats({ rsvp, wishes, visitors });
  }

  async function readSubcollection(weddingId, subcollectionName) {
    try {
      const firestore = state.firebase.modules.firestore;
      const ref = firestore.collection(state.firebase.db, getCollectionName(), weddingId, subcollectionName);
      const snap = await firestore.getDocs(ref);
      return snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => getSortableTime(b) - getSortableTime(a));
    } catch (error) {
      console.warn(`Gagal membaca ${subcollectionName}`, error);
      return [];
    }
  }

  function renderRsvp(rows = []) {
    if (!els.rsvpTable) return;
    if (!rows.length) {
      els.rsvpTable.innerHTML = '<tr><td colspan="6">Belum ada data RSVP.</td></tr>';
      return;
    }

    els.rsvpTable.innerHTML = rows.map((item) => {
      const name = item.name || item.nama || item.guestName || '-';
      const hadir = item.attendance || item.hadir || item.status || '-';
      const count = item.count || item.jumlah || item.totalGuest || item.guestCount || '-';
      const phone = item.phone || item.wa || item.whatsapp || item.phoneNumber || '-';
      const note = item.note || item.catatan || item.message || '-';
      const source = item.source || item.from || '-';
      return `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(hadir)}</td><td>${escapeHtml(count)}</td><td>${escapeHtml(phone)}</td><td>${escapeHtml(note)}</td><td>${escapeHtml(source)}</td></tr>`;
    }).join('');
  }

  function renderWishes(rows = []) {
    if (!els.wishesList) return;
    if (!rows.length) {
      els.wishesList.classList.add('empty-state');
      els.wishesList.innerHTML = 'Belum ada ucapan.';
      return;
    }

    els.wishesList.classList.remove('empty-state');
    els.wishesList.innerHTML = rows.slice(0, 30).map((item) => {
      const name = item.name || item.nama || item.guestName || 'Tamu';
      const message = item.message || item.ucapan || item.wish || '-';
      return `<article class="list-item"><strong>${escapeHtml(name)}</strong><p>${escapeHtml(message)}</p><small>${escapeHtml(formatDate(item.createdAt || item.timestamp))}</small></article>`;
    }).join('');
  }

  function renderVisitors(rows = []) {
    if (!els.visitorsList) return;
    if (!rows.length) {
      els.visitorsList.classList.add('empty-state');
      els.visitorsList.innerHTML = 'Belum ada visitor.';
      return;
    }

    els.visitorsList.classList.remove('empty-state');
    els.visitorsList.innerHTML = rows.slice(0, 30).map((item) => {
      const name = item.name || item.guestName || item.to || 'Visitor';
      const source = item.source || item.userAgent || item.referrer || '-';
      return `<article class="list-item"><strong>${escapeHtml(name)}</strong><p>${escapeHtml(source)}</p><small>${escapeHtml(formatDate(item.createdAt || item.timestamp || item.visitedAt))}</small></article>`;
    }).join('');
  }

  function updateStats({ rsvp = [], wishes = [], visitors = [] }) {
    setText('totalVisitors', visitors.length);
    setText('totalRsvp', rsvp.length);
    setText('totalWishes', wishes.length);
    const hadirCount = rsvp.filter((item) => {
      const value = String(item.attendance || item.hadir || item.status || '').toLowerCase();
      return item.hadir === true || value.includes('hadir') || value === 'yes' || value === 'true';
    }).length;
    setText('totalHadir', hadirCount);
  }

  function resetStatsAndLists() {
    updateStats({ rsvp: [], wishes: [], visitors: [] });
    renderRsvp([]);
    renderWishes([]);
    renderVisitors([]);
  }

  function exportRsvpCsv() {
    if (!state.rsvpRows.length) {
      showToast('Belum ada data RSVP untuk diexport.');
      return;
    }

    const headers = ['Nama', 'Hadir', 'Jumlah', 'WA', 'Catatan', 'Source', 'Waktu'];
    const rows = state.rsvpRows.map((item) => [
      item.name || item.nama || item.guestName || '',
      item.attendance || item.hadir || item.status || '',
      item.count || item.jumlah || item.totalGuest || item.guestCount || '',
      item.phone || item.wa || item.whatsapp || item.phoneNumber || '',
      item.note || item.catatan || item.message || '',
      item.source || item.from || '',
      formatDate(item.createdAt || item.timestamp)
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.currentWeddingId || 'wedding'}-rsvp.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function generateGuestLink() {
    if (!state.currentWeddingId) {
      showToast('Load wedding dulu untuk generate link.');
      return;
    }
    const guestName = getValue('guestInput') || 'Bapak/Ibu/Saudara/i';
    const path = getValue('linkTemplatePath') || getValue('templatePath') || getTemplatePath();
    const url = buildUrl(path, state.currentWeddingId, guestName);
    setValue('guestLinkOutput', url);
    showToast('Link tamu berhasil dibuat ✨');
  }

  function updateActiveWeddingHeader() {
    const data = state.currentData || {};
    const title = data.couple_title || data.meta_title || `${data.groom_short_name || data.groomName || 'Wedding'} & ${data.bride_short_name || data.brideName || ''}`;
    const template = data.template_name || TEMPLATE_CATALOG[data.template_id]?.name || data.template_id || 'Template belum diset';
    setText('activeWeddingTitle', `${state.currentWeddingId} · ${title}`);
    setText('activeWeddingSubtitle', `${template} · ${data.isActive === false ? 'Nonaktif' : 'Aktif'}`);

    const path = data.template_path || getValue('templatePath') || getTemplatePath();
    const preview = buildUrl(path, state.currentWeddingId, 'Preview Admin');
    if (els.previewWeddingBtn) els.previewWeddingBtn.href = preview;
    setValue('linkTemplatePath', path);
  }

  function applyTemplateChoice(templateId) {
    const item = TEMPLATE_CATALOG[templateId] || TEMPLATE_CATALOG.wedding_002;
    setValue('templateName', item.name);
    setValue('templatePath', item.path);
    setValue('linkTemplatePath', item.path);
  }

  function suggestNewWeddingId() {
    if (getValue('newWeddingId')) return;
    const templateId = getValue('newTemplateId') || 'wedding_002';
    setValue('newWeddingId', templateId === 'wedding_002' ? 'wedding_015' : 'wedding_014');
  }

  function getDefaultWeddingData(templateId = 'wedding_002') {
    const item = TEMPLATE_CATALOG[templateId] || TEMPLATE_CATALOG.wedding_002;
    const isDark = templateId === 'wedding_002';
    return {
      template_id: item.id,
      template: item.id,
      template_name: item.name,
      template_path: item.path,
      meta_title: isDark ? 'Undangan Pernikahan Romeo & Juliet' : 'Undangan Pernikahan',
      meta_description: 'Undangan pernikahan digital.',
      opening_title: 'Wedding Invitation',
      guest_name: 'Bapak/Ibu/Saudara/i',
      opening_message: 'Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di hari bahagia kami.',
      groom_short_name: 'Romeo',
      bride_short_name: 'Juliet',
      groom_name: 'Romeo Pratama',
      bride_name: 'Juliet Amelia',
      wedding_date_text: 'Sabtu, 10 Oktober 2026',
      wedding_datetime: '2026-10-10T09:00:00+07:00',
      hero_description: 'Dua hati yang Allah pertemukan, satu janji suci untuk berjalan bersama dalam cinta, doa, dan keberkahan.',
      akad_title: 'Akad Nikah',
      akad_detail: 'Sabtu, 10 Oktober 2026<br>09.00 WIB - Selesai<br><strong>Gedung Estetik Nusantara</strong>',
      reception_title: 'Resepsi',
      reception_detail: 'Sabtu, 10 Oktober 2026<br>11.00 WIB - Selesai<br>Jl. Bahagia Bersama No. 10, Medan',
      map_url: 'https://maps.google.com',
      gift_bank_1: 'Bank BCA',
      gift_type_1: 'Transfer Rekening',
      gift_icon_1: '💳',
      gift_number_1: '1234567890',
      gift_name_1: 'a.n. Romeo Pratama',
      gift_bank_2: 'DANA / GoPay',
      gift_type_2: 'E-Wallet',
      gift_icon_2: '🎁',
      gift_number_2: '081234567890',
      gift_name_2: 'a.n. Juliet Amelia',
      gallery_images: [],
      music_url: '',
      isActive: true
    };
  }

  function getTemplateIdFromWeddingId(weddingId = '') {
    if (TEMPLATE_CATALOG[weddingId]) return weddingId;
    return window.WEDDING_DEFAULT_ID || 'wedding_002';
  }

  function getTemplatePath() {
    const templateId = getValue('templateId') || state.currentData?.template_id || 'wedding_002';
    return TEMPLATE_CATALOG[templateId]?.path || TEMPLATE_CATALOG.wedding_002.path;
  }

  function getCollectionName() {
    return state.firebase?.settings?.collectionName || window.WEDDING_COLLECTION || 'weddings';
  }

  function activateTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
  }

  function buildUrl(path, weddingId, guestName) {
    const basePath = path || '/weddings/wedding_002/index.html';
    const url = new URL(basePath, window.location.origin || window.location.href);
    url.searchParams.set('id', weddingId);
    if (guestName) url.searchParams.set('to', guestName);
    return url.toString();
  }

  function toDatetimeLocal(value) {
    if (!value) return '';
    const stringValue = String(value);
    const match = stringValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (match) return `${match[1]}T${match[2]}`;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function fromDatetimeLocal(value) {
    if (!value) return '';
    if (/([+-]\d{2}:\d{2}|Z)$/.test(value)) return value;
    return `${value}:00+07:00`;
  }

  function normalizeGallery(data = {}) {
    if (Array.isArray(data.gallery_images)) return data.gallery_images.map((item) => typeof item === 'string' ? item : item.url).filter(Boolean);
    return [data.gallery1, data.gallery2, data.gallery3, data.gallery4, data.gallery5, data.gallery6].filter(Boolean);
  }

  function buildParentText(prefix, father, mother) {
    if (!father && !mother) return '';
    return `${prefix} dari<br>${father || 'Bapak ...'} & ${mother || 'Ibu ...'}`;
  }

  function buildEventDetail(date, time, location) {
    if (!date && !time && !location) return '';
    return [date, time, location ? `<strong>${location}</strong>` : ''].filter(Boolean).join('<br>');
  }

  function getSortableTime(item) {
    const value = item.createdAt || item.timestamp || item.visitedAt || item.time;
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function formatDate(value) {
    if (!value) return '-';
    let date;
    if (value.toDate) date = value.toDate();
    else if (value.seconds) date = new Date(value.seconds * 1000);
    else date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function getValue(id) {
    return els[id]?.value?.trim() || '';
  }

  function setValue(id, value) {
    if (!els[id]) return;
    els[id].value = value ?? '';
  }

  function setText(id, value) {
    if (!els[id]) return;
    els[id].textContent = value ?? '';
  }

  function setStatus(id, message, type = '') {
    if (!els[id]) return;
    els[id].textContent = message || '';
    els[id].classList.remove('error', 'success');
    if (type) els[id].classList.add(type);
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  async function copyText(text, successMessage = 'Berhasil disalin') {
    if (!text) {
      showToast('Tidak ada teks untuk disalin.');
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      showToast(successMessage);
    } catch (error) {
      fallbackCopy(text);
      showToast(successMessage);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function linesToArray(value) {
    return String(value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(uniqueOnly);
  }

  function arrayToLines(value) {
    return Array.isArray(value) ? value.filter(Boolean).join('\n') : '';
  }

  function uniqueOnly(value, index, array) {
    return array.indexOf(value) === index;
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function safeFileName(name = 'file') {
    return String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFriendlyAuthError(error) {
    const code = error?.code || '';
    const message = error?.message || '';

    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
      return 'Email atau password salah. Cek kembali akun Firebase Auth-nya.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'Akun tidak ditemukan di Firebase Authentication.';
    }
    if (code.includes('auth/operation-not-allowed')) {
      return 'Login Email/Password belum diaktifkan di Firebase Authentication > Sign-in method.';
    }
    if (code.includes('auth/unauthorized-domain')) {
      return 'Domain website belum diizinkan di Firebase Auth. Tambahkan domain ini di Authentication > Settings > Authorized domains.';
    }
    if (code.includes('auth/network-request-failed')) {
      return 'Koneksi ke Firebase gagal. Cek internet, domain, atau adblock/browser protection.';
    }
    if (code.includes('auth/too-many-requests')) {
      return 'Terlalu banyak percobaan login. Coba lagi nanti atau reset password dari Firebase.';
    }

    return `Login gagal (${code || 'tanpa kode'}). ${message || 'Cek Console browser untuk detail.'}`;
  }
})();
