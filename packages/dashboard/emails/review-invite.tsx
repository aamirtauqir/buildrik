import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

/**
 * The client's invitation to review a site — the email that carries the token
 * link, and the first thing a client ever sees of Buildrick.
 *
 * Written for someone who is NOT a user of this product and never will be: a
 * restaurant owner who got a link from their designer. So:
 *   - the agency's name leads, not ours
 *   - no account, no password, no "sign up to continue"
 *   - one button, and it says what happens when you press it
 */
interface ReviewInviteProps {
  siteName: string;
  agencyName: string;
  designerName: string;
  reviewUrl: string;
  note?: string;
  changeSummary?: string;
  expiresInDays?: number;
}

export default function ReviewInvite({
  siteName = "Your website",
  agencyName = "Your designer",
  designerName = "Your designer",
  reviewUrl = "https://app.buildrick.io/review/token",
  note,
  changeSummary,
  expiresInDays = 90,
}: ReviewInviteProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Text style={{ fontSize: "13px", color: "#64748B", textAlign: "center" as const, margin: "0 0 8px" }}>
            {agencyName}
          </Text>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const, margin: "0" }}>
            {siteName} is ready for you to look at
          </Heading>
          <Text style={{ fontSize: "14px", color: "#475569", textAlign: "center" as const, marginTop: "12px" }}>
            {designerName} would like your feedback before this goes live. You can
            leave comments directly on the page — no account needed.
          </Text>

          {changeSummary ? (
            <Section style={{ marginTop: "20px", backgroundColor: "#F8FAFC", borderRadius: "6px", padding: "12px 16px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", margin: "0 0 4px" }}>What&rsquo;s new</Text>
              <Text style={{ fontSize: "13px", color: "#475569", margin: "0" }}>{changeSummary}</Text>
            </Section>
          ) : null}
          {note ? (
            <Section style={{ marginTop: "12px", backgroundColor: "#F8FAFC", borderRadius: "6px", padding: "12px 16px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", margin: "0 0 4px" }}>From {designerName}</Text>
              <Text style={{ fontSize: "13px", color: "#475569", margin: "0" }}>{note}</Text>
            </Section>
          ) : null}

          <Section style={{ textAlign: "center" as const, marginTop: "28px" }}>
            <Button
              href={reviewUrl}
              style={{ backgroundColor: "#1A56DB", color: "white", padding: "12px 28px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}
            >
              Look at {siteName}
            </Button>
          </Section>

          <Hr style={{ borderColor: "#E2E8F0", marginTop: "28px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const, margin: "16px 0 0" }}>
            This link is just for you and works for {expiresInDays} days.
            If you weren&rsquo;t expecting it, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
