import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetWorkingStatusDto } from './create-asset-working-status.dto';

export class UpdateAssetWorkingStatusDto extends PartialType(CreateAssetWorkingStatusDto) {}
