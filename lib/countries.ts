// Liste complète des pays avec noms FR/EN + villes principales
export interface Country {
  code: string;
  fr: string;
  en: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  { code: "FR", fr: "France", en: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Le Havre", "Saint-Étienne", "Grenoble", "Dijon", "Angers", "Nîmes", "Aix-en-Provence", "Clermont-Ferrand", "Le Mans", "Brest", "Tours", "Amiens", "Limoges", "Perpignan", "Metz", "Besançon", "Orléans", "Rouen", "Mulhouse", "Caen", "Nancy", "Avignon", "Pau", "La Rochelle", "Poitiers", "Antibes", "Cannes"] },
  { code: "BE", fr: "Belgique", en: "Belgium", cities: ["Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges", "Namur", "Louvain", "Mons", "Malines", "Tournai", "Courtrai", "Hasselt", "Ostende", "Arlon", "Wavre", "Waterloo", "Nivelles"] },
  { code: "CH", fr: "Suisse", en: "Switzerland", cities: ["Zurich", "Genève", "Bâle", "Berne", "Lausanne", "Winterthour", "Lucerne", "Saint-Gall", "Lugano", "Bienne", "Neuchâtel", "Fribourg", "Sion", "Montreux", "La Chaux-de-Fonds"] },
  { code: "LU", fr: "Luxembourg", en: "Luxembourg", cities: ["Luxembourg-Ville", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz"] },
  { code: "CA", fr: "Canada", en: "Canada", cities: ["Montréal", "Toronto", "Vancouver", "Ottawa", "Calgary", "Edmonton", "Québec", "Winnipeg", "Hamilton", "Halifax", "Victoria", "Gatineau", "Sherbrooke", "Laval", "Trois-Rivières"] },
  { code: "MA", fr: "Maroc", en: "Morocco", cities: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan", "Essaouira", "Nador"] },
  { code: "TN", fr: "Tunisie", en: "Tunisia", cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana", "Monastir", "Hammamet", "Nabeul", "Djerba"] },
  { code: "DZ", fr: "Algérie", en: "Algeria", cities: ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Tlemcen", "Béjaïa", "Djelfa"] },
  { code: "CI", fr: "Côte d'Ivoire", en: "Ivory Coast", cities: ["Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San Pedro", "Korhogo", "Man", "Gagnoa"] },
  { code: "SN", fr: "Sénégal", en: "Senegal", cities: ["Dakar", "Saint-Louis", "Thiès", "Kaolack", "Ziguinchor", "Rufisque", "Tambacounda", "Mbour"] },
  { code: "CM", fr: "Cameroun", en: "Cameroon", cities: ["Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam", "Ngaoundéré", "Kumba"] },
  { code: "DE", fr: "Allemagne", en: "Germany", cities: ["Berlin", "Munich", "Hambourg", "Cologne", "Francfort", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Brême", "Dresde", "Hanovre", "Nuremberg", "Duisbourg"] },
  { code: "ES", fr: "Espagne", en: "Spain", cities: ["Madrid", "Barcelone", "Valence", "Séville", "Saragosse", "Malaga", "Murcie", "Palma", "Bilbao", "Alicante", "Grenade", "Cordoue", "Salamanque", "Ibiza"] },
  { code: "IT", fr: "Italie", en: "Italy", cities: ["Rome", "Milan", "Naples", "Turin", "Palerme", "Gênes", "Bologne", "Florence", "Venise", "Vérone", "Bari", "Catane", "Pise", "Parme"] },
  { code: "NL", fr: "Pays-Bas", en: "Netherlands", cities: ["Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Eindhoven", "Groningue", "Tilbourg", "Almere", "Breda", "Arnhem", "Nimègue", "Maastricht"] },
  { code: "PT", fr: "Portugal", en: "Portugal", cities: ["Lisbonne", "Porto", "Braga", "Coimbra", "Faro", "Funchal", "Aveiro", "Évora", "Setúbal", "Viseu"] },
  { code: "GB", fr: "Royaume-Uni", en: "United Kingdom", cities: ["Londres", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Bristol", "Leeds", "Édimbourg", "Cardiff", "Belfast", "Oxford", "Cambridge", "Brighton", "Bath"] },
  { code: "US", fr: "États-Unis", en: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Francisco", "Miami", "Seattle", "Boston", "Denver", "Austin", "San Diego", "Atlanta", "Portland", "Las Vegas", "Washington D.C.", "Philadelphie"] },
  { code: "BR", fr: "Brésil", en: "Brazil", cities: ["São Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Belo Horizonte", "Fortaleza", "Curitiba", "Manaus", "Recife", "Porto Alegre"] },
  { code: "MG", fr: "Madagascar", en: "Madagascar", cities: ["Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga", "Toliara"] },
  { code: "MU", fr: "Maurice", en: "Mauritius", cities: ["Port-Louis", "Beau-Bassin", "Curepipe", "Vacoas", "Quatre Bornes", "Rose Hill"] },
  { code: "RE", fr: "La Réunion", en: "Réunion", cities: ["Saint-Denis", "Saint-Pierre", "Le Tampon", "Saint-Paul", "Saint-Louis", "Le Port", "Saint-André"] },
  { code: "GP", fr: "Guadeloupe", en: "Guadeloupe", cities: ["Pointe-à-Pitre", "Les Abymes", "Baie-Mahault", "Le Gosier", "Sainte-Anne", "Basse-Terre"] },
  { code: "MQ", fr: "Martinique", en: "Martinique", cities: ["Fort-de-France", "Le Lamentin", "Le Robert", "Schoelcher", "Sainte-Marie", "Le François"] },
  { code: "GF", fr: "Guyane", en: "French Guiana", cities: ["Cayenne", "Kourou", "Saint-Laurent-du-Maroni", "Matoury", "Remire-Montjoly"] },
  { code: "NC", fr: "Nouvelle-Calédonie", en: "New Caledonia", cities: ["Nouméa", "Dumbéa", "Mont-Dore", "Païta", "Koné"] },
  { code: "PF", fr: "Polynésie française", en: "French Polynesia", cities: ["Papeete", "Faaa", "Punaauia", "Pirae", "Moorea"] },
  { code: "MC", fr: "Monaco", en: "Monaco", cities: ["Monaco", "Monte-Carlo", "La Condamine", "Fontvieille"] },
  { code: "AD", fr: "Andorre", en: "Andorra", cities: ["Andorre-la-Vieille", "Escaldes-Engordany", "Encamp", "La Massana"] },
  { code: "IE", fr: "Irlande", en: "Ireland", cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Kilkenny"] },
  { code: "AT", fr: "Autriche", en: "Austria", cities: ["Vienne", "Graz", "Linz", "Salzbourg", "Innsbruck", "Klagenfurt"] },
  { code: "PL", fr: "Pologne", en: "Poland", cities: ["Varsovie", "Cracovie", "Wroclaw", "Poznań", "Gdańsk", "Łódź", "Katowice"] },
  { code: "CZ", fr: "Tchéquie", en: "Czech Republic", cities: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec"] },
  { code: "RO", fr: "Roumanie", en: "Romania", cities: ["Bucarest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov"] },
  { code: "GR", fr: "Grèce", en: "Greece", cities: ["Athènes", "Thessalonique", "Le Pirée", "Patras", "Héraklion", "Larissa"] },
  { code: "SE", fr: "Suède", en: "Sweden", cities: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping"] },
  { code: "DK", fr: "Danemark", en: "Denmark", cities: ["Copenhague", "Aarhus", "Odense", "Aalborg", "Esbjerg"] },
  { code: "NO", fr: "Norvège", en: "Norway", cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø"] },
  { code: "FI", fr: "Finlande", en: "Finland", cities: ["Helsinki", "Espoo", "Tampere", "Turku", "Oulu"] },
  { code: "RU", fr: "Russie", en: "Russia", cities: ["Moscou", "Saint-Pétersbourg", "Novossibirsk", "Iekaterinbourg", "Kazan"] },
  { code: "TR", fr: "Turquie", en: "Turkey", cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana"] },
  { code: "IL", fr: "Israël", en: "Israel", cities: ["Tel Aviv", "Jérusalem", "Haïfa", "Beersheva", "Netanya"] },
  { code: "LB", fr: "Liban", en: "Lebanon", cities: ["Beyrouth", "Tripoli", "Sidon", "Jounieh", "Tyr", "Byblos"] },
  { code: "JP", fr: "Japon", en: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Kobe", "Fukuoka"] },
  { code: "CN", fr: "Chine", en: "China", cities: ["Pékin", "Shanghai", "Canton", "Shenzhen", "Chengdu", "Wuhan", "Hangzhou"] },
  { code: "IN", fr: "Inde", en: "India", cities: ["Mumbai", "New Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"] },
  { code: "AU", fr: "Australie", en: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast"] },
  { code: "NZ", fr: "Nouvelle-Zélande", en: "New Zealand", cities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga"] },
  { code: "MX", fr: "Mexique", en: "Mexico", cities: ["Mexico", "Guadalajara", "Monterrey", "Cancún", "Puebla", "Mérida"] },
  { code: "AR", fr: "Argentine", en: "Argentina", cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Tucumán"] },
  { code: "CO", fr: "Colombie", en: "Colombia", cities: ["Bogota", "Medellín", "Cali", "Barranquilla", "Carthagène"] },
  { code: "ZA", fr: "Afrique du Sud", en: "South Africa", cities: ["Le Cap", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth"] },
  { code: "XX", fr: "Autre", en: "Other", cities: [] },
];

// Obtenir le nom du pays selon la langue
export function getCountryName(country: Country, lang: "FR" | "EN"): string {
  return lang === "FR" ? country.fr : country.en;
}

// Obtenir les villes filtrées pour l'autocomplete
export function filterCities(countryCode: string, query: string): string[] {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country || !query.trim()) return country?.cities.slice(0, 10) ?? [];
  const q = query.toLowerCase();
  return country.cities.filter((city) => city.toLowerCase().includes(q)).slice(0, 10);
}
