/**
 * Popunder utility function
 * Triggers popunder ad when called
 */
export const triggerPopunder = () => {
  // Create and inject the popunder script dynamically
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
