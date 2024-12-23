import React from 'react';
import * as ReactDOM from 'react-dom/client';
import styled from 'styled-components';
import { StyleSheetManager } from 'styled-components';
import { Engine } from './engine';
import { debounce } from 'lodash';
import {
  SceneComponentProps,
  SceneComponentState,
  ProgressBarProps,
  MenuHeaderProps,
  MenuVariantContainerProps,
  MenuContentProps,
  StyledCheckboxProps,
  CheckIconProps,
  LegSupportButtonProps,
  ChevronIconProps,
  TextureOptionProps,
  EngineType,
} from './interfaces';

const OuterWrapper = styled.div`
  width: 100%;
  height: 100dvh;
  padding: 1em;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 767px) {
    padding: 0;
  }
`;

const SceneWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row-reverse;
  min-width: 0;
  gap: 1em;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 0;
  }
`;

const Scene = styled.div`
  flex: 1 1 0%;
  height: 100%;
  margin: 0;
  padding: 0;
  min-width: 0;

  @media (max-width: 767px) {
    height: 50vh;
    width: 100%;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  flex-direction: column;
`;

const ProgressBarWrapper = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
`;

const ProgressBar = styled.div<ProgressBarProps>`
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2px;
  transition: width 0.3s ease-in-out;
  width: ${(props) => props.$percent ?? 0}%;
`;

const ErrorsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  background: rgba(26, 26, 26, 0.95);
  color: white;
  padding: 20px;
  text-align: center;
`;

const MenuWrapper = styled.div`
  background: #ffffff;
  color: #333333;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;

  @media (min-width: 768px) {
    width: 400px;
    height: 100%;
    margin: 0;
    max-height: 100%;
    overflow-y: auto;
  }

  @media (max-width: 767px) {
    width: 100%;
    height: 50vh;
    border-radius: 8px 8px 0 0;
    overflow-y: auto;
    order: 1;
  }
`;

const MenuSection = styled.div`
  margin-bottom: 12px;
`;

const MenuHeader = styled.div<MenuHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  cursor: pointer;
  border-radius: ${(props) => (props.$isOpen ? '4px 4px 0 0' : '4px')};
  background: #f5f5f5;
  font-weight: 600;

  &:hover {
    background: #eeeeee;
  }
`;

const MenuVariantContainer = styled.div<MenuVariantContainerProps>`
  display: flex;
  flex-direction: ${(props) => (props.$row ? 'row' : 'column')};
  gap: 8px;
  margin: 12px 0;
`;

const MenuContent = styled.div<MenuContentProps>`
  padding: 8px;
  display: ${(props) => (props.$isOpen ? 'block' : 'none')};
  background: #f5f5f5;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
`;

const SliderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Slider = styled.input`
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  appearance: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #2196f3;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #2196f3;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  &::-ms-thumb {
    width: 12px;
    height: 12px;
    background: #2196f3;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const SliderInput = styled.input`
  width: 35px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #333333;
  padding: 4px;
  border-radius: 4px;
  text-align: center;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

const ChevronIcon = styled.svg<ChevronIconProps>`
  width: 12px;
  height: 12px;
  transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transform 0.3s ease;
`;

const TextureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  padding: 8px;
`;

const TextureOption = styled.div<TextureOptionProps>`
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 2px solid ${(props) => (props.$isSelected ? '#2196f3' : '#e0e0e0')};
  transition: border-color 0.2s ease;
  border-radius: 50%;
  width: 50px;
  height: 50px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const CheckboxWrapper = styled.div`
  width: 45px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledCheckbox = styled.div<StyledCheckboxProps>`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.checked ? '#2196f3' : '#e0e0e0')};
  border-radius: 4px;
  transition: all 150ms;

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 2px #2196f333;
  }

  &:hover {
    background: ${(props) => (props.checked ? '#2196f3' : '#d0d0d0')};
  }
