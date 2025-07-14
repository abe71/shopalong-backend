// Define a unified shape of our request context
export interface RequestContext {
  requestId: string
  userId?: string
  deviceId?: string
  ip?: string
  method?: string
  path?: string
  hostname?: string
  query?: Record<string, any>
  userAgent?: string
  app?: string
  service_name?: string
  metadata?: Record<string, any>
}
