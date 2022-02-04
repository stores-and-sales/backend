// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost } from "@nestjs/core";

@Catch(HttpException)
export class AllExceptionFilter implements ExceptionFilter {
  private logger = new Logger("Http Exception Filter");

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const isDev = this.configService.get<string>('NODE_ENV') !== "production";
    const body = {
      statusCode: status,
      name: exception.name,
      url: request.url,
      message: isDev || status < 500 ? exception.message : "unkownError"
    };

    if (status >= 500)
      this.logger.error(body);

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}