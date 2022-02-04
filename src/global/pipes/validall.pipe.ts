// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ArgumentMetadata, BadRequestException, Inject, Injectable, InternalServerErrorException, PipeTransform } from "@nestjs/common";
import { Validall } from "@pestras/validall";

@Injectable()
export class ValidallPipe implements PipeTransform {
  
  constructor(@Inject('VALIDALL_PIPE_TOKEN') private readonly validatorName: string) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const validator = Validall.Get(this.validatorName);

    if (!validator)
      throw new InternalServerErrorException(`${this.validatorName} validator could not be found!`);

    const data = metadata.type === "param" && metadata.data
      ? { [metadata.data]: value }
      : value;

    if (validator.validate(data))
      return value;

    throw new BadRequestException(validator.error.message);
  }
}