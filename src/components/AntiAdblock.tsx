import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, Shield } from 'lucide-react';

/**
 * Anti-Adblock Detection System
 * Only activates on pages with ads (reader pages)
 * Uses actual ad script testing to detect blockers
 * VIP users are exempt
 */

const AntiAdblock = () => {
    const { isVip, loading } = useAuth();
    const location = useLocation();
    const [adblockDetected, setAdblockDetected] = useState(false);
    const [checking, setChecking] = useState(true);

    // Only check for adblock on pages that have ads (reader pages)
    const isAdPage = location.pathname.includes('/ler/');

    useEffect(() => {
        if (loading || !isAdPage) {
            setChecking(false);
            return;
        }

        // VIP users are exempt
        if (isVip) {
            setChecking(false);
            return;
        }

        // Start detection after ads should have loaded
        const timer = setTimeout(() => {
            detectAdblock();
        }, 2000);

        return () => clearTimeout(timer);
    }, [loading, isVip, isAdPage]);

    const detectAdblock = async () => {
        // Method 1: Try to fetch a known ad network script
        // If blocked by adblocker, this will fail
        const adUrls = [
            'https://www.googletagservices.com/tag/js/gpt.js',
            'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
        ];

        let blocked = false;

        // Create a test element that adblockers typically target
        const testDiv = document.createElement('div');
        testDiv.id = 'google_ads_iframe_test';
        testDiv.className = 'adsbygoogle';
        testDiv.style.cssText = 'position: fixed; left: -9999px; top: -9999px; width: 300px; height: 250px;';
        document.body.appendChild(testDiv);

        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if element was hidden by adblocker
        const style = window.getComputedStyle(testDiv);
        if (testDiv.offsetHeight === 0 ||
            testDiv.offsetWidth === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden') {
            blocked = true;
        }

        // Also check if inner content was removed
        if (testDiv.innerHTML === '' && testDiv.childNodes.length === 0) {
            // This is normal, don't count as blocked
        }

        document.body.removeChild(testDiv);

        // Method 2: Check for uBlock/ABP specific indicators
        const checkWindow = window as any;
        if (checkWindow.uBO ||
            checkWindow.uBlock ||
            checkWindow.ABP ||
            document.documentElement.getAttribute('data-adblockkey')) {
            blocked = true;
        }

        // Method 3: Check if ads actually loaded on the page
        // Look for our ad containers
        const adContainers = document.querySelectorAll('[data-ad-slot], .banner-ad-container, [class*="ChapterAds"]');
        if (adContainers.length > 0) {
            // Check if any ad container is empty or hidden
            adContainers.forEach(container => {
                const el = container as HTMLElement;
                if (el.offsetHeight === 0 || el.childNodes.length === 0) {
                    // Ad container exists but is empty - might be blocked
                    // But don't trigger just based on this
                }
            });
        }

        setAdblockDetected(blocked);
        setChecking(false);
    };

    // Don't show on non-ad pages, while checking, or for VIP users
    if (!isAdPage || checking || !adblockDetected || isVip) {
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
                    Detectamos que você está usando um bloqueador de anúncios (uBlock Origin, AdBlock, Brave Shield, etc).
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
