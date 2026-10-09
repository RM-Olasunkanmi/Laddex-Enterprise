/**
 * Paystack configuration and REST helpers (Nigeria cards, transfers, USSD).
 *
 * Paystack amounts are integer kobo — the same integer-money convention the
 * storefront already uses — so no float conversion is ever needed.
 * All env access lives here; nothing else touches `process.env.PAYSTACK_*`.
 */
export const paystackConfig = {
  /**
   * Master on/off switch. When false, checkout places orders directly with no
   * payment step, mirroring the Stripe starter behaviour. Flip to true once
   * PAYSTACK_SECRET_KEY is set and the webhook URL is registered in the
   * Paystack dashboard.
   */
  ENABLED: process.env.NEXT_PUBLIC_ENABLE_PAYSTACK === "true",
  SECRET_KEY: process.env.PAYSTACK_SECRET_KEY as string,
  PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
};

export default paystackConfig;

const PAYSTACK_API = "https://api.paystack.co";

export interface InitializeParams {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, string>;
  /** Where Paystack returns the buyer (it appends ?trxref=&reference=). */
  callbackUrl?: string;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

async function paystackFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paystackConfig.SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json()) as {
    status: boolean;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  };
  if (!res.ok || !body.status) {
    throw new Error(body.message || `Paystack request failed: ${path}`);
  }
  return body.data;
}

/** Starts a transaction; the buyer completes it at `authorizationUrl`. */
export async function initializeTransaction(
  params: InitializeParams,
): Promise<InitializeResult> {
  const data = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
  });
  return {
    authorizationUrl: data.authorization_url as string,
    accessCode: data.access_code as string,
    reference: data.reference as string,
  };
}

/** Server-side verification of a completed transaction by reference. */
export async function verifyTransaction(reference: string) {
  const data = await paystackFetch(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return data as {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, string>;
  };
}

/** Requests a full or partial refund for a verified Paystack transaction. */
export async function refundTransaction(reference: string, amountKobo?: number) {
  return paystackFetch("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: reference,
      ...(amountKobo == null ? {} : { amount: amountKobo }),
    }),
  });
}
