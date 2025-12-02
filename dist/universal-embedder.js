import { LitElement, html, css } from 'https://unpkg.com/lit@2.1.0/index.js?module';

class DeepSeekCardEmbedder extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _cardElement: { type: Object },
    _loading: { type: Boolean },
    _error: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }
    .loading, .error {
      text-align: center;
      padding: 20px;
    }
    .loading {
      color: var(--primary-color);
    }
    .error {
      color: var(--error-color);
    }
    #card-container {
      padding: 16px;
    }
  `;

  setConfig(config) {
    if (!config.card_id) {
      throw new Error('card_id required - Powered by DeepSeek');
    }
    this._config = config;
    this._loading = true;
    this._error = null;
    this._cardElement = null;
  }

  render() {
    if (this._error) {
      return html`<ha-card><div class="error">${this._error}</div></ha-card>`;
    }

    if (this._loading) {
      return html`<ha-card><div class="loading">DeepSeek Kart Yükleniyor...</div></ha-card>`;
    }

    return html`
      <ha-card .header=${this._config.title || 'DeepSeek Embed'}>
        <div id="card-container">
          ${this._cardElement ? html`<div>Kart Render Ediliyor...</div>` : html`<div>Kart Hazırlanıyor...</div>`}
        </div>
      </ha-card>
    `;
  }

  async updated(changedProperties) {
    if (changedProperties.has('hass') && this.hass && this._loading && !this._error) {
      await this._loadAndRenderCard();
    }
    
    if (changedProperties.has('hass') && this._cardElement) {
      this._cardElement.hass = this.hass;
    }
  }

  async _loadAndRenderCard() {
    try {
      console.log('DeepSeek: Kart yükleniyor...', this._config.card_id);
      
      // 1. Lovelace konfigürasyonunu al
      const currentDashboard = this._getCurrentDashboard();
      console.log('DeepSeek: Dashboard:', currentDashboard);
      
      const lovelaceConfig = await this.hass.connection.sendMessagePromise({
        type: 'lovelace/config',
        url_path: currentDashboard === 'lovelace' ? null : currentDashboard
      });

      console.log('DeepSeek: Lovelace config alındı');

      // 2. Kartı bul
      const cardConfig = this._findCardRecursive(lovelaceConfig.views, this._config.card_id);
      if (!cardConfig) {
        throw new Error(`Kart '${this._config.card_id}' bulunamadı - Powered by DeepSeek`);
      }

      console.log('DeepSeek: Kart bulundu:', cardConfig);

      // 3. Kart elementini oluştur
      await this._createCardElement(cardConfig);

    } catch (error) {
      console.error('DeepSeek Hata:', error);
      this._error = error.message;
      this._loading = false;
      this.requestUpdate();
    }
  }

  async _createCardElement(cardConfig) {
    try {
      console.log('DeepSeek: Kart elementi oluşturuluyor...');
      
      // Home Assistant'ın kart helpers'ını bekle
      while (!window.loadCardHelpers) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const helpers = await window.loadCardHelpers();
      this._cardElement = await helpers.createCardElement(cardConfig);
      
      console.log('DeepSeek: Kart elementi oluşturuldu');
      
      // Container'ı bul ve kartı ekle
      await this._waitForContainer();
      const container = this.shadowRoot.getElementById('card-container');
      container.innerHTML = '';
      container.appendChild(this._cardElement);
      
      // Hass objesini ver
      this._cardElement.hass = this.hass;
      
      this._loading = false;
      this.requestUpdate();
      
      console.log('DeepSeek: Kart başarıyla render edildi!');
      
    } catch (error) {
      throw new Error(`Kart oluşturulamadı: ${error.message}`);
    }
  }

  async _waitForContainer() {
    let attempts = 0;
    while (attempts < 50) {
      if (this.shadowRoot && this.shadowRoot.getElementById('card-container')) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    throw new Error('Container bulunamadı');
  }

  _findCardRecursive(views, cardId) {
    for (const view of views) {
      if (view.cards) {
        for (const card of view.cards) {
          if (card.id === cardId) return card;
          if (card.cards) {
            const found = this._findCardRecursive([{ cards: card.cards }], cardId);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }

  _getCurrentDashboard() {
    const path = window.location.pathname;
    const match = path.match(/\/(dashboard-[^\/]+|lovelace)/);
    return match ? match[1] : 'lovelace';
  }

  getCardSize() {
    return this._config.height ? Math.ceil(this._config.height / 100) : 4;
  }
}

// Custom element tanımlama
if (!customElements.get('deepseek-card-embedder')) {
  customElements.define('deepseek-card-embedder', DeepSeekCardEmbedder);
  
  // HACS için
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'deepseek-card-embedder',
    name: 'DeepSeek Card Embedder',
    preview: true,
    description: 'Tek kart gömme - Powered by DeepSeek 🚀',
  });
}
