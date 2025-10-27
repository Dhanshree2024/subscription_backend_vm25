import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetItemsFieldsMappingDto } from './create-asset-items-fields-mapping.dto';

export class UpdateAssetItemsFieldsMappingDto extends PartialType(CreateAssetItemsFieldsMappingDto) {}
