import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr } from "@react-email/components";

export function OfflinePaymentEmail({
  name,
  softwareName,
  planType,
  users,
  duration,
  amount,
  poNumber,
  bankName,
  accountName,
  accountNumber,
  ifscCode,
  companyName,
  companyLogo,
  mailReply,
}: {
  name: string;
  softwareName: string;
  planType: string;
  users: number;
  duration: string;
  amount: string;
  poNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  companyName: string;
  companyLogo?: string;
  mailReply: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Offline Payment Instructions – {softwareName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.outerContainer}>
          <Container style={styles.container}>
            <Section style={styles.header}>
              {companyLogo && <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} />}
              <Text style={styles.companyName}>{companyName}</Text>
              <Hr style={styles.divider} />
            </Section>

            <Section style={styles.section}>
              <Text style={styles.greeting}>💰 Hi {name},</Text>
              <Text style={styles.text}>
                Thank you for your order of <strong>{softwareName}</strong>. You have requested offline payment for your purchase.
              </Text>
              <Text style={styles.text}>
                <strong>Order Details:</strong> <br />
                Plan: {planType} <br />
                {/* Users: {users} <br /> */}
                Duration: {duration} <br />
                Amount: {amount} <br />
                PO Number: {poNumber}
              </Text>
              <Text style={styles.text}>
                <strong>Payment Instructions:</strong> <br />
                Bank: {bankName} <br />
                Account Name: {accountName} <br />
                Account Number: {accountNumber} <br />
                IFSC / SWIFT: {ifscCode} <br />
                Reference: {poNumber} / {companyName}
              </Text>
              <Text style={styles.text}>
                Once payment is received, we will activate your software license and share the access details.
              </Text>
            </Section>

            <Section style={styles.footerSection}>
              <Hr style={styles.divider} />
              <Text style={styles.support}>
                Questions? Contact us at <a href={`mailto:${mailReply}`}>{mailReply}</a>
              </Text>
              <Text style={styles.disclaimer}>This is an automated message. Please do not reply directly to this email.</Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: { backgroundColor: "#f9f9f9", fontFamily: "Arial, sans-serif", padding: "20px" },
  outerContainer: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 0" },
  container: { maxWidth: "600px", backgroundColor: "#ffffff", padding: "40px 20px", borderRadius: "10px", boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)" },
  header: { textAlign: "center", paddingBottom: "15px" },
  logo: { width: "120px", height: "auto", marginBottom: "10px" },
  companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
  divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
  section: { textAlign: "center", padding: "20px 0" },
  greeting: { fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
  text: { fontSize: "14px", marginBottom: "8px", color: "#555", lineHeight: 1.6 },
  footerSection: { textAlign: "center", marginTop: "20px" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
};
