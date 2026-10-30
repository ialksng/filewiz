import useSeoMetadata from '../services/useSeoMetadata';

const sectionClass = 'space-y-3';
const headingClass = 'text-xl font-bold text-slate-900';
const linkClass = 'text-purple-700 underline break-words';

export default function PrivacyPolicy() {
  useSeoMetadata({
    title: 'Privacy Policy · FileWiz',
    description: 'Learn what information FileWiz collects, how it is used and shared, and how to manage or request deletion of your data.',
    canonicalPath: '/privacy',
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-7 rounded-3xl border border-slate-200 bg-white p-6 leading-relaxed text-slate-700 shadow-sm sm:p-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: October 2026</p>
          <p>FileWiz (“we,” “us,” or “our”) provides this service. This policy explains what information is handled when you use the FileWiz website, its mobile browser experience, accounts, and file tools.</p>
        </header>

        <section className={sectionClass}>
          <h2 className={headingClass}>1. Information we collect</h2>
          <p><strong>Account and sign-in information.</strong> If you create an account, we collect your email address, a password hash stored by our API, and any display name you provide. We use this information to create and secure your FileWiz account, show your profile, and deliver password recovery messages when email delivery is configured.</p>
          <p><strong>Files and tool inputs.</strong> Most PDF and image tools process files in your browser. For those tools, the selected file and the generated result stay in your browser and are not uploaded to FileWiz. Recent tool names and timestamps are saved in local browser storage on your device; this history is limited to the latest eight tools and is not sent to our account database.</p>
          <p><strong>AI Background Remover.</strong> The AI background-removal option downloads the Transformers.js browser runtime and BiRefNet Lite model files from Hugging Face on first use (the model download is about 115 MB) and runs inference in your browser. The selected image is not sent to FileWiz or Hugging Face. Hugging Face may receive ordinary technical request information when your browser downloads or updates runtime and model files. Results can vary with fine hair, transparent objects, and complex backgrounds; a plain-color remover is also available.</p>
          <p><strong>AI Assistant (when enabled).</strong> If FileWiz has configured its optional Gemini integration, the text message you submit in the assistant is sent through the FileWiz backend to Gemini to generate a reply. Do not include passwords, confidential document contents, or other sensitive information. The assistant does not upload files or images. Google processes assistant messages and document text under its Gemini API terms and data controls. See <a className={linkClass} href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a>. If Google Gemini is not configured or unavailable, FileWiz uses its local tool finder instead.</p>
          <p><strong>Premium AI document summaries.</strong> If you choose Summarize with AI in the workspace, the text currently shown in the editor (up to 25,000 characters) is sent to the FileWiz API and then Gemini to generate a summary. This action requires a Premium account. The original document is not uploaded by this action, but its extracted text is. Do not submit confidential or sensitive content unless you are comfortable with this processing.</p>
          <p><strong>Short links and campaign links.</strong> If you use URL Shortener, FileWiz sends the destination URL to its Express API and stores it in its MongoDB database so the short link can redirect across devices. Short links work for 90 days; expired records are cleaned up when another link is created. The API also receives ordinary request information, including your IP address, to limit link creation. UTM Link Builder and URL Encoder/Decoder process text in your browser and do not send it to FileWiz.</p>
          <p><strong>QR Code Generator.</strong> QR codes are generated locally in your browser. The content you enter is not sent to a QR generation service.</p>
          <p>The server also provides a PDF compression API at <code className="break-all rounded bg-slate-100 px-1">/api/pdf/compress</code>. The current Compress PDF page uses browser-side compression and does not call that API. If a FileWiz feature or integration does use the API, the PDF and compression settings are sent to the FileWiz backend for processing. The backend temporarily writes input and output files and attempts to delete them after processing or download. Cleanup is best-effort and may fail, so avoid sending confidential documents to any server-processing feature.</p>
          <p><strong>Technical information.</strong> When your browser loads FileWiz, our hosting and security providers may receive standard request information such as IP address, date and time, requested page or asset, browser and device details, and security or error events. We use this information to deliver the site, keep it secure, and troubleshoot service problems. We do not currently operate our own analytics service.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>2. Account and Google Drive data</h2>
          <p>FileWiz accounts use email and password sign-in provided by the FileWiz API. Passwords are stored as salted hashes in MongoDB and are never stored in readable form.</p>
          <p><strong>Optional Save to Google Drive.</strong> If you choose Save to Google Drive on a tool result, FileWiz asks Google for the <code>drive.file</code> permission. This limited permission lets FileWiz create the specific output file you choose to save; it does not grant access to browse or read your other Drive files. The selected output is sent directly from your browser to Google Drive over HTTPS and is not uploaded to FileWiz servers. Google processes and stores the file under your Google account and its own terms. Drive access is optional and can be revoked in your <a className={linkClass} href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>3. How we use information</h2>
          <p>We use information to provide PDF, image, and utility features; create and secure accounts; authenticate users; save account display names; send password-reset messages when SMTP is configured; remember recent tools on the same device; provide short-link redirects; rate-limit link creation; provide and measure advertisements; prevent abuse; maintain the website; and respond to support requests.</p>
          <p>We do not sell your account information or file contents. FileWiz does not use Google account data to personalize ads. QR content is processed in your browser. A file is sent to the FileWiz backend only if you use a feature that clearly requires server-side processing.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>4. Service providers and information sharing</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>FileWiz API and MongoDB</strong> provide account authentication and store account profile, short-link, and billing records. Password reset emails are sent through the SMTP provider configured by the operator.</li>
            
            
            <li><strong>Hugging Face</strong> hosts the public ONNX BiRefNet Lite model used by the AI Background Remover. The browser downloads model files from Hugging Face; the selected image is processed locally and is not included in those requests.</li>
            <li><strong>Google Gemini</strong> receives assistant text messages only when the optional AI chat integration is enabled. FileWiz does not send files or images to Google Gemini. Gemini’s retention settings are governed by the FileWiz account configuration and Gemini’s data controls.</li>
            <li><strong>Vercel and our hosting/backend providers</strong> deliver and protect the website and API. They may process request and security logs, and the backend provider processes files only when a server-processing endpoint is used.</li>
            <li><strong>Adsterra</strong> supplies banner ads on FileWiz tool pages when ads are enabled under your advertising preference. Premium subscribers do not receive FileWiz ads while their plan is active. If an ad loads, Adsterra and its advertising partners may receive technical information such as IP address, browser or device details, page/ad context, and ad impressions or clicks, and may use cookies or similar technologies for ad delivery, measurement, and fraud prevention. You can manage this choice with Ad preferences in the footer. See <a className={linkClass} href="https://adsterra.com/privacy-policy/" target="_blank" rel="noreferrer">Adsterra’s Privacy Policy</a> and <a className={linkClass} href="https://adsterra.com/cookies/" target="_blank" rel="noreferrer">Cookies Policy</a>.</li>
            <li><strong>Razorpay</strong> processes Premium subscription checkout and recurring payments when you choose to subscribe. FileWiz’s API stores your user ID, subscription ID, plan amount, currency, payment status, and relevant billing dates in the dedicated FileWiz database. Razorpay processes payment details under its own privacy policy; FileWiz does not receive or store your full card or bank credentials.</li>
            <li><strong>Google Fonts</strong> provides fonts used on the website and may receive ordinary browser request information when those fonts load.</li>
          </ul>
          <p>We may also disclose information when required by law, to protect users or the service, to investigate misuse, or as part of a business transfer. We do not provide file contents to advertising providers as part of normal browser-side processing.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>5. Cookies and local storage</h2>
          <p>A signed FileWiz session token is stored in your browser so you remain signed in. FileWiz stores recent tool names and dates in local storage on the device where you used the tools, along with your advertising preference. These records are separate from server-side account data. You can clear them by clearing FileWiz site data in your browser; clearing site data may also sign you out.</p>
          <p>Adsterra ads load only when permitted by your advertising preference and do not load for Premium subscribers. Adsterra or its advertising partners may then set or read cookies or similar identifiers. You can change your ad choice at any time using Ad preferences in the footer, or manage/block cookies through your browser or device settings. FileWiz does not currently use its own analytics cookies.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>6. Retention and deletion</h2>
          <p>Account information, including email and password hashes, is kept in MongoDB while your account remains active and as needed to operate, secure, and support the service, unless a longer period is required by law. Recent tool history remains in your browser until you clear FileWiz site data; FileWiz keeps at most eight recent entries on that device. Files processed in the browser are not retained by FileWiz servers.</p>
          <p>Destination URLs submitted to URL Shortener are available as short links for 90 days. Expired records are removed when the next short link is created. Do not shorten confidential or sensitive URLs. UTM and URL encoder/decoder inputs remain in your browser.</p>
          <p>For a server-side PDF request, temporary input and output files are deleted after processing or after the response download completes where cleanup succeeds. In the event of a server or cleanup failure, deletion may not be immediate. Technical logs and data held by third-party providers follow those providers’ retention practices.</p>
          <p>To request access to, correction of, or deletion of your FileWiz account information, contact FileWiz support from the email address associated with your account. We may need to verify your request. You can clear local tool history and browser-stored session data through your browser’s site-data settings.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>7. Security and international processing</h2>
          <p>We use service providers and technical safeguards intended to protect information. No method of internet transmission or storage is completely secure. Our providers may process information in countries where they or their infrastructure operate, which may have different data-protection laws than your location. Provider privacy policies explain their handling and safeguards.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>8. Children’s privacy</h2>
          <p>FileWiz is not designed for children under 13, and we do not knowingly collect account information from children under 13. If you believe a child has provided us personal information, contact us so we can review and take appropriate steps.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>9. Changes and contact</h2>
          <p>We may update this policy when FileWiz’s features or data practices change. We will update the date at the top of this page when we publish a revision.</p>
          <p>For privacy questions or requests, contact FileWiz support.</p>
        </section>
      </article>
    </div>
  );
}
