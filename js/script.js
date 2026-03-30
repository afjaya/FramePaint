console.log("Cek JSZip:", typeof JSZip); 

if (typeof JSZip !== "undefined") {
    console.log("✅ JSZip Siap Tempur!");
} else {
    console.error("❌ JSZip Belum Terbaca, Bos!");
}

const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const timeline = document.getElementById('timeline');
const counter = document.getElementById('frame-counter');

let frames = [];
let drawing = false;
let isPlaying = false;

// Setup Ukuran Canvas
canvas.width = 800;
canvas.height = 600;
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000';

// --- LOGIKA MENGGAMBAR ---
function startDraw(e) { drawing = true; draw(e); }
function endDraw() { drawing = false; ctx.beginPath(); }

function draw(e) {
    if (!drawing || isPlaying) return;

    const rect = canvas.getBoundingClientRect();
    
    // Ambil koordinat mouse/touch
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    // KALIBRASI: Kurangi posisi mouse dengan posisi Canvas, 
    // lalu sesuaikan dengan skala asli canvas (800x600)
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', endDraw);

// --- FITUR FRAME ---
function saveFrame() {
    if (frames.length < 99) {
        const data = canvas.toDataURL();
        frames.push(data);
        renderOnionSkin(data);
        updateUI();
    }
}

function renderOnionSkin(imgData) {
    // 1. Bersihkan canvas untuk frame baru
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let img = new Image();
    img.src = imgData;
    img.onload = () => {
        // Simpan settingan canvas asli
        ctx.save();
        
        // 2. Gambar frame sebelumnya
        ctx.globalAlpha = 0.3; // Transparansi 30% agar tidak terlalu pekat
        ctx.drawImage(img, 0, 0);
        
        // 3. JURUS SAKTI: Ubah warna gambar jadi Merah
        // 'source-in' artinya warna hanya muncul di atas goresan gambar
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#5a0d0d'; // Warna Merah Terang
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Kembalikan ke mode normal untuk menggambar selanjutnya
        ctx.restore();
        ctx.globalAlpha = 1.8;
    };
}

function updateUI() {
    timeline.innerHTML = frames.map((f, i) => `
        <div class="frame-thumb"><img src="${f}" width="100%"></div>
    `).join('');
    counter.innerText = `${frames.length} / 99 Frames`;
}

function playAnimation() {
    if (frames.length === 0 || isPlaying) return;
    isPlaying = true;
    let i = 0;
    const timer = setInterval(() => {
        const img = new Image();
        img.src = frames[i];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        i++;
        if (i >= frames.length) {
            clearInterval(timer);
            isPlaying = false;
        }
    }, 150);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(confirm("Hapus semua frame?")) {
        frames = [];
        updateUI();
    }
}

function deleteLastFrame() {
    frames.pop();
    updateUI();
    if(frames.length > 0) renderOnionSkin(frames[frames.length-1]);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loadLast() {
    if (frames.length > 0) {
        let img = new Image();
        img.src = frames[frames.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

let gridVisible = false;

function toggleGrid() {
    gridVisible = !gridVisible;
    const btnGrid = document.getElementById('btn-grid');
    
    if (gridVisible) {
        canvas.classList.add('show-grid');
        btnGrid.innerText = "HIDE GRID";
        btnGrid.style.background = "#555"; // Warna saat aktif
    } else {
        canvas.classList.remove('show-grid');
        btnGrid.innerText = "SHOW GRID";
        btnGrid.style.background = "#6c757d"; // Warna normal
    }
}
// --- FITUR SAVE SCENE (Ke Memori Browser) ---
function saveScene() {
    if (frames.length === 0) return alert("Belum ada frame untuk disimpan, Bos!");
    
    // Simpan array frames ke LocalStorage
    localStorage.setItem('pivot_paint_save', JSON.stringify(frames));
    alert("Scene berhasil disimpan di browser! Aman kalau di-refresh.");
}

// Tambahkan ini agar otomatis Load saat web dibuka
window.onload = () => {
    const savedData = localStorage.getItem('pivot_paint_save');
    if (savedData) {
        if (confirm("Ada scene tersimpan, mau lanjutin?")) {
            frames = JSON.parse(savedData);
            updateUI();
            if (frames.length > 0) renderOnionSkin(frames[frames.length - 1]);
        }
    }
};

// --- FITUR DOWNLOAD ALL (Export Frame sebagai ZIP) ---
// Gunakan nama ini agar sinkron dengan HTML
async function downloadAsZip() {
    if (frames.length === 0) return alert("Belum ada frame, Bos!");

    const zip = new JSZip();
    const folderName = "BangBroMedia_Animasi_" + new Date().getTime();
    const imgFolder = zip.folder(folderName);

    // --- TAMBAHKAN COPYRIGHT FILE ---
    zip.file("COPYRIGHT.txt", "Project ini dibuat menggunakan Pivot Paint Web\nCopyright © 2026 Bang Bro Media\nAll Rights Reserved.");

    console.log("Memulai proses ZIP oleh BangBroMedia...");
    // ... sisa kode frames.forEach ...

    frames.forEach((data, index) => {
        const imageData = data.split('base64,')[1];
        const fileName = `frame_${(index + 1).toString().padStart(3, '0')}.png`;
        imgFolder.file(fileName, imageData, {base64: true});
    });

    zip.generateAsync({type: "blob"}).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${folderName}.zip`;
        link.click();
        console.log("ZIP Berhasil didownload!");
    });
}

// --- FITUR SHORTCUT KEYBOARD ---
window.addEventListener('keydown', (e) => {
    // Kita cek, kalau lagi ngetik di input (jika nanti ada), shortcut jangan jalan
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.code) {
        case 'Space': 
            e.preventDefault(); // Biar halaman nggak scroll ke bawah pas tekan spasi
            saveFrame();
            console.log("Shortcut: Frame Saved!");
            break;
            
        case 'Enter':
            playAnimation();
            break;
            
        case 'KeyZ':
            if (e.ctrlKey) { // Ctrl + Z buat hapus frame terakhir
                deleteLastFrame();
            }
            break;

        case 'KeyG': // Tekan 'G' buat munculin/hapus Grid
            toggleGrid();
            break;
    }
});

const customCursor = document.getElementById('custom-cursor');

// Pantau pergerakan mouse di seluruh layar
window.addEventListener('mousemove', (e) => {
    // Update posisi kursor custom
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';

    // Cek apakah mouse ada di atas canvas
    const rect = canvas.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
        customCursor.style.display = 'block';
    } else {
        customCursor.style.display = 'none';
    }
});

// Update ukuran kursor custom sesuai lineWidth canvas
// ... (Bagian atas setup canvas tetap sama sampai fungsi draw)

function updateBrushSize(size) {
    ctx.lineWidth = size;
    document.getElementById('size-num').innerText = size + "px";
    updateCursorDisplay();
}

function changeColor(color, element) {
    currentColor = color;
    ctx.strokeStyle = color;
    
    // Update warna kursor
    customCursor.style.borderColor = color;

    document.querySelectorAll('.color-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
}

function updateCursorDisplay() {
    customCursor.style.width = ctx.lineWidth + 'px';
    customCursor.style.height = ctx.lineWidth + 'px';
}

// Tambahkan update kursor saat ganti warna di color picker
document.getElementById('color-picker').addEventListener('input', (e) => {
    changeColor(e.target.value);
});

// Panggil di awal agar sinkron
updateBrushSize(5);

