export function createJsonRequest(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body: unknown) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function createRequest(url: string, method: "GET" | "POST" = "GET") {
  return new Request(url, { method });
}