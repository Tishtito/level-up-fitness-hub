import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api";

const FINAL_STATUSES = new Set(["succeeded", "failed", "cancelled", "refunded"]);

export function usePaymentStatus(paymentRef?: string) {
  const queryClient = useQueryClient();
  const reconciledRef = useRef<string | null>(null);
  const query = useQuery({
    queryKey: ["payment-status", paymentRef],
    queryFn: () => paymentsApi.status(paymentRef!),
    enabled: !!paymentRef,
    refetchInterval: (result) => FINAL_STATUSES.has(result.state.data?.status ?? "") ? false : 3000,
  });

  useEffect(() => {
    if (!paymentRef || FINAL_STATUSES.has(query.data?.status ?? "")) return;
    const timer = window.setTimeout(async () => {
      if (reconciledRef.current === paymentRef) return;
      reconciledRef.current = paymentRef;
      const payment = await paymentsApi.verify(paymentRef);
      queryClient.setQueryData(["payment-status", paymentRef], payment);
    }, 120000);
    return () => window.clearTimeout(timer);
  }, [paymentRef, query.data?.status, queryClient]);

  return query;
}
