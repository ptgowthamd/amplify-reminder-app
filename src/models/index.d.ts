import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerReminder = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Reminder, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly remindAt: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyReminder = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Reminder, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly remindAt: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Reminder = LazyLoading extends LazyLoadingDisabled ? EagerReminder : LazyReminder

export declare const Reminder: (new (init: ModelInit<Reminder>) => Reminder) & {
  copyOf(source: Reminder, mutator: (draft: MutableModel<Reminder>) => MutableModel<Reminder> | void): Reminder;
}