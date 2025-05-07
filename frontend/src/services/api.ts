import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface Rotor{
  index: string;
  wiring: string;
}

export interface RotorSelection {
  index: string;
  wiring: string;
  position: string;
}

export interface Reflector {
  index: string;
  wiring: string;
}

export interface PlugPair {
  from: string;
  to: string;
}

export interface EncryptRequest {
  plaintext: string;
  rotors: Rotor[];
  reflector: string;
  plugboard: [string, string][];
}

export interface EncryptResponse {
  ciphertext: string;
  rotor_positions: string[];
  plugResult: string[];
  forwardResult: [string, string][];
  backwardResult: [string, string][];
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
    const response = await axios.post(`${API_BASE_URL}/encrypt`, {
      ...request,
      plugboard: request.plugboard.filter(
        (pair) => pair[0] !== '' && pair[1] !== ''
      ),
    });
    return response.data;
  },
};

export default api; 