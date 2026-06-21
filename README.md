# PROJECT_-GeoScale-Pro]
# 🌍 GeoScale Pro

&gt; **The most advanced true-size country comparison tool on the web.** Drag countries across the globe, visualize Mercator distortion in real-time, explore Tissot's indicatrix, and animate latitude sweeps — all in a stunning dark glassmorphism interface.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Site-blue?style=for-the-badge&logo=vercel)](https://your-demo-link.vercel.app)
[![Countries](https://img.shields.io/badge/Countries-201%2B-green?style=for-the-badge)](https://github.com/yourusername/geoscale-pro)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 🚀 What Makes GeoScale Pro Unique?

Unlike other "true size" tools, GeoScale Pro doesn't just let you drag circles — it gives you **cartographic superpowers**:

| Feature | GeoScale Pro | Others |
|---------|-----------|--------|
| **Live Distortion Metrics** | Real-time distortion factor at cursor position | ❌ None |
| **Distortion Heatmap** | Visual grid showing distortion intensity worldwide | ❌ None |
| **Tissot's Indicatrix** | Interactive canvas showing how circles distort by latitude | ❌ None |
| **Latitude Sweep Animation** | Auto-animate a country from pole to equator | ❌ None |
| **Shareable URLs** | Share exact country positions via URL params | ❌ None |
| **Projection Switcher** | Compare Mercator, Equal-Area, Mollweide | ❌ None |
| **201 Countries** | Every sovereign state + territories | ⚠️ Limited |

---

## ✨ Features

### 🔍 Smart Search with Distortion Preview
Search results show not just area, but the **distortion factor** at each country's native latitude — so you know *before* you add it how much the map lies about its size.

### 🖱️ Interactive Dragging with Live Metrics
- Click any country to select it
- Drag it anywhere on the map
- **Live Info Panel** updates in real-time showing:
  - Cursor position (lat/lon)
  - Distortion factor at that latitude
  - Selected country's true area vs. apparent area
  - Color-coded warnings for extreme distortion (&gt;5×)

### 🌡️ Distortion Heatmap Mode
Toggle the heatmap to see a global grid of distortion intensity:
- 🟢 Green = Near true size (equator)
- 🟡 Yellow = Moderate distortion
- 🔴 Red = Extreme distortion (poles)

Hover over any grid cell to see the exact distortion factor.

### ⭕ Tissot's Indicatrix
A classic cartographic visualization showing how a perfect circle at different latitudes gets stretched into an ellipse by the Mercator projection. Includes:
- Visual comparison: original circle vs. distorted ellipse
- Distortion factor for each latitude (0°, 30°, 45°, 60°, 75°)
- Real-time canvas rendering

### ▶️ Latitude Sweep Animation
Select a country and hit **Animate** to watch it automatically travel from -80° to +80° latitude, shrinking and growing to reveal its true size at every latitude. Use the slider to scrub through manually.

### 🔗 Shareable Comparisons
Generate a URL containing the exact positions of all your compared countries. Share it with friends, students, or on social media — they'll see exactly what you see.

### 📊 Visual Comparison Panel
- Color-coded country cards with flag emojis
- Real-time position coordinates
- Relative size bar chart with animated fills
- One-click focus (🎯) to fly to any country

---

## 🎯 The Classic Demo

On first load, GeoScale Pro automatically demonstrates the most famous map lie:

1. **Bangladesh** appears at its true location (~24°N)
2. **Greenland** is dragged down to Bangladesh's latitude
3. Watch as Greenland **shrinks dramatically** — revealing it's actually smaller than Bangladesh!

Greenland's true area: 2.17M km²  
Bangladesh's true area: 148K km²  
But on a Mercator map at 70°N, Greenland appears **~25× larger** than it should.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Leaflet.js** | Interactive map engine |
| **Canvas API** | Tissot's indicatrix rendering |
| **Vanilla ES6+** | Zero dependencies, pure JS |
| **CSS3 Glassmorphism** | Modern UI with backdrop-filter |
| **CARTO Dark Tiles** | Beautiful dark base map |
| **Space Grotesk + JetBrains Mono** | Typography |

---

## 📦 Quick Start

```bash
# Clone
git clone https://github.com/yourusername/geoscale-pro.git
cd geoscale-pro

# Serve (required for fetch API)
python -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
