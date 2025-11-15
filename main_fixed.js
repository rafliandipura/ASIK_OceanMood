/* main_fixed.js
   Paste file ini ke /static/js/main_fixed.js dan muat setelah Leaflet & Chart.js
   (menggabungkan map, preload geojson, charts, dan filter handlers)
*/

(() => {
    // ----- Globals -----
    window.mapChloro = null;
    window.mapSST = null;
    let currentChloroLayer = null;
    let currentSSTLayer = null;
    const geoJsonCache = { chloro: {}, sst: {} };
  
    // Chart instances
    let splChlorophyllChart = null;
    let populationChart = null;
    let fishChart = null;
  
    // Utility: safe get element
    const $ = id => document.getElementById(id);
  
    // Month names
    const monthNames = ["januari","februari","maret","april","mei","juni",
                        "juli","agustus","september","oktober","november","desember"];
  
    // ----- Map functions -----
    function initMaps() {
      // init chlorophyll map
      if (!window.mapChloro) {
        window.mapChloro = L.map('mapChloro').setView([-2.5, 118], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(window.mapChloro);
      }
      // init sst map
      if (!window.mapSST) {
        window.mapSST = L.map('mapSST').setView([-2.5, 118], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(window.mapSST);
      }
    }
  
    // render functions are attached to window so other code can call if needed
    window.renderChloroMap = function(data) {
        try {
            if (!window.mapChloro) {
                console.error("mapChloro belum dibuat!");
                return;
            }
    
            if (window.currentChloroLayer) {
                window.mapChloro.removeLayer(window.currentChloroLayer);
            }
    
            if (!data || !data.features || data.features.length === 0) {
                window.currentChloroLayer = L.layerGroup().addTo(window.mapChloro);
                return;
            }
        currentChloroLayer = L.geoJSON(data, {
          style: feature => {
            const g = feature.properties && feature.properties.gridcode;
            let color = '#d73027';
            switch (g) {
              case 1: color = '#1a9850'; break;
              case 2: color = '#91cf60'; break;
              case 3: color = '#fee08b'; break;
              case 4: color = '#fc8d59'; break;
            }
            return { fillColor: color, weight: 1, color: 'white', fillOpacity: 0.7 };
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', e => {
              const p = feature.properties || {};
              let level = 'Tidak Diketahui';
              switch(p.gridcode) {
                case 1: level='Sangat Rendah'; break;
                case 2: level='Rendah'; break;
                case 3: level='Sedang'; break;
                case 4: level='Tinggi'; break;
              }
              L.popup().setLatLng(e.latlng)
                .setContent(`<b>Tingkat Klorofil-a:</b> ${level}`)
                .openOn(window.mapChloro);
            });
          }
        }).addTo(window.mapChloro);
      } catch (err) {
        console.error('renderChloroMap error', err);
      }
    };
  
    window.renderSSTMap = function(data) {
      try {
        if (currentSSTLayer) {
          window.mapSST.removeLayer(currentSSTLayer);
        }
        if (!data || !data.features || data.features.length === 0) {
          currentSSTLayer = L.layerGroup().addTo(window.mapSST);
          return;
        }
        currentSSTLayer = L.geoJSON(data, {
          style: feature => {
            const g = feature.properties && feature.properties.gridcode;
            let color = '#d73027';
            switch (g) {
              case 1: color = '#2c7bb6'; break;
              case 2: color = '#00a6ca'; break;
              case 3: color = '#fdae61'; break;
              case 4: color = '#f46d43'; break;
            }
            return { fillColor: color, weight: 1, color: 'white', fillOpacity: 0.7 };
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', e => {
              const p = feature.properties || {};
              let txt='Tidak Diketahui';
              switch(p.gridcode) {
                case 1: txt='Sangat Dingin (<25°C)'; break;
                case 2: txt='Dingin (25-27°C)'; break;
                case 3: txt='Normal (27-29°C)'; break;
                case 4: txt='Panas (>29°C)'; break;
              }
              L.popup().setLatLng(e.latlng).setContent(`<b>Suhu:</b> ${txt}`).openOn(window.mapSST);
            });
          }
        }).addTo(window.mapSST);
      } catch (err) {
        console.error('renderSSTMap error', err);
      }
    };
  
    // ----- GeoJSON loaders with cache -----
    function loadChloroData(monthName) {
      return new Promise(resolve => {
        if (geoJsonCache.chloro[monthName]) return resolve();
        const availableMonths = ["januari","februari","maret","april","mei","juni"];
        if (!availableMonths.includes(monthName)) {
          geoJsonCache.chloro[monthName] = { type: 'FeatureCollection', features: [] };
          return resolve();
        }
        const url = `/static/data/geojson/cloro/${monthName}_cloro.geojson`;
        fetch(url).then(resp => {
          if (!resp.ok) throw new Error('not ok ' + resp.status);
          return resp.json();
        }).then(json => {
          geoJsonCache.chloro[monthName] = json;
          resolve();
        }).catch(err => {
          console.warn('loadChloroData failed', err);
          geoJsonCache.chloro[monthName] = { type: 'FeatureCollection', features: [] };
          resolve();
        });
      });
    }
  
    function loadSSTData(monthName) {
      return new Promise(resolve => {
        if (geoJsonCache.sst[monthName]) return resolve();
        const availableMonths = ["januari","februari","maret","april","mei","juni"];
        if (!availableMonths.includes(monthName)) {
          geoJsonCache.sst[monthName] = { type: 'FeatureCollection', features: [] };
          return resolve();
        }
        const url = `/static/data/geojson/sst/${monthName}_sst.geojson`;
        fetch(url).then(resp => {
          if (!resp.ok) throw new Error('not ok ' + resp.status);
          return resp.json();
        }).then(json => {
          geoJsonCache.sst[monthName] = json;
          resolve();
        }).catch(err => {
          console.warn('loadSSTData failed', err);
          geoJsonCache.sst[monthName] = { type: 'FeatureCollection', features: [] };
          resolve();
        });
      });
    }
  
    // wrapper to load & render by month index (1-12)
    function loadMapData(monthValue) {
      const monthNum = parseInt(monthValue,10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        console.warn('Invalid month', monthValue);
        return;
      }
      const monthName = monthNames[monthNum - 1];
      // show loading indicator maybe
      Promise.all([loadChloroData(monthName), loadSSTData(monthName)])
        .then(() => {
          // render
          try {
            window.renderChloroMap(geoJsonCache.chloro[monthName]);
            window.renderSSTMap(geoJsonCache.sst[monthName]);
          } catch (e) {
            console.error('Error rendering maps after load', e);
          }
        });
    }
  
    // Preload default (februari)
    function preloadDefaultData() {
      const defaultMonth = 'februari';
      Promise.all([loadChloroData(defaultMonth), loadSSTData(defaultMonth)])
        .then(() => {
          window.renderChloroMap(geoJsonCache.chloro[defaultMonth]);
          window.renderSSTMap(geoJsonCache.sst[defaultMonth]);
        });
    }
  
    if (window.splChart) {
        window.splChart.destroy();
    }
    if (window.chloroChart) {
        window.chloroChart.destroy();
    }
    if (window.populationChart) {
        window.populationChart.destroy();
    }    

    function updateStatsCards(data) {
        // SPL
        const splEl = document.getElementById("spl-value");
        if (splEl && data.spl) {
            const lastSpl = data.spl[data.spl.length - 1];
            splEl.textContent = lastSpl ? lastSpl + "°C" : "-";
        }
    
        // Klorofil-a
        const chlEl = document.getElementById("klorofil-value");
        if (chlEl && data.klorofil_a) {
            const lastChl = data.klorofil_a[data.klorofil_a.length - 1];
            chlEl.textContent = lastChl ? lastChl + " mg/m³" : "-";
        }
    
        // Populasi Ikan
        const fishEl = document.getElementById("fish-value");
        if (fishEl && data.populasi) {
            const lastFish = data.populasi[data.populasi.length - 1];
            fishEl.textContent = lastFish ? lastFish + " ton" : "-";
        }
    }
    
  
    // ----- Fetch ocean data from backend -----
    function fetchOceanData(days=30) {
      return fetch(`/api/ocean_data?days=${days}`)
        .then(resp => {
          if (!resp.ok) throw new Error('api/ocean_data returned ' + resp.status);
          return resp.json();
        });
    }
  
    // ----- Filter handling -----
    function applyFiltersHandler() {
      const applyBtn = $('apply-filters');
      if (!applyBtn) {
        console.warn('#apply-filters not found in DOM');
        return;
      }
      applyBtn.addEventListener('click', () => {
        // show loading
        const loading = $('loading-indicator');
        if (loading) loading.style.display = 'block';
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Memuat Data...';
  
        const monthVal = ($('month-filter') && $('month-filter').value) || '2';
        // load map data (monthVal should be number string)
        loadMapData(monthVal);
  
        // fetch and update charts & stats
        fetchOceanData(30).then(data => {
          // if backend returns geojson inside, keep charts source from server if available
          createOrUpdateCharts(data);
updateStatsCards(data);
updateTrendAnalysis(data);
  
          // update analysis texts (simple trend)
          try {
            if (data.populasi && data.populasi.length >= 2) {
              const first = data.populasi[0];
              const last = data.populasi[data.populasi.length -1];
              const trendEl = $('trend-analysis');
              if (trendEl) {
                const pct = Math.abs(((last - first) / (first || 1)) * 100).toFixed(1);
                if (last > first) trendEl.textContent = `Populasi ikan meningkat ${pct}% dalam periode yang dipilih.`;
                else trendEl.textContent = `Populasi ikan menurun ${pct}% dalam periode yang dipilih.`;
              }
            }
          } catch(e) { console.warn('trend calc', e); }
  
        }).catch(err => {
          console.error('Error fetching ocean_data', err);
        }).finally(() => {
          if (loading) loading.style.display = 'none';
          applyBtn.disabled = false;
          applyBtn.innerHTML = '<i class="fas fa-check me-2"></i>Terapkan Filter';
        });
      });
    }

    function updateTrendAnalysis(data) {
        const trendEl = document.getElementById("trend-analysis");
        if (!trendEl) return;
    
        const p = data.populasi;
        if (!p || p.length < 2) return;
    
        const first = p[0];
        const last = p[p.length - 1];
    
        const diff = last - first;
        const pct = Math.abs((diff / (first || 1)) * 100).toFixed(1);
    
        if (diff > 0) {
            trendEl.textContent = 
                `Populasi ikan meningkat ${pct}% dibandingkan awal periode.`;
        } else if (diff < 0) {
            trendEl.textContent = 
                `Populasi ikan menurun ${pct}% dibandingkan awal periode.`;
        } else {
            trendEl.textContent = 
                `Populasi ikan stabil tanpa perubahan signifikan.`;
        }
    }
    
  
    // ----- Initialization -----
    function initializeAll() {
      // ensure required libs are present
      if (typeof L === 'undefined') {
        console.error('Leaflet not loaded. Include Leaflet before this script.');
        return;
      }
      if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded. Include Chart.js before this script.');
        return;
      }
  
      // init maps & preload geojson
      initMaps();
      preloadDefaultData();
  
      // init charts by fetching data once
      fetchOceanData(30).then(data => {
        createOrUpdateCharts(data);
updateStatsCards(data);
updateTrendAnalysis(data);
        // optional: draw fish chart if present (chart creation handled)
      }).catch(err => console.error('Initial fetchOceanData error', err));
  
      // init filter handlers
      applyFiltersHandler();
    }
  
    // run on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initializeAll);
  
    // expose for debug
    window._oceanMood = {
      loadMapData, loadChloroData, loadSSTData, geoJsonCache, createOrUpdateCharts
    };
  })();
  