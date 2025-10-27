import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetOwnershipStatusDto } from './create-asset-ownership-status.dto';

export class UpdateAssetOwnershipStatusDto extends PartialType(CreateAssetOwnershipStatusDto) {


    
}
