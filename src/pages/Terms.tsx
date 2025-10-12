import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground">
              Last updated: October 11, 2025
            </p>
          </div>

          <Card className="p-8 md:p-12 animate-fade-in">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">1. Agreement to Terms</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  By accessing or using Parra Connect ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service. These Terms apply to all users, including caregivers, seniors, and family members.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">2. Description of Service</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  Parra Connect provides:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li>Conversational AI check-ins via text and voice interfaces</li>
                  <li>Wellness monitoring and mood tracking</li>
                  <li>Fall detection alerts based on phone motion sensors</li>
                  <li>Family dashboard for caregiver oversight</li>
                  <li>Daily summaries and insights</li>
                  <li>Integration with WhatsApp and voice assistants</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <p className="text-lg font-semibold text-yellow-800 mb-2">Important Disclaimer:</p>
                  <p className="text-muted-foreground">
                    Parra Connect is NOT a medical device, diagnostic tool, or emergency response service. It does not replace professional medical care, caregiving, or emergency services. Always call 911 for emergencies.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">3. Eligibility</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  You must be at least 18 years old to use Parra Connect. By using the Service, you represent and warrant that you meet this requirement. If you are setting up the Service for another person (e.g., an elderly parent), you represent that you have their consent or legal authority to do so.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">4. User Accounts and Registration</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.1 Account Creation</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      You must provide accurate, complete, and current information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.2 Account Security</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      You must notify us immediately of any unauthorized access or security breach. We are not liable for losses arising from unauthorized use of your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">4.3 Account Termination</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose risks to the Service or other users.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">5. User Responsibilities</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  You agree to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li>Use the Service only for its intended caregiving and wellness purposes</li>
                  <li>Provide accurate health information to the best of your knowledge</li>
                  <li>Not rely solely on Parra Connect for medical decisions</li>
                  <li>Maintain an active phone/device for fall detection to function</li>
                  <li>Designate appropriate emergency contacts</li>
                  <li>Respond promptly to safety alerts</li>
                  <li>Not use the Service to harass, abuse, or harm others</li>
                  <li>Not attempt to reverse-engineer, hack, or disrupt the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">6. Limitations and Disclaimers</h2>
                <div className="space-y-4">
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <h3 className="text-xl font-semibold mb-2 text-red-800">6.1 Not a Medical Service</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      Parra Connect is NOT:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>A licensed healthcare provider or medical professional</li>
                      <li>A substitute for in-person medical care or diagnosis</li>
                      <li>An emergency response system (like Life Alert)</li>
                      <li>A guaranteed fall detection system</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">6.2 No Guarantee of Accuracy</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      While we strive for accuracy, AI-generated insights may contain errors. Fall detection may produce false positives or miss actual falls. Always verify important information with healthcare professionals.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">6.3 Service Availability</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      We do not guarantee uninterrupted or error-free service. The Service may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">7. Safety Alerts and Escalation</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  When Parra Connect detects potential safety concerns (falls, strong distress signals), we will:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground text-lg">
                  <li>Notify designated family members via WhatsApp, email, or in-app alert</li>
                  <li>Provide a 60-second countdown before escalation</li>
                  <li>Allow users to cancel alerts if triggered accidentally</li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <p className="text-lg font-semibold text-yellow-800 mb-2">Important:</p>
                  <p className="text-muted-foreground">
                    Parra Connect does NOT automatically call 911 or emergency services. Designated caregivers must take appropriate action when alerted. If you need immediate emergency assistance, call 911 directly.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">8. Fees and Payments</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">8.1 Beta Access</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      During the beta period, Parra Connect is offered free of charge. We reserve the right to introduce paid plans in the future with advance notice.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">8.2 Future Pricing</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      If we transition to a paid model, existing beta users will receive at least 30 days' notice. You may cancel your account before paid plans take effect without penalty.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">8.3 Third-Party Fees</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      You are responsible for data charges, internet access fees, and any costs associated with WhatsApp or voice assistant usage as determined by your service providers.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">9. Intellectual Property</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  All content, features, and functionality of Parra Connect (including text, graphics, logos, and software) are owned by Parra Connect, Inc. and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the Service without written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">10. Privacy and Data Use</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Your use of Parra Connect is subject to our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our collection and use of data as described in the Privacy Policy.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground mt-3">
                  Key privacy highlights:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                  <li>We do NOT record audio or video conversations</li>
                  <li>We do NOT sell your personal or health data</li>
                  <li>Conversation transcripts are stored for service improvement and caregiver summaries</li>
                  <li>You can request data deletion at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">11. Limitation of Liability</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <div className="bg-muted/30 p-6 rounded-lg space-y-3">
                  <p className="text-muted-foreground">
                    Parra Connect, Inc., its officers, employees, and partners SHALL NOT BE LIABLE for any indirect, incidental, consequential, or punitive damages arising from:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                    <li>Failure to detect falls or safety events</li>
                    <li>Delayed or missed alerts to caregivers</li>
                    <li>Incorrect AI-generated insights or recommendations</li>
                    <li>Service outages, technical failures, or data loss</li>
                    <li>Actions taken (or not taken) based on Service information</li>
                    <li>Health outcomes or injuries</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Our total liability to you for any claims shall not exceed the amount you paid us in the past 12 months (currently $0 during beta).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">12. Indemnification</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  You agree to indemnify and hold harmless Parra Connect, Inc. from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">13. Changes to Terms</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  We may modify these Terms at any time. We will notify you of significant changes via email or through the Service. Your continued use after changes constitutes acceptance of the updated Terms. If you do not agree to changes, you must stop using the Service and may request account deletion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">14. Dispute Resolution</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">14.1 Informal Resolution</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      Before filing a legal claim, you agree to contact us at <a href="mailto:support@parraconnect.ai" className="text-primary hover:underline">support@parraconnect.ai</a> to attempt informal resolution.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">14.2 Arbitration</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      Any disputes not resolved informally shall be settled by binding arbitration in accordance with the American Arbitration Association rules. Arbitration shall take place in [Jurisdiction to be specified].
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">14.3 Class Action Waiver</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      You agree to bring claims only in your individual capacity and not as part of a class action or representative proceeding.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">15. Governing Law</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  These Terms are governed by the laws of the State of [State to be specified], United States, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">16. Severability</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">17. Entire Agreement</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Parra Connect regarding use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">18. Contact Information</h2>
                <p className="text-lg leading-relaxed text-muted-foreground mb-3">
                  For questions about these Terms of Service, contact us:
                </p>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <p className="text-lg text-muted-foreground">
                    <strong>Email:</strong> <a href="mailto:legal@parraconnect.ai" className="text-primary hover:underline">legal@parraconnect.ai</a><br />
                    <strong>General Support:</strong> <a href="mailto:hello@parraconnect.ai" className="text-primary hover:underline">hello@parraconnect.ai</a><br />
                    <strong>Address:</strong> Parra Connect, Inc.<br />
                    [Address to be provided]
                  </p>
                </div>
              </section>

              <section className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground italic">
                  By using Parra Connect, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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

export default Terms;
