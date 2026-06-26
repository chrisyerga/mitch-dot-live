import { useConvex } from "convex/react";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { useCallback, useEffect, useState } from "react";

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
  refresh: () => Promise<void>;
} {
  const convex = useConvex();
  const [data, setData] = useState<FunctionReturnType<Query> | undefined>();
  const [isLoading, setIsLoading] = useState(args !== "skip");

  const refresh = useCallback(async () => {
    if (args === "skip") {
      return;
    }

    setIsLoading(true);
    try {
      const result = await convex.query(query, args);
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [convex, query, args]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
