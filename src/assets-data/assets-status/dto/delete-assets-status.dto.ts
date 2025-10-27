import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetsStatusDto } from './create-assets-status.dto';

export class DeleteAssetsStatusDto extends PartialType(CreateAssetsStatusDto)  {
    status_type_id: number ;
    working_status_type_id: number ;
    status_color_code:string;
}