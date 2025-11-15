
# OceanMood: Sistem Analisis "Suasana Laut" dan Dinamika Populasi Ikan

OceanMood adalah sistem inovatif berbasis AI dan Business Intelligence yang dirancang untuk menganalisis suasana laut (mood laut) berdasarkan data oseanografi — seperti Suhu Permukaan Laut (SPL), Klorofil-a, dan TSS — guna memahami pola perubahan populasi ikan di suatu wilayah perairan.

## Fitur Utama

- **Dashboard Interaktif**: Visualisasi data real-time parameter oseanografi
- **Analisis Spasial**: Peta sebaran "suasana laut" di berbagai wilayah perairan Indonesia
- **Analisis Temporal**: Tren perubahan parameter oseanografi dan populasi ikan dari waktu ke waktu
- **Prediksi Populasi Ikan**: Model prediksi berbasis AI untuk memperkirakan populasi ikan 7 hari ke depan
- **Analisis Korelasi**: Hubungan antara parameter oseanografi dengan dinamika populasi ikan

## Parameter Oseanografi yang Dipantau

1. **Suhu Permukaan Laut (SPL)**: Mengukur suhu di permukaan laut yang mempengaruhi distribusi ikan
2. **Klorofil-a**: Indikator produktivitas primer dan ketersediaan makanan bagi ikan
3. **Total Suspended Solid (TSS)**: Kekeruhan air yang mempengaruhi penetrasi cahaya dan habitat ikan

## Cara Menjalankan Aplikasi

1. Clone repositori ini
2. Buat lingkungan virtual:
   ```
   python -m venv venv
   source venv/bin/activate  # Untuk Linux/Mac
   venv\Scriptsctivate     # Untuk Windows
   ```
3. Install dependensi:
   ```
   pip install -r requirements.txt
   ```
4. Jalankan aplikasi:
   ```
   python app.py
   ```
5. Buka browser dan akses `http://localhost:5000`

## Teknologi yang Digunakan

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Visualisasi**: Chart.js, Leaflet.js
- **AI Model**: LSTM (Long Short-Term Memory) untuk prediksi

## Tim Pengembang

- [Nama Anda] - Lead Developer
- [Nama Anggota Tim] - Data Scientist
- [Nama Anggota Tim] - UI/UX Designer

## Lisensi

Proyek ini dilisensikan under MIT License - lihat file [LICENSE](LICENSE) untuk detailnya.

## Kontak

- Email: info@oceanmood.id
- Website: www.oceanmood.id
