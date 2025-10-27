import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Img, Hr } from "@react-email/components";

export function POConfirmationEmail({
  name,
  softwareName,
  planType,
  users,
  renewalDate, 
  duration,
  amount,
  poNumber,
  companyName,
  companyLogo,
  mailReply,
}: {
  name: string;
  softwareName: string;
  planType: string;
  renewalDate: string; 
  users: number;
  duration: string;
  amount: string;
  poNumber: string;
  companyName: string;
  companyLogo?: string;
  mailReply: string;
}) {
  const today = new Date().toLocaleDateString("en-IN");

  return (
    <Html>
  <Head />
  <Preview>Purchase Order Confirmed – {softwareName}</Preview>
  <Body style={styles.body}>
    <Container style={styles.outerContainer}>
      <Container style={styles.container}>
        {/* Header */}
        <Section style={styles.header}>
          {companyLogo && <Img src={companyLogo} alt={`${companyName} Logo`} style={styles.logo} />}
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.title}>Purchase Order Confirmation</Text>
          <Text style={styles.date}>Date: {today}</Text>
          <Hr style={styles.divider} />
        </Section>

        {/* Greeting */}
        <Section style={styles.section}>
          <Text style={styles.greeting}>✅ Hi {name},</Text>
          <Text style={styles.text}>
            Your purchase order for <strong>{softwareName}</strong> has been successfully confirmed.
          </Text>
        </Section>

        {/* Order Details Table */}
  {/* Order Details Table */}
<Section style={styles.orderDetails}>
  <Text style={styles.tableRow}>
    <span style={styles.tableLabel}>Plan:</span>
    <span style={styles.tableValue}>{planType}</span>
  </Text>
  <Text style={styles.tableRow}>
    <span style={styles.tableLabel}>Renewal Date:</span>
    <span style={styles.tableValue}>{renewalDate}</span>
  </Text>
  <Text style={styles.tableRow}>
    <span style={styles.tableLabel}>Duration:</span>
    <span style={styles.tableValue}>{duration}</span>
  </Text>
  <Text style={{ ...styles.tableRow, backgroundColor: "#f9f9f9", padding: "8px" }}>
    <span style={{ ...styles.tableLabel, fontWeight: "bold" }}>Total Amount:</span>
    <span style={{ ...styles.tableValue, fontWeight: "bold" }}>{amount}</span>
  </Text>
  <Text style={styles.tableRow}>
    <span style={styles.tableLabel}>PO Number:</span>
    <span style={styles.tableValue}>{poNumber}</span>
  </Text>
</Section>


        {/* Next Steps */}
        <Section style={styles.section}>
          <Text style={styles.text}>
            Next Steps: If you opted for offline payment, instructions will follow in the next email. Otherwise, your license will be activated shortly.
          </Text>
        </Section>

        {/* Footer */}
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
  container: { maxWidth: "600px", backgroundColor: "#ffffff", padding: "40px 20px", borderRadius: "10px", boxShadow: "0 6px 12px rgba(0,0,0,0.1)" },
  header: { textAlign: "center", paddingBottom: "15px" },
  logo: { width: "120px", height: "auto", marginBottom: "10px" },
  companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
  title: { fontSize: "18px", fontWeight: "bold", marginTop: "5px", color: "#555" },
  date: { fontSize: "12px", color: "#999", marginBottom: "10px" },
  divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
  section: { textAlign: "center", padding: "20px 0" },
  greeting: { fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
  text: { fontSize: "14px", marginBottom: "8px", color: "#555", lineHeight: 1.6 },
  orderDetails: { 
  textAlign: "left", 
  margin: "20px auto", 
  maxWidth: "450px", 
  border: "1px solid #ddd", 
  borderRadius: "6px", 
  padding: "10px" 
},
tableRow: { 
  display: "flex", 
  justifyContent: "space-between", 
  padding: "8px 5px", 
  borderBottom: "1px solid #eee" 
},
tableLabel: { 
  fontWeight: "bold", 
  color: "#333" 
},
tableValue: { 
  color: "#555" 
},

  footerSection: { textAlign: "center", marginTop: "20px" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
};