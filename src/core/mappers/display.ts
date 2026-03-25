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

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toLocaleString('pt-BR');
  }

  if (isTimestampLike(value)) {
    return new Date(value.seconds * 1000).toLocaleString('pt-BR');
  }

  return 'Disponível';
}
