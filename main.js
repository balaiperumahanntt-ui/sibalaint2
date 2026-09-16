// ==========================================
// 1. INJEKSI EVENT LISTENER (GLOBAL)
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    
    // Inisialisasi AOS (Animasi Scroll) Global
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 50 });
    }

    // ================== LOGIKA INDEX ==================
    // Logika Hamburger Menu Mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        const mobileIcon = mobileMenuBtn.querySelector('i');
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (mobileMenu.classList.contains('hidden')) {
                mobileIcon.classList.remove('fa-xmark');
                mobileIcon.classList.add('fa-bars');
            } else {
                mobileIcon.classList.remove('fa-bars');
                mobileIcon.classList.add('fa-xmark');
            }
        });
    }
 


    // API Fetch Konten (Beranda/Index)
    let container = document.getElementById('konten-list');
    if (container) { 
        fetch('api/get_konten.php')
            .then(response => response.json())
            .then(data => {
                let html = '';
                data.forEach(item => {
                    html += `
                        <div class="w-full md:w-1/3 p-3">
                            <div class="bg-white rounded-lg shadow h-full p-5">
                                <h5 class="font-bold text-lg mb-2">${item.judul}</h5>
                                <p class="text-gray-600">${item.deskripsi}</p>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = `<div class="flex flex-wrap -mx-3">${html}</div>`;
            })
            .catch(error => console.log('Fetch API tidak aktif / tidak ditemukan'));
    }

    // ================== INIT PENGEMBANG ==================
    if (document.getElementById('mapKpr')) {
        initMapPengembang();
        fetchDataPengembang();
    }

    // ================== INIT SIG ==================
    if (document.getElementById('map') && document.getElementById('btn-rtlh')) {
        initMapSig();
        fetchDataSig(true);
    }
});


// ==========================================
// 2. FUNGSI HALAMAN PENGEMBANG
// ==========================================
let mapPengembang = null;
let markersGroup = null;
let perumahanData = [];
let currentSelectedData = null;
const API_URL_PENGEMBANG = "https://script.google.com/macros/s/AKfycbzCUUnCyGMj6PmM---w-WyhNfLEoPM8rLrTs9lzrtQxRmUSI9v8TkuTUO52jbkle59aAA/exec";

function initMapPengembang() {
    if (typeof L === 'undefined') return;
    mapPengembang = L.map('mapKpr').setView([-10.15, 123.58], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapPengembang);
    markersGroup = L.layerGroup().addTo(mapPengembang);
}

async function fetchDataPengembang() {
    const loadingEl = document.getElementById('loadingOverlay');
    try {
        const response = await fetch(API_URL_PENGEMBANG);
        const data = await response.json();
        
        if (loadingEl) loadingEl.classList.add('hidden');
        perumahanData = Array.isArray(data) ? data : [];
        populateKabupatenFilter(perumahanData);
        applyFilters(); 
    } catch (err) {
        console.error("Gagal mengambil data dari Google Apps Script:", err);
        if (loadingEl) loadingEl.classList.add('hidden');
        perumahanData = [];
        populateKabupatenFilter(perumahanData);
        renderDashboard([]);
    }
}

function populateKabupatenFilter(data) {
    const select = document.getElementById('filterKabupaten');
    select.innerHTML = '<option value="ALL">Semua Kabupaten</option>';
    if (!data || data.length === 0) return;
    const kabSet = new Set(data.map(item => item.kabupaten).filter(k => k && k !== "-"));
    Array.from(kabSet).sort().forEach(kab => {
        let opt = document.createElement('option'); 
        opt.value = kab; 
        opt.textContent = kab; 
        select.appendChild(opt);
    });
}

function applyFilters() {
    const selectedKab = document.getElementById('filterKabupaten').value;
    const selectedKat = document.getElementById('filterKategori').value;
    const bannerEl = document.getElementById('notificationBanner');
    
    bannerEl.innerHTML = "";

    let filteredData = perumahanData.filter(item => {
        const matchKab = selectedKab === "ALL" || item.kabupaten === selectedKab;
        const matchKat = selectedKat === "ALL" || String(item.kategori).toLowerCase().includes(selectedKat.toLowerCase());
        return matchKab && matchKat;
    });

    filteredData.sort((a, b) => b.statusTerakadNum - a.statusTerakadNum);

    if (filteredData.length === 0 && selectedKab !== "ALL") {
        bannerEl.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-6 shadow-sm flex items-center gap-3">
                <i class="fa-solid fa-circle-exclamation text-amber-500 text-xl"></i>
                <div>
                    <p class="font-bold text-sm">Tidak ditemukan perumahan di ${selectedKab} dengan kategori tersebut.</p>
                    <p class="text-xs text-amber-700">Berikut ditampilkan saran perumahan dengan total akad terbanyak dari wilayah lain:</p>
                </div>
            </div>
        `;
        filteredData = [...perumahanData].filter(item => {
            return selectedKat === "ALL" || String(item.kategori).toLowerCase().includes(selectedKat.toLowerCase());
        });
        filteredData.sort((a, b) => b.statusTerakadNum - a.statusTerakadNum);
    }

    renderDashboard(filteredData);
}

function renderDashboard(data) {
    let tKavling = 0, tSubReady = 0, tKomReady = 0;
    let developers = new Set();
    
    if (perumahanData && perumahanData.length > 0) {
        perumahanData.forEach(d => {
            tKavling += d.ready;
            if(String(d.kategori).toLowerCase().includes('subsidi')) tSubReady += d.ready;
            else tKomReady += d.ready;
            if(d.developer && d.developer !== "-") developers.add(d.developer);
        });
    }

    document.getElementById('statTotalKavling').innerText = tKavling.toLocaleString('id-ID');
    document.getElementById('statSubsidiReady').innerText = tSubReady.toLocaleString('id-ID');
    document.getElementById('statKomersilReady').innerText = tKomReady.toLocaleString('id-ID');
    document.getElementById('statPengembang').innerText = developers.size;

    if (markersGroup) markersGroup.clearLayers();
    let bounds = [];

    if (data && data.length > 0 && typeof L !== 'undefined') {
        data.forEach((item) => {
            if(item.lat && item.lng) {
                const icon = L.divIcon({
                    className: 'custom-pin',
                    html: `<div class="relative flex flex-col items-center justify-center group"><i class="fa-solid fa-location-dot text-3xl text-brand-teal drop-shadow-md"></i><span class="absolute -top-6 bg-white text-xs font-bold px-2 py-0.5 rounded border border-brand-teal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">${item.nama}</span></div>`,
                    iconSize: [30, 30], iconAnchor: [15, 30]
                });
                const marker = L.marker([item.lat, item.lng], {icon: icon})
                    .bindPopup(`
                        <div class="font-sans text-center min-w-[150px]">
                            <b class="text-brand-darkteal">${item.nama}</b><br>
                            <span class="text-xs text-slate-500">${item.developer}</span><br>
                            <span class="inline-block mt-2 px-2 py-0.5 bg-brand-gold/20 text-brand-darkteal text-[10px] rounded font-bold uppercase">${item.kategori}</span>
                            <button onclick="openDetail(${perumahanData.indexOf(item)})" class="mt-3 w-full bg-brand-teal hover:bg-brand-darkteal transition text-white font-bold text-xs py-1.5 rounded">Lihat Detail</button>
                        </div>
                    `);
                markersGroup.addLayer(marker);
                bounds.push([item.lat, item.lng]);
            }
        });
        if(bounds.length > 0 && mapPengembang) mapPengembang.fitBounds(bounds, {padding: [50, 50], maxZoom: 14});
    }

    const grid = document.getElementById('katalogGrid');
    grid.innerHTML = '';
    
    if(!data || data.length === 0) {
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm"><i class="fa-solid fa-folder-open text-6xl mb-4 text-slate-200"></i><h3 class="text-xl font-bold text-slate-500 mb-1">Belum Ada Data Perumahan</h3></div>`;
        return;
    }

    data.forEach((item, index) => {
        let actualIndex = perumahanData.indexOf(item);
        grid.innerHTML += `
            <div data-aos="fade-up" data-aos-delay="${(index % 3) * 100}" class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group">
                <div class="relative h-52 bg-slate-100 overflow-hidden">
                    <img src="${item.fotoUtama}" alt="${item.nama}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur text-brand-darkteal border border-slate-200 text-xs font-bold rounded-full shadow-sm">
                        ${item.kategori}
                    </div>
                </div>
                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="text-xl font-bold text-brand-darkteal mb-1">${item.nama}</h3>
                    <p class="text-xs font-semibold text-brand-gold mb-4 uppercase"><i class="fa-solid fa-building mr-1"></i> ${item.developer}</p>
                    
                    <div class="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                        <p class="flex items-start gap-2"><i class="fa-solid fa-location-dot text-slate-400 mt-1"></i> <span>${item.kecamatan}, ${item.kabupaten}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-tag text-slate-400"></i> Harga: <strong class="text-brand-teal">${item.hargaFormatted}</strong></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-check-circle text-slate-400"></i> Tersedia: <strong>${item.ready} Unit</strong></p>
                        <p class="flex items-center gap-2 text-xs text-slate-500"><i class="fa-solid fa-file-contract text-brand-gold"></i> Terakad: <strong>${item.statusTerakad} Unit</strong></p>
                    </div>
                    <button onclick="openDetail(${actualIndex})" class="w-full py-3 bg-slate-50 hover:bg-brand-teal hover:text-white text-brand-darkteal font-bold rounded-xl transition-colors border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                        Info Lengkap <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function openDetail(index) {
    currentSelectedData = perumahanData[index];
    const data = currentSelectedData;
    if (!data) return;

    document.getElementById('modalTitle').innerText = data.nama;
    document.getElementById('modalDeveloper').innerHTML = `<i class="fa-solid fa-building mr-1"></i> ${data.developer}`;
    document.getElementById('modalImg').src = data.fotoUtama;
    
    document.getElementById('modalReadyLabel').innerText = `${data.ready} Unit Tersedia`;
    document.getElementById('modalKategori').innerText = data.kategori;
    document.getElementById('modalHarga').innerText = data.hargaFormatted;
    document.getElementById('modalJumlahRumah').innerText = `${data.jumlahRumah} Unit`;
    document.getElementById('modalTerakad').innerText = `${data.statusTerakad} Unit`;
    document.getElementById('modalUnitTersedia').innerText = `${data.ready} Unit`;
    document.getElementById('modalStatusPerumahan').innerText = data.statusPerumahan;
    document.getElementById('modalTipe').innerText = `Tipe ${data.tipeUnit}`;
    document.getElementById('modalLuas').innerText = `${data.luasBangunan} m² / ${data.luasLahan} m²`;
    document.getElementById('modalKT').innerText = `${data.kamarTidur} Ruang`;
    document.getElementById('modalKM').innerText = `${data.kamarMandi} Ruang`;
    
    document.getElementById('modalTahun').innerText = data.tahunPembangunan;
    document.getElementById('modalAsosiasi').innerText = data.asosiasi;
    document.getElementById('modalAlamat').innerText = `${data.alamat}, Kel. ${data.kelurahan}, Kec. ${data.kecamatan}, ${data.kabupaten}`;
    
    const telEl = document.getElementById('modalTelepon');
    if (data.telepon && data.telepon !== "-" && data.telepon !== "") {
        let cleanTel = data.telepon.replace(/\D/g, '');
        if (cleanTel.startsWith('0')) {
            cleanTel = '62' + cleanTel.substring(1);
        } else if (cleanTel.startsWith('8')) {
            cleanTel = '62' + cleanTel;
        }
        telEl.href = `https://api.whatsapp.com/send/?phone=${cleanTel}&text&type=phone_number&app_absent=0`;
        telEl.innerText = data.telepon;
    } else {
        telEl.href = "#";
        telEl.innerText = "-";
    }

    document.getElementById('modalEmail').innerText = data.email || "-";
    
    const webEl = document.getElementById('modalWebsite');
    const wrapWeb = document.getElementById('wrapWebsite');
    if (data.website && data.website !== "-" && data.website !== "") {
        let webUrl = data.website.startsWith('http') ? data.website : 'https://' + data.website;
        webEl.href = webUrl;
        webEl.innerText = data.website;
        wrapWeb.style.display = 'flex';
    } else {
        wrapWeb.style.display = 'none';
    }

    document.getElementById('modalMapsLink').href = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;

    document.getElementById('modalSpek').innerHTML = `
        <div><strong class="block text-xs text-brand-lightgold uppercase">Atap</strong> <span class="font-semibold">${data.spek.atap}</span></div>
        <div><strong class="block text-xs text-brand-lightgold uppercase">Dinding</strong> <span class="font-semibold">${data.spek.dinding}</span></div>
        <div><strong class="block text-xs text-brand-lightgold uppercase">Lantai</strong> <span class="font-semibold">${data.spek.lantai}</span></div>
        <div><strong class="block text-xs text-brand-lightgold uppercase">Pondasi</strong> <span class="font-semibold">${data.spek.pondasi}</span></div>
    `;

    const modal = document.getElementById('modalDetail');
    modal.classList.remove('hidden'); 
    modal.classList.add('modal-enter');
}

function lihatGambar(type) {
    if (!currentSelectedData) return;
    const url = type === 'siteplan' ? currentSelectedData.siteplanUrl : currentSelectedData.fotoDenah;
    const title = type === 'siteplan' ? 'Siteplan Lokasi' : 'Denah Ruangan';
    
    document.getElementById('imgLayarPenuh').src = url || `https://via.placeholder.com/800x600?text=${title}+Belum+Tersedia`;
    document.getElementById('captionGambar').innerHTML = `<i class="fa-solid fa-image mr-1"></i> ${title} - ${currentSelectedData.nama}`;
    
    const modal = document.getElementById('modalGambar');
    modal.classList.remove('hidden'); 
    modal.classList.add('modal-enter');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('modal-enter'); 
    modal.classList.add('modal-leave');
    setTimeout(() => { 
        modal.classList.add('hidden'); 
        modal.classList.remove('modal-leave'); 
    }, 300);
}


