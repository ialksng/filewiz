import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = [
    {
      name: 'Free Starter',
      price: '$0',
      description: 'Ideal for occasional document work and everyday privacy-first file tasks.',
      badge: 'Free Forever',
      features: [
        'Unlimited client-side PDF merges & splits',
        'PDF rotation, watermarking & page numbering',
        'Image compression & format conversions',
        'Developer utilities (JSON, Base64, QR, Password)',
        '100% browser-based private processing',
        'No signup required'
      ],
      cta: 'Start Free',
      ctaLink: '/tools/pdf',
      popular: false
    },
    {
      name: 'FileWiz Pro',
      price: billingCycle === 'monthly' ? '$9' : '$7',
      period: '/ month',
      description: 'For professionals and power users handling heavy documents and batch assets.',
      badge: 'Recommended',
      features: [
        'Everything in Free Starter',
        'Large batch processing (up to 100 files at once)',
        'High-resolution OCR text extraction',
        'Advanced document format conversions',
        'Cloud history & sync across devices',
        'Priority feature requests & email support'
      ],
      cta: 'Upgrade to Pro',
      ctaLink: '/signup',
      popular: true
    },
    {
      name: 'Team / Enterprise',
      price: billingCycle === 'monthly' ? '$29' : '$24',
      period: '/ month',
      description: 'For businesses requiring custom workflows, teams, and dedicated API access.',
      badge: 'Teams',
      features: [
        'Everything in Pro',
        'Up to 10 team seats included',
        'Centralized team workspace & audit logs',
        'REST API access for automated workflows',
        'Dedicated SLA & account manager'
      ],
      cta: 'Contact Sales',
      ctaLink: '/signup',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Tools you need, at a price that makes sense.
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
          Start for free without creating an account. Upgrade when you need advanced batch processing or team collaboration.
        </p>

        {/* Toggle Billing */}
        <div className="mt-8 inline-flex items-center p-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'annual' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Annual <span className="text-xs text-emerald-500 font-bold ml-1">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`bg-white rounded-3xl p-8 flex flex-col justify-between border transition-all ${
              tier.popular
                ? 'border-purple-600 shadow-xl shadow-purple-500/10 scale-105 relative'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
                Most Popular
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
              <p className="text-xs text-slate-500 mt-2 min-h-[32px]">{tier.description}</p>
              
              <div className="mt-6 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                {tier.period && <span className="text-slate-500 text-sm font-medium">{tier.period}</span>}
              </div>

              <ul className="space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                to={tier.ctaLink}
                className={`w-full block text-center py-3.5 px-6 rounded-xl font-bold transition-all text-sm ${
                  tier.popular
                    ? 'btn btn-primary shadow-md shadow-purple-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
