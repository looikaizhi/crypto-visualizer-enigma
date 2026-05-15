from fastapi import APIRouter

from app.core.constants import REFLECTOR_WIRINGS, ROTOR_NOTCH, ROTOR_WIRINGS
from app.core.machine import EnigmaMachine, Plugboard, Reflector, Rotor
from app.models.schemas import EncryptRequest, EncryptResponse

router = APIRouter()


@router.get("/rotors")
async def get_rotors():
    return ROTOR_WIRINGS


@router.get("/reflectors")
async def get_reflectors():
    return REFLECTOR_WIRINGS


@router.post("/encrypt", response_model=EncryptResponse)
async def encrypt(request: EncryptRequest):
    rotors = [
        Rotor(
            wiring=ROTOR_WIRINGS[cfg.index],
            notch=ROTOR_NOTCH[cfg.index],
            position=cfg.position,
            ring_setting=cfg.ring_setting,
        )
        for cfg in request.rotors
    ]

    reflector = Reflector(REFLECTOR_WIRINGS[request.reflector])
    plugboard = Plugboard(request.plugboard)
    enigma = EnigmaMachine(plugboard, rotors, reflector)

    ciphertext, plug_result, forward_result, backward_result = enigma.encrypt_letter(
        request.plaintext
    )

    return EncryptResponse(
        ciphertext=ciphertext,
        rotor_positions=[rotor.position for rotor in rotors],
        plugResult=plug_result,
        forwardResult=forward_result,
        backwardResult=backward_result,
    )
