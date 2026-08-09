import { Confidence, Severity } from '@prisma/client';
import type { ProbeRequest, ProbeResponse, ScanFindingDraft } from './probe.types';
import { probeHttp } from './http-probe';

const SQL_ERROR_PATTERNS = [
  /sqlsyntaxerrorexception/i,
  /mysql_fetch/i,
  /odbc sql server driver/i,
  /postgresql.*error/i,
  /ora-\d{5}/i,
  /unclosed quotation mark/i,
  /you have an error in your sql syntax/i,
  /sqlite3?\./i,
  /pg_query/i,
];

const STACK_TRACE_PATTERNS = [
  /exception in thread/i,
  /traceback \(most recent call last\)/i,
  /\.java:\d+/i,
  /at [a-z0-9_.]+\([a-z0-9_.]+:\d+\)/i,
  /stack trace/i,
  /system\.nullreferenceexception/i,
];

function draft(
  partial: Omit<ScanFindingDraft, 'confidence'> & { confidence?: Confidence },
): ScanFindingDraft {
  const { confidence, ...rest } = partial;
  return {
    ...rest,
    confidence: confidence ?? Confidence.FIRM,
  };
}

function header(res: ProbeResponse, name: string): string | undefined {
  return res.headers[name.toLowerCase()];
}

