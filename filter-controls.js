
/**
 * Filter Controls JavaScript
 * Mengendalikan komponen filter dan integrasinya dengan berbagai elemen visual
 */

// State untuk menyimpan filter yang aktif
const filterState = {
    location: '',
    dateRange: 30,
    parameter: 'all'
};

// Event listener untuk saat DOM dimuat
document.addEventListener('DOMContentLoaded', function() {


/**
 * Terapkan filter ke semua komponen visual
 */
function applyFilters() {
    // Tampilkan indikator loading
    showLoading();

    // Terapkan filter ke peta
    applyFilterToMap();

    // Terapkan filter ke grafik
    applyFilterToCharts();

    // Terapkan filter ke statistik
    applyFilterToStats();

    // Perbarui analisis berdasarkan filter
    updateAnalysis();

    // Sembunyikan indikator loading setelah selesai
    setTimeout(hideLoading, 1000);
}

/**
 * Reset semua filter ke nilai default
 */
function resetFilters() {
    // Reset state filter
    filterState.location = '';
    filterState.dateRange = 30;
    filterState.parameter = 'all';

    // Reset UI filter
    document.getElementById('location-filter').value = '';
    document.getElementById('date-range-filter').value = '30';
    document.getElementById('parameter-filter').value = 'all';

    // Terapkan filter yang telah di-reset
    applyFilters();
}

/**
 * Terapkan filter ke peta
 */
function applyFilterToMap() {
    // Jika lokasi dipilih, fokuskan peta ke lokasi tersebut
    if (filterState.location) {
        fetch('/api/location_data')
            .then(response => response.json())
            .then(data => {
                const locationIndex = parseInt(filterState.location) - 1;
                if (data[locationIndex]) {
                    const location = data[locationIndex];

                    // Fokuskan peta ke lokasi yang dipilih
                    if (window.map) {
                        window.map.setView([location.lat, location.lng], 7);

                        // Buka popup marker lokasi
                        window.map.eachLayer(function(layer) {
                            if (layer instanceof L.Marker) {
                                const markerLatLng = layer.getLatLng();
                                if (Math.abs(markerLatLng.lat - location.lat) < 0.1 &&
                                    Math.abs(markerLatLng.lng - location.lng) < 0.1) {
                                    layer.openPopup();
                                }
                            }
                        });
                    }

                    // Fokuskan peta SPL ke lokasi yang dipilih
                    if (window.splMap) {
                        window.splMap.setView([location.lat, location.lng], 7);

                        // Buka popup marker lokasi
                        window.splMap.eachLayer(function(layer) {
                            if (layer instanceof L.Marker) {
                                const markerLatLng = layer.getLatLng();
                                if (Math.abs(markerLatLng.lat - location.lat) < 0.1 &&
                                    Math.abs(markerLatLng.lng - location.lng) < 0.1) {
                                    layer.openPopup();
                                }
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching location data:', error);
            });
    }
}

/**
 * Terapkan filter ke grafik
 */
function applyFilterToCharts() {
    // Ambil data oseanografi dengan rentang tanggal yang dipilih
    fetch(`/api/ocean_data?days=${filterState.dateRange}`)
        .then(response => response.json())
        .then(data => {
            // Filter data berdasarkan parameter yang dipilih
            const filteredData = filterDataByParameter(data);

            // Perbarui grafik SPL dan Klorofil-a
            updateSplChlorophyllChart(filteredData);

            // Perbarui grafik populasi ikan
            updatePopulationChart(filteredData);
        })
        .catch(error => {
            console.error('Error fetching ocean data:', error);
        });
}

/**
 * Terapkan filter ke statistik
 */
function applyFilterToStats() {
    // Ambil data statistik berdasarkan filter
    fetch(`/api/ocean_data?days=${filterState.dateRange}`)
        .then(response => response.json())
        .then(data => {
            // Jika lokasi dipilih, filter data berdasarkan lokasi
            if (filterState.location) {
                // Di aplikasi nyata, ini akan memfilter data berdasarkan lokasi
                // Untuk simulasi, kita akan menggunakan data yang sama
            }

            // Hitung nilai rata-rata
            const avgSpl = calculateAverage(data.spl);
            const avgKlorofil = calculateAverage(data.klorofil_a);
            const avgTss = calculateAverage(data.tss);
            const avgPopulasi = calculateAverage(data.populasi);

            // Perbarui nilai statistik dengan animasi
            animateValue("spl-value", 0, avgSpl, 2000, "°C");
            animateValue("klorofil-value", 0, avgKlorofil, 2000, " mg/m³");
            animateValue("tss-value", 0, avgTss, 2000, " mg/L");
            animateValue("fish-value", 0, avgPopulasi, 2000, " ton");
        })
        .catch(error => {
            console.error('Error fetching ocean data:', error);
        });
}

/**
 * Filter data berdasarkan parameter yang dipilih
 */
function filterDataByParameter(data) {
    if (filterState.parameter === 'all') {
        return data;
    }

    // Di aplikasi nyata, ini akan memfilter data berdasarkan parameter yang dipilih
    // Untuk simulasi, kita akan mengembalikan data yang sama
    return data;
}

/**
 * Perbarui grafik SPL dan Klorofil-a
 */
function updateSplChlorophyllChart(data) {
    // Dapatkan konteks canvas
    const ctx = document.getElementById('spl-chlorophyll-chart');
    if (!ctx) return;

    // Dapatkan instance chart yang ada
    const chart = Chart.getChart(ctx);
    if (!chart) return;

    // Perbarui data chart
    chart.data.labels = data.dates;
    chart.data.datasets[0].data = data.spl;
    chart.data.datasets[1].data = data.klorofil_a;

    // Perbarui chart
    chart.update();
}

/**
 * Perbarui grafik populasi ikan
 */
function updatePopulationChart(data) {
    // Dapatkan konteks canvas
    const ctx = document.getElementById('population-chart');
    if (!ctx) return;

    // Dapatkan instance chart yang ada
    const chart = Chart.getChart(ctx);
    if (!chart) return;

    // Perbarui data chart
    chart.data.labels = data.dates;
    chart.data.datasets[0].data = data.populasi;

    // Perbarui chart
    chart.update();
}

/**
 * Perbarui analisis berdasarkan filter
 */
function updateAnalysis() {
    // Ambil data analisis
    fetch(`/api/ocean_data?days=${filterState.dateRange}`)
        .then(response => response.json())
        .then(data => {
            // Analisis tren populasi
            const firstValue = data.populasi[0];
            const lastValue = data.populasi[data.populasi.length - 1];
            const trend = lastValue > firstValue ? 'naik' : 'turun';
            const percentage = Math.abs((lastValue - firstValue) / firstValue * 100).toFixed(1);

            // Update teks analisis tren
            const trendAnalysis = document.getElementById('trend-analysis');
            if (trendAnalysis) {
                if (trend === 'naik') {
                    trendAnalysis.textContent = `Populasi ikan menunjukkan peningkatan sebesar ${percentage}% dalam ${filterState.dateRange} hari terakhir, terutama dipengaruhi oleh penurunan suhu permukaan laut dan peningkatan klorofil-a.`;
                } else {
                    trendAnalysis.textContent = `Populasi ikan menunjukkan penurunan sebesar ${percentage}% dalam ${filterState.dateRange} hari terakhir, terutama dipengaruhi oleh kenaikan suhu permukaan laut dan penurunan klorofil-a.`;
                }
            }

            // Update analisis populasi
            const populationAnalysis = document.getElementById('population-analysis');
            if (populationAnalysis) {
                populationAnalysis.textContent = `Populasi ikan menunjukkan pola musiman dengan peningkatan signifikan pada bulan-bulan tertentu, berkorelasi dengan fluktuasi klorofil-a dan SPL di wilayah tersebut.`;
            }
        })
        .catch(error => {
            console.error('Error fetching ocean data:', error);
        });
}

/**
 * Tampilkan indikator loading
 */
function showLoading() {
    // Buat elemen loading jika belum ada
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingOverlay.style.zIndex = '9999';
        loadingOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }

    // Tampilkan loading
    loadingOverlay.style.display = 'flex';
}

/**
 * Sembunyikan indikator loading
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Hitung nilai rata-rata dari array
 */
function calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return (sum / arr.length).toFixed(1);
}

/**
 * Animasi nilai untuk elemen statistik
 */
function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;

    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    let timer;

    function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = Math.round(end - (remaining * range));
        obj.innerHTML = value + suffix;
        if (value == end) {
            clearInterval(timer);
        }
    }

    timer = setInterval(run, stepTime);
    run();
}
});