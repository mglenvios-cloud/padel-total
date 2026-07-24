/**
 * StadiumManager - Administrador central de la escena del estadio.
 * Unifica la cancha, público instanciado, iluminación, pantallas y clima.
 */
class StadiumManager {
  constructor(scene, envMap) {
    this.scene = scene;
    this.envMap = envMap;

    this.court = new CourtRenderer(scene, envMap);
    this.crowd = new CrowdManager(scene);
    this.lighting = new LightingManager(scene);
    this.sponsors = new SponsorManager(scene);
    this.environment = new EnvironmentManager(scene);
    this.weather = new WeatherManager(scene);
    this.screen = new ScreenManager(scene);
  }

  buildStadium() {
    console.log('StadiumManager: Construyendo escenario deportivo...');
    this.court.build();
    this.crowd.build();
    this.lighting.setup();
    this.sponsors.buildBanners();
    this.environment.buildStadiumShell();
    this.screen.buildGiantScreen();
  }

  update(dt, frame) {
    this.crowd.update(frame);
    this.sponsors.update(dt);
    this.weather.update(dt);
  }
}

window.StadiumManager = StadiumManager;
