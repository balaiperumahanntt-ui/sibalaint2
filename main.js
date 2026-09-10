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


// ==========================================
// 3. FUNGSI HALAMAN SIG
// ==========================================
let allDataSig = { rtlh: [], rusun: [], bsps: [], rusus: [] };
let sheetDataMap = {}; 
let bspsMapByYear = {};
let rususMap = {};
let myChart = null, mapSig = null;

let geojsonFillLayer = null, geojsonBorderLayer = null;
let labelLayerGroup = null;
let pointLayerGroup = null;

let legendRTLH = null, legendBSPS = null, legendRusus = null;
let activeLegend = null;
let currentMode = null;
const API_URL_SIG = "https://script.google.com/macros/s/AKfycbz7BYd76WrArwoH4UYNhfVM1QScJZ8kRmt-BViScgvae6aGNVOwEotzQvynWN6ZqQkXsQ/exec";

function initMapSig() {
    if (typeof L === 'undefined') return;
    
    const nttBounds = [[-11.5, 117.5], [-7.5, 126.0]];
    mapSig = L.map('map', { minZoom: 7, maxBounds: nttBounds, maxBoundsViscosity: 1.0 }).setView([-8.65, 121.0], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapSig);

    mapSig.createPane('paneFillKabupaten'); 
    mapSig.getPane('paneFillKabupaten').style.zIndex = 390;
    
    mapSig.createPane('paneBorderKabupaten'); 
    mapSig.getPane('paneBorderKabupaten').style.zIndex = 480;
    
    labelLayerGroup = L.layerGroup().addTo(mapSig);
    pointLayerGroup = L.layerGroup().addTo(mapSig);

    fetch('https://raw.githubusercontent.com/balaiperumahanntt-ui/petanttgeojson/main/ntt%20geojson.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            geojsonFillLayer = L.geoJson(geojsonData, { pane: 'paneFillKabupaten', style: {fillOpacity: 0, weight: 0}, onEachFeature: onEachFeature }).addTo(mapSig);
            geojsonBorderLayer = L.geoJson(geojsonData, { pane: 'paneBorderKabupaten', style: () => ({ fill: false, weight: 2, color: '#1e293b', opacity: 0.9 }), interactive: false }).addTo(mapSig);
        });

    // Legenda RTLH
    legendRTLH = L.control({position: 'bottomright'});
    legendRTLH.onAdd = function () {
        var div = L.DomUtil.create('div', 'info-legend bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200');
        div.innerHTML = `
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #093C4F;">Legenda Sebaran RTLH</div>
            <table style="width: 100%; font-size: 11px; border-spacing: 0 4px; border-collapse: separate;">
                <tr><td><i style="background: #fee5d9; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> 0 - 2.5K</td></tr>
                <tr><td><i style="background: #fcae91; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> 2.5K - 5K</td></tr>
                <tr><td><i style="background: #fb6a4a; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> 5K - 10K</td></tr>
                <tr><td><i style="background: #de2d26; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> 10K - 20K</td></tr>
                <tr><td><i style="background: #a50f15; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> > 20K</td></tr>
            </table>
        `;
        return div;
    };

    // Legenda BSPS
    legendBSPS = L.control({position: 'bottomright'});
    legendBSPS.onAdd = function () {
        var div = L.DomUtil.create('div', 'info-legend bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200');
        div.innerHTML = `
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #093C4F;">Legenda Alokasi BSPS</div>
            <table style="width: 100%; font-size: 11px; border-spacing: 0 4px; border-collapse: separate;">
                <tr><td><i style="background: #0E5975; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> Ada Alokasi Unit</td></tr>
                <tr><td><i style="background: transparent; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> Tidak Ada Alokasi</td></tr>
            </table>
        `;
        return div;
    };

    // Legenda Rusus
    legendRusus = L.control({position: 'bottomright'});
    legendRusus.onAdd = function () {
        var div = L.DomUtil.create('div', 'info-legend bg-white/90 p-3 rounded-xl shadow-lg border border-slate-200');
        div.innerHTML = `
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #093C4F;">Legenda Alokasi Rusus</div>
            <table style="width: 100%; font-size: 11px; border-spacing: 0 4px; border-collapse: separate;">
                <tr><td><i style="background: #0E5975; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> Ada Alokasi Unit</td></tr>
                <tr><td><i style="background: transparent; width:12px; height:12px; display:inline-block; border:1px solid #ccc; margin-right:4px;"></i> Tidak Ada Alokasi</td></tr>
            </table>
        `;
        return div;
    };
}

