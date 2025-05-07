from fastapi.responses import JSONResponse
from component import Plugboard, Rotor, Reflector, EnigmaMachine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL_ENIGMA = None

# 扰频器的内部组合（固定）
ROTOR_WIRINGS = {
    "I":   "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
    "II":  "AJDKSIRUXBLHWTMCQGZNPYFVOE",
    "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
    "IV":  "ESOVPZJAYQUIRHXLNFTGKDCMWB",
    "V":   "VZBRGITYUPSDNHLXAWMJQOFECK"
    #      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
}

# 扰频器的转动位置（固定）
ROTOR_NOTCH = {
    "I": "Q",
    "II": "E",
    "III": "V",
    "IV": "J",
    "V": "Z"
}

# 反射器配置（固定）
REFLECTOR_WIRINGS = {
    "A": "EJMZALYXVBWFCRQUONTSPIKHGD",
    "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL"
}

# 设置扰频器
class RotorConfig(BaseModel):
    """
        index: int  (选择第x个扰频器)
        wiring: str (扰频器的内部组合)
        position: int (初始位置)
    """
    index: str
    wiring: str
    position: str

# 初始化Enigma参数
class EncryptRequest(BaseModel):
    plaintext: str
    rotors: List[RotorConfig]
    reflector: str
    plugboard: List[Tuple[str, str]]

# Enigma返回的结果
class EncryptResponse(BaseModel):
    ciphertext: str
    rotor_positions: List[str]
    plugResult: List[str]
    forwardResult: dict[str, str]
    backwardResult: dict[str, str]

@app.get("/rotors")
async def get_rotors():
    return ROTOR_WIRINGS

@app.get("/reflectors")
async def get_reflectors():
    return REFLECTOR_WIRINGS

@app.post("/encrypt", response_model=EncryptResponse)
async def encrypt(request: EncryptRequest):
    try:
        # 创建转子
        rotors = []
        for rotor_config in request.rotors:
            notch = ROTOR_NOTCH[rotor_config.index]
            rotor = Rotor(rotor_config.wiring, notch, rotor_config.position)
            rotors.append(rotor)

        # 创建反射器
        reflector = Reflector(REFLECTOR_WIRINGS[request.reflector])

        # 创建插线板
        plugboard = Plugboard(request.plugboard)

        # 创建 Enigma 机器
        enigma = EnigmaMachine(plugboard, rotors, reflector)

        # 加密字符
        ciphertext, plugResult, forwardResult, backwardResult = enigma.encrypt_letter(request.plaintext)

        # 获取新的转子位置
        rotor_positions = [rotor.position for rotor in rotors]

        print("success encrypt")
        return EncryptResponse(
            ciphertext=ciphertext,
            rotor_positions=rotor_positions,
            plugResult=plugResult,
            forwardResult=forwardResult,
            backwardResult=backwardResult
        ) 
    except Exception as e:
        print("encrypt failed")
        return JSONResponse(status_code=500, content={"error": str(e)})

