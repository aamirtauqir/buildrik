import { Html, Head, Body, Container, Heading, Text, Section, Hr } from "@react-email/components";

interface TicketReceivedProps {
  ticketNumber: number;
  subject: string;
  sla: string;
}

export default function TicketReceived({
  ticketNumber = 0,
  subject = "Your request",
  sla = "We'll get back to you soon.",
}: TicketReceivedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px" }}>
          <Heading style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", textAlign: "center" as const }}>
            We got your request
          </Heading>
          <Text style={{ fontSize: "14px", color: "#64748B", textAlign: "center" as const }}>
            Ticket #{ticketNumber} — &ldquo;{subject}&rdquo;
          </Text>
          <Section style={{ marginTop: "20px", padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "8px" }}>
            <Text style={{ fontSize: "14px", color: "#0F172A", margin: 0 }}>
              {sla}
            </Text>
          </Section>
          <Hr style={{ borderColor: "#E2E8F0", marginTop: "32px" }} />
          <Text style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center" as const }}>
            Sent by Buildrik &middot; You&apos;ll receive a reply at this address.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
