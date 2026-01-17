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
    type: module
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
show_title: false        # OPTIONAL: Hide source card title (default: true)
enable_scroll: true      # OPTIONAL: Enable scrolling (default: true)
card_size: 2             # OPTIONAL: Card height 1-10 (default: 1)
show_close: true         # OPTIONAL: Show close (X) button in header (default: false)
embedder_title: ""       # OPTIONAL: Custom title for embedder header, use string for title (default: empty)
default_visible: true    # OPTIONAL: Initial visibility on load (default: true)
```
# 🔍 ADVANCED OPTIONAL PARAMETERS:
```yaml
styles:
  card:
    # COLOR AND BACKGROUND
    - background: red
    - background: var(--primary-color)
    - background: 'var(--card-background-color)'
    - color: white
    - opacity: 0.8
    
    # BORDER AND CORNERS
    - border-radius: 10px
    - border: 2px solid blue
    - border-color: var(--accent-color)
    
    # SIZE AND SPACING
    - padding: 10px
    - margin: 5px
    - width: 100px
    - height: 50px
    
    # SHADOWS
    - box-shadow: 0 2px 5px rgba(0,0,0,0.1)
    - '--ha-card-box-shadow': '0 2px 5px rgba(0,0,0,0.1)'
    
    # Z-INDEX (LIMITED!)
    - z-index: 10      # ⬅️ WORKS BUT LOCAL TO CARD ONLY
```
## Test
```yaml
test_mode: false  # Debug mode (detailed logs in console)
```
## Card Mod compatibility
```yaml
card_mod:
  class: EMBED-001  # For multiple universal-embedder instances in one view
  style: |
    .EMBED-001 {
      position: absolute !important;
      top: 30% !important;
      right: 5% !important;
      width: 400px !important;
      height: 300px !important;
      z-index: 1 !important;
    }
```
## Button menu usage
```yaml
# scripts.yaml
embedder_open:
  alias: "Open Embedder"
  variables:
    embed_id: ""
  sequence:
    - service: input_select.select_option
      data:
        entity_id: input_select.active_embedder
        option: "{{ embed_id }}"
  mode: single
```
```yaml
# configuration.yaml
input_select:
  active_embedder:
    name: "Active Embedder"
    options: ["none", "embed_001", "embed_002", "embed_003"]
    initial: "none" # Determines which card is open on load
```
```yaml
# 1. BUTTON MENU - HORIZONTAL STACK
type: horizontal-stack
cards:
  # LIGHTS BUTTON
  - type: button
    name: "Lights"
    icon: mdi:lightbulb
    show_name: true
    show_icon: true
    tap_action:
      action: call-service
      service: script.embedder_open
      data:
        embed_id: "embed_001"

  # HOME BUTTON (CLOSE ALL)
  - type: button
    name: "Home"
    icon: mdi:home
    show_name: true
    show_icon: true
    tap_action:
      action: call-service
      service: input_select.select_option
      data:
        entity_id: input_select.active_embedder
        option: "none"
card_mod:
  style: |
    :host {
      position: absolute !important;
      bottom: 0% !important;
      right: 20% !important;
      width: 500px !important;
    }
```
```yaml 
# 2. LIGHTS CARD - CONDITIONAL
type: conditional
conditions:
  - entity: input_select.active_embedder
    state: "embed_001"
card:
  type: custom:universal-embedder
  embed_id: "001"
  dashboard: "dashboard-test"  # ⬅️ USE YOUR DASHBOARD NAME
  embedder_title: "Lights"
  show_close: false    # ⬅️ NO X BUTTON FOR MENU CARDS!
  default_visible: true
card_mod:
  class: EMBED-001
  style: |
    .EMBED-001 {
      position: absolute !important;
      top: 30% !important;
      right: 5% !important;
      width: 400px !important;
      height: 300px !important;
      z-index: 1 !important;
    }
```
```yaml 
# SOURCE CARDS (in dashboard-test dashboard)
# CARD 1: Lights (EMBED#001)
type: entities
icon: EMBED#001  # ⬅️ THIS IS CRITICAL!
title: Lights Control
entities:
  - light.living_room
  - light.kitchen
``` 
## 🚨 ERROR CONDITIONS:
No embed_id: "Universal Embedder requires both embed_id AND dashboard parameters"
Dashboard not found: "Dashboard 'dashboard_name' not found or inaccessible"
Card not found: "Card with embed ID #XXX not found in dashboard 'dashboard_name'"
Invalid embed_id format: "embed_id must be a 3-digit number (001-999)"

## ✅ SUCCESS MESSAGE (console):
"Universal Embedder successfully embedded card #XXX"
"Dashboard: dashboard_name"
"Scroll enabled: true/false"

## 🛠 TROUBLESHOOTING:
Add icon to source card: icon: 'EMBED#001'
Correctly write dashboard name
Make embed_id unique (001-999)
Ctrl+F5 + Home Assistant restart

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
  
*"From blueprints to code - building better solutions for smart homes."*

