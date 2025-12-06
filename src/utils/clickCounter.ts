/**
 * Click counter ad system
 * Triggers an ad every 3 clicks anywhere on the site
 */

let clickCount = 0;

const triggerClickAd = () => {
    const script = document.createElement('script');
    script.innerHTML = `
    (function(cru){
      var d = document,
          s = d.createElement('script'),
          l = d.scripts[d.scripts.length - 1];
      s.settings = cru || {};
      s.src = "//snappypart.com/cvDz9-6/b.2U5TlzSGW/Qh9hNRjhcgy/MJTlMqygM_iP0a2/NAzSIvxSMYz_IIzx";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
    })({})
  `;
    document.body.appendChild(script);
};

const handleGlobalClick = () => {
    clickCount++;
    if (clickCount >= 3) {
        triggerClickAd();
        clickCount = 0; // Reset counter
    }
};

// Initialize the click counter on the document
export const initClickCounter = () => {
    document.addEventListener('click', handleGlobalClick);
};

// Cleanup function if needed
export const removeClickCounter = () => {
    document.removeEventListener('click', handleGlobalClick);
};
