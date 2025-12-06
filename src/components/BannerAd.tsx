import { useEffect, useRef } from 'react';

/**
 * Banner Ad component that loads the ad script
 * Displays at top and bottom of chapters
 */
const BannerAd = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Create and inject the banner ad script
            const script = document.createElement('script');
            script.innerHTML = `
        (function(nxva){
          var d = document,
              s = d.createElement('script'),
              l = d.scripts[d.scripts.length - 1];
          s.settings = nxva || {};
          s.src = "//cooperative-reveal.com/bjXIVssOd.Gqlv0rYsW/cl/TegmB9/ulZSUblVkMPATjYu3xMrjwE/zKNgDpk_taN/j/crydMOTeMv1DMAAg";
          s.async = true;
          s.referrerPolicy = 'no-referrer-when-downgrade';
          l.parentNode.insertBefore(s, l);
        })({})
      `;
            containerRef.current.appendChild(script);
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full flex justify-center items-center min-h-[90px] bg-card/50"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export default BannerAd;