function getKabupatenName(p) { return p.nama_daerah || p.NAMOBJ || p.WADMKK || "Wilayah"; }
function normalizeName(name) { return String(name || "").toUpperCase().replace(/KABUPATEN/g, '').replace(/KAB\./g, '').trim(); }
function getColorRTLH(d) { return d > 20000 ? '#a50f15' : d > 10000 ? '#de2d26' : d > 5000 ? '#fb6a4a' : d > 2500 ? '#fcae91' : '#fee5d9'; }

function styleFillFeature(feature) {
    if (!currentMode || currentMode === 'rusun') return { fillOpacity: 0, weight: 0 };
    let kabFormat = normalizeName(getKabupatenName(feature.properties));
    
    if (currentMode === 'rtlh') {
        let d = sheetDataMap[kabFormat] || { rtlh: 0 };
        return { fillColor: getColorRTLH(d.rtlh), weight: 0, fillOpacity: 0.8 };
    } else if (currentMode === 'bsps') {
        let selectedYear = document.getElementById('bspsYearSelect').value;
        let yearMap = bspsMapByYear[selectedYear] || {};
        let units = yearMap[kabFormat] || 0;
        if (units > 0) {
            return { fillColor: '#0E5975', weight: 0, fillOpacity: 0.8 };
        } else {
            return { fillOpacity: 0, weight: 0 };
        }
    } else if (currentMode === 'rusus') {
        let units = rususMap[kabFormat] || 0;
        if (units > 0) {
            return { fillColor: '#0E5975', weight: 0, fillOpacity: 0.8 };
        } else {
            return { fillOpacity: 0, weight: 0 };
        }
    }
    return { fillOpacity: 0, weight: 0 };
}

function onEachFeature(feature, layer) {
    let namaKab = getKabupatenName(feature.properties);
    let keyFormat = normalizeName(namaKab);

    if (layer.getBounds && typeof L !== 'undefined') {
        let center = layer.getBounds().getCenter();
        let label = L.marker(center, {
            icon: L.divIcon({ className: 'custom-map-label', html: `<div style="font-size: 9px; font-weight: 800; color: #fff; text-shadow: 1px 1px 2px #000, -1px -1px 2px #000; text-align: center; text-transform: uppercase;">${namaKab}</div>`, iconSize: [90, 18], iconAnchor: [45, 9]}),
            interactive: false
        });
        if (labelLayerGroup) labelLayerGroup.addLayer(label);
        layer.labelMarker = label; 
    }

    layer.on({
        mouseover: (e) => { 
            if (currentMode && currentMode !== 'rusun') {
                e.target.setStyle({ fillColor: '#CBA355', fillOpacity: 0.6 }); 
            }
            if (layer.labelMarker) {
                let el = layer.labelMarker.getElement();
                if (el) el.style.opacity = '0.3';
            }
        },
        mouseout: (e) => { 
            if (currentMode && currentMode !== 'rusun') {
                e.target.setStyle(styleFillFeature(e.target.feature)); 
            }
            if (layer.labelMarker) {
                let el = layer.labelMarker.getElement();
                if (el) el.style.opacity = '1';
            }
        },
        click: (e) => {
            if (currentMode === 'rtlh') {
                let d = sheetDataMap[keyFormat] || { rtlh: 0, backlog: 0 };
                layer.bindPopup(`<b style="font-size:14px; color:#093C4F;">${namaKab}</b><hr style="margin:5px 0">RTLH: <b>${d.rtlh.toLocaleString('id-ID')}</b> Unit<br>Backlog: <b>${d.backlog.toLocaleString('id-ID')}</b> Unit`).openPopup();
            } else if (currentMode === 'bsps') {
                let selectedYear = document.getElementById('bspsYearSelect').value;
                let yearMap = bspsMapByYear[selectedYear] || {};
                let units = yearMap[keyFormat] || 0;
                layer.bindPopup(`<b style="font-size:14px; color:#093C4F;">${namaKab}</b><hr style="margin:5px 0">Tahun Anggaran: <b>${selectedYear}</b><br>Total BSPS: <b>${units.toLocaleString('id-ID')}</b> Unit`).openPopup();
            } else if (currentMode === 'rusus') {
                let units = rususMap[keyFormat] || 0;
                layer.bindPopup(`<b style="font-size:14px; color:#093C4F;">${namaKab}</b><hr style="margin:5px 0">Total Rumah Khusus (Rusus): <b>${units.toLocaleString('id-ID')}</b> Unit`).openPopup();
            }
        }
    });
}

