ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _idx(c: str) -> int:
    return ord(c) - ord("A")


def _chr(i: int) -> str:
    return chr((i % 26 + 26) % 26 + ord("A"))


class Plugboard:
    def __init__(self, wiring_pairs):
        self.wiring = {}
        for a, b in wiring_pairs:
            self.wiring[a] = b
            self.wiring[b] = a

    def substitute(self, c):
        return self.wiring.get(c, c)


class Rotor:
    def __init__(self, wiring, notch, position="A", ring_setting="A"):
        self.wiring = wiring
        self.reverse_wiring = self._build_reverse(wiring)
        self.notch = notch
        self.position = position
        self.ring_setting = ring_setting

    @staticmethod
    def _build_reverse(wiring):
        reverse = [""] * 26
        for i, c in enumerate(wiring):
            reverse[_idx(c)] = _chr(i)
        return "".join(reverse)

    def _offset(self):
        return (_idx(self.position) - _idx(self.ring_setting)) % 26

    def rotate(self):
        self.position = _chr(_idx(self.position) + 1)

    def at_notch(self):
        return self.position == self.notch

    def forward_substitute(self, c):
        offset = self._offset()
        i = (_idx(c) + offset) % 26
        sub = self.wiring[i]
        return _chr(_idx(sub) - offset)

    def backward_substitute(self, c):
        offset = self._offset()
        i = (_idx(c) + offset) % 26
        sub = self.reverse_wiring[i]
        return _chr(_idx(sub) - offset)


class Reflector:
    def __init__(self, wiring):
        self.wiring = wiring

    def reflect(self, c):
        return self.wiring[_idx(c)]


class EnigmaMachine:
    def __init__(self, plugboard, rotors, reflector):
        self.plugboard = plugboard
        self.rotors = rotors
        self.reflector = reflector

    def step_rotors(self):
        left, middle, right = self.rotors[0], self.rotors[1], self.rotors[2]
        right_at_notch = right.at_notch()
        middle_at_notch = middle.at_notch()
        if middle_at_notch:
            left.rotate()
            middle.rotate()
        elif right_at_notch:
            middle.rotate()
        right.rotate()

    def encrypt_letter(self, c):
        if not c.isalpha():
            return c, [], [], []

        c = c.upper()
        self.step_rotors()

        plug_result = []
        c = self.plugboard.substitute(c)
        plug_result.append(c)

        forward_result = []
        for rotor in reversed(self.rotors):
            after = rotor.forward_substitute(c)
            forward_result.append({"from": c, "to": after})
            c = after

        c = self.reflector.reflect(c)

        backward_result = []
        for rotor in self.rotors:
            after = rotor.backward_substitute(c)
            backward_result.append({"from": c, "to": after})
            c = after

        c = self.plugboard.substitute(c)
        plug_result.append(c)

        return c, plug_result, forward_result, backward_result
