import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from database import Base


class Mode(str, enum.Enum):
    cash = "cash"
    online = "online"


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    mode = Column(Enum(Mode), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    mode = Column(Enum(Mode), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
