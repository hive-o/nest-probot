import { applyDecorators, SetMetadata } from '@nestjs/common';
import { EmitterWebhookEventName } from '@octokit/webhooks/dist-types/types';

import { GITHUB_EVENT } from './probot.constant';

/**
 * Sets up hook trigger on functions.
 */
export function GitHubHook(
  eventOrEvents: EmitterWebhookEventName[]
): MethodDecorator {
  return applyDecorators(SetMetadata(GITHUB_EVENT, { eventOrEvents }));
}
