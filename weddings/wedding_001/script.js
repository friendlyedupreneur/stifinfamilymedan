let db;

let doc;
let getDoc;
let collection;
let addDoc;
let serverTimestamp;
let increment;
let updateDoc;
let query;
let orderBy;
let limit;
let onSnapshot;

let weddingRef;
let rsvpRef;
let wishesRef;
let visitorsRef;

// ==========================================
// 1. INISIALISASI VARIABEL & PARAMETER URL
// ==========================================
// --- AMBIL ID DARI PATH URL (UNTUK GITHUB PAGES CLEAN URL) ---
// Mengambil bagian akhir URL (misal: /reza-intan akan menghasilkan "reza-intan")
const pathSegments = window.location.pathname.split('/').filter(Boolean);
const weddingId = pathSegments[pathSegments.length - 1] || 'wedding_001';

// --- AMBIL NAMA TAMU DARI PARAMETER ?to= ---
const params = new URLSearchParams(window.location.search);
const guestName = params.get('to') || "Bapak/Ibu/Saudara/i"; // Menghasilkan "Keluarga Budi"

// Selesai! Selanjutnya gunakan variabel `weddingId` ini untuk query data ke Firestore Bos seperti biasa.
console.log("Memuat data untuk ID:", weddingId);

// Referensi Firebase

// Elemen DOM Utama
const loader = document.getElementById("loader");
const coverCard = document.getElementById("cover");
const coverScene = document.getElementById("cover-scene");
const content = document.getElementById("content");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");

let weddingDateTarget = null;
let fallingLeavesStarted = false;
let gyroAttached = false;
let parallaxStarted = false;

// Tulis Nama Tamu di Sampul
const guestNameEl = document.getElementById("guestName");
if (guestNameEl) {
  guestNameEl.innerText = guestName;
}

// Mulai Aplikasi saat DOM siap
document.addEventListener("DOMContentLoaded", bootstrapWedding);

async function bootstrapWedding() {

    try {

        const firebase = await window.WeddingFirebase.initFirebase();

        db = firebase.db;

        const firestore = firebase.modules.firestore;

        doc = firestore.doc;
        getDoc = firestore.getDoc;
        collection = firestore.collection;
        addDoc = firestore.addDoc;
        serverTimestamp = firestore.serverTimestamp;
        increment = firestore.increment;
        updateDoc = firestore.updateDoc;
        query = firestore.query;
        orderBy = firestore.orderBy;
        limit = firestore.limit;
        onSnapshot = firestore.onSnapshot;

        weddingRef = doc(db, "weddings", weddingId);
        rsvpRef = collection(db, "weddings", weddingId, "rsvp");
        wishesRef = collection(db, "weddings", weddingId, "wishes");
        visitorsRef = collection(db, "weddings", weddingId, "visitors");

        await initWedding();

    } catch (e) {

        console.error(e);

        loader.innerHTML = `
            <h3>Firebase gagal diinisialisasi.</h3>
            <p>Lihat Console Browser.</p>
        `;

    }

}

// ==========================================
// 2. FUNGSI UTAMA
// ==========================================
async function initWedding() {
  document.body.style.overflow = "hidden";

  try {
    const snapshot = await getDoc(weddingRef);

    if (!snapshot.exists()) {
      loader.innerHTML = "<p>Data undangan tidak ditemukan.</p>";
      return;
    }

    const data = snapshot.data();

    data.groomFullName = data.groomFullName || data.groomName;
    data.brideFullName = data.brideFullName || data.brideName;

    applyWeddingData(data);
    setupCountdown();
    setupEvents();
    listenWishes();
    await trackVisitor();

    loader.classList.add("hidden");
    coverScene.classList.remove("hidden");

    setTimeout(() => {
      if (typeof AOS !== "undefined") AOS.refresh();
    }, 500);

  } catch (error) {
    console.error(error);
    loader.innerHTML = "<p>Gagal memuat undangan. Coba refresh halaman.</p>";
  }
}

