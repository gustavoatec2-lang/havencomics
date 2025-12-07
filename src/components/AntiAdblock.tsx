import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Shield } from 'lucide-react';

/**
 * Anti-Adblock Detection System
 * Uses bait element detection to catch adblockers
 * VIP users are exempt from this check
 */

const AntiAdblock = () => {
    const { isVip, loading } = useAuth();
    const [adblockDetected, setAdblockDetected] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (loading) return;

        // VIP users are exempt
        if (isVip) {
            setChecking(false);
            return;
        }

        // Start detection after a small delay to let page load
        const timer = setTimeout(() => {
            detectAdblock();
        }, 1000);

        return () => clearTimeout(timer);
    }, [loading, isVip]);

    const detectAdblock = async () => {
        let detectionScore = 0;

        // Method 1: Bait element with ad-like classes
        try {
            const bait = document.createElement('div');
            bait.className = 'adsbox ad-banner textAd banner_ad';
            bait.style.cssText = 'width: 1px; height: 1px; position: fixed; left: -9999px; top: -9999px; pointer-events: none;';
            bait.innerHTML = '&nbsp;';
            document.body.appendChild(bait);

            await new Promise(resolve => setTimeout(resolve, 200));

            const style = window.getComputedStyle(bait);
            if (bait.offsetHeight === 0 ||
                bait.offsetWidth === 0 ||
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                bait.offsetParent === null) {
                detectionScore += 2; // High confidence
            }
            document.body.removeChild(bait);
        } catch (e) {
            // Error during test, don't count as detection
        }

        // Method 2: Another bait with different classes
        try {
            const bait2 = document.createElement('div');
            bait2.id = 'ad-container';
            bait2.className = 'ad-placement ad-zone sponsored-content';
            bait2.style.cssText = 'width: 1px; height: 1px; position: fixed; left: -9999px; top: -9999px;';
            bait2.innerHTML = '<span class="ad">ad</span>';
            document.body.appendChild(bait2);

            await new Promise(resolve => setTimeout(resolve, 200));

            const style = window.getComputedStyle(bait2);
            if (bait2.offsetHeight === 0 ||
                style.display === 'none' ||
                style.visibility === 'hidden') {
                detectionScore += 2; // High confidence
            }
            document.body.removeChild(bait2);
        } catch (e) { }

        // Method 3: Check for known adblocker globals (low confidence)
        const testWindow = window as any;
        if (testWindow.adblockEnabled ||
            testWindow._AdBlocker ||
            testWindow.fuckAdBlock ||
            testWindow.blockAdBlock) {
            detectionScore += 1;
        }

        // Only mark as detected if we have high confidence (score >= 2)
        // This prevents false positives
        setAdblockDetected(detectionScore >= 2);
        setChecking(false);
    };

    // Don't show anything while checking or for VIP users
    if (checking || !adblockDetected || isVip) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-red-950 to-black border-2 border-red-500/50 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in duration-300">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-red-500" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2">
                    AdBlock Detectado! 🚫
                </h2>

                {/* Warning */}
                <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-medium">Acesso Bloqueado</span>
                </div>

                {/* Message */}
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                    Detectamos que você está usando um bloqueador de anúncios.
                    <br /><br />
                    Nosso site depende de anúncios para continuar funcionando e trazendo conteúdo gratuito para você.
                    <br /><br />
                    <strong className="text-white">Por favor, desative seu AdBlock</strong> e recarregue a página para continuar lendo.
                </p>

                {/* VIP Promo */}
                <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                    <p className="text-amber-400 text-sm font-medium mb-1">
                        ✨ Alternativa Premium
                    </p>
                    <p className="text-gray-400 text-xs">
                        Torne-se VIP e navegue <strong className="text-white">sem anúncios</strong>!
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
                >
                    Já desativei, recarregar página
                </button>

                {/* Footer */}
                <p className="text-gray-500 text-xs mt-4">
                    Obrigado por apoiar o HavenComics! 💜
                </p>
            </div>
        </div>
    );
};

export default AntiAdblock;
