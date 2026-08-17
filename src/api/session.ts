import { apiUrl } from "./client";

export type SessionRequest = {
  language?: string;
  scenario?: string;
  documentsText?: string;
};

export type SessionResponse = {
  model?: string;
  client_secret?: { value?: string };
  roleplayScenario?: string;
};

export async function createSession(
  request: SessionRequest,
): Promise<SessionResponse> {
  const response = await fetch(apiUrl("/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`/session failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as SessionResponse;
}
