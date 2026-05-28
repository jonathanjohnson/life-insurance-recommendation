/**
 * TEMPLATE NOTICE
 * ---------------
 * The exact consent language is sourced from lib/lead-routing/tcpa.ts
 * so the form, this disclosure page, and the stored audit record stay
 * byte-identical. Requires legal review before launch.
 */
import type { Metadata } from "next";

import { LegalPage } from "@/components/pages/LegalPage";
import { TCPA_CONSENT_TEXT } from "@/lib/lead-routing/tcpa";

const LAST_UPDATED = "May 28, 2026";

export const metadata: Metadata = {
  title: "TCPA Consent Disclosure",
  description:
    "What you agree to when you submit the HVAC Pros Network quote form. How to opt out of calls, SMS, and emails.",
  alternates: { canonical: "/tcpa-consent" },
};

export default function TcpaConsentPage() {
  return (
    <LegalPage
      title="TCPA Consent Disclosure"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        This page explains the consent you provide when you submit our
        quote form and the channels through which you may be contacted as
        a result.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        The exact consent language
      </h2>
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        {TCPA_CONSENT_TEXT}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight">
        Who may contact you
      </h2>
      <p>
        By submitting the quote form, you agree to be contacted by:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>HVAC Pros Network</li>
        <li>
          Licensed HVAC contractors in our network that service your ZIP
          code
        </li>
        <li>
          Lead aggregation networks that route your request to their own
          contractor network when we don&apos;t have direct coverage in
          your area
        </li>
      </ul>
      <p>
        Contact may be made by phone (including pre-recorded and
        autodialed calls), SMS text message, and email, including for
        marketing purposes.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Do Not Call rights
      </h2>
      <p>
        Federal law and most states give you the right to be on a Do Not
        Call list. By providing your consent above, you authorize calls
        and texts even if your number is on a federal or state Do Not Call
        list. You can revoke this consent at any time using the opt-out
        mechanisms below.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Opting out
      </h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>SMS:</strong> reply STOP to any SMS message we send. You
          will receive a confirmation message and no further texts from
          that sender.
        </li>
        <li>
          <strong>Email:</strong> click the unsubscribe link in the footer
          of any marketing email.
        </li>
        <li>
          <strong>Phone calls:</strong> tell the caller you wish to be
          added to their internal Do Not Call list, or email{" "}
          <a className="text-brand underline" href="mailto:dnc@example.com">
            dnc@example.com
          </a>{" "}
          with your phone number and the request &quot;Do Not Call.&quot;
        </li>
        <li>
          <strong>All contact:</strong> email{" "}
          <a className="text-brand underline" href="mailto:privacy@example.com">
            privacy@example.com
          </a>{" "}
          with the subject &quot;Revoke consent&quot; and the phone number
          and email address you submitted. We honor revocations within ten
          business days.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight">
        Message and data rates
      </h2>
      <p>
        Standard message and data rates from your carrier may apply to
        SMS messages. Message frequency varies based on your activity and
        the response from contractors.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight">
        Recordkeeping
      </h2>
      <p>
        We record the exact consent text shown to you, the date and time
        of submission, your IP address, and the user agent of the browser
        used. This record is retained for the longer of five years or the
        period required by applicable law.
      </p>
    </LegalPage>
  );
}
