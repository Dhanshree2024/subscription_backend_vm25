import { IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';

export class DeleteAssetSubCategoryDto {
 @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })  // validate each item in the array is a number
  sub_category_id: number[];
}