`;

const CheckIcon = styled.svg<CheckIconProps>`
  fill: none;
  stroke: white;
  stroke-width: 2px;
  width: 16px;
  height: 16px;
  visibility: ${(props) => (props.checked ? 'visible' : 'hidden')};
`;

const LegSupportButton = styled.button<LegSupportButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$isSelected ? '#2196f3' : '#ffffff')};
  border: 2px solid ${(props) => (props.$isSelected ? '#2196f3' : '#e0e0e0')};
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 16px;
  min-width: fit-content;
  flex: 1;
  transition: all 0.2s ease;
  color: ${(props) => (props.$isSelected ? '#ffffff' : '#333333')};
  font-size: 16px;
  font-weight: 500;

  &:hover {
    background: ${(props) => (props.$isSelected ? '#1976d2' : '#f5f5f5')};
    border-color: ${(props) => (props.$isSelected ? '#1976d2' : '#d0d0d0')};
  }

  &:active {
    background: ${(props) => (props.$isSelected ? '#1565c0' : '#eeeeee')};
    border-color: ${(props) => (props.$isSelected ? '#1565c0' : '#c0c0c0')};
  }
`;

const LegSupportGrid = styled.div`
  display: inline-flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
`;

const MenuText = styled.span`
  font-size: 16px;
`;

export class SceneComponent extends React.Component<
  SceneComponentProps,
  SceneComponentState
