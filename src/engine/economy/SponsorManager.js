/**
 * SponsorManager (Economy) - Controla contratos y patrocinadores deportivos profesionales.
 */
class SponsorManager {
  constructor() {
    this.activeContracts = [];
  }

  signContract(sponsorName, goalsCount = 3) {
    const contract = {
      sponsor: sponsorName,
      matchesLeft: 5,
      goal: `Hacer ${goalsCount} Smashes`,
      payout: 350
    };
    this.activeContracts.push(contract);
    console.log(`Economy Sponsors: Contrato firmado con ${sponsorName}`);
  }

  checkProgress(matchStats) {
    this.activeContracts.forEach((c, idx) => {
      c.matchesLeft--;
      if (c.matchesLeft <= 0) {
        console.log(`Economy Sponsors: Contrato con ${c.sponsor} finalizado. Pago recibido: +${c.payout} Monedas`);
        this.activeContracts.splice(idx, 1);
      }
    });
  }
}

window.SponsorManager = SponsorManager;
