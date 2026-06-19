import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig={apiKey:"AIzaSyAfI1UUHUqnpImUpX_fsH_pTeJGZcUcG8s",authDomain:"rezaintan-wedding.firebaseapp.com",projectId:"rezaintan-wedding",storageBucket:"rezaintan-wedding.firebasestorage.app",messagingSenderId:"834037181305",appId:"1:834037181305:web:4d8335917243a408759da8",measurementId:"G-WDJEYXSV6M"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
let weddingId="wedding_001",unsubs=[];
const loginPage=document.getElementById("loginPage"),dashboard=document.getElementById("dashboard");

document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();const s=document.getElementById("loginStatus");s.innerText="Login...";try{await signInWithEmailAndPassword(auth,document.getElementById("email").value.trim(),document.getElementById("password").value.trim());s.innerText=""}catch(err){console.error(err);s.innerText="Login gagal. Cek email/password."}});
document.getElementById("logoutBtn").addEventListener("click",()=>signOut(auth));
document.getElementById("loadWeddingBtn").addEventListener("click",()=>{const v=document.getElementById("weddingIdInput").value.trim();if(v){weddingId=v;startDashboard()}});
document.getElementById("generateLinkBtn").addEventListener("click",generateGuestLink);
document.getElementById("copyLinkBtn").addEventListener("click",copyGuestLink);
document.querySelectorAll('input[type="file"]').forEach(i=>i.addEventListener("change",handleUpload));

onAuthStateChanged(auth,u=>{if(u){loginPage.classList.add("hidden");dashboard.classList.remove("hidden");startDashboard()}else{dashboard.classList.add("hidden");loginPage.classList.remove("hidden");clearListeners()}});

async function startDashboard(){clearListeners();document.getElementById("weddingIdInput").value=weddingId;const wr=doc(db,"weddings",weddingId);const ws=await getDoc(wr);if(!ws.exists()){alert("Wedding ID tidak ditemukan.");return}
unsubs.push(onSnapshot(wr,s=>{const d=s.data()||{};totalVisitors.innerText=d.totalVisitors||0;totalRsvp.innerText=d.totalRsvp||0;totalWishes.innerText=d.totalWishes||0}));
unsubs.push(onSnapshot(query(collection(db,"weddings",weddingId,"rsvp"),orderBy("createdAt","desc"),limit(100)),snap=>{rsvpTable.innerHTML="";snap.forEach(x=>{const d=x.data(),tr=document.createElement("tr");tr.innerHTML=`<td>${esc(d.guestName||"-")}</td><td>${esc(d.attendance||"-")}</td><td>${d.guestCount||1}</td><td>${esc(d.phone||"-")}</td><td>${esc(d.note||"-")}</td>`;rsvpTable.appendChild(tr)})}));
unsubs.push(onSnapshot(query(collection(db,"weddings",weddingId,"wishes"),orderBy("createdAt","desc"),limit(50)),snap=>{wishesList.innerHTML="";snap.forEach(x=>{const d=x.data();wishesList.appendChild(item(d.guestName||"Tamu",d.message||"",d.createdAt))})}));
unsubs.push(onSnapshot(query(collection(db,"weddings",weddingId,"visitors"),orderBy("openedAt","desc"),limit(50)),snap=>{visitorsList.innerHTML="";snap.forEach(x=>{const d=x.data();visitorsList.appendChild(item(d.guestName||"Tamu",d.userAgent||"",d.openedAt))})}))}

async function handleUpload(e){const file=e.target.files[0];if(!file)return;const field=e.target.dataset.field,name=e.target.dataset.name;uploadStatus.innerText=`Mengupload ${name}...`;try{const sr=ref(storage,`weddings/${weddingId}/${name}`);await uploadBytes(sr,file);const url=await getDownloadURL(sr);await updateDoc(doc(db,"weddings",weddingId),{[field]:url});uploadStatus.innerText=`${name} berhasil diupload ke ${field}.`;e.target.value=""}catch(err){console.error(err);uploadStatus.innerText="Upload gagal. Cek Storage Rules."}}
function generateGuestLink(){const g=document.getElementById("guestInput").value.trim()||"Bapak/Ibu/Saudara/i";guestLinkOutput.value=`https://stifinfamilymedan.com/weddings/?id=${encodeURIComponent(weddingId)}&to=${encodeURIComponent(g)}`}
async function copyGuestLink(){if(!guestLinkOutput.value)return;await navigator.clipboard.writeText(guestLinkOutput.value);alert("Link berhasil dicopy.")}
function item(t,b,ts){const d=document.createElement("div");d.className="list-item";d.innerHTML=`<strong>${esc(t)}</strong><p>${esc(b)}</p><small>${fmt(ts)}</small>`;return d}
function fmt(ts){if(!ts||!ts.toDate)return"";return new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(ts.toDate())}
function clearListeners(){unsubs.forEach(u=>u&&u());unsubs=[]}
function esc(v){const d=document.createElement("div");d.innerText=String(v);return d.innerHTML}