export async function runSecurityChecks(
  request: ProbeRequest,
  baseline: ProbeResponse,
): Promise<ScanFindingDraft[]> {
  const findings: ScanFindingDraft[] = [];
  const method = request.method.toUpperCase();
  const url = request.url;

  if (baseline.error) {
    findings.push(
      draft({
        title: 'Target endpoint unreachable',
        severity: Severity.INFORMATIONAL,
        confidence: Confidence.CERTAIN,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description: `Automated probe could not complete the request: ${baseline.error}`,
        impact:
          'Assessment automation could not evaluate response-based controls for this endpoint.',
        recommendation:
          'Verify network reachability, DNS, TLS certificates, and allowlisting for the scanner host.',
        reference: 'https://owasp.org/www-project-web-security-testing-guide/',
        testCase: 'Endpoint reachability',
        testObjective: 'Confirm the target API responds to authorized test traffic',
        testProcedure: `Send ${method} ${url} from the VT scanner`,
        result: 'FAIL',
        notes: baseline.error,
      }),
    );
    return findings;
  }

  // Transport
  if (url.startsWith('http://')) {
    findings.push(
      draft({
        title: 'Cleartext HTTP transport',
        severity: Severity.HIGH,
        confidence: Confidence.CERTAIN,
        owaspCode: 'A02',
        affectedUrl: url,
        httpMethod: method,
        description:
          'The endpoint is reachable over plain HTTP. Credentials and payloads may be intercepted.',
        impact: 'Man-in-the-middle exposure of tokens, PII, and request bodies.',
        recommendation: 'Enforce HTTPS only and redirect or reject HTTP.',
        reference: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
        testCase: 'TLS / HTTPS enforcement',
        testObjective: 'Verify sensitive API traffic uses TLS',
        testProcedure: 'Observe protocol of the configured target URL',
        result: 'FAIL',
      }),
    );
  } else {
    findings.push(
      draft({
        title: 'HTTPS transport in use',
        severity: Severity.INFORMATIONAL,
        confidence: Confidence.CERTAIN,
        owaspCode: 'A02',
        affectedUrl: url,
        httpMethod: method,
        description: 'Target URL uses HTTPS.',
        impact: 'N/A — positive observation.',
        recommendation: 'Keep TLS enabled with modern cipher suites.',
        testCase: 'TLS / HTTPS enforcement',
        testObjective: 'Verify sensitive API traffic uses TLS',
        testProcedure: 'Observe protocol of the configured target URL',
        result: 'PASS',
        notes: 'HTTPS detected',
      }),
    );
  }

  // Security headers
  const missingHeaders: { header: string; severity: Severity; why: string }[] =
    [];

  if (!header(baseline, 'strict-transport-security') && url.startsWith('https://')) {
    missingHeaders.push({
      header: 'Strict-Transport-Security',
      severity: Severity.MEDIUM,
      why: 'Browsers/clients are not instructed to enforce HTTPS on subsequent requests.',
    });
  }
  if (!header(baseline, 'x-content-type-options')) {
    missingHeaders.push({
      header: 'X-Content-Type-Options',
      severity: Severity.LOW,
      why: 'MIME sniffing may allow unexpected content interpretation.',
    });
  }
  if (
    !header(baseline, 'x-frame-options') &&
    !header(baseline, 'content-security-policy')
  ) {
    missingHeaders.push({
      header: 'X-Frame-Options / CSP frame-ancestors',
      severity: Severity.LOW,
      why: 'Clickjacking / framing protections were not observed.',
    });
  }
  if (!header(baseline, 'referrer-policy')) {
    missingHeaders.push({
      header: 'Referrer-Policy',
      severity: Severity.INFORMATIONAL,
      why: 'Referrer leakage controls are not declared.',
    });
  }

  if (missingHeaders.length > 0) {
    const list = missingHeaders.map((h) => `- ${h.header}: ${h.why}`).join('\n');
    const maxSeverity = missingHeaders.reduce((acc, h) => {
      const order = [
        Severity.INFORMATIONAL,
        Severity.LOW,
        Severity.MEDIUM,
        Severity.HIGH,
        Severity.CRITICAL,
      ];
      return order.indexOf(h.severity) > order.indexOf(acc) ? h.severity : acc;
    }, Severity.INFORMATIONAL);

    findings.push(
      draft({
        title: 'Missing security response headers',
        severity: maxSeverity,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description: `Response status ${baseline.statusCode}. Missing or incomplete hardening headers:\n${list}`,
        impact:
          'Increases risk of client-side abuse and makes baseline hardening incomplete.',
        recommendation:
          'Add standard security headers appropriate for an API (HSTS, X-Content-Type-Options, CSP/frame protections, Referrer-Policy).',
        reference: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
        testCase: 'Security response headers',
        testObjective: 'Verify recommended security headers are present',
        testProcedure: 'Inspect response headers from the baseline probe',
        result: 'FAIL',
        notes: list,
      }),
    );
  } else {
    findings.push(
      draft({
        title: 'Baseline security headers present',
        severity: Severity.INFORMATIONAL,
        confidence: Confidence.CERTAIN,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description: 'Common security headers were observed on the response.',
        impact: 'N/A — positive observation.',
        recommendation: 'Continue reviewing header values for correctness.',
        testCase: 'Security response headers',
        testObjective: 'Verify recommended security headers are present',
        testProcedure: 'Inspect response headers from the baseline probe',
        result: 'PASS',
      }),
    );
  }

  // Tech disclosure
  const server = header(baseline, 'server');
  const powered = header(baseline, 'x-powered-by');
  if (server || powered) {
    findings.push(
      draft({
        title: 'Technology disclosure via response headers',
        severity: Severity.LOW,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description: `Response discloses stack details${server ? ` (Server: ${server})` : ''}${powered ? ` (X-Powered-By: ${powered})` : ''}.`,
        impact: 'Helps attackers fingerprint components and target known CVEs.',
        recommendation: 'Remove or genericize Server / X-Powered-By headers.',
        reference: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
        testCase: 'Information disclosure headers',
        testObjective: 'Ensure responses do not leak stack fingerprints',
        testProcedure: 'Inspect Server and X-Powered-By headers',
        result: 'FAIL',
        notes: [server && `Server: ${server}`, powered && `X-Powered-By: ${powered}`]
          .filter(Boolean)
          .join('; '),
      }),
    );
  }

  // CORS
  const acao = header(baseline, 'access-control-allow-origin');
  const acac = header(baseline, 'access-control-allow-credentials');
  if (acao === '*') {
    findings.push(
      draft({
        title: 'Permissive CORS (Access-Control-Allow-Origin: *)',
        severity:
          acac?.toLowerCase() === 'true' ? Severity.HIGH : Severity.MEDIUM,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description:
          'The API returns Access-Control-Allow-Origin: *. Any origin can read responses from a browser context' +
          (acac?.toLowerCase() === 'true'
            ? ' and credentials appear allowed.'
            : '.'),
        impact: 'Cross-origin data theft or CSRF-like abuse depending on auth model.',
        recommendation:
          'Restrict ACAO to trusted origins. Never combine wildcard origin with credentials.',
        reference: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
        testCase: 'CORS policy review',
        testObjective: 'Verify CORS is not overly permissive',
        testProcedure: 'Inspect Access-Control-Allow-Origin and credentials headers',
        result: 'FAIL',
        notes: `ACAO=${acao}; ACAC=${acac ?? 'n/a'}`,
      }),
    );
  }

  // Error disclosure
  if (STACK_TRACE_PATTERNS.some((re) => re.test(baseline.bodySnippet))) {
    findings.push(
      draft({
        title: 'Verbose error / stack trace disclosure',
        severity: Severity.MEDIUM,
        confidence: Confidence.FIRM,
        owaspCode: 'A05',
        affectedUrl: url,
        httpMethod: method,
        description:
          'Response body appears to contain stack traces or verbose exception details.',
        impact: 'Leaks internal paths, frameworks, and implementation details.',
        recommendation:
          'Return generic client errors; log details server-side only.',
        reference: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
        testCase: 'Error handling disclosure',
        testObjective: 'Ensure errors do not expose internals',
        testProcedure: 'Inspect response body for stack traces',
        result: 'FAIL',
      }),
    );
  }

  // Auth signal
  const hasAuthHeader = Object.keys(request.headers).some((k) =>
    /^(authorization|x-api-key|api-key|cookie)$/i.test(k),
  );
  if (
    !hasAuthHeader &&
    baseline.statusCode !== null &&
    baseline.statusCode >= 200 &&
    baseline.statusCode < 300 &&
    baseline.bodySnippet.trim().length > 2
  ) {
    findings.push(
      draft({
        title: 'Unauthenticated successful response',
        severity: Severity.MEDIUM,
        confidence: Confidence.TENTATIVE,
        owaspCode: 'A07',
        affectedUrl: url,
        httpMethod: method,
        description:
          'No Authorization/API-key/Cookie header was supplied, yet the endpoint returned a successful response with a body. Confirm whether this endpoint is intentionally public.',
        impact:
          'If the resource is sensitive, lack of authentication enables unauthorized access.',
        recommendation:
          'Require authentication/authorization for non-public APIs and return 401/403 otherwise.',
        reference:
          'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
        testCase: 'Authentication required for sensitive endpoints',
        testObjective: 'Verify protected APIs reject anonymous access',
        testProcedure: 'Replay request without auth headers and observe status',
        result: 'FAIL',
        notes: `HTTP ${baseline.statusCode}`,
      }),
    );
  } else if (hasAuthHeader) {
    findings.push(
      draft({
        title: 'Authentication header supplied',
        severity: Severity.INFORMATIONAL,
        confidence: Confidence.CERTAIN,
        owaspCode: 'A07',
        affectedUrl: url,
        httpMethod: method,
        description:
          'Request included an authentication-related header. Automated scanner did not validate token strength or session fixation.',
        impact: 'N/A — requires manual review.',
        recommendation: 'Manually test authz boundaries and token handling.',
        testCase: 'Authentication required for sensitive endpoints',
        testObjective: 'Verify protected APIs reject anonymous access',
        testProcedure: 'Note auth header presence; anonymous negative test not run',
        result: 'NOT_TESTED',
        notes: 'Auth header present — anonymous negative test skipped',
      }),
    );
  }

  // Light SQLi probe
  const sqliFinding = await probeSqlInjection(request, baseline);
  if (sqliFinding) {
    findings.push(sqliFinding);
  } else {
    findings.push(
      draft({
        title: 'No obvious SQL error on light injection probe',
        severity: Severity.INFORMATIONAL,
        confidence: Confidence.TENTATIVE,
        owaspCode: 'A03',
        affectedUrl: url,
        httpMethod: method,
        description:
          'A single light SQL meta-character probe did not return classic DB error signatures. This does not prove the endpoint is safe.',
        impact: 'N/A — inconclusive automated check.',
        recommendation:
          'Continue with Burp Intruder / dedicated SQLi testing and parameterized query review.',
        reference: 'https://owasp.org/Top10/A03_2021-Injection/',
        testCase: 'Light SQL injection probe',
        testObjective: 'Detect obvious SQL error-based injection responses',
        testProcedure: 'Inject a meta-character into a JSON string field or query param',
        result: 'PASS',
        notes: 'No classic SQL error pattern observed',
      }),
    );
  }

  // Reflection / XSS-ish for APIs that echo input
  const xssFinding = await probeReflection(request, baseline);
  if (xssFinding) {
    findings.push(xssFinding);
  }

  // Always add access-control placeholder for manual follow-up
  findings.push(
    draft({
      title: 'Broken access control — manual verification required',
      severity: Severity.INFORMATIONAL,
      confidence: Confidence.TENTATIVE,
      owaspCode: 'A01',
      affectedUrl: url,
      httpMethod: method,
      description:
        'Automated single-request scanning cannot validate horizontal/vertical privilege checks. Marked for manual Burp/OWASP follow-up.',
      impact: 'Access control flaws often cause critical data exposure.',
      recommendation:
        'Test with multiple roles/tokens; attempt IDOR on object references.',
      reference: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
      testCase: 'Access control / IDOR review',
      testObjective: 'Verify users cannot access unauthorized resources',
      testProcedure: 'Replay with alternate user tokens and object IDs (manual)',
      result: 'NOT_TESTED',
      notes: 'Requires multi-user context',
    }),
  );

  return findings;
}

