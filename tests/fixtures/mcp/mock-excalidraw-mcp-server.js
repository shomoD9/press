/**
 * This mock MCP server exists for bridge tests. It simulates the minimal stdio MCP
 * protocol flow Press relies on: initialize, tools/list, and tools/call.
 *
 * The goal is not feature completeness; it is deterministic protocol behavior so test
 * failures point to bridge regressions instead of external server instability.
 */
const { stdin, stdout } = process;

let buffer = Buffer.alloc(0);

function sendMessage(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "utf8");
  stdout.write(Buffer.concat([header, body]));
}

function buildDiagram(label) {
  return JSON.stringify(
    {
      type: "excalidraw",
      version: 2,
      source: "mock-mcp",
      elements: [],
      appState: {
        viewBackgroundColor: "#ffffff",
        gridSize: null
      },
      files: {},
      press: {
        label
      }
    },
    null,
    2
  );
}

function respond(id, result) {
  sendMessage({
    jsonrpc: "2.0",
    id,
    result
  });
}

function handleRequest(message) {
  if (!message || typeof message !== "object") {
    return;
  }

  if (typeof message.id !== "number") {
    // Notifications are intentionally ignored in this mock server.
    return;
  }

  const method = message.method;

  if (method === "initialize") {
    respond(message.id, {
      protocolVersion: "2024-11-05",
      capabilities: {},
      serverInfo: {
        name: "mock-excalidraw",
        version: "1.0.0"
      }
    });
    return;
  }

  if (method === "tools/list") {
    respond(message.id, {
      tools: [
        {
          name: "create_excalidraw_diagram"
        },
        {
          name: "refine_excalidraw_diagram"
        }
      ]
    });
    return;
  }

  if (method === "tools/call") {
    const params = message.params || {};
    const toolName = params.name || "";

    const label = toolName.includes("refine") ? "refined" : "created";

    respond(message.id, {
      structuredContent: {
        content: buildDiagram(label),
        webUrl: "https://example.com/mock-diagram",
        warnings: []
      }
    });
    return;
  }

  sendMessage({
    jsonrpc: "2.0",
    id: message.id,
    error: {
      code: -32601,
      message: `Unknown method: ${method}`
    }
  });
}

stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    const separator = buffer.indexOf("\r\n\r\n");
    if (separator === -1) {
      return;
    }

    const header = buffer.slice(0, separator).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = Buffer.alloc(0);
      return;
    }

    const length = Number(match[1]);
    const bodyStart = separator + 4;
    const bodyEnd = bodyStart + length;

    if (buffer.length < bodyEnd) {
      return;
    }

    const body = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.slice(bodyEnd);

    try {
      const message = JSON.parse(body);
      handleRequest(message);
    } catch {
      // Invalid payloads are ignored in the mock to keep tests deterministic.
    }
  }
});
