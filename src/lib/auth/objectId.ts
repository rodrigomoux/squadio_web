/** ObjectId Mongo (24 hex). Sessões mock usam id "1" e não devem ir para a API. */
export function isMongoObjectId(value?: string | null): value is string {
  return !!value && /^[a-f\d]{24}$/i.test(value);
}
