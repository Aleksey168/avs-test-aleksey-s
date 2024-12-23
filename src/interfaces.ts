import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh } from 'three';
import CameraControls from 'camera-controls';

export interface LoadingState {
  isLoading: boolean;
  percent: number;
}

export interface ErrorState {
  isError: boolean;
  message: string | null;
}

export interface EngineType {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: CameraControls;
  mainModel: Group;
  state: {
    loading: {
      subscribe: (callback: (res: LoadingState) => void) => {
        add(arg0: { unsubscribe: () => void } | undefined): unknown;
        unsubscribe: () => void;
      };
    };
    errors: {
      subscribe: (callback: (res: ErrorState) => void) => {
        unsubscribe: () => void;
      };
    };
  };
  models: {
    updateTableLength: (length: number) => void;
    updateTableTop: () => void;
    setTableTopTexture: (texture: string) => void;
    setLegSupportType: (type: string) => void;
    shadowMesh?: Mesh;
  };
  settings: {
    container: HTMLElement | null;
    path_config: {
      models_path: string;
      decoders_path: string;
    };
    models: {
      table: {
        assetsArray: string[];
      };
    };
  };
  init: () => void;
  update: () => void;
  onResize: () => void;
  centerCam: () => void;
}

// Component Props and State
export interface SceneComponentProps {}

export interface SceneComponentState {
  loading: {
    isLoading: boolean;
    percent: number;
  };
  errors: {
    isError: boolean;
    message: string | null;
  };
  menuState: {
    morphTargets: boolean;
    tableTop: boolean;
    legSupport: boolean;
  };
  morphTargets: {
    tableLength: number;
    length: number;
    height: number;
  };
  tempMorphTargets: {
    tableLength: number;
    length: number;
    height: number;
  };
  textureType: string;
  legSupportType: string;
  autoCenterCamera: boolean;
}

// Styled Component Props
export interface ProgressBarProps {
  $percent: number;
}

export interface MenuHeaderProps {
  $isOpen?: boolean;
}

export interface MenuVariantContainerProps {
  $row?: boolean;
}

export interface MenuContentProps {
  $isOpen?: boolean;
}

export interface StyledCheckboxProps {
  checked?: boolean;
}

export interface CheckIconProps {
  checked?: boolean;
  viewBox?: string;
}

export interface LegSupportButtonProps {
  $isSelected?: boolean;
}

export interface ChevronIconProps {
  $isOpen?: boolean;
  viewBox?: string;
}

export interface TextureOptionProps {
  $isSelected: boolean;
}

export interface ControlProps {
  $isOpen?: boolean;
  $isSelected?: boolean;
  $row?: boolean;
  checked?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}
