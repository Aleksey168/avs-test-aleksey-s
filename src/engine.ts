// @ts-nocheck
import {
  PerspectiveCamera,
  Scene,
  AmbientLight,
  Mesh,
  Vector3,
  Clock,
  WebGLRenderer,
  MathUtils,
  Group,
  DirectionalLight,
  Color,
  LoadingManager,
  SRGBColorSpace,
  TextureLoader,
  WebGLCubeRenderTarget,
  RepeatWrapping,
  BoxGeometry,
  MeshPhysicalMaterial,
  Vector2,
  DoubleSide,
  PlaneGeometry,
  Vector4,
  Quaternion,
  Matrix4,
  Spherical,
  Box3,
  Sphere,
  Raycaster,
  NoToneMapping,
  Object3D,
} from 'three';
import gsap, { Linear } from 'gsap';
import { BehaviorSubject } from 'rxjs';
import { fromEvent, Observable } from 'rxjs';
import { auditTime, map, share } from 'rxjs/operators';
import Hammer from 'hammerjs';
import { ProgressiveLightMap, SoftShadowMaterial } from '@pmndrs/vanilla';
import { RGBELoader } from '@addons/loaders/RGBELoader';
import { GLTFLoader } from '@addons/loaders/GLTFLoader';
import { DRACOLoader } from '@addons/loaders/DRACOLoader';
import CameraControls from 'camera-controls';

