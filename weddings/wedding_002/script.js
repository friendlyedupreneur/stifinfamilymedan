/*
 * Dark Luxury Cinematic Wedding Invitation
 * Final reusable script.js
 *
 * Default Firestore path:
 * weddings/wedding_002
 *
 * URL examples:
 * index.html?id=wedding_002&to=Bapak%20Ahmad
 * index.html?id=wedding_003&to=Keluarga%20Besar
 */

(() => {
    'use strict';

    const DEFAULT_WEDDING_ID = 'wedding_002';
    const DEFAULT_COLLECTION = 'weddings';
    const FIREBASE_VERSION = '12.0.0';

    const DEFAULT_WEDDING_DATA = {
        meta_title: 'Undangan Pernikahan Romeo & Juliet',
        meta_description: 'Undangan Pernikahan Romeo & Juliet - Dua hati, satu janji, satu perjalanan baru.',

        opening_title: 'Wedding Invitation',
        guest_name: 'Bapak/Ibu/Saudara/i',
        opening_message: 'Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir di hari bahagia kami.',

        hero_subtitle: 'The Wedding Of',
        groom_short_name: 'Romeo',
        bride_short_name: 'Juliet',
        wedding_date_text: 'Sabtu, 10 Oktober 2026',
        wedding_datetime: '2026-10-10T09:00:00+07:00',
        hero_description: 'Dua hati yang Allah pertemukan, dua karakter yang saling melengkapi, dan satu janji suci untuk berjalan bersama dalam cinta, doa, dan keberkahan.',

        bismillah_text: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
        prayer_subtitle: 'Dengan Penuh Syukur',
        opening_prayer: 'Assalamu’alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat dan ridha Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami. Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
        quran_quote: '“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup agar kamu merasa tenteram kepadanya.”',
        quran_source: 'QS. Ar-Rum: 21',

        couple_subtitle: 'Mempelai',
        couple_section_title: 'Dua Hati',
        couple_intro: 'Dengan izin Allah, kami melangkah menuju babak baru kehidupan.',
        groom_name: 'Romeo',
        groom_badge: 'Ti • Penjaga Arah',
        groom_parent: 'Putra dari<br>Bapak Lorem & Ibu Ipsum',
        groom_photo_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=180',
        bride_name: 'Juliet',
        bride_badge: 'Fe • Penjaga Rasa',
        bride_parent: 'Putri dari<br>Bapak Dolor & Ibu Sit',
        bride_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=180',
        couple_story: 'Romeo hadir dengan ketenangan berpikir dan keteguhan arah. Juliet hadir dengan kelembutan rasa dan kehangatan yang menyatukan. Dalam perbedaan itulah, kami menemukan cara untuk saling menjaga, saling menguatkan, dan saling pulang.',

        gallery_subtitle: 'Our Beautiful Moments',
        gallery_title: 'Jejak Kisah Kami',
        gallery_description: 'Beberapa momen sederhana yang menjadi bagian dari perjalanan kami menuju hari bahagia.',
        gallery_images: [
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1519225424756-32d43fa58a4d?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=400'
        ],

        date_subtitle: 'Save The Date',
        date_title: 'Hari Bahagia',
        date_description: 'Menghitung hari menuju momen sakral yang insyaAllah menjadi awal perjalanan kami.',
        akad_title: 'Akad Nikah',
        akad_detail: 'Sabtu, 10 Oktober 2026<br>09.00 WIB - Selesai<br><strong>Gedung Estetik Nusantara</strong>',
        reception_title: 'Resepsi',
        reception_detail: 'Sabtu, 10 Oktober 2026<br>11.00 WIB - Selesai<br>Jl. Bahagia Bersama No. 10, Medan',
        map_url: 'https://maps.google.com',

        gift_subtitle: 'Wedding Gift',
        gift_title: 'Amplop Digital',
        gift_description: 'Doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami. Namun apabila berkenan memberikan tanda kasih, dapat disampaikan melalui amplop digital berikut.',
        gift_bank_1: 'Bank BCA',
        gift_type_1: 'Transfer Rekening',
        gift_icon_1: '💳',
        gift_number_1: '1234567890',
        gift_name_1: 'a.n. Romeo Pratama',
        gift_bank_2: 'DANA / GoPay',
        gift_type_2: 'E-Wallet',
        gift_icon_2: '🎁',
        gift_number_2: '0812 3456 7890',
        gift_name_2: 'a.n. Juliet Amelia',
        gift_accounts: [],
        qris_image_url: '',
        qris_note: 'Ganti kotak ini dengan gambar QRIS asli jika ingin menerima tanda kasih melalui scan QR.',
        gift_thanks: 'Terima kasih atas setiap doa, perhatian, dan tanda kasih yang diberikan. Semoga Allah membalas dengan keberkahan yang berlipat.',

        wishes_subtitle: 'Wedding Wishes',
        wishes_title: 'Doa & Ucapan',
        wishes_arabic: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
        wishes_prayer_translation: '“Semoga Allah memberkahi kalian, melimpahkan keberkahan atas kalian, dan mempertemukan kalian berdua dalam kebaikan.”',
        wish_name_placeholder: 'Nama Anda',
        wish_message_placeholder: 'Tulis doa dan ucapan terbaik...',
        wish_button_text: 'Kirim Ucapan',

        closing_title: 'Terima Kasih',
        closing_message: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
        closing_couple_names: 'ROMEO & JULIET',

        music_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    };

    const HTML_FIELD_KEYS = new Set([
        'groom_parent',
        'bride_parent',
        'akad_detail',
        'reception_detail',
        'opening_prayer',
        'gift_description',
        'gift_thanks',
        'closing_message'
    ]);

    const state = {
        weddingId: DEFAULT_WEDDING_ID,
        collectionName: DEFAULT_COLLECTION,
        data: { ...DEFAULT_WEDDING_DATA },
        firebase: null,
        holdTimer: null,
        progressVal: 0,
        isHolding: false,
        isUnlocked: false,
        isMusicPlaying: false,
        countdownTimer: null,
        canvasStarted: false,
        observer: null
    };

    const maxCirc = 377;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const els = {};

    function cacheElements() {
        els.scanBtn = document.getElementById('scanBtn');
        els.scanProgress = document.getElementById('scanProgress');
        els.authText = document.getElementById('authText');
        els.bgMusic = document.getElementById('bgMusic');
        els.bgMusicSource = document.getElementById('bgMusicSource');
        els.musicBtn = document.getElementById('musicBtn');
        els.gatekeeper = document.getElementById('gatekeeper');
        els.mainApp = document.getElementById('mainApp');
        els.canvas = document.getElementById('dualityCanvas');
        els.giftToast = document.getElementById('giftToast');
        els.openLocationBtn = document.getElementById('openLocationBtn');
        els.wishForm = document.getElementById('wishForm');
        els.galleryTrack = document.getElementById('galleryTrack');
        els.giftStack = document.getElementById('giftStack');
        els.qrisImage = document.getElementById('qrisImage');
        els.qrisPlaceholder = document.getElementById('qrisPlaceholder');
    }

    function decodeQueryValue(value) {
        if (!value) return '';

        try {
            return decodeURIComponent(value.replace(/\+/g, ' ')).trim();
        } catch (error) {
            return value.replace(/\+/g, ' ').trim();
        }
    }

    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            weddingId: params.get('id') || state.weddingId,
            guestName: decodeQueryValue(params.get('to') || '')
        };
    }

    function normalizeString(value, fallback = '') {
        if (value === undefined || value === null) return fallback;
        return String(value);
    }

    function escapeHtml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value = '') {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    function sanitizeLimitedHtml(value = '') {
        return escapeHtml(value)
            .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
            .replace(/&lt;strong&gt;/gi, '<strong>')
            .replace(/&lt;\/strong&gt;/gi, '</strong>')
            .replace(/&lt;em&gt;/gi, '<em>')
            .replace(/&lt;\/em&gt;/gi, '</em>');
    }

    function mergeData(defaultData, remoteData = {}) {
        return {
            ...defaultData,
            ...remoteData
        };
    }

    async function initFirebaseIfNeeded() {
        if (!window.WEDDING_FIREBASE_ENABLED || !window.firebaseConfig) {
            return null;
        }

        try {
            const firebaseApp = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
            const firestore = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);

            const app = firebaseApp.getApps().length
                ? firebaseApp.getApp()
                : firebaseApp.initializeApp(window.firebaseConfig);

            const db = firestore.getFirestore(app);
            const collectionName = window.WEDDING_COLLECTION || DEFAULT_COLLECTION;

            state.firebase = {
                db,
                collectionName,
                collection: firestore.collection,
                doc: firestore.doc,
                getDoc: firestore.getDoc,
                addDoc: firestore.addDoc,
                serverTimestamp: firestore.serverTimestamp
            };

            state.collectionName = collectionName;
            return state.firebase;
        } catch (error) {
            console.warn('Firebase belum aktif atau gagal diinisialisasi. Template memakai data default.', error);
            state.firebase = null;
            return null;
        }
    }

    async function fetchWeddingDocument(weddingId) {
        if (!state.firebase) return null;

        try {
            const docRef = state.firebase.doc(
                state.firebase.db,
                state.firebase.collectionName,
                weddingId
            );
            const snapshot = await state.firebase.getDoc(docRef);

            if (!snapshot.exists()) {
                console.warn(`Dokumen ${state.firebase.collectionName}/${weddingId} belum ada. Template memakai data default.`);
                return null;
            }

            return snapshot.data();
        } catch (error) {
            console.warn('Gagal mengambil data undangan dari Firestore. Template memakai data default.', error);
            return null;
        }
    }

    async function loadWeddingData() {
        const { weddingId, guestName } = getQueryParams();
        state.weddingId = weddingId || DEFAULT_WEDDING_ID;

        let weddingData = { ...DEFAULT_WEDDING_DATA };

        await initFirebaseIfNeeded();

        const remoteData = await fetchWeddingDocument(state.weddingId);
        if (remoteData) {
            weddingData = mergeData(weddingData, remoteData);
        }

        if (guestName) {
            weddingData.guest_name = guestName;
        }

        state.data = weddingData;
        return weddingData;
    }

    function applyTextField(element, value, key) {
        if (value === undefined || value === null) return;

        if (HTML_FIELD_KEYS.has(key)) {
            element.innerHTML = sanitizeLimitedHtml(value);
            return;
        }

        element.textContent = normalizeString(value);
    }

    function applyTemplateData(data) {
        document.title = data.meta_title || DEFAULT_WEDDING_DATA.meta_title;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && data.meta_description) {
            metaDescription.setAttribute('content', normalizeString(data.meta_description));
        }

        document.querySelectorAll('[data-field]').forEach((element) => {
            const key = element.getAttribute('data-field');
            applyTextField(element, data[key], key);
        });

        document.querySelectorAll('[data-placeholder-field]').forEach((element) => {
            const key = element.getAttribute('data-placeholder-field');
            if (data[key] !== undefined && data[key] !== null) {
                element.setAttribute('placeholder', normalizeString(data[key]));
            }
        });

        document.querySelectorAll('[data-src-field]').forEach((element) => {
            const key = element.getAttribute('data-src-field');
            const url = normalizeString(data[key]).trim();
            if (url) {
                element.setAttribute('src', url);
            }
        });

        if (data.music_url && els.bgMusic) {
            els.bgMusic.load();
        }

        renderGallery(data.gallery_images);
        renderGiftAccounts(data.gift_accounts);
        toggleQrisImage(data.qris_image_url);
        startCountdown(data.wedding_datetime);
    }

    function renderGallery(images = []) {
        if (!els.galleryTrack || !Array.isArray(images) || images.length === 0) return;

        const visibleImages = images
            .map((item, index) => {
                if (typeof item === 'string') {
                    return {
                        url: item,
                        alt: `Momen pernikahan ${index + 1}`
                    };
                }

                return {
                    url: item?.url || item?.src || '',
                    alt: item?.alt || `Momen pernikahan ${index + 1}`
                };
            })
            .filter((item) => item.url);

        if (visibleImages.length === 0) return;

        const doubledImages = [...visibleImages, ...visibleImages];
        els.galleryTrack.innerHTML = doubledImages.map((item) => (
            `<img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.alt)}" loading="lazy">`
        )).join('');
    }

    function normalizeGiftAccounts(accounts) {
        if (Array.isArray(accounts) && accounts.length > 0) {
            return accounts
                .map((account, index) => ({
                    bank: normalizeString(account.bank || account.bankName || account.name || `Rekening ${index + 1}`).trim(),
                    type: normalizeString(account.type || account.label || 'Transfer').trim(),
                    icon: normalizeString(account.icon || '💳').trim(),
                    number: normalizeString(account.number || account.accountNumber || account.value || '').trim(),
                    accountName: normalizeString(account.accountName || account.owner || account.holder || '').trim(),
                    copyLabel: normalizeString(account.copyLabel || 'Salin Nomor').trim()
                }))
                .filter((account) => account.number);
        }

        return [];
    }

    function renderGiftAccounts(accounts = []) {
        const normalizedAccounts = normalizeGiftAccounts(accounts);
        if (!els.giftStack || normalizedAccounts.length === 0) return;

        els.giftStack.innerHTML = normalizedAccounts.map((account, index) => {
            const targetId = `giftAccount${index + 1}`;

            return `
                <article class="gift-card">
                    <div class="gift-head">
                        <div>
                            <div class="gift-bank">${escapeHtml(account.bank)}</div>
                            <div class="gift-type">${escapeHtml(account.type)}</div>
                        </div>
                        <div class="gift-icon">${escapeHtml(account.icon)}</div>
                    </div>
                    <div class="gift-number" id="${targetId}">${escapeHtml(account.number)}</div>
                    <div class="gift-name">${escapeHtml(account.accountName)}</div>
                    <button class="btn-copy" type="button" data-copy-target="${targetId}">${escapeHtml(account.copyLabel)}</button>
                </article>
            `;
        }).join('');

        bindCopyButtons();
    }

    function toggleQrisImage(imageUrl) {
        if (!els.qrisImage || !els.qrisPlaceholder) return;

        const cleanUrl = normalizeString(imageUrl).trim();
        if (!cleanUrl) {
            els.qrisImage.classList.add('is-hidden');
            els.qrisPlaceholder.classList.remove('is-hidden');
            return;
        }

        els.qrisImage.setAttribute('src', cleanUrl);
        els.qrisImage.classList.remove('is-hidden');
        els.qrisPlaceholder.classList.add('is-hidden');
    }

    function setAuthText(main, hint = '') {
        if (!els.authText) return;

        els.authText.innerHTML = `${escapeHtml(main)}${hint ? `<br><span class="opening-hint">${escapeHtml(hint)}</span>` : ''}`;
    }

    function startAuth(event) {
        if (state.isUnlocked || state.isHolding || !els.scanBtn || !els.scanProgress) return;
        event.preventDefault();

        state.isHolding = true;
        els.scanBtn.classList.add('holding');
        setAuthText('Membuka Undangan...', 'Menyiapkan momen bahagia');
        if (els.authText) els.authText.style.color = 'var(--gold)';

        state.holdTimer = window.setInterval(() => {
            state.progressVal += reducedMotion ? 8 : 1.2;
            const offset = maxCirc - (state.progressVal / 100) * maxCirc;
            els.scanProgress.style.strokeDashoffset = Math.max(offset, 0);

            if (state.progressVal >= 100) {
                window.clearInterval(state.holdTimer);
                unlockInvitation();
            }
        }, reducedMotion ? 30 : 20);
    }

    function stopAuth() {
        if (state.isUnlocked) return;

        window.clearInterval(state.holdTimer);
        state.isHolding = false;

        if (state.progressVal < 100) {
            state.progressVal = 0;
            if (els.scanProgress) els.scanProgress.style.strokeDashoffset = maxCirc;
            if (els.scanBtn) els.scanBtn.classList.remove('holding');
            setAuthText('Buka Undangan', 'Tekan & Tahan');
            if (els.authText) els.authText.style.color = '#9a9389';
        }
    }

    function unlockInvitation() {
        if (state.isUnlocked) return;
        state.isUnlocked = true;
        state.isHolding = false;

        setAuthText('Selamat Datang');

        if (els.scanBtn) {
            els.scanBtn.style.transform = 'scale(1.2)';
            els.scanBtn.style.opacity = '0';
        }

        window.setTimeout(() => {
            if (els.gatekeeper) {
                els.gatekeeper.style.opacity = '0';
                els.gatekeeper.style.visibility = 'hidden';
            }

            if (els.mainApp) els.mainApp.classList.add('active');
            if (els.canvas) els.canvas.classList.add('active');
            if (els.musicBtn) els.musicBtn.classList.add('show');

            document.body.classList.add('trees-active');
            playMusic();
            initDualityCanvas();
        }, 800);
    }

    function playMusic() {
        if (!els.bgMusic) return;

        els.bgMusic.play().then(() => {
            state.isMusicPlaying = true;
            if (els.musicBtn) els.musicBtn.classList.remove('paused');
        }).catch(() => {
            state.isMusicPlaying = false;
            if (els.musicBtn) els.musicBtn.classList.add('paused');
        });
    }

    function toggleMusic() {
        if (!els.bgMusic) return;

        if (state.isMusicPlaying) {
            els.bgMusic.pause();
            state.isMusicPlaying = false;
            if (els.musicBtn) els.musicBtn.classList.add('paused');
            return;
        }

        els.bgMusic.play().then(() => {
            state.isMusicPlaying = true;
            if (els.musicBtn) els.musicBtn.classList.remove('paused');
        }).catch(() => {
            state.isMusicPlaying = false;
            if (els.musicBtn) els.musicBtn.classList.add('paused');
        });
    }

    function initDualityCanvas() {
        if (state.canvasStarted || reducedMotion || !els.canvas) return;
        state.canvasStarted = true;

        const canvas = els.canvas;
        const ctx = canvas.getContext('2d');
        const particles = [];
        const particlePairs = window.innerWidth < 420 ? 20 : 30;

        function resize() {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(window.innerWidth * ratio);
            canvas.height = Math.floor(window.innerHeight * ratio);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        class Particle {
            constructor(type) {
                this.type = type;
                this.radius = Math.random() * 2 + 1;
                this.resetPosition();
            }

            resetPosition() {
                if (this.type === 'ti') {
                    this.x = Math.random() * (window.innerWidth / 2);
                    this.vx = Math.random() * 0.5 + 0.1;
                    this.color = 'rgba(139, 184, 214, 0.58)';
                } else {
                    this.x = (window.innerWidth / 2) + Math.random() * (window.innerWidth / 2);
                    this.vx = -(Math.random() * 0.5 + 0.1);
                    this.color = 'rgba(226, 163, 154, 0.58)';
                }

                this.y = Math.random() * window.innerHeight;
                this.vy = (Math.random() - 0.5) * 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.type === 'ti' && this.x > window.innerWidth) this.x = 0;
                if (this.type === 'fe' && this.x < 0) this.x = window.innerWidth;
                if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                const radius = this.type === 'fe' ? this.radius * 1.5 : this.radius;
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        function drawLines(index) {
            for (let j = index + 1; j < particles.length; j += 1) {
                const dx = particles[index].x - particles[j].x;
                const dy = particles[index].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 80) {
                    ctx.beginPath();

                    if (particles[index].type === particles[j].type) {
                        ctx.strokeStyle = particles[index].type === 'ti'
                            ? `rgba(139, 184, 214, ${1 - dist / 80})`
                            : `rgba(226, 163, 154, ${1 - dist / 80})`;
                    } else {
                        ctx.strokeStyle = `rgba(223, 184, 91, ${1 - dist / 80})`;
                    }

                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[index].x, particles[index].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            particles.forEach((particle, index) => {
                particle.update();
                particle.draw();
                drawLines(index);
            });

            window.requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();

        for (let i = 0; i < particlePairs; i += 1) {
            particles.push(new Particle('ti'));
            particles.push(new Particle('fe'));
        }

        animate();
    }

    function showToast(message) {
        if (!els.giftToast) return;

        els.giftToast.textContent = message;
        els.giftToast.classList.add('show');
        window.clearTimeout(window.giftToastTimer);
        window.giftToastTimer = window.setTimeout(() => {
            els.giftToast.classList.remove('show');
        }, 1800);
    }

    async function copyTextToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const tempInput = document.createElement('input');
        tempInput.value = text;
        tempInput.setAttribute('readonly', '');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }

    async function handleCopyButton(button) {
        const targetId = button.getAttribute('data-copy-target');
        const target = document.getElementById(targetId);
        if (!target) return;

        const cleanValue = target.textContent.replace(/\s/g, '').trim();
        const originalText = button.textContent;

        try {
            await copyTextToClipboard(cleanValue);
            button.textContent = 'Berhasil Disalin';
            showToast('Nomor berhasil disalin ✨');
        } catch (error) {
            console.warn('Gagal menyalin nomor.', error);
            showToast('Gagal menyalin nomor');
        } finally {
            window.setTimeout(() => {
                button.textContent = originalText;
            }, 1600);
        }
    }

    function bindCopyButtons() {
        document.querySelectorAll('[data-copy-target]').forEach((button) => {
            if (button.dataset.copyBound === 'true') return;
            button.dataset.copyBound = 'true';
            button.addEventListener('click', () => handleCopyButton(button));
        });
    }

    function startCountdown(dateValue) {
        const destination = new Date(dateValue).getTime();
        if (Number.isNaN(destination)) return;

        const dayEl = document.getElementById('d');
        const hourEl = document.getElementById('h');
        const minuteEl = document.getElementById('m');
        const secondEl = document.getElementById('s');

        if (!dayEl || !hourEl || !minuteEl || !secondEl) return;

        function updateCountdown() {
            const diff = destination - Date.now();

            if (diff <= 0) {
                dayEl.textContent = '00';
                hourEl.textContent = '00';
                minuteEl.textContent = '00';
                secondEl.textContent = '00';
                window.clearInterval(state.countdownTimer);
                return;
            }

            dayEl.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
            hourEl.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
            minuteEl.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
            secondEl.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        }

        window.clearInterval(state.countdownTimer);
        updateCountdown();
        state.countdownTimer = window.setInterval(updateCountdown, 1000);
    }

    function initObserver() {
        const animatedElements = document.querySelectorAll('.observe-fade');

        if (!('IntersectionObserver' in window) || reducedMotion) {
            animatedElements.forEach((element) => element.classList.add('in-view'));
            return;
        }

        state.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    state.observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        animatedElements.forEach((element) => state.observer.observe(element));
    }

    async function submitWish(payload) {
        if (!state.firebase) return false;

        const wishesRef = state.firebase.collection(
            state.firebase.db,
            state.firebase.collectionName,
            state.weddingId,
            'wishes'
        );

        await state.firebase.addDoc(wishesRef, {
            ...payload,
            weddingId: state.weddingId,
            guestName: state.data.guest_name || '',
            createdAt: state.firebase.serverTimestamp()
        });

        return true;
    }

    async function handleWishSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = {
            name: normalizeString(formData.get('name')).trim(),
            message: normalizeString(formData.get('message')).trim()
        };

        if (!payload.name || !payload.message) {
            showToast('Nama dan ucapan wajib diisi');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : '';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Mengirim...';
        }

        try {
            const saved = await submitWish(payload);
            showToast(saved ? 'Terima kasih, doa berhasil dikirim ✨' : 'Doa diterima. Firebase belum aktif.');
            form.reset();
        } catch (error) {
            console.warn('Ucapan belum tersimpan ke Firebase.', error);
            showToast('Gagal mengirim. Coba lagi nanti.');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText || state.data.wish_button_text || 'Kirim Ucapan';
            }
        }
    }

    function bindOpeningEvents() {
        if (!els.scanBtn) return;

        els.scanBtn.addEventListener('pointerdown', startAuth);
        window.addEventListener('pointerup', stopAuth);
        window.addEventListener('pointercancel', stopAuth);
        window.addEventListener('blur', stopAuth);

        els.scanBtn.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                startAuth(event);
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                stopAuth();
            }
        });
    }

    function bindStaticEvents() {
        bindOpeningEvents();

        if (els.musicBtn) {
            els.musicBtn.addEventListener('click', toggleMusic);
        }

        if (els.openLocationBtn) {
            els.openLocationBtn.addEventListener('click', () => {
                window.open(state.data.map_url || 'https://maps.google.com', '_blank', 'noopener,noreferrer');
            });
        }

        if (els.wishForm) {
            els.wishForm.addEventListener('submit', handleWishSubmit);
        }

        bindCopyButtons();
    }

    async function init() {
        cacheElements();
        bindStaticEvents();

        const data = await loadWeddingData();
        applyTemplateData(data);
        initObserver();

        window.WEDDING_TEMPLATE_STATE = state;
    }

    document.addEventListener('DOMContentLoaded', init);
})();