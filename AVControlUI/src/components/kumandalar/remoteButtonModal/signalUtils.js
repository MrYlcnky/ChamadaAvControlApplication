const parseSignal = (signal) => {
  if (!signal) return null;

  try {
    const parsed = typeof signal === "string" ? JSON.parse(signal) : signal;

    if (parsed.rawDataJson && !parsed.rawData) {
      return parseSignal(parsed.rawDataJson);
    }

    return parsed;
  } catch {
    return null;
  }
};

const getRawData = (signal) => {
  const parsed = parseSignal(signal);

  if (!parsed) return [];

  if (Array.isArray(parsed.rawData)) {
    return parsed.rawData.map(Number);
  }

  return [];
};

const createRawFingerprint = (signal) => {
  const rawData = getRawData(signal);

  if (!rawData || rawData.length < 10) return "";

  // İlk 2 değer header gibi düşünülür.
  // Örn: [4515, 4525, 545, 1705, ...]
  const dataWithoutHeader = rawData.slice(2);

  const bits = [];

  for (let i = 0; i < dataWithoutHeader.length - 1; i += 2) {
    const mark = dataWithoutHeader[i];
    const space = dataWithoutHeader[i + 1];

    if (!mark || !space) continue;

    // Normal IR mark değerleri genelde 500-600 civarı.
    if (mark < 300 || mark > 900) continue;

    // Kısa space = 0, uzun space = 1
    bits.push(space > 1000 ? "1" : "0");
  }

  return bits.join("");
};

const areFingerprintsClose = (first, second) => {
  if (!first || !second) return false;

  const lengthDiff = Math.abs(first.length - second.length);

  if (lengthDiff > 2) return false;

  const compareLength = Math.min(first.length, second.length);

  let sameCount = 0;

  for (let i = 0; i < compareLength; i += 1) {
    if (first[i] === second[i]) {
      sameCount += 1;
    }
  }

  const matchRate = sameCount / compareLength;

  return matchRate >= 0.9;
};

export const areSignalsSame = (signals) => {
  if (!Array.isArray(signals) || signals.length !== 3) {
    return false;
  }

  const fingerprint1 = createRawFingerprint(signals[0]);
  const fingerprint2 = createRawFingerprint(signals[1]);
  const fingerprint3 = createRawFingerprint(signals[2]);

  console.log("IR Fingerprints:", {
    fingerprint1,
    fingerprint2,
    fingerprint3,
  });

  if (!fingerprint1 || !fingerprint2 || !fingerprint3) {
    return false;
  }

  return (
    areFingerprintsClose(fingerprint1, fingerprint2) &&
    areFingerprintsClose(fingerprint1, fingerprint3) &&
    areFingerprintsClose(fingerprint2, fingerprint3)
  );
};

export const normalizeSignal = (signal) => {
  const parsed = parseSignal(signal);

  if (!parsed) return String(signal || "").trim();

  const rawData = getRawData(signal);

  return JSON.stringify({
    protocol: parsed.protocol ?? "RAW",
    frequency: parsed.frequency ?? 38000,
    rawData,
    fingerprint: createRawFingerprint(signal),
  });
};
