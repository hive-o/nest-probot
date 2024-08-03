import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { isEmpty } from 'lodash';
import { nanoid } from 'nanoid';
import { Probot } from 'probot';

import { GithubHookMetadataAccessor } from './github-hook-metadata.accessor';
import { createProbot, createSmee } from './probot.helpers';
import { ModuleProviders, ProbotConfig } from './probot.types';

@Injectable()
export class ProbotService
  implements OnModuleInit, OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly hooks: Map<string, any>;

  private readonly logger = new Logger(ProbotService.name);

  private readonly probot: Probot;

  private smee: any;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: GithubHookMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
    @Inject(ModuleProviders.ProbotConfig)
    private readonly config: ProbotConfig
  ) {
    this.hooks = new Map<string, any>();
    this.probot = createProbot(this.config);
  }

  private wrapFunctionInTryCatchBlocks(
    methodRef: () => any,
    instance: Record<string, any>
  ) {
    return async (...args: unknown[]) => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.error(error);
      }
    };
  }

  explore() {
    const instanceWrappers: InstanceWrapper[] = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    instanceWrappers
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;

        if (!instance || !Object.getPrototypeOf(instance)) {
          return;
        }

        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (key: string) => this.lookupHooks(instance, key)
        );
      });
  }

  initContext(fn: (context: any) => any) {
    return async (context: any) => {
      await fn(context);
    };
  }

  lookupHooks(instance: Record<string, () => any>, key: string) {
    const methodRef = instance[key];
    const hookMetadata =
      this.metadataAccessor.getGitHubWebhookEvents(methodRef);
    const hookFn = this.wrapFunctionInTryCatchBlocks(methodRef, instance);

    // filter functions that do not have a webhook event definition
    if (isEmpty(hookMetadata)) {
      return null;
    }

    return this.hooks.set(nanoid(4), {
      eventOrEvents: hookMetadata,
      target: hookFn,
    });
  }

  mountHooks() {
    this.probot
      .load(
        (app: {
          on: (arg0: any, arg1: (context: any) => Promise<void>) => any;
        }) => {
          this.hooks.forEach((hook) => {
            app.on(hook.eventOrEvents, this.initContext(hook.target));
          });
        }
      )
      .then(() => {
        this.logger.log('Hook event listeners initialized');
      })
      .catch(this.logger.error);
  }

  onApplicationBootstrap(): any {
    if (!isEmpty(this.config.webhookProxy)) {
      this.smee = createSmee(this.config);
      this.smee.start();
    }

    this.mountHooks();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onApplicationShutdown(signal?: string): any {
    // TODO clear probot event handlers on shutdown
  }

  public async onModuleInit() {
    this.explore();
  }

  receiveHook(request: any) {
    const id = request.headers['x-github-delivery'] as string;
    const event = request.headers['x-github-event'];
    const body = request.body;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.probot.receive({ id, name: event, payload: body });
  }
}
