import { BadRequestException } from '@nestjs/common';
import type { ProbeRequest, ProbeResponse } from './probe.types';

const BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.google.com',
]);

const BLOCKED_IPS = new Set(['169.254.169.254', '169.254.170.2']);

const MAX_BODY_BYTES = 64 * 1024;
const TIMEOUT_MS = 15_000;

export function assertSafeTargetUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid target URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Only http and https URLs are allowed');
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || BLOCKED_IPS.has(host)) {
    throw new BadRequestException('Target host is not allowed');
  }

  return parsed;
}

export async function probeHttp(request: ProbeRequest): Promise<ProbeResponse> {
  const url = assertSafeTargetUrl(request.url);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (key.trim()) {
      headers.set(key, value);
    }
  }

  if (
    request.body &&
    !headers.has('content-type') &&
    ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('user-agent')) {
    headers.set('User-Agent', 'VT-Reporting-Scanner/0.1');
  }

  try {
    const response = await fetch(url.toString(), {
      method: request.method.toUpperCase(),
      headers,
      body: ['GET', 'HEAD'].includes(request.method.toUpperCase())
        ? undefined
        : request.body,
      redirect: 'follow',
      signal: controller.signal,
    });

    const rawBody = Buffer.from(await response.arrayBuffer());
    const truncated = rawBody.subarray(0, MAX_BODY_BYTES);
    const bodySnippet = truncated.toString('utf8');

    const headerMap: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerMap[key.toLowerCase()] = value;
    });

    return {
      ok: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      headers: headerMap,
      bodySnippet,
      durationMs: Date.now() - started,
      error: null,
      finalUrl: response.url,
      redirected: response.redirected,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `Request timed out after ${TIMEOUT_MS}ms`
          : error.message
        : 'Request failed';

    return {
      ok: false,
      statusCode: null,
      statusText: null,
      headers: {},
      bodySnippet: '',
      durationMs: Date.now() - started,
      error: message,
      finalUrl: url.toString(),
      redirected: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeWithMutation(
  base: ProbeRequest,
  mutator: (req: ProbeRequest) => ProbeRequest,
): Promise<ProbeResponse> {
  return probeHttp(mutator(base));
}
