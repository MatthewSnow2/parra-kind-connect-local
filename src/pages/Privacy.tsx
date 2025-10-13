import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground">
              Last updated: October 12, 2025
            </p>
          </div>

          <Card className="p-8 md:p-12 animate-fade-in">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">1. Introduction</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Parra Connect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our conversational AI caregiving service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">2. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We collect information you provide directly, including:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Name, email address, and phone number</li>
                      <li>Age, relationship to care recipient, and role (caregiver/independent)</li>
                      <li>Emergency contact information</li>
                      <li>Preferences for notifications and communication</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.2 Health and Wellness Data</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      Through conversational check-ins, we may collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Mood indicators and emotional well-being information</li>
                      <li>Medication adherence reports (user-provided)</li>
                      <li>Activity levels and sleep patterns (as reported in conversations)</li>
                      <li>Self-reported symptoms or concerns</li>
                    </ul>
                    <p className="text-lg leading-relaxed text-muted-foreground mt-2">
                      <strong>Important:</strong> We may record audio.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.3 Technical Data</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We automatically collect:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Device type, browser type, and operating system</li>
                      <li>IP address and general location (city/state level)</li>
                      <li>Usage patterns and interaction timestamps</li>
                      <li>Phone motion sensor data (for fall detection, if enabled)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  We use collected information to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li>Provide conversational check-ins and wellness monitoring</li>
                  <li>Detect potential safety concerns (falls, missed medications, mood changes)</li>
                  <li>Generate summaries and insights for caregivers</li>
                  <li>Send alerts and notifications to designated family members</li>
                  <li>Improve our AI models and service quality</li>
                  <li>Comply with legal obligations and respond to emergencies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">4. Data Sharing and Disclosure</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.1 With Your Care Circle</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We share wellness summaries and alerts with family members or caregivers you explicitly designate. You control who has access to your care information.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.2 Service Providers</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We work with trusted third-party providers:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Supabase (database and authentication)</li>
                      <li>OpenAI (AI conversation processing)</li>
                      <li>WhatsApp/Meta (messaging platform, if used)</li>
                      <li>Netlify (hosting infrastructure)</li>
                    </ul>
                    <p className="text-lg leading-relaxed text-muted-foreground mt-2">
                      All providers are bound by strict data protection agreements.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.3 Legal Requirements</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We may disclose information when required by law or to protect safety, including responses to subpoenas, court orders, or emergency situations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.4 What We DON'T Do</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We do NOT:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>Sell or rent your personal information to third parties</li>
                      <li>Share wellness data with insurance companies or employers</li>
                      <li>Use your data for marketing unrelated to our service</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-muted/30 p-6 rounded-lg">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  <strong>Parra Connect is a private conversational diary designed to help users reflect and share daily experiences.</strong> It doesn't diagnose, treat, or claim to improve any medical or mental health conditions. Parra is not offered by, or on behalf of, a healthcare provider.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">5. Data Security</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  We implement industry-standard security measures:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Encrypted storage of sensitive information</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers with physical and network security</li>
                </ul>
                <p className="text-lg leading-relaxed text-muted-foreground mt-4">
                  While we strive to protect your information, no method of electronic storage is 100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">6. Your Rights and Choices</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Download your conversation history and summaries</li>
                  <li><strong>Opt-out:</strong> Disable specific features like fall detection</li>
                  <li><strong>Consent withdrawal:</strong> Revoke permissions for data sharing</li>
                </ul>
                <p className="text-lg leading-relaxed text-muted-foreground mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@parraconnect.ai" className="text-primary hover:underline">privacy@parraconnect.ai</a>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">7. Data Retention</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  We retain your information for as long as your account is active or as needed to provide services. Conversation transcripts are kept for 90 days by default, with options to extend retention for medical record purposes. After account deletion, we retain minimal data for 30 days for recovery purposes, then permanently delete all information except where required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">8. Children's Privacy</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Parra Connect is designed for adults 18 years and older. We do not knowingly collect information from children under 18. If we discover we have collected data from a child, we will delete it immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">9. International Users</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Parra Connect is based in the United States. If you are accessing our service from outside the U.S., your information may be transferred to and processed in the U.S. By using our service, you consent to this transfer.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">10. Changes to This Policy</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  We may update this Privacy Policy periodically. We will notify you of significant changes via email or through the service. The "Last updated" date at the top indicates when changes were last made. Your continued use of Parra Connect after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">11. Contact Us</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  For questions, concerns, or requests regarding this Privacy Policy or our data practices, contact us:
                </p>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <p className="text-lg text-muted-foreground">
                    <strong>Email:</strong> <a href="mailto:privacy@parraconnect.ai" className="text-primary hover:underline">privacy@parraconnect.ai</a><br />
                    <strong>General Support:</strong> <a href="mailto:hello@parraconnect.ai" className="text-primary hover:underline">hello@parraconnect.ai</a><br />
                    <strong>Address:</strong> Parra Connect, Inc.<br />
                    [Address to be provided]
                  </p>
                </div>
              </section>

              <section className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground italic">
                  This Privacy Policy complies with applicable data protection laws including GDPR, CCPA, and HIPAA where applicable. For specific regional compliance questions, please contact our privacy team.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
