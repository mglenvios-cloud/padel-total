class CareerClubManager {
  constructor(data = {}) {
    this.name = data.name || "Club Padel Elite";
    this.facilitiesLevel = data.facilitiesLevel || 1;
    this.academyLevel = data.academyLevel || 1;
  }
}
if (typeof module !== 'undefined') module.exports = ClubManager;