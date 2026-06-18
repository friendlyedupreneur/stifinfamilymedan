import { db } from "./firebase-config.js";
import { doc,getDoc,collection,addDoc,serverTimestamp,increment,updateDoc,query,orderBy,limit,onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const params=new URLSearchParams(window.location.search);
const weddingId=params.get("id")||"wedding_001";
const guest=params.get("to")||"Bapak/Ibu/Saudara/i";
const weddingRef=doc(db,"weddings",weddingId);
const rsvpRef=collection(db,"weddings",weddingId,"rsvp");
const wishesRef=collection(db,"weddings",weddingId,"wishes");
const visitorsRef=collection(db,"weddings",weddingId,"visitors");
let weddingDateTarget=null;
const loader=document.getElementById("loader");
const cover=document.getElementById("cover");
const content=document.getElementById("content");
document.getElementById("guestName").innerText=decodeURIComponent(guest);
document.addEventListener("DOMContentLoaded",initWedding);

async function initWedding(){try{const snapshot=await getDoc(weddingRef);if(!snapshot.exists()){loader.innerHTML="<p>Data undangan tidak ditemukan.</p>";return}const data=snapshot.data();applyWeddingData(data);setupCountdown();setupEvents();listenWishes();await trackVisitor();loader.classList.add("hidden");cover.classList.remove("hidden")}catch(error){console.error(error);loader.innerHTML="<p>Gagal memuat undangan. Coba refresh halaman.</p>"}}

function applyWeddingData(data){document.title=`Undangan Pernikahan | ${data.groomName||""} & ${data.brideName||""}`;data.weddingDateText=formatWeddingDate(data.weddingDate);document.querySelectorAll("[data-field]").forEach(el=>{const field=el.getAttribute("data-field");if(data[field]!==undefined&&data[field]!=="")el.innerText=data[field]});setBackground(".cover",data.coverImage,"assets/cover.jpg");setBackground(".hero",data.heroImage,"assets/hero.jpg");setImage("groomPhoto",data.groomPhoto,"assets/groom.jpg");setImage("bridePhoto",data.bridePhoto,"assets/bride.jpg");setImage("gallery1",data.gallery1,"assets/gallery1.jpg");setImage("gallery2",data.gallery2,"assets/gallery2.jpg");setImage("gallery3",data.gallery3,"assets/gallery3.jpg");setImage("gallery4",data.gallery4,"assets/gallery4.jpg");document.getElementById("bgMusic").src=data.musicUrl||"assets/music.mp3";if(data.mapsLink)document.getElementById("mapsBtn").href=data.mapsLink;if(guest&&guest!=="Bapak/Ibu/Saudara/i"){document.getElementById("rsvpName").value=decodeURIComponent(guest);document.getElementById("wishName").value=decodeURIComponent(guest)}if(data.weddingDate)weddingDateTarget=new Date(`${data.weddingDate}T09:00:00`).getTime()}

function setupEvents(){document.getElementById("openBtn").addEventListener("click",openInvitation);document.getElementById("rsvpForm").addEventListener("submit",submitRsvp);document.getElementById("wishForm").addEventListener("submit",submitWish)}
function openInvitation(){cover.style.display="none";content.classList.remove("hidden");document.getElementById("bgMusic").play().catch(()=>console.log("Autoplay diblokir browser."))}
async function submitRsvp(event){event.preventDefault();const button=event.target.querySelector("button");const status=document.getElementById("rsvpStatus");button.disabled=true;status.innerText="Mengirim RSVP...";try{await addDoc(rsvpRef,{guestName:document.getElementById("rsvpName").value.trim(),phone:document.getElementById("rsvpPhone").value.trim(),attendance:document.getElementById("attendance").value,guestCount:Number(document.getElementById("guestCount").value||1),note:document.getElementById("rsvpNote").value.trim(),sourceGuestName:decodeURIComponent(guest),createdAt:serverTimestamp()});await updateDoc(weddingRef,{totalRsvp:increment(1)});status.innerText="RSVP berhasil dikirim. Terima kasih 🙏";event.target.reset()}catch(error){console.error(error);status.innerText="Gagal mengirim RSVP. Coba lagi ya."}finally{button.disabled=false}}
async function submitWish(event){event.preventDefault();const button=event.target.querySelector("button");button.disabled=true;try{await addDoc(wishesRef,{guestName:document.getElementById("wishName").value.trim(),message:document.getElementById("wishText").value.trim(),sourceGuestName:decodeURIComponent(guest),createdAt:serverTimestamp()});await updateDoc(weddingRef,{totalWishes:increment(1)});document.getElementById("wishText").value=""}catch(error){console.error(error);alert("Gagal mengirim ucapan. Coba lagi ya.")}finally{button.disabled=false}}
function listenWishes(){const q=query(wishesRef,orderBy("createdAt","desc"),limit(20));onSnapshot(q,snapshot=>{const list=document.getElementById("wishList");list.innerHTML="";snapshot.forEach(docItem=>{const data=docItem.data();const item=document.createElement("div");item.className="wish-item";item.innerHTML=`<strong>${escapeHtml(data.guestName||"Tamu")}</strong><p>${escapeHtml(data.message||"")}</p>`;list.appendChild(item)})})}
async function trackVisitor(){try{await addDoc(visitorsRef,{guestName:decodeURIComponent(guest),userAgent:navigator.userAgent,openedAt:serverTimestamp()});await updateDoc(weddingRef,{totalVisitors:increment(1)})}catch(error){console.warn("Visitor tracking gagal:",error)}}
function setupCountdown(){updateCountdown();setInterval(updateCountdown,1000)}
function updateCountdown(){if(!weddingDateTarget)return;const now=new Date().getTime();const distance=weddingDateTarget-now;if(distance<=0){setCountdownValue(0,0,0,0);return}setCountdownValue(Math.floor(distance/(1000*60*60*24)),Math.floor((distance/(1000*60*60))%24),Math.floor((distance/(1000*60))%60),Math.floor((distance/1000)%60))}
function setCountdownValue(days,hours,minutes,seconds){document.getElementById("days").innerText=days;document.getElementById("hours").innerText=hours;document.getElementById("minutes").innerText=minutes;document.getElementById("seconds").innerText=seconds}
function formatWeddingDate(dateString){if(!dateString)return"";const date=new Date(`${dateString}T00:00:00`);return new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(date)}
function setBackground(selector,url,fallback){const el=document.querySelector(selector);const finalUrl=url||fallback;el.style.backgroundImage=`linear-gradient(rgba(45,30,22,.45), rgba(45,30,22,.45)), url('${finalUrl}')`}
function setImage(id,url,fallback){const el=document.getElementById(id);if(el)el.src=url||fallback}
function escapeHtml(text){const div=document.createElement("div");div.innerText=text;return div.innerHTML}
