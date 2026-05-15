import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface Rotor {
  index: string;
  wiring: string;
}

export interface RotorSelection {
  index: string;
  wiring: string;
  position: string;
  ringSetting: string;
}

export interface Reflector {
  index: string;
  wiring: string;
}

export interface PlugPair {
  from: string;
  to: string;
}

export interface PathStep {
  from: string;
  to: string;
}

export interface EncryptRequest {
  plaintext: string;
  rotors: RotorSelection[];
  reflector: string;
  plugboard: [string, string][];
}

export interface EncryptResponse {
  ciphertext: string;
  rotor_positions: string[];
  plugResult: string[];
  forwardResult: PathStep[];
  backwardResult: PathStep[];
}

const api = {
  getRotors: async () => {
    const response = await axios.get(`${API_BASE_URL}/rotors`);
    return response.data;
  },

  getReflectors: async () => {
    const response = await axios.get(`${API_BASE_URL}/reflectors`);
    return response.data;
  },

  encrypt: async (request: EncryptRequest): Promise<EncryptResponse> => {
    const payload = {
      plaintext: request.plaintext,
      reflector: request.reflector,
      plugboard: request.plugboard.filter(
        (pair) => pair[0] !== '' && pair[1] !== ''
      ),
      rotors: request.rotors.map((r) => ({
        index: r.index,
        position: r.position,
        ring_setting: r.ringSetting,
      })),
    };
    const response = await axios.post(`${API_BASE_URL}/encrypt`, payload);
    return response.data;
  },
};

export default api;
