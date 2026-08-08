import { useQuery } from "@tanstack/react-query";

import { cartApi } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";

/** Single source for the cart cache key — shared by the navbar badge, the cart
 *  page, and every add-to-cart mutation that has to invalidate it. */
export const CART_QUERY_KEY = ["cart"] as const;

/** Total quantity across all cart lines, for the header badge. 0 when logged out. */
export function useCartCount() {
  const session = useAuthSession();

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.get,
    // GET /cart is JWT-only, so there is nothing to fetch for a signed-out visitor.
    enabled: !!session,
    staleTime: 30_000,
  });

  return cartQuery.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
