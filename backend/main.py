import io
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import Base, engine, get_db
import models
import schemas
import auth

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

FONT_PATH = Path(__file__).resolve().parent / "fonts" / "NotoSansDevanagari-Regular.ttf"
pdfmetrics.registerFont(TTFont("NotoDevanagari", str(FONT_PATH)))

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Donation Tracker API")

# Allow the frontend (local dev + deployed on Vercel) to call this API.
# For production, replace "*" with your actual Vercel URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Auth ----------

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not auth.verify_credentials(form_data.username, form_data.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = auth.create_access_token(form_data.username)
    return {"access_token": token, "token_type": "bearer"}


# ---------- Donations ----------

@app.post("/donations", response_model=schemas.DonationOut)
def create_donation(
    donation: schemas.DonationCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(auth.get_current_admin),
):
    db_donation = models.Donation(**donation.model_dump())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    return db_donation


@app.get("/donations", response_model=list[schemas.DonationOut])
def list_donations(db: Session = Depends(get_db)):
    return db.query(models.Donation).order_by(models.Donation.created_at.desc()).all()


@app.delete("/donations/{donation_id}")
def delete_donation(
    donation_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(auth.get_current_admin),
):
    donation = db.query(models.Donation).filter(models.Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    db.delete(donation)
    db.commit()
    return {"ok": True}


# ---------- Expenses ----------

@app.post("/expenses", response_model=schemas.ExpenseOut)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(auth.get_current_admin),
):
    # Check enough balance is available in the chosen portfolio before deducting.
    received = db.query(func.coalesce(func.sum(models.Donation.amount), 0.0)).filter(
        models.Donation.mode == expense.mode
    ).scalar()
    spent = db.query(func.coalesce(func.sum(models.Expense.amount), 0.0)).filter(
        models.Expense.mode == expense.mode
    ).scalar()
    available = received - spent
    if expense.amount > available:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {expense.mode.value} balance. Available: {available:.2f}",
        )

    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.get("/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).order_by(models.Expense.created_at.desc()).all()


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(auth.get_current_admin),
):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}


# ---------- Dashboard ----------

@app.get("/dashboard", response_model=schemas.DashboardSummary)
def dashboard(db: Session = Depends(get_db)):
    def sum_for(model, mode):
        return db.query(func.coalesce(func.sum(model.amount), 0.0)).filter(
            model.mode == mode
        ).scalar()

    cash_received = sum_for(models.Donation, models.Mode.cash)
    online_received = sum_for(models.Donation, models.Mode.online)
    cash_expenses = sum_for(models.Expense, models.Mode.cash)
    online_expenses = sum_for(models.Expense, models.Mode.online)

    return schemas.DashboardSummary(
        cash_received=cash_received,
        online_received=online_received,
        total_received=cash_received + online_received,
        cash_expenses=cash_expenses,
        online_expenses=online_expenses,
        total_expenses=cash_expenses + online_expenses,
        cash_balance=cash_received - cash_expenses,
        online_balance=online_received - online_expenses,
        total_balance=(cash_received + online_received) - (cash_expenses + online_expenses),
    )


# ---------- PDF Export ----------

def _build_pdf(title: str, headers: list[str], rows: list[list[str]], total_label: str, total_value: float) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    elements = []

    marathi_style = styles["Normal"].clone("Marathi")
    marathi_style.fontName = "NotoDevanagari"
    marathi_style.shaping = 1

    def pdf_text(value):
        text = str(value)
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)

        if has_devanagari:
            return Paragraph(text, marathi_style)
        
        return text

    elements.append(Paragraph(title, styles["Title"]))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%d %b %Y, %I:%M %p')}", styles["Normal"]))
    elements.append(Spacer(1, 10 * mm))

    data = data = [headers] + [[pdf_text(cell) for cell in row] for row in rows]
    table = Table(data, repeatRows=1, colWidths=None)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4B43")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F4F4")]),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph(f"<b>{total_label}: {total_value:,.2f}</b>", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@app.get("/export/donations")
def export_donations(db: Session = Depends(get_db)):
    donations = db.query(models.Donation).order_by(models.Donation.created_at.desc()).all()
    rows = [
        [d.donor_name, f"{d.amount:,.2f}", d.mode.value.capitalize(), d.created_at.strftime("%d-%m-%Y %H:%M")]
        for d in donations
    ]
    total = sum(d.amount for d in donations)
    pdf_bytes = _build_pdf(
        "Donation List",
        ["Donor Name", "Amount", "Mode", "Date"],
        rows,
        "Total Donations",
        total,
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=donations.pdf"},
    )


@app.get("/export/expenses")
def export_expenses(db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).order_by(models.Expense.created_at.desc()).all()
    rows = [
        [e.name, f"{e.amount:,.2f}", e.mode.value.capitalize(), e.created_at.strftime("%d-%m-%Y %H:%M")]
        for e in expenses
    ]
    total = sum(e.amount for e in expenses)
    pdf_bytes = _build_pdf(
        "Expense List",
        ["Expense Name", "Amount", "Mode", "Date"],
        rows,
        "Total Expenses",
        total,
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"},
    )


@app.get("/")
def root():
    return {"status": "ok", "message": "Donation Tracker API is running"}