// ==========================================
// 3. MENERAPKAN DATA FIREBASE KE HTML
// ==========================================
function applyWeddingData(data) {
  document.title = `Undangan Pernikahan | ${data.groomName || ""} & ${data.brideName || ""}`;
  data.weddingDateText = formatWeddingDate(data.weddingDate);

  document.querySelectorAll("[data-field]").forEach(el => {
    const field = el.getAttribute("data-field");

    if (data[field] !== undefined && data[field] !== "") {
      el.innerText = data[field];
    }
  });

  setBackground("#cover-scene", data.coverImage, "assets/cover.jpg");
  setBackground(".hero", data.heroImage, "assets/hero.jpg");

  setImage("groomPhoto", data.groomPhoto, "assets/groom.jpg");
  setImage("bridePhoto", data.bridePhoto, "assets/bride.jpg");
  setImage("gallery1", data.gallery1, "assets/gallery1.jpg");
  setImage("gallery2", data.gallery2, "assets/gallery2.jpg");
  setImage("gallery3", data.gallery3, "assets/gallery3.jpg");
  setImage("gallery4", data.gallery4, "assets/gallery4.jpg");

  bgMusic.src = data.musicUrl || "assets/music.mp3";

  const mapsBtn = document.getElementById("mapsBtn");
  if (mapsBtn && data.mapsLink) {
    mapsBtn.href = data.mapsLink;
  }

  if (guestName !== "Bapak/Ibu/Saudara/i") {
    const rsvpNameInput = document.getElementById("rsvpName");
    const wishNameInput = document.getElementById("wishName");

    if (rsvpNameInput) rsvpNameInput.value = guestName;
    if (wishNameInput) wishNameInput.value = guestName;
  }

  if (data.weddingDate) {

    const [year, month, day] =
        data.weddingDate.split("-").map(Number);

    let hour = 9;
    let minute = 0;

    if (data.akadTime) {

        const time =
            data.akadTime.match(/\d{1,2}:\d{2}/);

        if (time) {

            [hour, minute] =
                time[0].split(":").map(Number);

        }

    }

    weddingDateTarget =
        new Date(
            year,
            month - 1,
            day,
            hour,
            minute,
            0
        ).getTime();

}

  const groomIgBtn = document.getElementById("groomIgBtn");
  if (groomIgBtn && data.groomIgLink) {
    groomIgBtn.href = data.groomIgLink;
  }

  const brideIgBtn = document.getElementById("brideIgBtn");
  if (brideIgBtn && data.brideIgLink) {
    brideIgBtn.href = data.brideIgLink;
  }

  setText("statVisitors", data.totalVisitors || 0);
  setText("statHadir", data.totalHadir || 0);
  setText("statWishes", data.totalWishes || 0);
}

// ==========================================
// 4. EVENT
// ==========================================
function setupEvents() {
  const openBtn = document.getElementById("openBtn");
  const rsvpForm = document.getElementById("rsvpForm");
  const wishForm = document.getElementById("wishForm");

  if (openBtn) openBtn.addEventListener("click", openInvitation);
  if (rsvpForm) rsvpForm.addEventListener("submit", submitRsvp);
  if (wishForm) wishForm.addEventListener("submit", submitWish);
  if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
}

