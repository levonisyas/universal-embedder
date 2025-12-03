# Universal Embedder for Home Assistant

Embed cards across different dashboards with Visual Editor compatibility.

## Features
- ✅ Visual Editor friendly (no extra properties needed)
- ✅ Embed cards from any dashboard to any dashboard
- ✅ Simple 3-digit ID system (001-999)
- ✅ Smart scrolling (auto/manual)
- ✅ Card-mod compatible
- ✅ Works with all card types

## 🚀 Installation

### Method 1: HACS (Recommended)
1. Open HACS in Home Assistant
2. Click on "Frontend" tab
3. Click the three dots (⋮) in top right
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/levonisyas/universal-embedder`
6. Select category: "Dashboard"
7. Click "Add"
8. Find "Universal Embedder" in HACS and install
9. Restart Home Assistant

### Method 2: Manual Installation
1. Download `universal-embedder.js` from [Page](https://github.com/levonisyas/universal-embedder/)
2. Place file in your `/config/www/community/universal-embedder/` directory
3. Add as Lovelace resource:
```yaml
   resources:
     - url: /local/community/universal-embedder/universal-embedder.js
       type: dashboard
```
## Usage
Step 1: Add embed ID to source card
```yaml
type: entities
icon: EMBED#001  # REQUIRED: Add this line *IMPORTANT*
title: Living Room
entities:
  - light.living_room
  - sensor.temperature
```
## Step 2: Embed the card
```yaml
type: custom:universal-embedder
embed_id: "001"          # REQUIRED: 3-digit ID (001-999) *IMPORTANT*
dashboard: lovelace      # REQUIRED: Source dashboard name *IMPORTANT*
show_title: false        # OPTIONAL: Hide original title (default: true)
enable_scroll: true      # OPTIONAL: Enable scrolling (default: true)
card_size: 2             # OPTIONAL: Card height 1-10 (default: 1)
```
## 🔍 GELİŞMİŞ OPSİYONEL PARAMETRELER:
```yaml
styles:
  card:
    # RENK ve ARKA PLAN
    - background: red
    - background: var(--primary-color)
    -background: 'var(--card-background-color)'
    - color: white
    - opacity: 0.8
    
    # KENARLIK ve KÖŞE
    - border-radius: 10px
    - border: 2px solid blue
    - border-color: var(--accent-color)
    
    # BOYUT ve ARA BOŞLUK
    - padding: 10px
    - margin: 5px
    - width: 100px
    - height: 50px
    
    # GÖLGE
    - box-shadow: 0 2px 5px rgba(0,0,0,0.1)
    - '--ha-card-box-shadow': '0 2px 5px rgba(0,0,0,0.1)'
    
    # Z-INDEX (SINIRLI!)
    - z-index: 10      # ⬅️ ÇALIŞIR AMA YEREL SADECE KART İÇİNDE
```
## Test
```yaml
test_mode: false                 # Debug modu (console'da detaylı log)
```
## Card Mod uyumluğu
```yaml
card_mod:
  class: test-test               #view içinde çok sayıda universal-embedder kullanmak için
  style: |
    .test-test {                 #view içinde çok sayıda universal-embedder kullanmak için
      position: absolute !important;
      top: 30% !important;
      right: 5% !important;
      width: 400px !important;
      height: 300px !important;
      z-index: 1 !important;
    }
```

## 🚨 HATA DURUMLARI:
 - embed_id yoksa: "Universal Embedder requires both embed_id AND dashboard parameters"
 - dashboard yoksa: "Dashboard 'dashboard_name' not found or inaccessible"
 - kart bulunamazsa: "Card with embed ID #XXX not found in dashboard 'dashboard_name'"
 - embed_id format hatası: "embed_id must be a 3-digit number (001-999)"

## ✅ BAŞARILI MESAJ (console):
 "Universal Embedder successfully embedded card #XXX"
 "Dashboard: dashboard_name"
 "Scroll enabled: true/false"

## 🛠 TROUBLESHOOTING:
 1. Kaynak karta icon ekleyin: icon: 'EMBED#001'
 2. Dashboard adını doğru yazın
 3. embed_id benzersiz olsun (001-999)
 4. Ctrl+F5 + Home Assistant restart
## ❌ "Card not found" error
1. Verify source card has `icon: EMBED#001` (exact format)
2. Check dashboard name spelling (case-sensitive)
3. Ensure embed ID is unique (001-999)

## ❌ "Dashboard not found" error  
1. Verify dashboard exists and is accessible
2. Check URL path if using custom dashboard names
3. Try with `dashboard: lovelace` for main dashboard

## ❌ Visual Editor shows "Unsupported"
This is normal! Universal Embedder uses standard `icon:` property which Visual Editor fully supports. You can still edit the source card normally.

## Stack Compatibility
Works with vertical-stack, horizontal-stack, and grid layouts. Embed ID can be placed in any card within a stack.

## ⚠️ Limitations & Notes

- Maximum 999 unique embed IDs per installation (001-999)
- Source card must be in same Home Assistant instance
- Dashboard names are case-sensitive
- Works with all standard and most custom cards
- Not compatible with cards that dynamically change their `icon:` property

 ## 🎨 Card-mod Compatibility

Universal Embedder is fully compatible with card-mod. Each instance includes a `data-embed-id` attribute for precise CSS targeting:
This allows different styling for each embedded instance while keeping the source card unchanged.

## 🤝 Contributing & Support

Found a bug or have a feature request? Please open an issue on GitHub.

## Development Notes
This project was developed with a focus on:
- Visual Editor compatibility
- Simple, intuitive configuration
- Maximum compatibility with existing setups
- Performance optimization through AI-assisted algorithms

## Acknowledgments
Special thanks to the Home Assistant community and DeepSeek AI for algorithmic optimizations.

## 👤 About the Creator

**Levonisyas**  
🏗️ Licensed Architect | Construction Professional  
🏠 Home Assistant Hobbyist & Automation Developer  
⚡ Enhanced with DeepSeek AI Technology

As a professional architect, I apply structured problem-solving to my Home Assistant hobby projects. This custom card was developed to solve a real need in my smart home setup, with algorithmic optimizations provided by DeepSeek AI.

*"From blueprints to code - building better solutions for smart homes."*

