import { supabase } from '@/integrations/supabase/client';

/**
 * Popunder utility function
 * Triggers popunder ad when called
 * Does NOT trigger for VIP users (silver/gold)
 */

// Check VIP status before triggering popunder
const checkIsVip = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('vip_tier, vip_expires_at')
    .eq('id', session.user.id)
    .single();

  if (data) {
    const tier = data.vip_tier || 'free';
    const expiresAt = data.vip_expires_at ? new Date(data.vip_expires_at) : null;
    const now = new Date();

    return (tier === 'silver' || tier === 'gold') &&
      (!expiresAt || expiresAt > now);
  }
  return false;
};

export const triggerPopunder = async () => {
  // Check if user is VIP
  const isVip = await checkIsVip();
  if (isVip) return; // Don't show ads for VIP users

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
