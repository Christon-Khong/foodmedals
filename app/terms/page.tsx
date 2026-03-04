import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service — FoodMedals',
  robots: { index: false, follow: false },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 4, 2026</p>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the FoodMedals website at{' '}
              <Link href="https://foodmedals.com" className="text-yellow-700 hover:underline">foodmedals.com</Link>{' '}
              (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service
              (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. By creating an account, you represent
              and warrant that you meet this age requirement. If you are under 18, you represent that you
              have your parent or guardian&rsquo;s consent to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You agree to provide accurate and complete information when creating your account and to update your information as needed.</li>
              <li>You may not create multiple accounts for the purpose of manipulating rankings or votes.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. User Content</h2>
            <p>
              &ldquo;User Content&rdquo; includes medal picks, restaurant suggestions, votes, descriptions,
              and any other content you submit to the Service.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>You retain ownership of your User Content.</li>
              <li>By submitting User Content, you grant FoodMedals a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your User Content in connection with operating and promoting the Service.</li>
              <li>You represent that you have the right to submit your User Content and that it does not violate any third party&rsquo;s rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Manipulate rankings through fake accounts, coordinated voting, or other deceptive practices</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Scrape, crawl, or use automated means to access the Service without our prior written consent</li>
              <li>Attempt to gain unauthorized access to other users&rsquo; accounts or our systems</li>
              <li>Use the Service to send spam or unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Restaurant Information</h2>
            <p>
              Restaurant information on FoodMedals is community-contributed and may not always be accurate,
              complete, or up to date. We do not endorse, guarantee, or verify the accuracy of any restaurant
              listing, address, or other details. Rankings and scores are based solely on community votes and
              do not represent professional reviews or official ratings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, logos, graphics, and software, is the property of FoodMedals
              and is protected by copyright, trademark, and other intellectual property laws. You may not
              copy, modify, distribute, or create derivative works based on the Service without our prior
              written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES
              OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-2">
              We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or
              other harmful components. We do not guarantee the accuracy, completeness, or reliability of
              any content on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOODMEDALS AND ITS OPERATORS SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, WHETHER BASED ON
              WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless FoodMedals and its operators from any claims,
              damages, losses, liabilities, and expenses (including reasonable attorneys&rsquo; fees) arising
              out of your use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, and
              with or without notice. Upon termination, your right to use the Service will immediately cease.
              Sections 4, 7, 8, 9, 10, and 12 shall survive any termination of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of
              Utah, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time by updating this page. We will indicate the date of the
              latest revision by updating the &ldquo;Last updated&rdquo; date at the top of this page. Your
              continued use of the Service after changes are posted constitutes your acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at:
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
