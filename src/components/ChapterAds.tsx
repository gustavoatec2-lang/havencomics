import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * In-chapter ads component
 * Loads two ad scripts that display within chapter content
 * Hidden for VIP users (silver/gold)
 */
const ChapterAds = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isVip } = useAuth();

    useEffect(() => {
        // Don't show ads for VIP users
        if (isVip) return;

        if (containerRef.current) {
            // First ad script (qcybzza)
            const script1 = document.createElement('script');
            script1.innerHTML = `
        (function(qcybzza){
          var d = document,
              s = d.createElement('script'),
              l = d.scripts[d.scripts.length - 1];
          s.settings = qcybzza || {};
          s.src = "//cooperative-reveal.com/b/X.VfsRdAGvlJ0VYTW/cu/Ve/mf9AufZjUrlCkmPVTuYL3/M/juEdzRNRTQc/t/NjjwcfyMMQTyM/1aOLAo";
          s.async = true;
          s.referrerPolicy = 'no-referrer-when-downgrade';
          l.parentNode.insertBefore(s, l);
        })({})
      `;
            containerRef.current.appendChild(script1);

            // Second ad script (ld)
            const script2 = document.createElement('script');
            script2.innerHTML = `
        (function(ld){
          var d = document,
              s = d.createElement('script'),
              l = d.scripts[d.scripts.length - 1];
          s.settings = ld || {};
          s.src = "//cooperative-reveal.com/bRX.VJsodsGIl/0qYMWzct/leUmI9uu/Z-UWllkDPpT/Yj3GMwjYE/zNNRjBEstkNYjIcKy/MsT_Mg2xMHgT";
          s.async = true;
          s.referrerPolicy = 'no-referrer-when-downgrade';
          l.parentNode.insertBefore(s, l);
        })({})
      `;
            containerRef.current.appendChild(script2);
        }
    }, [isVip]);

    // Don't render anything for VIP users
    if (isVip) return null;

    return (
        <div
            ref={containerRef}
            className="w-full"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export default ChapterAds;
