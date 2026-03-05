import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — FoodMedals',
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 5, 2026</p>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              FoodMedals (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website at{' '}
              <Link href="https://foodmedals.com" className="text-yellow-700 hover:underline">foodmedals.com</Link>{' '}
              (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website and use our Service.
            </p>
            <p className="mt-2">
              By using the Service, you consent to the data practices described in this policy. If you do not
              agree with these practices, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account Information:</strong> When you create an account, we collect your display name, email address, and password (which is stored in hashed form and never in plain text). You may optionally provide your city and state.</li>
              <li><strong>Medal Picks & Rankings:</strong> When you award Gold, Silver, or Bronze medals to restaurants, we store those selections along with your Crown Jewel designation.</li>
              <li><strong>Restaurant Suggestions:</strong> When you suggest a restaurant, we collect the restaurant name, address, city, state, ZIP code, and any optional description you provide.</li>
              <li><strong>Category Suggestions:</strong> When you suggest a new food category, we collect the category name, emoji, and any optional description you provide.</li>
              <li><strong>Votes:</strong> When you vote on community nominations (restaurants or categories), we record your vote.</li>
              <li><strong>Achievement Data:</strong> We track how many categories you have ranked to determine your achievement tier (e.g., Taste Tester, Local Legend, Oracle). Your tier is displayed on your public profile.</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.2 Information from Third-Party Sign-In</h3>
            <p>
              We offer sign-in through Google, Facebook, and X (Twitter). When you use one of these providers,
              we receive your name, email address, and profile picture from that provider. We do not receive or
              store your password for any third-party service. Each provider&rsquo;s use of your information is
              governed by their own privacy policies:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><Link href="https://policies.google.com/privacy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</Link></li>
              <li><Link href="https://www.facebook.com/privacy/policy/" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Facebook Privacy Policy</Link></li>
              <li><Link href="https://twitter.com/en/privacy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">X (Twitter) Privacy Policy</Link></li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">2.3 Information Collected Automatically</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Browser Geolocation:</strong> When you use the &ldquo;Near Me&rdquo; feature, your browser may ask for permission to share your location. This location data is used <em>client-side only</em> to filter results by distance and is <strong>not transmitted to or stored on our servers</strong>.</li>
              <li><strong>Log Data:</strong> Our hosting provider (Vercel) may automatically collect standard server log information such as your IP address, browser type, pages visited, and timestamps. This data is used for operational and security purposes.</li>
              <li><strong>Cookies:</strong> We use a single session cookie to keep you signed in. This is a functional cookie required for authentication and is not used for tracking or advertising purposes. We do not use any third-party analytics, advertising, or tracking cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Create and manage your account</li>
              <li>Display your public profile, medal picks, rankings, and achievement tier</li>
              <li>Generate community leaderboards and restaurant scores</li>
              <li>Process restaurant and category suggestions and community votes</li>
              <li>Geocode restaurant addresses to enable map and &ldquo;Near Me&rdquo; features</li>
              <li>Maintain the security and integrity of the Service</li>
              <li>Respond to your requests or inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Public Information</h2>
            <p>
              Certain information you provide is publicly visible on the Service, including your display name,
              city, state, profile picture, medal picks, Crown Jewel selections, and achievement tier. Your
              email address is <strong> never</strong> displayed publicly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate the Service:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Vercel:</strong> Hosts our website and may process server logs. <Link href="https://vercel.com/legal/privacy-policy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</Link></li>
              <li><strong>Supabase:</strong> Hosts our database where account and application data is stored. <Link href="https://supabase.com/privacy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</Link></li>
              <li><strong>Google OAuth:</strong> Provides sign-in functionality. <Link href="https://policies.google.com/privacy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</Link></li>
              <li><strong>Facebook Login:</strong> Provides sign-in functionality. <Link href="https://www.facebook.com/privacy/policy/" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">Facebook Privacy Policy</Link></li>
              <li><strong>X (Twitter) OAuth:</strong> Provides sign-in functionality. <Link href="https://twitter.com/en/privacy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">X Privacy Policy</Link></li>
              <li><strong>OpenStreetMap / Nominatim:</strong> Used to geocode restaurant addresses (convert addresses to map coordinates). When a restaurant is suggested, its address is sent to the Nominatim geocoding service. <Link href="https://osmfoundation.org/wiki/Privacy_Policy" className="text-yellow-700 hover:underline" target="_blank" rel="noopener noreferrer">OpenStreetMap Privacy Policy</Link></li>
            </ul>
            <p className="mt-2">
              We do not sell, rent, or share your personal information with any third parties for marketing or
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Security</h2>
            <p>
              We take reasonable measures to protect your personal information, including encrypting passwords
              with industry-standard hashing (bcrypt), using HTTPS for all data transmission, and restricting
              access to personal data to authorized personnel only.
            </p>
            <p className="mt-2">
              However, no method of electronic transmission or storage is 100% secure. While we strive to use
              commercially acceptable means to protect your information, we cannot guarantee its absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your account information for as long as your account remains active. If you wish to
              delete your account and associated data, please contact us using the information provided below.
              We will delete your personal data within 30 days of a verified request, except where retention
              is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Access</strong> the personal information we hold about you</li>
              <li><strong>Correct</strong> inaccurate or incomplete personal information</li>
              <li><strong>Delete</strong> your personal information</li>
              <li><strong>Object</strong> to processing of your personal information</li>
              <li><strong>Export</strong> your data in a portable format</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us using the information in Section 12 below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer
              Privacy Act (CCPA), including the right to know what personal information we collect and how it
              is used, the right to request deletion, and the right to opt out of the sale of personal
              information. <strong>We do not sell personal information.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not intended for children under the age of 13. We do not knowingly collect
              personal information from children under 13. If we become aware that we have collected personal
              information from a child under 13, we will take steps to delete that information promptly. If
              you believe a child under 13 has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              updating the &ldquo;Last updated&rdquo; date at the top of this page. Your continued use of the
              Service after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, please
              contact us at:
            </p>
            <p className="mt-2 font-medium text-gray-900">
              FoodMedals<br />
              Email: <span className="text-yellow-700">[contact email coming soon]</span>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
