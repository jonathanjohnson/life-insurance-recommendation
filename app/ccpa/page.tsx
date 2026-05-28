/**
 * TEMPLATE NOTICE
 * ---------------
 * CCPA / CPRA disclosure starter. Requires legal review and adaptation
 * (especially the "Do Not Sell" workflow) before public launch.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/pages/LegalPage";

const LAST_UPDATED = "May 28, 2026";

export const metadata: Metadata = {
  title: "California Privacy Notice (CCPA)",
  description:
    "Rights of California residents under the CCPA and CPRA, including the right to know, delete, and opt out of the sale or sharing of personal information.",
  alternates: { canonical: "/ccpa" },
};

export default function CcpaPage() {
  return (
    <LegalPage
      title="California Privacy Notice"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        This notice supplements our{" "}
        <Link className="text-brand underline" href="/privacy">
          Privacy Policy
        </Link>{" "}
        and applies to California residents under the California Consumer
        Privacy Act (CCPA), as amended by the California Privacy Rights
        Act (CPRA).
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Categories of personal information we collect
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Identifiers:</strong> name, email address, phone number,
          ZIP code, IP address.
        </li>
        <li>
          <strong>Commercial information:</strong> the HVAC service you
          request, urgency, and property type.
        </li>
        <li>
          <strong>Internet activity:</strong> pages visited, referrer,
          time on page, device and browser type.
        </li>
        <li>
          <strong>Inference data:</strong> categorical lead-quality
          attributes derived from the above (no profiles for advertising).
        </li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">
        Right to know
      </h2>
      <p>
        You may request the specific pieces of personal information we
        hold about you, the categories of sources, the business purpose
        for collection, and the categories of third parties with whom we
        share it.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Right to delete
      </h2>
      <p>
        You may request that we delete the personal information we have
        collected from you. We retain TCPA consent records for the period
        required by law even after a delete request.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Right to correct
      </h2>
      <p>
        You may request that we correct inaccurate personal information
        we maintain about you.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Right to opt out of sale or sharing
      </h2>
      <p>
        We do not sell personal information for money. We do share
        identifiers and commercial information with HVAC contractors and
        aggregator partners as described in our Privacy Policy. Under
        CCPA, this sharing may be considered a &quot;sale&quot; or
        &quot;sharing&quot; for cross-context behavioral advertising.
      </p>
      <p>
        To opt out of the sale or sharing of your personal information,
        email{" "}
        <a className="text-brand underline" href="mailto:ccpa@example.com">
          ccpa@example.com
        </a>{" "}
        with the subject &quot;Do Not Sell or Share My Personal
        Information.&quot; Include the email address and phone number you
        submitted to the Service.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Right to limit use of sensitive personal information
      </h2>
      <p>
        We do not collect categories of sensitive personal information
        that would trigger the right to limit, but if that changes we
        will update this notice.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Verification of requests
      </h2>
      <p>
        We verify privacy requests by matching the contact information in
        the request to a lead record on file. We may ask for additional
        information to confirm your identity. Authorized agents may submit
        requests on your behalf with written permission.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Non-discrimination
      </h2>
      <p>
        We will not deny, charge different prices for, or provide a
        different level of service based on your decision to exercise any
        CCPA right.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Contact for CCPA requests
      </h2>
      <p>
        Email{" "}
        <a className="text-brand underline" href="mailto:ccpa@example.com">
          ccpa@example.com
        </a>{" "}
        for any CCPA-related request. We respond within 45 days as
        required by law.
      </p>
    </LegalPage>
  );
}
