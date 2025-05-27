from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
from typing import Optional, Dict
import pyotp
from fastapi.middleware.cors import CORSMiddleware

# uvicorn main:app --host 0.0.0.0 --port 8000  --reload

# --- Configurações JWT ---
SECRET_KEY = "ChaveSuperSeguraComMaisDe64CaracteresParaJWTFuncionarCorretamenteComHS512"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Segurança OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# --- Setup SQLAlchemy ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# --- Modelo de Usuário ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    totp_secret = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# --- Hash de senha ---
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- Schemas Pydantic ---
class LoginRequest(BaseModel):
    email: str
    password: str

class CreateUserRequest(BaseModel):
    email: str
    password: str

class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None

# --- Dependência DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Autenticação e JWT ---
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],            # ou lista específica de origens
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# --- TOTP temporário em memória ---
temp_secrets: Dict[str, str] = {}

@app.post("/create-user")
def create_user(request: CreateUserRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    new_user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        totp_secret=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
      "detail": "Usuário criado com sucesso",
      "requires2FA": True,
      "email": new_user.email
    }

@app.post("/2fa/setup/init")
def setup_2fa_init(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA já está configurado")

    secret = pyotp.random_base32()
    uri = pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="MinhaApp")
    temp_secrets[email] = secret

    return {
        "totp_uri": uri,
        "secret_base32": secret,
        "detail": "Escaneie o QR Code com seu app autenticador e confirme com o primeiro código."
    }

@app.post("/2fa/setup/confirm")
def confirm_2fa_setup(
    email: str = Body(...),
    token_totp: str = Body(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA já está configurado")

    secret = temp_secrets.get(email)
    if not secret:
        raise HTTPException(status_code=400, detail="Nenhum setup pendente para este e-mail.")

    totp = pyotp.TOTP(secret)
    if totp.verify(token_totp):
        user.totp_secret = secret
        db.commit()
        db.refresh(user)
        temp_secrets.pop(email)
        access_token = create_access_token(data={"sub": user.email})
        
        return {
          "detail": "2FA ativado com sucesso",
          "access_token": access_token,
          "token_type": "bearer"
        }
    else:
        raise HTTPException(status_code=401, detail="Código inválido")

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    if user.totp_secret:
        temp_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=5))
        return {
            "detail": "Login válido. Prossiga com a verificação 2FA.",
            "temp_token": temp_token
        }

    return {
        "detail": "Login válido. Configure o 2FA.",
        "email": user.email
    }

@app.post("/2fa/verify")
def verify_2fa(
    token_totp: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA não configurado")

    totp = pyotp.TOTP(current_user.totp_secret)
    if totp.verify(token_totp):
        access_token = create_access_token(data={"sub": current_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "detail": "Token JWT gerado com sucesso"
        }
    else:
        raise HTTPException(status_code=401, detail="Código TOTP inválido")