import { createContext, useContext } from 'react';

export const PremiumContext = createContext({ tier:'free', isAdmin:false, loading:false, refresh:async()=>{} });
export const usePremium = () => useContext(PremiumContext);
