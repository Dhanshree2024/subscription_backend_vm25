import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetDatumDto } from './create-asset-datum.dto';

export class UpdateAssetDatumDto extends PartialType(CreateAssetDatumDto) {}
