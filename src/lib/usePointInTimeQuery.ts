import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { useCallback, useEffect, useRef, useState } from "react";
import { convexClient } from "./convexClient";

function serializeArgs(args: unknown): string {
  if (args === "skip") {
    return "skip";
  }
  return JSON.stringify(args);
}

/**
 * One-shot Convex read with no live subscription. Use for low-churn pages where
 * leaving a tab open should not keep invalidating backend queries.
 */
export function usePointInTimeQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
): {
  data: FunctionReturnType<Query> | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<FunctionReturnType<Query> | undefined>();
  const [isLoading, setIsLoading] = useState(args !== "skip");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryRef = useRef(query);
  const argsRef = useRef(args);
  queryRef.current = query;
  argsRef.current = args;
  const serializedArgs = serializeArgs(args);

  useEffect(() => {
    if (args === "skip") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading((current) => current || data === undefined);

    void convexClient.query(query, args).then((result) => {
      if (cancelled) {
        return;
      }
      setData(result);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // Fetch once per serialized args. Query refs are stable; do not add them here.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serializedArgs only
  }, [serializedArgs]);

  const refresh = useCallback(async () => {
    const currentArgs = argsRef.current;
    if (currentArgs === "skip") {
      return;
    }

    setIsRefreshing(true);
    try {
      const result = await convexClient.query(queryRef.current, currentArgs);
      setData(result);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return { data, isLoading, isRefreshing, refresh };
}

/** Stable empty args object for queries that take `{}`. */
export const EMPTY_QUERY_ARGS = {} as const;
