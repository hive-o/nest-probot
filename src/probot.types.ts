import { ModuleMetadata } from '@nestjs/common';

export interface ProbotConfig {
  appId: string;
  clientId: string;

  clientSecret: string;
  ghUrl?: string;

  privateKey: string;

  webhookPath?: string;
  webhookProxy?: string;

  webhookSecret?: string;
}

export interface OctokitConfig {
  auth: Record<string, any>;
  probot: ProbotConfig;
}

export interface ProbotModuleOptions {
  config: ProbotConfig;
  isGlobal?: boolean;
}

export interface ProbotModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  isGlobal?: boolean;
  useFactory: (...args: any[]) => ProbotConfig | Promise<ProbotConfig>;
}

export enum ProbotMetadata {
  name = 'probot/metadata/hook',
}

export enum ModuleProviders {
  ProbotConfig = 'probot/provider/config',
}
