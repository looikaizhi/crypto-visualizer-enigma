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
    "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
    "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
    "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
    "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
    "V": "VZBRGITYUPSDNHLXAWMJQOFECK"
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
        position: int (初始位置)
    """
    name: str
    position: str

# 初始化Enigma参数
class EncryptRequest(BaseModel):
    plaintext: str
    rotors: List[RotorConfig]
    reflector: int
    plugboard: List[Tuple[str, str]]

# Enigma返回的结果
class EncryptResponse(BaseModel):
    ciphertext: str
    rotor_positions: List[str]

@app.get("/rotors")
async def get_rotors():
    return ROTOR_WIRINGS

@app.get("/reflectors")
async def get_reflectors():
    return REFLECTOR_WIRINGS

@app.post("/encrypt", response_model=EncryptResponse)
async def encrypt(request: EncryptRequest):
    # 创建转子
    rotors = []
    for rotor_config in request.rotors:
        wiring = ROTOR_WIRINGS[rotor_config.name]
        rotor = Rotor(wiring, position=rotor_config.position)
        rotors.append(rotor)

    # 创建反射器
    reflector = Reflector(REFLECTOR_WIRINGS[request.reflector])

    # 创建插线板
    plugboard = Plugboard(request.plugboard)

    # 创建 Enigma 机器
    enigma = EnigmaMachine(plugboard, rotors, reflector)

    # 加密字符
    ciphertext = enigma.encrypt_message(request.plaintext)

    # 获取新的转子位置
    rotor_positions = [rotor.position for rotor in rotors]

    return EncryptResponse(
        ciphertext=ciphertext,
        rotor_positions=rotor_positions
    ) 

## 初始化一个Enigma密码机
def initialize_enigma(rotor_configs, reflector_index, plugboard_pairs):
    rotors = []
    for cfg in rotor_configs:
        wiring = ROTOR_WIRINGS[cfg["name"]]
        rotor = Rotor(wiring, position=cfg["position"])
        rotors.append(rotor)

    reflector = Reflector(REFLECTOR_WIRINGS[reflector_index])
    plugboard = Plugboard(plugboard_pairs)

    return EnigmaMachine(plugboard, rotors, reflector)

@app.post("/init")
async def new_enigma(config_dict: dict):
    try:
        global GLOBAL_ENIGMA
        enigma = initialize_enigma(
            rotor_configs=config_dict["rotors"],
            reflector_index=config_dict["reflector"],
            plugboard_pairs=config_dict["plugboard"]
        )
        GLOBAL_ENIGMA = enigma
        print("Success build a Enigma")
        return {"message": "Success build a Enigma"}
    except Exception as e:
        print("initialze Enigma failed")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/encrypt-char", response_model=EncryptResponse)
async def encrypt_one_char(letter: str) -> EncryptResponse:
    try:
        global GLOBAL_ENIGMA

        if GLOBAL_ENIGMA is None:
            raise Exception("Please initialize the Enigma machine")

        # 调用单字符加密（带步进）
        ciphertext = GLOBAL_ENIGMA.encrypt_letter(letter)

        # 获取转子位置（例如 ["B", "C", "D"]）
        rotor_positions = [rotor.get_position() for rotor in GLOBAL_ENIGMA.rotors]

        return EncryptResponse(
            ciphertext=ciphertext,
            rotor_positions=rotor_positions
        ) 
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
