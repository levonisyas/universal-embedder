// ============================================================================
// Universal Embedder for Home Assistant
// ============================================================================

class UniversalEmbedder extends HTMLElement {
    // --------------------------------------------------------------------------
    // Configuration Setup - DeepSeek AI optimized validation
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
      
      // Store configuration WITH NEW PARAMETER
      this._config = {
        show_close: false,  // YENİ: Close button in header (default: false)
        ...config           // User configuration overrides defaults
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
    // Main Loading Function - DeepSeek AI optimized performance
    // --------------------------------------------------------------------------
    async _loadCard() {
      // Clean container setup
      this.style.display = 'block';
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
    // Card Discovery Function - DeepSeek AI enhanced search algorithm
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
        
        // Optional title handling
        if (this._config.show_title !== true && searchResult.card.title) {
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
    // Recursive Card Search - DeepSeek AI pattern matching algorithm
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
    // Card Content Creation - DeepSeek AI optimized rendering WITH CLOSE BUTTON
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
      
      // ============================================================================
      // YENİ: HEADER WITH CLOSE BUTTON (if show_close: true)
      // ============================================================================
      if (this._config.show_title || this._config.show_close) {
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
        
        // Title section
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
        
        // Close button (if enabled)
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
            this.style.display = 'none';
            console.log(`🔒 Universal Embedder: Card #${this._config.embed_id} closed`);
          });
          
          header.appendChild(closeBtn);
        }
        
        cardWrapper.appendChild(header);
      }
      // ============================================================================
      // END OF NEW HEADER CODE
      // ============================================================================
      
      // Content area with smart scrolling
      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      cardContent.style.flex = '1';
      cardContent.style.minHeight = '0';
      cardContent.style.display = 'flex';
      cardContent.style.flexDirection = 'column';
      cardContent.style.padding = '0';
      
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
      
      console.log(`🎉 Universal Embedder successfully embedded card #${this._config.embed_id}`);
      console.log(`   Dashboard: ${this._config.dashboard}`);
      console.log(`   Scroll enabled: ${this._config.enable_scroll !== false}`);
      console.log(`   Close button: ${this._config.show_close ? 'ENABLED' : 'disabled'}`);
    }
  
    // --------------------------------------------------------------------------
    // Card Size Helper - DeepSeek AI optimized sizing
    // --------------------------------------------------------------------------
    getCardSize() {
      return this._config.card_size || 1;
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
  // YENİ: Universal Embedder Manager - Simple Global Control
  // ============================================================================
  window.ueManager = window.ueManager || {
    // Toggle card visibility
    toggleCard: function(embed_id) {
      console.log(`🔄 UE Manager: Toggling card #${embed_id}`);
      
      // Find all Universal Embedder cards
      const cards = document.querySelectorAll('universal-embedder');
      let cardFound = false;
      
      cards.forEach(card => {
        if (card._config && card._config.embed_id === embed_id) {
          // Toggle display
          card.style.display = card.style.display === 'none' ? 'block' : 'none';
          cardFound = true;
          console.log(`✅ Card #${embed_id} ${card.style.display === 'none' ? 'hidden' : 'shown'}`);
        }
      });
      
      if (!cardFound) {
        console.warn(`⚠️ UE Manager: Card #${embed_id} not found`);
      }
      
      return cardFound;
    },
    
    // Show card
    showCard: function(embed_id) {
      const cards = document.querySelectorAll('universal-embedder');
      cards.forEach(card => {
        if (card._config && card._config.embed_id === embed_id) {
          card.style.display = 'block';
          console.log(`👁️ UE Manager: Card #${embed_id} shown`);
        }
      });
    },
    
    // Hide card
    hideCard: function(embed_id) {
      const cards = document.querySelectorAll('universal-embedder');
      cards.forEach(card => {
        if (card._config && card._config.embed_id === embed_id) {
          card.style.display = 'none';
          console.log(`🔒 UE Manager: Card #${embed_id} hidden`);
        }
      });
    },
    
    // Hide all cards
    hideAllCards: function() {
      document.querySelectorAll('universal-embedder').forEach(card => {
        card.style.display = 'none';
      });
      console.log('🔒 UE Manager: All cards hidden');
    }
  };
  
  // ============================================================================
  // YENİ: JavaScript Service Registration for Button Control
  // ============================================================================
  if (window.hassConnection) {
    // Register ue_toggle_card service
    window.hassConnection.sendMessagePromise({
      type: 'register_service',
      domain: 'javascript',
      service: 'ue_toggle_card',
      schema: {
        embed_id: 'str'
      }
    }).then(() => {
      console.log('✅ JavaScript service registered: ue_toggle_card');
    }).catch(err => {
      console.log('Note: JavaScript service registration might require HA restart');
    });
    
    // Service handler
    window.hassConnection.subscribeService('javascript.ue_toggle_card', (data) => {
      if (data.embed_id) {
        window.ueManager.toggleCard(data.embed_id);
      }
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
