declare const unusable: unique symbol;
export type HashedString = string & { [_ in typeof unusable]: typeof unusable };