function openInvitation() {
  if (!coverCard || !coverScene || !content) return;

  coverCard.classList.add("is-open");

  musicToggle.classList.remove("hidden");

  bgMusic.play().then(() => {
    musicToggle.classList.add("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-music"></i>';
  }).catch(() => {
    console.log("Autoplay diblokir browser.");
    musicToggle.classList.remove("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  });

  setTimeout(() => {
    coverScene.style.display = "none";
    content.classList.remove("hidden");
    document.body.style.overflow = "auto";

    if (typeof AOS !== "undefined") AOS.refresh();

    createFallingLeaves();
    init3DSectionReveal();
    initScrollParallax();
    //initGyroscope3D();
    activateFirstVisibleSections();

  }, 1200);
}

function toggleMusic() {
  if (!bgMusic || !musicToggle) return;

  if (bgMusic.paused) {
    bgMusic.play();
    musicToggle.classList.add("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-music"></i>';
  } else {
    bgMusic.pause();
    musicToggle.classList.remove("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  }
}

// ==========================================
// 5. 3D SECTION REVEAL
// ==========================================
function init3DSectionReveal() {
  const sections = document.querySelectorAll(".reveal-3d");
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show-3d");
      } else {
        entry.target.classList.remove("show-3d");
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  sections.forEach(section => observer.observe(section));
}

function activateFirstVisibleSections() {
  const sections = document.querySelectorAll(".reveal-3d");

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();

    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      section.classList.add("show-3d");
    }
  });
}

// ==========================================
// 6. SCROLL PARALLAX PREMIUM
// ==========================================
function initScrollParallax() {
  if (parallaxStarted) return;
  parallaxStarted = true;

  const heroContent = document.querySelector(".hero-content");
  const hero = document.querySelector(".hero");

  if (!hero || !heroContent) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight || window.innerHeight;

      if (scrollY <= heroHeight) {
        const move = scrollY * 0.18;
        const fade = Math.max(0.25, 1 - scrollY / heroHeight);

        heroContent.style.transform = `translateY(${move}px) translateZ(50px)`;
        heroContent.style.opacity = fade;
      }

      ticking = false;
    });

    ticking = true;
  }, { passive: true });
}

// ==========================================
// 7. GYROSCOPE 3D PARALLAX
// ==========================================
function initGyroscope3D() {
  const layer3D = document.querySelector(".content-3d-layer");

  if (!layer3D || gyroAttached) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (!isMobile) return;

  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === "granted") {
            attachGyroListener(layer3D);
          }
        })
        .catch(console.error);
    } else {
      attachGyroListener(layer3D);
    }
  }
}

function attachGyroListener(layer3D) {
  if (gyroAttached) return;
  gyroAttached = true;

  window.addEventListener("deviceorientation", (event) => {
    const tiltX = event.beta;
    const tiltY = event.gamma;

    if (tiltX === null || tiltY === null) return;

    const rotateX = clamp((tiltX - 45) * 0.08, -3, 3);
    const rotateY = clamp(tiltY * 0.08, -3, 3);

    layer3D.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
  }, { passive: true });
}

// ==========================================
// 8. FALLING FLOWERS
// ==========================================
function createFallingLeaves() {
  if (fallingLeavesStarted) return;
  fallingLeavesStarted = true;

  const container = document.getElementById("falling-elements");
  if (!container) return;

  const maxLeaves = 25;
  const symbols = ["🌸", "🍃", "✨", "🤍"];

  setInterval(() => {
    if (container.childElementCount > maxLeaves) return;

    const leaf = document.createElement("div");
    leaf.classList.add("falling-leaf");
    leaf.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.fontSize = (Math.random() * 0.8 + 0.8) + "rem";

    const fallDuration = Math.random() * 3 + 5;
    const swayDuration = Math.random() * 2 + 3;

    leaf.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;

    container.appendChild(leaf);

    setTimeout(() => {
      leaf.remove();
    }, fallDuration * 1000);
  }, 420);
}

// ==========================================
// 9. FIREBASE: RSVP, WISHES, VISITOR
// ==========================================
async function submitRsvp(event) {
  event.preventDefault();

  const button = event.target.querySelector("button");
  const status = document.getElementById("rsvpStatus");

  button.disabled = true;
  status.style.color = "";
  status.innerText = "Mengirim Konfirmasi...";

  try {
    const attendanceValue = document.getElementById("attendance").value;
    const guestCountValue = Number(document.getElementById("guestCount").value || 1);

    await addDoc(rsvpRef, {
      guestName: document.getElementById("rsvpName").value.trim(),
      phone: document.getElementById("rsvpPhone").value.trim(),
      attendance: attendanceValue,
      guestCount: guestCountValue,
      note: document.getElementById("rsvpNote").value.trim(),
      sourceGuestName: guestName,
      createdAt: serverTimestamp()
    });

    const updateData = {
      totalRsvp: increment(1)
    };

    if (attendanceValue === "hadir") {
      updateData.totalHadir = increment(guestCountValue);

      const statHadir = document.getElementById("statHadir");
      if (statHadir) {
        statHadir.innerText = parseInt(statHadir.innerText || 0, 10) + guestCountValue;
      }

    } else if (attendanceValue === "tidak_hadir") {
      updateData.totalTidakHadir = increment(1);
    }

    await updateDoc(weddingRef, updateData);

    status.style.color = "#4CAF50";
    status.innerText = "Konfirmasi berhasil dikirim. Terima kasih! 🙏";
    event.target.reset();

  } catch (error) {
    console.error(error);
    status.style.color = "red";
    status.innerText = "Gagal mengirim. Coba lagi ya.";
  } finally {
    button.disabled = false;
  }
}

