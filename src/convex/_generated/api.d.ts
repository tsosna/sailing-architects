/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _brevo from "../_brevo.js";
import type * as _emails from "../_emails.js";
import type * as _lib_bookingClosed from "../_lib/bookingClosed.js";
import type * as _lib_refundStatus from "../_lib/refundStatus.js";
import type * as _lib_requireAdmin from "../_lib/requireAdmin.js";
import type * as admin from "../admin.js";
import type * as crewConfirmation from "../crewConfirmation.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as refunds from "../refunds.js";
import type * as reminders from "../reminders.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _brevo: typeof _brevo;
  _emails: typeof _emails;
  "_lib/bookingClosed": typeof _lib_bookingClosed;
  "_lib/refundStatus": typeof _lib_refundStatus;
  "_lib/requireAdmin": typeof _lib_requireAdmin;
  admin: typeof admin;
  crewConfirmation: typeof crewConfirmation;
  crons: typeof crons;
  http: typeof http;
  migrations: typeof migrations;
  mutations: typeof mutations;
  queries: typeof queries;
  refunds: typeof refunds;
  reminders: typeof reminders;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
