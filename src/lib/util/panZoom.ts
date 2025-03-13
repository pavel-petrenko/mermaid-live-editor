import type { State } from '$/types';
import type { Point } from 'mermaid/dist/types.js';
import panzoom from 'svg-pan-zoom';
type PanZoom = typeof panzoom;

export class PanZoomState {
  private pan?: Point;
  private zoom?: number;
  private pzoom: PanZoom | undefined;
  private isDirty = false;
  private resizeObserver: ResizeObserver;

  public isPanEnabled: boolean;
  public onPanZoomChange?: (pan: Point, zoom: number) => void;

  constructor() {
    this.isPanEnabled = true;
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      if (!this.isDirty) {
        this.reset();
      }
    });
  }

  public updateElement(diagramView: SVGElement, { pan, zoom }: Pick<State, 'pan' | 'zoom'>) {
    this.pzoom = panzoom(diagramView, {
      onPan: (pan) => {
        this.pan = pan;
        this.zoom = this.pzoom?.getZoom();
        this.isDirty = true;
        if (this.zoom) {
          this.onPanZoomChange?.(this.pan, this.zoom);
        }
      },
      onZoom: (zoom) => {
        this.zoom = zoom;
        this.pan = this.pzoom?.getPan();
        this.isDirty = true;
        if (this.pan) {
          this.onPanZoomChange?.(this.pan, this.zoom);
        }
      },
      controlIconsEnabled: false,
      panEnabled: true,
      zoomEnabled: true,
      fit: true,
      center: true,
      maxZoom: 12,
      minZoom: 0.2
    });

    this.pzoom.disableDblClickZoom();

    this.resizeObserver.disconnect();
    this.resizeObserver.observe(diagramView);

    // TODO: Investigate why this is necessary
    if (pan !== undefined && zoom !== undefined && Number.isFinite(zoom)) {
      this.restorePanZoom(pan, zoom);
    }

    // we start out with both pan and zoom enabled so that the tool can auto position view refreshed
    // then set enable/disable pan based on state
    if (this.isPanEnabled) {
      this.pzoom.enablePan();
      this.pzoom.enableZoom();
    } else {
      this.pzoom.disableZoom();
      this.pzoom.disablePan();
    }

    if (pan === undefined && zoom === undefined) {
      this.reset();
    }
  }

  public restorePanZoom(pan: Point, zoom: number) {
    if (!this.pzoom) {
      console.error('PanZoomState.restorePanZoom: pzoom is not initialized');
      return;
    }
    this.pzoom.zoom(zoom);
    this.pzoom.pan(pan);
  }

  public resize() {
    this.pzoom?.resize();
  }

  public zoomIn() {
    this.pzoom?.zoomIn();
  }

  public zoomOut() {
    this.pzoom?.zoomOut();
  }

  public reset() {
    this.pzoom?.reset();
    // Zoom out a bit to avoid overlap with the toolbar
    this.pzoom?.zoom(0.875);
    this.isDirty = false;
  }
}
