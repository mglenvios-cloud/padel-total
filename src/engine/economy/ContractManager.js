/**
 * ContractManager - Administra los contratos profesionales de clubes y representantes.
 */
class ContractManager {
  constructor() {
    this.currentClubContract = null;
  }

  signClubContract(clubName, salaryPerMatch) {
    this.currentClubContract = {
      club: clubName,
      salary: salaryPerMatch,
      agentCut: 0.1 // 10% comisión representante
    };
    console.log(`Economy Contracts: Firmado con el club ${clubName}. Salario base: ${salaryPerMatch} Monedas/partido`);
  }
}

window.ContractManager = ContractManager;
