import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Crown, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/premiumContextStore';
import { billingRequest } from '../services/billing';
import useSeoMetadata from '../services/useSeoMetadata';

export default function AdminPanel() {
  const { user } = useAuth();
  const { isAdmin } = usePremium();
  const [data,setData] = useState(null);
  const [price,setPrice] = useState('9');
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  useSeoMetadata({ title:'FileWiz Admin · FileWiz', description:'Manage FileWiz premium pricing and account tiers.', canonicalPath:'/admin', robots:'noindex,nofollow' });
  const load = async () => { setError(''); try { const result=await billingRequest('/admin/users'); setData(result); setPrice(String(result.monthlyPrice)); } catch(cause) { setError(cause.message); } };
  useEffect(()=>{ if (isAdmin) load(); },[isAdmin]);
  const savePrice = async event => { event.preventDefault(); setBusy(true); setNotice(''); setError(''); try { await billingRequest('/admin/price',{method:'PUT',body:JSON.stringify({amount:Number(price)})}); setNotice('Monthly price updated. New checkouts will use this amount.'); await load(); } catch(cause) { setError(cause.message); } finally { setBusy(false); } };
  const setTier = async (id,tier) => { setBusy(true); setNotice(''); setError(''); try { await billingRequest(`/admin/users/${id}/tier`,{method:'PUT',body:JSON.stringify({tier})}); setNotice(`Account tier updated to ${tier}.`); await load(); } catch(cause) { setError(cause.message); } finally { setBusy(false); } };
  if (!user) return <main className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-bold">Admin sign in required</h1><Link className="btn btn-primary mt-5" to="/login" state={{from:'/admin'}}>Sign in</Link></main>;
  if (!isAdmin) return <main className="mx-auto max-w-xl px-5 py-20 text-center"><ShieldCheck size={34} className="mx-auto text-slate-400"/><h1 className="mt-3 text-2xl font-bold">Access denied</h1><p className="mt-2 text-slate-600">This account is not on the FileWiz admin allowlist.</p></main>;
  return <main className="mx-auto min-h-[65vh] w-full max-w-6xl px-4 py-8 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-violet-700">FileWiz Admin</p><h1 className="mt-1 text-3xl font-bold">Subscriptions & users</h1><p className="mt-1 text-sm text-slate-500">Signed in as {user.email}</p></div><button onClick={load} className="btn btn-outline" disabled={busy}><RefreshCw size={16}/> Refresh</button></div>
    {notice&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={savePrice} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5"><label className="text-sm font-medium">Premium monthly price (₹)<input className="mt-1 block w-44 rounded-xl border p-3" type="number" min="1" max="10000" step="0.01" value={price} onChange={event=>setPrice(event.target.value)}/></label><button className="btn btn-primary" disabled={busy}><Save size={16}/> Save price</button><p className="basis-full text-xs text-slate-500">Current price applies to new Razorpay subscriptions; existing plans keep their original charge.</p></form>
    <section className="mt-7 overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold">Registered users {data ? `(${data.users.length})` : ''}</h2><p className="text-sm text-slate-500">Manually grant or remove Premium access.</p></div></div>{!data ? <p className="p-6 text-sm text-slate-500">Loading user list…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Account</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Tier</th><th className="px-5 py-3">Access source</th><th className="px-5 py-3">Change</th></tr></thead><tbody className="divide-y">{data.users.map(item=><tr key={item.id}><td className="px-5 py-3 font-medium">{item.email}</td><td className="px-5 py-3 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.tier==='premium'?'bg-amber-100 text-amber-900':'bg-slate-100 text-slate-700'}`}>{item.tier==='premium'&&<Crown size={12} className="mr-1 inline"/>}{item.tier}</span></td><td className="px-5 py-3 capitalize text-slate-500">{item.source}</td><td className="px-5 py-3"><button disabled={busy} onClick={()=>setTier(item.id,item.tier==='premium'?'free':'premium')} className="font-semibold text-violet-700 hover:underline disabled:opacity-50">Make {item.tier==='premium'?'free':'premium'}</button></td></tr>)}</tbody></table></div>}</section>
  </main>;
}
