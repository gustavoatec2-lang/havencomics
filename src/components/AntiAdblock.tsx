import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Shield, X } from 'lucide-react';

/**
 * Anti-Adblock Detection System
 * Uses multiple detection methods to catch adblockers
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

        // Start detection
        detectAdblock();
    }, [loading, isVip]);

    const detectAdblock = async () => {
        let detected = false;

        // Method 1: Bait element detection
        try {
            const bait = document.createElement('div');
            bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner';
            bait.style.cssText = 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;';
            bait.innerHTML = '&nbsp;';
            document.body.appendChild(bait);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (bait.offsetParent === null ||
                bait.offsetHeight === 0 ||
                bait.offsetWidth === 0 ||
                bait.clientHeight === 0 ||
                window.getComputedStyle(bait).display === 'none' ||
                window.getComputedStyle(bait).visibility === 'hidden') {
                detected = true;
            }
            document.body.removeChild(bait);
        } catch (e) {
            // If error, might be blocked
        }

        // Method 2: Script fetch detection
        if (!detected) {
            try {
                const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
                    method: 'HEAD',
                    mode: 'no-cors',
                });
                // If we get here without error, usually not blocked
            } catch (e) {
                detected = true;
            }
        }

        // Method 3: Ad script injection test
        if (!detected) {
            try {
                const testAd = document.createElement('div');
                testAd.id = 'ad-test-banner';
                testAd.innerHTML = '<img src="about:blank" style="display:none" onerror="this.parentNode.dataset.loaded=\'true\'">';
                testAd.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
                testAd.className = 'adsbygoogle adsbox ad-placement';
                document.body.appendChild(testAd);

                await new Promise(resolve => setTimeout(resolve, 100));

                if (testAd.offsetHeight === 0 || window.getComputedStyle(testAd).display === 'none') {
                    detected = true;
                }
                document.body.removeChild(testAd);
            } catch (e) { }
        }

        // Method 4: Check for common adblock extensions
        if (!detected) {
            const testWindow = window as any;
            if (testWindow.AdBlock ||
                testWindow.adblockEnabled ||
                testWindow._AdBlocker ||
                document.querySelector('.adblock-notice')) {
                detected = true;
            }
        }

        // Method 5: Double-check with another bait
        if (!detected) {
            try {
                const adFrame = document.createElement('iframe');
                adFrame.style.cssText = 'width: 1px; height: 1px; position: absolute; left: -9999px; top: -9999px;';
                adFrame.src = 'about:blank';
                adFrame.className = 'ad ad-banner ad-zone adsbox';
                document.body.appendChild(adFrame);

                await new Promise(resolve => setTimeout(resolve, 100));

                if (!adFrame.contentWindow ||
                    adFrame.offsetHeight === 0 ||
                    window.getComputedStyle(adFrame).display === 'none') {
                    detected = true;
                }
                document.body.removeChild(adFrame);
            } catch (e) {
                detected = true;
            }
        }

        setAdblockDetected(detected);
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
