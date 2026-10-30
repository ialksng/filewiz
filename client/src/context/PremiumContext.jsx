import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { billingRequest } from '../services/billing';
import { PremiumContext } from './premiumContextStore';

export function PremiumProvider({ children }) {
  const { user } = useAuth();
  const [plan,setPlan] = useState({ tier:'free', isAdmin:false });
  const [loading,setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!user) { setPlan({ tier:'free', isAdmin:false }); setLoading(false); return; }
    setLoading(true);
    try { const value = await billingRequest('/me'); setPlan(value); }
    catch { setPlan({ tier:'free', isAdmin:false, unavailable:true }); }
    finally { setLoading(false); }
  },[user]);
  useEffect(() => { refresh(); },[refresh]);
  return <PremiumContext.Provider value={{ ...plan, loading, refresh }}>{children}</PremiumContext.Provider>;
}
