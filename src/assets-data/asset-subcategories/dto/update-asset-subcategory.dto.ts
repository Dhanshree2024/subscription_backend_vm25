import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetSubcategoryDto } from './create-asset-subcategory.dto';

export class UpdateAssetSubcategoryDto extends PartialType(CreateAssetSubcategoryDto) {}
