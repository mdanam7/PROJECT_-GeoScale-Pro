/* ============================================
   GeoScale Pro — True Size Country Comparison
   Main Application Logic
   ============================================ */

// ============================================
// STATE
// ============================================

const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
    '#14b8a6', '#d946ef', '#f43f5e', '#0ea5e9', '#a855f7'
];

let colorIndex = 0;
let activeCountries = [];
let map;
let currentOverlay = null;
let isDragging = false;
let distortionMode = false;
let tissotMode = false;
let animInterval = null;
let distortionLayer = null;
let countriesData = {};

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    try {
        const response = await fetch('countries_data.json');
        countriesData = await response.json();
        initMap();
        parseUrlParams();
        if (activeCountries.length === 0) {
            setTimeout(loadDemo, 1500);
        }
    } catch (err) {
        console.error('Failed to load country data:', err);
        document.getElementById('map').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:16px;">
                Failed to load country data. Please ensure you're running a local server.
            </div>
        `;
    }
}

function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: true,
        zoomControl: false,
        attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Map mouse tracking for live metrics
    map.on('mousemove', (e) => {
        updateLiveMetrics(e.latlng);
    });

    // Drag handlers
    map.on('mousedown', onMapMouseDown);
    map.on('mousemove', onMapMouseMove);
    map.on('mouseup', onMapMouseUp);
    map.on('touchstart', onMapMouseDown);
    map.on('touchmove', onMapMouseMove);
    map.on('touchend', onMapMouseUp);
}

// ============================================
// LIVE METRICS PANEL
// ============================================

function updateLiveMetrics(latlng) {
    if (!latlng) return;

    const lat = latlng.lat;
    const lon = latlng.lng;

    // Calculate distortion factor at this latitude
    const distortion = 1 / Math.cos(Math.abs(lat) * Math.PI / 180);

    document.getElementById('cursorPos').textContent = 
        `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    document.getElementById('distortionFactor').textContent = 
        `${distortion.toFixed(2)}×`;

    // Update distortion factor color
    const distEl = document.getElementById('distortionFactor');
    if (distortion > 5) distEl.className = 'metric-value warning';
    else if (distortion > 2) distEl.className = 'metric-value highlight';
    else distEl.className = 'metric-value';
}

// ============================================
// SEARCH
// ============================================

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 1) {
        searchResults.classList.remove('active');
        return;
    }

    const matches = Object.entries(countriesData)
        .filter(([name, data]) => name.toLowerCase().includes(query))
        .slice(0, 10);

    if (matches.length === 0) {
        searchResults.innerHTML = `
            <div class="result-item">
                <div class="result-info">
                    <div class="result-name">No results found</div>
                </div>
            </div>`;
    } else {
        searchResults.innerHTML = matches.map(([name, data]) => {
            const distortion = (1 / Math.cos(Math.abs(data.lat) * Math.PI / 180)).toFixed(1);
            return `
            <div class="result-item" data-name="${name}">
                <span class="result-flag">${getFlagEmoji(data.code)}</span>
                <div class="result-info">
                    <div class="result-name">${name}</div>
                    <div class="result-meta">
                        <span>📐 ${formatArea(data.area)} km²</span>
                        <span>📍 ${data.lat.toFixed(1)}°N</span>
                        <span style="color: ${distortion > 2 ? '#f59e0b' : '#64748b'}">🔍 ${distortion}× distortion</span>
                    </div>
                </div>
            </div>
        `}).join('');
    }
    searchResults.classList.add('active');
});

searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.result-item');
    if (item && item.dataset.name) {
        addCountry(item.dataset.name);
        searchInput.value = '';
        searchResults.classList.remove('active');
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
        searchResults.classList.remove('active');
    }
});

// ============================================
// COUNTRY MANAGEMENT
// ============================================

