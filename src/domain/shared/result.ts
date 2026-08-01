export type Success<T> = {
  readonly ok: true;
  readonly value: T;
};

export type Failure<E extends Error> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E extends Error = Error> = Success<T> | Failure<E>;

export function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function err<E extends Error>(error: E): Failure<E> {
  return { ok: false, error };
}
