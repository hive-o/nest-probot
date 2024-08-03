import { Inject, Injectable } from '@nestjs/common';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { getPrivateKey } from '@probot/get-private-key';
import { App } from 'octokit';
import { Probot } from 'probot';
import SmeeClient from 'smee-client';

import { ModuleProviders, OctokitConfig, ProbotConfig } from './probot.types';

export const parseConfig = (config: ProbotConfig): Record<string, any> => {
  return {
    appId: config.appId,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    ghUrl: config.ghUrl || 'https://api.github.com',
    privateKey: getPrivateKey({
      env: { PRIVATE_KEY: config.privateKey },
    }) as string,
    webhookPath: config.webhookPath,
    webhookProxy: config.webhookProxy,
    webhookSecret: config.webhookSecret,
  };
};

export const createProbot = (config: ProbotConfig): Probot => {
  const parsedConfig = parseConfig(config);
  return new Probot({
    appId: parsedConfig['appId'],
    baseUrl: parsedConfig['ghUrl'],
    privateKey: parsedConfig['privateKey'],
    secret: parsedConfig['webhookSecret'],
  });
};

export const createSmee = (config: ProbotConfig) => {
  const parsedConfig = parseConfig(config);
  return new SmeeClient({
    logger: console,
    source: parsedConfig['webhookProxy'] as string,
    target: parsedConfig['webhookPath'] as string,
  });
};

export const createOctokit = (config: OctokitConfig): Octokit => {
  return new Octokit({
    auth: {
      ...config.auth,
      appId: config.probot.appId,
      clientId: config.probot.clientId,
      clientSecret: config.probot.clientSecret,
      privateKey: config.probot.privateKey,
    },
    authStrategy: createAppAuth,
    baseUrl: config.probot.ghUrl,
  });
};

@Injectable()
export class ProbotHelpers {
  readonly octokit_app: App;

  constructor(
    @Inject(ModuleProviders.ProbotConfig)
    private readonly config: ProbotConfig
  ) {
    this.octokit_app = new App({
      appId: config.appId,
      privateKey: getPrivateKey({
        env: { PRIVATE_KEY: config.privateKey },
      }) as string,
    });
  }
}
