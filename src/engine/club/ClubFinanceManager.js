/**
 * ClubFinanceManager - Gestión del presupuesto del club (sueldos, taquilla, patrocinios).
 */
class ClubFinanceManager {
  constructor() {
    this.balance = 50000; // Fondos del club
    this.sponsorIncome = 1500;
    this.staffExpenses = 800;
  }

  processWeeklyFinances(ticketSales = 1200) {
    const totalIncome = this.sponsorIncome + ticketSales;
    const totalExpenses = this.staffExpenses;
    
    this.balance += (totalIncome - totalExpenses);
    console.log(`Club Finanzas: Balance semanal. Ingresos: +${totalIncome}. Gastos: -${totalExpenses}. Fondos actuales: ${this.balance}`);
  }
}

window.ClubFinanceManager = ClubFinanceManager;
