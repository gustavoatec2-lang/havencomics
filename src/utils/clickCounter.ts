/**
 * Click counter ad system
 * Triggers a popunder every 3 clicks anywhere on the site
 */

let clickCount = 0;

const triggerPopunder = () => {
    const script = document.createElement('script');
    script.innerHTML = `
    (function(ihrc){
      var d = document,
          s = d.createElement('script'),
          l = d.scripts[d.scripts.length - 1];
      s.settings = ihrc || {};
      s.src = "//snappypart.com/cPD/9J6.bv2p5blYSkW/QK9sN-jtcCyDM_T/M/ytMnir0I2/NizjIdxdMZzWIzzO";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
    })({})
  `;
    document.body.appendChild(script);
};

const handleGlobalClick = (e: MouseEvent) => {
    clickCount++;
    console.log('Click count:', clickCount); // Debug
    if (clickCount >= 3) {
        triggerPopunder();
        clickCount = 0; // Reset counter
    }
};

// Initialize the click counter on the document
export const initClickCounter = () => {
    // Use capture phase to catch ALL clicks before anything else
    document.addEventListener('click', handleGlobalClick, true);
};

// Cleanup function if needed
export const removeClickCounter = () => {
    document.removeEventListener('click', handleGlobalClick, true);
};
