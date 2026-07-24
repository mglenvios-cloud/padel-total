/**
 * AcademyManager - Cantera y escuela juvenil del club de pádel.
 */
class AcademyManager {
  constructor() {
    this.youthTalents = [];
  }

  generateYouthTalent() {
    const names = ['Carlos', 'Andrés', 'Mateo', 'Lucía'];
    const name = names[Math.floor(Math.random() * names.length)];
    const talent = {
      name: `${name} Junior`,
      age: 15 + Math.floor(Math.random() * 4), // 15-18 años
      potential: 70 + Math.floor(Math.random() * 25), // 70-95 potencial
      rating: 45 + Math.floor(Math.random() * 15)
    };
    this.youthTalents.push(talent);
    console.log(`Academia: Descubierto joven talento -> ${talent.name} (Potencial: ${talent.potential})`);
    return talent;
  }
}

window.AcademyManager = AcademyManager;
