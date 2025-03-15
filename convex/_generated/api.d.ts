/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as habits from "../habits.js";
import type * as icons from "../icons.js";
import type * as logTypes from "../logTypes.js";
import type * as logs from "../logs.js";
import type * as storage from "../storage.js";
import type * as streaks from "../streaks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  habits: typeof habits;
  icons: typeof icons;
  logTypes: typeof logTypes;
  logs: typeof logs;
  storage: typeof storage;
  streaks: typeof streaks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