function fetchDataSig(showLoading) {
    if (showLoading) document.getElementById('loadingModal').classList.remove('hidden');
    
    fetch(API_URL_SIG)
        .then(response => response.json())
        .then(data => {
            allDataSig = data; 
            processDataMaps();
            document.getElementById('loadingModal').classList.add('hidden');
            if (currentMode) changeMode(currentMode);
        })
        .catch(error => {
            console.error(error);
            document.getElementById('loadingModal').classList.add('hidden');
            alert("Gagal memuat data dari Spreadsheet. Pastikan URL Web App benar dan telah di-Deploy Ulang.");
        });
}

function processDataMaps() {
    bspsMapByYear = {};
    allDataSig.bsps.forEach(row => {
        let kab = row[0], unit = parseInt(row[3]) || 0, ta = String(row[4]).trim();
        if (kab && ta) {
            let norm = normalizeName(kab);
            if (!bspsMapByYear[ta]) bspsMapByYear[ta] = {};
            bspsMapByYear[ta][norm] = (bspsMapByYear[ta][norm] || 0) + unit;
        }
    });

    rususMap = {};
    allDataSig.rusus.forEach(row => {
        let kab = row[2], unit = parseInt(row[3]) || 0;
        if (kab) {
            let norm = normalizeName(kab);
            rususMap[norm] = (rususMap[norm] || 0) + unit;
        }
    });
}

function changeMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.btn-select').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + mode).classList.add('active');
    document.getElementById('map-mode-text').innerText = mode.toUpperCase();

    document.getElementById('dashboard-wrapper').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('bsps-filter-container').classList.add('hidden');

    if (pointLayerGroup) pointLayerGroup.clearLayers();
    
    if (activeLegend && mapSig) {
        mapSig.removeControl(activeLegend);
        activeLegend = null;
    }
    
    if (geojsonFillLayer) geojsonFillLayer.setStyle({fillOpacity: 0, weight: 0});
    if (mapSig) mapSig.closePopup();

    if (mode === 'rtlh') {
        renderRTLH();
        if (geojsonFillLayer) geojsonFillLayer.setStyle(styleFillFeature);
        if (legendRTLH && mapSig) legendRTLH.addTo(mapSig);
        activeLegend = legendRTLH;
    } else if (mode === 'rusun') {
        renderRusun();
    } else if (mode === 'bsps') {
        document.getElementById('bsps-filter-container').classList.remove('hidden');
        initBspsDropdown();
        renderBSPS();
        if (legendBSPS && mapSig) legendBSPS.addTo(mapSig);
        activeLegend = legendBSPS;
    } else if (mode === 'rusus') {
        renderRusus();
        if (geojsonFillLayer) geojsonFillLayer.setStyle(styleFillFeature);
        if (legendRusus && mapSig) legendRusus.addTo(mapSig);
        activeLegend = legendRusus;
    }
}

