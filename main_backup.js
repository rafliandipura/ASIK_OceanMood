// // backup-fixed.js
// // Safe / defensive version of your backup.js
// document.addEventListener('DOMContentLoaded', () => {

//   // --- helper: safe get canvas context ---
//   function getCtx(id) {
//     const el = document.getElementById(id);
//     if (!el) return null;
//     try {
//       return el.getContext('2d');
//     } catch (e) {
//       console.warn(`Element #${id} exists but no 2D context:`, e);
//       return null;
//     }
//   }

//   // --- CHARTS: fetch data and create charts only if canvas exist ---
//   fetch('/api/ocean_data')
//     .then(res => res.json())
//     .then(data => {
//       if (!data) {
//         console.warn('API /api/ocean_data returned empty');
//         return;
//       }

//       // ensure arrays exist
//       data.dates = Array.isArray(data.dates) ? data.dates : [];
//       data.spl = Array.isArray(data.spl) ? data.spl : [];
//       data.klorofil_a = Array.isArray(data.klorofil_a) ? data.klorofil_a : [];
//       data.populasi = Array.isArray(data.populasi) ? data.populasi : [];

//       // SPL + Klorofil chart
//       const splCtx = getCtx('spl-chlorophyll-chart');
//       if (splCtx && typeof Chart !== 'undefined') {
//         // avoid creating multiple charts on re-run
//         if (Chart.getChart(splCtx.canvas)) Chart.getChart(splCtx.canvas).destroy();

//         new Chart(splCtx, {
//           type: 'line',
//           data: {
//             labels: data.dates,
//             datasets: [
//               {
//                 label: 'SPL (°C)',
//                 data: data.spl,
//                 borderColor: '#ff6384',
//                 backgroundColor: 'rgba(255,99,132,0.1)',
//                 tension: 0.4,
//                 fill: false,
//                 yAxisID: 'y-spl'
//               },
//               {
//                 label: 'Klorofil-a (mg/m³)',
//                 data: data.klorofil_a,
//                 borderColor: '#36a2eb',
//                 backgroundColor: 'rgba(54,162,235,0.1)',
//                 tension: 0.4,
//                 fill: false,
//                 yAxisID: 'y-chlorophyll'
//               }
//             ]
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//               legend: { position: 'top' },
//               tooltip: { mode: 'index', intersect: false }
//             },
//             scales: {
//               'y-spl': {
//                 type: 'linear',
//                 display: true,
//                 position: 'left',
//                 title: { display: true, text: 'SPL (°C)' }
//               },
//               'y-chlorophyll': {
//                 type: 'linear',
//                 display: true,
//                 position: 'right',
//                 title: { display: true, text: 'Klorofil-a (mg/m³)' },
//                 grid: { drawOnChartArea: false }
//               }
//             }
//           }
//         });
//       } else {
//         if (!splCtx) console.info('Canvas #spl-chlorophyll-chart tidak ditemukan — lewati rendering chart SPL+Klorofil');
//         if (typeof Chart === 'undefined') console.warn('Chart.js tidak ditemukan. Pastikan script Chart.js dimuat.');
//       }

//       // Populasi chart
//       const popCtx = getCtx('population-chart') || getCtx('fish-chart');
//       if (popCtx && typeof Chart !== 'undefined') {
//         if (Chart.getChart(popCtx.canvas)) Chart.getChart(popCtx.canvas).destroy();
//         new Chart(popCtx, {
//           type: 'line',
//           data: {
//             labels: data.dates,
//             datasets: [{
//               label: 'Populasi Ikan (ton)',
//               data: data.populasi,
//               borderColor: '#ffc107',
//               backgroundColor: 'rgba(255,193,7,0.1)',
//               tension: 0.4,
//               fill: true
//             }]
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: { legend: { position: 'top' } },
//             scales: { y: { beginAtZero: false } }
//           }
//         });
//       } else {
//         if (!popCtx) console.info('Canvas #population-chart / #fish-chart tidak ditemukan — lewati rendering chart populasi');
//       }

//       // update trend text safely
//       const trendAnalysis = document.getElementById('trend-analysis');
//       if (trendAnalysis && data.populasi.length >= 2) {
//         const firstValue = Number(data.populasi[0]) || 0;
//         const lastValue = Number(data.populasi[data.populasi.length - 1]) || 0;
//         if (firstValue === 0) {
//           trendAnalysis.textContent = 'Data populasi tidak cukup untuk analisis tren.';
//         } else {
//           const trend = lastValue > firstValue ? 'naik' : 'turun';
//           const percentage = Math.abs(((lastValue - firstValue) / firstValue) * 100).toFixed(1);
//           if (trend === 'naik') {
//             trendAnalysis.textContent = `Populasi ikan menunjukkan peningkatan sebesar ${percentage}% dalam periode data yang tersedia.`;
//           } else {
//             trendAnalysis.textContent = `Populasi ikan menunjukkan penurunan sebesar ${percentage}% dalam periode data yang tersedia.`;
//           }
//         }
//       }

