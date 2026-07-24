/**
 * CustomizationManager (Economy) - Enlace de personalización de avatares con la tienda.
 */
class CustomizationManager {
  constructor(playerProfile) {
    this.profile = playerProfile;
  }

  changeAppearance(customizationOptions, characterInstance) {
    if (characterInstance && characterInstance.customizer) {
      characterInstance.customizer.customize(customizationOptions);
    }
  }
}

window.CustomizationManager = CustomizationManager;
