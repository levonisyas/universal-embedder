// ============================================================================
// Universal Embedder for Home Assistant - ENHANCED VERSION
// ============================================================================

class UniversalEmbedder extends HTMLElement {
    // --------------------------------------------------------------------------
    // Configuration Setup
    // --------------------------------------------------------------------------
    setConfig(config) {
      // Both card_id AND dashboard are REQUIRED
      if (!config.card_id || !config.dashboard) {
        throw new Error('card_id AND dashboard required - Specify both card ID and target dashboard');
      }
      
      // Store configuration with DEFAULTS
      this._config = {
        show_close: false,      // Close button in header
        default_visible: false, // Start visible or hidden
        show_title: true,       // Show card title
        ...config               // User overrides
      };
      
      this._hass = null;
      this._loaded = false;
    }
  
    // --------------------------------------------------------------------------
    // Home Assistant Integration
    // --------------------------------------------------------------------------
    set hass(hass) {
      this._hass = hass;
      if (!this._loaded) {
        this._loadCard();
      } else if (this._contentElement) {
        this._contentElement.hass = hass;
      }
    }
  
    // --------------------------------------------------------------------------
    // Main Loading Function
    // --------------------------------------------------------------------------
    async _loadCard() {
      // Set initial visibility based on default_visible
      this.style.display = this._config.default_visible ? 'block' : 'none';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.minHeight = '0';
      this.style.padding = '0';
      this.style.margin = '0';
      this.style.borderRadius = '0';
  
      // Loading indicator
      this.innerHTML = `
        <div style="padding: 10px; text-align: center; color: var(--primary-color); font-style: italic;">
          Universal Embedder loading... 🚀
        </div>
      `;
  
      try {
        const cardConfig = await this._findCardInDashboard();
        await this._createCardContent(cardConfig);
        
        // Register with global manager if visible by default
        if (this._config.default_visible && window.ueManager) {
          window.ueManager.registerCard(this);
        }
        
      } catch (error) {
        this.innerHTML = `
          <div style="color: var(--error-color); padding: 20px; text-align: center;">
            ${error.message}<br>
            <small>Check card_id and dashboard parameters</small>
          </div>
        `;
      }
    }
  
