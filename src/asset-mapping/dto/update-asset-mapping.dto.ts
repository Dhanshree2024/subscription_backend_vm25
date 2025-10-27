import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetMappingDto } from './create-asset-mapping.dto';

export class UpdateAssetMappingDto extends PartialType(CreateAssetMappingDto) {}