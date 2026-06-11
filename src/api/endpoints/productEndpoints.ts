export const productEndpoints = {
  byId: (id: number | string) => `/products/${id}`,
  invalidRoute: () => "/invalid-route",
  create: () => "/products",
} as const;