> {
  private static instance: SceneComponent | null = null;
  private sceneRef: React.RefObject<HTMLDivElement | null>;
  private engineRef: React.RefObject<EngineType | null>;
  private subscription: any;

  // GUI display ranges
  private readonly GUI_LENGTH_MIN = 300;
  private readonly GUI_LENGTH_MAX = 900;
  private readonly GUI_HEIGHT_MIN = 500;
  private readonly GUI_HEIGHT_MAX = 1200;
  private readonly MORPH_MAX = 0.3;

  private readonly textureOptions = [
    { id: 'ashwood', label: 'Ashwood' },
    { id: 'cedar', label: 'Cedar' },
    { id: 'plastic_black', label: 'Plastic Black' },
    { id: 'plastic_white', label: 'Plastic White' },
    { id: 'walnut', label: 'Walnut' },
  ];

  constructor(props: SceneComponentProps) {
    super(props);
    this.sceneRef = React.createRef();
    this.engineRef = React.createRef();

    if (SceneComponent.instance) {
      return SceneComponent.instance;
    }

    SceneComponent.instance = this;

    this.state = {
      loading: {
        isLoading: true,
        percent: 0,
      },
      errors: {
        isError: false,
        message: null,
      },
      menuState: {
        morphTargets: false,
        tableTop: true,
        legSupport: false,
      },
      morphTargets: {
        tableLength: 1200,
        length: 300,
        height: 500,
      },
      tempMorphTargets: {
        tableLength: 1200,
        length: 300,
        height: 500,
      },
      textureType: 'ashwood',
      legSupportType: 'prop_01',
      autoCenterCamera: true,
    };
  }

  static getInstance(props: SceneComponentProps): SceneComponent {
    if (!SceneComponent.instance) {
      SceneComponent.instance = new SceneComponent(props);
    }
    return SceneComponent.instance;
  }

  static getEngineInstance() {
    return Engine.getInstance();
  }

  componentDidMount() {
    if (this.sceneRef.current) {
      const engine = Engine.getInstance();
      this.engineRef.current = engine;
      if (engine) {
        //@ts-ignore
        engine.settings.container = this.sceneRef.current;
        //@ts-ignore
        engine.init();
      }
    }

    this.subscription = this.engineRef.current?.state.loading.subscribe(
      (res) => {
        this.setState({ loading: res });
        if (!res.isLoading) {
          setTimeout(() => {
            this.engineRef.current?.onResize();
          }, 0);
        }
      }
    );

    this.subscription?.add(
      //@ts-ignore
      this.engineRef.current?.state.errors.subscribe((res) =>
        this.setState({ errors: res })
      )
    );
  }

  componentWillUnmount() {
    this.subscription?.unsubscribe();
  }

  private lengthToMorphInfluence = (displayMm: number): number => {
    return (
      ((displayMm - this.GUI_LENGTH_MIN) /
        (this.GUI_LENGTH_MAX - this.GUI_LENGTH_MIN)) *
      this.MORPH_MAX
    );
  };

  private heightToMorphInfluence = (displayMm: number): number => {
    return (
      ((displayMm - this.GUI_HEIGHT_MIN) /
        (this.GUI_HEIGHT_MAX - this.GUI_HEIGHT_MIN)) *
      this.MORPH_MAX
    );
  };

  private handleMorphTargetChange = (
    type: 'tableLength' | 'length' | 'height',
    value: number
  ) => {
    const numValue = Math.min(
      Math.max(
        Number(value) ||
          (type === 'tableLength'
            ? 1200
            : type === 'length'
              ? this.GUI_LENGTH_MIN
              : this.GUI_HEIGHT_MIN),
        type === 'tableLength'
          ? 1200
          : type === 'length'
            ? this.GUI_LENGTH_MIN
            : this.GUI_HEIGHT_MIN
      ),
      type === 'tableLength'
        ? 2400
        : type === 'length'
          ? this.GUI_LENGTH_MAX
          : this.GUI_HEIGHT_MAX
    );

    if (this.state.morphTargets[type] === numValue) return;

    this.setState(
      (prevState) => ({
        morphTargets: { ...prevState.morphTargets, [type]: numValue },
        tempMorphTargets: { ...prevState.tempMorphTargets, [type]: numValue },
      }),
      () => {
        if (type === 'tableLength') {
          this.engineRef.current?.models.updateTableLength(numValue);
          this.engineRef.current?.update();
          if (this.state.autoCenterCamera) {
            this.engineRef.current?.centerCam();
          }
          return;
        }

        const morphValue =
          type === 'length'
            ? this.lengthToMorphInfluence(numValue)
            : this.heightToMorphInfluence(numValue);

        const objectsToMorph = ['Leg1', 'Leg2', 'Cube007_1'];

        this.engineRef.current?.scene.traverse((node: any) => {
          if (
            objectsToMorph.includes(node.name) &&
            node.morphTargetDictionary
          ) {
            const targetIndex =
              type === 'length'
                ? node.morphTargetDictionary['length']
                : node.morphTargetDictionary['height'] ||
                  node.morphTargetDictionary['heigh'];

            if (targetIndex !== undefined) {
              node.morphTargetInfluences[targetIndex] = morphValue;
            }
          }
        });

        this.engineRef.current?.models.updateTableTop();
        if (this.state.autoCenterCamera) {
          this.engineRef.current?.centerCam();
        }
      }
    );
  };

  private handleTableLengthChange = (value: number) => {
    this.handleMorphTargetChange('tableLength', value);
  };

  private handleTextureChange = (value: string) => {
    this.setState({ textureType: value }, () => {
      this.engineRef.current?.models.setTableTopTexture(value);
      this.engineRef.current?.update();
    });
  };

  private handleLegSupportChange = (value: string) => {
    this.setState({ legSupportType: value }, () => {
      this.engineRef.current?.models.setLegSupportType(value);
      this.engineRef.current?.update();
    });
  };

  private debouncedMorphTargetChange = debounce(
    (type: 'tableLength' | 'length' | 'height', value: number) => {
      if (type === 'tableLength') {
        this.handleTableLengthChange(value);
      } else {
        this.handleMorphTargetChange(type, value);
      }
    },
    300
  );

  private handleInputChange = (
    type: 'tableLength' | 'length' | 'height',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    this.setState(
      (prevState) => ({
        tempMorphTargets: { ...prevState.tempMorphTargets, [type]: value },
      }),
      () => {
        this.debouncedMorphTargetChange(type, value);
      }
    );
  };

  private toggleMenuSection = (section: keyof typeof this.state.menuState) => {
    this.setState((prevState) => ({
      menuState: {
        ...prevState.menuState,
        [section]: !prevState.menuState[section],
      },
    }));
  };

  render() {
    const {
      loading,
      errors,
      menuState,
      morphTargets,
      tempMorphTargets,
      textureType,
      legSupportType,
      autoCenterCamera,
    } = this.state;

    return (
      <OuterWrapper>
        <SceneWrapper>
          {!loading.isLoading && (
            <MenuWrapper>
              <MenuSection>
                <MenuHeader
                  $isOpen={menuState.tableTop}
                  onClick={() => this.toggleMenuSection('tableTop')}
                >
                  <span>Материал верха</span>
                  <ChevronIcon $isOpen={menuState.tableTop} viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                  </ChevronIcon>
                </MenuHeader>
                <MenuContent $isOpen={menuState.tableTop}>
                  <TextureGrid>
                    {this.textureOptions.map((texture) => (
                      <TextureOption
                        key={texture.id}
                        $isSelected={textureType === texture.id}
                        onClick={() => this.handleTextureChange(texture.id)}
                      >
                        <img
                          src={`/thumbnails/${texture.id}.webp`}
                          alt={texture.label}
                        />
                      </TextureOption>
                    ))}
                  </TextureGrid>
                </MenuContent>
              </MenuSection>

              <MenuSection>
                <MenuHeader
                  $isOpen={menuState.morphTargets}
                  onClick={() => this.toggleMenuSection('morphTargets')}
                >
                  <span>Размеры</span>
                  <ChevronIcon
                    $isOpen={menuState.morphTargets}
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                  </ChevronIcon>
                </MenuHeader>
                <MenuContent $isOpen={menuState.morphTargets}>
                  <MenuVariantContainer>
                    <MenuText>Ширина А (мм)</MenuText>
                    <SliderControls>
                      <SliderInput
                        type="number"
                        min={1200}
                        max={2400}
                        step={1}
                        value={tempMorphTargets.tableLength}
                        onChange={(e) =>
                          this.handleInputChange('tableLength', e)
                        }
                      />
                      <Slider
                        type="range"
                        min={1200}
                        max={2400}
                        step={1}
                        value={tempMorphTargets.tableLength}
                        onChange={(e) =>
                          this.setState((prevState) => ({
                            tempMorphTargets: {
                              ...prevState.tempMorphTargets,
                              tableLength: Number(e.target.value),
                            },
                          }))
                        }
                        onMouseUp={(e) =>
                          this.handleTableLengthChange(
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                        onTouchEnd={(e) =>
                          this.handleTableLengthChange(
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                      />
                    </SliderControls>
                  </MenuVariantContainer>

                  <MenuVariantContainer>
                    <MenuText>Глубина А (мм)</MenuText>
                    <SliderControls>
                      <SliderInput
                        type="number"
                        min={this.GUI_LENGTH_MIN}
                        max={this.GUI_LENGTH_MAX}
                        step={1}
                        value={tempMorphTargets.length}
                        onChange={(e) => this.handleInputChange('length', e)}
                      />
                      <Slider
                        type="range"
                        min={this.GUI_LENGTH_MIN}
                        max={this.GUI_LENGTH_MAX}
                        step={1}
                        value={tempMorphTargets.length}
                        onChange={(e) =>
                          this.setState((prevState) => ({
                            tempMorphTargets: {
                              ...prevState.tempMorphTargets,
                              length: Number(e.target.value),
                            },
                          }))
                        }
                        onMouseUp={(e) =>
                          this.handleMorphTargetChange(
                            'length',
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                        onTouchEnd={(e) =>
                          this.handleMorphTargetChange(
                            'length',
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                      />
                    </SliderControls>
                  </MenuVariantContainer>

                  <MenuVariantContainer>
                    <MenuText>Высота ножек (мм)</MenuText>
                    <SliderControls>
                      <SliderInput
                        type="number"
                        min={this.GUI_HEIGHT_MIN}
                        max={this.GUI_HEIGHT_MAX}
                        step={1}
                        value={tempMorphTargets.height}
                        onChange={(e) => this.handleInputChange('height', e)}
                      />
                      <Slider
                        type="range"
                        min={this.GUI_HEIGHT_MIN}
                        max={this.GUI_HEIGHT_MAX}
                        step={1}
                        value={tempMorphTargets.height}
                        onChange={(e) =>
                          this.setState((prevState) => ({
                            tempMorphTargets: {
                              ...prevState.tempMorphTargets,
                              height: Number(e.target.value),
                            },
                          }))
                        }
                        onMouseUp={(e) =>
                          this.handleMorphTargetChange(
                            'height',
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                        onTouchEnd={(e) =>
                          this.handleMorphTargetChange(
                            'height',
                            Number((e.target as HTMLInputElement).value)
                          )
                        }
                      />
                    </SliderControls>
                  </MenuVariantContainer>

                  <MenuVariantContainer style={{ marginTop: '16px' }}>
                    <CheckboxContainer>
                      <HiddenCheckbox
                        checked={autoCenterCamera}
                        onChange={(e) =>
                          this.setState({ autoCenterCamera: e.target.checked })
                        }
                      />
                      <CheckboxWrapper>
                        <StyledCheckbox checked={autoCenterCamera}>
                          <CheckIcon
                            viewBox="0 0 24 24"
                            checked={autoCenterCamera}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </CheckIcon>
                        </StyledCheckbox>
                      </CheckboxWrapper>
                      <MenuText>Центрировать камеру</MenuText>
                    </CheckboxContainer>
                  </MenuVariantContainer>
                </MenuContent>
              </MenuSection>

              <MenuSection>
                <MenuHeader
                  $isOpen={menuState.legSupport}
                  onClick={() => this.toggleMenuSection('legSupport')}
                >
                  <span>Опоры</span>
                  <ChevronIcon
                    $isOpen={menuState.legSupport}
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                  </ChevronIcon>
                </MenuHeader>
                <MenuContent $isOpen={menuState.legSupport}>
                  <LegSupportGrid>
                    {[
                      { id: 'prop_01', label: 'Вариант 1' },
                      { id: 'prop_02', label: 'Вариант 2' },
                    ].map((prop) => (
                      <LegSupportButton
                        key={prop.id}
                        $isSelected={legSupportType === prop.id}
                        onClick={() => this.handleLegSupportChange(prop.id)}
                      >
                        {prop.label}
                      </LegSupportButton>
                    ))}
                  </LegSupportGrid>
                </MenuContent>
              </MenuSection>
            </MenuWrapper>
          )}

          <Scene ref={this.sceneRef} />

          {errors.isError && <ErrorsOverlay>{errors.message}</ErrorsOverlay>}

          {loading.isLoading && (
            <Overlay>
              <ProgressBarWrapper>
                <ProgressBar $percent={loading.percent} />
              </ProgressBarWrapper>
            </Overlay>
          )}
        </SceneWrapper>
      </OuterWrapper>
    );
  }
}

// Web Component wrapper
class SceneWebComponent extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement('div');
    mountPoint.id = 'root';

    const styleSheet = document.createElement('style');
    styleSheet.id = 'styled-components';

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(styleSheet);
    shadowRoot.appendChild(mountPoint);

    ReactDOM.createRoot(mountPoint).render(
      <StyleSheetManager target={styleSheet}>
        <SceneComponent />
      </StyleSheetManager>
    );
  }

  disconnectedCallback() {
    const mountPoint = this.shadowRoot?.querySelector('#root');
    if (mountPoint) {
      ReactDOM.createRoot(mountPoint).unmount();
    }
  }
}

customElements.define('scene-web-component', SceneWebComponent);
