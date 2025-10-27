import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Button,
} from "@react-email/components";

export function OrderPlacedEmail({
  companyName,
  customerName,
  planName,
  billingCycle,
  price,
  paymentStatus,
  orderDate,
  renewalDate,
  orderPlacedBy,
  mailReply,
  productName,
  orderType = "Placed", // Default to "Placed"
}: {
  companyName: string;
  customerName: string;
  planName: string;
  billingCycle: string;
  price: number;
  paymentStatus: string;
  orderDate: string;
  renewalDate: string;
  orderPlacedBy: string;
  mailReply: string
  productName: string; // ✅ Added here
  orderType?: "Created" | "Updated" | "Placed";
}) {
  return (
    <Html>
      <Head />
      <Preview>🧾 {orderType} Confirmation - {companyName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Hr style={styles.divider} />
          </Section>

          {/* Main Message */}
          <Section style={styles.section}>
            <Text style={styles.greeting}>Hello {customerName}, 👋</Text>
            <Text style={styles.message}>
               Your order for <strong>{productName}</strong> has been <strong>{orderType.toLowerCase()}</strong> successfully by <strong>{orderPlacedBy}</strong>.
            </Text>

            {/* Order Details Table */}
            <Text style={styles.detailsHeader}>📦 Order Details</Text>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.label}>Plan:</td>
                  <td>{planName}</td>
                </tr>
                <tr>
                  <td style={styles.label}>Billing Cycle:</td>
                  <td>{billingCycle}</td>
                </tr>
                <tr>
                  <td style={styles.label}>Price:</td>
                  <td>{price.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={styles.label}>Payment Status:</td>
                  <td>{paymentStatus}</td>
                </tr>
                <tr>
                  <td style={styles.label}>Order Date:</td>
                  <td>{orderDate}</td>
                </tr>
                <tr>
                  <td style={styles.label}>Renewal Date:</td>
                  <td>{renewalDate}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Footer */}
          <Section style={styles.footerSection}>
            <Hr style={styles.divider} />
            <Text style={styles.footer}>
              Thank you for choosing {companyName}! 🚀
            </Text>
            <Text style={styles.support}>
              For any queries, reach us at <a href={`mailto:${mailReply}`}>{mailReply}</a>
            </Text>
            <Text style={styles.disclaimer}>
              This is an automated email. Please do not reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  container: {
    maxWidth: "600px",
    margin: "auto",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 6px 12px rgba(0,0,0,0.1), 0 -6px 12px rgba(0,0,0,0.1)",
  },
  header: { textAlign: "center", paddingBottom: "15px" },
  companyName: { fontSize: "22px", fontWeight: "bold", color: "#333" },
  divider: { borderTop: "1px solid #ddd", margin: "15px 0" },
  section: { textAlign: "left", padding: "10px 0" },
  greeting: { fontSize: "18px", fontWeight: "bold", color: "#444" },
  message: { fontSize: "16px", marginBottom: "15px", color: "#555" },
  detailsHeader: { fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#444" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "5px" },
  label: { fontWeight: "bold", padding: "5px 0", width: "35%", color: "#333", verticalAlign: "top" },
  footerSection: { textAlign: "center", marginTop: "25px" },
  footer: { fontSize: "16px", fontWeight: "bold", color: "#444" },
  support: { fontSize: "14px", color: "#666", marginBottom: "8px" },
  disclaimer: { fontSize: "12px", color: "#999", marginTop: "10px" },
};
