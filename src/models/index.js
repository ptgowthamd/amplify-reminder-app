// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Reminder } = initSchema(schema);

export {
  Reminder
};