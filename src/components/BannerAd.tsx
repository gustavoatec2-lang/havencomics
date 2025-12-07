import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * Banner Ad component that loads the ad script
 * Displays at top and bottom of chapters
 * Hidden for VIP users (silver/gold)
 * Includes adblock detection
 */

interface BannerAdProps {
    onAdBlocked?: (blocked: boolean) => void;
}

const BannerAd = ({ onAdBlocked }: BannerAdProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isVip } = useAuth();
    const [adBlocked, setAdBlocked] = useState(false);

    useEffect(() => {
        // Don't show ads for VIP users
        if (isVip) return;

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

            // Check after 3 seconds if ad loaded
            const checkTimer = setTimeout(() => {
                if (containerRef.current) {
                    const container = containerRef.current;
                    // Check if any iframe or ad content was injected
                    const hasAdContent = container.querySelector('iframe') ||
                        container.querySelector('[id*="ad"]') ||
                        container.querySelector('[class*="ad"]') ||
                        container.children.length > 1;

                    // Check if container has been modified by ad script
                    const containerHeight = container.offsetHeight;

                    // If no ad content and container is still small, ad was likely blocked
                    if (!hasAdContent && containerHeight < 100) {
                        setAdBlocked(true);
                        onAdBlocked?.(true);
                    }
                }
            }, 3000);

            return () => clearTimeout(checkTimer);
        }
    }, [isVip, onAdBlocked]);

    // Don't render anything for VIP users
    if (isVip) return null;

    // Show adblock warning if detected
    if (adBlocked) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-red-950 to-black border-2 border-red-500/50 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl shadow-red-500/20">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        AdBlock Detectado! 🚫
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">Acesso Bloqueado</span>
                    </div>
                    <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                        Detectamos que você está usando um bloqueador de anúncios.
                        <br /><br />
                        <strong className="text-white">Por favor, desative seu AdBlock</strong> e recarregue a página para continuar lendo.
                    </p>
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                        <p className="text-amber-400 text-sm font-medium mb-1">✨ Alternativa Premium</p>
                        <p className="text-gray-400 text-xs">
                            Torne-se VIP e navegue <strong className="text-white">sem anúncios</strong>!
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        Já desativei, recarregar página
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full flex justify-center items-center min-h-[90px] bg-card/50"
            onClick={(e) => e.stopPropagation()}
        />
    );
};

export default BannerAd;
