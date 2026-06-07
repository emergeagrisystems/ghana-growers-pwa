export type WeatherLocation = {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
};

// Edit Ghana weather locations here. Coordinates are used by the Open-Meteo API.
export const weatherLocations: WeatherLocation[] = [
  { name: "Accra", region: "Greater Accra", latitude: 5.6037, longitude: -0.187 },
  { name: "Kumasi", region: "Ashanti", latitude: 6.6885, longitude: -1.6244 },
  { name: "Tamale", region: "Northern", latitude: 9.4075, longitude: -0.8533 },
  { name: "Cape Coast", region: "Central", latitude: 5.1053, longitude: -1.2466 },
  { name: "Takoradi", region: "Western", latitude: 4.8845, longitude: -1.7554 },
  { name: "Ho", region: "Volta", latitude: 6.6119, longitude: 0.4703 },
  { name: "Sunyani", region: "Bono", latitude: 7.3349, longitude: -2.3123 },
  { name: "Koforidua", region: "Eastern", latitude: 6.0941, longitude: -0.2591 },
  { name: "Wa", region: "Upper West", latitude: 10.0607, longitude: -2.5019 },
  { name: "Bolgatanga", region: "Upper East", latitude: 10.7856, longitude: -0.8514 }
];
