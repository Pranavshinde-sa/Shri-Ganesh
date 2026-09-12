from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ModeEnum(str, Enum):
    cash = "cash"
    online = "online"


class DonationCreate(BaseModel):
    donor_name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    mode: ModeEnum


class DonationOut(DonationCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    mode: ModeEnum


class ExpenseOut(ExpenseCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    cash_received: float
    online_received: float
    total_received: float
    cash_expenses: float
    online_expenses: float
    total_expenses: float
    cash_balance: float
    online_balance: float
    total_balance: float
