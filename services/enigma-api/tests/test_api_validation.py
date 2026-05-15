from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def base_payload(**overrides):
    payload = {
        "plaintext": "A",
        "rotors": [
            {"index": "I", "position": "A", "ring_setting": "A"},
            {"index": "II", "position": "A", "ring_setting": "A"},
            {"index": "III", "position": "A", "ring_setting": "A"},
        ],
        "reflector": "B",
        "plugboard": [],
    }
    payload.update(overrides)
    return payload


def test_canonical_single_char_returns_B():
    response = client.post("/encrypt", json=base_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["ciphertext"] == "B"
    assert body["rotor_positions"] == ["A", "A", "B"]
    assert isinstance(body["forwardResult"], list)
    assert isinstance(body["backwardResult"], list)
    assert all({"from", "to"} <= set(step.keys()) for step in body["forwardResult"])


def test_missing_rotor_returns_422():
    response = client.post(
        "/encrypt",
        json=base_payload(rotors=[{"index": "I", "position": "A", "ring_setting": "A"}]),
    )
    assert response.status_code == 422


def test_invalid_plaintext_returns_422():
    response = client.post("/encrypt", json=base_payload(plaintext="1"))
    assert response.status_code == 422


def test_invalid_reflector_returns_422():
    response = client.post("/encrypt", json=base_payload(reflector="Z"))
    assert response.status_code == 422


def test_invalid_rotor_index_returns_422():
    bad = base_payload()
    bad["rotors"][0]["index"] = "VII"
    response = client.post("/encrypt", json=bad)
    assert response.status_code == 422


def test_self_plugboard_pair_returns_422():
    response = client.post("/encrypt", json=base_payload(plugboard=[["A", "A"]]))
    assert response.status_code == 422


def test_reused_plugboard_letter_returns_422():
    response = client.post("/encrypt", json=base_payload(plugboard=[["A", "M"], ["A", "B"]]))
    assert response.status_code == 422


def test_more_than_ten_plugboard_pairs_returns_422():
    pairs = [
        ["A", "V"], ["B", "S"], ["C", "G"], ["D", "L"], ["F", "U"],
        ["H", "Z"], ["I", "N"], ["K", "M"], ["O", "W"], ["R", "X"],
        ["P", "T"],
    ]
    response = client.post("/encrypt", json=base_payload(plugboard=pairs))
    assert response.status_code == 422


def test_invalid_position_letter_returns_422():
    bad = base_payload()
    bad["rotors"][0]["position"] = "5"
    response = client.post("/encrypt", json=bad)
    assert response.status_code == 422