function renderRTLH() {
    let labels = [], rtlhData = [], backlogData = [];
    let totalRTLH = 0, totalBacklog = 0, validCount = 0;
    sheetDataMap = {};
    let tbody = '';

    allDataSig.rtlh.forEach((row, i) => {
        let kab = row[0], rtlh = parseInt(row[1]) || 0, backlog = parseInt(row[2]) || 0;
        if (kab) {
            labels.push(kab); 
            rtlhData.push(rtlh); 
            backlogData.push(backlog);
            totalRTLH += rtlh; 
            totalBacklog += backlog; 
            validCount++;
            sheetDataMap[normalizeName(kab)] = { rtlh, backlog };
            
            tbody += `<tr class="hover:bg-slate-50"><td class="py-2 px-4 text-center">${i+1}</td><td class="py-2 px-4 font-semibold">${kab}</td><td class="py-2 px-4 text-right text-brand-darkteal font-bold">${rtlh.toLocaleString('id-ID')}</td><td class="py-2 px-4 text-right text-brand-gold font-bold">${backlog.toLocaleString('id-ID')}</td></tr>`;
        }
    });

    document.getElementById('stats-container').innerHTML = `
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-brand-teal text-white flex items-center justify-center text-xl"><i class="fa-solid fa-house-chimney-crack"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Total RTLH</p><h3 class="text-2xl font-extrabold text-brand-darkteal">${totalRTLH.toLocaleString('id-ID')}</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-brand-gold text-slate-900 flex items-center justify-center text-xl"><i class="fa-solid fa-house-medical-circle-exclamation"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Total Backlog</p><h3 class="text-2xl font-extrabold text-brand-darkteal">${totalBacklog.toLocaleString('id-ID')}</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl"><i class="fa-solid fa-map-location-dot"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Kabupaten/Kota</p><h3 class="text-2xl font-extrabold text-emerald-600">${validCount} Wilayah</h3></div>
        </div>
    `;

    document.getElementById('table-head').innerHTML = `<tr><th class="py-3 px-4 w-12 text-center">No</th><th class="py-3 px-4">Kabupaten / Kota</th><th class="py-3 px-4 text-right">Jumlah RTLH</th><th class="py-3 px-4 text-right">Jumlah Backlog</th></tr>`;
    document.getElementById('table-body').innerHTML = tbody || '<tr><td colspan="4" class="text-center py-4">Data kosong</td></tr>';

    document.getElementById('chart-title').innerText = "Grafik RTLH & Backlog";
    renderChart(labels, [
        { label: 'RTLH', data: rtlhData, backgroundColor: '#0E5975', borderRadius: 4 },
        { label: 'Backlog', data: backlogData, backgroundColor: '#CBA355', borderRadius: 4 }
    ]);
}

function renderRusun() {
    let tbody = '';
    let kabCounts = {};
    let totalRusun = 0;

    allDataSig.rusun.forEach((row, i) => {
        let kab = row[0], nama = row[1], coords = row[2], lokasi = row[3], ta = row[4], foto = row[5];
        if (kab) {
            totalRusun++;
            kabCounts[kab] = (kabCounts[kab] || 0) + 1;
            
            tbody += `<tr class="hover:bg-slate-50"><td class="py-2 px-4 text-center">${i+1}</td><td class="py-2 px-4 font-semibold">${kab}</td><td class="py-2 px-4">${nama}</td><td class="py-2 px-4 text-sm">${lokasi}</td><td class="py-2 px-4 text-center">${ta}</td></tr>`;
            
            if (coords && coords.includes(',') && typeof L !== 'undefined') {
                let [lat, lng] = coords.split(',').map(c => parseFloat(c.trim()));
                if (!isNaN(lat) && !isNaN(lng)) {
                    let imgHtml = foto ? `<img src="${foto}" style="width:100%; height:120px; object-fit:cover; margin-top:8px; border-radius:6px;">` : '';
                    let marker = L.marker([lat, lng]).bindPopup(`
                        <div style="font-family:'Plus Jakarta Sans', sans-serif; width:220px;">
                            <b style="font-size:14px; color:#093C4F;">${nama}</b><br>
                            <span style="font-size:11px; color:#64748B;">Kab. ${kab} | TA: ${ta}</span>
                            <hr style="margin:6px 0;">
                            <div style="font-size:12px;">Lokasi: ${lokasi}</div>
                            ${imgHtml}
                        </div>
                    `);
                    if (pointLayerGroup) pointLayerGroup.addLayer(marker);
                }
            }
        }
    });

    let totalKab = Object.keys(kabCounts).length;
    document.getElementById('stats-container').innerHTML = `
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4 md:col-span-1">
            <div class="w-12 h-12 rounded-full bg-brand-teal text-white flex items-center justify-center text-xl"><i class="fa-solid fa-building"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Total Rumah Susun</p><h3 class="text-2xl font-extrabold text-brand-darkteal">${totalRusun} Unit</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4 md:col-span-2">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl"><i class="fa-solid fa-map-location-dot"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Tersebar di</p><h3 class="text-2xl font-extrabold text-emerald-600">${totalKab} Kabupaten/Kota</h3></div>
        </div>
    `;

    document.getElementById('table-head').innerHTML = `<tr><th class="py-3 px-4 w-12 text-center">No</th><th class="py-3 px-4">Kabupaten</th><th class="py-3 px-4">Nama Rusun</th><th class="py-3 px-4">Lokasi</th><th class="py-3 px-4 text-center">TA</th></tr>`;
    document.getElementById('table-body').innerHTML = tbody || '<tr><td colspan="5" class="text-center py-4">Data kosong</td></tr>';

    renderChart(Object.keys(kabCounts), [
        { label: 'Jumlah Rusun', data: Object.values(kabCounts), backgroundColor: '#0E5975', borderRadius: 4 }
    ]);
    document.getElementById('chart-title').innerText = "Sebaran Rusun Berdasarkan Kabupaten";
}

