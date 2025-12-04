// Universal Embedder - PURE ORIGINAL + 2 features
// NO service, NO global manager - SIMPLE!

class UniversalEmbedder extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._content = null;
    this._closeBtn = null;
    this._isVisible = true; // Track visibility
  }

  setConfig(config) {
    // ORIGINAL CONFIG - EXACTLY AS BEFORE
    this._config = {
      url: config.url || '',
      title: config.title || '',
      aspect_ratio: config.aspect_ratio || null,
      allow: config.allow || '',
      sandbox: config.sandbox || '',
      style: config.style || '',
      embed_id: config.embed_id || null,
      dashboard: config.dashboard || 'lovelace',
      // NEW: Just 2 parameters added
      show_close: config.show_close || false,
      default_visible: config.default_visible !== false // Default: true
    };
  }

  connectedCallback() {
    if (!this._config.url) {
      console.error('Universal Embedder: No URL provided');
      return;
    }
    
    // Set initial visibility
    this._isVisible = this._config.default_visible;
    this.style.display = this._isVisible ? 'block' : 'none';
    
    this._loadCard();
    console.log('Universal Embedder loaded:', this._config.embed_id, 
                'Visible:', this._isVisible, 
                'Show close:', this._config.show_close);
  }

  async _loadCard() {
    // Clear existing
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    const card = document.createElement('div');
    card.className = 'ue-card';
    
    // Apply custom styles
    if (this._config.style) {
      card.style.cssText = this._config.style;
    }

    // HEADER - Modified for close button
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

      // Title
      if (this._config.title) {
        const title = document.createElement('div');
        title.textContent = this._config.title;
        title.style.cssText = 'font-size: 16px; font-weight: 500;';
        header.appendChild(title);
      } else {
        header.appendChild(document.createElement('div')); // Spacer
      }

      // CLOSE BUTTON - ONLY if show_close: true
      if (this._config.show_close) {
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close';
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
        
        // Hover effect
        closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = 'var(--divider-color, #e0e0e0)';
        closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = 'transparent';
        
        // Close action
        closeBtn.onclick = () => {
          this.style.display = 'none';
          this._isVisible = false;
          console.log('Embedder closed via X button');
        };
        
        this._closeBtn = closeBtn;
        header.appendChild(closeBtn);
      }

      card.appendChild(header);
    }

    // IFRAME - ORIGINAL CODE (NO CHANGES)
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
    
    iframe.sandbox = this._config.sandbox || 'allow-scripts allow-same-origin';
    
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

  // Simple visibility methods
  show() {
    this.style.display = 'block';
    this._isVisible = true;
  }

  hide() {
    this.style.display = 'none';
    this._isVisible = false;
  }

  toggle() {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Register element
if (!customElements.get('universal-embedder')) {
  customElements.define('universal-embedder', UniversalEmbedder);
}
