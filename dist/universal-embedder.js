// Universal Embedder - Original Structure Preserved
// Bug fixes applied

class UniversalEmbedder extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._content = null;
    this._closeBtn = null;
  }

  setConfig(config) {
    this._config = {
      url: '',
      title: '',
      aspect_ratio: null,
      allow: '',
      sandbox: '',
      style: '',
      // YOUR EXISTING PARAMETERS - UNCHANGED
      embed_id: null,
      dashboard: 'lovelace',
      // NEW PARAMETERS
      show_close: false,
      default_visible: true  // DEFAULT: true (görünür başlasın)
    };
    
    // Merge user config - KEEP OLD PARAMETERS (show_title, etc.)
    Object.assign(this._config, config);
    
    // Register card if it has an ID
    if (this._config.embed_id) {
      this._registerCard();
    }
  }

  connectedCallback() {
    if (!this._config.url) return;
    
    // FIX 1: Display visibility HERE, not in _loadCard
    this.style.display = this._config.default_visible ? 'block' : 'none';
    
    this._loadCard();
  }

  _registerCard() {
    // Initialize global manager if not exists
    if (!window.ueCards) {
      window.ueCards = {};
      window.ueManager = {
        showCard: function(cardId) {
          const card = window.ueCards[cardId];
          if (card) {
            card.style.display = 'block';
            console.log('Card shown:', cardId);
          }
        },
        hideCard: function(cardId) {
          const card = window.ueCards[cardId];
          if (card) {
            card.style.display = 'none';
            console.log('Card hidden:', cardId);
          }
        },
        toggleCard: function(cardId) {
          const card = window.ueCards[cardId];
          if (card) {
            card.style.display = card.style.display === 'none' ? 'block' : 'none';
            console.log('Card toggled:', cardId, 'New state:', card.style.display);
          }
        }
      };
      
      // FIX 2: Register service PROPERLY
      this._registerService();
    }
    
    // Register this card with embed_id
    if (this._config.embed_id) {
      window.ueCards[this._config.embed_id] = this;
      console.log('Card registered:', this._config.embed_id);
    }
  }

  _registerService() {
    // Check if we're in Home Assistant
    if (window.hassConnection) {
      const serviceName = 'ue_toggle_card';
      
      // Create services object if not exists
      if (!window.hassConnection.services) {
        window.hassConnection.services = {};
      }
      if (!window.hassConnection.services.javascript) {
        window.hassConnection.services.javascript = {};
      }
      
      // Register the service
      window.hassConnection.services.javascript[serviceName] = function(params) {
        console.log('Service called: ue_toggle_card', params);
        if (params && params.embed_id && window.ueManager) {
          window.ueManager.toggleCard(params.embed_id);
        } else {
          console.error('Missing embed_id or ueManager not found');
        }
      };
      
      console.log('Service registered: javascript.' + serviceName);
    }
  }

  async _loadCard() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    const card = document.createElement('div');
    card.className = 'ue-card';
    
    if (this._config.style) {
      card.style.cssText = this._config.style;
    }

    // Create header with close button if needed
    if (this._config.title || this._config.show_close) {
      const header = document.createElement('div');
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

      // Title (if exists)
      if (this._config.title) {
        const title = document.createElement('div');
        title.style.cssText = `
          font-size: 16px;
          font-weight: 500;
        `;
        title.textContent = this._config.title;
        header.appendChild(title);
      } else {
        // Empty spacer when no title
        const spacer = document.createElement('div');
        header.appendChild(spacer);
      }

      // Close button
      if (this._config.show_close) {
        const closeBtn = document.createElement('button');
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
        
        // Hover effects
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.backgroundColor = 'var(--divider-color, #e0e0e0)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.backgroundColor = 'transparent';
        });
        
        // Close functionality
        closeBtn.addEventListener('click', () => {
          this.style.display = 'none';
          console.log('Card closed via X button:', this._config.embed_id);
        });
        
        this._closeBtn = closeBtn;
        header.appendChild(closeBtn);
      }

      card.appendChild(header);
    }

    // ORIGINAL IFRAME CODE - UNCHANGED
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'ue-iframe-container';
    
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

    const iframe = document.createElement('iframe');
    iframe.className = 'ue-iframe';
    iframe.src = this._config.url;
    iframe.loading = 'lazy';
    
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
    
    console.log('Card loaded:', this._config.embed_id, 'Visible:', this.style.display);
  }

  // Helper methods for external control
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

customElements.define('universal-embedder', UniversalEmbedder);
