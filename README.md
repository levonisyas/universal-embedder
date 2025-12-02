# universal-embedder
Home Assistant card for embedding cards directly
~~~yaml
# 📝 NOT: Kaynak kartta icon eklemeyi unutmayın:
icon: 'EMBED#001'               # Universal Embedder bu icon'u arar
~~~
~~~yaml
type: custom:universal-embedder
# 🔴 ZORUNLU PARAMETRELER:
embed_id: '001'                    # 3 rakamlı benzersiz ID (001-999)
dashboard: 'lovelace'              # Kaynak dashboard adı

# 🟡 OPSİYONEL PARAMETRELER:
card_size: 2                       # Kart boyutu (1-10, default: 1)
show_title: true                   # Kaynak kartın başlığını göster (default: false)
enable_scroll: true                # İçerik kaydırma açık (default: true)
# 🔍 GELİŞMİŞ OPSİYONEL PARAMETRELER:
style:                           # Özel CSS stilleri
padding: '10px'
background: 'var(--card-background-color)'

test_mode: false                 # Debug modu (console'da detaylı log)

# Card Mod uyumluğu
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
~~~

# 🚨 HATA DURUMLARI:
# - embed_id yoksa: "Universal Embedder requires both embed_id AND dashboard parameters"
# - dashboard yoksa: "Dashboard 'dashboard_name' not found or inaccessible"
# - kart bulunamazsa: "Card with embed ID #XXX not found in dashboard 'dashboard_name'"
# - embed_id format hatası: "embed_id must be a 3-digit number (001-999)"
#
# ✅ BAŞARILI MESAJ (console):
# "Universal Embedder successfully embedded card #XXX"
# "Dashboard: dashboard_name"
# "Scroll enabled: true/false"
#
# 🛠 TROUBLESHOOTING:
# 1. Kaynak karta icon ekleyin: icon: 'EMBED#001'
# 2. Dashboard adını doğru yazın
# 3. embed_id benzersiz olsun (001-999)
# 4. Ctrl+F5 + Home Assistant restart
