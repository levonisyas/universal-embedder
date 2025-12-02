class UniversalEmbedder extends HTMLElement {
  setConfig(config) {
    // ✅ FORUM READY: Hem card_id HEM dashboard ZORUNLU
    if (!config.card_id || !config.dashboard) {
      throw new Error('card_id AND dashboard required - Specify both card ID and target dashboard');
    }
    this._config = config;
    this._hass = null;
    this._loaded = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loadCard();
    } else if (this._contentElement) {
      this._contentElement.hass = hass;
    }
  }

  async _loadCard() {
    // ✅ CLEAN CONTAINER
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.minHeight = '0';
    this.style.padding = '0';
    this.style.margin = '0';
    this.style.borderRadius = '0';

    this.innerHTML = `
      <div style="padding: 10px; color: var(--primary-color); font-style: italic;">
        Universal Embedder loading... 🚀
      </div>
    `;

    try {
      const cardConfig = await this._findCardInDashboard();
      await this._createCardContent(cardConfig);
      
    } catch (error) {
      this.innerHTML = `
        <div style="color: var(--error-color); padding: 20px; text-align: center;">
          ${error.message}<br>
          <small>Check card_id and dashboard parameters</small>
        </div>
      `;
    }
  }

  async _findCardInDashboard() {
    // ✅ SADECE BELİRTİLEN DASHBOARD'DA ARA
    const dashboard = this._config.dashboard;
    
    console.log(`Universal Embedder: Searching in '${dashboard}' for card '${this._config.card_id}'`);
    
    try {
      const lovelaceConfig = await this._hass.connection.sendMessagePromise({
        type: 'lovelace/config',
        url_path: dashboard === 'lovelace' ? null : dashboard
      });

      const cardConfig = this._findCardInViews(lovelaceConfig.views, this._config.card_id);
      if (!cardConfig) {
        throw new Error(`Card '${this._config.card_id}' not found in dashboard '${dashboard}'`);
      }

      console.log(`Universal Embedder: ✓ Card found in ${dashboard}`);
      
      // Title kontrolü
      if (this._config.show_title !== true) {
        delete cardConfig.title;
      }
      
      return cardConfig;
      
    } catch (err) {
      if (err.message.includes('Not found')) {
        throw new Error(`Dashboard '${dashboard}' not found or inaccessible`);
      }
      throw new Error(`Error accessing dashboard '${dashboard}': ${err.message}`);
    }
  }

  _findCardInViews(views, cardId) {
    for (const view of views) {
      if (view.cards) {
        for (const card of view.cards) {
          if (card.id === cardId) return card;
          if (card.cards) {
            const found = this._findCardInViews([{ cards: card.cards }], cardId);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }

  async _createCardContent(cardConfig) {
    const helpers = await window.loadCardHelpers();
    this._contentElement = await helpers.createCardElement(cardConfig);
    this._contentElement.hass = this._hass;
    
    // ✅ CLEAN CONTAINER
    this.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'universal-container';
    container.style.padding = '0';
    container.style.margin = '0';
    
    const cardWrapper = document.createElement('ha-card');
    cardWrapper.style.display = 'flex';
    cardWrapper.style.flexDirection = 'column';
    cardWrapper.style.height = '100%';
    cardWrapper.style.width = '100%';
    cardWrapper.style.padding = '0';
    cardWrapper.style.margin = '0';
    cardWrapper.style.borderRadius = '0';
    cardWrapper.style.background = 'none';
    cardWrapper.style.boxShadow = 'none';
    
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.style.flex = '1';
    cardContent.style.minHeight = '0';
    cardContent.style.display = 'flex';
    cardContent.style.flexDirection = 'column';
    cardContent.style.padding = '0';
    
    // ✅ SMART SCROLL
    if (this._config.enable_scroll === false) {
      cardContent.style.overflow = 'visible';
    } else {
      cardContent.style.overflowY = 'auto';
      cardContent.style.overflowX = 'hidden';
    }
    
    cardContent.appendChild(this._contentElement);
    cardWrapper.appendChild(cardContent);
    container.appendChild(cardWrapper);
    this.appendChild(container);
    
    this._loaded = true;
    console.log('Universal Embedder: ✓ Card embedded successfully!');
  }

  getCardSize() {
    return this._config.card_size || 1;
  }
}

// ✅ UNIVERSAL EMBEDDER - FORUM READY
if (!customElements.get('universal-embedder')) {
  customElements.define('universal-embedder', UniversalEmbedder);
  
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'universal-embedder',
    name: 'Universal Embedder',
    preview: true,
    description: 'Embed cards from specific dashboards',
  });
}