async function probeSqlInjection(
  request: ProbeRequest,
  baseline: ProbeResponse,
): Promise<ScanFindingDraft | null> {
  const mutated = mutatePayload(request, "' OR '1'='1");
  if (!mutated) {
    return null;
  }

  const response = await probeHttp(mutated);
  if (response.error) {
    return null;
  }

  const hit = SQL_ERROR_PATTERNS.some((re) => re.test(response.bodySnippet));
  const statusAnomaly =
    baseline.statusCode !== null &&
    response.statusCode !== null &&
    response.statusCode >= 500 &&
    baseline.statusCode < 500;

  if (!hit && !statusAnomaly) {
    return null;
  }

  return draft({
    title: 'Possible SQL injection (error-based signal)',
    severity: Severity.HIGH,
    confidence: hit ? Confidence.FIRM : Confidence.TENTATIVE,
    owaspCode: 'A03',
    affectedUrl: request.url,
    httpMethod: request.method.toUpperCase(),
    parameter: mutated.mutatedField,
    description:
      'A light SQL injection probe produced ' +
      (hit
        ? 'database error signatures in the response body'
        : `a 5xx response (HTTP ${response.statusCode}) unlike the baseline`) +
      '.',
    impact: 'Potential full database compromise or data leakage.',
    recommendation:
      'Use parameterized queries / ORM binding; validate and encode inputs.',
    reference: 'https://owasp.org/Top10/A03_2021-Injection/',
    testCase: 'Light SQL injection probe',
    testObjective: 'Detect obvious SQL error-based injection responses',
    testProcedure: `Inject SQL meta-characters into ${mutated.mutatedField}`,
    result: 'FAIL',
    notes: `Probe status ${response.statusCode}`,
  });
}

