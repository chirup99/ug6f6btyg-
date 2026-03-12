
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <Card className="max-w-3xl w-full bg-black border-none shadow-none">
        <CardContent className="p-0 space-y-8">
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              At Perala, we are committed to protecting your privacy and providing you with a safe trading analysis experience. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Data Collection</h2>
            <p className="text-gray-400 leading-relaxed">
              We collect information that you provide directly to us when you create an account, such as your name and email address. If you choose to link your trading accounts, we may access market data and trade history to provide analysis, but we do not store your brokerage passwords.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Purpose of the App</h2>
            <p className="text-gray-400 leading-relaxed">
              Perala is a trading journal and analysis platform designed to help traders track their performance, analyze trading patterns, and improve their strategies through data-driven insights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Data Protection</h2>
            <p className="text-gray-400 leading-relaxed">
              We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or alteration. Your data is stored securely using AWS infrastructure.
            </p>
          </section>
          
          <div className="pt-8">
            <Link href="/landing" className="text-purple-500 hover:text-purple-400 transition-colors">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
