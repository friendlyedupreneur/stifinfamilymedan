import { db } from "./firebase-config.js";
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, 
  increment, updateDoc, query, orderBy, limit, onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// 1. INISIALISASI VARIABEL & PARAMETER URL
// ==========================================
const params = new URLSearchParams(window.location.search);
const weddingId = params.get("id") || "wedding_001";
const guest = params.get("to") || "Bapak/Ibu/Saudara/i";

// Referensi Firebase
const weddingRef = doc(db, "weddings", weddingId);
const rsvpRef = collection(db, "weddings", weddingId, "rsvp");
const wishesRef = collection(db, "weddings", weddingId, "wishes");
const visitorsRef = collection(db, "weddings", weddingId, "visitors");

// Elemen DOM Utama
const loader = document.getElementById("loader");
const cover = document.getElementById("cover");
const content = document.getElementById("content");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");

let weddingDateTarget = null;

// Tulis Nama Tamu di Sampul
document.getElementById("guestName").innerText = decodeURIComponent(guest);

// Mulai Aplikasi saat DOM siap
document.addEventListener("DOMContentLoaded", initWedding);

// ==========================================
// 2. FUNGSI UTAMA (INIT)
// ==========================================
async function initWedding() {
  // Kunci scroll saat di halaman cover
  document.body.style.overflow = "hidden";

  try {
    const snapshot = await getDoc(weddingRef);
    if (!snapshot.exists()) {
      loader.innerHTML = "<p>Data undangan tidak ditemukan.</p>";
      return;
    }

    const data = snapshot.data();
    
    // Terapkan fallback nama lengkap (jika kosong, pakai nama panggilan)
    data.groomFullName = data.groomFullName || data.groomName;
    data.brideFullName = data.brideFullName || data.brideName;

    applyWeddingData(data);
    setupCountdown();
    setupEvents();
    listenWishes();
    await trackVisitor();

    // Hilangkan loader, munculkan cover
    loader.classList.add("hidden");
    cover.classList.remove("hidden");

    // Refresh Animasi AOS setelah data masuk
    setTimeout(() => { if (typeof AOS !== 'undefined') AOS.refresh(); }, 500);

  } catch (error) {
    console.error(error);
    loader.innerHTML = "<p>Gagal memuat undangan. Coba refresh halaman.</p>";
  }
}

// ==========================================
// 3. MENERAPKAN DATA DARI FIREBASE KE HTML
// ==========================================
function applyWeddingData(data) {
  document.title = `Undangan Pernikahan | ${data.groomName || ""} & ${data.brideName || ""}`;
  data.weddingDateText = formatWeddingDate(data.weddingDate);

  // Otomatis isi semua elemen yang punya atribut data-field
  document.querySelectorAll("[data-field]").forEach(el => {
    const field = el.getAttribute("data-field");
    if (data[field] !== undefined && data[field] !== "") {
      el.innerText = data[field];
    }
  });

  // Set Background & Gambar
  setBackground(".cover", data.coverImage, "assets/cover.jpg");
  setBackground(".hero", data.heroImage, "assets/hero.jpg");
  setImage("groomPhoto", data.groomPhoto, "assets/groom.jpg");
  setImage("bridePhoto", data.bridePhoto, "assets/bride.jpg");
  setImage("gallery1", data.gallery1, "assets/gallery1.jpg");
  setImage("gallery2", data.gallery2, "assets/gallery2.jpg");
  setImage("gallery3", data.gallery3, "assets/gallery3.jpg");
  setImage("gallery4", data.gallery4, "assets/gallery4.jpg");

  // Set Link Maps & Musik
  bgMusic.src = data.musicUrl || "assets/music.mp3";
  if (data.mapsLink) document.getElementById("mapsBtn").href = data.mapsLink;

  // Auto-fill nama tamu di form RSVP & Ucapan
  if (guest && guest !== "Bapak/Ibu/Saudara/i") {
    document.getElementById("rsvpName").value = decodeURIComponent(guest);
    document.getElementById("wishName").value = decodeURIComponent(guest);
  }

  // Set Target Waktu Countdown
  if (data.weddingDate) {
    weddingDateTarget = new Date(`${data.weddingDate}T09:00:00`).getTime();
  }
  
    // Set Link Instagram
  const groomIgBtn = document.getElementById("groomIgBtn");
  if (groomIgBtn && data.groomIgLink) {
    groomIgBtn.href = data.groomIgLink;
  }

  const brideIgBtn = document.getElementById("brideIgBtn");
  if (brideIgBtn && data.brideIgLink) {
    brideIgBtn.href = data.brideIgLink;
  }
  
    // Set Statistik Data
  document.getElementById("statVisitors").innerText = data.totalVisitors || 0;
  document.getElementById("statHadir").innerText = data.totalHadir || 0;
 
  document.getElementById("statWishes").innerText = data.totalWishes || 0;


}

// ==========================================
// 4. PENGATURAN EVENT (KLIK & SUBMIT)
// ==========================================
function setupEvents() {
  document.getElementById("openBtn").addEventListener("click", openInvitation);
  document.getElementById("rsvpForm").addEventListener("submit", submitRsvp);
  document.getElementById("wishForm").addEventListener("submit", submitWish);
  musicToggle.addEventListener("click", toggleMusic);
}

