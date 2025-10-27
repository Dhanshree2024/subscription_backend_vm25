export class CreateAssetTransferHistoryDto {
  asset_id: number;
  previous_organization_id: number;
  previous_used_by: number;
  previous_managed_by: number;
  new_organization_id: number;
  used_by: number;
  system_code: string | null;
  managed_by: number;
  transfered_at: Date;
  updated_at: Date;
}
