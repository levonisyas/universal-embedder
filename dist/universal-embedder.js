// Universal Embedder v1.0.0
// Author: Levonisyas
// Configuration Setup - DeepSeek AI optimized validation

class UniversalEmbedder extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._content = null;
    this._closeButton = null;
    this._cardId = null;
    this._dashboard = null;
  }

  setConfig(config) {
    // Configuration Setup - DeepSeek AI optimized validation
    this._config = {
      type: 'custom:universal-embedder',
      card_id: null,
      dashboard: 'lovelace',
      url: '',
      title: '',
      aspect_ratio: null,
      allow: '',
      sandbox: '',
      style: '',
      show_close: false,
      default_visible: false,
      ...config
    };
    
    this._cardId = this._config.card_id;
    this._dashboard = this._config.dashboard;
    
    // Initialize global manager if not exists
    if (!window.ueManager) {
      window.ueManager = {
        cards: new Map(),
        registerCard: function(card) {
          if (card._cardId) {
            this.cards.set(card._cardId, card);
          }
        },
        unregisterCard: function(cardId) {
          this.cards.delete(cardId);
        },
        findCard: function(cardId) {
          return this.cards.get(cardId);
        },
        showCard: function(cardId) {
          const card = this.findCard(cardId);
          if (card) {
            card.style.display = 'block';
          }
        },
        hideCard: function(cardId) {
          const card = this.findCard(cardId);
          if (card) {
            card.style.display = 'none';
          }
        },
        toggleCard: function(cardId) {
          const card = this.findCard(cardId);
          if (card) {
            if (card.style.display === 'none') {
              this.showCard(cardId);
            } else {
              this.hideCard(cardId);
            }
          }
        }
      };
    }
  }

  connectedCallback() {
    if (!this._config.url) return;
    
    // Set initial visibility based on default_visible
    this.style.display = this._config.default_visible ? 'block' : 'none';
    
    this._loadCard();
    
    // Register card with global manager if it has an ID
    if (this._cardId && window.ueManager) {
      window.ueManager.registerCard(this);
    }
  }

  disconnectedCallback() {
    // Unregister from global manager when removed
    if (this._cardId && window.ueManager) {
      window.ueManager.unregisterCard(this._cardId);
    }
  }

  async _loadCard() {
    // Clear existing content
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    // Create card container
    const card = document.createElement('div');
    card.className = 'ue-card';
    
    // Apply custom styles if provided
    if (this._config.style) {
      card.style.cssText = this._config.style;
    }

    // Create header if title exists or show_close is true
    if (this._config.title || this._config.show_close) {
      const header = document.createElement('div');
      header.className = 'ue-header';
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: var(--ha-card-background, #fff);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        font-weight: bold;
        color: var(--primary-text-color, #212121);
      `;

      // Title
      if (this._config.title) {
        const title = document.createElement('div');
        title.className = 'ue-title';
        title.textContent = this._config.title;
        title.style.cssText = `
          font-size: 16px;
          font-weight: 500;
        `;
        header.appendChild(title);
      } else {
        // Empty spacer when no title but close button exists
        const spacer = document.createElement('div');
        header.appendChild(spacer);
      }

      // Close button
      if (this._config.show_close) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ue-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--secondary-text-color, #737373);
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.3s;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.backgroundColor = 'var(--divider-color, #e0e0e0)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.backgroundColor = 'transparent';
        });
        
        closeBtn.addEventListener('click', () => {
          this.style.display = 'none';
        });
        
        this._closeButton = closeBtn;
        header.appendChild(closeBtn);
      }

      card.appendChild(header);
    }

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'ue-iframe-container';
    
    // Handle aspect ratio
    if (this._config.aspect_ratio) {
      const ratio = this._config.aspect_ratio.split(':');
      if (ratio.length === 2) {
        const width = parseInt(ratio[0]);
        const height = parseInt(ratio[1]);
        const paddingBottom = (height / width) * 100;
        iframeContainer.style.cssText = `
          position: relative;
          width: 100%;
          padding-bottom: ${paddingBottom}%;
        `;
      }
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'ue-iframe';
    iframe.src = this._config.url;
    iframe.loading = 'lazy';
    
    // Set iframe attributes
    if (this._config.allow) {
      iframe.allow = this._config.allow;
    }
    
    if (this._config.sandbox) {
      iframe.sandbox = this._config.sandbox;
    } else {
      iframe.sandbox = 'allow-scripts allow-same-origin';
    }
    
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      ${this._config.aspect_ratio ? 'position: absolute; top: 0; left: 0;' : ''}
    `;

    if (this._config.aspect_ratio) {
      iframeContainer.appendChild(iframe);
      card.appendChild(iframeContainer);
    } else {
      card.appendChild(iframe);
    }

    this._content = card;
    this.appendChild(card);
  }

  // Public methods for external control
  show() {
    this.style.display = 'block';
  }

  hide() {
    this.style.display = 'none';
  }

  toggle() {
    if (this.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  getCardId() {
    return this._cardId;
  }

  getDashboard() {
    return this._dashboard;
  }
}

// Register the custom element
customElements.define('universal-embedder', UniversalEmbedder);

// Register JavaScript service for Home Assistant
if (window.hassConnection && window.hassConnection.services) {
  const serviceName = 'javascript.ue_toggle_card';
  
  if (!window.hassConnection.services.javascript || 
      !window.hassConnection.services.javascript[serviceName]) {
    
    window.hassConnection.services.javascript = window.hassConnection.services.javascript || {};
    window.hassConnection.services.javascript[serviceName] = function(params) {
      const cardId = params.card_id;
      const dashboard = params.dashboard || 'lovelace';
      
      if (window.ueManager && cardId) {
        window.ueManager.toggleCard(cardId);
      } else {
        console.error('ueManager not found or card_id not provided');
      }
    };
    
    console.log('Universal Embedder service registered:', serviceName);
  }
}

// Alternative registration for direct JavaScript calls
if (!window.ueToggleCard) {
  window.ueToggleCard = function(cardId) {
    if (window.ueManager && cardId) {
      window.ueManager.toggleCard(cardId);
    }
  };
}
