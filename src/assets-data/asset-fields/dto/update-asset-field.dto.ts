import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetFieldDto } from './create-asset-field.dto';

export class UpdateAssetFieldDto extends PartialType(CreateAssetFieldDto) {}