//     })
//     .catch(err => {
//       console.error('Error fetching ocean data:', err);
//     });

//   // --- Buttons: safe attach (if element exists) ---
//   const startBtn = document.getElementById('startAnalysis');
//   if (startBtn) {
//     startBtn.addEventListener('click', () => {
//       const target = document.getElementById('analysis') || document.body;
//       target.scrollIntoView({ behavior: 'smooth' });
//     });
//   }

//   const learnBtn = document.getElementById('learnMore');
//   if (learnBtn) {
//     learnBtn.addEventListener('click', () => {
//       const target = document.getElementById('about') || document.body;
//       target.scrollIntoView({ behavior: 'smooth' });
//     });
//   }

//   // --- Dropdown location items: check length before binding ---
//   const locationDropdownItems = document.querySelectorAll('#locationDropdown + .dropdown-menu .dropdown-item');
//   if (locationDropdownItems && locationDropdownItems.length) {
//     locationDropdownItems.forEach(item => {
//       item.addEventListener('click', function (e) {
//         e.preventDefault();
//         const label = this.textContent.trim();
//         const dd = document.getElementById('locationDropdown');
//         if (dd) dd.innerHTML = '<i class="fas fa-map-pin me-1"></i> ' + label;

//         fetch('/api/location_data')
//           .then(r => r.json())
//           .then(locations => {
//             const location = locations.find(l => l.name === label);
//             if (location) {
//               if (window.map && typeof window.map.setView === 'function') window.map.setView([location.lat, location.lng], 7);
//               if (window.map) {
//                 window.map.eachLayer(layer => {
//                   if (layer instanceof L.Marker) {
//                     const m = layer.getLatLng();
//                     if (Math.abs(m.lat - location.lat) < 0.1 && Math.abs(m.lng - location.lng) < 0.1) layer.openPopup();
//                   }
//                 });
//               }
//             }
//           })
//           .catch(e => console.error('Error fetching location_data:', e));
//       });
//     });
//   }

//   const splLocationDropdownItems = document.querySelectorAll('#splLocationDropdown + .dropdown-menu .dropdown-item');
//   if (splLocationDropdownItems && splLocationDropdownItems.length) {
//     splLocationDropdownItems.forEach(item => {
//       item.addEventListener('click', function (e) {
//         e.preventDefault();
//         const label = this.textContent.trim();
//         const dd = document.getElementById('splLocationDropdown');
//         if (dd) dd.innerHTML = '<i class="fas fa-map-pin me-1"></i> ' + label;

//         fetch('/api/location_data')
//           .then(r => r.json())
//           .then(locations => {
//             const location = locations.find(l => l.name === label);
//             if (location) {
//               if (window.splMap && typeof window.splMap.setView === 'function') window.splMap.setView([location.lat, location.lng], 7);
//               if (window.splMap) {
//                 window.splMap.eachLayer(layer => {
//                   if (layer instanceof L.Marker) {
//                     const m = layer.getLatLng();
//                     if (Math.abs(m.lat - location.lat) < 0.1 && Math.abs(m.lng - location.lng) < 0.1) layer.openPopup();
//                   }
//                 });
//               }
//             }
//           })
//           .catch(e => console.error('Error fetching location_data:', e));
//       });
//     });
//   }

//   // --- Initialize filter controls if available (safe) ---
//   if (typeof initializeFilterControls === 'function') {
//     try { initializeFilterControls(); }
//     catch (e) { console.warn('initializeFilterControls threw:', e); }
//   } else {
//     console.info('initializeFilterControls not defined - skipped.');
//   }

