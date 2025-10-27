import { decrypt } from "src/common/encryption_decryption/crypto-utils";

// utils/get-decrypted-org-id.ts
export function getDecryptedOrgId(req: any): number {
  const orgCookie = req.cookies.organization_id;
  const decrypted = decrypt(orgCookie);

  if (!decrypted || isNaN(Number(decrypted))) {
    throw new Error('Invalid or missing organization ID');
  }

  return Number(decrypted);
}
