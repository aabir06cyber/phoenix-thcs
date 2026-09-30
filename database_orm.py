from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

database_url = settings.database_url

engine = create_async_engine(
    database_url,
    pool_size = 5,
    max_overflow = 10,
    echo=False)

session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

Base = declarative_base()

async def get_db():
    async with session() as db:
        yield db

