"""Symmetric encryption for secrets stored in Postgres (provider access tokens)."""

from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


class EncryptionNotConfiguredError(RuntimeError):
    pass


@lru_cache
def _fernet(key: str) -> Fernet:
    if not key:
        raise EncryptionNotConfiguredError("OTTO_TOKEN_ENCRYPTION_KEY is not set")
    return Fernet(key.encode())


def encrypt(plaintext: str) -> str:
    return _fernet(get_settings().token_encryption_key).encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    try:
        return _fernet(get_settings().token_encryption_key).decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Could not decrypt: wrong OTTO_TOKEN_ENCRYPTION_KEY?") from exc
