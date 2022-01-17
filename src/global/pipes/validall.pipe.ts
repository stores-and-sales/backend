// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ArgumentMetadata, BadRequestException, Inject, Injectable, InternalServerErrorException, PipeTransform } from "@nestjs/common";
import { Validall } from "@pestras/validall";

@Injectable()
export class ValidallPipe implements PipeTransform {
  private readonly validator: Validall;

  constructor(@Inject('VALIDALL_PIPE_TOKEN') private readonly validatorName: string) {
    this.validator = Validall.Get(validatorName);

    if (!this.validator)
      throw new InternalServerErrorException(`${this.validatorName} validator could not be found!`);
  }

  transform(value: any, metadata: ArgumentMetadata) {
    const data = metadata.type === "param" && metadata.data
      ? { [metadata.data]: value }
      : value;

    if (this.validator.validate(data))
      return value;

    throw new BadRequestException(this.validator.error.message);
  }
}