function initBspsDropdown() {
    let yearsSet = new Set();
    allDataSig.bsps.forEach(row => {
        let ta = row[4];
        if (ta) yearsSet.add(String(ta).trim());
    });
    let years = Array.from(yearsSet).sort().reverse();
    let selectEl = document.getElementById('bspsYearSelect');
    selectEl.innerHTML = '';
    years.forEach(y => {
        selectEl.innerHTML += `<option value="${y}">Tahun ${y}</option>`;
    });
}

function renderBSPS() {
    let selectedYear = document.getElementById('bspsYearSelect').value;
    let tbody = '';
    let totalUnits = 0;
    let kabCounts = {};
    let filteredData = allDataSig.bsps.filter(row => String(row[4]).trim() === selectedYear);

    filteredData.forEach((row, i) => {
        let kab = row[0], kec = row[1], desa = row[2], unit = parseInt(row[3]) || 0, ta = row[4], foto = row[5];
        if (kab) {
            totalUnits += unit;
            kabCounts[kab] = (kabCounts[kab] || 0) + unit;

            let fotoBadge = foto ? `<a href="${foto}" target="_blank" class="text-brand-teal underline font-semibold"><i class="fa-solid fa-image"></i> Lihat</a>` : '-';
            tbody += `<tr class="hover:bg-slate-50">
                <td class="py-2 px-4 text-center">${i+1}</td>
                <td class="py-2 px-4 font-semibold">${kab}</td>
                <td class="py-2 px-4">${kec}</td>
                <td class="py-2 px-4">${desa}</td>
                <td class="py-2 px-4 text-right font-bold text-brand-darkteal">${unit.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-center">${fotoBadge}</td>
            </tr>`;
        }
    });

    if (geojsonFillLayer) geojsonFillLayer.setStyle(styleFillFeature);

    let totalKab = Object.keys(kabCounts).length;
    document.getElementById('stats-container').innerHTML = `
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-brand-gold text-slate-900 flex items-center justify-center text-xl"><i class="fa-solid fa-hammer"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Total Unit BSPS (${selectedYear})</p><h3 class="text-2xl font-extrabold text-brand-darkteal">${totalUnits.toLocaleString('id-ID')} Unit</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4 md:col-span-2">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl"><i class="fa-solid fa-map-location-dot"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Cakupan Wilayah</p><h3 class="text-2xl font-extrabold text-emerald-600">${totalKab} Kabupaten/Kota</h3></div>
        </div>
    `;

    document.getElementById('table-head').innerHTML = `<tr><th class="py-3 px-4 w-12 text-center">No</th><th class="py-3 px-4">Kabupaten</th><th class="py-3 px-4">Kecamatan</th><th class="py-3 px-4">Desa/Kelurahan</th><th class="py-3 px-4 text-right">Jumlah Unit</th><th class="py-3 px-4 text-center">Foto</th></tr>`;
    document.getElementById('table-body').innerHTML = tbody || '<tr><td colspan="6" class="text-center py-4">Tidak ada data untuk tahun ini.</td></tr>';

    document.getElementById('chart-title').innerText = `Sebaran Unit BSPS Per Kabupaten (Tahun ${selectedYear})`;
    renderChart(Object.keys(kabCounts), [
        { label: 'Jumlah Unit BSPS', data: Object.values(kabCounts), backgroundColor: '#0E5975', borderRadius: 4 }
    ]);
}

