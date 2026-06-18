WEDDING FIREBASE OPTION B

Link utama:
stifinfamilymedan.com/wedding/

Link dengan ID wedding:
stifinfamilymedan.com/wedding/?id=wedding_001

Link nama tamu:
stifinfamilymedan.com/wedding/?id=wedding_001&to=Keluarga%20Andi

Firestore yang dipakai:
weddings/wedding_001

Subcollection:
- rsvp
- wishes
- visitors

Rules MVP:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /weddings/{weddingId} {
      allow read: if true;
      allow update: if true;
      match /rsvp/{rsvpId} { allow read: if true; allow create: if true; }
      match /wishes/{wishId} { allow read: if true; allow create: if true; }
      match /visitors/{visitorId} { allow create: if true; }
    }
  }
}

Catatan:
- allow update true dipakai agar counter totalRsvp, totalWishes, totalVisitors bisa bertambah.
- Nanti setelah dashboard admin dibuat, rules bisa diperketat lagi.
- Ganti file foto dan musik di folder assets.
