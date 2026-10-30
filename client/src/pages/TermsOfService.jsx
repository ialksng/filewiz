import useSeoMetadata from '../services/useSeoMetadata';

export default function TermsOfService() {
  useSeoMetadata({
    title: 'Terms of Service · FileWiz',
    description: 'Read the terms for using FileWiz online file tools and services.',
    canonicalPath: '/terms',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-400">Effective Date: October 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using FileWiz, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Appropriate Use</h2>
          <p>
            You agree not to use FileWiz to process files containing malicious code, illegal materials, or content that violates intellectual property laws. You retain full ownership and intellectual rights to any files you process through the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Service Availability & Warranty Disclaimer</h2>
          <p>
            FileWiz is provided on an "as-is" and "as-available" basis without warranties of any kind. While we strive to ensure total data accuracy and reliability, we recommend keeping backups of all original documents before performing transformations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Modifications</h2>
          <p>
            FileWiz may modify these terms at any time. Continued use of FileWiz after modifications constitutes acceptance of the revised terms.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. Premium subscriptions</h2>
          <p>FileWiz Premium is billed monthly at the price shown at checkout. Razorpay processes recurring payments. You may request cancellation from your account; cancellation is scheduled for the end of the current billing period. Premium features remain available through the paid period, subject to billing status and service availability. Contact FileWiz support for billing questions.</p>
          <p>Premium features include an ad-free FileWiz experience, Google Drive saves, advanced workspace controls, and AI document summaries. AI summaries are optional and send extracted document text to FileWiz and its AI provider when you choose to use them. Keep an original copy of important files before editing.</p>
        </section>
      </div>
    </div>
  );
}
