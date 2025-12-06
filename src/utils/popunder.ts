/**
 * Popunder utility function
 * Triggers popunder ad when called
 */
export const triggerPopunder = () => {
    // Create and inject the popunder script dynamically
    const script = document.createElement('script');
    script.innerHTML = `
    (function(cfx){
      var d = document,
          s = d.createElement('script'),
          l = d.scripts[d.scripts.length - 1];
      s.settings = cfx || {};
      s.src = "//snappypart.com/c.Dz9d6wbk2/5Ml/SwWIQT9zN/j/c-yMMZTOMzyHMriw0D2gNFzNI/xaMRzdIczT";
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      l.parentNode.insertBefore(s, l);
    })({})
  `;
    document.body.appendChild(script);
};
