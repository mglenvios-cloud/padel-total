/**
 * ClubCreator - Permite a los usuarios crear, editar y gestionar sus propios clubes online.
 */
class ClubCreator {
  constructor() {
    this.createdClubs = [];
  }

  registerUserClub(ownerId, clubName, primaryColor, secondaryColor) {
    const club = {
      id: `uc_${Date.now()}`,
      owner: ownerId,
      name: clubName,
      colors: { primary: primaryColor, secondary: secondaryColor },
      roster: [ownerId]
    };
    this.createdClubs.push(club);
    console.log(`Universo Clubes: Registrado nuevo club de usuario -> ${clubName}`);
    return club;
  }
}

window.ClubCreator = ClubCreator;
