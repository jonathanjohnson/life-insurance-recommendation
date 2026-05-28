/**
 * TEMPLATE NOTICE
 * ---------------
 * Working starter terms. Requires legal review and customization to the
 * operating jurisdiction(s) before public launch.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/pages/LegalPage";

const LAST_UPDATED = "May 28, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of HVAC Pros Network and the lead-matching service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the
        HVAC Pros Network website and the lead-matching service we provide
        (the &quot;Service&quot;). By using the Service, you agree to be
        bound by these Terms.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Service description
      </h2>
      <p>
        We operate a directory and matching platform that connects
        homeowners with licensed HVAC contractors. We are not a
        contractor and do not perform HVAC work directly. The
        contractors in our network are independent businesses
        responsible for their own work, pricing, and warranties.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        User eligibility
      </h2>
      <p>
        You must be at least 18 years old and a legal resident of the
        United States to use the Service. By submitting a request, you
        confirm that you meet these requirements and that the contact
        information you provide is your own.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Lead submission terms
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          You consent to be contacted by HVAC Pros Network and its
          contractor and aggregator partners by phone, email, and SMS
          regarding your request. See the{" "}
          <Link className="text-brand underline" href="/tcpa-consent">
            TCPA Consent page
          </Link>{" "}
          for the full disclosure.
        </li>
        <li>
          You agree to provide accurate information. Submissions with
          fabricated phone numbers, disposable email addresses, or names
          that contain URLs may be rejected.
        </li>
        <li>
          You understand that quoted prices come from individual
          contractors and may change after a site inspection.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">
        Disclaimer of warranties
      </h2>
      <p>
        The Service is provided on an &quot;as is&quot; and &quot;as
        available&quot; basis. We do not warrant that contractor matches
        will result in completed work, that quoted prices will be honored,
        or that the Service will be uninterrupted or error-free.
        Contractors are independent businesses, and HVAC Pros Network
        makes no representations about the quality, timeliness, or
        outcome of their work.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Limitation of liability
      </h2>
      <p>
        To the maximum extent permitted by applicable law, HVAC Pros
        Network shall not be liable for any indirect, incidental,
        consequential, or punitive damages arising from your use of the
        Service or any contractor work performed as a result of a match.
        Our aggregate liability for any claim arising under these Terms is
        limited to one hundred US dollars.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Indemnification
      </h2>
      <p>
        You agree to indemnify and hold harmless HVAC Pros Network, its
        partners, and their respective officers, directors, employees,
        and agents from any claim arising from your breach of these
        Terms, your misuse of the Service, or your interactions with
        contractors matched through the Service.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Governing law and arbitration
      </h2>
      <p>
        These Terms are governed by the laws of the State of Delaware,
        without regard to its conflict-of-law principles. Any dispute
        arising under or relating to these Terms shall be resolved by
        binding arbitration administered by the American Arbitration
        Association under its Consumer Arbitration Rules. You and HVAC
        Pros Network waive any right to a jury trial and to participate
        in a class action.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a className="text-brand underline" href="mailto:legal@example.com">
          legal@example.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
