import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { GithubHookMetadataAccessor } from './github-hook-metadata.accessor';
import { ProbotHelpers } from './probot.helpers';
import { ProbotService } from './probot.service';
import {
  ModuleProviders,
  ProbotModuleAsyncOptions,
  ProbotModuleOptions,
} from './probot.types';

@Module({
  imports: [DiscoveryModule],
})
export class ProbotModule {
  static forRoot(options: ProbotModuleOptions): DynamicModule {
    return {
      exports: [ProbotHelpers, ProbotService],
      global: options.isGlobal || true,
      module: ProbotModule,
      providers: [
        {
          provide: ModuleProviders.ProbotConfig,
          useFactory: () => options.config,
        },
        GithubHookMetadataAccessor,
        ProbotService,
        ProbotHelpers,
      ],
    };
  }

  static forRootAsync(options: ProbotModuleAsyncOptions): DynamicModule {
    return {
      exports: [ProbotHelpers, ProbotService],
      global: options.isGlobal || true,
      module: ProbotModule,
      providers: [
        {
          inject: options.inject || [],
          provide: ModuleProviders.ProbotConfig,
          useFactory: options.useFactory,
        },
        GithubHookMetadataAccessor,
        ProbotService,
        ProbotHelpers,
      ],
    };
  }
}
