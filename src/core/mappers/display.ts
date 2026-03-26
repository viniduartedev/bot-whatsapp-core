interface TimestampLike {
  seconds: number;
  nanoseconds?: number;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeTimestamp = value as { seconds?: unknown; nanoseconds?: unknown };
  return (
    typeof maybeTimestamp.seconds === 'number' &&
    (maybeTimestamp.nanoseconds === undefined || typeof maybeTimestamp.nanoseconds === 'number')
  );
}

export function formatUnknownDateTime(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const parsedDate = toDateFromUnknown(value);

  if (parsedDate) {
    return parsedDate.toLocaleString('pt-BR');
  }

  return typeof value === 'string' ? value : 'Disponível';
}

export function toDateFromUnknown(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (isTimestampLike(value)) {
    return new Date(value.seconds * 1000);
  }

  return null;
}

export function summarizeUnknownValue(value: unknown, maxLength = 88): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const serializedValue =
    typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 0) ?? 'Informação disponível';

  return serializedValue.length > maxLength
    ? `${serializedValue.slice(0, maxLength - 1)}…`
    : serializedValue;
}
