import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetOwnershipStatusDto } from './create-asset-ownership-status.dto';

export class DeleteAssetOwnershipStatusDto extends PartialType(CreateAssetOwnershipStatusDto) { 
}