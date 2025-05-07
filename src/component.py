## 线路接线板
class Plugboard:
    # 定义连接的线路
    def __init__(self, wiring_pairs):
        self.wiring = {}
        for a,b in wiring_pairs:
            self.wiring[a] = b
            self.wiring[b] = a

    def substitute(self, c):
        return self.wiring.get(c, c)

## 扰频器（轮子）    
class Rotor:
    def __init__(self, wiring, notch, position='A') -> None:
        self.wiring = wiring
        self.reverse_wiring = self.compute_reverse_wiring()
        self.position = position
        self.notch = notch

    """
    假设 wiring=[E,K,M, ... ] , 
    那么reverse_wiring[4] = 'A', reverse_wiring[10] = 'B', reverse_wiring[12] = 'C'
    """
    def compute_reverse_wiring(self):
        reverse = [''] * 26
        for i, c in enumerate(self.wiring):
            reverse[ord(c) - ord('A')] = chr(i + ord('A'))
        return ''.join(reverse)

    # 每转动一次，+1 ，当超过26时返回1
    def rotate(self):
        pos = (ord(self.position) - ord('A') + 1) % 26
        self.position = chr(pos + ord('A'))

    # 确定是否带动下一个轮子转动
    def at_notch(self):
        return self.position == self.notch

    # 正向替换（经过轮子）
    def forward_substitute(self, c):
        offset = ord(self.position) - ord('A') # 当前轮子的位置
        idx = (ord(c) - ord('A') + offset) % 26 # 当前字符的映射位置
        subst = self.wiring[idx]
        print(f"forward_substitute: {c} -> {subst} (index: {idx})")
        return chr((ord(subst) - ord('A') - offset + 26) % 26 + ord('A')) # 获取第i个字符（A ~ Z）

    # 反向替换（经过轮子）
    def backward_substitute(self, c):
        offset = ord(self.position) - ord('A')
        idx = (ord(c) - ord('A') + offset) % 26
        subst = self.reverse_wiring[idx]
        print(f"backward_substitute: {c} -> {subst} (index: {idx})")
        return chr((ord(subst) - ord('A') - offset + 26) % 26 + ord('A'))

## 反射器
class Reflector:
    def __init__(self, wiring):
        self.wiring = wiring

    def reflect(self, c):
        return self.wiring[ord(c) - ord('A')]

## Enigma密码机
class EnigmaMachine:
    def __init__(self, plugboard, rotors, reflector):
        self.plugboard = plugboard
        self.rotors = rotors
        self.reflector = reflector

    # Notch触发点
    def step_rotors(self):
        right, middle, left = self.rotors[2], self.rotors[1], self.rotors[0]
        
        if middle.at_notch():
            middle.rotate() 
            right.rotate()
        if left.at_notch():
            middle.rotate()
        
        left.rotate()

    # 加密单个字符
    def encrypt_letter(self, c):
        if not c.isalpha(): # 只加密字符
            return c  

        c = c.upper() # 统一大写

        # 每按一次字符就会转一次，判断要不要转一轮
        self.step_rotors()

        # 接线板（替换字符）
        plugResult = []
        c = self.plugboard.substitute(c)
        plugResult.append(c)

        # 经过三个扰频器（正向替换）
        forwardResult = {}
        for rotor in self.rotors:  # Left to Right
            forwardResult[c] = rotor.forward_substitute(c)
            c = forwardResult[c]
        
        # 反射器
        c = self.reflector.reflect(c)

        # 经过三个扰频器（反向替换）
        backwardResult = {}
        for rotor in reversed(self.rotors):  # Right to Left
            backwardResult[c] = rotor.backward_substitute(c)
            c = backwardResult[c]

        # 接线板（替换字符）
        c = self.plugboard.substitute(c)
        plugResult.append(c)

        return c, plugResult, forwardResult, backwardResult
