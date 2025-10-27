import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetWorkingStatusDto } from './create-asset-working-status.dto';

export class DeleteAssetWorkingStatusDto extends PartialType(CreateAssetWorkingStatusDto) {}
