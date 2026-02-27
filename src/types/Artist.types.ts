// Corresponde al modelo 'Artista' que tenemos en la app móvil y en Sheets
export interface Artist {
    id_artista: string;
    nombre: string;
    pais: string;
    contacto: string;
}

// La estructura de la respuesta que nos da nuestro Google Apps Script
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
}

// Para crear un nuevo artista (coincide con los parámetros que espera doPost en Apps Script)
export interface CreateArtistPayload {
    nombre: string;
    pais: string;
    contacto: string;
}