async function submitWish(event) {
  event.preventDefault();

  const button = event.target.querySelector("button");
  const originalText = button.innerText;

  button.disabled = true;
  button.innerText = "Mengirim...";

  try {
    await addDoc(wishesRef, {
      guestName: document.getElementById("wishName").value.trim(),
      message: document.getElementById("wishText").value.trim(),
      sourceGuestName: guestName,
      createdAt: serverTimestamp()
    });

    await updateDoc(weddingRef, {
      totalWishes: increment(1)
    });

    const statWishes = document.getElementById("statWishes");
    if (statWishes) {
      statWishes.innerText = parseInt(statWishes.innerText || 0, 10) + 1;
    }

    document.getElementById("wishText").value = "";

  } catch (error) {
    console.error(error);
    alert("Gagal mengirim ucapan. Coba lagi ya.");
  } finally {
    button.innerText = originalText;
    button.disabled = false;
  }
}

function listenWishes() {
  const q = query(wishesRef, orderBy("createdAt", "desc"), limit(30));

  onSnapshot(q, snapshot => {
    const list = document.getElementById("wishList");
    if (!list) return;

    list.innerHTML = "";

    snapshot.forEach(docItem => {
      const data = docItem.data();

      const item = document.createElement("div");
      item.className = "wish-item box-3d";

      item.innerHTML = `
        <strong style="color: var(--primary); font-size: 1.1rem;">
          <i class="fa-regular fa-circle-user"></i>
          ${escapeHtml(data.guestName || "Tamu")}
        </strong>
        <p style="margin-top: 8px; font-size: 0.95rem; line-height: 1.5;">
          ${escapeHtml(data.message || "")}
        </p>
      `;

      list.appendChild(item);
    });
  });
}

async function trackVisitor() {
  try {
    await addDoc(visitorsRef, {
      guestName: guestName,
      userAgent: navigator.userAgent,
      openedAt: serverTimestamp()
    });

    await updateDoc(weddingRef, {
      totalVisitors: increment(1)
    });

  } catch (error) {
    console.warn("Visitor tracking gagal:", error);
  }
}

// ==========================================
// 10. UTILITAS
// ==========================================
function setupCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  if (!weddingDateTarget) return;

  const now = new Date().getTime();
  const distance = weddingDateTarget - now;

  if (distance <= 0) {
    setCountdownValue(0, 0, 0, 0);
    return;
  }

  setCountdownValue(
    Math.floor(distance / (1000 * 60 * 60 * 24)),
    Math.floor((distance / (1000 * 60 * 60)) % 24),
    Math.floor((distance / (1000 * 60)) % 60),
    Math.floor((distance / 1000) % 60)
  );
}

function setCountdownValue(days, hours, minutes, seconds) {
  setText("days", days);
  setText("hours", hours);
  setText("minutes", minutes);
  setText("seconds", seconds);
}

function formatWeddingDate(dateString) {

    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);

}

function setBackground(selector, url, fallback) {
  const el = document.querySelector(selector);
  if (!el) return;

  const finalUrl = url || fallback;

  el.style.backgroundImage =
    `linear-gradient(to bottom, rgba(63,42,31,0.4), rgba(63,42,31,0.7)), url('${finalUrl}')`;
}

function setImage(id, url, fallback) {
  const el = document.getElementById(id);
  if (!el) return;

  el.src = url || fallback;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = value;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