function renderRusus() {
    let tbody = '';
    let totalRususUnits = 0;
    let kabCounts = {};

    allDataSig.rusus.forEach((row, i) => {
        let nama = row[0], lokasi = row[1], kab = row[2], unit = parseInt(row[3]) || 0, ta = row[4], foto = row[5];
        if (kab || nama) {
            totalRususUnits += unit;
            if (kab) kabCounts[kab] = (kabCounts[kab] || 0) + unit;

            let fotoBadge = foto ? `<a href="${foto}" target="_blank" class="text-brand-teal underline font-semibold"><i class="fa-solid fa-image"></i> Lihat</a>` : '-';
            tbody += `<tr class="hover:bg-slate-50">
                <td class="py-2 px-4 text-center">${i+1}</td>
                <td class="py-2 px-4 font-semibold">${nama || '-'}</td>
                <td class="py-2 px-4">${lokasi || '-'}</td>
                <td class="py-2 px-4">${kab || '-'}</td>
                <td class="py-2 px-4 text-right font-bold text-brand-darkteal">${unit.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-center">${ta || '-'}</td>
                <td class="py-2 px-4 text-center">${fotoBadge}</td>
            </tr>`;
        }
    });

    document.getElementById('stats-container').innerHTML = `
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4 md:col-span-1">
            <div class="w-12 h-12 rounded-full bg-brand-teal text-white flex items-center justify-center text-xl"><i class="fa-solid fa-house-flag"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Total Rumah Khusus (Rusus)</p><h3 class="text-2xl font-extrabold text-brand-darkteal">${totalRususUnits.toLocaleString('id-ID')} Unit</h3></div>
        </div>
        <div class="bg-white rounded-2xl shadow border border-slate-100 p-5 flex items-center gap-4 md:col-span-2">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl"><i class="fa-solid fa-map-location-dot"></i></div>
            <div><p class="text-xs text-slate-500 font-bold uppercase">Wilayah Cakupan</p><h3 class="text-2xl font-extrabold text-emerald-600">${Object.keys(kabCounts).length} Kabupaten/Kota</h3></div>
        </div>
    `;

    document.getElementById('table-head').innerHTML = `<tr><th class="py-3 px-4 w-12 text-center">No</th><th class="py-3 px-4">Nama Rusun</th><th class="py-3 px-4">Lokasi</th><th class="py-3 px-4">Kabupaten</th><th class="py-3 px-4 text-right">Jumlah Unit</th><th class="py-3 px-4 text-center">TA</th><th class="py-3 px-4 text-center">Foto</th></tr>`;
    document.getElementById('table-body').innerHTML = tbody || '<tr><td colspan="7" class="text-center py-4">Data kosong</td></tr>';

    document.getElementById('chart-title').innerText = "Sebaran Rumah Khusus Berdasarkan Kabupaten";
    renderChart(Object.keys(kabCounts), [
        { label: 'Jumlah Unit Rusus', data: Object.values(kabCounts), backgroundColor: '#0E5975', borderRadius: 4 }
    ]);
}

function renderChart(labels, datasets) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { beginAtZero: true, grid: { drawBorder: false } },
                x: { grid: { display: false } }
            }
        }
    });
}
