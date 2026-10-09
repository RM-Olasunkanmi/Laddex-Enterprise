const DEFAULT_MAX_BODY_BYTES = 32 * 1024;

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}

export async function readBoundedJson<T>(
  req: Pick<Request, "headers" | "text">,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<T> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new RequestValidationError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestValidationError("Invalid JSON body.");
  }
}

export function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
  minLength = 1,
) {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${label} is required.`);
  }
  const text = value.trim();
  if (text.length < minLength || text.length > maxLength) {
    throw new RequestValidationError(
      `${label} must be between ${minLength} and ${maxLength} characters.`,
    );
  }
  return text;
}

export function optionalText(value: unknown, label: string, maxLength: number) {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new RequestValidationError(`${label} must be at most ${maxLength} characters.`);
  }
  return value.trim();
}
