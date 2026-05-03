from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


bearer_scheme = HTTPBearer(auto_error=False)


class FirebaseUser:
    def __init__(self, uid: str, email: str | None = None):
        self.uid = uid
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> FirebaseUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return FirebaseUser(uid="test-user-123", email="test@nutrisense.app")