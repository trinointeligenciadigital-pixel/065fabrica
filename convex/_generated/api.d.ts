/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cadastros from "../cadastros.js";
import type * as carregamentos from "../carregamentos.js";
import type * as contagens from "../contagens.js";
import type * as estoque from "../estoque.js";
import type * as helpers from "../helpers.js";
import type * as operadores from "../operadores.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cadastros: typeof cadastros;
  carregamentos: typeof carregamentos;
  contagens: typeof contagens;
  estoque: typeof estoque;
  helpers: typeof helpers;
  operadores: typeof operadores;
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
