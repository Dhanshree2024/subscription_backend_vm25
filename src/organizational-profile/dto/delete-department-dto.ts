import { IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';

export class DeleteDepartmentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  departmentIds: number[];
}