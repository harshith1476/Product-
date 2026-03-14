
from typing import Any, Dict, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

async def get(db: AsyncSession, id: int) -> Optional[User]:
    query = select(User).where(User.id == id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def create(db: AsyncSession, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        password=get_password_hash(obj_in.password),
        name=obj_in.name,
        role=obj_in.role or "patient",
        phone=obj_in.phone,
        gender=obj_in.gender,
        dob=obj_in.dob,
        age=obj_in.age,
        blood_group=obj_in.blood_group,
        image=obj_in.image
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update(
    db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
) -> User:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["password"] = hashed_password

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def authenticate(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    user = await get_by_email(db, email=email)
    print(f"DEBUG AUTH: email={email}, user_found={user is not None}")
    if not user:
        return None
        
    try:
        db_pwd = user.password.strip()
        print(f"DEBUG AUTH: DB password length={len(db_pwd)}")
        is_valid = verify_password(password, db_pwd)
        print(f"DEBUG AUTH: verify_password={is_valid}")
        
        if not is_valid:
            return None
    except Exception as e:
        # If the hash is invalid or from a different library (e.g. old bcrypt), fail gracefully
        print(f"Authentication error for {email}: {e}")
        return None
    return user