async function probeReflection(
  request: ProbeRequest,
  baseline: ProbeResponse,
): Promise<ScanFindingDraft | null> {
  const marker = `vtxss${Date.now().toString(36)}`;
  const payload = `<script>alert('${marker}')</script>`;
  const mutated = mutatePayload(request, payload);
  if (!mutated) {
    return null;
  }

  const response = await probeHttp(mutated);
  if (response.error || !response.bodySnippet.includes(payload)) {
    return null;
  }

  // Only flag if baseline did not already contain the same pattern
  if (baseline.bodySnippet.includes(payload)) {
    return null;
  }

  return draft({
    title: 'Reflected input in response (XSS risk for HTML clients)',
    severity: Severity.MEDIUM,
    confidence: Confidence.FIRM,
    owaspCode: 'A03',
    affectedUrl: request.url,
    httpMethod: request.method.toUpperCase(),
    parameter: mutated.mutatedField,
    description:
      'Unencoded attacker-controlled markup was reflected in the response body.',
    impact:
      'If consumed by a browser or rich client, may enable XSS. For pure JSON APIs, still indicates insufficient output encoding.',
    recommendation: 'Encode/escape output; use strict Content-Type; validate inputs.',
    reference: 'https://owasp.org/Top10/A03_2021-Injection/',
    testCase: 'Reflected XSS / input reflection',
    testObjective: 'Detect unencoded reflection of attacker input',
    testProcedure: `Inject HTML/JS marker into ${mutated.mutatedField}`,
    result: 'FAIL',
  });
}

function mutatePayload(
  request: ProbeRequest,
  injection: string,
): (ProbeRequest & { mutatedField: string }) | null {
  const method = request.method.toUpperCase();

  if (request.body?.trim()) {
    try {
      const parsed: unknown = JSON.parse(request.body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const clone = { ...(parsed as Record<string, unknown>) };
        const stringKey = Object.keys(clone).find(
          (k) => typeof clone[k] === 'string',
        );
        if (stringKey) {
          clone[stringKey] = `${String(clone[stringKey])}${injection}`;
          return {
            ...request,
            body: JSON.stringify(clone),
            mutatedField: stringKey,
          };
        }
      }
    } catch {
      // fall through to query mutation
    }
  }

  if (['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(method) || !request.body) {
    try {
      const u = new URL(request.url);
      const key = u.searchParams.keys().next().value ?? 'q';
      const current = u.searchParams.get(key) ?? '';
      u.searchParams.set(key, `${current}${injection}`);
      return {
        ...request,
        url: u.toString(),
        mutatedField: key,
      };
    } catch {
      return null;
    }
  }

  return null;
}