function addCountry(name) {
    if (activeCountries.find(c => c.name === name)) return;

    const data = countriesData[name];
    if (!data) return;

    const color = colors[colorIndex % colors.length];
    colorIndex++;

    const country = {
        name: name,
        data: data,
        color: color,
        lat: data.lat,
        lng: data.lon,
        id: Date.now() + Math.random()
    };

    activeCountries.push(country);
    createCountryOverlay(country);
    updateSidebar();
    updateComparisonBars();
    updateInfoPanel();

    if (activeCountries.length === 1) {
        document.getElementById('sidebar').classList.remove('collapsed');
    }

    map.flyTo([data.lat, data.lon], 4, { duration: 1 });
}

function createCountryOverlay(country) {
    const radius = calculateRadius(country.data.area, country.lat);

    const circle = L.circle([country.lat, country.lng], {
        radius: radius,
        color: country.color,
        fillColor: country.color,
        fillOpacity: 0.3,
        weight: 2.5,
        opacity: 0.9,
        className: 'country-overlay'
    }).addTo(map);

    const distortion = (1 / Math.cos(Math.abs(country.lat) * Math.PI / 180)).toFixed(1);

    circle.bindTooltip(`
        <div class="custom-tooltip">
            <div>${getFlagEmoji(country.data.code)} ${country.name}</div>
            <div class="tooltip-area">${formatArea(country.data.area)} km²</div>
            <div class="tooltip-distortion">Distortion: ${distortion}× at this latitude</div>
        </div>
    `, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
    });

    country.overlay = circle;
    country.radius = radius;

    circle.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectCountry(country);
    });
}

// ============================================
// TRUE SIZE CALCULATION
// ============================================

function calculateRadius(area, lat) {
    const radiusMeters = Math.sqrt(area * 1000000 / Math.PI);
    const latRad = Math.abs(lat) * Math.PI / 180;
    const correction = Math.cos(latRad);
    return radiusMeters * Math.sqrt(correction);
}

function getDistortionFactor(lat) {
    return 1 / Math.cos(Math.abs(lat) * Math.PI / 180);
}

// ============================================
// SELECTION & DRAGGING
// ============================================

function selectCountry(country) {
    activeCountries.forEach(c => {
        if (c.overlay) {
            c.overlay.setStyle({ weight: 2.5 });
            c.overlay.getElement()?.classList.remove('selected');
        }
    });

    currentOverlay = country;
    country.overlay.setStyle({ weight: 3.5 });
    country.overlay.getElement()?.classList.add('selected');

    document.querySelectorAll('.country-card').forEach(card => {
        card.classList.remove('selected');
    });
    const card = document.querySelector(`[data-country-id="${country.id}"]`);
    if (card) card.classList.add('selected');

    updateInfoPanel();
}

function onMapMouseDown(e) {
    if (!currentOverlay) return;
    const latLng = e.latlng || (e.touches && e.touches[0] ? map.mouseEventToLatLng(e.touches[0]) : null);
    if (!latLng) return;

    const distance = latLng.distanceTo([currentOverlay.lat, currentOverlay.lng]);
    if (distance <= currentOverlay.radius) {
        isDragging = true;
        map.dragging.disable();
        if (e.originalEvent) e.originalEvent.preventDefault();
    }
}

function onMapMouseMove(e) {
    if (!isDragging || !currentOverlay) return;
    const latLng = e.latlng || (e.touches && e.touches[0] ? map.mouseEventToLatLng(e.touches[0]) : null);
    if (!latLng) return;

    currentOverlay.lat = latLng.lat;
    currentOverlay.lng = latLng.lng;
    currentOverlay.overlay.setLatLng(latLng);

    const newRadius = calculateRadius(currentOverlay.data.area, latLng.lat);
    currentOverlay.radius = newRadius;
    currentOverlay.overlay.setRadius(newRadius);

    updateInfoPanel();
    updateLiveMetrics(latLng);
}

function onMapMouseUp(e) {
    if (isDragging) {
        isDragging = false;
        map.dragging.enable();
    }
}

// ============================================
// INFO PANEL UPDATE
// ============================================

