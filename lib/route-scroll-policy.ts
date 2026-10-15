export type RouteScrollPolicy = 'top' | 'restore' | 'history';

let pendingPolicy: { pathname: string; policy: RouteScrollPolicy } | null = null;

/** Set immediately before push/pop restoration; consumed by SmoothScroll once. */
export function setRouteScrollPolicy(pathname: string, policy: RouteScrollPolicy): void {
  pendingPolicy = { pathname, policy };
}

export function takeRouteScrollPolicy(pathname: string): RouteScrollPolicy {
  const request = pendingPolicy;
  pendingPolicy = null;
  return request?.pathname === pathname ? request.policy : 'top';
}
