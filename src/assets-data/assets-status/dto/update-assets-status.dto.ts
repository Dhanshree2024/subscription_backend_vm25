import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetsStatusDto } from './create-assets-status.dto';

export class UpdateAssetsStatusDto extends PartialType(CreateAssetsStatusDto) {}
