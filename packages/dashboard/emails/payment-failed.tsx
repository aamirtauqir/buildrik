import { Html, Head, Body, Container, Heading, Text, Button, Section, Hr } from "@react-email/components";

interface PaymentFailedProps {
  updateUrl: string;
}

export default function PaymentFailed({ updateUrl = "https://app.buildrik.app/settings/billing" }: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            Your payment failed
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            We were unable to process your latest payment. Please update your payment method to keep your plan active.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
            <Button href={updateUrl} style={{ backgroundColor: "#E42313", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
              Update Payment
            </Button>
          </Section>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrick &middot; You can manage email preferences in your account settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