function updateInfoPanel() {
    if (!currentOverlay) {
        document.getElementById('selectedCountry').textContent = 'None';
        document.getElementById('trueArea').textContent = '--';
        document.getElementById('mapAppearance').textContent = '--';
        return;
    }

    const c = currentOverlay;
    const distortion = getDistortionFactor(c.lat);
    const apparentArea = c.data.area * distortion;

    document.getElementById('selectedCountry').textContent = `${getFlagEmoji(c.data.code)} ${c.name}`;
    document.getElementById('trueArea').textContent = `${formatArea(c.data.area)} km²`;
    document.getElementById('mapAppearance').textContent = `${formatArea(apparentArea)} km² (${distortion.toFixed(1)}×)`;
}

// ============================================
// SIDEBAR
// ============================================

function updateSidebar() {
    const content = document.getElementById('sidebarContent');
    const count = document.getElementById('sidebarCount');

    count.textContent = activeCountries.length;

    if (activeCountries.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🗺️</div>
                <div class="empty-state-title">Start Exploring</div>
                <div class="empty-state-text">
                    Search for countries above and drag them around the map to discover their true sizes.
                </div>
            </div>
        `;
        document.getElementById('comparisonSection').style.display = 'none';
        return;
    }

    content.innerHTML = activeCountries.map(country => {
        const distortion = getDistortionFactor(country.lat).toFixed(1);
        return `
        <div class="country-card" data-country-id="${country.id}">
            <div class="country-card-header">
                <span class="country-card-flag">${getFlagEmoji(country.data.code)}</span>
                <div class="country-card-info">
                    <div class="country-card-name">${country.name}</div>
                    <div class="country-card-area">${formatArea(country.data.area)} km² • ${distortion}× distortion</div>
                </div>
                <div class="country-card-actions">
                    <button class="card-btn" onclick="focusCountry('${country.id}')" title="Focus">🎯</button>
                    <button class="card-btn remove" onclick="removeCountry('${country.id}')" title="Remove">✕</button>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">True Area</div>
                    <div class="stat-value">${formatArea(country.data.area)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Position</div>
                    <div class="stat-value accent">${country.lat.toFixed(1)}°</div>
                </div>
            </div>
        </div>
    `}).join('');

    document.getElementById('comparisonSection').style.display = 'block';
}

function updateComparisonBars() {
    if (activeCountries.length === 0) return;
    const maxArea = Math.max(...activeCountries.map(c => c.data.area));
    const container = document.getElementById('comparisonBars');

    container.innerHTML = activeCountries.map(country => {
        const percentage = (country.data.area / maxArea) * 100;
        return `
            <div class="comparison-bar-wrap">
                <div class="comparison-bar-header">
                    <div class="comparison-bar-name">
                        <span class="comparison-bar-dot" style="background: ${country.color}"></span>
                        ${country.name}
                    </div>
                    <div class="comparison-bar-value">${formatArea(country.data.area)}</div>
                </div>
                <div class="comparison-bar-track">
                    <div class="comparison-bar-fill" style="width: ${percentage}%; background: ${country.color}"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// COUNTRY ACTIONS
// ============================================

function focusCountry(id) {
    const country = activeCountries.find(c => c.id == id);
    if (country) {
        map.flyTo([country.lat, country.lng], 5, { duration: 1 });
        selectCountry(country);
    }
}

function removeCountry(id) {
    const index = activeCountries.findIndex(c => c.id == id);
    if (index === -1) return;

    const country = activeCountries[index];
    if (country.overlay) map.removeLayer(country.overlay);

    activeCountries.splice(index, 1);

    if (currentOverlay && currentOverlay.id == id) {
        currentOverlay = activeCountries.length > 0 ? activeCountries[activeCountries.length - 1] : null;
        if (currentOverlay) selectCountry(currentOverlay);
    }

    updateSidebar();
    updateComparisonBars();
    updateInfoPanel();
}

function clearAll() {
    activeCountries.forEach(c => { if (c.overlay) map.removeLayer(c.overlay); });
    activeCountries = [];
    currentOverlay = null;
    updateSidebar();
    updateComparisonBars();
    updateInfoPanel();
}

// ============================================
// DISTORTION HEATMAP
// ============================================

function toggleDistortion() {
    distortionMode = !distortionMode;
    document.getElementById('btnDistortion').classList.toggle('active', distortionMode);
    document.getElementById('heatmapLegend').classList.toggle('active', distortionMode);

    if (distortionMode) {
        createDistortionLayer();
    } else {
        removeDistortionLayer();
    }
}

function createDistortionLayer() {
    const step = 15;

    distortionLayer = L.layerGroup();

    for (let lat = -75; lat <= 75; lat += step) {
        for (let lon = -165; lon <= 165; lon += step) {
            const distortion = getDistortionFactor(lat);
            const intensity = Math.min((distortion - 1) / 10, 1);

            const hue = 120 - (intensity * 120);
            const color = `hsla(${hue}, 80%, 50%, ${0.1 + intensity * 0.3})`;

            const circle = L.circle([lat, lon], {
                radius: 400000,
                fillColor: color,
                fillOpacity: 0.4,
                stroke: false
            });

            circle.bindTooltip(`Distortion: ${distortion.toFixed(1)}×`, {
                permanent: false,
                direction: 'top'
            });

            distortionLayer.addLayer(circle);
        }
    }

    distortionLayer.addTo(map);
}

function removeDistortionLayer() {
    if (distortionLayer) {
        map.removeLayer(distortionLayer);
        distortionLayer = null;
    }
}

// ============================================
// TISSOT'S INDICATRIX
// ============================================

function toggleTissot() {
    tissotMode = !tissotMode;
    document.getElementById('btnTissot').classList.toggle('active', tissotMode);
    document.getElementById('tissotPanel').classList.toggle('active', tissotMode);

    if (tissotMode) {
        drawTissotCanvas();
    }
}

function drawTissotCanvas() {
    const canvas = document.getElementById('tissotCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a2236';
    ctx.fillRect(0, 0, w, h);

    const lats = [0, 30, 45, 60, 75];
    const rowHeight = h / lats.length;

    lats.forEach((lat, i) => {
        const y = i * rowHeight + rowHeight / 2;
        const distortion = getDistortionFactor(lat);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${lat}°`, 5, y + 4);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(50, y, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(130, y, 12 * distortion, 12, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`${distortion.toFixed(1)}×`, 165, y + 4);
    });
}

// ============================================
// ANIMATION
// ============================================

function toggleAnimation() {
    const controls = document.getElementById('animControls');
    const btn = document.getElementById('btnAnimate');

    if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
        controls.style.display = 'none';
        btn.classList.remove('active');
        return;
    }

    if (!currentOverlay) {
        alert('Select a country first to animate!');
        return;
    }

    btn.classList.add('active');
    controls.style.display = 'flex';

    let lat = -80;
    const slider = document.getElementById('animSlider');
    const label = document.getElementById('animLabel');

    animInterval = setInterval(() => {
        lat += 0.5;
        if (lat > 80) lat = -80;

        slider.value = lat;
        label.textContent = `${lat.toFixed(0)}°`;

        currentOverlay.lat = lat;
        currentOverlay.lng = currentOverlay.data.lon;
        currentOverlay.overlay.setLatLng([lat, currentOverlay.data.lon]);

        const newRadius = calculateRadius(currentOverlay.data.area, lat);
        currentOverlay.radius = newRadius;
        currentOverlay.overlay.setRadius(newRadius);

        updateInfoPanel();
        updateLiveMetrics({ lat: lat, lng: currentOverlay.data.lon });
    }, 50);
}

document.getElementById('animPlay').addEventListener('click', () => {
    if (!animInterval) toggleAnimation();
});

document.getElementById('animPause').addEventListener('click', () => {
    if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
    }
});

document.getElementById('animSlider').addEventListener('input', (e) => {
    if (!currentOverlay) return;
    const lat = parseFloat(e.target.value);
    document.getElementById('animLabel').textContent = `${lat.toFixed(0)}°`;

    currentOverlay.lat = lat;
    currentOverlay.overlay.setLatLng([lat, currentOverlay.data.lon]);

    const newRadius = calculateRadius(currentOverlay.data.area, lat);
    currentOverlay.radius = newRadius;
    currentOverlay.overlay.setRadius(newRadius);

    updateInfoPanel();
});

// ============================================
// SHARE
// ============================================

function generateShareUrl() {
    const params = activeCountries.map(c => 
        `${encodeURIComponent(c.name)}=${c.lat.toFixed(2)},${c.lng.toFixed(2)}`
    ).join('&');
    return `${window.location.origin}${window.location.pathname}?${params}`;
}

function toggleShare() {
    const modal = document.getElementById('shareModal');
    const urlInput = document.getElementById('shareUrl');
    urlInput.value = generateShareUrl();
    modal.classList.add('active');
    urlInput.select();
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('shareModal').classList.remove('active');
});

document.getElementById('shareModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.target.classList.remove('active');
    }
});

// ============================================
// PROJECTION SWITCHER
// ============================================

document.querySelectorAll('.projection-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.projection-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        opt.querySelector('input').checked = true;
    });
});

// ============================================
// CONTROLS
// ============================================

document.getElementById('btnZoomIn').addEventListener('click', () => map.zoomIn());
document.getElementById('btnZoomOut').addEventListener('click', () => map.zoomOut());
document.getElementById('btnReset').addEventListener('click', () => {
    map.flyTo([20, 0], 2, { duration: 1 });
});
document.getElementById('btnClear').addEventListener('click', clearAll);
document.getElementById('btnSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('collapsed');
});

document.getElementById('btnDistortion').addEventListener('click', toggleDistortion);
document.getElementById('btnTissot').addEventListener('click', toggleTissot);
document.getElementById('btnAnimate').addEventListener('click', toggleAnimation);
document.getElementById('btnShare').addEventListener('click', toggleShare);

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchResults.classList.remove('active');
        document.getElementById('shareModal').classList.remove('active');
        if (currentOverlay) {
            currentOverlay.overlay.setStyle({ weight: 2.5 });
            currentOverlay.overlay.getElement()?.classList.remove('selected');
            currentOverlay = null;
            updateInfoPanel();
        }
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName !== 'INPUT') {
        if (currentOverlay) removeCountry(currentOverlay.id);
    }
    if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        toggleDistortion();
    }
    if (e.key === 't' && e.ctrlKey) {
        e.preventDefault();
        toggleTissot();
    }
    if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
        toggleAnimation();
    }
});

// ============================================
// UTILITIES
// ============================================

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function formatArea(area) {
    if (area >= 1000000) return (area / 1000000).toFixed(2) + 'M';
    if (area >= 1000) return (area / 1000).toFixed(1) + 'K';
    return area.toString();
}

// ============================================
// DEMO
// ============================================

function loadDemo() {
    if (activeCountries.length === 0) {
        addCountry('Bangladesh');
        setTimeout(() => {
            addCountry('Greenland');
            const greenland = activeCountries.find(c => c.name === 'Greenland');
            if (greenland) {
                greenland.lat = 23;
                greenland.lng = 90;
                greenland.overlay.setLatLng([23, 90]);
                const newRadius = calculateRadius(greenland.data.area, 23);
                greenland.radius = newRadius;
                greenland.overlay.setRadius(newRadius);
                selectCountry(greenland);
            }
        }, 1200);
    }
}

// ============================================
// PARSE URL PARAMS
// ============================================

function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
        params.forEach((value, name) => {
            const countryName = decodeURIComponent(name);
            if (countriesData[countryName]) {
                addCountry(countryName);
                const coords = value.split(',');
                if (coords.length === 2) {
                    const country = activeCountries.find(c => c.name === countryName);
                    if (country) {
                        const lat = parseFloat(coords[0]);
                        const lng = parseFloat(coords[1]);
                        country.lat = lat;
                        country.lng = lng;
                        country.overlay.setLatLng([lat, lng]);
                        const newRadius = calculateRadius(country.data.area, lat);
                        country.radius = newRadius;
                        country.overlay.setRadius(newRadius);
                    }
                }
            }
        });
    }
}

// ============================================
// START
// ============================================

initApp();