import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EmitterWebhookEventName } from '@octokit/webhooks/dist-types/types';

import { GITHUB_EVENT } from './probot.constant';

@Injectable()
export class GithubHookMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getGitHubWebhookEvents(target: () => any): EmitterWebhookEventName[] {
    return this.reflector.get(GITHUB_EVENT, target)?.eventOrEvents;
  }
}
