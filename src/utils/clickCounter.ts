import { supabase } from '@/integrations/supabase/client';

/**
 * Click counter ad system
 * Triggers a popunder every 3 clicks anywhere on the site
 * Does NOT trigger for VIP users (silver/gold)
 */

let clickCount = 0;
let isVipUser = false;
let isInitialized = false;

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

const handleGlobalClick = async (e: MouseEvent) => {
    // Always recheck VIP status for each click to ensure it's current
    const currentVipStatus = await checkVipStatusOnce();

    // Don't count clicks for VIP users
    if (currentVipStatus) return;

    clickCount++;
    if (clickCount >= 3) {
        triggerPopunder();
        clickCount = 0; // Reset counter
    }
};

// Check VIP status from Supabase (single check)
const checkVipStatusOnce = async (): Promise<boolean> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return false;
        }

        const { data } = await supabase
            .from('profiles')
            .select('vip_tier, vip_expires_at')
            .eq('id', session.user.id)
            .single();

        if (data) {
            const tier = data.vip_tier || 'free';
            const expiresAt = data.vip_expires_at ? new Date(data.vip_expires_at) : null;
            const now = new Date();

            // Check if VIP is active (silver or gold and not expired)
            return (tier === 'silver' || tier === 'gold') &&
                (!expiresAt || expiresAt > now);
        }
        return false;
    } catch (error) {
        console.error('Error checking VIP status:', error);
        return false;
    }
};

// Check VIP status and update cached value
const checkVipStatus = async () => {
    isVipUser = await checkVipStatusOnce();
};

// Initialize the click counter on the document
export const initClickCounter = async () => {
    if (isInitialized) return;
    isInitialized = true;

    // Check VIP status initially
    await checkVipStatus();

    // Listen for auth changes to update VIP status
    supabase.auth.onAuthStateChange(async () => {
        await checkVipStatus();
    });

    // Use capture phase to catch ALL clicks before anything else
    document.addEventListener('click', handleGlobalClick, true);
};

// Cleanup function if needed
export const removeClickCounter = () => {
    document.removeEventListener('click', handleGlobalClick, true);
    isInitialized = false;
};
