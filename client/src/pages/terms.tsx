import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full bg-black border-none shadow-none">
        <CardContent className="p-0 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: January 1, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              By accessing or using Perala ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">2. Description of Service</h2>
            <p className="text-gray-400 leading-relaxed">
              Perala is a trading journal and analysis platform designed to help traders track their performance, analyze trading patterns, and improve their strategies through data-driven insights. The Platform provides tools for recording trades, viewing analytics, and accessing market news. Perala is not a financial advisor and does not provide investment advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">3. User Accounts</h2>
            <p className="text-gray-400 leading-relaxed">
              To access certain features of the Platform, you must register for an account. You may register using your email address or via Google Sign-In. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">4. Google Sign-In</h2>
            <p className="text-gray-400 leading-relaxed">
              We offer Google Sign-In as a convenient authentication option using OAuth 2.0. By signing in with Google, you authorize Perala to access your basic profile information (name and email address) for the purpose of creating and managing your account. We do not access your Google Drive, Gmail, or any other Google services beyond your basic profile.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">5. Acceptable Use</h2>
            <p className="text-gray-400 leading-relaxed">
              You agree not to use the Platform for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the Platform or any systems or networks connected to it. You are solely responsible for any content you submit to the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">6. Financial Disclaimer</h2>
            <p className="text-gray-400 leading-relaxed">
              The information and tools provided on Perala are for educational and tracking purposes only. Nothing on this Platform constitutes financial, investment, trading, or any other form of advice. All trading involves risk, and past performance is not indicative of future results. You are solely responsible for your own trading decisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">7. Intellectual Property</h2>
            <p className="text-gray-400 leading-relaxed">
              All content, features, and functionality of the Platform — including but not limited to text, graphics, logos, and software — are the exclusive property of Perala and are protected by applicable intellectual property laws. You may not copy, reproduce, or distribute any part of the Platform without our prior written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">8. Limitation of Liability</h2>
            <p className="text-gray-400 leading-relaxed">
              To the fullest extent permitted by law, Perala shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">9. Termination</h2>
            <p className="text-gray-400 leading-relaxed">
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties. Upon termination, your right to use the Platform will immediately cease.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">10. Changes to Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              We may update these Terms of Service from time to time. We will notify you of any significant changes by posting the new terms on this page and updating the "Last updated" date. Your continued use of the Platform after any changes constitutes your acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">11. Contact Us</h2>
            <p className="text-gray-400 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@perala.in" className="text-purple-400 hover:text-purple-300 transition-colors">
                support@perala.in
              </a>.
            </p>
          </section>

          <div className="flex gap-6 pt-8">
            <Link href="/privacy" className="text-purple-500 hover:text-purple-400 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/landing" className="text-purple-500 hover:text-purple-400 transition-colors text-sm">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
