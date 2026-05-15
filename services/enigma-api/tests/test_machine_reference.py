import pytest

from app.core.constants import REFLECTOR_WIRINGS, ROTOR_NOTCH, ROTOR_WIRINGS
from app.core.machine import EnigmaMachine, Plugboard, Reflector, Rotor


def build_machine(rotor_indices, positions, reflector_name="B", plugboard=None, ring_settings=None):
    if ring_settings is None:
        ring_settings = ["A"] * 3
    rotors = [
        Rotor(
            wiring=ROTOR_WIRINGS[idx],
            notch=ROTOR_NOTCH[idx],
            position=pos,
            ring_setting=ring,
        )
        for idx, pos, ring in zip(rotor_indices, positions, ring_settings)
    ]
    reflector = Reflector(REFLECTOR_WIRINGS[reflector_name])
    pb = Plugboard(plugboard or [])
    return EnigmaMachine(pb, rotors, reflector)


def encrypt_text(machine, plaintext):
    cipher = []
    for ch in plaintext:
        c, _, _, _ = machine.encrypt_letter(ch)
        cipher.append(c)
    return "".join(cipher)


@pytest.mark.parametrize(
    "rotor_indices,positions,plaintext,expected,final_positions,reflector,plugboard,ring",
    [
        (["I", "II", "III"], ["A", "A", "A"], "A", "B", ["A", "A", "B"], "B", None, None),
        (["I", "II", "III"], ["A", "A", "A"], "AAAAA", "BDZGO", ["A", "A", "F"], "B", None, None),
        (["I", "II", "III"], ["A", "A", "A"], "HELLOWORLD", "ILBDAAMTAZ", ["A", "A", "K"], "B", None, None),
        (["I", "II", "III"], ["A", "A", "A"], "A", "D", ["A", "A", "B"], "B", [("A", "M")], None),
        (["I", "II", "III"], ["A", "A", "A"], "HELLOWORLD", "ILBDMMATMC", ["A", "A", "K"], "B", [("A", "M"), ("C", "Z")], None),
        (["I", "II", "III"], ["A", "A", "A"], "HELLOWORLD", "KCUBRKIDKN", ["A", "A", "K"], "A", None, None),
        (["I", "II", "III"], ["A", "A", "A"], "HELLOWORLD", "XKVWSXCNHR", ["A", "A", "K"], "C", None, None),
        (["III", "II", "I"], ["A", "A", "A"], "HELLOWORLD", "MFNCZBBFZM", ["A", "A", "K"], "B", None, None),
        (["II", "IV", "V"], ["A", "A", "A"], "HELLOWORLD", "MQTVFBSMJX", ["A", "A", "K"], "B", None, None),
        (["I", "II", "III"], ["B", "C", "D"], "AAAAA", "RNOOV", ["B", "C", "I"], "B", None, None),
        (["I", "II", "III"], ["A", "A", "U"], "AAAAAA", "MUQOFX", ["A", "B", "A"], "B", None, None),
        (["I", "II", "III"], ["A", "D", "U"], "AAAA", "EQIB", ["B", "F", "Y"], "B", None, None),
        (["I", "II", "III"], ["A", "D", "V"], "AA", "QI", ["B", "F", "X"], "B", None, None),
    ],
)
def test_oracle(rotor_indices, positions, plaintext, expected, final_positions, reflector, plugboard, ring):
    machine = build_machine(rotor_indices, positions, reflector, plugboard, ring)
    ciphertext = encrypt_text(machine, plaintext)
    assert ciphertext == expected
    assert [r.position for r in machine.rotors] == final_positions


def test_double_step_position_trace():
    machine = build_machine(["I", "II", "III"], ["A", "D", "U"])
    expected_positions = [
        ["A", "D", "V"],
        ["A", "E", "W"],
        ["B", "F", "X"],
        ["B", "F", "Y"],
    ]
    for step_positions in expected_positions:
        machine.encrypt_letter("A")
        assert [r.position for r in machine.rotors] == step_positions


def test_forward_and_backward_trace_are_lists_of_steps():
    machine = build_machine(["I", "II", "III"], ["A", "A", "A"])
    _, plug, forward, backward = machine.encrypt_letter("A")
    assert isinstance(forward, list) and len(forward) == 3
    assert isinstance(backward, list) and len(backward) == 3
    for step in forward + backward:
        assert set(step.keys()) == {"from", "to"}
    assert isinstance(plug, list) and len(plug) == 2


def test_ring_setting_changes_output():
    base = build_machine(["I", "II", "III"], ["A", "A", "A"])
    ringed = build_machine(["I", "II", "III"], ["A", "A", "A"], ring_settings=["B", "A", "A"])
    base_out, _, _, _ = base.encrypt_letter("A")
    ring_out, _, _, _ = ringed.encrypt_letter("A")
    assert base_out != ring_out


def test_no_letter_encrypts_to_itself():
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        machine = build_machine(["I", "II", "III"], ["A", "A", "A"])
        c, _, _, _ = machine.encrypt_letter(letter)
        assert c != letter
