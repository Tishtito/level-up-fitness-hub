import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api";

const FINAL_STATUSES = new Set(["succeeded", "failed", "cancelled", "refunded"]);

/**
 * Cash on delivery is created `pending` and has no provider to settle it — only an admin
 * can, and not through any endpoint the client polls. Treating it as settled keeps it out
 * of the 3s refetch loop it would otherwise sit in forever.
 */
function isSettled(payment?: { status: string; method: string }) {
  return !payment || FINAL_STATUSES.has(payment.status) || payment.method === "cash_on_delivery";
}

export function usePaymentStatus(paymentRef?: string) {
  const queryClient = useQueryClient();
  const reconciledRef = useRef<string | null>(null);
  const query = useQuery({
    queryKey: ["payment-status", paymentRef],
    queryFn: () => paymentsApi.status(paymentRef!),
    enabled: !!paymentRef,
    // `data` is undefined before the first response — keep polling until we know.
    refetchInterval: (result) => (result.state.data && isSettled(result.state.data) ? false : 3000),
  });

  // A stable boolean, not `query.data` — depending on the object would clear and restart
  // this timer on every 3s poll, so it would never actually fire.
  const settled = isSettled(query.data);

  useEffect(() => {
    if (!paymentRef || settled) return;
    const timer = window.setTimeout(async () => {
      if (reconciledRef.current === paymentRef) return;
      reconciledRef.current = paymentRef;
      const payment = await paymentsApi.verify(paymentRef);
      queryClient.setQueryData(["payment-status", paymentRef], payment);
    }, 120000);
    return () => window.clearTimeout(timer);
  }, [paymentRef, settled, queryClient]);

  return query;
}
