// ============================================================================
// Universal Embedder for Home Assistant
// ============================================================================

class UniversalEmbedder extends HTMLElement {
    // --------------------------------------------------------------------------
    // Configuration Setup - optimized validation
    // --------------------------------------------------------------------------
    setConfig(config) {
      // Both embed_id AND dashboard are REQUIRED
      if (!config.embed_id || !config.dashboard) {
        throw new Error('Universal Embedder requires both embed_id AND dashboard parameters');
      }
      
      // Validate embed_id format: 001-999 (3 digits)
      const embedIdRegex = /^\d{3}$/;
      if (!embedIdRegex.test(config.embed_id.toString())) {
        throw new Error('embed_id must be a 3-digit number (001-999)');
      }
      
      // Store configuration with new parameters
      this._config = {
        ...config,
        show_close: config.show_close || false,      // X butonu için
        embedder_title: config.embedder_title || '',  // Universal Embedder başlığı
        show_title: config.show_title !== false,     // Default: true
        default_visible: config.default_visible !== false  // Default: true (backward compatibility)
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
    // Main Loading Function - optimized performance
    // --------------------------------------------------------------------------
    async _loadCard() {
      // Clean container setup
      this.style.display = this._config.default_visible ? 'block' : 'none'; // NEW: default_visible kontrolü
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.minHeight = '0';
      this.style.padding = '0';
      this.style.margin = '0';
      this.style.borderRadius = '0';
  
      // Loading indicator
      this.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--primary-color);">
          <div style="font-style: italic; margin-bottom: 10px;">
            Universal Embedder initializing...
          </div>
          <div style="font-size: 0.9em; color: var(--secondary-text-color);">
            Searching for card ID: <strong>${this._config.embed_id}</strong>
          </div>
        </div>
      `;
  
      try {
        const cardConfig = await this._findCardByEmbedId();
        await this._createCardContent(cardConfig);
        
        // HASH CONTROL - YENİ EKLENDİ
        this._setupHashControl();
        
      } catch (error) {
        // User-friendly error messages
        this.innerHTML = `
          <div style="color: var(--error-color); padding: 20px; text-align: center;">
            <div style="font-size: 1.2em; margin-bottom: 10px;">
              🔍 Embedding Failed
            </div>
            <div style="margin-bottom: 15px;">
              ${error.message}
            </div>
            <div style="font-size: 0.9em; color: var(--secondary-text-color);">
              <strong>Troubleshooting tips:</strong><br>
              1. Add <code>icon: EMBED#${this._config.embed_id}</code> to your source card<br>
              2. Verify dashboard name: "${this._config.dashboard}"<br>
              3. Ensure embed_id is unique (001-999)
            </div>
          </div>
        `;
      }
    }
  
    // --------------------------------------------------------------------------
    // HASH CONTROL FUNCTIONS - YENİ EKLENDİ (BUTON KONTROLÜ)
    // --------------------------------------------------------------------------
    _setupHashControl() {
      // Hash değişimini dinle
      window.addEventListener('hashchange', () => this._checkHash());
      
      // İlk yüklemede kontrol et
      setTimeout(() => this._checkHash(), 100);
    }
    
    _checkHash() {
      const hash = window.location.hash; // Örnek: #embed_001
      const myHash = `#embed_${this._config.embed_id}`; // #embed_001
      
      console.log(`🔗 Universal Embedder: Hash check - Current: "${hash}", My hash: "${myHash}"`);
      
      if (hash === myHash) {
        // Hash benim embed_id'm ile eşleşiyor - AÇ
        console.log(`✅ Universal Embedder: Hash matched! Opening embedder ${this._config.embed_id}`);
        this.style.display = 'block';
        
        // Diğer embedder'ları KAPAT
        this._closeOtherEmbedders();
      }
      // Eğer hash yoksa veya başka bir hash ise, hiçbir şey yapma
      // (default_visible değeri korunur)
    }
    
    _closeOtherEmbedders() {
      // Aynı view'deki diğer embedder'ları bul
      const view = this.closest('hui-view');
      if (!view) {
        console.log('⚠️ Universal Embedder: No view found for closing others');
        return;
      }
      
      const embedders = view.querySelectorAll('universal-embedder');
      let closedCount = 0;
      
      embedders.forEach(embedder => {
        if (embedder !== this && embedder._config) {
          embedder.style.display = 'none';
          closedCount++;
        }
      });
      
      console.log(`📌 Universal Embedder: Closed ${closedCount} other embedder(s)`);
    }
  
    // --------------------------------------------------------------------------
    // Card Discovery Function - search algorithm
    // --------------------------------------------------------------------------
    async _findCardByEmbedId() {
      const dashboard = this._config.dashboard;
      const targetId = this._config.embed_id;
      
      console.log(`🔍 Universal Embedder: Searching for card #${targetId} in '${dashboard}'`);
      
      try {
        // Fetch dashboard configuration
        const lovelaceConfig = await this._hass.connection.sendMessagePromise({
          type: 'lovelace/config',
          url_path: dashboard === 'lovelace' ? null : dashboard
        });
  
        // Search through all views
        const searchResult = this._searchCardInViews(lovelaceConfig.views, targetId);
        
        if (!searchResult.found) {
          throw new Error(`Card with embed ID #${targetId} not found in dashboard '${dashboard}'`);
        }
  
        if (searchResult.duplicate) {
          console.warn(`⚠️ Universal Embedder: Duplicate embed ID #${targetId} found! Using first occurrence.`);
        }
  
        console.log(`✅ Universal Embedder: Successfully located card #${targetId} in ${dashboard}`);
        
        // Kaynak kartın title'ını gizle (show_title: false ise)
        if (this._config.show_title === false && searchResult.card.title) {
          delete searchResult.card.title;
        }
        
        return searchResult.card;
        
      } catch (err) {
        if (err.message.includes('Not found')) {
          throw new Error(`Dashboard '${dashboard}' not found or inaccessible`);
        }
        throw new Error(`Search error: ${err.message}`);
      }
    }
  
    // --------------------------------------------------------------------------
    // Recursive Card Search -pattern matching algorithm
    // --------------------------------------------------------------------------
    _searchCardInViews(views, targetId) {
      let foundCard = null;
      let duplicateFound = false;
      
      const searchRecursive = (cards, path = '') => {
        if (!cards) return;
        
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const cardPath = path ? `${path}/cards/${i}` : `view_${i}`;
          
          // Check icon property for EMBED#001 format
          if (card && typeof card === 'object') {
            if (card.icon && typeof card.icon === 'string') {
              const iconMatch = card.icon.match(/^EMBED#(\d{3})$/i);
              if (iconMatch && iconMatch[1] === targetId) {
                if (foundCard) {
                  duplicateFound = true;
                } else {
                  foundCard = card;
                  console.log(`   Found at path: ${cardPath} (via icon: ${card.icon})`);
                }
              }
            }
            
            // Recursive search for nested cards
            if (card.cards && Array.isArray(card.cards)) {
              searchRecursive(card.cards, `${cardPath}/cards`);
            }
            
            // Support for vertical/horizontal stacks
            if (card.type && card.type.includes('stack') && card.cards) {
              searchRecursive(card.cards, `${cardPath}/stack`);
            }
          }
        }
      };
      
      // Process all views
      views.forEach((view, viewIndex) => {
        if (view.cards) {
          searchRecursive(view.cards, `view_${viewIndex}`);
        }
      });
      
      return {
        found: !!foundCard,
        card: foundCard,
        duplicate: duplicateFound
      };
    }
  
    // --------------------------------------------------------------------------
    // Card Content Creation - optimized rendering
    // --------------------------------------------------------------------------
    async _createCardContent(cardConfig) {
      const helpers = await window.loadCardHelpers();
      
      // Create card element
      const cardConfigCopy = JSON.parse(JSON.stringify(cardConfig));
      this._contentElement = await helpers.createCardElement(cardConfigCopy);
      this._contentElement.hass = this._hass;
      
      // Clean container setup
      this.innerHTML = '';
      
      const container = document.createElement('div');
      container.className = 'universal-embedder-container';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.height = '100%';
      
      // Card wrapper - HA ORJINAL HEADER YAPISI
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
      
      // HA Header - Sadece embedder_title veya show_close varsa
      if (this._config.embedder_title || this._config.show_close) {
        const header = document.createElement('div');
        header.className = 'card-header';
        header.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          min-height: 48px;
        `;
        
        // Sol taraf: embedder_title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'name';
        titleDiv.textContent = this._config.embedder_title || '';
        titleDiv.style.cssText = `
          font-size: 16px;
          font-weight: 500;
          color: var(--primary-text-color);
          flex: 1;
        `;
        header.appendChild(titleDiv);
        
        // Sağ taraf: X butonu (show_close: true ise)
        if (this._config.show_close) {
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '×';
          closeButton.className = 'close-button';
          closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--secondary-text-color);
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.3s;
            margin: 0;
          `;
          
          // Hover efekti
          closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = 'var(--divider-color, #e0e0e0)';
          });
          
          closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
          });
          
          // Kapatma fonksiyonu
          closeButton.addEventListener('click', () => {
            this.style.display = 'none';
            console.log(`❌ Universal Embedder: Closed via X button - embed_id: ${this._config.embed_id}`);
          });
          
          header.appendChild(closeButton);
        }
        
        cardWrapper.appendChild(header);
      }
      
      // Content area - minimum yükseklik
      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      cardContent.style.cssText = `
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: ${this._config.enable_scroll === false ? 'visible' : 'auto'};
      `;
      
      // Assemble the card
      cardContent.appendChild(this._contentElement);
      cardWrapper.appendChild(cardContent);
      container.appendChild(cardWrapper);
      this.appendChild(container);
      
      // Finalization
      this._loaded = true;
      
      console.log(`🎉 Universal Embedder successfully embedded card #${this._config.embed_id}`);
      console.log(`   Dashboard: ${this._config.dashboard}`);
      console.log(`   Embedder Title: "${this._config.embedder_title}"`);
      console.log(`   Show Close: ${this._config.show_close}`);
      console.log(`   Show Title: ${this._config.show_title}`);
      console.log(`   Default Visible: ${this._config.default_visible}`);
      console.log(`   Hash Control: ACTIVE (use #embed_${this._config.embed_id})`);
    }
  
    // --------------------------------------------------------------------------
    // Card Size Helper - optimized sizing
    // --------------------------------------------------------------------------
    getCardSize() {
      return this._config.card_size || 1;
    }
    
    // --------------------------------------------------------------------------
    // Public methods for external control
    // --------------------------------------------------------------------------
    show() {
      this.style.display = 'block';
    }
    
    hide() {
      this.style.display = 'none';
    }
    
    toggle() {
      this.style.display = this.style.display === 'none' ? 'block' : 'none';
    }
  }
  
  // ============================================================================
  // Custom Element Registration - SIMPLE & COMPATIBLE
  // ============================================================================
  if (!customElements.get('universal-embedder')) {
    customElements.define('universal-embedder', UniversalEmbedder);
    
    // Lovelace editor integration
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: 'universal-embedder',
      name: 'Universal Embedder',
      preview: true,
      description: 'Card Embedding - Universal solution',
    });
  }
  
  // ============================================================================
  // Helper Functions (Optional - for future enhancements)
  // ============================================================================
  window.embedderHelpers = window.embedderHelpers || {
    // Find unused embed IDs
    findUnusedId: async function(hass, dashboard = 'lovelace') {
      console.log('Universal Embedder: Analyzing available embed IDs...');
      
      try {
        const config = await hass.connection.sendMessagePromise({
          type: 'lovelace/config',
          url_path: dashboard === 'lovelace' ? null : dashboard
        });
        
        const usedIds = new Set();
        const iconPattern = /^EMBED#(\d{3})$/gi;
        
        const collectIds = (cards) => {
          if (!cards) return;
          
          cards.forEach(card => {
            if (card && typeof card === 'object') {
              if (card.icon) {
                const match = card.icon.match(iconPattern);
                if (match) usedIds.add(match[1]);
              }
              
              if (card.cards) {
                collectIds(card.cards);
              }
            }
          });
        };
        
        config.views.forEach(view => collectIds(view.cards));
        
        // Find first unused ID
        for (let i = 1; i <= 999; i++) {
          const id = i.toString().padStart(3, '0');
          if (!usedIds.has(id)) {
            console.log(`✅ Available embed ID: ${id}`);
            return id;
          }
        }
        
        console.warn('⚠️ All embed IDs (001-999) are in use!');
        return null;
        
      } catch (error) {
        console.error('ID search failed:', error);
        return '001';
      }
    },
    
    // Validate embed ID format
    validateEmbedId: function(id) {
      const regex = /^\d{3}$/;
      if (!regex.test(id)) {
        throw new Error('embed_id must be 3 digits (001-999)');
      }
      
      const num = parseInt(id, 10);
      if (num < 1 || num > 999) {
        throw new Error('embed_id must be between 001 and 999');
      }
      
      return true;
    }
  };