// BUKA UNDANGAN (TOMBOL COVER)
function openInvitation() {
  cover.style.display = "none";
  content.classList.remove("hidden");
  document.body.style.overflow = "auto"; // Buka kunci scroll

  // Tampilkan & Putar Musik
  musicToggle.classList.remove("hidden");
  bgMusic.play().then(() => {
    musicToggle.classList.add("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-music"></i>';
  }).catch(() => {
    console.log("Autoplay diblokir browser.");
    musicToggle.classList.remove("playing");
    musicToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  });

  // Mulai Animasi Bunga Jatuh
  createFallingLeaves();
}

// TOGGLE MUSIK PLAY/PAUSE
function toggleMusic() {
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
// 5. EFEK BUNGA BERJATUHAN (ANIMASI DOM)
// ==========================================
function createFallingLeaves() {
  const container = document.getElementById("falling-elements");
  if (!container) return;

  const maxLeaves = 25; // Maksimal elemen di layar
  const symbols = ['🌸', '🍃', '✨', '🤍']; // Karakter yang jatuh

  setInterval(() => {
    if (container.childElementCount > maxLeaves) return;

    const leaf = document.createElement('div');
    leaf.classList.add('falling-leaf');
    
    // Pilih bentuk acak
    leaf.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    // Posisi, ukuran, dan kecepatan jatuh acak
    leaf.style.left = Math.random() * 100 + 'vw';
    leaf.style.fontSize = (Math.random() * 0.8 + 0.8) + 'rem';
    
    // Durasi jatuh (5-8 detik), ayunan angin (3-5 detik)
    const fallDuration = Math.random() * 3 + 5;
    const swayDuration = Math.random() * 2 + 3;
    leaf.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;

    container.appendChild(leaf);

    // Hapus elemen setelah selesai jatuh agar tidak membebani memori
    setTimeout(() => {
      leaf.remove();
    }, fallDuration * 1000);

  }, 400); // Interval munculnya elemen baru
}

// ==========================================
// 6. FIREBASE: RSVP, WISHES, & TRACKING
// ==========================================
async function submitRsvp(event) {
  event.preventDefault();
  const button = event.target.querySelector("button");
  const status = document.getElementById("rsvpStatus");
  button.disabled = true;
  status.innerText = "Mengirim Konfirmasi...";

  try {
    // 1. Ambil nilai kehadiran dan jumlah tamu
    const attendanceValue = document.getElementById("attendance").value;
    const guestCountValue = Number(document.getElementById("guestCount").value || 1);

    // 2. Simpan detail form ke dalam koleksi RSVP
    await addDoc(rsvpRef, {
      guestName: document.getElementById("rsvpName").value.trim(),
      phone: document.getElementById("rsvpPhone").value.trim(),
      attendance: attendanceValue,
      guestCount: guestCountValue,
      note: document.getElementById("rsvpNote").value.trim(),
      sourceGuestName: decodeURIComponent(guest),
      createdAt: serverTimestamp()
    });
    
    // 3. Siapkan data statistik untuk di-update ke dokumen utama
    const updateData = { totalRsvp: increment(1) };
    
    if (attendanceValue === "hadir") {
      // Tambahkan jumlah tamu ke totalHadir (sangat berguna untuk hitung katering)
      updateData.totalHadir = increment(guestCountValue);
      
      // Update angka 'Hadir' di layar secara instan
      const statHadir = document.getElementById("statHadir");
      if (statHadir) {
        statHadir.innerText = parseInt(statHadir.innerText || 0) + guestCountValue;
      }
      
    } else if (attendanceValue === "tidak_hadir") {
      // Tambahkan 1 ke totalTidakHadir
      updateData.totalTidakHadir = increment(1);
      
    
    }

    // 4. Eksekusi update statistik ke Firestore
    await updateDoc(weddingRef, updateData);

    // 5. Pesan sukses dan reset form
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
  button.disabled = true;
  const originalText = button.innerText;
  button.innerText = "Mengirim...";

  try {
    await addDoc(wishesRef, {
      guestName: document.getElementById("wishName").value.trim(),
      message: document.getElementById("wishText").value.trim(),
      sourceGuestName: decodeURIComponent(guest),
      createdAt: serverTimestamp()
    });
    
    await updateDoc(weddingRef, { totalWishes: increment(1) });
        // Animasi tambah angka instan di layar
    const statWishes = document.getElementById("statWishes");
    statWishes.innerText = parseInt(statWishes.innerText) + 1;

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
    list.innerHTML = "";
    
    snapshot.forEach(docItem => {
      const data = docItem.data();
      const item = document.createElement("div");
      item.className = "wish-item";
      
      // Menggunakan icon user dan styling rapi
      item.innerHTML = `
        <strong style="color: var(--primary); font-size: 1.1rem;">
          <i class="fa-regular fa-circle-user"></i> ${escapeHtml(data.guestName || "Tamu")}
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
      guestName: decodeURIComponent(guest),
      userAgent: navigator.userAgent,
      openedAt: serverTimestamp()
    });
    await updateDoc(weddingRef, { totalVisitors: increment(1) });
  } catch (error) {
    console.warn("Visitor tracking gagal:", error);
  }
}

// ==========================================
// 7. FUNGSI UTILITAS (COUNTDOWN, FORMAT, HELPER)
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
  document.getElementById("days").innerText = days;
  document.getElementById("hours").innerText = hours;
  document.getElementById("minutes").innerText = minutes;
  document.getElementById("seconds").innerText = seconds;
}

function formatWeddingDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  }).format(date);
}

function setBackground(selector, url, fallback) {
  const el = document.querySelector(selector);
  if (!el) return;
  const finalUrl = url || fallback;
  
  // Mempertahankan gradient gelap di atas background gambar
  el.style.backgroundImage = `linear-gradient(to bottom, rgba(63,42,31,0.4), rgba(63,42,31,0.7)), url('${finalUrl}')`;
}

function setImage(id, url, fallback) {
  const el = document.getElementById(id);
  if (el) el.src = url || fallback;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}