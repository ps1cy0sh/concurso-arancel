import { io } from 'socket.io-client';

// URL del backend publicado en Render
const URL = 'https://concurso-arancel.onrender.com';

export const socket = io(URL, {
    autoConnect: false
});
