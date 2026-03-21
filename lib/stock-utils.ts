// Utilitaires de calcul de stock pour les prescriptions d'élixirs

export interface StockInfo {
  totalDays: number | null;      // Durée totale en jours (quantity / dailyDose)
  endDate: Date | null;          // Date de fin calculée
  daysRemaining: number | null;  // Jours restants
  percentRemaining: number | null; // Pourcentage restant (0-100)
  isLow: boolean;                // Stock critique (daysRemaining <= stockAlertDays)
}

export interface PrescriptionForStock {
  quantity: number | null;
  dailyDose: number | null;
  startDate: Date | string;
  endDate: Date | string | null;
  stockAlertDays: number;
}

// Calcule les informations de stock à partir d'une prescription
export function computeStockInfo(rx: PrescriptionForStock): StockInfo {
  const now = new Date();

  // Si quantity et dailyDose sont définis, on calcule automatiquement
  if (rx.quantity && rx.dailyDose && rx.dailyDose > 0) {
    const totalDays = Math.ceil(rx.quantity / rx.dailyDose);
    const start = new Date(rx.startDate);
    const endDate = new Date(start.getTime() + totalDays * 86400000);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
    const percentRemaining = Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)));
    const isLow = daysRemaining <= rx.stockAlertDays;

    return { totalDays, endDate, daysRemaining, percentRemaining, isLow };
  }

  // Fallback sur endDate manuelle si définie
  if (rx.endDate) {
    const end = new Date(rx.endDate);
    const start = new Date(rx.startDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    const percentRemaining = totalDays > 0
      ? Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)))
      : null;
    const isLow = daysRemaining <= rx.stockAlertDays;

    return { totalDays, endDate: end, daysRemaining, percentRemaining, isLow };
  }

  // Pas assez d'infos pour calculer
  return { totalDays: null, endDate: null, daysRemaining: null, percentRemaining: null, isLow: false };
}

// Retourne la couleur Tailwind en fonction du pourcentage
export function stockColor(percent: number | null): string {
  if (percent === null) return "bg-or-pale";
  if (percent > 50) return "bg-foret";
  if (percent > 20) return "bg-ambre-vif";
  return "bg-red-500";
}

// Retourne la couleur texte en fonction du pourcentage
export function stockTextColor(percent: number | null): string {
  if (percent === null) return "text-brun-mid";
  if (percent > 50) return "text-foret";
  if (percent > 20) return "text-ambre-vif";
  return "text-red-500";
}