//   // --- Provide fallback render functions for geojson if not defined ---
//   // These wrappers call existing global render functions if present,
//   // otherwise they try to add geojson directly to mapChloro / mapSST using geoJsonCache.
//   function safeRenderChloroMap(data) {
//     if (!data) return;
//     if (typeof renderChloroMap === 'function') {
//       try { renderChloroMap(data); return; } catch(e) { console.warn('renderChloroMap error:', e); }
//     }
//     // fallback: try to add to mapChloro
//     if (window.mapChloro && L && data.type === 'FeatureCollection') {
//       if (window.currentChloroLayer) window.mapChloro.removeLayer(window.currentChloroLayer);
//       window.currentChloroLayer = L.geoJSON(data, {
//         style: f => ({ fillColor: colorFromGridcode(f?.properties?.gridcode), weight: 1, color: 'white', fillOpacity: 0.7 }),
//         onEachFeature: (feature, layer) => {
//           layer.on('click', e => {
//             const p = feature.properties || {};
//             const grid = p.gridcode;
//             const level = gridLevelName(grid);
//             L.popup().setLatLng(e.latlng).setContent(`<b>Klorofil-a:</b> ${level}`).openOn(window.mapChloro);
//           });
//         }
//       }).addTo(window.mapChloro);
//     }
//   }
//   function safeRenderSSTMap(data) {
//     if (!data) return;
//     if (typeof renderSSTMap === 'function') {
//       try { renderSSTMap(data); return; } catch(e) { console.warn('renderSSTMap error:', e); }
//     }
//     if (window.mapSST && L && data.type === 'FeatureCollection') {
//       if (window.currentSSTLayer) window.mapSST.removeLayer(window.currentSSTLayer);
//       window.currentSSTLayer = L.geoJSON(data, {
//         style: f => ({ fillColor: colorFromGridcode(f?.properties?.gridcode), weight: 1, color: 'white', fillOpacity: 0.7 }),
//         onEachFeature: (feature, layer) => {
//           layer.on('click', e => {
//             const p = feature.properties || {};
//             const grid = p.gridcode;
//             const level = gridLevelNameSST(grid);
//             L.popup().setLatLng(e.latlng).setContent(`<b>SPL:</b> ${level}`).openOn(window.mapSST);
//           });
//         }
//       }).addTo(window.mapSST);
//     }
//   }

//   // helper color functions (simple)
//   function colorFromGridcode(g) {
//     switch (Number(g)) {
//       case 1: return '#1a9850';
//       case 2: return '#91cf60';
//       case 3: return '#fee08b';
//       case 4: return '#fc8d59';
//       default: return '#d73027';
//     }
//   }
//   function gridLevelName(g) {
//     switch (Number(g)) {
//       case 1: return 'Sangat Rendah';
//       case 2: return 'Rendah';
//       case 3: return 'Sedang';
//       case 4: return 'Tinggi';
//       default: return 'Tidak Diketahui';
//     }
//   }
//   function gridLevelNameSST(g) {
//     switch (Number(g)) {
//       case 1: return 'Sangat Dingin (<25°C)';
//       case 2: return 'Dingin (25-27°C)';
//       case 3: return 'Normal (27-29°C)';
//       case 4: return 'Panas (>29°C)';
//       default: return 'Tidak Diketahui';
//     }
//   }

//   // expose safe renderers (so other scripts can call them)
//   window.safeRenderChloroMap = safeRenderChloroMap;
//   window.safeRenderSSTMap = safeRenderSSTMap;

//   // --- Loading indicator helpers (optional) ---
//   window.showLoading = function() {
//     let o = document.getElementById('loading-indicator');
//     if (!o) {
//       o = document.createElement('div');
//       o.id = 'loading-indicator';
//       o.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
//       o.style.position = 'fixed';
//       o.style.top = '10px';
//       o.style.right = '10px';
//       o.style.zIndex = 9999;
//       document.body.appendChild(o);
//     }
//     o.style.display = 'block';
//   };
//   window.hideLoading = function() {
//     const o = document.getElementById('loading-indicator');
//     if (o) o.style.display = 'none';
//   };

//   // Try to initialize charts function if provided elsewhere
//   if (typeof initializeCharts === 'function') {
//     try { initializeCharts(); }
//     catch (e) { console.warn('initializeCharts threw:', e); }
//   }

// }); 
// document.addEventListener("DOMContentLoaded", function () {
//   const ctx = document.getElementById("spl-chlorophyll-chart");

//   if (!ctx) {
//       console.error("Canvas #spl-chlorophyll-chart tidak ditemukan");
//       return;
//   }

//   new Chart(ctx, {
//       type: "line",
//       data: {
//           labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
//           datasets: [
//               {
//                   label: "SPL (°C)",
//                   data: [28.1, 28.5, 29.0, 28.3, 27.8, 28.4],
//                   borderWidth: 2
//               },
//               {
//                   label: "Klorofil-a (mg/m³)",
//                   data: [0.24, 0.35, 0.28, 0.33, 0.44, 0.40],
//                   borderWidth: 2
//               }
//           ]
//       },
//       options: {
//           responsive: true,
//           scales: {
//               y: { beginAtZero: false },
//           }
//       }
//   });
// });

