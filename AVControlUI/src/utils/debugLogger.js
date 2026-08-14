const DEBUG_ENABLED = true;

const now = () => {
  return new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const getRawSummary = (rawDataJson) => {
  if (!rawDataJson) {
    return {
      exists: false,
      length: 0,
    };
  }

  try {
    const parsed =
      typeof rawDataJson === "string" ? JSON.parse(rawDataJson) : rawDataJson;

    return {
      exists: true,
      type: typeof rawDataJson,
      stringLength:
        typeof rawDataJson === "string"
          ? rawDataJson.length
          : JSON.stringify(rawDataJson).length,
      protocol: parsed?.protocol,
      frequency: parsed?.frequency,
      rawDataLength: Array.isArray(parsed?.rawData)
        ? parsed.rawData.length
        : null,
      firstItems: Array.isArray(parsed?.rawData)
        ? parsed.rawData.slice(0, 10)
        : null,
    };
  } catch {
    return {
      exists: true,
      type: typeof rawDataJson,
      stringLength: String(rawDataJson).length,
      parseError: true,
      preview: String(rawDataJson).slice(0, 250),
    };
  }
};

const debugLogger = {
  group: (title, data = null) => {
    if (!DEBUG_ENABLED) return;

    console.groupCollapsed(
      `%c[AV DEBUG ${now()}] ${title}`,
      "color:#22d3ee;font-weight:bold;",
    );

    if (data !== null) {
      console.log(data);
    }
  },

  end: () => {
    if (!DEBUG_ENABLED) return;
    console.groupEnd();
  },

  info: (title, data = null) => {
    if (!DEBUG_ENABLED) return;

    console.log(
      `%c[AV DEBUG ${now()}] ${title}`,
      "color:#38bdf8;font-weight:bold;",
      data,
    );
  },

  success: (title, data = null) => {
    if (!DEBUG_ENABLED) return;

    console.log(
      `%c[AV DEBUG ${now()}] ${title}`,
      "color:#34d399;font-weight:bold;",
      data,
    );
  },

  warn: (title, data = null) => {
    if (!DEBUG_ENABLED) return;

    console.warn(`[AV DEBUG ${now()}] ${title}`, data);
  },

  error: (title, error = null) => {
    if (!DEBUG_ENABLED) return;

    console.error(`[AV DEBUG ${now()}] ${title}`, {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        baseURL: error?.config?.baseURL,
        params: error?.config?.params,
        data: error?.config?.data,
      },
      rawError: error,
    });
  },

  rawSummary: getRawSummary,

  compareSignals: (signals) => {
    if (!DEBUG_ENABLED) return;

    const summaries = signals.map((signal, index) => ({
      index: index + 1,
      summary: getRawSummary(signal),
      rawPreview:
        typeof signal === "string"
          ? signal.slice(0, 300)
          : safeStringify(signal).slice(0, 300),
    }));

    console.table(
      summaries.map((item) => ({
        okuma: item.index,
        exists: item.summary.exists,
        stringLength: item.summary.stringLength,
        protocol: item.summary.protocol,
        frequency: item.summary.frequency,
        rawDataLength: item.summary.rawDataLength,
        parseError: item.summary.parseError || false,
      })),
    );

    console.log("Signal details:", summaries);
  },
};

export default debugLogger;
