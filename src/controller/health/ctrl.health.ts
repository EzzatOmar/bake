export type TPortal = {
  // No dependencies needed for health check
};

export type TArgs = {
  // No args needed
};

export type THealthResponse = {
  status: 'ok' | 'degraded';
  timestamp: string;
};

export default async function ctrlHealth(
  _portal: TPortal,
  _args: TArgs
): Promise<TErrTuple<THealthResponse>> {
  return [{
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, null];
}