    // --------------------------------------------------------------------------
    // Card Discovery Function
    // --------------------------------------------------------------------------
    async _findCardInDashboard() {
      const dashboard = this._config.dashboard;
      const targetId = this._config.card_id;
      
      console.log(`🔍 Universal Embedder: Searching in '${dashboard}' for card '${targetId}'`);
      
      try {
        const lovelaceConfig = await this._hass.connection.sendMessagePromise({
          type: 'lovelace/config',
          url_path: dashboard === 'lovelace' ? null : dashboard
        });
  
        const cardConfig = this._findCardInViews(lovelaceConfig.views, targetId);
        if (!cardConfig) {
          throw new Error(`Card '${targetId}' not found in dashboard '${dashboard}'`);
        }
  
        console.log(`✅ Universal Embedder: ✓ Card found in ${dashboard}`);
        
        // Optional title handling
        if (this._config.show_title !== true && cardConfig.title) {
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
  
    // --------------------------------------------------------------------------
    // Recursive Card Search
    // --------------------------------------------------------------------------
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
  
    // --------------------------------------------------------------------------
    // Header Creation (with optional close button)
    // --------------------------------------------------------------------------
    _createHeader(cardConfig) {
      const header = document.createElement('div');
      header.className = 'ue-header';
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 16px 12px 16px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        min-height: 48px;
        box-sizing: border-box;
      `;
      
      // TITLE SECTION
      const titleContainer = document.createElement('div');
      titleContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
      `;
      
      if (this._config.show_title !== false && cardConfig.title) {
        const title = document.createElement('span');
        title.className = 'ue-title';
        title.textContent = cardConfig.title;
        title.style.cssText = `
          font-weight: 500;
          font-size: 16px;
          color: var(--primary-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        titleContainer.appendChild(title);
      }
      
      header.appendChild(titleContainer);
      
      // CLOSE BUTTON SECTION (if enabled)
      if (this._config.show_close) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ue-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close card';
        closeBtn.setAttribute('aria-label', 'Close card');
        closeBtn.style.cssText = `
          background: none;
          border: none;
          color: var(--secondary-text-color, #888);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          outline: none;
        `;
        
        // Hover effects
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.backgroundColor = 'var(--primary-color, #03a9f4)';
          closeBtn.style.color = 'white';
          closeBtn.style.transform = 'scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.backgroundColor = 'transparent';
          closeBtn.style.color = 'var(--secondary-text-color, #888)';
          closeBtn.style.transform = 'scale(1)';
        });
        
        // Click event - hide card
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hideCard();
          console.log(`🔒 Universal Embedder: Card '${this._config.card_id}' closed`);
        });
        
        header.appendChild(closeBtn);
      }
      
      return header;
    }
  
    // --------------------------------------------------------------------------
    // Card Content Creation
    // --------------------------------------------------------------------------
    async _createCardContent(cardConfig) {
      const helpers = await window.loadCardHelpers();
      this._contentElement = await helpers.createCardElement(cardConfig);
      this._contentElement.hass = this._hass;
      
      // Clean container setup
      this.innerHTML = '';
      
      const container = document.createElement('div');
      container.className = 'universal-embedder-container';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.height = '100%';
      
      // Card wrapper
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
      
      // Add header if title or close button is enabled
      if (this._config.show_title || this._config.show_close) {
        const header = this._createHeader(cardConfig);
        cardWrapper.appendChild(header);
      }
      
      // Content area with smart scrolling
      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      cardContent.style.flex = '1';
      cardContent.style.minHeight = '0';
      cardContent.style.display = 'flex';
      cardContent.style.flexDirection = 'column';
      cardContent.style.padding = '0';
      
      // Scroll handling (existing functionality)
      if (this._config.enable_scroll === false) {
        cardContent.style.overflow = 'visible';
      } else {
        cardContent.style.overflowY = 'auto';
        cardContent.style.overflowX = 'hidden';
      }
      
      // Assemble the card
      cardContent.appendChild(this._contentElement);
      cardWrapper.appendChild(cardContent);
      container.appendChild(cardWrapper);
      this.appendChild(container);
      
      // Finalization
      this._loaded = true;
      
      console.log(`🎉 Universal Embedder successfully embedded card '${this._config.card_id}'`);
      console.log(`   Dashboard: ${this._config.dashboard}`);
      console.log(`   Close button: ${this._config.show_close ? 'ENABLED' : 'disabled'}`);
      console.log(`   Default visible: ${this._config.default_visible ? 'YES' : 'NO'}`);
    }
  
    // --------------------------------------------------------------------------
    // Card Visibility Control
    // --------------------------------------------------------------------------
    showCard() {
      this.style.display = 'block';
      console.log(`👁️ Universal Embedder: Card '${this._config.card_id}' shown`);
    }
  
    hideCard() {
      this.style.display = 'none';
      console.log(`🔒 Universal Embedder: Card '${this._config.card_id}' hidden`);
    }
  
    toggleCard() {
      if (this.style.display === 'none') {
        this.showCard();
      } else {
        this.hideCard();
      }
    }
  
    // --------------------------------------------------------------------------
    // Card Size Helper
    // --------------------------------------------------------------------------
    getCardSize() {
      return this._config.card_size || 1;
    }
  }
  
  // ============================================================================
  // Global Card Manager (UE Manager)
  // ============================================================================
  
  window.ueManager = window.ueManager || {
    _cards: new Map(),
    
    // Register a card
    registerCard(card) {
      if (card._config && card._config.card_id) {
        this._cards.set(card._config.card_id, card);
        console.log(`📝 UE Manager: Registered card '${card._config.card_id}'`);
      }
    },
    
    // Find a card by ID
    findCard(cardId) {
      return this._cards.get(cardId) || 
             document.querySelector(`universal-embedder[_config*="${cardId}"]`) ||
             document.querySelector(`universal-embedder[card_id="${cardId}"]`);
    },
    
    // Show a specific card
    showCard(cardId) {
      const card = this.findCard(cardId);
      if (card && card.showCard) {
        card.showCard();
        return true;
      }
      console.warn(`⚠️ UE Manager: Card '${cardId}' not found`);
      return false;
    },
    
    // Hide a specific card
    hideCard(cardId) {
      const card = this.findCard(cardId);
      if (card && card.hideCard) {
        card.hideCard();
        return true;
      }
      return false;
    },
    
    // Toggle a card (show/hide)
    toggleCard(cardId) {
      const card = this.findCard(cardId);
      if (card && card.toggleCard) {
        card.toggleCard();
        return true;
      }
      return false;
    },
    
    // Hide all Universal Embedder cards
    hideAllCards() {
      document.querySelectorAll('universal-embedder').forEach(card => {
        if (card.hideCard) card.hideCard();
      });
      console.log('🔒 UE Manager: All cards hidden');
    },
    
    // Show all Universal Embedder cards
    showAllCards() {
      document.querySelectorAll('universal-embedder').forEach(card => {
        if (card.showCard) card.showCard();
      });
    }
  };
  
  // ============================================================================
  // JavaScript Services for Home Assistant
  // ============================================================================
  
  // Register JavaScript services when Home Assistant connection is available
  if (window.hassConnection) {
    window.hassConnection.subscribeEvents(() => {
      // Service: ue_toggle_card
      window.hassConnection.sendMessagePromise({
        type: 'register_service',
        domain: 'javascript',
        service: 'ue_toggle_card',
        schema: {
          card_id: 'str',
          dashboard: 'str'
        }
      }).then(() => {
        console.log('✅ JavaScript service registered: ue_toggle_card');
      });
      
      // Service: ue_hide_all
      window.hassConnection.sendMessagePromise({
        type: 'register_service',
        domain: 'javascript',
        service: 'ue_hide_all'
      }).then(() => {
        console.log('✅ JavaScript service registered: ue_hide_all');
      });
    }, 'universal_embedder_services');
    
    // Service handler for ue_toggle_card
    window.hassConnection.subscribeService('javascript.ue_toggle_card', (data) => {
      if (data.card_id) {
        console.log(`🔄 UE Toggle Card service called for: ${data.card_id}`);
        window.ueManager.toggleCard(data.card_id);
      }
    });
    
    // Service handler for ue_hide_all
    window.hassConnection.subscribeService('javascript.ue_hide_all', () => {
      console.log('🔄 UE Hide All service called');
      window.ueManager.hideAllCards();
    });
  }
  
  // ============================================================================
  // Custom Element Registration
  // ============================================================================
  
  if (!customElements.get('universal-embedder')) {
    customElements.define('universal-embedder', UniversalEmbedder);
    
    // Lovelace editor integration
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: 'universal-embedder',
      name: 'Universal Embedder',
      preview: true,
      description: 'Card Embedding with close button and visibility control - Powered by DeepSeek AI 🤖',
    });
    
    console.log('🎉 Universal Embedder Enhanced registered successfully!');
  }
