from typing import Dict, List, Tuple

from pydantic import BaseModel, Field, conlist, constr, field_validator


LetterStr = constr(pattern=r"^[A-Z]$")
RotorIndexStr = constr(pattern=r"^(I|II|III|IV|V)$")
ReflectorStr = constr(pattern=r"^[ABC]$")


class RotorConfig(BaseModel):
    index: RotorIndexStr
    position: LetterStr
    ring_setting: LetterStr = "A"


class EncryptRequest(BaseModel):
    plaintext: constr(pattern=r"^[A-Za-z]$")
    rotors: conlist(RotorConfig, min_length=3, max_length=3)
    reflector: ReflectorStr
    plugboard: conlist(Tuple[LetterStr, LetterStr], max_length=10) = Field(default_factory=list)

    @field_validator("plugboard")
    @classmethod
    def _no_self_or_dup(cls, v):
        seen = set()
        for a, b in v:
            if a == b:
                raise ValueError("plugboard pair cannot connect a letter to itself")
            if a in seen or b in seen:
                raise ValueError("plugboard letter reused across pairs")
            seen.add(a)
            seen.add(b)
        return v


PathStep = Dict[str, str]


class EncryptResponse(BaseModel):
    ciphertext: str
    rotor_positions: List[str]
    plugResult: List[str]
    forwardResult: List[PathStep]
    backwardResult: List[PathStep]
