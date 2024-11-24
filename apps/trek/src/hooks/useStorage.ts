import { storage, Storage } from "../util/storage";
import { useMemo } from "react";

export const useStorage = <K extends keyof Storage>(key: K): Storage[K] => useMemo(() => storage[key], [key]);
