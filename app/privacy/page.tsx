/**
 * TEMPLATE NOTICE
 * ---------------
 * This Privacy Policy is a working starter, not legal advice. It MUST be
 * reviewed and adapted by an attorney qualified in the operating
 * jurisdiction(s) before launching the site publicly. State and federal
 * regulations on lead-gen data handling (TCPA, CCPA, CPRA, state-level
 * "shopper safety" laws) change often.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/pages/LegalPage";

const LAST_UPDATED = "May 28, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How HVAC Pros Network collects, uses, and shares the information you provide. CCPA notice for California residents.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        HVAC Pros Network (&quot;we&quot;, &quot;us&quot;) operates this
        directory to connect homeowners with licensed HVAC contractors.
        This Privacy Policy explains what information we collect, how we
        use it, and the choices you have.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Information we collect
      </h2>
      <p>We collect information in two ways:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Information you provide:</strong> name, phone number,
          email address, ZIP code, and details about the HVAC service you
          need when you submit the quote form.
        </li>
        <li>
          <strong>Information collected automatically:</strong> IP address,
          device and browser type, referring URL, pages viewed, and the
          time spent on each. We use first-party cookies and standard log
          files for this.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">
        How we use information
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Match you with HVAC contractors who service your ZIP code and
          requested job type.
        </li>
        <li>Provide quotes, schedule service, and follow up after a job.</li>
        <li>
          Improve the site, troubleshoot bugs, and analyze aggregate
          usage patterns.
        </li>
        <li>
          Send service-related and marketing communications (with your
          TCPA consent on file).
        </li>
        <li>Detect and prevent fraud, abuse, and security incidents.</li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">
        Sharing with third parties
      </h2>
      <p>
        We share your contact information and project details with the
        following categories of partners:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Licensed HVAC contractors</strong> in our network that
          serve your ZIP code. They contact you directly to provide a
          quote.
        </li>
        <li>
          <strong>Lead aggregation networks</strong> (for example,
          Modernize, Networx, or similar) when we don&apos;t have direct
          contractor coverage in your area. The aggregator then routes the
          lead to its own contractor network.
        </li>
        <li>
          <strong>Marketing partners</strong> for retargeting and audience
          measurement. We do not share your phone number or email with
          these partners.
        </li>
        <li>
          <strong>Service providers</strong> (hosting, analytics, CRM,
          email delivery) that act on our behalf under written data
          processing agreements.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of the
        personal information we hold about you. To exercise these rights,
        email{" "}
        <a className="text-brand underline" href="mailto:privacy@example.com">
          privacy@example.com
        </a>{" "}
        with the subject line &quot;Privacy Request&quot; and the email
        address or phone number you used.
      </p>
      <p>
        You can opt out of marketing emails using the unsubscribe link in
        any email, and SMS messages by replying STOP.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        CCPA notice for California residents
      </h2>
      <p>
        See our{" "}
        <Link className="text-brand underline" href="/ccpa">
          CCPA notice
        </Link>{" "}
        for California-specific rights, including the right to know, the
        right to delete, and the right to opt out of the sale or sharing
        of personal information.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Children&apos;s privacy
      </h2>
      <p>
        This site is not directed to children under 13. We do not knowingly
        collect personal information from children. If you believe a child
        has submitted information, contact us and we will delete it.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Changes to this policy
      </h2>
      <p>
        We may update this policy from time to time. Material changes will
        be posted here with a new &quot;Last updated&quot; date and, where
        required, notified to users by email.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">Contact us</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a className="text-brand underline" href="mailto:privacy@example.com">
          privacy@example.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