export class Engine {
  static getInstance() {
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }
    return Engine.instance;
  }

  constructor() {
    if (Engine.instance) {
      return Engine.instance;
    }
    Engine.instance = this;

    this.state = {
      loading: new BehaviorSubject({
        isLoading: true,
        percent: null,
      }),
      errors: new BehaviorSubject({
        isError: false,
        message: null,
      }),
      renderingStatus: new BehaviorSubject(false),
    };

    this.settings = {
      plm: {
        frames: 100,
        limit: Infinity,
        blend: 40,
        scale: 7,
        opacity: 0.45,
        alphaTest: 0.83,
        colorBlend: 0.1,
        light: {
          position: new Vector3(0.3, 3, 4),
          radius: 9,
          amount: 8,
          intensity: Math.PI,
          ambient: 0.7,
          bias: 0.001,
          mapSize: 512,
          size: 15,
          near: 0.01,
          far: 10.5,
        },
      },

      loadOnDemand: {
        enabled: true,
        loadingManager: {
          enabled: true,
        },
      },
      container: null,
      path_config: {
        models_path: 'models/',
        textures_path: 'textures/',
        decoders_path: 'decoders/',
      },
      renderer: {
        outputEncoding: SRGBColorSpace,
        get pixelRatio() {
          return window.devicePixelRatio;
        },
        exposure: 1,
        toneMapping: NoToneMapping,
      },

      camera: {
        portraitAspect: 3 / 4,
        landscapeAspect: 4 / 3.5,
        near: 1,
        far: 10,
        fov: 45,
      },

      light: {
        intensity: 1,
      },

      controls: {
        thirdPerson: {
          focalOffset: {
            x: 0,
            y: 0,
            z: 0,
          },
          smoothTime: 0.1,
          draggingSmoothTime: 0.1,
          polarRotateSpeed: 1,
          azimuthRotateSpeed: 1,
          maxPolarAngle: MathUtils.degToRad(90),
          minPolarAngle: MathUtils.degToRad(1),
          minAzimuthAngle: -Infinity,
          maxAzimuthAngle: Infinity,
          minZoom: 0.9,
          maxZoom: 2.5,
          defaultZoom: 1.2,
          near: 0.5,
        },
      },

      models: {
        table: {
          totalAssetsCount: 17,
          animation: {
            cameraZoom: {
              duration: 3,
              ease: Linear,
            },
          },

          assetsArray: ['leg.glb', 'prop_01.glb', 'prop_02.glb'],
          rotation: Math.PI / 2,
          textArray: [
            {
              path: 'ashwood.webp',
              name: 'ashwood',
              repeat: true,
              repeatSet: 0.7,
              anisotropy: true,
            },
            {
              path: 'cedar.webp',
              name: 'cedar',
              repeat: true,
              repeatSet: 0.7,
              anisotropy: true,
            },
            {
              path: 'walnut.webp',
              name: 'walnut',
              repeat: true,
              repeatSet: 0.7,
              anisotropy: true,
            },
            {
              path: 'plastic_black.webp',
              name: 'plastic_black',
              repeat: true,
              repeatSet: 0.7,
              anisotropy: true,
            },
            {
              path: 'plastic_black_nrm.webp',
              name: 'plastic_black_nrm',
              repeat: true,
              repeatSet: 0.7,
              nonSrgb: true,
            },

            {
              path: 'plastic_white_nrm.webp',
              name: 'plastic_white_nrm',
              repeat: true,
              repeatSet: 0.7,
              anisotropy: true,
            },
            {
              path: 'plastic_white.webp',
              name: 'plastic_white',
              repeat: true,
              repeatSet: 0.7,
              nonSrgb: true,
            },
          ],
        },
      },

      environment: {
        assetsArray: [
          {
            id: 1,
            hdrTexturePath: 'light.hdr',
            intensity: 1,
            isDefault: true,
          },
        ],
      },
    };

    this.loadingManager = new LoadingManager();
    this.setupLoadingManager();
  }

  async init(reInit?: boolean) {
    if (reInit || this.renderer) {
      this.settings.container.appendChild(this.renderer.domElement);
      this.setupCameraControls(true);
      this.onResize();
      this.initListeners();
      this.addSubs();
      this.startRendering();
    } else {
      this.vector = new Vector3();
      this.clock = new Clock();
      this.render = (time, deltaTime, frame) =>
        this.animate(time, deltaTime, frame);

      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });

      this.renderer.setPixelRatio(this.settings.renderer.pixelRatio);

      this.renderer.colorSpace = this.settings.renderer.outputEncoding;
      this.renderer.toneMappingExposure = this.settings.renderer.exposure;
      this.renderer.toneMapping = this.settings.renderer.toneMapping;

      this.scene = new Scene();

      this.camera = new PerspectiveCamera(
        this.settings.camera.fov,
        this.settings.container.clientWidth /
          this.settings.container.clientHeight,
        this.settings.camera.near,
        this.settings.camera.far
      );

      this.camera.zoom = this.settings.controls.thirdPerson.defaultZoom;

      this.ambientLight = new AmbientLight(
        0xffffff,
        this.settings.light.intensity
      );
      this.scene.add(this.ambientLight);

      this.models = new this.Model(this);

      await Promise.all([
        !this.settings.integration && this.models.load(),
        this.initTextures(),
      ]);

      !this.settings.integration && this.models.init();

      this.renderer.compile(this.scene, this.camera);

      this.settings.container.appendChild(this.renderer.domElement);
      this.setupCameraControls();

      this.onResize();
      this.initListeners();
      this.addSubs();

      this.startRendering();

      const cam = {
        position: {
          x: 2.2099066923874235,
          y: 0.8485321104665562,
          z: -1.380021688253225,
        },
        target: {
          x: -0.000015974044799804688,
          y: 0.38650140857696536,
          z: 0.5,
        },
      };

      this.controls.setLookAt(
        cam.position.x,
        cam.position.y,
        cam.position.z,
        cam.target.x,
        cam.target.y,
        cam.target.z
      );

      this.centerCam();

      const env = this.settings.environment.assetsArray.find(
        (el) => el.isDefault
      );

      this.scene.environment = this.getHdrTexture(env.id);
      this.scene.environmentIntensity = env.intensity;

      this.state.loading.next({
        isLoading: false,
        percent: null,
      });
      this.update();
      this.settings.loadOnDemand.loadingManager.enabled = false;
    }
  }

  setupLoadingManager() {
    this.loadingManager.onStart = (item, loaded, total) => {};

    this.loadingManager.onProgress = (item, loaded, total) => {
      if (!this.settings.loadOnDemand.loadingManager.enabled) return;
      const percent = Math.min(
        (
          (loaded / this.settings.models.table.totalAssetsCount) *
          100
        ).toFixed(),
        100
      );
      this.state.loading.next({ isLoading: true, percent: Number(percent) });
    };

    this.loadingManager.onError = (err) => {
      this.state.errors.next({
        isError: true,
        message: `Error ${err}`,
      });
    };
  }

  setupPLM() {
    this.gLights = new Group();
    this.api = { count: 0 };
    this.lightPositionSequence = [];

    for (let l = 0; l < this.settings.plm.light.amount; l++) {
      const dirLight = new DirectionalLight(
        0xffffff,
        this.settings.plm.light.intensity / this.settings.plm.light.amount
      );
      dirLight.name = 'dir_light_' + l;
      dirLight.castShadow = true;
      dirLight.shadow.bias = this.settings.plm.light.bias;
      dirLight.shadow.camera.near = this.settings.plm.light.near;
      dirLight.shadow.camera.far = this.settings.plm.light.far;
      dirLight.shadow.camera.right = this.settings.plm.light.size / 2;
      dirLight.shadow.camera.left = -this.settings.plm.light.size / 2;
      dirLight.shadow.camera.top = this.settings.plm.light.size / 2;
      dirLight.shadow.camera.bottom = -this.settings.plm.light.size / 2;
      dirLight.shadow.mapSize.width = this.settings.plm.light.mapSize;
      dirLight.shadow.mapSize.height = this.settings.plm.light.mapSize;
      this.gLights.add(dirLight);
    }

    this.generateLightPositionSequence();

    this.renderer.shadowMap.enabled = true;

    this.models.group.traverse((mesh: Object3D) => {
      if (mesh instanceof Mesh) {
        mesh.castShadow = true;
      }
    });

    this.plm = new ProgressiveLightMap(this.renderer, this.scene, 512);

    this.shadowMaterial = new SoftShadowMaterial({
      map: this.plm.progressiveLightMap2.texture,
      transparent: true,
      depthWrite: false,
      blend: this.settings.plm.colorBlend,
      alphaTest: 0,
      color: new Color(0x000000),
      name: 'Soft Shadow',
    });
  }

  generateLightPositionSequence() {
    const vLength = this.settings.plm.light.position.length();
    this.lightPositionSequence = [];

    for (let frame = 0; frame < this.settings.plm.frames; frame++) {
      const framePositions = [];

      for (let i = 0; i < this.gLights.children.length; i++) {
        let position;
        if (Math.random() > this.settings.plm.light.ambient) {
          position = new Vector3(
            this.settings.plm.light.position.x +
              MathUtils.randFloatSpread(this.settings.plm.light.radius),
            this.settings.plm.light.position.y +
              MathUtils.randFloatSpread(this.settings.plm.light.radius),
            this.settings.plm.light.position.z +
              MathUtils.randFloatSpread(this.settings.plm.light.radius)
          );
        } else {
          const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
          const phi = 2 * Math.PI * Math.random();
          position = new Vector3(
            Math.cos(lambda) * Math.cos(phi) * vLength,
            Math.abs(Math.cos(lambda) * Math.sin(phi) * vLength),
            Math.sin(lambda) * vLength
          );
        }
        framePositions.push(position);
      }
      this.lightPositionSequence.push(framePositions);
    }
  }

  randomiseLightPositions() {
    const frameIndex = this.api.count % this.settings.plm.frames;
    const framePositions = this.lightPositionSequence[frameIndex];

    for (let i = 0; i < this.gLights.children.length; i++) {
      const light = this.gLights.children[i];
      const position = framePositions[i];
      light.position.copy(position);
    }
  }

  renderShadows(frames = this.settings.plm.frames) {
    this.settings.plm.blend = Math.max(
      2,
      this.settings.plm.frames === Infinity
        ? this.settings.plm.blend
        : this.settings.plm.frames
    );

    this.models.shadowMesh.material.opacity = this.settings.plm.opacity;
    this.models.shadowMesh.material.alphaTest = this.settings.plm.alphaTest;

    this.scene.add(this.gLights);
    this.plm.prepare();
    for (let i = 0; i < frames; i++) {
      this.randomiseLightPositions();
      this.plm.update(this.camera, this.settings.plm.blend);
      this.api.count++;
    }
    this.scene.remove(this.gLights);
    this.plm.finish();
  }

  resetPLM() {
    this.plm.clear();
    this.models.shadowMesh.material.opacity = 0;
    this.models.shadowMesh.material.alphaTest = 0;
    this.api.count = 0;

    if (this.settings.plm.frames !== Infinity) {
      this.renderShadows(this.settings.plm.frames);
    }
  }

  async initTextures() {
    this.rgbeLoader = new RGBELoader(this.loadingManager);
    window.createImageBitmap = undefined;
    this.textureLoader = new TextureLoader(this.loadingManager);
    this.path = this.settings.path_config.textures_path;
    this.textureLoader.setPath(this.path);
    this.rgbeLoader.setPath(this.path);
    await this.loadAllTextures();
  }

  getHdrTexture(id) {
    return this.settings.environment.assetsArray.find(
      (texture) => texture.id === id
    ).loadedHDRTexture;
  }

  getTexture(textName) {
    return this.settings.models.table.textArray.find(
      (texture) => texture.name === textName
    )?.loadedTexture;
  }

  async loadAllTextures() {
    return await Promise.all(
      this.settings.models.table.textArray.map(async (el) => {
        await this.loadTexture(el, 'map');
      }),
      this.settings.environment.assetsArray
        .filter((el) => el.isDefault)
        .map(async (el) => {
          await this.loadTexture(el, 'pmrem');
        })
    );
  }

  async loadTexture(obj: any, textureType: string) {
    if (textureType === 'pmrem') {
      const hdr = await this.rgbeLoader.loadAsync(obj.hdrTexturePath);

      if (this.settings.usePmrem) {
        const PMREM = this.pmremGenerator.fromEquirectangular(hdr).texture;

        obj.loadedHDRTexture = PMREM;
      } else {
        const cubeRenderTarget = new WebGLCubeRenderTarget(
          256
        ).fromEquirectangularTexture(this.renderer, hdr);

        obj.loadedHDRTexture = cubeRenderTarget.texture;
      }
    }

    if (textureType === 'map') {
      const texture = await this.textureLoader.loadAsync(obj.path);
      this.setupTexture(texture, obj);
      obj.loadedTexture = texture;
    }
  }

  setupTexture(texture, obj) {
    if (obj.anisotropy) {
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }

    if (obj.repeat) {
      texture.wrapT = texture.wrapS = RepeatWrapping;
      obj.repeatSet && texture.repeat.set(obj.repeatSet, obj.repeatSet);
    }

    if (!obj.nonSrgb) {
      texture.colorSpace = SRGBColorSpace;
    }

    if (obj.rotation) {
      texture.rotation = obj.rotation;
    }

    texture.flipY = false;
  }

  centerCam() {
    const tableTop = this.scene.getObjectByName('Table top');

    tableTop.geometry.computeBoundingBox();
    const center = new Vector3();
    tableTop.geometry.boundingBox.getCenter(center);
    center.applyMatrix4(tableTop.matrixWorld);

    this.controls?.setTarget(center.x, center.y - 0.2, center.z);
  }

  destroy() {
    this.sub.unsubscribe();
    this.removeListeners();
    this.pauseRendering();
  }

  addSubs() {
    this.sub = new Observable().subscribe();

    const hammertime = new Hammer(this.settings.container);

    hammertime.get('pinch').set({ enable: true });

    const wheelEvent = fromEvent(this.settings.container, 'wheel').pipe(
      map((event) => {
        event.preventDefault();
        event.stopPropagation();
        return event.deltaY < 0 ? '+' : '-';
      }),

      share()
    );

    const pinchIn = fromEvent(hammertime, 'pinchin').pipe(
      auditTime(150),
      share()
    );

    const pinchOut = fromEvent(hammertime, 'pinchout').pipe(
      auditTime(150),
      share()
    );

    this.sub.add(
      pinchOut.subscribe((res) => {
        this.zoomCtrl('+');
      })
    );

    this.sub.add(
      pinchIn.subscribe((res) => {
        this.zoomCtrl('-');
      })
    );

    this.sub.add(
      wheelEvent.subscribe((res) => {
        this.zoomCtrl(res);
      })
    );
  }

  zoomCtrl(val) {
    const obj = { speedValue: null, time: 0 };
    const multiplier = 1.5;
    if (val === '+') {
      obj.speedValue = 0.007 * multiplier;
    }
    if (val === '-') {
      obj.speedValue = -0.007 * multiplier;
    }

    const animation = gsap.timeline();
    animation.to(obj, {
      time: 1,
      onUpdate: () => {
        this.controls.zoom(obj.speedValue, false);
      },
    });
  }

  initListeners() {
    this.listeners = [
      {
        eventTarget: window,
        eventName: 'resize',
        eventFunction: () => this.onResize(),
      },
      {
        eventTarget: this.controls,
        eventName: 'sleep',
        eventFunction: () => this.onControlsEnd(),
      },
      {
        eventTarget: this.controls,
        eventName: 'change',
        eventFunction: () => this.onControlsUpdate(),
      },
      {
        eventTarget: this.controls,
        eventName: 'update',
        eventFunction: () => this.onControlsUpdate(),
      },
      {
        eventTarget: this.controls,
        eventName: 'end',
        eventFunction: () => this.onControlsEnd(),
      },
    ];

    this.listeners.forEach((listener) => {
      listener.eventTarget.addEventListener(
        listener.eventName,
        listener.eventFunction
      );
    });
  }

  onControlsUpdate() {
    this.state.renderingStatus.next(true);
  }

  onControlsEnd() {
    this.state.renderingStatus.next(false);
  }

  removeListeners() {
    this.listeners.forEach((listener) => {
      listener.eventTarget.removeEventListener(
        listener.eventName,
        listener.eventFunction
      );
    });
  }

  pauseRendering() {
    gsap.ticker.remove(this.render);
  }

  startRendering() {
    gsap.ticker.add(this.render, false, true);
  }

  onResize(w?: number, h?: number) {
    const width = w ? w : this.settings.container.clientWidth;
    const height = h ? h : this.settings.container.clientHeight;

    this.renderer.setSize(width, height);

    this.camera.aspect = width / height;

    this.camera.updateProjectionMatrix();
    this.update();
  }

  animate() {
    this.controls && this.controls.update(this.clock.getDelta());

    this.state.renderingStatus.value &&
      this.renderer.render(this.scene, this.camera);

    this.stats && this.stats.update();
  }

  update(time = 0.1) {
    const obj = {
      val: 0,
    };

    gsap.timeline().to(obj, {
      val: 1,
      duration: time,
      onStart: () => this.state.renderingStatus.next(true),
      onUpdate: () => this.state.renderingStatus.next(true),
      onComplete: () => this.state.renderingStatus.next(false),
    });
  }

  Model = class {
    engine: any;
    clock: Clock;
    tableLength: number;
    loader: any;
    dracoLoader: any;
    modelsArray: any;
    shadowMesh: any;
    group: any;
    tableLeg1: any;
    tableLeg2: any;
    tableTop: any;
    supports: {
      leg1: {
        prop01: { left: null; right: null };
        prop02: { left: null; right: null };
      };
      leg2: {
        prop01: { left: null; right: null };
        prop02: { left: null; right: null };
      };
    };
    constructor(engine) {
      this.engine = engine;
      this.clock = new Clock();
      this.tableLength = 1200;

      this.loader = new GLTFLoader(this.engine.loadingManager);
      this.dracoLoader = new DRACOLoader();
      this.loader.setDRACOLoader(this.dracoLoader);
    }

    loadGltf(file, decoders_path) {
      this.dracoLoader.setDecoderPath(`${decoders_path}draco/`);

      return new Promise((resolve, reject) => {
        this.loader.load(file, (scene) => {
          resolve(scene);
        });
      });
    }

    async load() {
      this.modelsArray = await Promise.all(
        this.engine.settings.models.table.assetsArray.map(async (obj) => {
          return await this.loadGltf(
            `${this.engine.settings.path_config.models_path}/${obj}`,
            this.engine.settings.path_config.decoders_path
          );
        })
      );
    }

    init() {
      this.setupModels(this.modelsArray);
    }

    setupShadow() {
      if (!this.engine.plm) {
        this.engine.setupPLM();
      }

      let shadowMeshGeometry = new PlaneGeometry(1, 1);

      const shadowMesh = new Mesh(
        shadowMeshGeometry,
        this.engine.shadowMaterial
      );

      shadowMesh.receiveShadow = true;
      shadowMesh.renderOrder = 3;
      shadowMesh.name = 'shadowMesh';
      shadowMesh.rotation.set(-Math.PI * 0.5, 0, 0);
      shadowMesh.scale.setScalar(this.engine.settings.plm.scale);

      this.engine.scene.add(shadowMesh);

      this.shadowMesh = shadowMesh;
      this.engine.models.shadowMesh = shadowMesh;

      this.engine.plm.configure(shadowMesh);

      this.engine.resetPLM();
    }

    setupModels(loadedModels) {
      if (!this.group) {
        this.group = new Group();
        this.engine.scene.add(this.group);
      }

      loadedModels.forEach((obj, i) => {
        this.group.add(obj.scene);
      });

      this.group.traverse((object) => {
        if (object.name === 'Cube007') {
          object.name = 'Leg1';
          this.tableLeg1 = object;
        }
      });

      this.tableLeg2 = this.tableLeg1.clone();
      this.tableLeg2.material = this.tableLeg1.material.clone();
      this.tableLeg2.name = 'Leg2';

      const tableTopGeometry = new BoxGeometry(1, 0.02, 1, 32, 1, 32);

      const uvAttribute = tableTopGeometry.attributes.uv;
      const positions = tableTopGeometry.attributes.position;
      const normals = tableTopGeometry.attributes.normal;

      for (let i = 0; i < uvAttribute.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        const nx = normals.getX(i);
        const ny = normals.getY(i);
        const nz = normals.getZ(i);

        if (Math.abs(ny) > 0.9) {
          const u = -z + 0.5;
          const v = x + 0.5;
          uvAttribute.setXY(i, u * 2, v * 2);
        } else {
          let u, v;

          if (Math.abs(nz) > 0.9) {
            u = (x + 0.5) * 2;
            v = y * 100 + 0.5;
          } else {
            u = (z + 0.5) * 2;
            v = y * 100 + 0.5;
          }
          uvAttribute.setXY(i, u, v);
        }
      }

      uvAttribute.needsUpdate = true;
      tableTopGeometry.computeVertexNormals();
      tableTopGeometry.computeTangents();

      const tableTopMaterial = new MeshPhysicalMaterial({
        color: new Color(0xffffff),
        metalness: 0,
        roughness: 0.5,
        normalScale: new Vector2(-1, -1),
        side: DoubleSide,
      });

      this.tableTop = new Mesh(tableTopGeometry, tableTopMaterial);
      this.tableTop.name = 'Table top';
      this.tableTop.castShadow = true;
      this.tableTop.receiveShadow = true;

      this.group.add(this.tableTop);
      this.group.add(this.tableLeg1);
      this.group.add(this.tableLeg2);

      this.supports = {
        leg1: {
          prop01: {
            left: null,
            right: null,
          },
          prop02: {
            left: null,
            right: null,
          },
        },
        leg2: {
          prop01: {
            left: null,
            right: null,
          },
          prop02: {
            left: null,
            right: null,
          },
        },
      };

      const originalProp01 = this.group.getObjectByName('prop_01');
      const originalProp02 = this.group.getObjectByName('prop_02');

      if (originalProp01 && originalProp02) {
        const cloneSupport = (original) => original.clone();

        this.supports.leg1.prop01.left = cloneSupport(originalProp01);
        this.supports.leg1.prop01.right = cloneSupport(originalProp01);
        this.supports.leg1.prop02.left = cloneSupport(originalProp02);
        this.supports.leg1.prop02.right = cloneSupport(originalProp02);

        this.supports.leg2.prop01.left = cloneSupport(originalProp01);
        this.supports.leg2.prop01.right = cloneSupport(originalProp01);
        this.supports.leg2.prop02.left = cloneSupport(originalProp02);
        this.supports.leg2.prop02.right = cloneSupport(originalProp02);

        originalProp01.parent?.remove(originalProp01);
        originalProp02.parent?.remove(originalProp02);

        this.tableLeg1.add(this.supports.leg1.prop01.left);
        this.tableLeg1.add(this.supports.leg1.prop01.right);
        this.tableLeg1.add(this.supports.leg1.prop02.left);
        this.tableLeg1.add(this.supports.leg1.prop02.right);

        this.tableLeg2.add(this.supports.leg2.prop01.left);
        this.tableLeg2.add(this.supports.leg2.prop01.right);
        this.tableLeg2.add(this.supports.leg2.prop02.left);
        this.tableLeg2.add(this.supports.leg2.prop02.right);

        const originalScrew = this.group.getObjectByName('Cube007_1');
        if (originalScrew) {
          const screwClone = originalScrew.clone();
          screwClone.position.z -= 0.03;
          this.tableLeg2.add(screwClone);

          screwClone.material = originalScrew.material;
          screwClone.morphTargetDictionary =
            originalScrew.morphTargetDictionary;
          screwClone.morphTargetInfluences = [
            ...originalScrew.morphTargetInfluences,
          ];
        } else {
          console.warn('Could not find Cube007_1 to clone');
        }
        this.setLegSupportType('prop_01');
      }

      this.updateTableLength(this.tableLength);

      this.setTableTopTexture('ashwood');
      this.updateTableTop();
      this.setupShadow();
    }

    updateTableLength(newLength: number) {
      this.tableLength = newLength / 1000;

      this.tableLeg2.position.z = this.tableLength;

      this.updateTableTop();
    }

    updateTableTop() {
      if (!this.tableLeg1 || !this.tableTop) return;
      const geometry1 = this.tableLeg1.geometry;
      const positions1 = geometry1.attributes.position.array;
      const morphTargets1 = geometry1.morphAttributes.position;
      const influences1 = this.tableLeg1.morphTargetInfluences;

      const geometry2 = this.tableLeg2.geometry;
      const positions2 = geometry2.attributes.position.array;
      const morphTargets2 = geometry2.morphAttributes.position;
      const influences2 = this.tableLeg2.morphTargetInfluences;

      let maxY = -Infinity;
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;

      for (let i = 0; i < positions1.length; i += 3) {
        let x = positions1[i];
        let y = positions1[i + 1];
        let z = positions1[i + 2];

        if (morphTargets1 && influences1) {
          for (let j = 0; j < morphTargets1.length; j++) {
            const morphVertex = morphTargets1[j].array;
            const influence = influences1[j];
            x += morphVertex[i] * influence;
            y += morphVertex[i + 1] * influence;
            z += morphVertex[i + 2] * influence;
          }
        }

        const vertex = new Vector3(x, y, z).applyMatrix4(
          this.tableLeg1.matrixWorld
        );

        maxY = Math.max(maxY, vertex.y);
        minX = Math.min(minX, vertex.x);
        maxX = Math.max(maxX, vertex.x);
        minZ = Math.min(minZ, vertex.z);
        maxZ = Math.max(maxZ, vertex.z);
      }

      for (let i = 0; i < positions2.length; i += 3) {
        let x = positions2[i];
        let y = positions2[i + 1];
        let z = positions2[i + 2];

        if (morphTargets2 && influences2) {
          for (let j = 0; j < morphTargets2.length; j++) {
            const morphVertex = morphTargets2[j].array;
            const influence = influences2[j];
            x += morphVertex[i] * influence;
            y += morphVertex[i + 1] * influence;
            z += morphVertex[i + 2] * influence;
          }
        }

        const vertex = new Vector3(x, y, z).applyMatrix4(
          this.tableLeg2.matrixWorld
        );

        maxY = Math.max(maxY, vertex.y);
        minX = Math.min(minX, vertex.x);
        maxX = Math.max(maxX, vertex.x);
        minZ = Math.min(minZ, vertex.z);
        maxZ = Math.max(maxZ, vertex.z);
      }

      const tableTopOffset = 0.0085;

      this.tableTop.position.y = maxY + tableTopOffset;
      this.tableTop.position.x = (minX + maxX) / 2;
      this.tableTop.position.z = this.tableLength / 2;

      const padding = 0.2;
      const newScaleX = Math.abs(maxX - minX) + padding;
      const newScaleZ = this.tableLength + padding;

      const tileSize = 0.5;

      const geometry = this.tableTop.geometry;
      const uvAttribute = geometry.attributes.uv;
      const positions = geometry.attributes.position;
      const normals = geometry.attributes.normal;

      for (let i = 0; i < uvAttribute.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        const nx = normals.getX(i);
        const ny = normals.getY(i);
        const nz = normals.getZ(i);

        if (Math.abs(ny) > 0.9) {
          const u = (-z * this.tableTop.scale.z) / tileSize;
          const v = (x * this.tableTop.scale.x) / tileSize;
          uvAttribute.setXY(i, u, v);
        } else {
          let u, v;
          if (Math.abs(nz) > 0.9) {
            u = (x * this.tableTop.scale.x) / tileSize;
            v = y * 100 + 0.5;
          } else {
            u = (z * this.tableTop.scale.z) / tileSize;
            v = y * 100 + 0.5;
          }
          uvAttribute.setXY(i, u, v);
        }
      }

      uvAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeTangents();

      this.tableTop.scale.x = newScaleX;
      this.tableTop.scale.z = newScaleZ;

      if (this.tableTop.material.map) {
        this.tableTop.material.map.needsUpdate = true;

        if (this.tableTop.material.normalMap) {
          this.tableTop.material.normalMap.needsUpdate = true;
        }
      }

      this.tableTop.updateMatrixWorld(true);
      this.tableLeg1.updateMatrixWorld(true);
      this.tableLeg2.updateMatrixWorld(true);

      [
        {
          leg: this.tableLeg1,
          supports: {
            prop01: this.supports.leg1.prop01,
            prop02: this.supports.leg1.prop02,
          },
        },
        {
          leg: this.tableLeg2,
          supports: {
            prop01: this.supports.leg2.prop01,
            prop02: this.supports.leg2.prop02,
          },
        },
      ].forEach(({ leg, supports }) => {
        const geometry = leg.geometry;
        const positions = geometry.attributes.position.array;
        const morphTargets = geometry.morphAttributes.position;
        const influences = leg.morphTargetInfluences;

        let minX = Infinity;
        let maxX = -Infinity;

        for (let i = 0; i < positions.length; i += 3) {
          let x = positions[i];

          if (morphTargets && influences) {
            for (let j = 0; j < morphTargets.length; j++) {
              const morphVertex = morphTargets[j].array;
              const influence = influences[j];
              x += morphVertex[i] * influence;
            }
          }

          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }

        const inset = 0.02;

        supports.prop01.left.position.x = minX + inset;
        supports.prop01.right.position.x = maxX - inset;

        supports.prop02.left.position.x = minX + inset;
        supports.prop02.right.position.x = maxX - inset;
      });

      this.engine.plm && this.engine.resetPLM();
      this.engine.update(10);
    }

    setLegSupportType(type: string) {
      this.engine.scene.traverse((object: Object3D) => {
        if (object.name === 'prop_01') {
          object.visible = type === 'prop_01';
        }
        if (object.name === 'prop_02') {
          object.visible = type === 'prop_02';
        }
      });
    }

    setTableTopTexture(textureName: string) {
      if (this.tableTop && this.tableTop.material) {
        const newTexture = this.engine.getTexture(textureName);
        const newTextureNrm = this.engine.getTexture(`${textureName}_nrm`);

        if (newTexture) {
          this.tableTop.material.map = newTexture;

          if (newTextureNrm) {
            this.tableTop.material.normalMap = newTextureNrm;
            this.tableTop.material.normalScale.set(-0.5, -0.5);
          }

          this.tableTop.material.needsUpdate = true;
        }
      }
    }
  };

  setupCameraControls(reInit?: boolean) {
    if (!reInit) {
      const subsetOfTHREE = {
        Vector2,
        Vector3,
        Vector4,
        Quaternion,
        Matrix4,
        Spherical,
        Box3,
        Sphere,
        Raycaster,
        MathUtils: {
          DEG2RAD: MathUtils.DEG2RAD,
          clamp: MathUtils.clamp,
        },
      };

      CameraControls.install({ THREE: subsetOfTHREE });
    }

    const none = CameraControls.ACTION.NONE;

    if (this.settings.container) {
      this.controls = new CameraControls(this.camera, this.settings.container);

      this.controls.mouseButtons.middle = none;
      this.controls.mouseButtons.wheel = none;
      this.controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
      this.controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
      this.controls.touches.two = CameraControls.ACTION.TOUCH_TRUCK;
      this.controls.touches.three = none;
      this.controls.restThreshold = 0.1;

      this.controls.minZoom = this.settings.controls.thirdPerson.minZoom;
      this.controls.maxZoom = this.settings.controls.thirdPerson.maxZoom;
      this.controls.smoothTime = this.settings.controls.thirdPerson.smoothTime;
      this.controls.draggingSmoothTime =
        this.settings.controls.thirdPerson.draggingSmoothTime;
      this.controls.azimuthRotateSpeed =
        this.settings.controls.thirdPerson.azimuthRotateSpeed;
      this.controls.polarRotateSpeed =
        this.settings.controls.thirdPerson.polarRotateSpeed;
      this.controls.maxPolarAngle =
        this.settings.controls.thirdPerson.maxPolarAngle;
      this.controls.minPolarAngle =
        this.settings.controls.thirdPerson.minPolarAngle;
      this.controls.minAzimuthAngle =
        this.settings.controls.thirdPerson.minAzimuthAngle;
      this.controls.maxAzimuthAngle =
        this.settings.controls.thirdPerson.maxAzimuthAngle;
      this.camera.near = this.settings.controls.thirdPerson.near;
      this.camera.updateProjectionMatrix();
      this.controls.normalizeRotations();
    }
  }
}
