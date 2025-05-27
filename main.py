from fastapi import FastAPI, HTTPException, Depends, Body, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
from sqlalchemy import Column, Integer, String, create_engine, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from passlib.context import CryptContext
from typing import Optional, List, Dict
import random
from datetime import datetime

# --- Configurações JWT ---
SECRET_KEY = "ChaveSuperSeguraComMaisDe64CaracteresParaJWTFuncionarCorretamenteComHS512"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# uvicorn main:app --host 0.0.0.0 --port 8000  --reload

# --- Segurança OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# --- Setup SQLAlchemy ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()
# Armazenamento temporário dos códigos (para produção, use uma tabela no banco!)
reset_tokens: Dict[str, Dict] = {}

# --- Modelo de Usuário ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    regions = relationship(
        "Region",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    

class Region(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    region = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="regions")

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

class UserResponse(BaseModel):
    id: int
    email: str
    class Config:
        orm_mode = True

class RegionCreate(BaseModel):
    region: str

class RegionResponse(BaseModel):
    id: int
    region: str
    created_at: datetime

    class Config:
        orm_mode = True


# --- Dependência DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- JWT ---
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
        detail="Credenciais inválidas",
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.post("/create-user", response_model=UserResponse)
def create_user(request: CreateUserRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    new_user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()

@app.get("/users/me", response_model=UserResponse)
def get_my_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=UserResponse)
def update_my_user(request: UpdateUserRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.email:
        current_user.email = request.email
    if request.password:
        current_user.hashed_password = get_password_hash(request.password)
    db.commit()
    db.refresh(current_user)
    return current_user

@app.delete("/users/me")
def delete_my_user(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"detail": "Usuário deletado com sucesso"}

@app.get("/reset-password/send-code")
def send_reset_code(
    email: str = Query(..., description="E-mail do usuário que esqueceu a senha"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="E-mail não encontrado")

    # Gera um código numérico de 6 dígitos
    code = f"{random.randint(0, 999_999):06d}"
    expire = datetime.utcnow() + timedelta(minutes=5)  # expira em 5 minutos

    reset_tokens[email] = {"code": code, "expire": expire}

    # TODO: aqui você dispara o e-mail com o código via SMTP ou serviço de terceiros

    return {"msg": "Código enviado com sucesso", "code": code, "expire": expire.isoformat()}

# 2) Verificar o código recebido
class VerifyCodeRequest(BaseModel):
    email: str
    code: str

@app.post("/reset-password/verify-code")
def verify_reset_code(request: VerifyCodeRequest):
    data = reset_tokens.get(request.email)
    if not data or data["code"] != request.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    if datetime.utcnow() > data["expire"]:
        reset_tokens.pop(request.email, None)
        raise HTTPException(status_code=400, detail="Código expirado")

    return {"msg": "Código válido"}

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

@app.put("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    data = reset_tokens.get(request.email)
    if not data or data["code"] != request.code:
        raise HTTPException(status_code=400, detail="Código inválido")
    if datetime.utcnow() > data["expire"]:
        reset_tokens.pop(request.email, None)
        raise HTTPException(status_code=400, detail="Código expirado")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    db.refresh(user)

    # Limpa o token após uso
    reset_tokens.pop(request.email, None)

    return {"msg": "Senha atualizada com sucesso"}


@app.post("/regions", response_model=RegionResponse)
def create_region(
    payload: RegionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new = Region(user_id=current_user.id, region=payload.region)
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@app.get("/regions", response_model=List[RegionResponse])
def list_regions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Region).filter(Region.user_id == current_user.id).order_by(Region.created_at.desc()).all()


@app.get("/health")
def health_check():
    """
    Health check endpoint para verificar se a API está online.
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
