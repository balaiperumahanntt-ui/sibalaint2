document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Inisialisasi AOS (Animasi Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 50 });
    }

    // 2. Logika Floating Action Button (FAB) & Dialog Form
    const fabBtn = document.getElementById('fabPengaduan');
    const dialogBox = document.getElementById('dialogPengaduan');
    const closeBtn = document.getElementById('closeDialog');

    if (fabBtn && dialogBox) {
        fabBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            dialogBox.classList.toggle('show'); 
        });
    }

    if (closeBtn && dialogBox) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            dialogBox.classList.remove('show'); 
        });
    }

    // 3. API Fetch (Disesuaikan dari kode lama jika masih digunakan)
    fetch('api/get_konten.php')
        .then(response => response.json())
        .then(data => {
            let container = document.getElementById('konten-list');
            if(container) { 
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
            }
        })
        .catch(error => console.log('Fetch API tidak aktif / tidak ditemukan'));
});