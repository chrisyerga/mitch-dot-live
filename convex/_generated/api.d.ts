/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as crons from "../crons.js";
import type * as dataSources from "../dataSources.js";
import type * as init from "../init.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_pollStatus from "../lib/pollStatus.js";
import type * as lib_seedDataSources from "../lib/seedDataSources.js";
import type * as migrations_trimWikidataPayloads from "../migrations/trimWikidataPayloads.js";
import type * as news from "../news.js";
import type * as pollSnapshots from "../pollSnapshots.js";
import type * as polling_congressGov from "../polling/congressGov.js";
import type * as polling_listEnabled from "../polling/listEnabled.js";
import type * as polling_newsSearch from "../polling/newsSearch.js";
import type * as polling_pollSource from "../polling/pollSource.js";
import type * as polling_recordPoll from "../polling/recordPoll.js";
import type * as polling_runPolls from "../polling/runPolls.js";
import type * as polling_wikidata from "../polling/wikidata.js";
import type * as polling_wikipedia from "../polling/wikipedia.js";
import type * as polling_xSearch from "../polling/xSearch.js";
import type * as status from "../status.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  crons: typeof crons;
  dataSources: typeof dataSources;
  init: typeof init;
  "lib/auth": typeof lib_auth;
  "lib/pollStatus": typeof lib_pollStatus;
  "lib/seedDataSources": typeof lib_seedDataSources;
  "migrations/trimWikidataPayloads": typeof migrations_trimWikidataPayloads;
  news: typeof news;
  pollSnapshots: typeof pollSnapshots;
  "polling/congressGov": typeof polling_congressGov;
  "polling/listEnabled": typeof polling_listEnabled;
  "polling/newsSearch": typeof polling_newsSearch;
  "polling/pollSource": typeof polling_pollSource;
  "polling/recordPoll": typeof polling_recordPoll;
  "polling/runPolls": typeof polling_runPolls;
  "polling/wikidata": typeof polling_wikidata;
  "polling/wikipedia": typeof polling_wikipedia;
  "polling/xSearch": typeof polling_xSearch;
  status: typeof status;
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

export declare const components: {};
